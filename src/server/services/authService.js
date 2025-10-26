import dbConnect from '../db/config';
import User from '../db/models/User';
import StudentProfile from '../db/models/StudentProfile';
import StaffProfile from '../db/models/StaffProfile';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './emailService';
import { generateToken } from './jwtService';

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
    profile = new StudentProfile({ ...profileData, userId: user._id });
    user.profileRef = profile._id;
    user.profileModel = 'StudentProfile';
  } else if (role === 'staff') {
    profile = new StaffProfile({ ...profileData, userId: user._id });
    user.profileRef = profile._id;
    user.profileModel = 'StaffProfile';
  } else {
    throw new Error('Invalid role');
  }

  await profile.save();
  await user.save();

  return { user, profile };
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
