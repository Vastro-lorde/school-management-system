import nodemailer from 'nodemailer';
import { BREVO_API_KEY, EMAIL_FROM } from '@/constants/env';
import { APP_NAME } from '@/constants/appDetails';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '76bc6e001@smtp-brevo.com',
    pass: BREVO_API_KEY,
  },
});

export async function sendPasswordResetEmail(to, token) {
  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const mailOptions = {
    from: `"${APP_NAME}" <${EMAIL_FROM}>`,
    to,
    subject: 'Password Reset',
    html: `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
           <p>Please click on the following link, or paste this into your browser to complete the process:</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
  };

  await transporter.sendMail(mailOptions);
}