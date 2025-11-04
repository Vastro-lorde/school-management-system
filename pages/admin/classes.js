import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

const defaultForm = {
  name: '',
  level: '',
  year: new Date().getFullYear(),
  classTeacher: '',
  subjects: [],
};

export default function AdminClassesPage({ menu }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [options, setOptions] = useState({ staff: [], subjects: [] });

  const staffLookup = useMemo(() => {
    const map = new Map();
    (options.staff || []).forEach(s => map.set(s._id, s));
    return map;
  }, [options.staff]);

  const subjectLookup = useMemo(() => {
    const map = new Map();
    (options.subjects || []).forEach(s => map.set(s._id, s));
    return map;
  }, [options.subjects]);

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

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/admin/classes/options');
      const json = await res.json();
      if (json.success) setOptions(json.value || { staff: [], subjects: [] });
    } catch (e) {
      // ignore silently
    }
  };

  useEffect(() => { load(); loadOptions(); }, []);

  const createSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        year: Number(form.year) || new Date().getFullYear(),
        classTeacher: form.classTeacher || undefined,
        subjects: form.subjects || [],
      };
      const res = await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm(defaultForm);
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      level: item.level || '',
      year: item.year || new Date().getFullYear(),
      classTeacher: item.classTeacher?._id || item.classTeacher || '',
      subjects: (item.subjects || []).map(sub => sub._id || sub),
    });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        year: Number(form.year) || new Date().getFullYear(),
        classTeacher: form.classTeacher || undefined,
        subjects: form.subjects || [],
      };
      const res = await fetch(`/api/admin/classes/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
        <button onClick={() => { setForm(defaultForm); setOpenCreate(true); }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Class</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Level</th>
                <th className="p-2">Year</th>
                <th className="p-2">Class Teacher</th>
                <th className="p-2">Subjects</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.level}</td>
                  <td className="p-2">{i.year}</td>
                  <td className="p-2">{i.classTeacher?.name || staffLookup.get(i.classTeacher)?.name || '—'}</td>
                  <td className="p-2 space-x-1 space-y-1">
                    {(() => {
                      const nodes = (i.subjects || []).map(sub => {
                        const subject = typeof sub === 'object' ? sub : subjectLookup.get(sub);
                        if (!subject) return null;
                        return (
                          <span key={subject._id || sub} className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                            {subject.name || subject.subjectCode || 'Subject'}
                          </span>
                        );
                      }).filter(Boolean);
                      return nodes.length ? nodes : '—';
                    })()}
                  </td>
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
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="border rounded px-2 py-1" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
          <input type="number" className="border rounded px-2 py-1" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          <select className="border rounded px-2 py-1" value={form.classTeacher || ''} onChange={e => setForm({ ...form, classTeacher: e.target.value })}>
            <option value="">Select class teacher</option>
            {(options.staff || []).map(s => (
              <option key={s._id} value={s._id}>{s.name}{s.employeeId ? ` (${s.employeeId})` : ''}</option>
            ))}
          </select>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Subjects</label>
            <select multiple className="border rounded px-2 py-1 w-full h-40" value={form.subjects} onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setForm(prev => ({ ...prev, subjects: selected }));
            }}>
              {(options.subjects || []).map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}{sub.subjectCode ? ` (${sub.subjectCode})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Class" footer={null}>
        <form onSubmit={editSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="border rounded px-2 py-1" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
          <input type="number" className="border rounded px-2 py-1" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          <select className="border rounded px-2 py-1" value={form.classTeacher || ''} onChange={e => setForm({ ...form, classTeacher: e.target.value })}>
            <option value="">Select class teacher</option>
            {(options.staff || []).map(s => (
              <option key={s._id} value={s._id}>{s.name}{s.employeeId ? ` (${s.employeeId})` : ''}</option>
            ))}
          </select>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Subjects</label>
            <select multiple className="border rounded px-2 py-1 w-full h-40" value={form.subjects} onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setForm(prev => ({ ...prev, subjects: selected }));
            }}>
              {(options.subjects || []).map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}{sub.subjectCode ? ` (${sub.subjectCode})` : ''}</option>
              ))}
            </select>
          </div>
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
