import { EMAIL_PROVIDER } from '../../constants/env.mjs';
import NodemailerProvider from './email/providers/nodemailerProvider.js';
import BrevoProvider from './email/providers/brevoProvider.js';

const getEmailProvider = () => {
  console.log(`Using email provider: ${EMAIL_PROVIDER}`);
  switch (EMAIL_PROVIDER) {
    case 'brevo':
      return new BrevoProvider();
    case 'nodemailer':
    default:
      return new NodemailerProvider();
  }
};

const emailProvider = getEmailProvider();

export async function sendPasswordResetEmail(to, token) {
  await emailProvider.sendPasswordResetEmail(to, token);
}

export async function sendRegistrationEmail(to, token) {
  await emailProvider.sendRegistrationEmail(to, token);
}

export async function sendInviteEmail(to, token) {
  await emailProvider.sendInviteEmail(to, token);
}