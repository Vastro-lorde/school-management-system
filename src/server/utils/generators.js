import StudentProfile from '../db/models/StudentProfile.js';

function currentYear() {
  return new Date().getFullYear();
}

export async function generateUniqueAdmissionNo() {
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    const admissionNo = `STU-${currentYear()}-${rand}`;
    const exists = await StudentProfile.findOne({ admissionNo }).lean();
    if (!exists) return admissionNo;
  }
  return `STU-${currentYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
