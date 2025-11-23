import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import ClassModel from '../../../../src/server/db/models/Class.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

function year() {
  return new Date().getFullYear();
}

async function generateUniqueAdmissionNo() {
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    const admissionNo = `STU-${year()}-${rand}`;
    const exists = await StudentProfile.findOne({ admissionNo }).lean();
    if (!exists) return admissionNo;
  }
  return `STU-${year()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function randomTempPassword() {
  // 12-char mixed case + digits default policy
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/register-student');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      email,
      password, // optional
      firstName,
      lastName,
      dob,
      gender,
      classId,
      guardian, // { name, phone, email }
    } = req.body || {};

    if (!email) return res.status(400).json({ success: false, message: 'email required' });
    if (!firstName) return res.status(400).json({ success: false, message: 'firstName required' });
    if (!lastName) return res.status(400).json({ success: false, message: 'lastName required' });

    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists' });

    if (classId) {
      const classExists = await ClassModel.exists({ _id: classId });
      if (!classExists) return res.status(400).json({ success: false, message: 'Invalid classId' });
    }

    const admissionNo = await generateUniqueAdmissionNo();
    const tempPassword = password && String(password).trim() ? String(password).trim() : randomTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({ email, passwordHash, role: 'student', isActive: true });
    const profile = await StudentProfile.create({
      userId: user._id,
      admissionNo,
      firstName,
      lastName,
      dob: dob ? new Date(dob) : undefined,
      gender: gender || undefined,
      classId: classId || undefined,
      guardian: guardian || undefined,
    });
    await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });

    return res.status(201).json({
      success: true,
      value: {
        user: { _id: user._id.toString(), email: user.email, role: user.role },
        profile: {
          _id: profile._id.toString(),
          admissionNo: profile.admissionNo,
          firstName: profile.firstName,
          lastName: profile.lastName,
        },
        tempPassword,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
