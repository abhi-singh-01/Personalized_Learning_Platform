const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: '' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

courseSchema.index({ teacher: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Course', courseSchema);