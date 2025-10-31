
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
            Welcome to the future of school management
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            A modern, intuitive, and powerful platform to manage your educational institution.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300">
              Login
            </Link>
            <Link href="/about" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full transition duration-300">
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 bg-gray-800 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">For Teachers</h3>
              <p className="text-gray-400">Streamline your workflow and focus on what matters most - teaching.</p>
            </div>
            <div className="p-8 bg-gray-800 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">For Students</h3>
              <p className="text-gray-400">Stay organized, track your progress, and collaborate with your peers.</p>
            </div>
            <div className="p-8 bg-gray-800 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">For Admins</h3>
              <p className="text-gray-400">Gain complete control and visibility over your institution's operations.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
