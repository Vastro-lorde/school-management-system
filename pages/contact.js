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
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4">Get in Touch</h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12">
            We'd love to hear from you. Here's how you can reach us.
          </p>
        </div>

        {error ? (
          <div className="text-center">
            <p className="text-red-400">Failed to load. {error}</p>
          </div>
        ) : contact ? (
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 bg-gray-800 p-8 rounded-lg shadow-2xl">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <p className="text-lg"><strong className="font-bold">Email:</strong> {contact.value.email}</p>
                <p className="text-lg"><strong className="font-bold">Phone:</strong> {contact.value.phone}</p>
                <p className="text-lg"><strong className="font-bold">Address:</strong> {contact.value.address}</p>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <img src="/window.svg" alt="Contact us" className="rounded-lg w-full max-w-xs" />
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
