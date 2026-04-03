/**
 * Payout Cron — releases pending educator payouts after the scheduled delay.
 * Runs every hour using node-cron.
 */
const cron   = require('node-cron');
const Payout = require('../models/Payout');
const Payment = require('../models/Payment');
const User = require('../models/User');
const razorpay = require('./razorpayService');

function startPayoutCron() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const duePayouts = await Payout.find({
        status: 'pending',
        scheduledAt: { $lte: now },
      });

      for (const payout of duePayouts) {
        try {
          const payment = await Payment.findById(payout.payment);
          if (!payment || payment.status !== 'captured') {
            payout.status = 'failed';
            payout.notes = 'Missing/invalid captured payment for payout';
            await payout.save();
            continue;
          }

          const educator = await User.findById(payout.educator).select('razorpayAccountId');
          if (!educator?.razorpayAccountId) {
            payout.status = 'failed';
            payout.notes = 'Educator linked account not onboarded';
            await payout.save();
            continue;
          }

          // Route split transfer happens at delayed payout time.
          const transfer = await razorpay.createTransfer(
            payment.razorpayPaymentId,
            Math.round(payout.amount * 100),
            educator.razorpayAccountId
          );

          payout.status      = 'processed';
          payout.processedAt = now;
          payout.razorpayTransferId = transfer.items?.[0]?.id || '';
          payout.transferData = transfer;
          payout.notes = 'Auto-released by cron';
          await payout.save();
          console.log(`[PayoutCron] Released payout ${payout._id} — ₹${payout.amount} to educator ${payout.educator}`);
        } catch (err) {
          payout.status = 'failed';
          payout.notes  = 'Cron error: ' + err.message;
          await payout.save();
          console.error(`[PayoutCron] Failed payout ${payout._id}:`, err.message);
        }
      }

      if (duePayouts.length > 0) {
        console.log(`[PayoutCron] Processed ${duePayouts.length} payout(s)`);
      }
    } catch (err) {
      console.error('[PayoutCron] Error:', err);
    }
  });

  console.log('[PayoutCron] Scheduled — runs every hour');
}

module.exports = startPayoutCron;
