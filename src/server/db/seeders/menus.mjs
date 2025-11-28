import MenuItem from '../models/MenuItem.js';
import Permission from '../models/Permission.js';

export async function ensureAdminMenus() {
  const baseMenus = [
    { label: 'Users', url: '/admin/users', icon: 'users', order: 1 },
    { label: 'Roles', url: '/admin/roles', icon: 'shield', order: 2 },
    { label: 'Menus', url: '/admin/menu', icon: 'menu', order: 3 },
    { label: 'Timetables', url: '/admin/timetables', icon: 'calendar', order: 4 },
    { label: 'Students', url: '/admin/students', icon: 'student', order: 5 },
    { label: 'Settings', url: '/admin/settings', icon: 'settings', order: 6 },
    { label: 'Logs', url: '/admin/logs', icon: 'log', order: 7 },
    { label: 'Staffs', url: '/admin/staffs', icon: 'briefcase', order: 8 },
    { label: 'Subjects', url: '/admin/subjects', icon: 'book', order: 9 },
    { label: 'Courses', url: '/admin/courses', icon: 'book-open', order: 10 },
    { label: 'Classes', url: '/admin/classes', icon: 'class', order: 11 },
    { label: 'Faculty', url: '/admin/faculty', icon: 'university', order: 12 },
    { label: 'Assessments', url: '/admin/assessments', icon: 'clipboard', order: 13 },
    { label: 'Departments', url: '/admin/departments', icon: 'building', order: 14 },
    { label: 'Payment Types', url: '/admin/payment-types', icon: 'money', order: 15 },
    { label: 'Payment Items', url: '/admin/payment-items', icon: 'money', order: 16 },
    { label: 'Payments', url: '/admin/payments', icon: 'money', order: 17 },
    { label: 'Payment Details', url: '/admin/payment-details', icon: 'money', order: 18 },
    { label: 'Payment Insights', url: '/admin/payment-insights', icon: 'money', order: 19 },
    { label: 'Student Payments', url: '/staff/student-payments', icon: 'money', order: 20 },
    { label: 'Student Lookup', url: '/staff/student-lookup', icon: 'users', order: 21 },
    { label: 'My Payments', url: '/student/payments', icon: 'money', order: 22 },
    { label: 'Register Student', url: '/staff/register-student', icon: 'user-plus', order: 23 },
    { label: 'My Timetable', url: '/student/timetable', icon: 'calendar', order: 24 },
    { label: 'My Details', url: '/student/details', icon: 'user', order: 25 },
    { label: 'My Scores', url: '/student/scores', icon: 'clipboard', order: 26 },
    { label: 'My Teachers', url: '/student/teachers', icon: 'users', order: 27 },
    { label: 'Course Registration', url: '/student/course-registration', icon: 'book-open', order: 28 },
    { label: 'Course Forms', url: '/admin/course-forms', icon: 'book-open', order: 32 },
    { label: 'Student Change Requests', url: '/staff/student-change-requests', icon: 'clipboard', order: 29 },
    { label: 'Positions', url: '/admin/positions', icon: 'briefcase', order: 30 },
    { label: 'Assign Positions', url: '/admin/assign-positions', icon: 'briefcase', order: 31 },
    { label: 'Memo Inbox', url: '/memos/inbox', icon: 'inbox', order: 33 },
    { label: 'Memo Outbox', url: '/memos/outbox', icon: 'outbox', order: 34 },
    { label: 'New Memo', url: '/memos/new', icon: 'compose', order: 35 },
    { label: 'Student Positions', url: '/admin/student-positions', icon: 'briefcase', order: 36 },
    { label: 'Staff Student Positions', url: '/staff/student-positions', icon: 'briefcase', order: 37 },
    { label: 'My Profile', url: '/staff/my-profile', icon: 'user', order: 38 },
  ];

  const createdIds = [];
  for (const m of baseMenus) {
    const existing = await MenuItem.findOne({ label: m.label }).lean();
    if (!existing) {
      const doc = await MenuItem.create({ ...m, active: true });
      createdIds.push(doc._id.toString());
      console.log('[bootstrap] Seeded menu item:', m.label);
    }
  }

  const users = await MenuItem.findOne({ label: 'Users' }).lean();
  if (users) {
    const childrenLabels = ['Staffs', 'Students'];
    for (const label of childrenLabels) {
      const child = await MenuItem.findOne({ label }).lean();
      if (child && (!child.parent || child.parent.toString() !== users._id.toString())) {
        await MenuItem.updateOne({ _id: child._id }, { $set: { parent: users._id } });
        console.log(`[bootstrap] Set parent of ${label} under Users`);
      }
    }
  }

  const allMenus = await MenuItem.find({ label: { $in: baseMenus.map(b => b.label) } }).lean();
  for (const mi of allMenus) {
    const exists = await Permission.findOne({ role: 'admin', menuItem: mi._id }).lean();
    if (!exists) {
      await Permission.create({ role: 'admin', menuItem: mi._id, allowed: true });
    }
  }

  const legacyExams = await MenuItem.findOne({ label: 'Exams' }).lean();
  if (legacyExams && legacyExams.active !== false) {
    await MenuItem.updateOne({ _id: legacyExams._id }, { $set: { active: false } });
    console.log('[bootstrap] Deactivated legacy menu item: Exams');
  }
}

export async function ensureDefaultRolePermissions() {
  const defaults = {
    staff: ['Timetables', 'Students', 'Subjects', 'Courses', 'Classes', 'Assessments', 'Student Payments', 'Student Lookup', 'Register Student', 'Student Change Requests', 'Memo Inbox', 'Memo Outbox', 'New Memo', 'Staff Student Positions', 'My Profile'],
    teacher: ['Timetables', 'Students', 'Subjects', 'Courses', 'Classes', 'Assessments', 'Memo Inbox', 'Memo Outbox', 'New Memo', 'My Profile'],
    student: ['My Payments', 'My Timetable', 'My Details', 'My Scores', 'My Teachers', 'Course Registration', 'Memo Inbox', 'New Memo', 'My Profile'],
  };

  const allMenus = await MenuItem.find({}).select('label _id').lean();
  const byLabel = new Map(allMenus.map(m => [m.label, m._id]));

  for (const [role, labels] of Object.entries(defaults)) {
    for (const label of labels) {
      const id = byLabel.get(label);
      if (!id) continue;
      const exists = await Permission.findOne({ role, menuItem: id }).lean();
      if (!exists) {
        await Permission.create({ role, menuItem: id, allowed: true });
        console.log(`[bootstrap] Granted ${role} access to`, label);
      }
    }
  }
}
