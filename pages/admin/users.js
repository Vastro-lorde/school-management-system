import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';
import StatCard from '../../src/components/StatCard';

function RolePieChart({ data }) {
  const total = (data || []).reduce((sum, r) => sum + (r.count || 0), 0);
  if (!total) {
    return <div className="text-sm text-gray-500">No users to display.</div>;
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const colors = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="translate(80,80)">
          {data.map((r, idx) => {
            const value = r.count || 0;
            if (!value) return null;
            const fraction = value / total;
            const dash = fraction * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const circle = (
              <circle
                key={r._id || idx}
                r={radius}
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth={20}
                strokeDasharray={dashArray}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += dash;
            return circle;
          })}
        </g>
      </svg>
      <div className="space-y-2 w-full">
        {data.map((r, idx) => (
          <div key={r._id || idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="capitalize">{r._id}</span>
            </div>
            <div className="text-right text-xs text-gray-500">
              <span className="mr-2">{r.count}</span>
              <span>{Math.round((r.count / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsersPage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const res = await fetch('/api/admin/users/stats').then(r => r.json()); if (res?.success) setData(res.value); setLoading(false); })(); }, []);
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard label="Total users" value={data.total} />
            <StatCard label="Active" value={data.active} />
            <StatCard label="Created in last 30d" value={data.createdLast30} />
            <StatCard label="Logged in last 30d" value={data.loggedInLast30} />
          </div>
          <div className="border rounded p-4">
            <div className="font-medium mb-3">By role</div>
            <RolePieChart data={data?.byRole || []} />
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
