const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: '' },
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tags: [String],
  isPublished: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 },        // 0 = free, > 0 = paid (INR)
  currency: { type: String, default: 'INR' },

  // Ratings & Reviews (aggregated from Review model)
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // Enrollment management
  totalEnrollments: { type: Number, default: 0 },
  maxEnrollments: { type: Number, default: 0 },        // 0 = unlimited
  enrollmentDeadline: { type: Date },

  // Admin features
  isFeatured: { type: Boolean, default: false },        // Admin can feature courses on homepage
  featuredOrder: { type: Number, default: 0 },          // Order in featured section

  // Course lifecycle
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'archived', 'rejected'],
    default: 'draft',
  },
  rejectionReason: { type: String, default: '' },

  // Policy
  refundPolicy: { type: String, enum: ['no_refund', '7_days', '30_days'], default: '7_days' },

  // SEO / preview
  shortDescription: { type: String, default: '', maxlength: 300 },
  previewVideoUrl: { type: String, default: '' },
}, { timestamps: true });

courseSchema.index({ educator: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Course', courseSchema);