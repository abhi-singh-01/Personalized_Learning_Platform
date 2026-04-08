const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  role: { type: String, enum: ['learner', 'educator', 'admin'], required: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '', match: [/^\d{10}$/, 'Phone must be exactly 10 digits'] },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  profileComplete: { type: Boolean, default: false },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  assignedLearners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  aiLevel: { type: String, enum: ['Beginner', 'Developing', 'Proficient', 'Advanced'], default: 'Beginner' },
  engagementScore: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  totalQuizzesTaken: { type: Number, default: 0 },
  totalMaterialsViewed: { type: Number, default: 0 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
  },
  preferences: {
    dailyGoalMinutes: { type: Number, default: 30 },
    preferredSubjects: [String],
  },
  // Payment / educator onboarding
  razorpayAccountId: { type: String, default: '' },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    pan: { type: String, default: '' },
    gst: { type: String, default: '' },
    beneficiaryName: { type: String, default: '' },
  },

  // Device session management (max 2 devices per user)
  activeSessions: [{
    tokenId: { type: String, required: true },         // Unique session identifier (embedded in JWT)
    deviceInfo: { type: String, default: 'Unknown' },  // User-Agent parsed info
    ipAddress: { type: String, default: '' },
    loginAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  }],
  maxDevices: { type: Number, default: 2 },            // Configurable per user (admin can override)

  // Security
  isBlocked: { type: Boolean, default: false },
  blockedReason: { type: String, default: '' },
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String, default: '' },
}, { timestamps: true });

// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ engagementScore: 1 });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);