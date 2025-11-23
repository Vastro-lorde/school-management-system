import nodemailer from 'nodemailer';
import { GMAIL_USER, GOOGLE_APP_PASSWORD } from '../../../../constants/env.mjs';
import { APP_NAME } from '../../../../constants/appDetails.js';
import EmailProvider from './EmailProvider.js';

class NodemailerProvider extends EmailProvider {
    constructor() {
        super();
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GOOGLE_APP_PASSWORD,
            },
        });
    }

    async sendPasswordResetEmail(to, token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"${APP_NAME}" <${GMAIL_USER}>`,
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
            from: `"${APP_NAME}" <${GMAIL_USER}>`,
            to,
            subject: 'Complete your registration',
            html: `<p>Welcome! You've been invited to register for ${APP_NAME}.</p>
             <p>Click the link below to complete your registration:</p>
             <p><a href="${link}">${link}</a></p>
             <p>This link will expire. If you didn't expect this, please ignore the email.</p>`,
        };

        await this.transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending registration email:', err);
            } else {
                console.log('Registration email sent:', info.response);
            }
        });
    }

    async sendInviteEmail(to, token) {
        // Reusing registration logic for invite as they are often similar, 
        // but separating method for clarity and future customization.
        // Assuming 'invite' flow might use the same register link or a specific invite link.
        // Based on user request "we can also use the invite user", I'll implement a generic invite email.
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const link = `${baseUrl}/register/${token}`; // Assuming invite leads to registration
        const mailOptions = {
            from: `"${APP_NAME}" <${GMAIL_USER}>`,
            to,
            subject: 'You have been invited',
            html: `<p>You have been invited to join ${APP_NAME}.</p>
             <p>Click the link below to accept the invitation:</p>
             <p><a href="${link}">${link}</a></p>`,
        };

        await this.transporter.sendMail(mailOptions);
    }
}

export default NodemailerProvider;
