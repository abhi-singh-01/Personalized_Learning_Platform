/**
 * Payment Controller
 * - educator onboarding (Route linked account reference)
 * - order creation + verification
 * - delayed payout release
 * - fee breakdown and histories
 */
const Payment = require('../models/Payment');
const Payout  = require('../models/Payout');
const Course  = require('../models/Course');
const User    = require('../models/User');
const Coupon      = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const razorpay = require('../services/razorpayService');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const {
  PLATFORM_FEE_RATE,
  PLATFORM_GST_RATE,
  PAYOUT_DELAY_DAYS,
  DUMMY_PAYMENT,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  FAILED_PAYMENT_RETENTION_HOURS,
} = require('../config/env');
const { buildSupportSnapshot } = require('../utils/paymentFailure');

const isRazorpayConfigured = () => Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

/* ── Fee calculation ── */
const MIN_PAYOUT_DELAY_DAYS = 3;
const MAX_PAYOUT_DELAY_DAYS = 7;
const payoutDelayDays = Math.min(
  MAX_PAYOUT_DELAY_DAYS,
  Math.max(MIN_PAYOUT_DELAY_DAYS, Number(PAYOUT_DELAY_DAYS || 5))
);

function calculateFees(coursePrice) {
  const platformFee = Math.round(coursePrice * PLATFORM_FEE_RATE * 100) / 100;
  const gst         = Math.round(platformFee * PLATFORM_GST_RATE * 100) / 100;
  const totalAmount = Math.round((coursePrice + platformFee + gst) * 100) / 100;
  const educatorShare = Math.round((totalAmount - platformFee - gst) * 100) / 100;
  return { coursePrice, platformFee, gst, totalAmount, educatorShare };
}

async function validateAndComputeDiscount({ couponCode, course, userId }) {
  if (!couponCode) return { coupon: null, discount: 0 };
  const code = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw new AppError('Invalid coupon code', 400);
  if (!coupon.isActive) throw new AppError('Coupon is inactive', 400);

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new AppError('Coupon is not active yet', 400);
  if (coupon.expiresAt && coupon.expiresAt < now) throw new AppError('Coupon has expired', 400);

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('Coupon usage limit reached', 400);
  }

  if (coupon.type === 'educator') {
    const educatorId = String(course.educator?._id || course.educator);
    const createdBy = String(coupon.createdBy);
    const allowedByCreator = createdBy === educatorId;
    const allowedByScope = (coupon.applicableEducators || []).some((id) => String(id) === educatorId);
    if (!allowedByCreator && !allowedByScope) {
      throw new AppError('This educator coupon is not valid for this course', 400);
    }
    if (!coupon.applicableCourses?.length) {
      throw new AppError('This coupon is not linked to this course', 400);
    }
  }

  if (coupon.applicableCourses?.length > 0 &&
    !coupon.applicableCourses.some((id) => String(id) === String(course._id))) {
    throw new AppError('Coupon not applicable to this course', 400);
  }

  if (coupon.minOrderAmount > 0 && course.price < coupon.minOrderAmount) {
    throw new AppError(`Coupon requires minimum order of Rs ${coupon.minOrderAmount}`, 400);
  }

  // Per the business rules, the same user can reuse the same coupon
  // on separate purchases — no per-user limit enforcement.
  // Global maxUses is still checked above.

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (course.price * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.max(0, Math.min(course.price, Math.round(discount * 100) / 100));

  return { coupon, discount };
}

async function normalizeCouponCourseScope({ applicableCourses = [], user }) {
  const courseIds = Array.isArray(applicableCourses)
    ? applicableCourses.filter(Boolean)
    : [applicableCourses].filter(Boolean);

  if (user.role === 'educator') {
    if (courseIds.length !== 1) {
      throw new AppError('Select exactly one course for this coupon', 400);
    }

    const course = await Course.findOne({ _id: courseIds[0], educator: user._id }).select('_id');
    if (!course) throw new AppError('Selected course not found or not owned by you', 404);
    return [course._id];
  }

  return courseIds;
}

