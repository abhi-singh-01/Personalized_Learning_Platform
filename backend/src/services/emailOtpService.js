const crypto = require('crypto');
const dns = require('dns');
const nodemailer = require('nodemailer');

const OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);
const RESEND_COOLDOWN_MS = 60 * 1000;
const SMTP_SEND_TIMEOUT_MS = Number(process.env.SMTP_SEND_TIMEOUT_MS || 20000);
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

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

function parseFromAddress(fromRaw) {
  const from = String(fromRaw || '').trim();
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim() };
  }
  return { name: process.env.APP_NAME || 'PLP', email: from };
}

function buildOtpEmailContent({ name, otp, purpose = 'email_verification' }) {
  const appName = process.env.APP_NAME || 'PLP';
  const isPasswordReset = purpose === 'password_reset';
  const heading = isPasswordReset ? 'Password reset verification' : 'Email verification';
  const subject = isPasswordReset ? `${appName} password reset code` : `${appName} email verification code`;
  const text = `Hi ${name || 'there'},\n\nYour ${appName} verification code is ${otp}.\nIt expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">${appName} ${heading}</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your verification code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;border-radius:12px;padding:14px 18px;display:inline-block">${otp}</div>
      <p style="color:#6b7280;font-size:13px">This code expires in ${OTP_TTL_MINUTES} minutes.</p>
    </div>
  `;
  return { subject, text, html };
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user, pass },
    requireTLS: !SMTP_SECURE && SMTP_PORT === 587,
    connectionTimeout: SMTP_SEND_TIMEOUT_MS,
    greetingTimeout: SMTP_SEND_TIMEOUT_MS,
    socketTimeout: SMTP_SEND_TIMEOUT_MS,
    dnsLookup: (hostname, _options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });
}

let cachedTransporter = null;

function getCachedTransporter() {
  if (cachedTransporter === null) {
    cachedTransporter = getTransporter() || false;
  }
  return cachedTransporter || null;
}

function isEmailConfigured() {
  return Boolean(BREVO_API_KEY || getCachedTransporter());
}

async function sendViaBrevoApi({ to, name, subject, text, html }) {
  const fromRaw = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  const sender = parseFromAddress(fromRaw);

  const response = await withTimeout(
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to, name: name || to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    }),
    SMTP_SEND_TIMEOUT_MS,
    'Brevo API send'
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo API ${response.status}: ${body.slice(0, 200) || response.statusText}`);
  }

  return { sent: true, provider: 'brevo-api' };
}

async function sendViaSmtp({ to, name, subject, text, html }) {
  const transporter = getCachedTransporter();
  if (!transporter) {
    throw new Error('SMTP is not configured');
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

  await withTimeout(
    transporter.sendMail({ from, to, subject, text, html }),
    SMTP_SEND_TIMEOUT_MS,
    'SMTP send'
  );

  return { sent: true, provider: 'smtp' };
}

async function sendOtpEmail({ to, name, otp, purpose = 'email_verification' }) {
  const { subject, text, html } = buildOtpEmailContent({ name, otp, purpose });

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured');
    }
    console.log(`[Email OTP:${purpose}] ${to}: ${otp}`);
    return { sent: false, fallback: 'console' };
  }

  if (BREVO_API_KEY) {
    return sendViaBrevoApi({ to, name, subject, text, html });
  }

  return sendViaSmtp({ to, name, subject, text, html });
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

async function issueEmailOtp(user, { awaitDelivery = false } = {}) {
  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.emailOtpLastSentAt = new Date();
  user.emailOtpAttempts = 0;
  await user.save();
  return deliverOtpEmail({ to: user.email, name: user.name, otp }, awaitDelivery);
}

async function issuePasswordResetOtp(user, { awaitDelivery = false } = {}) {
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

async function verifySmtpOnStartup() {
  if (BREVO_API_KEY) {
    try {
      const response = await withTimeout(
        fetch('https://api.brevo.com/v3/account', {
          headers: { accept: 'application/json', 'api-key': BREVO_API_KEY },
        }),
        SMTP_SEND_TIMEOUT_MS,
        'Brevo API verify'
      );
      if (response.ok) {
        console.log('[Email OTP] Brevo API ready (HTTPS — recommended on Render)');
        return;
      }
      const body = await response.text().catch(() => '');
      console.error('[Email OTP] Brevo API verify failed:', response.status, body.slice(0, 160));
    } catch (err) {
      console.error('[Email OTP] Brevo API verify failed:', err.message);
    }
    console.error('[Email OTP] Set BREVO_API_KEY from Brevo → SMTP & API → API Keys (xkeysib-...)');
    return;
  }

  const transporter = getCachedTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Email OTP] Email not configured — set BREVO_API_KEY (recommended) or SMTP_* on Render.');
    } else {
      console.log('[Email OTP] Email not configured — OTP codes log to console in development.');
    }
    return;
  }

  try {
    await withTimeout(transporter.verify(), SMTP_SEND_TIMEOUT_MS, 'SMTP verify');
    console.log(`[Email OTP] SMTP ready (${process.env.SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE})`);
  } catch (err) {
    console.error('[Email OTP] SMTP verify failed:', err.message);
    console.error(
      '[Email OTP] SMTP often times out on Render. Prefer BREVO_API_KEY (HTTPS) from Brevo → SMTP & API → API Keys.'
    );
  }
}

module.exports = {
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_MS,
  generateOtp,
  hashOtp,
  isOtpCoolingDown,
  isPasswordResetOtpCoolingDown,
  isEmailConfigured,
  issueEmailOtp,
  issuePasswordResetOtp,
  verifySmtpOnStartup,
};
