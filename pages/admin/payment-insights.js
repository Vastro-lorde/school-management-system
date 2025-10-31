import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

function Bar({ label, value, max }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs opacity-70"><span>{label}</span><span>{value.toLocaleString()}</span></div>
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-blue-600 rounded" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AdminPaymentInsightsPage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const res = await fetch(`/api/admin/payment-details/stats?${params.toString()}`).then(r => r.json());
    if (res?.success) setData(res.value);
    setLoading(false);
  }

  useEffect(() => { load(); // initial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxByPayment = useMemo(() => Math.max(0, ...((data?.byPayment || []).map(x => x.total))), [data]);
  const totalCollected = useMemo(() => (data?.byPayment || []).reduce((s,x)=>s+Number(x.total||0),0), [data]);

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Payment Insights</h1>
        <div className="flex gap-2 items-end">
          <label className="text-sm">
            <div className="mb-1">From</div>
            <input type="date" className="border rounded px-2 py-1" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
          </label>
          <label className="text-sm">
            <div className="mb-1">To</div>
            <input type="date" className="border rounded px-2 py-1" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
          </label>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={load}>Apply</button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center opacity-80">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="text-sm opacity-70 mb-1">Total Collected</div>
            <div className="text-3xl font-semibold">{totalCollected.toLocaleString()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-4">
              <div className="font-medium mb-3">Collections by Month</div>
              <div className="space-y-2">
                {(data?.byMonth || []).map(x => (
                  <Bar key={`${x._id.y}-${x._id.m}`} label={`${x._id.y}-${String(x._id.m).padStart(2,'0')}`} value={x.total} max={Math.max(...(data.byMonth.map(y => y.total)))} />
                ))}
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="font-medium mb-3">Top Payments</div>
              <div className="space-y-2">
                {(data?.byPayment || []).map(x => (
                  <Bar key={x._id} label={`${x.title} (${x.count})`} value={x.total} max={maxByPayment} />
                ))}
              </div>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="font-medium mb-3">Status breakdown</div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Count</th>
                  <th className="px-3 py-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.statusCounts || []).map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="px-3 py-2 capitalize">{r._id}</td>
                    <td className="px-3 py-2">{r.count}</td>
                    <td className="px-3 py-2">{Number(r.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/payment-insights');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