/* ─── 0. Educator onboarding for linked account ─── */
exports.onboardEducator = async (req, res, next) => {
  try {
    const { name, email, accountNumber, ifscCode, pan, gst } = req.body;

    if (!name || !email || !accountNumber || !ifscCode || !pan) {
      throw new AppError('name, email, accountNumber, ifscCode and pan are required', 400);
    }
    if (req.user.role !== 'educator') {
      throw new AppError('Only educators can onboard payout accounts', 403);
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    const linkedAccount = await razorpay.createLinkedAccount({
      name,
      email,
      accountNumber,
      ifsc: ifscCode,
      pan,
      gst: gst || '',
    });

    user.razorpayAccountId = linkedAccount.id;
    user.bankDetails = {
      accountNumber,
      ifscCode,
      pan,
      gst: gst || '',
      beneficiaryName: name,
    };
    await user.save();

    sendResponse(res, 200, 'Educator onboarding successful', {
      razorpayAccountId: user.razorpayAccountId,
      bankDetails: user.bankDetails,
    });
  } catch (err) {
    next(err);
  }
};

/* ─── 1. Create Razorpay Order ─── */
exports.createOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') throw new AppError('Only learners can purchase courses', 403);
    const { courseId, couponCode, paymentMode } = req.body;
    if (!courseId) throw new AppError('courseId is required', 400);
    const mode = String(paymentMode || '').toLowerCase();
    const explicitDummy = mode === 'dummy' || mode === 'test' || mode === 'mock';
    const explicitRazorpay = mode === 'razorpay' || mode === 'live' || mode === 'gateway';

    const course = await Course.findById(courseId).populate('educator', 'name');
    if (!course) throw new AppError('Course not found', 404);
    if (course.price <= 0) throw new AppError('This is a free course — enroll directly', 400);

    // Check if already enrolled
    if (course.learners.includes(req.user._id))
      throw new AppError('Already enrolled in this course', 400);

    // Check if there's already a successful payment
    const existingPayment = await Payment.findOne({ user: req.user._id, course: courseId, status: 'captured' });
    if (existingPayment) throw new AppError('Payment already completed for this course', 400);

    const { coupon, discount } = await validateAndComputeDiscount({
      couponCode,
      course,
      userId: req.user._id,
    });
    const discountedPrice = Math.max(0, Math.round((course.price - discount) * 100) / 100);
    const fees = calculateFees(discountedPrice);
    const couponData = coupon ? {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountApplied: discount,
    } : null;

    // 100% discount path: no gateway charge, enroll directly.
    if (fees.totalAmount <= 0) {
      const localOrderId = `coupon_free_${courseId}_${req.user._id}_${Date.now()}`;
      const payment = await Payment.create({
        user: req.user._id,
        course: course._id,
        educator: course.educator._id || course.educator,
        razorpayOrderId: localOrderId,
        razorpayPaymentId: `no_charge_${Date.now()}`,
        coursePrice: fees.coursePrice,
        platformFee: fees.platformFee,
        gst: fees.gst,
        totalAmount: fees.totalAmount,
        currency: course.currency || 'INR',
        status: 'captured',
        paidAt: new Date(),
        metadata: { couponCode: coupon?.code || '', couponDiscount: discount },
      });

      if (!course.learners.includes(req.user._id)) {
        course.learners.push(req.user._id);
        await course.save();
      }
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        await CouponUsage.create({
          user: req.user._id,
          coupon: coupon._id,
          payment: payment._id,
          course: course._id,
          couponCode: coupon.code,
          discountApplied: discount,
          orderAmount: fees.totalAmount,
        });
      }

      return sendResponse(res, 200, 'Coupon applied. Enrolled with zero payable amount', {
        orderId: localOrderId,
        paymentId: payment._id,
        amount: 0,
        currency: course.currency || 'INR',
        keyId: razorpay.getKeyId(),
        courseName: course.title,
        breakdown: { ...fees, discount },
        coupon: couponData,
        directEnrolled: true,
      });
    }

    /* ── Mock / test checkout ──
       - If learner sends paymentMode=dummy (and DUMMY_PAYMENT=true): mock order even when Razorpay keys exist.
       - Else if DUMMY_PAYMENT=true and Razorpay is not configured: mock order only path.
       - Default / paymentMode=razorpay: real Razorpay order when keys are set. */
    const useDummyCheckout =
      (explicitDummy && DUMMY_PAYMENT) ||
      (DUMMY_PAYMENT && !isRazorpayConfigured() && !explicitRazorpay);

    if (explicitDummy && !DUMMY_PAYMENT) {
      throw new AppError('Test (mock) checkout is disabled on this server. Use Razorpay or ask the admin to enable DUMMY_PAYMENT.', 403);
    }

    if (useDummyCheckout) {
      const dummyOrderId = `dummy_order_${courseId}_${req.user._id}_${Date.now()}`;
      const payment = await Payment.create({
        user:            req.user._id,
        course:          course._id,
        educator:        course.educator._id || course.educator,
        razorpayOrderId: dummyOrderId,
        coursePrice:      fees.coursePrice,
        platformFee:     fees.platformFee,
        gst:             fees.gst,
        totalAmount:     fees.totalAmount,
        currency:        course.currency || 'INR',
        status:          'created',
        metadata: coupon ? { couponCode: coupon.code, couponDiscount: discount, isDummy: true } : { isDummy: true },
      });

      return sendResponse(res, 200, 'Dummy order created', {
        orderId:    dummyOrderId,
        paymentId:  payment._id,
        amount:     fees.totalAmount,
        currency:   course.currency || 'INR',
        keyId:      razorpay.getKeyId(),
        courseName: course.title,
        breakdown:  { ...fees, discount },
        coupon: couponData,
        dummyMode: true,
      });
    }

    if (!isRazorpayConfigured()) {
      throw new AppError(
        'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (use Test mode keys from https://dashboard.razorpay.com for examiner demos), or set DUMMY_PAYMENT=true in .env to use the built-in mock checkout without Razorpay.',
        503
      );
    }

    // Create Razorpay order (amount in paise)
    // Razorpay receipt max length is 40 chars — use truncated IDs + short timestamp
    const shortCourseId = courseId.toString().slice(-8);
    const shortUserId   = req.user._id.toString().slice(-8);
    const shortTs       = Date.now().toString(36);          // base-36 keeps it compact
    const receipt       = `rcpt_${shortCourseId}_${shortUserId}_${shortTs}`.slice(0, 40);

    const order = await razorpay.createOrder(
      Math.round(fees.totalAmount * 100),   // paise
      course.currency || 'INR',
      receipt,
      { courseId: courseId.toString(), userId: req.user._id.toString() }
    );

    // Store payment record
    const payment = await Payment.create({
      user:            req.user._id,
      course:          course._id,
      educator:        course.educator._id || course.educator,
      razorpayOrderId: order.id,
      coursePrice:      fees.coursePrice,
      platformFee:     fees.platformFee,
      gst:             fees.gst,
      totalAmount:     fees.totalAmount,
      currency:        course.currency || 'INR',
      status:          'created',
      metadata: coupon ? { couponCode: coupon.code, couponDiscount: discount } : {},
    });

    sendResponse(res, 200, 'Order created', {
      orderId:    order.id,
      paymentId:  payment._id,
      amount:     fees.totalAmount,
      currency:   course.currency || 'INR',
      keyId:      razorpay.getKeyId(),
      courseName: course.title,
      breakdown:  { ...fees, discount },
      coupon: couponData,
    });
  } catch (err) { next(err); }
};

