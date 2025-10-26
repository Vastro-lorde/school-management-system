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
  department: String,
  hireDate: Date,
  photoUrl: String,
}, { timestamps: true });

module.exports = mongoose.models.StaffProfile || mongoose.model('StaffProfile', StaffProfileSchema);