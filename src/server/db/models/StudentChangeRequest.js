const mongoose = require('mongoose');

const StudentChangeRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  // Proposed changes to apply to StudentProfile
  changes: {
    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    guardian: { name: String, phone: String, email: String },
    photoUrl: String,
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  },
  notes: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.StudentChangeRequest || mongoose.model('StudentChangeRequest', StudentChangeRequestSchema);
