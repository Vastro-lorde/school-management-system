import { useState, useEffect } from 'react';
import { getSetting } from '@/api/settings';

export default function About() {
  const [about, setAbout] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAbout() {
      const res = await getSetting('about');
      const data = res?.data;
      if (!data?.success) {
        setError(data?.message || 'Failed to load about content');
        return;
      }
      setAbout(data);
    }
    fetchAbout();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/img/about-bg.png')" }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />

      <main className="relative container mx-auto px-4 py-16 flex flex-col justify-center min-h-screen">
        {error ? (
          <div className="text-center">
            <p className="text-red-400">Failed to load. {error}</p>
          </div>
        ) : about ? (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-4">
                About Our Institution
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
                {about.value.title}
              </h1>
            </div>
            <div className="mt-10 grid md:grid-cols-[3fr,2fr] gap-10 items-center">
              <div>
                <p className="text-lg md:text-xl text-gray-100/80 leading-relaxed">
                  {about.value.description}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-xs md:max-w-sm">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-400/50 via-cyan-400/40 to-blue-500/40 blur-3xl opacity-40" />
                  <div className="relative rounded-3xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-300/40 flex items-center justify-center">
                      <img src="/globe.svg" alt="Our Mission" className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">Global, Yet Deeply Local</h2>
                    <p className="text-sm text-gray-100/70 text-center leading-relaxed">
                      Empowering the next generation of scholars, innovators, and leaders
                      with a world-class learning experience tailored to our unique context.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        )}
      </main>
    </div>
  );
}
