import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dbConnect from '../src/server/db/config.mjs';
import User from '../src/server/db/models/User.js';

async function checkLogin() {
    try {
        console.log('Checking MONGO_URI...');
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in environment variables');
            return;
        }
        console.log('MONGO_URI is defined (length: ' + process.env.MONGO_URI.length + ')');

        console.log('Connecting to DB...');
        await dbConnect();
        console.log('Connected to DB');

        const email = 'omatsolaseund@gmail.com';
        const password = 'Admin@12345';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return;
        }
        console.log('User found:', user.email);
        console.log('Role:', user.role);
        console.log('Stored Hash:', user.passwordHash);

        const match = await bcrypt.compare(password, user.passwordHash);
        console.log('Password match:', match);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkLogin();
