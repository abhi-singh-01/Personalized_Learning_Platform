const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
  }
}, { timestamps: true });

// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ engagementScore: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);