/* ─── 2a. Dummy Payment Verify (auto-accept) ─── */
exports.dummyVerify = async (req, res, next) => {
  try {
    if (!DUMMY_PAYMENT) throw new AppError('Mock checkout is disabled on this server', 403);
    if (req.user.role !== 'learner') throw new AppError('Only learners can verify course purchases', 403);

    const { orderId } = req.body;
    if (!orderId) throw new AppError('orderId is required', 400);
    if (!String(orderId).startsWith('dummy_order_')) {
      throw new AppError(
        'This endpoint is only for the built-in mock checkout. Complete a real payment in the Razorpay window; the app verifies it automatically.',
        400
      );
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) throw new AppError('Payment record not found', 404);
    if (payment.status === 'captured') throw new AppError('Payment already verified', 400);

    // Auto-capture the payment
    payment.razorpayPaymentId = `dummy_pay_${Date.now()}`;
    payment.razorpaySignature = 'dummy_signature';
    payment.status = 'captured';
    payment.paidAt = new Date();
    await payment.save();

    if (payment.metadata?.couponCode) {
      const usedCoupon = await Coupon.findOneAndUpdate(
        { code: payment.metadata.couponCode },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (usedCoupon) {
        await CouponUsage.create({
          user: payment.user,
          coupon: usedCoupon._id,
          payment: payment._id,
          course: payment.course,
          couponCode: usedCoupon.code,
          discountApplied: payment.metadata.couponDiscount || 0,
          orderAmount: payment.totalAmount,
        });
      }
    }

    // Enroll learner
    const course = await Course.findById(payment.course);
    if (course && !course.learners.includes(payment.user)) {
      course.learners.push(payment.user);
      await course.save();
    }
    await User.findByIdAndUpdate(payment.user, {
      $addToSet: { enrolledCourses: payment.course },
    });

    // Create pending payout
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + payoutDelayDays);
    await Payout.create({
      payment:     payment._id,
      educator:    payment.educator,
      amount:      calculateFees(payment.coursePrice).educatorShare,
      status:      'pending',
      scheduledAt,
      notes: `Dummy payment — scheduled after ${payoutDelayDays} day delay window`,
    });

    sendResponse(res, 200, 'Dummy payment verified and enrollment complete', {
      paymentId: payment._id,
      courseId:   payment.course,
      status:    'captured',
    });
  } catch (err) { next(err); }
};

