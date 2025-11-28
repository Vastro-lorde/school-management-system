import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

dotenv.config({ path: '.env' });

const uri = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('Missing MONGO_URI or DATABASE_URL in environment.');
  process.exit(1);
}

const userSchema = new mongoose.Schema({}, { strict: false });
const studentProfileSchema = new mongoose.Schema({}, { strict: false });
const classSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema, 'users');
const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema, 'studentprofiles');
const ClassModel = mongoose.model('Class', classSchema, 'classes');

async function generateUniqueAdmissionNo() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    const admissionNo = `STU-${year}-${rand}`;
    const exists = await StudentProfile.findOne({ admissionNo }).lean();
    if (!exists) return admissionNo;
  }
  const fallback = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `STU-${year}-${fallback}`;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomGender() {
  return Math.random() < 0.5 ? 'male' : 'female';
}

function randomStudentDob() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const year = currentYear - (15 + Math.floor(Math.random() * 11));
  const month = Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return new Date(year, month, day);
}

async function run() {
  try {
    await mongoose.connect(uri, {});

    const classes = await ClassModel.find({}).select('_id').lean();
    if (!classes.length) {
      console.warn('No classes found; extra students will be created without classId');
    }

    const demoFirstNames = ['Ayo', 'Chioma', 'Tunde', 'Ngozi', 'Femi', 'Kemi', 'Sola', 'Hassan', 'Bisi', 'Ifeanyi'];
    const demoLastNames = ['Adeyemi', 'Okafor', 'Balogun', 'Olawale', 'Ojo', 'Mohammed', 'Eze', 'Ogunleye', 'Olawuyi', 'Emeka'];

    const defaultPasswordHash = await bcrypt.hash('Password1!', 10);

    const targetToCreate = 100;
    let created = 0;

    for (let i = 0; i < targetToCreate; i++) {
      const firstName = randomFrom(demoFirstNames);
      const lastName = randomFrom(demoLastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}-${Date.now()}-${i}@student.demo-university.edu.ng`;

      const exists = await User.findOne({ email }).lean();
      if (exists) {
        continue;
      }

      const user = await User.create({ email, passwordHash: defaultPasswordHash, role: 'student', isActive: true });
      const admissionNo = await generateUniqueAdmissionNo();
      const gender = randomGender();
      const dob = randomStudentDob();
      const classId = classes.length ? randomFrom(classes)._id : undefined;

      const profile = await StudentProfile.create({
        firstName,
        lastName,
        dob,
        gender,
        admissionNo,
        userId: user._id,
        ...(classId ? { classId } : {}),
      });

      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
      created += 1;
    }

    console.log(`Seeded ${created} extra students`);
  } catch (err) {
    console.error('Seeding extra students failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
