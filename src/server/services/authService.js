import dbConnect from '../db/config';
import User from '../db/models/User';
import StudentProfile from '../db/models/StudentProfile';
import StaffProfile from '../db/models/StaffProfile';
import RegistrationToken from '../db/models/RegistrationToken';
import { ROLES } from '../../constants/enums.mjs';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './emailService';
import { generateToken } from './jwtService';

async function generateUniqueAdmissionNo() {
  // Format: STU-YYYY-XXXXXX
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    const admissionNo = `STU-${year}-${rand}`;
    const exists = await StudentProfile.findOne({ admissionNo }).lean();
    if (!exists) return admissionNo;
  }
  // fallback: crypto-based
  const fallback = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `STU-${year}-${fallback}`;
}

export async function signUp(userData) {
  await dbConnect();

  const { email, password, role, ...profileData } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash, role });

  let profile;
  if (role === 'student') {
    // Generate admission number on backend regardless of any client-provided value
    const admissionNo = await generateUniqueAdmissionNo();
    // Normalize client fields
    const { dateOfBirth, ...rest } = profileData;
    profile = new StudentProfile({
      ...rest,
      dob: dateOfBirth || profileData.dob,
      admissionNo,
      userId: user._id,
    });
    user.profileRef = profile._id;
    user.profileModel = 'StudentProfile';
  } else if (role === 'staff') {
    // For staff, keep provided fields as-is (could also generate employeeId similarly if desired)
    const { dateOfBirth, ...rest } = profileData;
    profile = new StaffProfile({ ...rest, dob: dateOfBirth || profileData.dob, userId: user._id });
    user.profileRef = profile._id;
    user.profileModel = 'StaffProfile';
  } else {
    throw new Error('Invalid role');
  }

  await profile.save();
  await user.save();

  return { user, profile };
}

export async function createRegistrationToken(email, role, { ttlMinutes = 60, meta = {} } = {}) {
  await dbConnect();
  if (!ROLES.includes(role)) throw new Error('Invalid role');
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const doc = await RegistrationToken.create({ email, role, token, expiresAt, meta });
  return { token: doc.token, expiresAt: doc.expiresAt };
}

export async function validateRegistrationToken(token) {
  await dbConnect();
  const invite = await RegistrationToken.findOne({ token }).lean();
  if (!invite) throw new Error('Invalid registration link');
  if (invite.consumed) throw new Error('Registration link already used');
  if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error('Registration link expired');
  return { email: invite.email, role: invite.role, expiresAt: invite.expiresAt, meta: invite.meta };
}

export async function completeRegistration(token, payload) {
  await dbConnect();
  const invite = await RegistrationToken.findOne({ token });
  if (!invite) throw new Error('Invalid registration link');
  if (invite.consumed) throw new Error('Registration link already used');
  if (invite.expiresAt.getTime() < Date.now()) throw new Error('Registration link expired');

  const { password, ...profileData } = payload || {};
  if (!password) throw new Error('Password is required');

  // Use email/role from invite; ignore any client-email/role
  const userData = { email: invite.email, password, role: invite.role, ...profileData };
  const { user, profile } = await signUp(userData);

  invite.consumed = true;
  await invite.save();

  return { user, profile };
}

export async function inviteUser(email, role, options = {}) {
  // create token and send email with link for registration
  const { token, expiresAt } = await createRegistrationToken(email, role, options);
  try {
    const { sendRegistrationEmail } = await import('./emailService');
    await sendRegistrationEmail(email, token);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[inviteUser] Failed to send email:', e?.message || e);
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return { token, expiresAt, link: `${baseUrl}/register/${token}` };
}

export async function login(email, password) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Ensure user has a linked profile where required
  if (user.role === 'student' && !user.profileRef) {
    throw new Error('Student profile not found. Please contact support.');
  }
  if (user.role === 'staff' && !user.profileRef) {
    throw new Error('Staff profile not found. Please contact support.');
  }

  const token = generateToken(user);
  return { user, token };
}

export async function forgotPassword(email) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  await user.save();
  await sendPasswordResetEmail(user.email, resetToken);
}

export async function resetPassword(token, password) {
  await dbConnect();

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Password reset token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
}
