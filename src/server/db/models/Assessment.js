const mongoose = require('mongoose');

const ASSESSMENT_KINDS = ['exam', 'test', 'quiz', 'assignment', 'classwork', 'project', 'other'];
const ASSESSMENT_STATUS = ['draft', 'scheduled', 'completed', 'cancelled'];

const AssessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  kind: { type: String, enum: ASSESSMENT_KINDS, required: true },
  // Target classes and subjects (supports multiple)
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  startAt: { type: Date },
  endAt: { type: Date },
  status: { type: String, enum: ASSESSMENT_STATUS, default: 'draft' },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile' },
  active: { type: Boolean, default: true },
  meta: { type: Object },
}, { timestamps: true });

AssessmentSchema.index({ startAt: 1 });
AssessmentSchema.index({ classIds: 1 });
AssessmentSchema.index({ subjectIds: 1 });

module.exports = mongoose.models.Assessment || mongoose.model('Assessment', AssessmentSchema);
