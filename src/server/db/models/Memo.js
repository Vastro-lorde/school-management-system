const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['user', 'role', 'department', 'faculty'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, default: '' },
    contentType: { type: String, default: '' },
    size: { type: Number },
  },
  { _id: false }
);

const ReadBySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MemoSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    attachments: [AttachmentSchema],
    recipients: { type: [RecipientSchema], default: [] },
    // Optional memo type for workflows (e.g., student-position-request)
    type: { type: String, default: 'general' },
    payload: { type: Object, default: {} },
    status: { type: String, enum: ['sent', 'archived'], default: 'sent' },
    readBy: { type: [ReadBySchema], default: [] },
  },
  { timestamps: true }
);

MemoSchema.index({ 'recipients.type': 1, 'recipients.userId': 1, 'recipients.role': 1, 'recipients.departmentId': 1, 'recipients.facultyId': 1 });

module.exports = mongoose.models.Memo || mongoose.model('Memo', MemoSchema);
