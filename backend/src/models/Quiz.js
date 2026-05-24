const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [questionSchema],
  /** Minutes allowed per submitted attempt (client-enforced; server accepts timeTaken). */
  timeLimit: { type: Number, default: 15 },
  /** Max completed submissions per learner (Progress rows). */
  maxAttempts: { type: Number, default: 1, min: 1 },
  /** Quiz becomes available at this instant (UTC). Null = no start restriction. */
  availableFrom: { type: Date, default: null },
  /** Quiz closes after this instant (UTC). Null = no end restriction. */
  availableUntil: { type: Date, default: null },
  isAIGenerated: { type: Boolean, default: false },
}, { timestamps: true });

quizSchema.index({ course: 1 });
quizSchema.index({ educator: 1 });

module.exports = mongoose.model('Quiz', quizSchema);