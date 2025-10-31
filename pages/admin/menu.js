import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

export default function AdminMenuPage({ menu }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ label: '', url: '', icon: '', order: 0, active: true, parent: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/menu-items');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setItems(json.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, parent: form.parent || null, order: Number(form.order), active: !!form.active };
      const res = await fetch('/api/admin/menu-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ label: '', url: '', icon: '', order: 0, active: true, parent: '' });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({ label: item.label||'', url: item.url||'', icon: item.icon||'', order: item.order||0, active: !!item.active, parent: item.parent || '' });
    setOpenEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, parent: form.parent || null, order: Number(form.order), active: !!form.active };
      const res = await fetch(`/api/admin/menu-items/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete menu item?')) return;
    await fetch(`/api/admin/menu-items/${id}`, { method: 'DELETE' });
    await load();
  };

  const parentOptions = useMemo(() => items.filter(i => !editing || i._id !== editing._id), [items, editing]);

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Menu</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Add Menu Item</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Label</th><th className="p-2">URL</th><th className="p-2">Icon</th><th className="p-2">Parent</th><th className="p-2">Order</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.label}</td>
                  <td className="p-2">{i.url}</td>
                  <td className="p-2">{i.icon}</td>
                  <td className="p-2">{(items.find(p => p._id === i.parent) || {}).label || '-'}</td>
                  <td className="p-2">{i.order}</td>
                  <td className="p-2">{i.active ? 'Yes' : 'No'}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(i)} className="text-blue-700">Edit</button>
                    <button onClick={() => remove(i._id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Menu Item" footer={null}>
        <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Icon" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })}>
            <option value="">No parent</option>
            {items.map(i => (<option key={i._id} value={i._id}>{i.label}</option>))}
          </select>
          <input type="number" className="border rounded px-2 py-1" placeholder="Order" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Menu Item" footer={null}>
        <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Icon" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })}>
            <option value="">No parent</option>
            {parentOptions.map(i => (<option key={i._id} value={i._id}>{i.label}</option>))}
          </select>
          <input type="number" className="border rounded px-2 py-1" placeholder="Order" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenEdit(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/menu');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
