const mongoose = require('mongoose');
const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admissionNo: { type: String, index: true, required: true },
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  guardian: { name: String, phone: String, email: String },
  photoUrl: String,
}, { timestamps: true });
module.exports = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);