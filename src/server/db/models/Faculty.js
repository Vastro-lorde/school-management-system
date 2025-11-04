const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    dean: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffProfile',
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

FacultySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
