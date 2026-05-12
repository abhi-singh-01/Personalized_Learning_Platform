const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { NODE_ENV } = require('./config/env');
const { isOriginAllowed } = require('./config/corsOrigins');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const maintenance = require('./middleware/maintenance');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const materialRoutes = require('./routes/materials');
const quizRoutes = require('./routes/quizzes');
const progressRoutes = require('./routes/progress');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

const adminRoutes = require('./routes/admin');
const scheduleRoutes = require('./routes/schedules');
const paymentRoutes = require('./routes/payments');

// New feature routes
const uiConfigRoutes = require('./routes/ui-config');
const featureFlagRoutes = require('./routes/feature-flags');
const liveClassRoutes = require('./routes/live-classes');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');
const auditLogRoutes = require('./routes/audit-logs');
const chatbotRoutes = require('./routes/chatbot');

const startPayoutCron = require('./services/payoutCron');
const startFailedPaymentRetentionCron = require('./services/failedPaymentRetentionCron');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://ui-avatars.com", "https://*.googleusercontent.com"],
      mediaSrc: ["'self'", "blob:", "http://localhost:5000"],
      frameSrc: [
        "'self'",
        'https://www.youtube.com',
        'https://youtube.com',
        'https://www.youtube-nocookie.com',
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
        'https://*.razorpay.com',
      ],
      connectSrc: [
        "'self'",
        'https://generativelanguage.googleapis.com',
        'https://accounts.google.com',
        'https://lumberjack.razorpay.com',
        'https://api.razorpay.com',
        'https://*.razorpay.com',
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS: FRONTEND_URL may be comma-separated; optional Vercel preview wildcard (see corsOrigins.js)
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Basic global rate limit for all API traffic
app.use('/api', globalLimiter);

// Root + health endpoints (useful for Render uptime checks)
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running 🚀',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Webhook endpoint needs raw body for HMAC signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  req.body = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Enforce Maintenance Mode (blocks non-admins dynamically)
app.use(maintenance);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// New feature routes
app.use('/api/ui-config', uiConfigRoutes);
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.use(errorHandler);

// Start payout cron job
startPayoutCron();
startFailedPaymentRetentionCron();

module.exports = app;