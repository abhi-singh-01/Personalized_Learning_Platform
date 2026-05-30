const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { JWT_SECRET } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    let token = null;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (typeof req.query.access_token === 'string' && req.query.access_token) {
      token = req.query.access_token;
    }

    if (!token) throw new AppError('Authentication required', 401);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new AppError('User not found', 401);

    if (user.isBlocked) {
      throw new AppError(`Account is blocked: ${user.blockedReason || 'Contact support'}`, 403);
    }

    const isMaterialStream =
      req.method === 'GET' && /\/materials\/[^/]+\/file(?:\?|$)/i.test(req.originalUrl || '');

    if (decoded.tokenId) {
      const sessionExists = user.activeSessions.some((s) => s.tokenId === decoded.tokenId);
      if (!sessionExists) {
        throw new AppError('Session expired. You may have been logged out from another device.', 401);
      }

      if (!isMaterialStream) {
        const session = user.activeSessions.find((s) => s.tokenId === decoded.tokenId);
        if (session) {
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (!session.lastActiveAt || new Date(session.lastActiveAt) < fiveMinAgo) {
            session.lastActiveAt = new Date();
            await user.save();
          }
        }
      }

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
