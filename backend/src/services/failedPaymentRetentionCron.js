/**
 * Removes failed payment rows after FAILED_PAYMENT_RETENTION_HOURS if the learner
 * did not raise a support query (paymentQueryRaisedAt).
 */
const cron = require('node-cron');
const Payment = require('../models/Payment');
const { FAILED_PAYMENT_RETENTION_HOURS } = require('../config/env');

function startFailedPaymentRetentionCron() {
  const run = async () => {
    try {
      const cutoff = new Date(Date.now() - FAILED_PAYMENT_RETENTION_HOURS * 60 * 60 * 1000);
      const result = await Payment.deleteMany({
        status: 'failed',
        failedAt: { $lte: cutoff },
        $or: [{ paymentQueryRaisedAt: { $exists: false } }, { paymentQueryRaisedAt: null }],
      });
      if (result.deletedCount > 0) {
        console.log(`[FailedPaymentRetention] Deleted ${result.deletedCount} expired failed payment(s)`);
      }
    } catch (err) {
      console.error('[FailedPaymentRetention] Error:', err.message);
    }
  };

  // Hourly at :25 (stagger from payout cron at :00)
  cron.schedule('25 * * * *', run);
  console.log(`[FailedPaymentRetention] Scheduled — failed payments without query are deleted after ${FAILED_PAYMENT_RETENTION_HOURS}h`);
}

module.exports = startFailedPaymentRetentionCron;
