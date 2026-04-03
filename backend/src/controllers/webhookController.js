/**
 * Webhook Controller — handles incoming Razorpay webhooks.
 * Signature is verified before any processing.
 */
const Payment = require('../models/Payment');
const Refund  = require('../models/Refund');
const Payout = require('../models/Payout');
const razorpay = require('../services/razorpayService');

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.rawBody; // Buffer set by raw body middleware in app.js

    if (!signature || !rawBody) return res.status(400).json({ error: 'Missing signature or body' });

    const isValid = razorpay.verifyWebhookSignature(rawBody, signature);
    if (!isValid) return res.status(400).json({ error: 'Invalid webhook signature' });

    const { event, payload } = req.body;

    switch (event) {
      case 'payment.captured': {
        const rpPaymentId = payload.payment?.entity?.id;
        const orderId     = payload.payment?.entity?.order_id;
        if (rpPaymentId && orderId) {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId, status: 'created' },
            { status: 'captured', razorpayPaymentId: rpPaymentId, paidAt: new Date() }
          );
        }
        break;
      }

      case 'payment.failed': {
        const orderId = payload.payment?.entity?.order_id;
        if (orderId) {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId },
            {
              status: 'failed',
              metadata: {
                failureReason: payload.payment?.entity?.error_description || 'payment_failed',
              },
            }
          );
        }
        break;
      }

      case 'refund.processed': {
        const rpRefundId = payload.refund?.entity?.id;
        if (rpRefundId) {
          const refund = await Refund.findOneAndUpdate(
            { razorpayRefundId: rpRefundId },
            { status: 'processed', processedAt: new Date() }
          );
          if (refund?.payment) {
            await Payment.findByIdAndUpdate(refund.payment, { status: 'refunded' });
            await Payout.updateMany(
              { payment: refund.payment, status: { $in: ['pending', 'processing'] } },
              { status: 'cancelled', notes: 'Cancelled due to refund.processed webhook' }
            );
          }
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
    }

    // Always return 200 to Razorpay
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ status: 'ok' }); // Still return 200 to avoid retries
  }
};
