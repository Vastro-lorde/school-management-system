import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StaffMyProfilePage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ (async()=>{ try{ const res = await fetch('/api/staff/me').then(r=>r.json()); if(res?.success) setData(res.value); else if(res?.message) alert(res.message);}catch(e){console.error(e); alert('Failed to load');} finally { setLoading(false); } })(); }, []);
  const p = data || {};
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      {loading? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4 text-sm space-y-1">
            <div><span className="opacity-70">Name:</span> {p.firstName} {p.lastName}</div>
            <div><span className="opacity-70">Employee ID:</span> {p.employeeId}</div>
            <div><span className="opacity-70">Department:</span> {p.department || '-'}</div>
            <div><span className="opacity-70">Position:</span> {p.positionId?.name || '-'}</div>
            {p.photoUrl && <img alt="photo" src={p.photoUrl} className="mt-2 w-40 h-40 object-cover rounded" />}
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
  const role = session.user?.role || 'staff';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/my-profile');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'staff');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
