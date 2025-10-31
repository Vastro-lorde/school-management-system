const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  // Link to the Assessment this grade belongs to
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
  },
  score: Number,
  grade: String, // e.g., 'A', 'B', 'C'
  date: Date,
}, { timestamps: true });

module.exports = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);