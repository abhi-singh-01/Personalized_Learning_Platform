const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  duration: { type: Number, default: 0 },     // minutes attended
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, default: '' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const sharedFileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedAt: { type: Date, default: Date.now },
}, { _id: false });

const raisedHandSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  raisedAt: { type: Date, default: Date.now },
}, { _id: false });

const liveClassSchema = new mongoose.Schema({
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Room configuration
  roomId: { type: String, required: true, unique: true },
  roomName: { type: String, default: '' },
  roomType: { type: String, enum: ['jitsi', 'custom_webrtc', 'external'], default: 'jitsi' },
  externalLink: { type: String, default: '' },

  // State
  status: { type: String, enum: ['waiting', 'live', 'ended'], default: 'waiting' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  maxParticipants: { type: Number, default: 100 },

  // Attendance
  attendees: [attendeeSchema],
  peakAttendance: { type: Number, default: 0 },
  totalUniqueAttendees: { type: Number, default: 0 },

  // Recording
  recordingUrl: { type: String, default: '' },
  recordingSize: { type: Number, default: 0 },
  autoSaveAsMaterial: { type: Boolean, default: false },

  // Chat
  chatEnabled: { type: Boolean, default: true },
  chatMessages: [chatMessageSchema],

  // Shared files during class
  sharedFiles: [sharedFileSchema],
  raisedHands: [raisedHandSchema],

  // Metadata
  topic: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true });

liveClassSchema.index({ course: 1, status: 1 });
liveClassSchema.index({ educator: 1, status: 1 });
liveClassSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('LiveClass', liveClassSchema);
