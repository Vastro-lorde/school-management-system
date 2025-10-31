import Link from 'next/link';
<<<<<<< HEAD
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
=======

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <Link href="/">
          <a className="text-2xl font-bold">School Management</a>
        </Link>
        <div>
          <Link href="/about">
            <a className="ml-4">About</a>
          </Link>
          <Link href="/contact">
            <a className="ml-4">Contact</a>
          </Link>
          <Link href="/history">
            <a className="ml-4">History</a>
          </Link>
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
        </div>
      </nav>
    </header>
  );
}