/* ─── 2. Verify Payment ─── */
exports.verifyPayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') throw new AppError('Only learners can verify course purchases', 403);
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
      throw new AppError('Missing payment verification fields', 400);

    // HMAC SHA256 verification
    const isValid = razorpay.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) throw new AppError('Invalid payment signature', 400);

    // Update payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw new AppError('Payment record not found', 404);
    if (payment.status === 'captured') throw new AppError('Payment already verified', 400);

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'captured';
    payment.paidAt = new Date();
    await payment.save();

    if (payment.metadata?.couponCode) {
      const usedCoupon = await Coupon.findOneAndUpdate(
        { code: payment.metadata.couponCode },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (usedCoupon) {
        await CouponUsage.create({
          user: payment.user,
          coupon: usedCoupon._id,
          payment: payment._id,
          course: payment.course,
          couponCode: usedCoupon.code,
          discountApplied: payment.metadata.couponDiscount || 0,
          orderAmount: payment.totalAmount,
        });
      }
    }

    // Enroll learner
    const course = await Course.findById(payment.course);
    if (course && !course.learners.includes(payment.user)) {
      course.learners.push(payment.user);
      await course.save();
    }
    await User.findByIdAndUpdate(payment.user, {
      $addToSet: { enrolledCourses: payment.course },
    });

    // Create pending payout (delayed by PAYOUT_DELAY_DAYS)
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + payoutDelayDays);
    await Payout.create({
      payment:     payment._id,
      educator:    payment.educator,
      amount:      calculateFees(payment.coursePrice).educatorShare,
      status:      'pending',
      scheduledAt,
      notes: `Scheduled after ${payoutDelayDays} day delay window`,
    });

    sendResponse(res, 200, 'Payment verified and enrollment complete', {
      paymentId: payment._id,
      courseId:   payment.course,
      status:    'captured',
    });
  } catch (err) { next(err); }
};

