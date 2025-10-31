import { useState } from 'react';
import Head from 'next/head';
import { forgotPassword as forgotPasswordRequest } from '@/api/auth';
import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import LoadingButton from '@/components/LoadingButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      setLoading(true);
      const { data, error } = await forgotPasswordRequest({ email });
      if (error) throw new Error(error);
      setMessage(data?.message || 'Password reset email sent');
    } catch (error) {
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Forgot Password - School Management System</title>
      </Head>

      <AuthCard
        title="Reset your password"
        subtitle="We’ll email you a secure link"
        footer={
          <div className="text-center">
            Remembered it?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Back to login</Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
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
            spinnerLabel="Sending..."
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 focus:ring-blue-500"
          >
            Send reset link
          </LoadingButton>
        </form>
      </AuthCard>
    </div>
  );
}
