import PaymentType from '../models/PaymentType.js';
import PaymentItem from '../models/PaymentItem.js';

export async function ensurePaymentMetadata() {
  const paymentTypes = [
    { name: 'school fees', description: 'Main tuition and charges', recurrence: 'session' },
    { name: 'acceptance fee', description: 'One-time acceptance fee for new students', recurrence: 'none' },
    { name: 'hostel fee', description: 'Accommodation charges', recurrence: 'session' },
  ];

  for (const pt of paymentTypes) {
    const exists = await PaymentType.findOne({ name: pt.name }).lean();
    if (!exists) {
      await PaymentType.create(pt);
      console.log('[seed-payments] Seeded payment type:', pt.name);
    }
  }

  const paymentItems = [
    { name: 'tuition', code: 'TUIT', description: 'Tuition component of school fees', defaultAmount: 50000 },
    { name: 'medical fee', code: 'MED', description: 'Medical examination and services', defaultAmount: 5000 },
    { name: 'library fee', code: 'LIB', description: 'Library access and services', defaultAmount: 3000 },
    { name: 'ict levy', code: 'ICT', description: 'ICT infrastructure levy', defaultAmount: 7000 },
  ];

  for (const pi of paymentItems) {
    const exists = await PaymentItem.findOne({ name: pi.name }).lean();
    if (!exists) {
      await PaymentItem.create(pi);
      console.log('[seed-payments] Seeded payment item:', pi.name);
    }
  }
}