/* ─── 3. Learner Payment History ─── */
exports.getHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('course', 'title thumbnail')
      .populate('educator', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const retentionMs = FAILED_PAYMENT_RETENTION_HOURS * 60 * 60 * 1000;
    const enriched = payments.map((p) => {
      if (p.status === 'failed' && p.failedAt && !p.paymentQueryRaisedAt) {
        const autoDeleteAt = new Date(new Date(p.failedAt).getTime() + retentionMs).toISOString();
        return { ...p, autoDeleteAt, retentionHours: FAILED_PAYMENT_RETENTION_HOURS };
      }
      return { ...p, retentionHours: FAILED_PAYMENT_RETENTION_HOURS };
    });

    sendResponse(res, 200, 'Payment history', enriched);
  } catch (err) { next(err); }
};

/** Learner reports Razorpay checkout failure (client-side payment.failed or abandoned flow). */
exports.reportFailure = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') throw new AppError('Only learners can report payment failures', 403);
    const { razorpayOrderId, error } = req.body;
    if (!razorpayOrderId) throw new AppError('razorpayOrderId is required', 400);

    const payment = await Payment.findOne({ razorpayOrderId, user: req.user._id });
    if (!payment) throw new AppError('Payment record not found', 404);
    if (payment.status === 'captured') throw new AppError('This payment already completed successfully', 400);
    if (payment.status === 'failed') {
      return sendResponse(res, 200, 'Failure already recorded', {
        paymentId: payment._id,
        supportSnapshot: payment.supportSnapshot,
        retentionHours: FAILED_PAYMENT_RETENTION_HOURS,
      });
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureDetails = {
      code: error?.code || '',
      description: error?.description || error?.message || 'Payment failed',
      reason: error?.reason || '',
      source: error?.source || 'razorpay_checkout',
    };
    if (error?.metadata?.payment_id) payment.razorpayPaymentId = String(error.metadata.payment_id);
    else if (error?.payment_id) payment.razorpayPaymentId = String(error.payment_id);
    payment.supportSnapshot = await buildSupportSnapshot(payment);
    await payment.save();

    sendResponse(res, 200, 'Failure recorded', {
      paymentId: payment._id,
      supportSnapshot: payment.supportSnapshot,
      retentionHours: FAILED_PAYMENT_RETENTION_HOURS,
    });
  } catch (err) { next(err); }
};

/** Learner flags a failed payment for support — row is kept past auto-delete window. */
exports.raisePaymentQuery = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') throw new AppError('Only learners can raise payment queries', 403);
    const { paymentId, message } = req.body;
    if (!paymentId) throw new AppError('paymentId is required', 400);

    const payment = await Payment.findOne({ _id: paymentId, user: req.user._id });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status !== 'failed') throw new AppError('Only failed payments can be flagged for support', 400);
    if (payment.paymentQueryRaisedAt) throw new AppError('A support query was already raised for this payment', 400);

    payment.paymentQueryRaisedAt = new Date();
    payment.paymentQueryMessage = String(message || '').trim().slice(0, 2000);
    if (!payment.supportSnapshot) {
      payment.supportSnapshot = await buildSupportSnapshot(payment);
    }
    await payment.save();

    sendResponse(res, 200, 'Support query recorded. This payment will be kept in your history.', {
      paymentId: payment._id,
    });
  } catch (err) { next(err); }
};

/* ─── 4. Educator Earnings ─── */
exports.getEarnings = async (req, res, next) => {
  try {
    // All captured payments for this educator
    const payments = await Payment.find({ educator: req.user._id, status: 'captured' })
      .populate('course', 'title')
      .populate('user', 'name')
      .sort({ paidAt: -1 });

    const payouts = await Payout.find({ educator: req.user._id })
      .populate({ path: 'payment', select: 'course coursePrice', populate: { path: 'course', select: 'title' } })
      .sort({ createdAt: -1 });

    // Summary
    const totalEarnings   = payouts.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts  = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const processedPayouts = payouts.filter(p => p.status === 'processed').reduce((s, p) => s + p.amount, 0);

    sendResponse(res, 200, 'Earnings', {
      summary: { totalEarnings, pendingPayouts, processedPayouts },
      payments,
      payouts,
    });
  } catch (err) { next(err); }
};

