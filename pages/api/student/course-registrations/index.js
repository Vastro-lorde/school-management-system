export default async function handler(req, res) {
  // Legacy endpoint: course-registrations has been replaced by course-forms.
  return res.status(410).json({ success: false, message: 'This endpoint is deprecated. Use /api/student/course-forms instead.' });
}