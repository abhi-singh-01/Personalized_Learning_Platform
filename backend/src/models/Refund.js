const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  payment:          { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayRefundId: { type: String, default: '' },
  amount:           { type: Number, required: true },
  reason:           { type: String, default: '' },
  source:           { type: String, enum: ['pre_payout', 'post_payout'], default: 'pre_payout' },
  status: {
    type: String,
    enum: ['initiated', 'processed', 'failed'],
    default: 'initiated',
  },
  processedAt: { type: Date },
}, { timestamps: true });

refundSchema.index({ payment: 1 });
refundSchema.index({ user: 1 });

module.exports = mongoose.model('Refund', refundSchema);
