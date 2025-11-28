import Role from '../models/Role.js';

export async function ensureRoleDocuments() {
  const base = [
    { name: 'admin', description: 'System administrator', system: true },
    { name: 'staff', description: 'School staff', system: true },
    { name: 'teacher', description: 'Teaching staff', system: true },
    { name: 'student', description: 'Student user', system: true },
  ];
  for (const r of base) {
    const exists = await Role.findOne({ name: r.name }).lean();
    if (!exists) {
      await Role.create({ ...r, active: true });
      console.log('[bootstrap] Seeded role:', r.name);
    }
  }
}
