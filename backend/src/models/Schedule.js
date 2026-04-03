const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  cancelReason: { type: String, default: '' },
  meetingLink: { type: String, default: '' },

  // Link to live class room
  liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass' },

  // Recurring schedule support
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'] },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],   // 0=Sunday, 6=Saturday
    endDate: { type: Date },
    parentSchedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },  // Reference to the original recurring schedule
  },

  // Capacity & notifications
  maxAttendees: { type: Number, default: 100 },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
}, { timestamps: true });

scheduleSchema.index({ course: 1, scheduledAt: 1 });
scheduleSchema.index({ educator: 1 });
scheduleSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
