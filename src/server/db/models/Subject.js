const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    unique: true,
  },
  department: String,
}, { timestamps: true });

module.exports = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);