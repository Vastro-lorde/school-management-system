import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dbConnect from '../src/server/db/config.mjs';
import Setting from '../src/server/db/models/Setting.mjs';
import User from '../src/server/db/models/User.js';
import StudentProfile from '../src/server/db/models/StudentProfile.js';
import StaffProfile from '../src/server/db/models/StaffProfile.js';

const settings = [
    {
        key: "about",
        value: {
            title: "School Management Web App",
            description: "A comprehensive solution for managing school operations efficiently. This platform provides tools for managing students, staff, classes, attendance, grades, and more, all in one centralized system."
        }
    },
    {
        key: "contact",
        value: {
            email: "seundanielomatsola@gmail.com",
            phone: "123-456-7890",
            address: "123 School Lane, Education City, 12345"
        }
    },
    {
        key: "history",
        value: [
            {
                year: 2023,
                event: "Project Inception",
                description: "The initial idea for the School Management Web App was conceived by a team of passionate developers aiming to streamline educational administration."
            },
            {
                year: 2023,
                event: "Team Formation",
                description: "Group 6 was formed to bring the project to life, consisting of four dedicated members.",
                members: [
                    { name: "Seun Omatsola", role: "Lead Developer" },
                    { name: "Pelumi Ogunleye", role: "Backend Developer" },
                    { name: "ADEGBOYE TEMITAYO ELIZABETH", role: "Frontend Developer" },
                    { name: "AKINKUNMI OMOLARA MARY", role: "UI/UX Designer" },
                ]
            },
            {
                year: 2024,
                event: "Version 1.0 Release",
                description: "The first official version of the School Management Web App was launched, offering core features for user and academic management."
            }
        ]
    },
    {
        key: "logo",
        value: {
            url: "/img/logo.png",
            alt: "School Management System Logo"
        }
    }
];

async function seedDatabase() {
  await dbConnect();

  for (const setting of settings) {
    const existingSetting = await Setting.findOne({ key: setting.key });
    if (!existingSetting) {
      await Setting.create(setting);
    }
  }

    // Seed admin user
    const adminEmail = 'omatsolaseund@gmail.com';
    const adminPassword = 'Admin@12345'; // change in production
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        admin = await User.create({ email: adminEmail, passwordHash, role: 'admin', isActive: true });
        console.log('Seeded admin:', adminEmail, 'password:', adminPassword);
    } else {
        console.log('Admin already exists:', adminEmail);
    }

    // Seed sample staff directly (avoid importing app services in node script)
    const staffList = [
        { email: 'staff1@example.com', password: 'Password1!', role: 'staff', firstName: 'Alice', lastName: 'Johnson', dob: new Date('1990-01-01'), department: 'Mathematics', position: 'Lecturer', employeeId: 'EMP1001' },
        { email: 'staff2@example.com', password: 'Password1!', role: 'staff', firstName: 'Bob', lastName: 'Smith', dob: new Date('1988-06-15'), department: 'Science', position: 'Lab Tech', employeeId: 'EMP1002' },
    ];
    for (const s of staffList) {
        const exists = await User.findOne({ email: s.email }).lean();
        if (!exists) {
            const passwordHash = await bcrypt.hash(s.password, 10);
            const user = await User.create({ email: s.email, passwordHash, role: 'staff', isActive: true });
            const profile = await StaffProfile.create({ firstName: s.firstName, lastName: s.lastName, department: s.department, position: s.position, employeeId: s.employeeId, dob: s.dob, userId: user._id });
            await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StaffProfile' } });
            console.log('Seeded staff:', s.email);
        }
    }

    // Seed sample students directly
    const studentList = [
        { email: 'student1@example.com', password: 'Password1!', role: 'student', firstName: 'Charlie', lastName: 'Brown', dob: new Date('2006-03-12') },
        { email: 'student2@example.com', password: 'Password1!', role: 'student', firstName: 'Dana', lastName: 'Lee', dob: new Date('2007-09-25') },
    ];
    for (const s of studentList) {
        const exists = await User.findOne({ email: s.email }).lean();
        if (!exists) {
            const passwordHash = await bcrypt.hash(s.password, 10);
            const user = await User.create({ email: s.email, passwordHash, role: 'student', isActive: true });
            // admissionNo is auto-generated in bootstrap; here we mirror a simple unique generator
            const year = new Date().getFullYear();
            const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
            const admissionNo = `STU-${year}-${rand}`;
            const profile = await StudentProfile.create({ firstName: s.firstName, lastName: s.lastName, dob: s.dob, admissionNo, userId: user._id });
            await User.updateOne({ _id: user._id }, { $set: { profileRef: profile._id, profileModel: 'StudentProfile' } });
            console.log('Seeded student:', s.email);
        }
    }

  console.log('Database seeded successfully!');
  mongoose.connection.close();
}

seedDatabase();
