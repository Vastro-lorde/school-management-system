import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>School Management System</title>
        <meta name="description" content="A comprehensive school management system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl">School Management System</h1>
      </header>

      <main className="container mx-auto p-4">
        <h2 className="text-3xl font-bold mb-4">Welcome to the Future of School Management</h2>
        <p className="text-lg">
          Our platform provides a seamless and efficient way to manage all aspects of your educational institution. From student enrollment to grade management, we have you covered.
        </p>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-8">
        <p>&copy; 2023 School Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}