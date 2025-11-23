import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import User from '../../../src/server/db/models/User.js';
import StudentProfile from '../../../src/server/db/models/StudentProfile.js';
import StaffProfile from '../../../src/server/db/models/StaffProfile.js';
import { authOptions } from '../auth/[...nextauth].js';

// GET /api/lookup/users?q=term&role=optional
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { q, role } = req.query || {};
    const term = String(q || '').trim();
    if (!term) return res.status(200).json({ success: true, value: [] });

    const limit = 15;
    const out = [];

    if (!role || role === 'student') {
      const students = await StudentProfile.find({ $or: [
        { firstName: new RegExp(term, 'i') },
        { lastName: new RegExp(term, 'i') },
        { admissionNo: new RegExp(term, 'i') },
      ] }).limit(limit).lean();
      for (const s of students) {
        const user = await User.findOne({ profileRef: s._id, profileModel: 'StudentProfile' }).select('_id').lean();
        if (user) out.push({ role: 'student', userId: user._id, label: `${s.firstName||''} ${s.lastName||''} (${s.admissionNo})` });
      }
    }

    if (!role || role === 'staff' || role === 'teacher') {
      const staff = await StaffProfile.find({ $or: [
        { firstName: new RegExp(term, 'i') },
        { lastName: new RegExp(term, 'i') },
        { employeeId: new RegExp(term, 'i') },
      ] }).limit(limit).lean();
      for (const s of staff) {
        const user = await User.findOne({ profileRef: s._id, profileModel: 'StaffProfile' }).select('_id role').lean();
        if (user) out.push({ role: user.role || 'staff', userId: user._id, label: `${s.firstName||''} ${s.lastName||''} (${s.employeeId||'staff'})` });
      }
    }

    return res.status(200).json({ success: true, value: out });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
