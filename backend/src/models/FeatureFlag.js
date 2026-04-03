const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },   // e.g. 'ai_quiz', 'live_chat', 'dark_mode'
  description: { type: String, default: '' },
  isEnabled: { type: Boolean, default: false },
  enabledForRoles: [{ type: String, enum: ['learner', 'educator', 'admin'] }],
  enabledForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },    // Gradual rollout
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },           // Extra config for the feature
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

featureFlagSchema.index({ name: 1, isEnabled: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
