import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { getAbout } from '@/api/settings';

export default function About() {
  const [about, setAbout] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAbout() {
      const { data, error } = await getAbout();
      if (error) {
        setError(error);
        return;
      }
=======

export default function About() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    async function fetchAbout() {
      const res = await fetch('/api/settings/about');
      const data = await res.json();
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
      setAbout(data);
    }
    fetchAbout();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
<<<<<<< HEAD
        {error ? (
          <div className="text-center">
            <p className="text-red-400">Failed to load. {error}</p>
          </div>
        ) : about ? (
=======
        {about ? (
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
          <>
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4">{about.value.title}</h1>
            </div>
            <div className="mt-12 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  {about.value.description}
                </p>
              </div>
              <div className="flex justify-center">
                <img src="/globe.svg" alt="Our Mission" className="rounded-lg shadow-2xl w-full max-w-sm" />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        )}
      </main>
    </div>
  );
}
