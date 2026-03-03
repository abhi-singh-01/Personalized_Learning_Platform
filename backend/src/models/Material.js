const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  type: { type: String, enum: ['youtube', 'pdf', 'ppt', 'article'], required: true },
  url: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  videoId: { type: String, default: '' },
  content: { type: String, default: '' }, // For rich HTML content
  order: { type: Number, default: 0 },
}, { timestamps: true });

materialSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Material', materialSchema);