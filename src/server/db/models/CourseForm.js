const mongoose = require('mongoose');

// CourseForm defines a published set of courses for a given academic session and semester.
// It can be scoped to a faculty and/or department. Students submit selections against a form.
const CourseFormSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    sessionId: { type: String, required: true, trim: true }, // e.g., "2025/2026" or an external ID
    semester: { type: String, required: true, trim: true }, // e.g., "first", "second"
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
      index: true,
    },
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseFormSchema.index({ sessionId: 1, semester: 1, departmentId: 1, facultyId: 1 }, { unique: false });

module.exports = mongoose.models.CourseForm || mongoose.model('CourseForm', CourseFormSchema);
