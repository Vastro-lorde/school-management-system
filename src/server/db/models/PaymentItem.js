const mongoose = require('mongoose');

const PaymentItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    description: { type: String, default: '', trim: true },
    defaultAmount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.PaymentItem || mongoose.model('PaymentItem', PaymentItemSchema);
