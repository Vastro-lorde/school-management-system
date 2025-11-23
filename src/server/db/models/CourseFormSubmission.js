const mongoose = require('mongoose');

// A student's submission/selection for a specific CourseForm.
const CourseFormSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseForm', required: true, index: true },
    selectedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }],
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'submitted' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

CourseFormSubmissionSchema.index({ userId: 1, formId: 1 }, { unique: true });

module.exports = mongoose.models.CourseFormSubmission || mongoose.model('CourseFormSubmission', CourseFormSubmissionSchema);
