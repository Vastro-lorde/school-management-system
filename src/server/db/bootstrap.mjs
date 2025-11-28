import { ensureAcademicStructure, seedCoursesPerDepartment, seedBulkStaffAndStudents } from './seeders/academicStructure.mjs';
import { ensurePaymentMetadata } from './seeders/payments.mjs';
import { ensureSettings, ensureAdmin } from './seeders/settings.mjs';
import { ensureRoleDocuments } from './seeders/roles.mjs';
import { ensureSampleStaffAndStudents } from './seeders/sampleUsers.mjs';
import { seedAdditionalDepartments } from './seeders/extraDepartments.mjs';
import { ensureAdminMenus, ensureDefaultRolePermissions } from './seeders/menus.mjs';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'omatsolaseund@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';

let hasRun = false;
export async function runBootstrap() {
  if (hasRun) return; // process-level guard
  hasRun = true;
  try {
    await ensureSettings();
    await ensureAdmin(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    await ensureRoleDocuments();
    await ensureSampleStaffAndStudents();
    await seedAdditionalDepartments();
    await ensureAcademicStructure();
    await seedCoursesPerDepartment();
    await ensurePaymentMetadata();
    await seedBulkStaffAndStudents();
    await ensureAdminMenus();
    await ensureDefaultRolePermissions();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Error:', err?.message || err);
    console.error(err);
  }
}

export default runBootstrap;
