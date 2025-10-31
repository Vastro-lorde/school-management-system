const mongoose = require('mongoose');

const PaymentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    recurrence: { type: String, enum: ['none', 'term', 'semester', 'session', 'annual', 'monthly'], default: 'none' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.PaymentType || mongoose.model('PaymentType', PaymentTypeSchema);
