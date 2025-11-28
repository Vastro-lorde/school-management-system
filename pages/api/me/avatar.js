import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import User from '../../../src/server/db/models/User.js';
import StudentProfile from '../../../src/server/db/models/StudentProfile.js';
import StaffProfile from '../../../src/server/db/models/StaffProfile.js';
import { deleteImage } from '../../../src/server/services/cloudinaryService.js';
import { authOptions } from '../auth/[...nextauth].js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  await dbConnect();

  const userId = session.user?.id;
  const role = session.user?.role;
  const { newAvatarUrl, newAvatarPublicId } = req.body || {};

  if (!newAvatarUrl || !newAvatarPublicId) {
    return res.status(400).json({ success: false, message: 'newAvatarUrl and newAvatarPublicId are required' });
  }

  try {
    const user = await User.findById(userId).lean();
    let profileModel = null;
    if (role === 'student') profileModel = StudentProfile;
    if (role === 'staff' || role === 'admin' || role === 'teacher') profileModel = StaffProfile;

    let existingAvatarPath = null;

    if (profileModel) {
      const profile = await profileModel.findOne({ userId }).lean();
      if (profile && profile.avatarPublicId) {
        existingAvatarPath = profile.avatarPublicId;
      }
    }

    // Delete previous avatar from storage if we have a stored path
    if (existingAvatarPath) {
      try {
        await deleteImage(existingAvatarPath);
      } catch (e) {
        // Log but don’t fail the whole operation
        // eslint-disable-next-line no-console
        console.error('[me/avatar] Failed to delete previous avatar from storage:', e?.message || e);
      }
    }

    // Clear previous avatar info and set new one
    const updates = {};
    updates.user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: newAvatarUrl } },
      { new: true }
    ).lean();

    if (profileModel) {
      updates.profile = await profileModel
        .findOneAndUpdate(
          { userId },
          { $set: { photoUrl: newAvatarUrl, avatarPublicId: newAvatarPublicId } },
          { new: true }
        )
        .lean();
    }

    return res.status(200).json({ success: true, value: updates });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
