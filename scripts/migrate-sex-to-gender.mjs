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

    const StudentProfile = mongoose.model(
      'StudentProfile',
      new mongoose.Schema({}, { strict: false }),
      'studentprofiles'
    );

    const result = await StudentProfile.updateMany(
      {}, // Filter: Match all documents
        [   // Update: Use an array to signify an Aggregation Pipeline
            {
            $set: {
                gender: {
                $cond: {
                    if: { $gte: [{ $rand: {} }, 0.5] },
                    then: "male",
                    else: "female"
                }
                }
            }
            }
        ]
    );

    console.log('Migration complete. Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
