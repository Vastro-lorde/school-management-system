import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

function Modal({ open, onClose, children, title }) { if(!open) return null; return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded shadow-lg w-full max-w-xl">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button className="text-sm px-2 py-1 rounded hover:bg-gray-100" onClick={onClose}>Close</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>);
}

export default function AdminPositionsPage({ menu }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', description:'', staffOnly:false, allowedRoles:'staff,teacher' });
  const [editId, setEditId] = useState(null);

  async function load(){
    setLoading(true);
    try { const res = await fetch('/api/admin/positions').then(r=>r.json()); if(res?.success) setRows(res.value||[]); else if(res?.message) alert(res.message);} catch(e){console.error(e); alert('Failed to load');} finally { setLoading(false);} }
  useEffect(()=>{ load(); }, []);

  function onChange(e){ const {name,value,type,checked} = e.target; setForm(prev=>({...prev,[name]: type==='checkbox'? checked : value})); }

  async function submit(e){ e.preventDefault();
    const payload = { name: form.name, code: form.code||undefined, description: form.description, staffOnly: form.staffOnly, allowedRoles: form.allowedRoles.split(',').map(s=>s.trim()).filter(Boolean) };
    const url = '/api/admin/positions';
    const method = editId? 'PUT':'POST';
    const body = editId? JSON.stringify({ id: editId, ...payload }) : JSON.stringify(payload);
    const res = await fetch(url,{ method, headers:{'Content-Type':'application/json'}, body }).then(r=>r.json());
    if(res?.success){ setOpen(false); setEditId(null); setForm({ name:'', code:'', description:'', staffOnly:false, allowedRoles:'staff,teacher'}); load(); } else alert(res?.message||'Failed');
  }

  async function remove(id){ if(!confirm('Delete position?')) return; const res = await fetch(`/api/admin/positions?id=${id}`,{ method:'DELETE'}).then(r=>r.json()); if(res?.success) load(); else alert(res?.message||'Failed'); }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Positions</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>{ setOpen(true); setEditId(null); setForm({ name:'', code:'', description:'', staffOnly:false, allowedRoles:'staff,teacher'}); }}>New Position</button>
      </div>
      {loading? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Allowed Roles</th>
              <th className="px-3 py-2 text-left">Staff Only</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.code||''}</td>
                  <td className="px-3 py-2">{(r.allowedRoles||[]).join(', ')}</td>
                  <td className="px-3 py-2">{r.staffOnly? 'Yes':'No'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setEditId(r._id); setForm({ name:r.name, code:r.code||'', description:r.description||'', staffOnly: !!r.staffOnly, allowedRoles:(r.allowedRoles||[]).join(', ') }); setOpen(true); }}>Edit</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>remove(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={editId? 'Edit Position':'New Position'}>
        <form onSubmit={submit} className="space-y-3 text-sm">
          <label className="flex flex-col"><span className="mb-1">Name</span><input name="name" value={form.name} onChange={onChange} className="border rounded px-2 py-2" required /></label>
          <label className="flex flex-col"><span className="mb-1">Code</span><input name="code" value={form.code} onChange={onChange} className="border rounded px-2 py-2" /></label>
          <label className="flex flex-col"><span className="mb-1">Description</span><textarea name="description" value={form.description} onChange={onChange} rows={3} className="border rounded px-2 py-2" /> </label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="staffOnly" checked={form.staffOnly} onChange={onChange} /><span>Staff Only</span></label>
          <label className="flex flex-col"><span className="mb-1">Allowed Roles (comma separated)</span><input name="allowedRoles" value={form.allowedRoles} onChange={onChange} className="border rounded px-2 py-2" /></label>
          <div className="flex justify-end gap-2"><button type="button" className="px-3 py-2 border rounded" onClick={()=>setOpen(false)}>Cancel</button><button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'admin';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/positions');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'admin');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
