import bcrypt from 'bcrypt';
import Setting from './models/Setting.mjs';
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';
import StaffProfile from './models/StaffProfile.js';
import MenuItem from './models/MenuItem.js';
import Permission from './models/Permission.js';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'omatsolaseund@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';

const defaultSettings = [
  {
    key: 'about',
    value: {
      title: 'School Management Web App',
      description:
        "A comprehensive solution for managing school operations efficiently. This platform provides tools for managing students, staff, classes, attendance, grades, and more, all in one centralized system.",
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

function year() {
  return new Date().getFullYear();
}

async function generateUniqueAdmissionNo() {
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    const admissionNo = `STU-${year()}-${rand}`;
    const exists = await StudentProfile.findOne({ admissionNo }).lean();
    if (!exists) return admissionNo;
  }
  // final fallback
  return `STU-${year()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function ensureSettings() {
  for (const s of defaultSettings) {
    const exists = await Setting.findOne({ key: s.key }).lean();
    if (!exists) {
      await Setting.create(s);
    }
  }
}

async function ensureAdmin() {
  let admin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL }).lean();
  if (!admin) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await User.create({ email: DEFAULT_ADMIN_EMAIL, passwordHash, role: 'admin', isActive: true });
    // eslint-disable-next-line no-console
    console.log('[bootstrap] Seeded admin user:', DEFAULT_ADMIN_EMAIL);
  }
}

async function ensureSampleStaffAndStudents() {
  const staffList = [
    {
      email: 'staff1@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      department: 'Mathematics',
      position: 'Lecturer',
      employeeId: 'EMP1001',
      dob: new Date('1990-01-01'),
    },
    {
      email: 'staff2@example.com',
      firstName: 'Bob',
      lastName: 'Smith',
      department: 'Science',
      position: 'Lab Tech',
      employeeId: 'EMP1002',
      dob: new Date('1988-06-15'),
    },
  ];

  const defaultPasswordHash = await bcrypt.hash('Password1!', 10);

  for (const s of staffList) {
    const exists = await User.findOne({ email: s.email }).lean();
    if (!exists) {
      const user = await User.create({ email: s.email, passwordHash: defaultPasswordHash, role: 'staff', isActive: true });
      const profile = await StaffProfile.create({ ...s, userId: user._id });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StaffProfile' } });
      // eslint-disable-next-line no-console
      console.log('[bootstrap] Seeded staff:', s.email);
    }
  }

  const studentList = [
    { email: 'student1@example.com', firstName: 'Charlie', lastName: 'Brown', dob: new Date('2006-03-12') },
    { email: 'student2@example.com', firstName: 'Dana', lastName: 'Lee', dob: new Date('2007-09-25') },
  ];

  for (const s of studentList) {
    const exists = await User.findOne({ email: s.email }).lean();
    if (!exists) {
      const user = await User.create({ email: s.email, passwordHash: defaultPasswordHash, role: 'student', isActive: true });
      const admissionNo = await generateUniqueAdmissionNo();
      const profile = await StudentProfile.create({ ...s, admissionNo, userId: user._id });
      await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
      // eslint-disable-next-line no-console
      console.log('[bootstrap] Seeded student:', s.email);
    }
  }
}

async function ensureAdminMenus() {
  const baseMenus = [
    { label: 'Users', url: '/admin/users', icon: 'users', order: 1 },
    { label: 'Roles', url: '/admin/roles', icon: 'shield', order: 2 },
    { label: 'Menu', url: '/admin/menu', icon: 'menu', order: 3 },
    { label: 'Timetables', url: '/admin/timetables', icon: 'calendar', order: 4 },
    { label: 'Students', url: '/admin/students', icon: 'student', order: 5 },
    { label: 'Settings', url: '/admin/settings', icon: 'settings', order: 6 },
    { label: 'Logs', url: '/admin/logs', icon: 'log', order: 7 },
    { label: 'Staffs', url: '/admin/staffs', icon: 'briefcase', order: 8 },
    { label: 'Subjects', url: '/admin/subjects', icon: 'book', order: 9 },
    { label: 'Classes', url: '/admin/classes', icon: 'class', order: 10 },
    { label: 'Assessments', url: '/admin/assessments', icon: 'clipboard', order: 11 },
    { label: 'Departments', url: '/admin/departments', icon: 'building', order: 12 },
  ];

  // Create menu items if missing
  const createdIds = [];
  for (const m of baseMenus) {
    const existing = await MenuItem.findOne({ label: m.label }).lean();
    if (!existing) {
      const doc = await MenuItem.create({ ...m, active: true });
      createdIds.push(doc._id.toString());
      // eslint-disable-next-line no-console
      console.log('[bootstrap] Seeded menu item:', m.label);
    }
  }

  // Ensure hierarchy: Staffs and Students under Users
  const users = await MenuItem.findOne({ label: 'Users' }).lean();
  if (users) {
    const childrenLabels = ['Staffs', 'Students'];
    for (const label of childrenLabels) {
      const child = await MenuItem.findOne({ label }).lean();
      if (child && (!child.parent || child.parent.toString() !== users._id.toString())) {
        await MenuItem.updateOne({ _id: child._id }, { $set: { parent: users._id } });
        // eslint-disable-next-line no-console
        console.log(`[bootstrap] Set parent of ${label} under Users`);
      }
    }
  }

  // Ensure admin has permission to all admin menus
  const allMenus = await MenuItem.find({ label: { $in: baseMenus.map(b => b.label) } }).lean();
  for (const mi of allMenus) {
    const exists = await Permission.findOne({ role: 'admin', menuItem: mi._id }).lean();
    if (!exists) {
      await Permission.create({ role: 'admin', menuItem: mi._id, allowed: true });
    }
  }

  // Deactivate legacy 'Exams' menu if it exists
  const legacyExams = await MenuItem.findOne({ label: 'Exams' }).lean();
  if (legacyExams && legacyExams.active !== false) {
    await MenuItem.updateOne({ _id: legacyExams._id }, { $set: { active: false } });
    // eslint-disable-next-line no-console
    console.log('[bootstrap] Deactivated legacy menu item: Exams');
  }
}

async function ensureDefaultRolePermissions() {
  // Define which menu labels each role should be allowed to access by default
  const defaults = {
    staff: ['Timetables', 'Students', 'Subjects', 'Classes', 'Assessments'],
    teacher: ['Timetables', 'Students', 'Subjects', 'Classes', 'Assessments'],
    // students typically don't see admin pages; leave empty by default
    // student: []
  };

  // Build label -> _id map for quick lookup
  const allMenus = await MenuItem.find({}).select('label _id').lean();
  const byLabel = new Map(allMenus.map(m => [m.label, m._id]));

  for (const [role, labels] of Object.entries(defaults)) {
    for (const label of labels) {
      const id = byLabel.get(label);
      if (!id) continue; // label not found (defensive)
      const exists = await Permission.findOne({ role, menuItem: id }).lean();
      if (!exists) {
        await Permission.create({ role, menuItem: id, allowed: true });
        // eslint-disable-next-line no-console
        console.log(`[bootstrap] Granted ${role} access to`, label);
      }
    }
  }
}

let hasRun = false;
export async function runBootstrap() {
  if (hasRun) return; // process-level guard
  hasRun = true;
  try {
    await ensureSettings();
    await ensureAdmin();
    await ensureSampleStaffAndStudents();
    await ensureAdminMenus();
    await ensureDefaultRolePermissions();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Error:', err?.message || err);
  }
}

export default runBootstrap;
