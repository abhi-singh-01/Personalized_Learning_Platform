const crypto = require('crypto');
const dns = require('dns');
const nodemailer = require('nodemailer');

const OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);
const RESEND_COOLDOWN_MS = 60 * 1000;
const SMTP_SEND_TIMEOUT_MS = Number(process.env.SMTP_SEND_TIMEOUT_MS || 12000);

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function isDateCoolingDown(date) {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < RESEND_COOLDOWN_MS;
}

function isOtpCoolingDown(user) {
  return isDateCoolingDown(user.emailOtpLastSentAt);
}

function isPasswordResetOtpCoolingDown(user) {
  return isDateCoolingDown(user.passwordResetOtpLastSentAt);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    connectionTimeout: SMTP_SEND_TIMEOUT_MS,
    greetingTimeout: SMTP_SEND_TIMEOUT_MS,
    socketTimeout: SMTP_SEND_TIMEOUT_MS,
    dnsLookup: (hostname, _options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });
}

async function sendOtpEmail({ to, name, otp, purpose = 'email_verification' }) {
  const transporter = getTransporter();
  const appName = process.env.APP_NAME || 'PLP';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  const isPasswordReset = purpose === 'password_reset';
  const heading = isPasswordReset ? 'Password reset verification' : 'Email verification';
  const subject = isPasswordReset ? `${appName} password reset code` : `${appName} email verification code`;

  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured');
    }
    console.log(`[Email OTP:${purpose}] ${to}: ${otp}`);
    return { sent: false, fallback: 'console' };
  }

  await withTimeout(
    transporter.sendMail({
      from,
      to,
      subject,
      text: `Hi ${name || 'there'},\n\nYour ${appName} verification code is ${otp}.\nIt expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2 style="margin:0 0 12px">${appName} ${heading}</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Your verification code is:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;border-radius:12px;padding:14px 18px;display:inline-block">${otp}</div>
          <p style="color:#6b7280;font-size:13px">This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        </div>
      `,
    }),
    SMTP_SEND_TIMEOUT_MS,
    'SMTP send'
  );

  return { sent: true };
}

async function deliverOtpEmail(payload, awaitDelivery) {
  if (!awaitDelivery) {
    sendOtpEmail(payload).catch((err) => {
      console.error('[Email OTP] Background send failed:', err.message);
    });
    return { sent: true, queued: true };
  }

  try {
    return await sendOtpEmail(payload);
  } catch (err) {
    console.error('[Email OTP] Send failed:', err.message);
    return { sent: false, error: err.message };
  }
}

async function issueEmailOtp(user, { awaitDelivery = true } = {}) {
  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.emailOtpLastSentAt = new Date();
  user.emailOtpAttempts = 0;
  await user.save();
  return deliverOtpEmail({ to: user.email, name: user.name, otp }, awaitDelivery);
}

async function issuePasswordResetOtp(user, { awaitDelivery = true } = {}) {
  const otp = generateOtp();
  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.passwordResetOtpLastSentAt = new Date();
  user.passwordResetOtpAttempts = 0;
  await user.save();
  return deliverOtpEmail(
    { to: user.email, name: user.name, otp, purpose: 'password_reset' },
    awaitDelivery
  );
}

module.exports = {
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_MS,
  generateOtp,
  hashOtp,
  isOtpCoolingDown,
  isPasswordResetOtpCoolingDown,
  issueEmailOtp,
  issuePasswordResetOtp,
};
