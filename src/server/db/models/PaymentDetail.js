const mongoose = require('mongoose');
const Payment = require('./Payment.js');

const InstallmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash', 'card', 'bank', 'mobile', 'other'], default: 'cash' },
    reference: { type: String, trim: true },
  },
  { timestamps: true }
);

const PaymentDetailSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    // If paid once, installments is empty and amount/method/reference/date describe the one-off payment.
    // If paid in installments, 'installments' holds entries and 'amount' is the total of installments.
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'card', 'bank', 'mobile', 'other'], default: 'cash' },
    reference: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    installments: { type: [InstallmentSchema], default: [] },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PaymentDetailSchema.path('amount').validate(function (v) {
  return typeof v === 'number' && v >= 0;
}, 'amount must be >= 0');

// Keep amount in sync if installments provided
PaymentDetailSchema.pre('validate', function (next) {
  if (Array.isArray(this.installments) && this.installments.length > 0) {
    const total = this.installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    this.amount = total;
  }
  next();
});

// Ensure that when marking as completed, the total paid amount meets or exceeds the payment's required total
PaymentDetailSchema.pre('validate', async function (next) {
  try {
    const status = this.status || 'completed';
    if (status !== 'completed') return next();
    if (!this.payment) return next();
    const paymentDoc = await Payment.findById(this.payment).select('items').lean();
    const requiredTotal = (paymentDoc?.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const paidTotal = Number(this.amount) || 0;
    if (paidTotal < requiredTotal) {
      return next(new Error('Amount paid is less than the required total for this payment.'));
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.models.PaymentDetail || mongoose.model('PaymentDetail', PaymentDetailSchema);
