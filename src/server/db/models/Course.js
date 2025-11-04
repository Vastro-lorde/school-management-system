const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    creditHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: String,
      default: '',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CourseSchema.index({ title: 1 });
CourseSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);
