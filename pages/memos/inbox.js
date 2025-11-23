import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function MemoInboxPage({ menu }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/memos?box=inbox').then(r=>r.json());
      if (res?.success) setRows(res.value||[]); else alert(res?.message||'Failed');
    } catch (e) { console.error(e); alert('Failed to load'); } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  async function ack(id) {
    await fetch(`/api/memos/${id}/acknowledge`, { method: 'POST' });
    setRows(r => r.map(x => x._id === id ? { ...x, unread: false } : x));
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Memo Inbox</h1>
        <a href="/memos/new" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">New Memo</a>
      </div>
      {loading ? <div className="py-6 text-center opacity-60">Loading...</div> : (
        <div className="space-y-2">
          {rows.length === 0 && <div className="text-sm opacity-60">No memos.</div>}
          {rows.map(m => (
            <div key={m._id} className={`border rounded p-3 ${m.unread ? 'bg-yellow-50' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.subject||'(No subject)'}</div>
                  <div className="text-xs opacity-60">{new Date(m.createdAt).toLocaleString()} • {m.type}</div>
                </div>
                {m.unread && <button onClick={()=>ack(m._id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Mark Read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/memos/inbox');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(role);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
