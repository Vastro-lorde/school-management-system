const mongoose = require('mongoose');
const { ROLES, PROFILE_MODELS } = require('../../../constants/enums.js');

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
    enum: ROLES,
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
    enum: PROFILE_MODELS,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);