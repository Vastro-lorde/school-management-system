import React, { useEffect, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

export default function AdminTimetablesPage({ menu }) {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [form, setForm] = useState({ classId: '', day: '', assessmentId: '', periods: [] });
  const [periodInput, setPeriodInput] = useState({ subjectId: '', teacherId: '', startTime: '', endTime: '' });
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
      const [tt, cls, asmt, sub, stf] = await Promise.all([
        fetch('/api/admin/timetables').then(r => r.json()),
        fetch('/api/admin/classes').then(r => r.json()),
        fetch('/api/admin/assessments').then(r => r.json()),
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/admin/staffs').then(r => r.json()),
      ]);
      if (!tt.success) throw new Error(tt.message||'Failed');
      if (!cls.success) throw new Error(cls.message||'Failed');
      if (!asmt.success) throw new Error(asmt.message||'Failed');
      if (!sub.success) throw new Error(sub.message||'Failed');
      if (!stf.success) throw new Error(stf.message||'Failed');
      setItems(tt.value); setClasses(cls.value); setAssessments(asmt.value); setSubjects(sub.value); setStaffs(stf.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addPeriod = () => {
    setForm(f => ({ ...f, periods: [...f.periods, periodInput] }));
    setPeriodInput({ subjectId: '', teacherId: '', startTime: '', endTime: '' });
  };

  const removePeriodAt = (idx) => {
    setForm(f => ({ ...f, periods: f.periods.filter((_, i) => i !== idx) }));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      // validation
      const v = validateTimetable(form);
      if (v) { setError(v); return; }
      const payload = { ...form, assessmentId: form.assessmentId || null };
      const res = await fetch('/api/admin/timetables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ classId: '', day: '', assessmentId: '', periods: [] });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete timetable?')) return;
    await fetch(`/api/admin/timetables/${id}`, { method: 'DELETE' });
    await load();
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      classId: item.classId || '',
      day: item.day || '',
      assessmentId: item.assessmentId || '',
      periods: Array.isArray(item.periods) ? item.periods : [],
    });
    setOpenEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const v = validateTimetable(form);
      if (v) { setError(v); return; }
      const payload = { ...form, assessmentId: form.assessmentId || null };
      const res = await fetch(`/api/admin/timetables/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const validateTimetable = (data) => {
    if (!data.classId) return 'Class is required';
    if (!data.day) return 'Day is required';
    if (!Array.isArray(data.periods) || data.periods.length === 0) return 'At least one period is required';
    for (let idx = 0; idx < data.periods.length; idx++) {
      const p = data.periods[idx] || {};
      if (!p.subjectId) return `Period ${idx + 1}: subject is required`;
      if (!p.teacherId) return `Period ${idx + 1}: teacher is required`;
      if (!p.startTime || !p.endTime) return `Period ${idx + 1}: start and end time required`;
      if (p.startTime >= p.endTime) return `Period ${idx + 1}: end time must be after start time`;
    }
    return '';
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Timetables</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => { setForm({ classId: '', day: '', assessmentId: '', periods: [] }); setOpenCreate(true); }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Timetable</button>
      </div>
      <div className="mb-3">
        <input className="border rounded px-2 py-1 w-full md:w-80" placeholder="Search by class, day or assessment title" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Timetable" footer={null}>
        <form onSubmit={submitCreate} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="border rounded px-2 py-1" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input className="border rounded px-2 py-1" placeholder="Day (e.g., Monday)" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} />
            <select className="border rounded px-2 py-1" value={form.assessmentId} onChange={e => setForm({ ...form, assessmentId: e.target.value })}>
              <option value="">No Assessment</option>
              {assessments.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
            </select>
          </div>
          <div className="border-t pt-3">
            <div className="font-medium mb-2">Add Period</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select className="border rounded px-2 py-1" value={periodInput.subjectId} onChange={e => setPeriodInput({ ...periodInput, subjectId: e.target.value })}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select className="border rounded px-2 py-1" value={periodInput.teacherId} onChange={e => setPeriodInput({ ...periodInput, teacherId: e.target.value })}>
                <option value="">Select teacher/staff</option>
                {staffs.map(s => <option key={s._id} value={s._id}>{s.name}{s.employeeId ? ` (${s.employeeId})` : ''}</option>)}
              </select>
              <input className="border rounded px-2 py-1" placeholder="Start Time" value={periodInput.startTime} onChange={e => setPeriodInput({ ...periodInput, startTime: e.target.value })} />
              <input className="border rounded px-2 py-1" placeholder="End Time" value={periodInput.endTime} onChange={e => setPeriodInput({ ...periodInput, endTime: e.target.value })} />
              <button type="button" onClick={addPeriod} className="bg-gray-700 text-white px-3 py-1 rounded">Add Period</button>
            </div>
            <div className="mt-2 text-sm">
              {form.periods.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {form.periods.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{(subjects.find(s=>s._id===p.subjectId)||{}).name || 'Subject'} • {(staffs.find(s=>s._id===p.teacherId)||{}).name || 'Teacher'} • {p.startTime}-{p.endTime}</span>
                      <button type="button" onClick={() => removePeriodAt(idx)} className="text-red-600 text-xs">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
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
            <thead><tr className="text-left"><th className="p-2">Class</th><th className="p-2">Day</th><th className="p-2">Assessment</th><th className="p-2">Periods</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items
                .filter(i => {
                  if (!search) return true;
                  const cls = (classes.find(c => c._id === i.classId) || {}).name || '';
                  const asmt = (assessments.find(a => a._id === i.assessmentId) || {}).title || '';
                  return [cls, i.day || '', asmt].some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
                })
                .slice((page-1)*pageSize, page*pageSize)
                .map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{(classes.find(c => c._id === i.classId) || {}).name || i.classId}</td>
                  <td className="p-2">{i.day}</td>
                  <td className="p-2">{(assessments.find(a => a._id === i.assessmentId) || {}).title || '-'}</td>
                  <td className="p-2">{Array.isArray(i.periods) ? i.periods.length : 0}</td>
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
            <button disabled={((items.filter(i => { if (!search) return true; const cls=(classes.find(c=>c._id===i.classId)||{}).name||''; const asmt=(assessments.find(a=>a._id===i.assessmentId)||{}).title||''; return [cls,i.day||'',asmt].some(v=>(v||'').toLowerCase().includes(search.toLowerCase())); })).length) <= page*pageSize} onClick={() => setPage(p => p+1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Timetable" footer={null}>
        <form onSubmit={submitEdit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="border rounded px-2 py-1" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input className="border rounded px-2 py-1" placeholder="Day (e.g., Monday)" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} />
            <select className="border rounded px-2 py-1" value={form.assessmentId} onChange={e => setForm({ ...form, assessmentId: e.target.value })}>
              <option value="">No Assessment</option>
              {assessments.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
            </select>
          </div>
          <div className="border-t pt-3">
            <div className="font-medium mb-2">Periods</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select className="border rounded px-2 py-1" value={periodInput.subjectId} onChange={e => setPeriodInput({ ...periodInput, subjectId: e.target.value })}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select className="border rounded px-2 py-1" value={periodInput.teacherId} onChange={e => setPeriodInput({ ...periodInput, teacherId: e.target.value })}>
                <option value="">Select teacher/staff</option>
                {staffs.map(s => <option key={s._id} value={s._id}>{s.name}{s.employeeId ? ` (${s.employeeId})` : ''}</option>)}
              </select>
              <input className="border rounded px-2 py-1" placeholder="Start Time" value={periodInput.startTime} onChange={e => setPeriodInput({ ...periodInput, startTime: e.target.value })} />
              <input className="border rounded px-2 py-1" placeholder="End Time" value={periodInput.endTime} onChange={e => setPeriodInput({ ...periodInput, endTime: e.target.value })} />
              <button type="button" onClick={addPeriod} className="bg-gray-700 text-white px-3 py-1 rounded">Add Period</button>
            </div>
            <div className="mt-2 text-sm">
              {form.periods.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {form.periods.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{(subjects.find(s=>s._id===p.subjectId)||{}).name || 'Subject'} • {(staffs.find(s=>s._id===p.teacherId)||{}).name || 'Teacher'} • {p.startTime}-{p.endTime}</span>
                      <button type="button" onClick={() => removePeriodAt(idx)} className="text-red-600 text-xs">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/timetables');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
