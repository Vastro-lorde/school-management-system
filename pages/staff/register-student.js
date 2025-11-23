import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function RegisterStudentPage({ menu }) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    classId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    password: '', // optional
  });
  const [options, setOptions] = useState({ classes: [], genders: [] });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOptions() {
      const res = await fetch('/api/staff/register-student/options').then(r => r.json());
      if (res?.success) setOptions(res.value || { classes: [], genders: [] });
    }
    loadOptions();
  }, []);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);
    const payload = {
      email: form.email.trim(),
      password: form.password.trim() || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob || undefined,
      gender: form.gender || undefined,
      classId: form.classId || undefined,
      guardian: (form.guardianName || form.guardianPhone || form.guardianEmail) ? {
        name: form.guardianName || undefined,
        phone: form.guardianPhone || undefined,
        email: form.guardianEmail || undefined,
      } : undefined,
    };
    const res = await fetch('/api/staff/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.json());
    if (res?.success) {
      setResult(res.value);
      // optionally reset form except email
      setForm({ email: '', firstName: '', lastName: '', dob: '', gender: '', classId: '', guardianName: '', guardianPhone: '', guardianEmail: '', password: '' });
    } else {
      setError(res?.message || 'Failed to register student');
    }
    setSubmitting(false);
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Register Student</h1>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <label className="text-sm">
          <div className="mb-1">Email<span className="text-red-500">*</span></div>
          <input className="border rounded px-2 py-2 w-full" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
        </label>
        <div />

        <label className="text-sm">
          <div className="mb-1">First Name<span className="text-red-500">*</span></div>
          <input className="border rounded px-2 py-2 w-full" value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
        </label>
        <label className="text-sm">
          <div className="mb-1">Last Name<span className="text-red-500">*</span></div>
          <input className="border rounded px-2 py-2 w-full" value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
        </label>

        <label className="text-sm">
          <div className="mb-1">Date of Birth</div>
          <input className="border rounded px-2 py-2 w-full" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} />
        </label>
        <label className="text-sm">
          <div className="mb-1">Gender</div>
          <select className="border rounded px-2 py-2 w-full" value={form.gender} onChange={e => update('gender', e.target.value)}>
            <option value="">Select gender</option>
            {(options.genders || []).map(g => (<option key={g} value={g}>{g}</option>))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1">Class</div>
          <select className="border rounded px-2 py-2 w-full" value={form.classId} onChange={e => update('classId', e.target.value)}>
            <option value="">Select class</option>
            {(options.classes || []).map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>
        </label>
        <div />

        <div className="md:col-span-2 pt-2 font-medium">Guardian (optional)</div>
        <label className="text-sm">
          <div className="mb-1">Guardian Name</div>
          <input className="border rounded px-2 py-2 w-full" value={form.guardianName} onChange={e => update('guardianName', e.target.value)} />
        </label>
        <label className="text-sm">
          <div className="mb-1">Guardian Phone</div>
          <input className="border rounded px-2 py-2 w-full" value={form.guardianPhone} onChange={e => update('guardianPhone', e.target.value)} />
        </label>
        <label className="text-sm">
          <div className="mb-1">Guardian Email</div>
          <input className="border rounded px-2 py-2 w-full" type="email" value={form.guardianEmail} onChange={e => update('guardianEmail', e.target.value)} />
        </label>
        <div />

        <label className="text-sm md:col-span-2">
          <div className="mb-1">Set Initial Password (optional)</div>
          <input className="border rounded px-2 py-2 w-full" type="text" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Leave blank to auto-generate" />
        </label>

        {error ? <div className="text-red-600 md:col-span-2">{error}</div> : null}
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={submitting}>{submitting ? 'Submitting...' : 'Register Student'}</button>
        </div>
      </form>

      {result && (
        <div className="mt-6 max-w-2xl border rounded p-4">
          <div className="font-semibold mb-2">Student Created</div>
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Email:</span> {result.user?.email}</div>
            <div><span className="font-medium">Admission No:</span> {result.profile?.admissionNo}</div>
            <div><span className="font-medium">Temporary Password:</span> <span className="font-mono">{result.tempPassword}</span></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/register-student');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