/* ─── 5. Get Razorpay Key (public) ─── */
exports.getKey = async (req, res) => {
  sendResponse(res, 200, 'Key', { keyId: razorpay.getKeyId() });
};

/** Learner: which checkout paths the server allows (for UI: Razorpay vs mock). */
exports.getCheckoutOptions = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') {
      throw new AppError('Only learners need checkout options', 403);
    }
    sendResponse(res, 200, 'Checkout options', {
      razorpay: isRazorpayConfigured(),
      dummy: DUMMY_PAYMENT,
    });
  } catch (err) { next(err); }
};

/* ─── 6. Calculate fee preview (no auth needed for display) ─── */
exports.calculateFees = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (course.price <= 0) return sendResponse(res, 200, 'Free course', { coursePrice: 0, platformFee: 0, gst: 0, totalAmount: 0 });
    sendResponse(res, 200, 'Fee breakdown', calculateFees(course.price));
  } catch (err) { next(err); }
};

/* ─── 7. Create coupon (educator/admin) ─── */
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code, title, description, discountType, discountValue, maxDiscount,
      minOrderAmount, startsAt, expiresAt, maxUses, perUserLimit,
      applicableCourses = [],
    } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      throw new AppError('code, discountType, discountValue and expiresAt are required', 400);
    }
    if (!['percent', 'fixed'].includes(discountType)) {
      throw new AppError('discountType must be percent or fixed', 400);
    }

    const couponType = req.user.role === 'admin' ? 'platform' : 'educator';
    if (!['admin', 'educator'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can create coupon', 403);
    }

    const scopedCourses = await normalizeCouponCourseScope({ applicableCourses, user: req.user });

    const payload = {
      code: String(code).trim().toUpperCase(),
      title: title || '',
      description: description || '',
      type: couponType,
      createdBy: req.user._id,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: Number(maxDiscount || 0),
      minOrderAmount: Number(minOrderAmount || 0),
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      expiresAt: new Date(expiresAt),
      maxUses: Number(maxUses || 0),
      perUserLimit: Number(perUserLimit || 1),
      applicableCourses: scopedCourses,
    };

    if (couponType === 'educator') {
      payload.applicableEducators = [req.user._id];
    }

    const coupon = await Coupon.create(payload);
    sendResponse(res, 201, 'Coupon created', coupon);
  } catch (err) { next(err); }
};

/* ─── 8. Validate coupon (learner preview) ─── */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { courseId, code } = req.query;
    if (!courseId || !code) throw new AppError('courseId and code are required', 400);
    const course = await Course.findById(courseId).populate('educator', 'name');
    if (!course) throw new AppError('Course not found', 404);
    if (course.price <= 0) throw new AppError('Coupons are not needed for free courses', 400);

    const { coupon, discount } = await validateAndComputeDiscount({
      couponCode: code,
      course,
      userId: req.user._id,
    });
    const discountedPrice = Math.max(0, Math.round((course.price - discount) * 100) / 100);
    const fees = calculateFees(discountedPrice);
    sendResponse(res, 200, 'Coupon applied', {
      coupon: {
        code: coupon.code,
        type: coupon.type,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      breakdown: { ...fees, discount },
    });
  } catch (err) { next(err); }
};

