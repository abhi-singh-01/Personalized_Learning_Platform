const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
  }],
  score: { type: Number, required: true },
  timeTaken: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
});

progressSchema.index({ student: 1, course: 1 });
progressSchema.index({ student: 1, quiz: 1 });
progressSchema.index({ completedAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);