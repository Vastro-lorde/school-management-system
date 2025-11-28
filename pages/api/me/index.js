import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import User from '../../../src/server/db/models/User.js';
import StudentProfile from '../../../src/server/db/models/StudentProfile.js';
import StaffProfile from '../../../src/server/db/models/StaffProfile.js';
import { authOptions } from '../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  await dbConnect();

  const userId = session.user?.id;
  const role = session.user?.role;

  try {
    if (req.method === 'GET') {
      const user = await User.findById(userId).lean();
      let profile = null;
      if (role === 'student') {
        profile = await StudentProfile.findOne({ userId }).lean();
      } else if (role === 'staff' || role === 'admin' || role === 'teacher') {
        profile = await StaffProfile.findOne({ userId }).lean();
      }
      return res.status(200).json({ success: true, value: { user, profile } });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { avatarUrl, firstName, lastName, phone } = req.body || {};

      const userUpdate = {};
      if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl;

      const profileUpdate = {};
      if (firstName !== undefined) profileUpdate.firstName = firstName;
      if (lastName !== undefined) profileUpdate.lastName = lastName;
      if (phone !== undefined) profileUpdate.phone = phone;

      let profileModel = null;
      if (role === 'student') profileModel = StudentProfile;
      if (role === 'staff' || role === 'admin' || role === 'teacher') profileModel = StaffProfile;

      const updates = {};
      if (Object.keys(userUpdate).length) {
        updates.user = await User.findByIdAndUpdate(userId, { $set: userUpdate }, { new: true }).lean();
      }
      if (profileModel && Object.keys(profileUpdate).length) {
        updates.profile = await profileModel
          .findOneAndUpdate({ userId }, { $set: profileUpdate }, { new: true })
          .lean();
      }

      return res.status(200).json({ success: true, value: updates });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
