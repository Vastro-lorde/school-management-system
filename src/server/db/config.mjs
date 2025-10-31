import mongoose from 'mongoose';
import { MONGO_URI } from '../../constants/env.mjs';
<<<<<<< HEAD
import { runBootstrap } from './bootstrap.mjs';
=======
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then(async (mongoose) => {
      // run idempotent bootstrap after connection
      try {
        await runBootstrap();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[dbConnect] Bootstrap failed:', e?.message || e);
      }
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;