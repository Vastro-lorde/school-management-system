import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

function Stat({ label, value }) { return (
  <div className="border rounded p-4"><div className="text-sm opacity-70">{label}</div><div className="text-2xl font-semibold">{value.toLocaleString?.() ?? value}</div></div>
); }

export default function AdminUsersPage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const res = await fetch('/api/admin/users/stats').then(r => r.json()); if (res?.success) setData(res.value); setLoading(false); })(); }, []);
  const maxRole = useMemo(() => Math.max(0, ...((data?.byRole||[]).map(x=>x.count))), [data]);
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Stat label="Total users" value={data.total} />
            <Stat label="Active" value={data.active} />
            <Stat label="Created in last 30d" value={data.createdLast30} />
            <Stat label="Logged in last 30d" value={data.loggedInLast30} />
          </div>
          <div className="border rounded p-4">
            <div className="font-medium mb-3">By role</div>
            <div className="space-y-2">
              {(data?.byRole||[]).map(r => (
                <div key={r._id} className="space-y-1">
                  <div className="flex justify-between text-xs opacity-70"><span className="capitalize">{r._id}</span><span>{r.count}</span></div>
                  <div className="h-2 bg-gray-200 rounded"><div className="h-2 bg-blue-600 rounded" style={{ width: `${maxRole ? Math.round((r.count/maxRole)*100) : 0}%` }} /></div>
                </div>
              ))}
            </div>
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/users');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
