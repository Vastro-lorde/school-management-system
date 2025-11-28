import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return (
    <header className="sticky top-0 z-40 bg-gray-900/70 backdrop-blur-md border-b border-white/10 text-white">
      <nav className="container mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="text-2xl font-bold">
          School Management
        </Link>
        <div className="flex items-center text-sm md:text-base">
          <Link href="/about" className="ml-4 hover:text-emerald-300 transition-colors">
            About
          </Link>
          <Link href="/contact" className="ml-4 hover:text-emerald-300 transition-colors">
            Contact
          </Link>
          <Link href="/history" className="ml-4 hover:text-emerald-300 transition-colors">
            History
          </Link>
          <Link href="/portal" className="ml-4 hover:text-emerald-300 transition-colors">
            Portal
          </Link>
          {session && (
            <Link href="/dashboard" className="ml-4 hover:text-emerald-300 transition-colors">
              Dashboard
            </Link>
          )}
          {(role === 'admin' || role === 'staff') && (
            <Link href="/admin/invite" className="ml-4 hover:text-emerald-300 transition-colors">
              Invite
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
