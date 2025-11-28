import { useState, useEffect } from 'react';
import { getContact } from '@/api/settings';

export default function Contact() {
  const [contact, setContact] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContact() {
      const { data, error } = await getContact();
      if (error) {
        setError(error);
        return;
      }
      setContact(data);
    }
    fetchContact();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/img/contact-bg.png')" }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95" />

      <main className="relative container mx-auto px-4 py-16 flex flex-col justify-center min-h-screen">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-4">
            We&apos;re Here For You
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-gray-100/80 max-w-2xl mx-auto">
            We&apos;d love to hear from you. Here&apos;s how you can reach us.
          </p>
        </div>

        {error ? (
          <div className="text-center">
            <p className="text-red-400">Failed to load. {error}</p>
          </div>
        ) : contact ? (
          <div className="max-w-4xl mx-auto grid md:grid-cols-[3fr,2fr] gap-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold">Contact Information</h2>
              <p className="text-sm text-gray-100/70 uppercase tracking-[0.2em]">Reach Us Anytime</p>
              <div className="space-y-4 text-gray-100/85">
                <p className="text-lg">
                  <span className="font-semibold text-cyan-300">Email:</span> {contact.value.email}
                </p>
                <p className="text-lg">
                  <span className="font-semibold text-cyan-300">Phone:</span> {contact.value.phone}
                </p>
                <p className="text-lg">
                  <span className="font-semibold text-cyan-300">Address:</span> {contact.value.address}
                </p>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-xs md:max-w-sm">
                <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-400/50 via-sky-400/40 to-indigo-500/40 blur-3xl opacity-40" />
                <div className="relative rounded-3xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-300/40 flex items-center justify-center">
                    <img src="/window.svg" alt="Contact us" className="h-10 w-10" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Always Within Reach</h2>
                  <p className="text-sm text-gray-100/70 text-center leading-relaxed">
                    Whether you&apos;re a parent, student, or staff member, our
                    support channels are open to assist you.
                  </p>
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
