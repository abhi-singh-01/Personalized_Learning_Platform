const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { getCachedSettings } = require('../utils/settingsCache');
const { JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID } = require('../config/env');
const {
  hashOtp,
  isOtpCoolingDown,
  isPasswordResetOtpCoolingDown,
  issueEmailOtp,
  issuePasswordResetOtp,
} = require('../services/emailOtpService');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate a unique session/token ID
const generateTokenId = () => crypto.randomBytes(16).toString('hex');

// Parse device info from User-Agent
const parseDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  if (/Mobile|Android/i.test(userAgent)) return 'Mobile';
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Macintosh|Mac OS/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux PC';
  return 'Browser';
};

// Sign JWT with embedded tokenId for session tracking
const signToken = (id, role, tokenId) =>
  jwt.sign({ id, role, tokenId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const normalizePortalRole = (role) => {
  if (role === 'teacher') return 'educator';
  if (role === 'student') return 'learner';
  if (role === 'educator' || role === 'learner') return role;
  return null;
};

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_GOOGLE_SIGNIN = 'Google sign-in failed. Please try again.';

const assertPortalRoleAccess = (user, requestedRole, options = {}) => {
  const { maskCrossPortalMismatch = false, googleAuth = false } = options;
  const userRole = normalizePortalRole(user.role);

  const crossPortalMismatch = () => {
    if (maskCrossPortalMismatch && user.role !== 'admin' && requestedRole !== 'admin') {
      throw new AppError(googleAuth ? INVALID_GOOGLE_SIGNIN : INVALID_CREDENTIALS, 401);
    }
  };

  if (requestedRole === 'admin') {
    if (user.role === 'admin') return;
    crossPortalMismatch();
    if (userRole === 'educator') {
      throw new AppError('This is an educator account. Please use the educator sign in page.', 403);
    }
    if (userRole === 'learner') {
      throw new AppError('This is a learner account. Please use the learner sign in page.', 403);
    }
    throw new AppError('Access denied. This login is for platform administrators only.', 403);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts must use the admin sign in page', 403);
  }

  const portalRole = normalizePortalRole(requestedRole);
  if (!portalRole) {
    throw new AppError('Sign-in portal role is required', 400);
  }

  if (userRole === portalRole) return;

  if (userRole === 'learner' && portalRole === 'educator') {
    crossPortalMismatch();
    throw new AppError('This is a learner account. Please sign in as a learner or switch to educator from your account.', 403);
  }

  if (userRole === 'educator' && portalRole === 'learner') {
    crossPortalMismatch();
    throw new AppError('This is an educator account. Please use the educator sign in page.', 403);
  }

  crossPortalMismatch();
  throw new AppError('This account cannot access the selected portal', 403);
};

const portalAuthOptions = (role, { googleAuth = false } = {}) => ({
  maskCrossPortalMismatch: role !== 'admin',
  googleAuth,
});

// Register a new device session, enforcing the device limit
const registerSession = async (user, tokenId, req) => {
  const deviceInfo = parseDeviceInfo(req.get('User-Agent'));
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  const maxDevices = user.maxDevices || 2;

  const session = {
    tokenId,
    deviceInfo,
    ipAddress,
    loginAt: new Date(),
    lastActiveAt: new Date(),
  };

  // If at or over limit, remove the oldest session (FIFO eviction)
  if (user.activeSessions.length >= maxDevices) {
    // Sort by lastActiveAt ascending (oldest first)
    user.activeSessions.sort((a, b) => new Date(a.lastActiveAt) - new Date(b.lastActiveAt));
    // Remove oldest sessions to make room
    const excess = user.activeSessions.length - maxDevices + 1;
    user.activeSessions.splice(0, excess);
  }

  user.activeSessions.push(session);
  user.lastLoginAt = new Date();
  user.lastLoginIP = ipAddress;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        activeSessions: user.activeSessions,
        lastLoginAt: user.lastLoginAt,
        lastLoginIP: user.lastLoginIP,
      },
    }
  );

  return session;
};

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['learner', 'educator']).withMessage('Role must be learner or educator'),
];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, country, state, city } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) throw new AppError('Email already registered', 400);

    const user = await User.create({
      name, email: normalizedEmail, password, role, authProvider: 'local',
      phone: phone || '', country: country || '', state: state || '', city: city || '',
      profileComplete: !!(phone && country && state && city),
      emailVerified: false,
    });

    const emailResult = await issueEmailOtp(user, { awaitDelivery: false });
    const message = emailResult?.queued
      ? 'Account created. Verification code is being sent to your email.'
      : emailResult?.sent === false
        ? 'Account created. We could not send the verification email — use Resend code on the sign-in page.'
        : 'Verification code sent to your email';

    sendResponse(res, 201, message, {
      verificationRequired: true,
      email: user.email,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profileComplete: user.profileComplete, emailVerified: false },
    });
  } catch (err) { next(err); }
};

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['learner', 'educator', 'admin']).withMessage('Role must be learner, educator, or admin'),
];

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password name email role avatar aiLevel authProvider isBlocked blockedReason emailVerified emailOtpHash emailOtpExpiresAt emailOtpLastSentAt activeSessions maxDevices'
    );

    const settingsPromise = getCachedSettings();
    const passwordValid = user ? await user.comparePassword(password) : false;

    if (!user || !passwordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }

    if (user.role === 'teacher') user.role = 'educator';
    if (user.role === 'student') user.role = 'learner';

    assertPortalRoleAccess(user, role, portalAuthOptions(role));

    if (user.authProvider === 'local' && user.emailVerified === false) {
      if (!isOtpCoolingDown(user)) {
        issueEmailOtp(user, { awaitDelivery: false });
      }
      throw new AppError('Please verify your email with the OTP sent to your inbox', 403);
    }

    const settings = await settingsPromise;
    if (settings?.maintenanceMode && user.role !== 'admin') {
      throw new AppError('Sorry for the inconvenience, the website is under maintenance.', 503);
    }

    const tokenId = generateTokenId();
    const session = await registerSession(user, tokenId, req);
    const token = signToken(user._id, user.role, tokenId);

    sendResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, aiLevel: user.aiLevel,
        authProvider: user.authProvider,
      },
      deviceInfo: session.deviceInfo,
    });
  } catch (err) { next(err); }
};

