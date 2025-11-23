import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import {
  FIREBASE_TYPE,
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_AUTH_URI,
  FIREBASE_TOKEN_URI,
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  FIREBASE_CLIENT_X509_CERT_URL,
  FIREBASE_UNIVERSE_DOMAIN,
} from '../../constants/env';

const serviceAccount = {
  type: FIREBASE_TYPE || 'service_account',
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: (FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });
}

const bucket = getStorage().bucket();

export const getPublicUrl = (destination) => `https://storage.googleapis.com/${bucket.name}/${destination}`;
export const getBucketName = () => bucket.name;

export const uploadFile = async (filePath, destination) => {
  try {
    await bucket.upload(filePath, { destination });
    console.log(`${filePath} uploaded to ${destination}`);
    return getPublicUrl(destination);
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
