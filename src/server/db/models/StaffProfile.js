const mongoose = require('mongoose');

const StaffProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
  },
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  // Deprecated: department (string) kept for backward compatibility
  department: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  hireDate: Date,
  photoUrl: String,
  avatarPublicId: String,
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
}, { timestamps: true });

module.exports = mongoose.models.StaffProfile || mongoose.model('StaffProfile', StaffProfileSchema);