// ── Google Sign-In ──
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) throw new AppError('Google ID token is required', 400);
    if (!role || !['learner', 'educator', 'admin'].includes(role)) {
      throw new AppError('Sign-in portal role is required', 400);
    }

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified: emailVerified } = payload;
    if (!emailVerified) throw new AppError('Google account email is not verified', 403);

    const normalizedGoogleEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedGoogleEmail });

    if (user) {
      // Check if blocked
      if (user.isBlocked) {
        throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
      }

      // Auto-migrate legacy roles
      if (user.role === 'teacher') user.role = 'educator';
      if (user.role === 'student') user.role = 'learner';

      assertPortalRoleAccess(user, role, portalAuthOptions(role, { googleAuth: true }));

      // Existing user — update googleId if not set
      const needsSave = !user.googleId || user.isModified('role');
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        if (picture && !user.avatar) user.avatar = picture;
      }
      if (needsSave) await user.save();
    } else {
      // New user — role is required
      const selectedRole = role || 'learner';
      if (!['learner', 'educator'].includes(selectedRole)) {
        throw new AppError('Role must be learner or educator', 400);
      }

      user = await User.create({
        name,
        email: normalizedGoogleEmail,
        googleId,
        avatar: picture || '',
        role: selectedRole,
        authProvider: 'google',
        emailVerified: true,
      });
    }

    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    // Maintenance check
    const settings = await getCachedSettings();
    if (settings && settings.maintenanceMode && user.role !== 'admin') {
      throw new AppError('Sorry for the inconvenience, the website is under maintenance.', 503);
    }

    const tokenId = generateTokenId();
    const session = await registerSession(user, tokenId, req);
    const token = signToken(user._id, user.role, tokenId);

    sendResponse(res, 200, 'Google login successful', {
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, aiLevel: user.aiLevel,
        profileComplete: user.profileComplete || false,
        authProvider: user.authProvider,
      },
      deviceInfo: session.deviceInfo,
    });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return next(new AppError('Invalid or expired Google token', 401));
    }
    next(err);
  }
};

exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp) throw new AppError('Email and OTP are required', 400);
    if (!role || !['learner', 'educator', 'admin'].includes(role)) {
      throw new AppError('Sign-in portal role is required', 400);
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) throw new AppError('Invalid verification request', 400);
    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }
    assertPortalRoleAccess(user, role, portalAuthOptions(role));
    if (user.emailVerified) throw new AppError('Email already verified', 400);
    if (!user.emailOtpHash || !user.emailOtpExpiresAt) throw new AppError('Verification code has expired. Request a new code.', 400);
    if (new Date(user.emailOtpExpiresAt).getTime() < Date.now()) {
      throw new AppError('Verification code has expired. Request a new code.', 400);
    }
    if (user.emailOtpAttempts >= 5) {
      throw new AppError('Too many incorrect attempts. Request a new code.', 429);
    }

    if (hashOtp(otp) !== user.emailOtpHash) {
      user.emailOtpAttempts += 1;
      await user.save();
      throw new AppError('Invalid verification code', 400);
    }

    user.emailVerified = true;
    user.emailOtpHash = '';
    user.emailOtpExpiresAt = null;
    user.emailOtpLastSentAt = null;
    user.emailOtpAttempts = 0;

    const tokenId = generateTokenId();
    await registerSession(user, tokenId, req);
    const token = signToken(user._id, user.role, tokenId);

    sendResponse(res, 200, 'Email verified successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        aiLevel: user.aiLevel,
        profileComplete: user.profileComplete,
        authProvider: user.authProvider,
        emailVerified: true,
      },
    });
  } catch (err) { next(err); }
};

exports.resendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) throw new AppError('Invalid verification request', 400);
    if (user.emailVerified) throw new AppError('Email already verified', 400);
    if (isOtpCoolingDown(user)) throw new AppError('Please wait a minute before requesting another code', 429);

    const emailResult = await issueEmailOtp(user, { awaitDelivery: false });
    const message = emailResult?.queued
      ? 'Verification code is being sent to your email.'
      : 'Verification code sent';
    sendResponse(res, 200, message);
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      throw new AppError('No account found with this email', 404);
    }
    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }
    if (isPasswordResetOtpCoolingDown(user)) {
      throw new AppError('Please wait a minute before requesting another code', 429);
    }

    const emailResult = await issuePasswordResetOtp(user, { awaitDelivery: false });
    const message = emailResult?.queued
      ? 'Password reset code is being sent to your email.'
      : 'Password reset code sent to your email';
    sendResponse(res, 200, message);
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) throw new AppError('Email, OTP and new password are required', 400);
    if (String(password).length < 6) throw new AppError('Password must be at least 6 characters', 400);

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) throw new AppError('No account found with this email', 404);
    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }
    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw new AppError('Reset code has expired. Request a new code.', 400);
    }
    if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
      throw new AppError('Reset code has expired. Request a new code.', 400);
    }
    if (user.passwordResetOtpAttempts >= 5) {
      throw new AppError('Too many incorrect attempts. Request a new code.', 429);
    }
    if (hashOtp(otp) !== user.passwordResetOtpHash) {
      user.passwordResetOtpAttempts += 1;
      await user.save();
      throw new AppError('Invalid reset code', 400);
    }

    user.password = password;
    user.passwordResetOtpHash = '';
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpLastSentAt = null;
    user.passwordResetOtpAttempts = 0;
    user.activeSessions = [];
    await user.save();

    sendResponse(res, 200, 'Password set successfully. Please sign in again.');
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sensitiveFields = '-password -activeSessions -emailOtpHash -emailOtpExpiresAt -emailOtpLastSentAt -emailOtpAttempts -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetOtpLastSentAt -passwordResetOtpAttempts';

    const [user, pwdRow] = await Promise.all([
      User.findById(userId)
        .select(sensitiveFields)
        .populate('enrolledCourses', 'title category thumbnail')
        .populate('assignedLearners', 'name email aiLevel engagementScore averageScore streak'),
      User.findById(userId).select('password').lean(),
    ]);

    if (!user) throw new AppError('User not found', 404);

    const profile = user.toObject();
    profile.hasPassword = !!pwdRow?.password;
    sendResponse(res, 200, 'User profile', profile);
  } catch (err) { next(err); }
};

