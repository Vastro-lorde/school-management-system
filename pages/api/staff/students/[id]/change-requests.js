import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dbConnect from '../../../../../src/server/db/config.mjs';
import StudentProfile from '../../../../../src/server/db/models/StudentProfile.js';
import StudentChangeRequest from '../../../../../src/server/db/models/StudentChangeRequest.js';
import permissionService from '../../../../../src/server/services/permissionService.js';
import { uploadFile } from '../../../../../src/server/services/storageService.js';
import { authOptions } from '../../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/student-lookup');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { id } = req.query;
    const student = await StudentProfile.findById(id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { changes, notes, photoBase64 } = req.body || {};
    if (!changes || typeof changes !== 'object') return res.status(400).json({ success: false, message: 'changes object required' });

    let photoUrl = null;
    if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image')) {
      const match = photoBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
      if (match) {
        const ext = match[1].split('/')[1] || 'png';
        const buffer = Buffer.from(match[2], 'base64');
        const tmp = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`);
        fs.writeFileSync(tmp, buffer);
        const dest = `students/${id}/${Date.now()}.${ext}`;
        const url = await uploadFile(tmp, dest);
        try { fs.unlinkSync(tmp); } catch {}
        photoUrl = url;
      }
    }

    const payload = { ...changes };
    if (photoUrl) payload.photoUrl = photoUrl;

    const doc = await StudentChangeRequest.create({
      studentId: student._id,
      requestedBy: session.user?.id,
      departmentId: student.departmentId || undefined,
      changes: payload,
      notes,
      status: 'pending',
    });

    return res.status(201).json({ success: true, value: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
