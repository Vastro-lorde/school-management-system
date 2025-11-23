import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function AssignPositionsPage({ menu }) {
  const [positions, setPositions] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ staffId:'', positionId:'' });
  const [saving, setSaving] = useState(false);

  async function load(){
    setLoading(true);
    try {
      const [posRes, staffRes] = await Promise.all([
        fetch('/api/admin/positions').then(r=>r.json()),
        fetch('/api/admin/staffs').then(r=>r.json()),
      ]);
      if (posRes?.success) setPositions(posRes.value||[]); else if (posRes?.message) alert(posRes.message);
      if (staffRes?.success) setStaffs((staffRes.value||[])); else if (staffRes?.message) alert(staffRes.message);
    } catch(e){ console.error(e); alert('Failed to load'); } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  function onChange(e){ const {name,value} = e.target; setForm(prev=>({...prev,[name]:value})); }

  async function submit(e){ e.preventDefault(); setSaving(true);
    try {
      const res = await fetch('/api/admin/positions/assign',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)}).then(r=>r.json());
      if(res?.success){ alert('Position assigned'); setForm({ userId:'', positionId:'' }); load(); } else alert(res?.message||'Failed');
    } catch(e){ console.error(e); alert('Failed'); } finally { setSaving(false); }
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Assign Positions</h1>
      {loading? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <form onSubmit={submit} className="space-y-4 max-w-xl">
          <label className="flex flex-col text-sm"><span className="mb-1">Staff/Teacher</span>
              <select name="staffId" value={form.staffId} onChange={onChange} className="border rounded px-2 py-2" required>
              <option value="">Select user</option>
                {staffs.map(s => <option key={s._id} value={s._id}>{s.name || s.employeeId}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm"><span className="mb-1">Position</span>
            <select name="positionId" value={form.positionId} onChange={onChange} className="border rounded px-2 py-2" required>
              <option value="">Select position</option>
              {positions.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{saving?'Assigning...':'Assign Position'}</button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'admin';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/assign-positions');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'admin');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
