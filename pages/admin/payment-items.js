import React, { useEffect, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

export default function AdminPaymentItemsPage({ menu }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '', defaultAmount: 0, active: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payment-items');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setItems(json.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, defaultAmount: Number(form.defaultAmount || 0) };
      const res = await fetch('/api/admin/payment-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ name: '', code: '', description: '', defaultAmount: 0, active: true });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || '', code: item.code || '', description: item.description || '', defaultAmount: item.defaultAmount || 0, active: !!item.active });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, defaultAmount: Number(form.defaultAmount || 0) };
      const res = await fetch(`/api/admin/payment-items/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete payment item?')) return;
    await fetch(`/api/admin/payment-items/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Payment Items</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Add Payment Item</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Code</th><th className="p-2">Default Amount</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2 lowercase">{i.name}</td>
                  <td className="p-2">{i.code}</td>
                  <td className="p-2">{i.defaultAmount}</td>
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

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Payment Item" footer={null}>
        <form onSubmit={createSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name (e.g., tuition)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Default Amount" value={form.defaultAmount} onChange={e => setForm({ ...form, defaultAmount: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
          <textarea className="border rounded px-2 py-1 md:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Payment Item" footer={null}>
        <form onSubmit={editSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Default Amount" value={form.defaultAmount} onChange={e => setForm({ ...form, defaultAmount: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
          <textarea className="border rounded px-2 py-1 md:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/payment-items');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
