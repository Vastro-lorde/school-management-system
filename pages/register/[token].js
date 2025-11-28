import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AuthCard from '@/components/AuthCard';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';

export default function Register() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');

  // form state
  const [form, setForm] = useState({ password: '', confirmPassword: '', firstName: '', lastName: '', dateOfBirth: '' , department: '', position: '', employeeId: ''});
  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await apiClient.get(`/api/auth/register-validate?token=${encodeURIComponent(token)}`);
      if (error) {
        setError(error);
      } else {
        setInvite(data);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const payload = { token, password: form.password, firstName: form.firstName, lastName: form.lastName, dateOfBirth: form.dateOfBirth };
    if (invite?.role === 'staff') {
      payload.department = form.department;
      payload.position = form.position;
      payload.employeeId = form.employeeId;
    }
    const res = await apiClient.post('/api/auth/register', payload);
    if (!res?.success) {
      setError(res?.message || res?.error || 'Registration failed');
      return;
    }
    router.push('/login');
  };

  return (
    <div>
      <Head>
        <title>Register - School Management System</title>
      </Head>
      <AuthCard
        title="Complete your registration"
        subtitle={loading ? 'Validating link…' : invite ? `${invite.email} • ${invite.role}` : 'Invalid or expired link'}
        footer={<div className="text-center"><Link href="/login" className="text-blue-400 hover:text-blue-300">Back to login</Link></div>}
      >
        {loading ? (
          <p className="text-gray-300 text-sm">Please wait…</p>
        ) : error ? (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">{error}</p>
        ) : invite ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
                <input name="firstName" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
                <input name="lastName" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Date of Birth</label>
              <input type="date" name="dateOfBirth" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            </div>

            {invite.role === 'staff' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Department</label>
                  <input name="department" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Position</label>
                  <input name="position" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Employee ID</label>
                  <input name="employeeId" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                <input type="password" name="password" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
            </div>

            <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
              Register
            </button>
          </form>
        ) : (
          <p className="text-gray-300 text-sm">Invalid or expired link.</p>
        )}
      </AuthCard>
    </div>
  );
}
