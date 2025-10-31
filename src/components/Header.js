import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <Link href="/" className="text-2xl font-bold">
          School Management
        </Link>
        <div>
          <Link href="/about" className="ml-4">
            About
          </Link>
          <Link href="/contact" className="ml-4">
            Contact
          </Link>
          <Link href="/history" className="ml-4">
            History
          </Link>
          <Link href="/portal" className="ml-4">
            Portal
          </Link>
          {session && (
            <Link href="/dashboard" className="ml-4">
              Dashboard
            </Link>
          )}
          {(role === 'admin' || role === 'staff') && (
            <Link href="/admin/invite" className="ml-4">
              Invite
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
