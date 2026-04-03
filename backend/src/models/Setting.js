const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Personalized Learning Platform' },
    maintenanceMode: { type: Boolean, default: false },
    aiEnabled: { type: Boolean, default: true },
    geminiApiKey: { type: String, default: '' },

    // Dynamic platform fees (admin-configurable)
    platformFeePercent: { type: Number, default: 2, min: 0, max: 50 },
    gstPercent: { type: Number, default: 18, min: 0, max: 100 },
    payoutDelayDays: { type: Number, default: 7, min: 1, max: 30 },

    // Educator settings
    allowEducatorSelfRegistration: { type: Boolean, default: true },
    requireEducatorVerification: { type: Boolean, default: false },
    maxCoursesPerEducator: { type: Number, default: 0 },          // 0 = unlimited
    maxConcurrentLiveClasses: { type: Number, default: 5 },       // Per-educator limit

    // Platform limits
    maxEnrollmentsPerCourse: { type: Number, default: 0 },        // 0 = unlimited
    maxFileSizeMB: { type: Number, default: 100 },

    // Currency & region
    defaultCurrency: { type: String, default: 'INR' },
    supportEmail: { type: String, default: '' },
    supportPhone: { type: String, default: '' },

    // Social links
    socialLinks: {
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },

    // Theme / BDUI global config
    theme: {
      primaryColor: { type: String, default: '#6366f1' },
      accentColor: { type: String, default: '#ec4899' },
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
    },

    // Global announcement bar (BDUI)
    announcement: {
      text: { type: String, default: '' },
      bgColor: { type: String, default: '#6366f1' },
      textColor: { type: String, default: '#ffffff' },
      linkTo: { type: String, default: '' },
      isActive: { type: Boolean, default: false },
    },

    // Live class defaults
    liveClassDefaults: {
      maxParticipants: { type: Number, default: 100 },
      chatEnabled: { type: Boolean, default: true },
      recordingEnabled: { type: Boolean, default: true },
      provider: { type: String, enum: ['jitsi', 'custom_webrtc', 'external'], default: 'jitsi' },
      jitsiDomain: { type: String, default: 'meet.jit.si' },
    },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
