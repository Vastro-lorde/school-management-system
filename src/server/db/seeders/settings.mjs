import bcrypt from 'bcrypt';
import Setting from '../models/Setting.mjs';

const defaultSettings = [
  {
    key: 'about',
    value: {
      title: 'School Management Web App',
      description:
        'A comprehensive solution for managing school operations efficiently. This platform provides tools for managing students, staff, classes, attendance, grades, and more, all in one centralized system.',
    },
  },
  {
    key: 'contact',
    value: {
      email: 'seundanielomatsola@gmail.com',
      phone: '123-456-7890',
      address: '123 School Lane, Education City, 12345',
    },
  },
  {
    key: 'history',
    value: [
      {
        year: 2023,
        event: 'Project Inception',
        description:
          'The initial idea for the School Management Web App was conceived by a team of passionate developers aiming to streamline educational administration.',
      },
      {
        year: 2023,
        event: 'Team Formation',
        description: 'Group 6 was formed to bring the project to life, consisting of four dedicated members.',
        members: [
          { name: 'Seun Omatsola', role: 'Lead Developer' },
          { name: 'Pelumi Ogunleye', role: 'Backend Developer' },
          { name: 'ADEGBOYE TEMITAYO ELIZABETH', role: 'Frontend Developer' },
          { name: 'AKINKUNMI OMOLARA MARY', role: 'UI/UX Designer' },
        ],
      },
      {
        year: 2024,
        event: 'Version 1.0 Release',
        description:
          'The first official version of the School Management Web App was launched, offering core features for user and academic management.',
      },
    ],
  },
  {
    key: 'logo',
    value: {
      url: '/img/logo.png',
      alt: 'School Management System Logo',
    },
  },
];

export async function ensureSettings() {
  for (const s of defaultSettings) {
    const exists = await Setting.findOne({ key: s.key }).lean();
    if (!exists) {
      await Setting.create(s);
    }
  }
}

export async function ensureAdmin(defaultEmail, defaultPassword) {
  const User = (await import('../models/User.js')).default;
  let admin = await User.findOne({ email: defaultEmail }).lean();
  if (!admin) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await User.create({ email: defaultEmail, passwordHash, role: 'admin', isActive: true });
    console.log('[bootstrap] Seeded admin user:', defaultEmail);
  }
}