/* ─── 9. Coupon list (educator/admin) ─── */
exports.getCoupons = async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    if (!['educator', 'admin'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can view coupons', 403);
    }

    const filter = {};
    if (req.user.role === 'educator') {
      filter.$or = [
        { createdBy: req.user._id },
        { applicableEducators: req.user._id },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role')
      .populate('applicableCourses', 'title price');

    sendResponse(res, 200, 'Coupons fetched', coupons);
  } catch (err) { next(err); }
};

/* ─── 10. Coupon deactivate (educator/admin) ─── */
exports.deactivateCoupon = async (req, res, next) => {
  try {
    if (!['educator', 'admin'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can deactivate coupons', 403);
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    if (req.user.role === 'educator' && String(coupon.createdBy) !== String(req.user._id)) {
      throw new AppError('You can only deactivate your own coupons', 403);
    }

    coupon.isActive = false;
    await coupon.save();
    sendResponse(res, 200, 'Coupon deactivated', coupon);
  } catch (err) { next(err); }
};

/* ─── 10. Edit coupon (educator/admin) ─── */
exports.updateCoupon = async (req, res, next) => {
  try {
    if (!['educator', 'admin'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can edit coupons', 403);
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    if (req.user.role === 'educator' && String(coupon.createdBy) !== String(req.user._id)) {
      throw new AppError('You can only edit your own coupons', 403);
    }

    const {
      title,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      startsAt,
      expiresAt,
      maxUses,
      perUserLimit,
      applicableCourses,
      isActive,
    } = req.body;

    if (discountType !== undefined && !['percent', 'fixed'].includes(discountType)) {
      throw new AppError('discountType must be percent or fixed', 400);
    }
    if (discountValue !== undefined && Number(discountValue) < 0) {
      throw new AppError('discountValue must be >= 0', 400);
    }

    if (expiresAt !== undefined) {
      const ex = new Date(expiresAt);
      if (Number.isNaN(ex.getTime())) throw new AppError('expiresAt is invalid', 400);
      if (ex.getTime() <= 0) throw new AppError('expiresAt is invalid', 400);
    }

    if (coupon.type === 'educator' && req.user.role === 'educator') {
      // Keep educator-scoped coupons bound to the educator that owns them.
      delete req.body.applicableEducators;
      if (applicableCourses !== undefined) {
        coupon.applicableCourses = await normalizeCouponCourseScope({
          applicableCourses,
          user: req.user,
        });
      }
    }

    if (title !== undefined) coupon.title = title;
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (maxDiscount !== undefined) coupon.maxDiscount = Number(maxDiscount);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (startsAt !== undefined) coupon.startsAt = startsAt ? new Date(startsAt) : new Date();
    if (expiresAt !== undefined) coupon.expiresAt = new Date(expiresAt);
    if (maxUses !== undefined) coupon.maxUses = Number(maxUses);
    if (perUserLimit !== undefined) coupon.perUserLimit = Number(perUserLimit);
    if (applicableCourses !== undefined && Array.isArray(applicableCourses) && req.user.role === 'admin') {
      coupon.applicableCourses = applicableCourses;
    }
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();
    sendResponse(res, 200, 'Coupon updated', coupon);
  } catch (err) { next(err); }
};

/* ─── 11. Reactivate coupon (educator/admin) ─── */
exports.reactivateCoupon = async (req, res, next) => {
  try {
    if (!['educator', 'admin'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can reactivate coupons', 403);
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    if (req.user.role === 'educator' && String(coupon.createdBy) !== String(req.user._id)) {
      throw new AppError('You can only reactivate your own coupons', 403);
    }

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new AppError('This coupon has already expired', 400);
    }

    coupon.isActive = true;
    await coupon.save();
    sendResponse(res, 200, 'Coupon reactivated', coupon);
  } catch (err) { next(err); }
};

/* ─── 11. Coupon analytics (admin/educator) ─── */
exports.getCouponAnalytics = async (req, res, next) => {
  try {
    if (!['educator', 'admin'].includes(req.user.role)) {
      throw new AppError('Only educator/admin can view coupon analytics', 403);
    }

    const { start, end } = req.query;
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if ((start && Number.isNaN(startDate.getTime())) || (end && Number.isNaN(endDate.getTime()))) {
      throw new AppError('Invalid date range. Use YYYY-MM-DD format.', 400);
    }

    // Inclusive date range (end is end-of-day)
    let createdAtRange = null;
    if (startDate || endDate) {
      const from = startDate ? startDate : new Date(0);
      const to = endDate ? new Date(endDate) : new Date();
      to.setHours(23, 59, 59, 999);
      createdAtRange = { $gte: from, $lte: to };
    }

    const couponFilter = {};
    if (req.user.role === 'educator') {
      couponFilter.$or = [
        { createdBy: req.user._id },
        { applicableEducators: req.user._id },
      ];
    }
    const coupons = await Coupon.find(couponFilter).select('code title type usedCount createdAt expiresAt isActive');
    const couponCodes = coupons.map((c) => c.code);

    const paymentMatch = {
      'metadata.couponCode': { $in: couponCodes },
    };
    if (req.user.role === 'educator') {
      paymentMatch.educator = req.user._id;
    }
    if (createdAtRange) {
      paymentMatch.createdAt = createdAtRange;
    }

    const perf = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$metadata.couponCode',
          totalAttempts: { $sum: 1 },
          successfulAttempts: {
            $sum: {
              $cond: [
                { $in: ['$status', ['captured', 'refunded', 'partially_refunded']] },
                1,
                0,
              ],
            },
          },
          redemptions: {
            $sum: {
              $cond: [
                { $in: ['$status', ['captured', 'refunded', 'partially_refunded']] },
                1,
                0,
              ],
            },
          },
          revenueAfterDiscount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['captured', 'refunded', 'partially_refunded']] },
                '$totalAmount',
                0,
              ],
            },
          },
          totalDiscountGiven: {
            $sum: {
              $cond: [
                { $in: ['$status', ['captured', 'refunded', 'partially_refunded']] },
                { $ifNull: ['$metadata.couponDiscount', 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const byCode = new Map(perf.map((p) => [p._id, p]));
    const items = coupons.map((c) => {
      const p = byCode.get(c.code) || {};
      const attempts = p.totalAttempts || 0;
      const successful = p.successfulAttempts || 0;
      const conversionRate = attempts > 0 ? (successful / attempts) * 100 : 0;
      return {
        id: c._id,
        code: c.code,
        title: c.title,
        type: c.type,
        isActive: c.isActive,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
        redemptions: p.redemptions || 0,
        totalAttempts: attempts,
        conversionRate: Number(conversionRate.toFixed(2)),
        totalDiscountGiven: Number((p.totalDiscountGiven || 0).toFixed(2)),
        revenueAfterDiscount: Number((p.revenueAfterDiscount || 0).toFixed(2)),
      };
    });

    const totals = items.reduce((acc, i) => ({
      couponCount: acc.couponCount + 1,
      redemptions: acc.redemptions + i.redemptions,
      attempts: acc.attempts + (i.totalAttempts || 0),
      totalDiscountGiven: acc.totalDiscountGiven + i.totalDiscountGiven,
      revenueAfterDiscount: acc.revenueAfterDiscount + i.revenueAfterDiscount,
    }), { couponCount: 0, redemptions: 0, attempts: 0, totalDiscountGiven: 0, revenueAfterDiscount: 0 });

    const overallConversionRate = totals.attempts > 0 ? (totals.redemptions / totals.attempts) * 100 : 0;
    totals.conversionRate = Number(overallConversionRate.toFixed(2));

    sendResponse(res, 200, 'Coupon analytics', { totals, coupons: items });
  } catch (err) { next(err); }
};

/* ─── 12. Coupon usage history (learner) ─── */
exports.getCouponUsageHistory = async (req, res, next) => {
  try {
    const usages = await CouponUsage.find({ user: req.user._id })
      .populate('course', 'title thumbnail')
      .populate('coupon', 'code title discountType discountValue')
      .sort({ redeemedAt: -1 });
    sendResponse(res, 200, 'Coupon usage history', usages);
  } catch (err) { next(err); }
};
