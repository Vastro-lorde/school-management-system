import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const uri = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('Missing MONGO_URI or DATABASE_URL in environment.');
  process.exit(1);
}

const classSchema = new mongoose.Schema({}, { strict: false });
const studentProfileSchema = new mongoose.Schema({}, { strict: false });
const departmentSchema = new mongoose.Schema({}, { strict: false });

const ClassModel = mongoose.model('Class', classSchema, 'classes');
const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema, 'studentprofiles');
const DepartmentModel = mongoose.model('Department', departmentSchema, 'departments');

async function run() {
  try {
    await mongoose.connect(uri, {});

    const classes = await ClassModel.find({}).select('_id name departmentId department').lean();
    if (!classes.length) {
      console.log('No classes found; nothing to map');
      return;
    }

    const departments = await DepartmentModel.find({}).select('_id code name').lean();
    const codes = departments
      .filter(d => d.code)
      .map(d => ({ code: String(d.code).toUpperCase(), id: d._id }));

    const classToDept = new Map();
    for (const cls of classes) {
      if (!cls.name) continue;
      const nameUpper = String(cls.name).toUpperCase();
      const match = codes.find(d => nameUpper.includes(d.code));
      if (match) {
        classToDept.set(String(cls._id), match.id);
      }
    }

    if (!classToDept.size) {
      console.log('No class -> department mappings found; aborting');
      return;
    }

    const classBulkOps = [];
    for (const cls of classes) {
      const mappedDept = classToDept.get(String(cls._id));
      if (!mappedDept) continue;

      const updates = { departmentId: mappedDept };
      if (!cls.department) {
        updates.department = mappedDept;
      }

      if (!cls.departmentId || String(cls.departmentId) !== String(mappedDept) || !cls.department) {
        classBulkOps.push({
          updateOne: {
            filter: { _id: cls._id },
            update: { $set: updates },
          },
        });
      }
    }

    if (classBulkOps.length) {
      const classResult = await ClassModel.bulkWrite(classBulkOps);
      console.log('Class department fields updated. Matched:', classResult.matchedCount, 'Modified:', classResult.modifiedCount);
    } else {
      console.log('No class department field changes needed');
    }

    const students = await StudentProfile.find({
      classId: { $exists: true, $ne: null },
    }).select('_id classId departmentId').lean();

    if (!students.length) {
      console.log('No students with classId; nothing to update');
      return;
    }

    const bulkOps = [];
    for (const stu of students) {
      const currentDept = stu.departmentId;
      const mappedDept = classToDept.get(String(stu.classId));
      if (!mappedDept) continue;
      if (currentDept && String(currentDept) === String(mappedDept)) continue;

      bulkOps.push({
        updateOne: {
          filter: { _id: stu._id },
          update: { $set: { departmentId: mappedDept } },
        },
      });
    }

    if (!bulkOps.length) {
      console.log('No student departmentId changes needed');
      return;
    }

    const result = await StudentProfile.bulkWrite(bulkOps);
    console.log('Student department assignment complete. Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  } catch (err) {
    console.error('Department assignment failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
