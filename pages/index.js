import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 text-white">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/land-bg.png')" }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-blue-900/60" />

      <main className="relative z-10 container mx-auto px-4 py-16 flex flex-col justify-center min-h-screen">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Welcome to the future of
            <span className="block text-blue-400">School Management</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A modern, intuitive, and powerful platform to manage your educational institution —
            from student records and payments to timetables and assessments.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5"
            >
              Login to Portal
            </Link>
            <Link
              href="/about"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-full border border-white/20 transition transform hover:-translate-y-0.5"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-2">For Teachers</h3>
            <p className="text-gray-300 text-sm">
              Streamline grading, timetables, and communication so you can focus on teaching.
            </p>
          </div>
          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-2">For Students</h3>
            <p className="text-gray-300 text-sm">
              Access courses, results, payments, and schedules from one unified portal.
            </p>
          </div>
          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-2">For Admins</h3>
            <p className="text-gray-300 text-sm">
              Gain real-time visibility into enrolment, finance, and academic performance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
