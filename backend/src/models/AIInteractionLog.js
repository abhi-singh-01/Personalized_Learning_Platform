const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['study-plan', 'quiz-generation', 'feedback'], required: true },
  input: { type: mongoose.Schema.Types.Mixed },
  output: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

aiLogSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('AIInteractionLog', aiLogSchema);