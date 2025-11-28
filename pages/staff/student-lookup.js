import React, { useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import AvatarInitials from '../../src/components/AvatarInitials';

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
        <div className="mt-4">
          {(!rows || rows.length === 0) ? (
            <div className="py-6 text-center text-sm text-gray-400">No students found. Try a different search.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 items-center shadow-sm hover:bg-white/10 transition-colors"
                >
                  <AvatarInitials name={`${r.firstName || ''} ${r.lastName || ''}`} fallback="ST" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">
                      {`${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unnamed student'}
                    </div>
                    <div className="mt-1 text-xs text-gray-300 space-y-0.5">
                      <div>
                        <span className="font-medium text-gray-400">Admission No:</span>{' '}
                        {r.admissionNo || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
