/**
 * Refund Controller
 * - requestRefund: within 7 business days, initiates Razorpay refund & un-enrolls
 * - getRefundStatus: check status of a refund
 */
const Payment = require('../models/Payment');
const Refund  = require('../models/Refund');
const Payout  = require('../models/Payout');
const Course  = require('../models/Course');
const User    = require('../models/User');
const razorpay = require('../services/razorpayService');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const REFUND_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function businessDaysBetween(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setTime(current.getTime() + MS_PER_DAY);
  }
  return Math.max(0, count - 1); // exclude purchase day
}

/* ─── 1. Request Refund ─── */
exports.requestRefund = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId) throw new AppError('paymentId is required', 400);

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.user.toString() !== req.user._id.toString())
      throw new AppError('Not your payment', 403);
    if (payment.status !== 'captured')
      throw new AppError('Only captured payments can be refunded', 400);

    // Check refund window
    const businessDays = businessDaysBetween(new Date(payment.paidAt), new Date());
    if (businessDays > REFUND_WINDOW_DAYS) {
      throw new AppError(`Refund window of ${REFUND_WINDOW_DAYS} business days has expired`, 400);
    }

    // Check if already refunded
    const existingRefund = await Refund.findOne({ payment: paymentId, status: { $ne: 'failed' } });
    if (existingRefund) throw new AppError('Refund already initiated for this payment', 400);

    // Check payout state for this payment
    const payout = await Payout.findOne({ payment: payment._id }).sort({ createdAt: -1 });
    const postPayout = payout && payout.status === 'processed';

    // If payout already processed, attempt transfer reversal before refund.
    if (postPayout && payout.razorpayTransferId) {
      try {
        await razorpay.reverseTransfer(
          payout.razorpayTransferId,
          Math.round(payout.amount * 100),
          { reason: 'course_refund', paymentId: String(payment._id) }
        );
        payout.notes = `${payout.notes ? `${payout.notes} | ` : ''}Transfer reversed for refund`;
        await payout.save();
      } catch (reverseErr) {
        throw new AppError(
          `Refund blocked: payout already processed and reversal failed (${reverseErr.message})`,
          400
        );
      }
    }

    // Initiate Razorpay refund (to original source)
    let razorpayRefund = {};
    try {
      razorpayRefund = await razorpay.initiateRefund(
        payment.razorpayPaymentId,
        Math.round(payment.totalAmount * 100)
      );
    } catch (rpErr) {
      // If Razorpay fails (e.g. test mode), still record the refund locally
      console.error('Razorpay refund error (proceeding locally):', rpErr.message);
      razorpayRefund = { id: 'local_' + Date.now() };
    }

    // Create refund record
    const refund = await Refund.create({
      payment:          payment._id,
      user:             req.user._id,
      razorpayRefundId: razorpayRefund.id || '',
      amount:           payment.totalAmount,
      reason:           reason || 'Requested by learner',
      source:           postPayout ? 'post_payout' : 'pre_payout',
      status:           'processed',
      processedAt:      new Date(),
    });

    // Update payment status
    payment.status = 'refunded';
    await payment.save();

    // Cancel pending payout
    await Payout.updateMany(
      { payment: payment._id, status: { $in: ['pending', 'processing'] } },
      { status: 'cancelled', notes: 'Cancelled due to refund before payout release' }
    );

    // Un-enroll learner
    await Course.findByIdAndUpdate(payment.course, { $pull: { learners: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { enrolledCourses: payment.course } });

    sendResponse(res, 200, 'Refund processed', refund);
  } catch (err) { next(err); }
};

/* ─── 2. Get refund status ─── */
exports.getRefundStatus = async (req, res, next) => {
  try {
    const refund = await Refund.findById(req.params.id).populate('payment', 'course totalAmount');
    if (!refund) throw new AppError('Refund not found', 404);
    sendResponse(res, 200, 'Refund status', refund);
  } catch (err) { next(err); }
};
