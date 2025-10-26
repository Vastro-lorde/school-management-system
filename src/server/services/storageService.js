import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import { FIREBASE_SERVICE_ACCOUNT } from '../../constants/env';

const serviceAccount = JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });
}

const bucket = getStorage().bucket();

export const uploadFile = async (filePath, destination) => {
  try {
    await bucket.upload(filePath, { destination });
    console.log(`${filePath} uploaded to ${destination}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const downloadFile = async (fileName, destination) => {
  try {
    const options = { destination };
    await bucket.file(fileName).download(options);
    console.log(`gs://${bucket.name}/${fileName} downloaded to ${destination}`);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileName) => {
  try {
    await bucket.file(fileName).delete();
    console.log(`gs://${bucket.name}/${fileName} deleted.`);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
