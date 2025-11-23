import dotenv from 'dotenv';
import { sendInviteEmail } from '../src/server/services/emailService.js';

// Load env vars from .env file
dotenv.config();

const testEmail = async () => {
    const recipient = process.argv[2];

    if (!recipient) {
        console.error('Please provide a recipient email address.');
        console.log('Usage: node scripts/test-email.js <recipient-email>');
        process.exit(1);
    }

    console.log(`Attempting to send test invite email to: ${recipient}`);
    console.log(`Using provider: ${process.env.EMAIL_PROVIDER || 'default (nodemailer)'}`);

    try {
        // Mock token
        const token = 'test-token-12345';
        await sendInviteEmail(recipient, token);
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
};

testEmail();
