import { useState, useEffect } from 'react';

export default function History() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch('/api/settings/history');
      const data = await res.json();
      setHistory(data);
    }
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4">Our Journey</h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12">
            A timeline of our school's most significant milestones.
          </p>
        </div>

        {history ? (
          <div className="relative">
            <div className="border-l-4 border-blue-600 absolute h-full top-0 left-1/2 -ml-2"></div>
            {history.value.map((item, index) => (
              <div key={index} className={`mb-8 flex justify-between items-center w-full ${index % 2 === 0 ? 'flex-row-reverse left-timeline' : 'right-timeline'}`}>
                <div className="order-1 w-5/12"></div>
                <div className="z-20 flex items-center order-1 bg-blue-600 shadow-xl w-8 h-8 rounded-full">
                  <h1 className="mx-auto font-semibold text-lg text-white">{index + 1}</h1>
                </div>
                <div className="order-1 bg-gray-800 rounded-lg shadow-xl w-5/12 px-6 py-4">
                  <h3 className="mb-3 font-bold text-white text-xl">{item.year} - {item.event}</h3>
                  <p className="text-sm leading-snug tracking-wide text-gray-400 text-opacity-100">{item.description}</p>
                  {item.members && (
                    <div className="mt-4">
                      <h4 className="font-bold text-white">Key Members:</h4>
                      <ul className="list-disc list-inside mt-2 text-gray-400">
                        {item.members.map((member, i) => (
                          <li key={i}>{member.name} - {member.role}</li>
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
