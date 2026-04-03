const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { JWT_SECRET } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      throw new AppError('Authentication required', 401);

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new AppError('User not found', 401);

    // Check if user is blocked
    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }

    // Validate that the session (tokenId) is still active
    if (decoded.tokenId) {
      const sessionExists = user.activeSessions.some(s => s.tokenId === decoded.tokenId);
      if (!sessionExists) {
        throw new AppError('Session expired. You may have been logged out from another device.', 401);
      }

      // Update lastActiveAt for this session (throttled — only every 5 minutes)
      const session = user.activeSessions.find(s => s.tokenId === decoded.tokenId);
      if (session) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!session.lastActiveAt || new Date(session.lastActiveAt) < fiveMinAgo) {
          session.lastActiveAt = new Date();
          await user.save();
        }
      }

      // Attach tokenId so logout/revoke endpoints can use it
      req.tokenId = decoded.tokenId;
    }


    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return next(new AppError('Invalid or expired token', 401));
    next(err);
  }
};

module.exports = auth;