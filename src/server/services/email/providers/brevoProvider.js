import nodemailer from 'nodemailer';
import { BREVO_API_KEY, EMAIL_FROM, BREVO_USER } from '../../../../constants/env.mjs';
import { APP_NAME } from '../../../../constants/appDetails.js';
import EmailProvider from './EmailProvider.js';

class BrevoProvider extends EmailProvider {
    constructor() {
        super();
        this.transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: BREVO_USER,
                pass: BREVO_API_KEY,
            },
        });
    }

    async sendPasswordResetEmail(to, token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"${APP_NAME}" <${EMAIL_FROM}>`,
            to,
            subject: 'Password Reset',
            html: `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
             <p>Please click on the following link, or paste this into your browser to complete the process:</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendRegistrationEmail(to, token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const link = `${baseUrl}/register/${token}`;
        const mailOptions = {
            from: `"${APP_NAME}" <${EMAIL_FROM}>`,
            to,
            subject: 'Complete your registration',
            html: `<p>Welcome! You've been invited to register for ${APP_NAME}.</p>
             <p>Click the link below to complete your registration:</p>
             <p><a href="${link}">${link}</a></p>
             <p>This link will expire. If you didn't expect this, please ignore the email.</p>`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendInviteEmail(to, token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const link = `${baseUrl}/register/${token}`;
        const mailOptions = {
            from: `"${APP_NAME}" <${EMAIL_FROM}>`,
            to,
            subject: 'You have been invited',
            html: `<p>You have been invited to join ${APP_NAME}.</p>
             <p>Click the link below to accept the invitation:</p>
             <p><a href="${link}">${link}</a></p>`,
        };

        await this.transporter.sendMail(mailOptions);
    }
}

export default BrevoProvider;
