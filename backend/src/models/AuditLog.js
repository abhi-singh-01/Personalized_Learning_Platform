const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },           // 'user_deleted', 'coupon_created', 'payout_approved', 'setting_changed', etc.
  targetModel: { type: String, default: '' },          // 'User', 'Course', 'Payment', 'Coupon', etc.
  targetId: { type: mongoose.Schema.Types.ObjectId },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: {} },
  newValue: { type: mongoose.Schema.Types.Mixed, default: {} },
  details: { type: String, default: '' },              // Human-readable description
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
