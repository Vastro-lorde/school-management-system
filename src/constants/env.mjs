import dotenv from 'dotenv';
dotenv.config();

export const { 
    MONGO_URI,
    JWT_SECRET,
    BREVO_API_KEY,
    EMAIL_FROM,
    FIREBASE_SERVICE_ACCOUNT,
    BREVO_USER,
} = process.env;
