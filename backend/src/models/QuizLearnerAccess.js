const mongoose = require('mongoose');

/** Per-learner overrides: extra attempts, temporary block (educator-managed). */
const quizLearnerAccessSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    extraAttempts: { type: Number, default: 0, min: 0 },
    blocked: { type: Boolean, default: false },
    blockReason: { type: String, default: '' },
    educatorNote: { type: String, default: '' },
    lastResolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

quizLearnerAccessSchema.index({ learner: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model('QuizLearnerAccess', quizLearnerAccessSchema);
