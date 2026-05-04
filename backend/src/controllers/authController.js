const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Setting = require('../models/Setting');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID } = require('../config/env');

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
  await user.save();

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
    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already registered', 400);

    const user = await User.create({
      name, email, password, role, authProvider: 'local',
      phone: phone || '', country: country || '', state: state || '', city: city || '',
      profileComplete: !!(phone && country && state && city),
    });

    const tokenId = generateTokenId();
    await registerSession(user, tokenId, req);
    const token = signToken(user._id, user.role, tokenId);

    sendResponse(res, 201, 'Registration successful', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profileComplete: user.profileComplete },
    });
  } catch (err) { next(err); }
};

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      throw new AppError('Invalid email or password', 401);

    // Check if user is blocked
    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }

    // Auto-migrate legacy roles
    if (user.role === 'teacher') user.role = 'educator';
    if (user.role === 'student') user.role = 'learner';

    const settings = await Setting.findOne();
    if (settings && settings.maintenanceMode && user.role !== 'admin') {
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

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Check if blocked
      if (user.isBlocked) {
        throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
      }

      // Auto-migrate legacy roles
      if (user.role === 'teacher') user.role = 'educator';
      if (user.role === 'student') user.role = 'learner';

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
        email,
        googleId,
        avatar: picture || '',
        role: selectedRole,
        authProvider: 'google',
      });
    }

    // Maintenance check
    const settings = await Setting.findOne();
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

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -activeSessions')
      .populate('enrolledCourses', 'title category thumbnail')
      .populate('assignedLearners', 'name email aiLevel engagementScore averageScore streak');
    sendResponse(res, 200, 'User profile', user);
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