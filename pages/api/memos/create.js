import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import Memo from '../../../src/server/db/models/Memo.js';
import permissionService from '../../../src/server/services/permissionService.js';
import { authOptions } from '../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/memos/new');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { subject, body, recipients, type, payload } = req.body || {};
    if (!Array.isArray(recipients) || recipients.length === 0) return res.status(400).json({ success: false, message: 'Recipients required' });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject required' });

    // Basic validation for recipients objects
    for (const r of recipients) {
      if (!r.type || !['user','role','department','faculty'].includes(r.type)) {
        return res.status(400).json({ success: false, message: 'Invalid recipient type' });
      }
    }

    const doc = await Memo.create({
      senderUserId: session.user?.id,
      subject,
      body: body || '',
      recipients: recipients.map(r => ({ type: r.type, userId: r.userId || null, role: r.role || null, departmentId: r.departmentId || null, facultyId: r.facultyId || null })),
      type: type || 'general',
      payload: payload || {},
    });

    return res.status(201).json({ success: true, value: { _id: doc._id } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
