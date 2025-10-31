import React, { useEffect, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

export default function AdminClassesPage({ menu }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', level: '', year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/classes');
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
      const res = await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ name: '', level: '', year: new Date().getFullYear() });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || '', level: item.level || '', year: item.year || new Date().getFullYear() });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/classes/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete class?')) return;
    await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Classes</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Add Class</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Level</th><th className="p-2">Year</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.level}</td>
                  <td className="p-2">{i.year}</td>
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

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Class" footer={null}>
        <form onSubmit={createSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
          <input type="number" className="border rounded px-2 py-1 md:col-span-2" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Class" footer={null}>
        <form onSubmit={editSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
          <input type="number" className="border rounded px-2 py-1 md:col-span-2" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/classes');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
