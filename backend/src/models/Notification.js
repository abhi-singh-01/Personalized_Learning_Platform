const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'class_starting', 'class_ended', 'class_cancelled',
      'payment_received', 'payout_processed', 'payout_failed',
      'coupon_expiring', 'new_coupon', 'offer_available',
      'new_material', 'new_quiz', 'quiz_deadline',
      'enrollment', 'unenrollment',
      'announcement', 'system',
      'review_received', 'review_reply',
      'verification_approved', 'verification_rejected',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },   // e.g. { courseId, classId, paymentId }
  channel: {
    type: String,
    enum: ['in_app', 'email', 'push', 'sms'],
    default: 'in_app',
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
