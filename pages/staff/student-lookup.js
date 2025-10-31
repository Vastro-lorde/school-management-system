import React, { useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StaffStudentLookupPage({ menu }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams({ q });
    const res = await fetch(`/api/staff/student-lookup?${params.toString()}`).then(r => r.json());
    if (res?.success) setRows(res.value || []);
    setLoading(false);
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Student Lookup</h1>
      </div>
      <div className="flex gap-2 items-end mb-4">
        <label className="text-sm flex-1">
          <div className="mb-1">Search</div>
          <input className="border rounded px-2 py-2 w-full" placeholder="Name or Admission No" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={search}>Search</button>
      </div>
      {loading ? (
        <div className="py-6 text-center opacity-80">Searching...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Admission No</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{`${r.firstName || ''} ${r.lastName || ''}`.trim()}</td>
                  <td className="px-3 py-2">{r.admissionNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const ok = await permissionService.hasAccessToUrl(role, '/staff/student-lookup');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
