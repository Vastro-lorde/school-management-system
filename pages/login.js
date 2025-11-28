import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import LoadingButton from '@/components/LoadingButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      // Use NextAuth to establish a server-side session so SSR guards pass
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/dashboard',
      });
      if (res?.error) throw new Error(res.error);
      // NextAuth returns a URL; navigate explicitly when redirect is false
      if (res?.url) {
        await router.push(res.url);
      } else {
        await router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      <Head>
        <title>Login - School Management System</title>
      </Head>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/login-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/80 to-blue-900/60" />
      <div className="relative w-full max-w-md px-4 sm:px-0">
      <AuthCard
        title="Welcome back"
        subtitle="Access your dashboard"
        footer={
          <div className="text-right">
            <Link href="/forgot-password" className="text-gray-300 hover:text-white">
              Forgot password?
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
              {error}
            </p>
          )}
          <LoadingButton
            type="submit"
            loading={loading}
            spinnerLabel="Signing in..."
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 focus:ring-blue-500"
          >
            Login
          </LoadingButton>
        </form>
      </AuthCard>
      </div>
    </div>
  );
}
