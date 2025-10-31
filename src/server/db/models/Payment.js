const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentItem', required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentType', required: true },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    items: {
      type: [LineItemSchema],
      validate: [arr => Array.isArray(arr) && arr.length > 0, 'At least one payment item is required'],
    },
    effectiveDate: { type: Date },
    dueDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure at least one class
PaymentSchema.path('classes').validate(function (arr) {
  return Array.isArray(arr) && arr.length > 0;
}, 'At least one class is required');

// Ensure at least one payment item
PaymentSchema.path('items').validate(function (arr) {
  return Array.isArray(arr) && arr.length > 0;
}, 'At least one payment item is required');

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
