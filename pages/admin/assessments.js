import React, { useEffect, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

const KINDS = ['exam', 'test', 'quiz', 'assignment', 'classwork', 'project', 'other'];

export default function AdminAssessmentsPage({ menu }) {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: '', kind: 'exam', classIds: [], subjectIds: [], startAt: '', endAt: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [asmt, cls, sub] = await Promise.all([
        fetch('/api/admin/assessments').then(r => r.json()),
        fetch('/api/admin/classes').then(r => r.json()),
        fetch('/api/admin/subjects').then(r => r.json()),
      ]);
      if (!asmt.success) throw new Error(asmt.message||'Failed');
      if (!cls.success) throw new Error(cls.message||'Failed');
      if (!sub.success) throw new Error(sub.message||'Failed');
      setItems(asmt.value); setClasses(cls.value); setSubjects(sub.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      const v = validate(form);
      if (v) { setError(v); return; }
      const payload = { ...form, classIds: form.classIds, subjectIds: form.subjectIds };
      const res = await fetch('/api/admin/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ title: '', kind: 'exam', classIds: [], subjectIds: [], startAt: '', endAt: '', description: '' });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete assessment?')) return;
    await fetch(`/api/admin/assessments/${id}`, { method: 'DELETE' });
    await load();
  };

  const toggleMulti = (key, id) => {
    setForm(f => ({ ...f, [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id] }));
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      kind: item.kind || 'exam',
      classIds: item.classIds || [],
      subjectIds: item.subjectIds || [],
      startAt: item.startAt ? new Date(item.startAt).toISOString().slice(0,16) : '',
      endAt: item.endAt ? new Date(item.endAt).toISOString().slice(0,16) : '',
      description: item.description || '',
    });
    setOpenEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const v = validate(form);
      if (v) { setError(v); return; }
      const payload = { ...form };
      const res = await fetch(`/api/admin/assessments/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const validate = (f) => {
    if (!f.title?.trim()) return 'Title is required';
    if (f.startAt && f.endAt && new Date(f.startAt) >= new Date(f.endAt)) return 'End time must be after start time';
    return '';
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Assessments</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Add Assessment</button>
      </div>
      <div className="mb-3">
        <input className="border rounded px-2 py-1 w-full md:w-80" placeholder="Search by title or kind" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Assessment" footer={null}>
        <form onSubmit={submitCreate} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="border rounded px-2 py-1" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <input type="datetime-local" className="border rounded px-2 py-1" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
            <input type="datetime-local" className="border rounded px-2 py-1" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} />
          </div>
          <textarea className="border rounded px-2 py-1 w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="font-medium mb-1">Classes</div>
              <div className="max-h-40 overflow-auto border rounded p-2 bg-white/60 dark:bg-gray-900/30">
                {classes.map(c => (
                  <label key={c._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.classIds.includes(c._id)} onChange={() => toggleMulti('classIds', c._id)} />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Subjects</div>
              <div className="max-h-40 overflow-auto border rounded p-2 bg-white/60 dark:bg-gray-900/30">
                {subjects.map(s => (
                  <label key={s._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.subjectIds.includes(s._id)} onChange={() => toggleMulti('subjectIds', s._id)} />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>
      
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Title</th><th className="p-2">Kind</th><th className="p-2">Classes</th><th className="p-2">Subjects</th><th className="p-2">Schedule</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items
                .filter(i => {
                  if (!search) return true;
                  return [i.title || '', i.kind || ''].some(v => (v||'').toLowerCase().includes(search.toLowerCase()));
                })
                .slice((page-1)*pageSize, page*pageSize)
                .map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.title}</td>
                  <td className="p-2">{i.kind}</td>
                  <td className="p-2">{Array.isArray(i.classIds) ? i.classIds.length : 0}</td>
                  <td className="p-2">{Array.isArray(i.subjectIds) ? i.subjectIds.length : 0}</td>
                  <td className="p-2">{i.startAt ? new Date(i.startAt).toLocaleString() : '-'}{i.endAt ? ' - ' + new Date(i.endAt).toLocaleString() : ''}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(i)} className="text-blue-700">Edit</button>
                    <button onClick={() => remove(i._id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
            <span>Page {page}</span>
            <button disabled={(items.filter(i => { if (!search) return true; return [i.title||'', i.kind||''].some(v => (v||'').toLowerCase().includes(search.toLowerCase())); })).length <= page*pageSize} onClick={() => setPage(p => p+1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Assessment" footer={null}>
        <form onSubmit={submitEdit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="border rounded px-2 py-1" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <input type="datetime-local" className="border rounded px-2 py-1" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
            <input type="datetime-local" className="border rounded px-2 py-1" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} />
          </div>
          <textarea className="border rounded px-2 py-1 w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="font-medium mb-1">Classes</div>
              <div className="max-h-40 overflow-auto border rounded p-2 bg-white/60 dark:bg-gray-900/30">
                {classes.map(c => (
                  <label key={c._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.classIds.includes(c._id)} onChange={() => toggleMulti('classIds', c._id)} />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Subjects</div>
              <div className="max-h-40 overflow-auto border rounded p-2 bg-white/60 dark:bg-gray-900/30">
                {subjects.map(s => (
                  <label key={s._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.subjectIds.includes(s._id)} onChange={() => toggleMulti('subjectIds', s._id)} />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/assessments');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(role);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
