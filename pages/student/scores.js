import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StudentScoresPage({ menu }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ (async()=>{ try{ const res = await fetch('/api/student/scores').then(r=>r.json()); if(res?.success) setRows(res.value||[]); else if(res?.message) alert(res.message);}catch(e){console.error(e); alert('Failed to load scores');} finally { setLoading(false);} })(); }, []);
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">My Scores</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Assessment</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Grade</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {(rows||[]).map(r => (
                <tr key={r._id} className="border-t">
                  <td className="px-3 py-2">{r.subjectId?.name}</td>
                  <td className="px-3 py-2">{r.assessmentId?.title || '-'}</td>
                  <td className="px-3 py-2">{r.score}</td>
                  <td className="px-3 py-2">{r.grade}</td>
                  <td className="px-3 py-2">{r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
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
  const ok = await permissionService.hasAccessToUrl(role, '/student/scores');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
