import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StudentTimetablePage({ menu }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/student/timetable').then(r => r.json());
      if (res?.success) setRows(res.value || []); else if (res?.message) alert(res.message);
    } catch (e) {
      console.error(e); alert('Failed to load timetable');
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">My Timetable</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-6">
          {(rows||[]).length === 0 && <div className="text-sm opacity-70">No timetable entries found.</div>}
          {(rows||[]).map(day => (
            <div key={day._id} className="border rounded">
              <div className="px-3 py-2 font-semibold bg-gray-50">{day.day || 'Day'}</div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Subject</th>
                    <th className="px-3 py-2 text-left">Teacher</th>
                    <th className="px-3 py-2 text-left">Start</th>
                    <th className="px-3 py-2 text-left">End</th>
                  </tr>
                </thead>
                <tbody>
                  {(day.periods||[]).map((p, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{p.subjectId?.name}</td>
                      <td className="px-3 py-2">{p.teacherId ? `${p.teacherId.firstName||''} ${p.teacherId.lastName||''}` : ''}</td>
                      <td className="px-3 py-2">{p.startTime}</td>
                      <td className="px-3 py-2">{p.endTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
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
  const ok = await permissionService.hasAccessToUrl(role, '/student/timetable');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
