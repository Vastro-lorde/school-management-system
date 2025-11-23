import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import CourseForm from '../../../../src/server/db/models/CourseForm.js';
import CourseFormSubmission from '../../../../src/server/db/models/CourseFormSubmission.js';
import Course from '../../../../src/server/db/models/Course.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/course-registration');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const user = await User.findById(session.user?.id).select('profileRef').lean();
    const profile = await StudentProfile.findById(user?.profileRef).select('facultyId departmentId courseFormSubmissionIds').lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.method === 'GET') {
      const { sessionId, semester } = req.query;
      // Filter published course forms by faculty/department (if scoped) and optional session/semester query
      const q = { status: 'published', active: true };
      if (sessionId) q.sessionId = sessionId;
      if (semester) q.semester = semester;
      // Only include forms that either match student's faculty/department or are global (unscoped)
      q.$and = [
        { $or: [
          { facultyId: { $exists: false } },
          { facultyId: null },
          { facultyId: profile.facultyId || null },
        ] },
        { $or: [
          { departmentId: { $exists: false } },
          { departmentId: null },
          { departmentId: profile.departmentId || null },
        ] }
      ];

      const forms = await CourseForm.find(q)
        .populate('courses')
        .populate('facultyId','name')
        .populate('departmentId','name code')
        .sort({ createdAt: -1 })
        .lean();

      // Load existing submissions by student for these forms
      const formIds = forms.map(f => f._id);
      const submissions = formIds.length ? await CourseFormSubmission.find({ userId: session.user?.id, formId: { $in: formIds } }).populate('selectedCourses').lean() : [];
      const submissionMap = new Map(submissions.map(s => [String(s.formId), s]));

      const value = forms.map(f => ({
        _id: f._id,
        name: f.name,
        sessionId: f.sessionId,
        semester: f.semester,
        faculty: f.facultyId || null,
        department: f.departmentId || null,
        status: f.status,
        approved: f.approved,
        courses: (f.courses||[]).map(c => ({ _id: c._id, title: c.title, code: c.code, creditHours: c.creditHours, level: c.level })),
        submission: submissionMap.get(String(f._id)) || null,
      }));

      return res.status(200).json({ success: true, value });
    }

    if (req.method === 'POST') {
      const { formId, selectedCourseIds } = req.body || {};
      if (!formId) return res.status(400).json({ success: false, message: 'formId required' });
      const form = await CourseForm.findById(formId).populate('courses').lean();
      if (!form) return res.status(404).json({ success: false, message: 'Course form not found' });
      if (form.status !== 'published') return res.status(400).json({ success: false, message: 'Form not open for submissions' });

      const allowedCourseIds = new Set((form.courses||[]).map(c => String(c._id)));
      if (!Array.isArray(selectedCourseIds) || selectedCourseIds.length === 0) return res.status(400).json({ success: false, message: 'selectedCourseIds required' });
      const allValid = selectedCourseIds.every(id => allowedCourseIds.has(String(id)));
      if (!allValid) return res.status(400).json({ success: false, message: 'One or more selected courses are not part of the form' });

      let submission = await CourseFormSubmission.findOne({ userId: session.user?.id, formId }).lean();
      if (submission) {
        await CourseFormSubmission.updateOne({ _id: submission._id }, { $set: { selectedCourses: selectedCourseIds } });
      } else {
        submission = await CourseFormSubmission.create({ userId: session.user?.id, studentProfileId: profile._id, formId, selectedCourses: selectedCourseIds });
        await StudentProfile.updateOne({ _id: profile._id }, { $addToSet: { courseFormSubmissionIds: submission._id } });
      }
      const populated = await CourseFormSubmission.findById(submission._id).populate('selectedCourses').lean();
      return res.status(200).json({ success: true, value: populated });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
