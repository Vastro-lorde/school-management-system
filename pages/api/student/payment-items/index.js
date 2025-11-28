import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import PaymentItem from '../../../../src/server/db/models/PaymentItem.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/payments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const items = await PaymentItem.find({ active: true })
      .select('name code description defaultAmount')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      value: items.map((i) => ({
        _id: i._id,
        name: i.name,
        code: i.code,
        description: i.description,
        defaultAmount: i.defaultAmount,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
