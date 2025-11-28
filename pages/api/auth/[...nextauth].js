import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '../../../src/server/db/mongodb.js';
import dbConnect from '../../../src/server/db/config.mjs';
import User from '../../../src/server/db/models/User.js';
import bcrypt from 'bcrypt';
import { MONGO_URI } from '../../../src/constants/env.mjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        await dbConnect();

        // Defensive guards to avoid bcrypt errors like "data and hash arguments required"
        const email = credentials?.email?.toLowerCase?.().trim?.();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await User.findOne({ email });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user._id.toString(), email: user.email, role: user.role };
      }
    })
  ],
  adapter: MONGO_URI ? MongoDBAdapter(clientPromise) : undefined,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
      signIn: '/auth/signin',
  }
};

export default NextAuth(authOptions);