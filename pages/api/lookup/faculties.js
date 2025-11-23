import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import Faculty from '../../../src/server/db/models/Faculty.js';
import { authOptions } from '../auth/[...nextauth].js';

// GET /api/lookup/faculties -> minimal list of active faculties for selection
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const rows = await Faculty.find({ active: true }).select('_id name').sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, value: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
