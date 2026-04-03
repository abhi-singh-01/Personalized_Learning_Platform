const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  payment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  educator:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:    { type: Number, required: true },           // Educator's share in INR
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed', 'cancelled'],
    default: 'pending',
  },
  scheduledAt:        { type: Date, required: true },    // Release after this date
  processedAt:        { type: Date },
  razorpayTransferId: { type: String, default: '' },
  transferData:       { type: mongoose.Schema.Types.Mixed, default: {} },
  notes:              { type: String, default: '' },
}, { timestamps: true });

payoutSchema.index({ educator: 1 });
payoutSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
