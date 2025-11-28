import { useState, useEffect } from 'react';
import { getSetting } from '@/api/settings';

export default function History() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      const res = await getSetting('history');
      const data = res?.data;
      if (!data?.success) {
        setError(data?.message || 'Failed to load history');
        return;
      }
      setHistory(data);
    }
    fetchHistory();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/img/history-bg.png')" }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95" />

      <main className="relative container mx-auto px-4 py-16 flex flex-col justify-center min-h-screen">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300 mb-4">
            Our Story So Far
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
            Our Journey
          </h1>
          <p className="text-lg md:text-xl text-gray-100/80 max-w-2xl mx-auto">
            A timeline of our school&apos;s most significant milestones.
          </p>
        </div>

        {error ? (
          <div className="text-center">
            <p className="text-red-400">Failed to load history. {error}</p>
          </div>
        ) : history ? (
          <div className="relative max-w-5xl mx-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10">
            <div className="border-l-4 border-indigo-500/80 absolute h-full top-0 left-1/2 -ml-2" />
            {history.value.map((item, index) => (
              <div
                key={index}
                className={`mb-10 flex justify-between items-center w-full ${
                  index % 2 === 0 ? 'flex-row-reverse left-timeline' : 'right-timeline'
                }`}
              >
                <div className="order-1 w-5/12" />
                <div className="z-20 flex items-center order-1 bg-indigo-500 shadow-xl w-9 h-9 rounded-full">
                  <h1 className="mx-auto font-semibold text-lg text-white">{index + 1}</h1>
                </div>
                <div className="order-1 bg-black/60 border border-white/10 rounded-xl shadow-xl w-5/12 px-6 py-5">
                  <h3 className="mb-2 font-bold text-white text-xl">
                    {item.year} - {item.event}
                  </h3>
                  <p className="text-sm leading-relaxed tracking-wide text-gray-100/80">
                    {item.description}
                  </p>
                  {item.members && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-indigo-200 text-sm uppercase tracking-[0.15em]">
                        Key Members
                      </h4>
                      <ul className="list-disc list-inside mt-2 text-gray-100/85 text-sm">
                        {item.members.map((member, i) => (
                          <li key={i}>
                            {member.name} - {member.role}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg">Loading history...</p>
          </div>
        )}
      </main>
    </div>
  );
}
