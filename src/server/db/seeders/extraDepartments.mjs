import Department from '../models/Department.js';

export async function seedAdditionalDepartments() {
  const extraDepartments = [
    { name: 'Department of Chemistry', code: 'CHM' },
    { name: 'Department of Biology', code: 'BIO' },
    { name: 'Department of Statistics', code: 'STA' },
    { name: 'Department of Geology', code: 'GLY' },
    { name: 'Department of Mechanical Engineering', code: 'MEE' },
    { name: 'Department of Computer Engineering', code: 'CPE' },
    { name: 'Department of Agricultural Engineering', code: 'AGE' },
    { name: 'Department of Accounting', code: 'ACC' },
    { name: 'Department of Business Administration', code: 'BUS' },
    { name: 'Department of Sociology', code: 'SOC' },
    { name: 'Department of Mass Communication', code: 'MAC' },
    { name: 'Department of Psychology', code: 'PSY' },
    { name: 'Department of History and International Studies', code: 'HIS' },
    { name: 'Department of Public Administration', code: 'PAD' },
    { name: 'Department of Linguistics', code: 'LIN' },
    { name: 'Department of Philosophy', code: 'PHL' },
    { name: 'Department of Architecture', code: 'ARC' },
    { name: 'Department of Urban and Regional Planning', code: 'URP' },
    { name: 'Department of Fine and Applied Arts', code: 'FAA' },
    { name: 'Department of Theatre Arts', code: 'THA' },
  ];

  for (const d of extraDepartments) {
    const exists = await Department.findOne({ code: d.code }).lean();
    if (!exists) {
      await Department.create(d);
      console.log('[bootstrap] Seeded extra department:', d.name);
    }
  }
}
