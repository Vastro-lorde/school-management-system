import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import ClassModel from '../models/Class.js';
import StaffProfile from '../models/StaffProfile.js';
import User from '../models/User.js';
import { ensureFacultiesAndDepartments, ensureClassesForDepartments, ensureDemoStaffAndStudents } from './helpers.mjs';

export async function ensureAcademicStructure() {
  const faculties = [
    {
      name: 'Faculty of Science',
      description: 'Covers core science programmes.',
      departments: [
        { name: 'Department of Computer Science', code: 'CSC' },
        { name: 'Department of Mathematics', code: 'MTH' },
        { name: 'Department of Physics', code: 'PHY' },
        { name: 'Department of Chemistry', code: 'CHM' },
        { name: 'Department of Biology', code: 'BIO' },
        { name: 'Department of Statistics', code: 'STA' },
        { name: 'Department of Geology', code: 'GLY' },
      ],
    },
    {
      name: 'Faculty of Engineering',
      description: 'Engineering and technology programmes.',
      departments: [
        { name: 'Department of Mechanical Engineering', code: 'MEE' },
        { name: 'Department of Computer Engineering', code: 'CPE' },
        { name: 'Department of Agricultural Engineering', code: 'AGE' },
        { name: 'Department of Electrical and Electronics Engineering', code: 'EEE' },
        { name: 'Department of Civil Engineering', code: 'CVE' },
        { name: 'Department of Architecture', code: 'ARC' },
        { name: 'Department of Urban and Regional Planning', code: 'URP' },
      ],
    },
    {
      name: 'Faculty of Management and Social Sciences',
      description: 'Management, business and social sciences.',
      departments: [
        { name: 'Department of Accounting', code: 'ACC' },
        { name: 'Department of Business Administration', code: 'BUS' },
        { name: 'Department of Economics', code: 'ECO' },
        { name: 'Department of Sociology', code: 'SOC' },
        { name: 'Department of Mass Communication', code: 'MAC' },
        { name: 'Department of Psychology', code: 'PSY' },
        { name: 'Department of Political Science', code: 'POL' },
        { name: 'Department of History and International Studies', code: 'HIS' },
        { name: 'Department of Public Administration', code: 'PAD' },
      ],
    },
    {
      name: 'Faculty of Arts',
      description: 'Arts, humanities and design.',
      departments: [
        { name: 'Department of Linguistics', code: 'LIN' },
        { name: 'Department of Philosophy', code: 'PHL' },
        { name: 'Department of Fine and Applied Arts', code: 'FAA' },
        { name: 'Department of Theatre Arts', code: 'THA' },
      ],
    },
  ];

  const levels = ['100', '200', '300', '400', '500', '600'];
  await ensureFacultiesAndDepartments(Faculty, Department, faculties);
  await ensureClassesForDepartments(Department, levels, ['ECO', 'POL']);
}

export async function seedCoursesPerDepartment() {
  const byDept = {
    CSC: {
      base: 'CSC',
      titles: {
        100: ['Introduction to Computer Science', 'Use of English I', 'Elementary Mathematics I'],
        200: ['Data Structures and Algorithms', 'Computer Organisation and Architecture'],
        300: ['Operating Systems', 'Database Systems I'],
        400: ['Software Engineering I', 'Computer Networks'],
      },
    },
    MTH: {
      base: 'MTH',
      titles: {
        100: ['Elementary Mathematics I', 'Elementary Mathematics II'],
        200: ['Linear Algebra I', 'Real Analysis I'],
        300: ['Complex Analysis', 'Abstract Algebra'],
        400: ['Numerical Analysis', 'Probability Theory'],
      },
    },
    PHY: {
      base: 'PHY',
      titles: {
        100: ['General Physics I', 'General Physics II'],
        200: ['Electricity and Magnetism', 'Modern Physics'],
        300: ['Quantum Mechanics I'],
        400: ['Solid State Physics'],
      },
    },
    EEE: {
      base: 'EEE',
      titles: {
        100: ['Introduction to Electrical Engineering'],
        200: ['Circuit Theory I', 'Electromagnetic Fields'],
        300: ['Power Systems I', 'Electronics I'],
        400: ['Control Engineering I'],
      },
    },
    CVE: {
      base: 'CVE',
      titles: {
        200: ['Strength of Materials I', 'Surveying I'],
        300: ['Structural Analysis I'],
        400: ['Highway Engineering'],
      },
    },
    ECO: {
      base: 'ECO',
      titles: {
        100: ['Principles of Economics I'],
        200: ['Microeconomics I', 'Macroeconomics I'],
        300: ['Development Economics'],
        400: ['Public Finance'],
      },
    },
    POL: {
      base: 'POL',
      titles: {
        100: ['Introduction to Political Science'],
        200: ['Comparative Politics'],
        300: ['International Relations I'],
        400: ['Nigerian Government and Politics'],
      },
    },
  };

  let totalCreated = 0;

  for (const [code, cfg] of Object.entries(byDept)) {
    const dept = await Department.findOne({ code }).lean();
    if (!dept) continue;

    for (const [lvl, titles] of Object.entries(cfg.titles)) {
      const levelStr = String(lvl);
      for (let idx = 0; idx < titles.length; idx++) {
        const title = titles[idx];
        const courseCode = `${cfg.base}${levelStr[0]}0${idx + 1}`; // e.g. CSC101, CSC102
        const exists = await Course.findOne({ code: courseCode }).lean();
        if (!exists) {
          await Course.create({
            title,
            code: courseCode,
            level: levelStr,
            department: dept._id,
            creditHours: 3,
          });
          totalCreated += 1;
          console.log('[seed-academic] Seeded course:', courseCode, '-', title);
        }
      }
    }
  }

  if (totalCreated < 50) {
    const extraDept = await Department.findOne({ code: 'CSC' }).lean();
    if (extraDept) {
      for (let i = totalCreated; i < 50; i++) {
        const idx = i + 1;
        const code = `CSC3${idx.toString().padStart(2, '0')}`;
        const exists = await Course.findOne({ code }).lean();
        if (exists) continue;
        await Course.create({
          title: `Special Topics in Computing ${idx}`,
          code,
          level: '300',
          department: extraDept._id,
          creditHours: 2,
        });
        console.log('[seed-academic] Seeded extra course:', code);
      }
    }
  }
}

export async function seedBulkStaffAndStudents() {
  await ensureDemoStaffAndStudents({ targetStaffTotal: 25, targetStudentTotal: 50 });
}
