import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function HodChangeRequestsPage({ menu }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  async function load() {
    setLoading(true);
    try { const res = await fetch('/api/staff/student-change-requests').then(r=>r.json()); if (res?.success) setRows(res.value||[]); else if (res?.message) alert(res.message);} catch(e){console.error(e); alert('Failed to load');} finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  function toggle(id){ setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]); }

  async function act(action, ids){
    const res = await fetch('/api/staff/student-change-requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, requestIds: ids }) }).then(r=>r.json());
    if (res?.success) { setSelected([]); load(); } else alert(res?.message||'Failed');
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">HOD Student Change Requests</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" disabled={selected.length===0} onClick={()=>act('approve', selected)}>Approve Selected</button>
          <button className="px-3 py-2 border rounded" disabled={selected.length===0} onClick={()=>act('reject', selected)}>Reject Selected</button>
        </div>
      </div>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" checked={rows.length>0 && selected.length===rows.length} onChange={e=> setSelected(e.target.checked ? rows.map(r=>r._id) : []) }/></th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Requested By</th>
                <th className="px-3 py-2 text-left">Changes</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(r._id)} onChange={()=>toggle(r._id)} /></td>
                  <td className="px-3 py-2">{r.studentId?.firstName} {r.studentId?.lastName}</td>
                  <td className="px-3 py-2">{r.requestedBy?.email}</td>
                  <td className="px-3 py-2"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r.changes, null, 2)}</pre></td>
                  <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>act('approve',[r._id])}>Approve</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>act('reject',[r._id])}>Reject</button>
                  </td>
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
  const role = session.user?.role || 'staff';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/student-change-requests');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'staff');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
