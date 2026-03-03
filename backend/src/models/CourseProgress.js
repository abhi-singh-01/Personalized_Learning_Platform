const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedMaterials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }]
}, { timestamps: true });

courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
