import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const uri = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('Missing MONGO_URI or DATABASE_URL in environment.');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(uri, {});

    const ClassModel = mongoose.model(
      'Class',
      new mongoose.Schema({}, { strict: false }),
      'classes'
    );
    const StudentProfile = mongoose.model(
      'StudentProfile',
      new mongoose.Schema({}, { strict: false }),
      'studentprofiles'
    );

    const classes = await ClassModel.find({}).lean();
    if (!classes.length) {
      console.log('No classes found; nothing to assign');
      return;
    }

    const students = await StudentProfile.find({}).lean();
    if (!students.length) {
      console.log('No students found; nothing to assign');
      return;
    }

    // Shuffle students for randomness
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const updates = [];

    // Ensure every class has at least one student
    let index = 0;
    for (const cls of classes) {
      if (index >= shuffled.length) break;
      const student = shuffled[index];
      updates.push({ _id: student._id, classId: cls._id });
      index++;
    }

    // Distribute remaining students round-robin across classes
    let clsIndex = 0;
    for (; index < shuffled.length; index++) {
      const student = shuffled[index];
      const cls = classes[clsIndex];
      updates.push({ _id: student._id, classId: cls._id });
      clsIndex = (clsIndex + 1) % classes.length;
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { classId: u.classId } },
      },
    }));

    if (bulkOps.length) {
      const result = await StudentProfile.bulkWrite(bulkOps);
      console.log('Assigned classes. Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
    } else {
      console.log('No updates to apply');
    }
  } catch (err) {
    console.error('Assignment failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
