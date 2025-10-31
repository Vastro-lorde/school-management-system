import dotenv from 'dotenv';
dotenv.config();

export const { 
    MONGO_URI,
    JWT_SECRET,
    BREVO_API_KEY,
    EMAIL_FROM,
    FIREBASE_SERVICE_ACCOUNT,
    BREVO_USER,
    ADMIN_API_KEY,
    ADMIN_SEED_EMAIL,
    ADMIN_SEED_PASSWORD,
    NEXT_PUBLIC_APP_URL,
} = process.env;
