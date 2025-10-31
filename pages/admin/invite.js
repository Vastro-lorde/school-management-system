import { useState } from 'react';
import Head from 'next/head';
import AuthCard from '@/components/AuthCard';
import { ROLES } from '@/constants/enums.mjs';
import apiClient from '@/lib/apiClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

export default function InvitePage({ userRole }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [ttl, setTtl] = useState(120);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const { data, error } = await apiClient.post('/api/admin/invite', { email, role, ttlMinutes: Number(ttl) });
    if (error) {
      setError(error);
    } else {
      setResult(data);
    }
  };

  return (
    <div>
      <Head>
        <title>Invite User - Admin</title>
      </Head>
      <AuthCard title="Invite a user" subtitle="Send a registration link">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="user@example.com" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {ROLES.filter(r => (userRole === 'admin' ? (r === 'student' || r === 'staff') : r === 'student')).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">TTL (minutes)</label>
              <input type="number" min={5} value={ttl} onChange={(e) => setTtl(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">{error}</p>}
          <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">Send invite</button>
          {result && (
            <div className="mt-4 text-sm text-gray-200 bg-white/5 border border-white/10 rounded-lg p-3">
              <div><span className="text-gray-400">Invite link:</span> <a className="text-blue-400 hover:text-blue-300" href={result.link} target="_blank" rel="noreferrer">{result.link}</a></div>
              <div className="text-gray-400">Expires: {new Date(result.expiresAt).toLocaleString()}</div>
            </div>
          )}
        </form>
      </AuthCard>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const role = session?.user?.role;
  if (!session || !role || (role !== 'admin' && role !== 'staff')) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return { props: { userRole: role } };
}
