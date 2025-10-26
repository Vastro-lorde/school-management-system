const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'staff', 'admin'],
    default: 'student',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  profileRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel',
  },
  profileModel: {
    type: String,
    enum: ['StudentProfile', 'StaffProfile'],
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);