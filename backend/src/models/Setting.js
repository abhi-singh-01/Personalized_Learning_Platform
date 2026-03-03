const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Personalized Learning Platform' },
    maintenanceMode: { type: Boolean, default: false },
    aiEnabled: { type: Boolean, default: true },
    geminiApiKey: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
