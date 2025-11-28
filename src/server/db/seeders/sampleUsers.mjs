import bcrypt from 'bcrypt';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import StaffProfile from '../models/StaffProfile.js';
import { generateUniqueAdmissionNo } from '@/server/utils/generators.js';

export async function ensureSampleStaffAndStudents() {
  const staffList = [
    {
      email: 'staff1@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      department: 'Mathematics',
      position: 'Lecturer',
      employeeId: 'EMP1001',
      dob: new Date('1990-01-01'),
    },
    {
      email: 'staff2@example.com',
      firstName: 'Bob',
      lastName: 'Smith',
      department: 'Science',
      position: 'Lab Tech',
      employeeId: 'EMP1002',
      dob: new Date('1988-06-15'),
    },
  ];

  const defaultPasswordHash = await bcrypt.hash('Password1!', 10);

  for (const s of staffList) {
    const exists = await User.findOne({ email: s.email }).lean();
    if (!exists) {
      const user = await User.create({ email: s.email, passwordHash: defaultPasswordHash, role: 'staff', isActive: true });
      const profile = await StaffProfile.create({ ...s, userId: user._id });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StaffProfile' } });
      console.log('[bootstrap] Seeded staff:', s.email);
    }
  }

  const studentList = [
    { email: 'student1@example.com', firstName: 'Charlie', lastName: 'Brown', dob: new Date('2006-03-12'), sex: 'male' },
    { email: 'student2@example.com', firstName: 'Dana', lastName: 'Lee', dob: new Date('2007-09-25'), sex: 'female' },
  ];

  for (const s of studentList) {
    const exists = await User.findOne({ email: s.email }).lean();
    if (!exists) {
      const user = await User.create({ email: s.email, passwordHash: defaultPasswordHash, role: 'student', isActive: true });
      const admissionNo = await generateUniqueAdmissionNo();
      const profile = await StudentProfile.create({ ...s, admissionNo, userId: user._id });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
      console.log('[bootstrap] Seeded student:', s.email);
    }
  }

  // Ensure there are at least 50 demo students in total
  const existingStudentCount = await User.countDocuments({ role: 'student' });
  const targetStudentTotal = 50;
  const toCreate = Math.max(0, targetStudentTotal - existingStudentCount);

  const demoFirstNames = ['Ayo', 'Chioma', 'Tunde', 'Ngozi', 'Femi', 'Kemi', 'Sola', 'Hassan', 'Bisi', 'Ifeanyi'];
  const demoLastNames = ['Adeyemi', 'Okafor', 'Balogun', 'Olawale', 'Ojo', 'Mohammed', 'Eze', 'Ogunleye', 'Olawuyi', 'Emeka'];

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomSex() {
    return Math.random() < 0.5 ? 'male' : 'female';
  }

  // Roughly 15-25 years old Nigerian students
  function randomStudentDob() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const year = currentYear - (15 + Math.floor(Math.random() * 11)); // 15-25
    const month = Math.floor(Math.random() * 12); // 0-11
    const day = 1 + Math.floor(Math.random() * 28); // 1-28 for safety
    return new Date(year, month, day);
  }

  for (let i = 0; i < toCreate; i++) {
    const firstName = randomFrom(demoFirstNames);
    const lastName = randomFrom(demoLastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.demo-university.edu.ng`;

    const exists = await User.findOne({ email }).lean();
    if (exists) continue;

    const user = await User.create({ email, passwordHash: defaultPasswordHash, role: 'student', isActive: true });
    const admissionNo = await generateUniqueAdmissionNo();
    const profile = await StudentProfile.create({
      firstName,
      lastName,
      dob: randomStudentDob(),
      sex: randomSex(),
      admissionNo,
      userId: user._id,
    });
    await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
    console.log('[bootstrap] Seeded extra demo student:', email);
  }
}
