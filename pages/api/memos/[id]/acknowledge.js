import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Memo from '../../../../src/server/db/models/Memo.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const memo = await Memo.findById(id).select('readBy').lean();
    if (!memo) return res.status(404).json({ success: false, message: 'Not found' });

    const userId = session.user?.id;
    const has = (memo.readBy || []).some(rb => String(rb.userId) === String(userId));
    if (!has) await Memo.updateOne({ _id: id }, { $push: { readBy: { userId, readAt: new Date() } } });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
