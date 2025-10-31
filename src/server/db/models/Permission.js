const mongoose = require('mongoose');
const { ROLES } = require('../../../constants/enums.js');

const PermissionSchema = new mongoose.Schema({
  role: { type: String, enum: ROLES, required: true, index: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, index: true },
  allowed: { type: Boolean, default: true },
}, { timestamps: true });

PermissionSchema.index({ role: 1, menuItem: 1 }, { unique: true });

module.exports = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
