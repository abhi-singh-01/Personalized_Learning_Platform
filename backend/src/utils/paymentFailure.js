const User = require('../models/User');

/**
 * Build a compact support snapshot for Razorpay / bank disputes (stored on failed payments).
 */
async function buildSupportSnapshot(payment) {
  await payment.populate([
    { path: 'course', select: 'title' },
    { path: 'educator', select: 'name email' },
  ]);
  const user = await User.findById(payment.user).select('email name').lean();
  return {
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId || '',
    totalAmount: payment.totalAmount,
    currency: payment.currency || 'INR',
    courseTitle: payment.course?.title || '',
    educatorName: payment.educator?.name || '',
    learnerName: user?.name || '',
    learnerEmail: user?.email || '',
    coursePrice: payment.coursePrice,
    platformFee: payment.platformFee,
    gst: payment.gst,
  };
}

module.exports = { buildSupportSnapshot };
