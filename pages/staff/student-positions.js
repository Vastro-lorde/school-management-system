import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StaffStudentPositionsPage({ menu }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/student-lookup?q=${encodeURIComponent(term)}`).then(r=>r.json());
      if (res?.success) setResults(res.value||[]); else alert(res?.message||'Failed');
    } catch (e) { console.error(e); alert('Failed to search'); } finally { setLoading(false); }
  }

  async function loadPositions() {
    const res = await fetch('/api/staff/positions').then(r=>r.json());
    if (res?.success) setPositions(res.value||[]);
  }
  useEffect(()=>{ loadPositions(); }, []);

  async function assign(studentProfileId, positionId) {
    const ok = confirm('Assign this position to student?'); if (!ok) return;
    const res = await fetch(`/api/staff/students/${studentProfileId}/position`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ positionId }) }).then(r=>r.json());
    if (res?.success) alert('Assigned'); else alert(res?.message||'Failed');
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Student Positions (Staff)</h1>
      <div className="flex gap-2 mb-4">
        <input value={term} onChange={e=>setTerm(e.target.value)} className="border rounded p-2 flex-1" placeholder="Search students by name or admission no" />
        <button onClick={search} className="px-3 py-2 bg-gray-200 rounded">Search</button>
      </div>
      {loading && <div className="text-sm opacity-60 mb-2">Searching...</div>}
      <div className="space-y-2">
        {results.map(s => (
          <div key={s.id} className="border rounded p-3 flex items-center justify-between">
            <div className="text-sm"><span className="font-medium">{s.firstName} {s.lastName}</span> <span className="opacity-60">({s.admissionNo})</span></div>
            <div>
              <select className="border rounded p-2" onChange={e=>assign(s.id, e.target.value)} defaultValue="">
                <option value="" disabled>Assign position...</option>
                {positions.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        ))}
        {results.length===0 && !loading && <div className="text-sm opacity-60">No results</div>}
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/student-positions');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(role);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
