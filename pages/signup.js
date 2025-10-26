import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    studentId: '',
    department: '',
    position: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Signup failed');
      }

      router.push('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <Head>
        <title>Signup - School Management System</title>
      </Head>

      <main className="container mx-auto p-4">
        <h2 className="text-3xl font-bold mb-4">Signup</h2>
        <form onSubmit={handleSubmit}>
          {/* Common fields */}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input type="email" name="email" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input type="password" name="password" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <select name="role" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded">
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Profile fields */}
          <div className="mb-4">
            <label className="block text-gray-700">First Name</label>
            <input type="text" name="firstName" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Last Name</label>
            <input type="text" name="lastName" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Date of Birth</label>
            <input type="date" name="dateOfBirth" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
          </div>

          {/* Conditional fields based on role */}
          {formData.role === 'student' ? (
            <div className="mb-4">
              <label className="block text-gray-700">Student ID</label>
              <input type="text" name="studentId" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Department</label>
                <input type="text" name="department" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Position</label>
                <input type="text" name="position" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
              </div>
            </>
          )}

          {error && <p className="text-red-500">{error}</p>}
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Signup
          </button>
        </form>
      </main>
    </div>
  );
}
