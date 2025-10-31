const mongoose = require('mongoose');
const { ROLES } = require('../../../constants/enums.js');

const RegistrationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  role: { type: String, enum: ROLES, required: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  consumed: { type: Boolean, default: false },
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.RegistrationToken || mongoose.model('RegistrationToken', RegistrationTokenSchema);
