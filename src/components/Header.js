import Link from 'next/link';

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
        </div>
      </nav>
    </header>
  );
}
