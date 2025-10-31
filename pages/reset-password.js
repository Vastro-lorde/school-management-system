import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { resetPassword as resetPasswordRequest } from '@/api/auth';
import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import LoadingButton from '@/components/LoadingButton';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      const { data, error } = await resetPasswordRequest({ token, password });
      if (error) throw new Error(error);
      setMessage(data?.message || 'Password has been reset');
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Reset Password - School Management System</title>
      </Head>

      <AuthCard
        title="Set a new password"
        subtitle="Enter and confirm your new password"
        footer={
          <div className="text-center">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Back to login</Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          {message && (
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md p-2">{message}</p>
          )}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">{error}</p>
          )}
          <LoadingButton
            type="submit"
            loading={loading}
            spinnerLabel="Updating..."
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 focus:ring-blue-500"
          >
            Reset Password
          </LoadingButton>
        </form>
      </AuthCard>
    </div>
  );
}
