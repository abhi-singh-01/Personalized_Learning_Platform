const mongoose = require('mongoose');

const uiConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },              // e.g. 'home_hero_banner', 'checkout_offer_strip'
  screen: { type: String, required: true },                          // 'home', 'courses', 'checkout', 'dashboard', 'global'
  type: {
    type: String,
    enum: ['banner', 'carousel', 'popup', 'strip', 'modal', 'section', 'feature_flag', 'announcement'],
    required: true,
  },
  title: { type: String, default: '' },
  description: { type: String, default: '' },

  // Flexible content — shape varies by type
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  /*
    Banner:       { imageUrl, linkTo, buttonText, bgColor, textColor }
    Carousel:     { slides: [{ imageUrl, title, subtitle, linkTo }] }
    Popup:        { heading, body, imageUrl, ctaText, ctaLink, dismissible }
    Strip:        { text, emoji, bgGradient, couponCode, linkTo }
    Announcement: { text, bgColor, textColor, linkTo }
    Section:      { heading, subheading, items: [{ id, type, ... }] }
  */

  // Targeting
  targetRoles: [{
    type: String,
    enum: ['learner', 'educator', 'admin', 'guest', 'all'],
    default: 'all',
  }],
  targetUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  conditions: {
    isNewUser: { type: Boolean, default: false },
    minPurchases: { type: Number, default: 0 },
    maxPurchases: { type: Number, default: 0 },           // 0 = no limit
    enrolledInCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    notEnrolledInCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  },

  priority: { type: Number, default: 0 },                  // Higher number = shows first
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },

  // Tracking
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

uiConfigSchema.index({ screen: 1, isActive: 1, priority: -1 });
uiConfigSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('UIConfig', uiConfigSchema);
