import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import PaymentDetail from '../../../../src/server/db/models/PaymentDetail.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/payment-insights');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { from, to } = req.query || {};
    const match = { status: 'completed' };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    // totals by month
    const byMonth = await PaymentDetail.aggregate([
      { $match: match },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    // totals by payment (with title)
    const byPayment = await PaymentDetail.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$payment',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: '_id',
          as: 'payment',
        },
      },
      { $unwind: '$payment' },
      { $project: { _id: 1, total: 1, count: 1, title: '$payment.title' } },
      { $sort: { total: -1 } },
    ]);

    // status counts
    const statusCounts = await PaymentDetail.aggregate([
      { $match: match.date ? { date: match.date } : {} },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    return res.status(200).json({ success: true, value: { byMonth, byPayment, statusCounts } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
