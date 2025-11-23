import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StudentTeachersPage({ menu }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ (async()=>{ try{ const res = await fetch('/api/student/teachers').then(r=>r.json()); if(res?.success) setRows(res.value||[]); else if(res?.message) alert(res.message);}catch(e){console.error(e); alert('Failed to load teachers');} finally { setLoading(false);} })(); }, []);
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">My Teachers</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-6">
          {(rows||[]).length===0 && <div className="text-sm opacity-70">No teachers found.</div>}
          {(rows||[]).map(r => (
            <div key={r.subject._id} className="border rounded">
              <div className="px-3 py-2 font-semibold bg-gray-50">{r.subject.name}</div>
              <ul className="p-3 space-y-1 text-sm">
                {r.teachers.map(t => (
                  <li key={t._id}>{t.firstName} {t.lastName} <span className="opacity-60">{t.department ? `(${t.department})` : ''}</span></li>
                ))}
              </ul>
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
  const ok = await permissionService.hasAccessToUrl(role, '/student/teachers');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
