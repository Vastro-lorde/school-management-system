const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, unique: true, sparse: true, trim: true },
  description: { type: String, default: '' },
  // Allowed user roles that can hold this position (e.g., ['staff','teacher'])
  allowedRoles: [{ type: String }],
  // Convenience flag for positions only available to 'staff'
  staffOnly: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.Position || mongoose.model('Position', PositionSchema);
