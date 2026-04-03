const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '', trim: true },
  comment: { type: String, default: '', trim: true },

  // Educator can reply
  educatorReply: { type: String, default: '' },
  repliedAt: { type: Date },

  // Moderation
  isReported: { type: Boolean, default: false },
  reportReason: { type: String, default: '' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isApproved: { type: Boolean, default: true },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },

  // Helpfulness
  helpful: { type: Number, default: 0 },
  helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// A learner can only review a course once
reviewSchema.index({ course: 1, learner: 1 }, { unique: true });
reviewSchema.index({ course: 1, isApproved: 1, rating: -1 });
reviewSchema.index({ isReported: 1, isApproved: 1 });

module.exports = mongoose.model('Review', reviewSchema);
