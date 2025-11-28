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

export default function AdminStudentsPage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const res = await fetch('/api/admin/students/stats').then(r => r.json()); if (res?.success) setData(res.value); setLoading(false); })(); }, []);
  const genderChart = useMemo(() => {
    const items = data?.byGender || [];
    const total = items.reduce((sum, g) => sum + g.count, 0);
    if (!total) return null;
    const radius = 60;
    const cx = 70;
    const cy = 70;
    const colors = ['#0ea5e9', '#22c55e', '#a855f7', '#f97316'];
    let cumulative = 0;
    const segments = items.map((g, idx) => {
      const value = g.count / total;
      const startAngle = cumulative * 2 * Math.PI;
      const endAngle = (cumulative + value) * 2 * Math.PI;
      cumulative += value;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const largeArc = value > 0.5 ? 1 : 0;

      const d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      return { d, color: colors[idx % colors.length], label: g._id, count: g.count };
    });

    return { segments, total };
  }, [data]);

  const classBars = useMemo(() => {
    const items = data?.byClass || [];
    if (!items.length) return { items: [], max: 0 };
    const max = Math.max(...items.map(x => x.count));
    return { items, max };
  }, [data]);
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Students</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Stat label="Total students" value={data.total} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-4">
              <div className="font-medium mb-3">By gender</div>
              {genderChart ? (
                <div className="flex items-center gap-4">
                  <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
                    {genderChart.segments.map((seg, idx) => (
                      <path key={idx} d={seg.d} fill={seg.color} />
                    ))}
                  </svg>
                  <div className="space-y-1 text-xs">
                    {genderChart.segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                          <span className="capitalize">{seg.label || 'Unknown'}</span>
                        </div>
                        <span className="opacity-70">{seg.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs opacity-60">No gender data</div>
              )}
            </div>
            <div className="border rounded p-4">
              <div className="font-medium mb-3">By class</div>
              {classBars.items.length ? (
                <div className="h-48 flex items-end gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                  {classBars.items.map(item => {
                    const height = classBars.max ? Math.max(4, Math.round((item.count / classBars.max) * 100)) : 0;
                    return (
                      <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${height}%` }}
                          title={`${item.label}: ${item.count}`}
                        />
                        <div className="text-[10px] text-center truncate w-full" title={item.label}>{item.label}</div>
                        <div className="text-[10px] opacity-60">{item.count}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs opacity-60">No class data</div>
              )}
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/students');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
