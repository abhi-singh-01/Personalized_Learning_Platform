const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  type: { type: String, enum: ['platform', 'educator'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: 0 }, // for percent coupons, INR cap
  minOrderAmount: { type: Number, default: 0 }, // INR
  applicableCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  applicableEducators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  maxUses: { type: Number, default: 0 }, // 0 means unlimited
  perUserLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // Track which users used it
  isActive: { type: Boolean, default: true },

  // BDUI display configuration
  displayConfig: {
    showOnHomepage: { type: Boolean, default: false },
    showOnCoursePage: { type: Boolean, default: false },
    showOnCheckout: { type: Boolean, default: true },
    showAsBanner: { type: Boolean, default: false },
    bannerText: { type: String, default: '' },
    bannerEmoji: { type: String, default: '🎉' },
    bannerBgColor: { type: String, default: '#10b981' },
    bannerTextColor: { type: String, default: '#ffffff' },
    bannerPosition: { type: String, enum: ['top', 'bottom', 'inline'], default: 'top' },
  },

  // Auto-apply: automatically apply the best available coupon at checkout
  autoApplyOnCheckout: { type: Boolean, default: false },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ expiresAt: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
