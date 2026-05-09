require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  PLATFORM_FEE_RATE: Number(process.env.PLATFORM_FEE_RATE || 0.02), // 2%
  PLATFORM_GST_RATE: Number(process.env.PLATFORM_GST_RATE || 0.18), // 18% on fee
  PAYOUT_DELAY_DAYS: Number(process.env.PAYOUT_DELAY_DAYS || 5), // 3-7 recommended
  DUMMY_PAYMENT: process.env.DUMMY_PAYMENT === 'true',
};