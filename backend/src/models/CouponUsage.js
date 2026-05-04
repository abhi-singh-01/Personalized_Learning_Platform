const mongoose = require('mongoose');

/**
 * CouponUsage — tracks every time a coupon is redeemed.
 * Allows the same user to reuse the same coupon on separate purchases,
 * while maintaining an audit trail of all redemptions.
 */
const couponUsageSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupon:   { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  payment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  couponCode:      { type: String, required: true, uppercase: true },
  discountApplied: { type: Number, required: true, min: 0 },
  orderAmount:     { type: Number, required: true, min: 0 },  // totalAmount after discount

  redeemedAt: { type: Date, default: Date.now },
}, { timestamps: true });

couponUsageSchema.index({ user: 1, coupon: 1 });
couponUsageSchema.index({ couponCode: 1 });
couponUsageSchema.index({ payment: 1 }, { unique: true });   // one usage record per payment

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
