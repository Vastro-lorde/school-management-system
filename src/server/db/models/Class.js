const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffProfile',
  },
  level: String,
  year: Number,
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
}, { timestamps: true });

module.exports = mongoose.models.Class || mongoose.model('Class', ClassSchema);