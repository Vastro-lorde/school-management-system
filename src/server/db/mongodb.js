import { MongoClient } from 'mongodb';
import { MONGO_URI } from '../../constants/env.mjs';

const isBuildTime = process.env.npm_lifecycle_event === 'build';
const missingUriError = !MONGO_URI
  ? new Error('Please define the MONGO_URI environment variable inside .env.local')
  : null;

const uri = MONGO_URI;
const options = {};

let client;
let clientPromise;

if (!MONGO_URI) {
  if (isBuildTime) {
    clientPromise = Promise.resolve(null);
  } else {
    clientPromise = Promise.reject(missingUriError);
    // prevent unhandled rejection warnings when the promise isn't consumed
    clientPromise.catch(() => {});
  }
} else if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
