const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, try again later', data: null, error: null },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'AI rate limit exceeded, try again shortly', data: null, error: null },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Chat rate limit exceeded, slow down a bit', data: null, error: null },
});

// Global limiter to protect all API routes from abuse
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200, // 200 requests per minute per IP (tune as needed)
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, aiLimiter, chatLimiter, globalLimiter };