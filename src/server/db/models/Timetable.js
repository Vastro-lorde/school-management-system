const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  day: {
    type: String, // e.g., 'Monday', 'Tuesday'
  },
  periods: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile' },
    startTime: String,
    endTime: String,
  }],
});

module.exports = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);