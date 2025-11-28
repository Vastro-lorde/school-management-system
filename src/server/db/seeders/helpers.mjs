import bcrypt from 'bcrypt';
import ClassModel from '../models/Class.js';
import StudentProfile from '../models/StudentProfile.js';
import StaffProfile from '../models/StaffProfile.js';
import User from '../models/User.js';
import { generateUniqueAdmissionNo } from '@/server/utils/generators.js';

export function currentYear() {
  return new Date().getFullYear();
}

export async function ensureFacultiesAndDepartments(Faculty, Department, faculties) {
  for (const f of faculties) {
    let faculty = await Faculty.findOne({ name: f.name }).lean();
    if (!faculty) {
      faculty = await Faculty.create({ name: f.name, description: f.description });
      console.log('[seed-academic] Seeded faculty:', f.name);
    }

    const deptIds = [];
    for (const d of f.departments) {
      let dept = await Department.findOne({ code: d.code }).lean();
      if (!dept) {
        dept = await Department.create({ name: d.name, code: d.code });
        console.log('[seed-academic] Seeded department:', d.name);
      }
      deptIds.push(dept._id);
    }

    await Faculty.updateOne(
      { _id: faculty._id },
      { $addToSet: { departments: { $each: deptIds } } }
    );
  }
}

export async function ensureClassesForDepartments(Department, levels, stopAt400Codes = []) {
  const allDepartments = await Department.find({}).lean();
  for (const dept of allDepartments) {
    const stopAt400 = stopAt400Codes.includes(dept.code);
    for (const lvl of levels) {
      if (stopAt400 && Number(lvl) > 400) continue;
      const name = `${dept.code || dept.name} ${lvl} Level`;
      const exists = await ClassModel.findOne({ name }).lean();
      if (!exists) {
        await ClassModel.create({ name, level: lvl, year: currentYear() });
        console.log('[seed-academic] Seeded class:', name);
      }
    }
  }
}

export async function ensureDemoStaffAndStudents({ targetStaffTotal = 25, targetStudentTotal = 50 } = {}) {
  const defaultPasswordHash = await bcrypt.hash('Password1!', 10);

  const nigerianFirstNames = ['Ayo', 'Chioma', 'Tunde', 'Ngozi', 'Femi', 'Kemi', 'Sola', 'Hassan', 'Bisi', 'Ifeanyi'];
  const nigerianLastNames = ['Adeyemi', 'Okafor', 'Balogun', 'Olawale', 'Ojo', 'Mohammed', 'Eze', 'Ogunleye', 'Olawuyi', 'Emeka'];

  const classes = await ClassModel.find({}).lean();
  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const existingStaffCount = await User.countDocuments({ role: 'staff' });
  const toCreateStaff = Math.max(0, targetStaffTotal - existingStaffCount);

  for (let i = 0; i < toCreateStaff; i++) {
    try {
      const firstName = randomFrom(nigerianFirstNames);
      const lastName = randomFrom(nigerianLastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@demo-university.edu.ng`;

      const exists = await User.findOne({ email }).lean();
      const employeeId = `EMP-DEMO-${1000 + i}`;
      const employeeIdTaken = await StaffProfile.findOne({ employeeId }).lean();
      if (exists || employeeIdTaken) continue;

      const deptName = randomFrom([
        'Computer Science',
        'Electrical and Electronics Engineering',
        'Economics',
        'Mechanical Engineering',
        'Mass Communication',
      ]);

      const user = await User.create({ email, passwordHash: defaultPasswordHash, role: 'staff', isActive: true });
      const profile = await StaffProfile.create({
        firstName,
        lastName,
        department: deptName,
        position: i < 20 ? 'Lecturer' : 'Administrative Staff',
        employeeId,
        dob: new Date('1985-01-01'),
        userId: user._id,
      });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StaffProfile' } });
      console.log('[seed-academic] Seeded demo staff:', email);
    } catch (err) {
      console.error('[seed-academic] Failed seeding demo staff:', err?.message || err);
    }
  }

  const existingStudentCount = await User.countDocuments({ role: 'student' });
  const toCreateStudents = Math.max(0, targetStudentTotal - existingStudentCount);

  for (let i = 0; i < toCreateStudents; i++) {
    try {
      const firstName = randomFrom(nigerianFirstNames);
      const lastName = randomFrom(nigerianLastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.demo-university.edu.ng`;

      const exists = await User.findOne({ email }).lean();
      if (exists) continue;

      const user = await User.create({ email, passwordHash: defaultPasswordHash, role: 'student', isActive: true });
      const admissionNo = await generateUniqueAdmissionNo();

      let classId = null;
      if (classes.length > 0) {
        classId = randomFrom(classes)?._id || null;
      }

      const profile = await StudentProfile.create({
        firstName,
        lastName,
        dob: new Date('2005-01-01'),
        admissionNo,
        classId,
        userId: user._id,
      });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
      console.log('[seed-academic] Seeded demo student:', email);
    } catch (err) {
      console.error('[seed-academic] Failed seeding demo student:', err?.message || err);
    }
  }
}
