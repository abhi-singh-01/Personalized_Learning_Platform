const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:            { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  educator:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Razorpay identifiers
  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },

  // Amounts (all in paise stored as INR numbers)
  coursePrice:  { type: Number, required: true },       // Base course price
  platformFee: { type: Number, required: true },        // 2 % of coursePrice
  gst:         { type: Number, required: true },         // 18 % of platformFee
  totalAmount: { type: Number, required: true },         // coursePrice + platformFee + gst
  currency:    { type: String, default: 'INR' },

  status: {
    type: String,
    enum: ['created', 'captured', 'failed', 'refunded', 'partially_refunded'],
    default: 'created',
  },
  paidAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  /** Failed / abandoned checkout — retention & support */
  failedAt: { type: Date },
  failureDetails: { type: mongoose.Schema.Types.Mixed, default: undefined },
  /** Denormalised facts for support / Razorpay tickets (copied at failure time) */
  supportSnapshot: { type: mongoose.Schema.Types.Mixed, default: undefined },
  /** If set, failed payment row is kept (not auto-deleted after retention window) */
  paymentQueryRaisedAt: { type: Date },
  paymentQueryMessage: { type: String, default: '' },
}, { timestamps: true });

paymentSchema.index({ user: 1 });
paymentSchema.index({ educator: 1 });
paymentSchema.index({ course: 1, user: 1 });
paymentSchema.index({ status: 1, failedAt: 1, paymentQueryRaisedAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
