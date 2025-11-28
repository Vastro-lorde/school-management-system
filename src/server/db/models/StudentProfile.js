const mongoose = require('mongoose');
const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admissionNo: { type: String, index: true, required: true },
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  guardian: { name: String, phone: String, email: String },
  photoUrl: String,
  avatarPublicId: String,
  // Student position (at most one)
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  // Historical submissions to course forms (one per form)
  courseFormSubmissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseFormSubmission' }],
}, { timestamps: true });
module.exports = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);