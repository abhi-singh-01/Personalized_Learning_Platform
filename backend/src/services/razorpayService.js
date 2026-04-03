/**
 * Razorpay Service — wraps the Razorpay Node SDK.
 * Provides helpers for creating orders, verifying signatures, refunds & transfers.
 */
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = require('../config/env');

// Initialise SDK (will be undefined if keys aren't set — handled gracefully)
let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

/**
 * Ensure Razorpay is configured before calling any API.
 */
function ensureConfigured() {
  if (!razorpay) throw new Error('Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
}

/**
 * Create a Razorpay order.
 * @param {number} amountInPaise – total amount in paise (₹1 = 100 paise)
 * @param {string} currency
 * @param {string} receipt – unique receipt id
 * @param {object} notes – key-value metadata
 */
exports.createOrder = async (amountInPaise, currency = 'INR', receipt = '', notes = {}) => {
  ensureConfigured();
  return razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
};

/**
 * Verify payment signature using HMAC SHA256.
 * @returns {boolean}
 */
exports.verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');
  return expected === razorpaySignature;
};

/**
 * Verify Razorpay webhook signature.
 * @param {string|Buffer} rawBody – raw request body
 * @param {string} signature – X-Razorpay-Signature header
 */
exports.verifyWebhookSignature = (rawBody, signature) => {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return expected === signature;
};

/**
 * Initiate a refund.
 * @param {string} paymentId – Razorpay payment ID (pay_xxx)
 * @param {number} amountInPaise – refund amount in paise
 */
exports.initiateRefund = async (paymentId, amountInPaise) => {
  ensureConfigured();
  return razorpay.payments.refund(paymentId, { amount: amountInPaise });
};

/**
 * Create a Route transfer to a linked account (optional, requires Razorpay Route plan).
 */
exports.createTransfer = async (paymentId, amountInPaise, linkedAccountId) => {
  ensureConfigured();
  return razorpay.payments.transfer(paymentId, {
    transfers: [{
      account: linkedAccountId,
      amount: amountInPaise,
      currency: 'INR',
    }],
  });
};

/**
 * Create Razorpay Route linked account for educator.
 */
exports.createLinkedAccount = async ({ name, email, accountNumber, ifsc, pan, gst }) => {
  ensureConfigured();
  return razorpay.accounts.create({
    name,
    email,
    type: 'route',
    legal_business_name: name,
    business_type: 'individual',
    profile: {
      category: 'education',
      subcategory: 'online_education',
    },
    legal_info: {
      pan,
      gst,
    },
    contact_name: name,
    notes: {
      source: 'plp_educator_onboarding',
      accountNumberLast4: String(accountNumber).slice(-4),
      ifsc,
    },
  });
};

/**
 * Reverse a transfer (used for post-payout refund cases).
 */
exports.reverseTransfer = async (transferId, amountInPaise, notes = {}) => {
  ensureConfigured();
  return razorpay.transfers.reverse(transferId, {
    amount: amountInPaise,
    notes,
  });
};

exports.fetchPayment = async (paymentId) => {
  ensureConfigured();
  return razorpay.payments.fetch(paymentId);
};

/** Expose the key_id so the frontend can embed it. */
exports.getKeyId = () => RAZORPAY_KEY_ID || '';
