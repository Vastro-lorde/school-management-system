import mongoose from 'mongoose';
import { MONGO_URI } from '../../constants/env.mjs';
import { runBootstrap } from './bootstrap.mjs';

const isBuildTime = process.env.npm_lifecycle_event === 'build';
const missingUriError = !MONGO_URI
  ? new Error('Please define the MONGO_URI environment variable inside .env.local')
  : null;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let bootstrapStarted = false;

async function dbConnect() {
  if (!MONGO_URI) {
    if (isBuildTime) {
      return null;
    }
    throw missingUriError;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;

  // Kick off bootstrap once per process, but do not block the caller
  if (!bootstrapStarted) {
    bootstrapStarted = true;
    runBootstrap().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[dbConnect] Background bootstrap failed:', e?.message || e);
    });
  }

  return cached.conn;
}

export default dbConnect;