exports.completeProfile = async (req, res, next) => {
  try {
    const { phone, country, state, city } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) throw new AppError('Phone must be exactly 10 digits', 400);
    if (!country) throw new AppError('Country is required', 400);
    if (!state) throw new AppError('State is required', 400);
    if (!city) throw new AppError('City is required', 400);

    const user = await User.findByIdAndUpdate(req.user._id, {
      phone, country, state, city, profileComplete: true,
    }, { new: true }).select('-password -activeSessions');

    sendResponse(res, 200, 'Profile completed', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profileComplete: true },
    });
  } catch (err) { next(err); }
};

// ── Switch role (requires explicit confirmation + re-authentication) ──
exports.switchRole = async (req, res, next) => {
  try {
    const { targetRole, confirmSwitch, password, idToken } = req.body;

    // 1. Validate target role
    if (!targetRole || !['learner', 'educator'].includes(targetRole)) {
      throw new AppError('Invalid target role. Must be "learner" or "educator".', 400);
    }

    // 2. Fetch current user
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    // 3. Check if already that role
    if (user.role === targetRole) {
      throw new AppError(`You are already a ${targetRole}`, 400);
    }

    // 4. Admins cannot switch
    if (user.role === 'admin') {
      throw new AppError('Admin accounts cannot switch roles', 400);
    }

    // 5. Require explicit confirmation flag
    if (!confirmSwitch) {
      throw new AppError('Role switch requires explicit confirmation. Set confirmSwitch to true.', 400);
    }

    // 6. Re-authenticate: password for local users, Google token for Google users
    if (user.authProvider === 'google' && !user.password) {
      // Google-only user — verify Google idToken
      if (!idToken) {
        throw new AppError('Google re-authentication required to switch roles', 400);
      }
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload.email !== user.email) {
        throw new AppError('Google account does not match your account email', 401);
      }
      if (!payload.email_verified) {
        throw new AppError('Google account email is not verified', 403);
      }
    } else {
      // Local user (or Google user who also has a password) — verify password
      if (!password) {
        throw new AppError('Password required to confirm role switch', 400);
      }
      const valid = await user.comparePassword(password);
      if (!valid) {
        throw new AppError('Invalid password. Role switch denied.', 401);
      }
    }

    // 7. Perform the role switch
    user.role = targetRole;
    await user.save();

    // 8. Generate new token with updated role
    const tokenId = generateTokenId();
    await registerSession(user, tokenId, req);
    const token = signToken(user._id, user.role, tokenId);

    sendResponse(res, 200, `Role switched to ${targetRole}`, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return next(new AppError('Invalid or expired Google token', 401));
    }
    next(err);
  }
};

// ── Logout (remove session) ──
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    // Remove the current session
    user.activeSessions = user.activeSessions.filter(
      s => s.tokenId !== req.tokenId
    );
    await user.save();

    sendResponse(res, 200, 'Logged out successfully');
  } catch (err) { next(err); }
};

// ── Get active sessions (for profile page) ──
exports.getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('activeSessions maxDevices');
    sendResponse(res, 200, 'Active sessions', {
      sessions: user.activeSessions.map(s => ({
        id: s._id,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        loginAt: s.loginAt,
        lastActiveAt: s.lastActiveAt,
        isCurrent: s.tokenId === req.tokenId,
      })),
      maxDevices: user.maxDevices,
    });
  } catch (err) { next(err); }
};

// ── Revoke a specific session (kick a device) ──
exports.revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    user.activeSessions = user.activeSessions.filter(
      s => s._id.toString() !== sessionId
    );
    await user.save();

    sendResponse(res, 200, 'Session revoked');
  } catch (err) { next(err); }
};

// ── Revoke all other sessions (security measure) ──
exports.revokeAllOtherSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    user.activeSessions = user.activeSessions.filter(
      s => s.tokenId === req.tokenId
    );
    await user.save();

    sendResponse(res, 200, 'All other sessions revoked');
  } catch (err) { next(err); }
};