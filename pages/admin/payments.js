import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

export default function AdminPaymentsPage({ menu }) {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    classes: [],
    subjects: [],
    departments: [],
    lineItems: [{ itemId: '', amount: 0 }],
    effectiveDate: '',
    dueDate: '',
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadMaster = async () => {
    const responses = await Promise.all([
      fetch('/api/admin/payment-types'),
      fetch('/api/admin/classes'),
      fetch('/api/admin/subjects'),
      fetch('/api/admin/departments'),
      fetch('/api/admin/payment-items'),
    ]);
    const [typesRes, classesRes, subjectsRes, departmentsRes, itemsRes] = await Promise.all(responses.map(r => r.json()));
    if (!typesRes.success) throw new Error(typesRes.message || 'Unable to load payment types');
    if (!classesRes.success) throw new Error(classesRes.message || 'Unable to load classes');
    if (!subjectsRes.success) throw new Error(subjectsRes.message || 'Unable to load subjects');
    if (!departmentsRes.success) throw new Error(departmentsRes.message || 'Unable to load departments');
    if (!itemsRes.success) throw new Error(itemsRes.message || 'Unable to load payment items');
    setTypes((typesRes.value || []).filter(t => t.active !== false));
    setClasses(classesRes.value || []);
    setSubjects(subjectsRes.value || []);
    setDepartments(departmentsRes.value || []);
    setCatalogItems(itemsRes.value || []);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await loadMaster();
      const res = await fetch('/api/admin/payments');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setItems(json.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createSubmit = async (e) => {
    e.preventDefault();
    if (!form.classes.length) return setError('Select at least one class');
    if (!form.lineItems.filter(li => li.itemId).length) return setError('Add at least one payment item');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        classes: form.classes,
        subjects: form.subjects,
        departments: form.departments,
        items: form.lineItems.filter(li => li.itemId).map(li => ({ itemId: li.itemId, amount: Number(li.amount || 0) })),
        effectiveDate: form.effectiveDate || undefined,
        dueDate: form.dueDate || undefined,
        active: form.active,
      };
      const res = await fetch('/api/admin/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setForm({ title: '', description: '', type: '', classes: [], subjects: [], departments: [], lineItems: [{ itemId: '', amount: 0 }], effectiveDate: '', dueDate: '', active: true });
      setOpenCreate(false);
      await load();
    } catch (e) { setError(e.message); }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      type: item.type?._id || item.type || '',
      classes: (item.classes || []).map(c => c._id || c),
      subjects: (item.subjects || []).map(s => s._id || s),
      departments: (item.departments || []).map(d => d._id || d),
      lineItems: (item.items || []).map(li => ({ itemId: (li.item?._id || li.item), amount: li.amount })),
      effectiveDate: item.effectiveDate ? item.effectiveDate.substring(0, 10) : '',
      dueDate: item.dueDate ? item.dueDate.substring(0, 10) : '',
      active: !!item.active,
    });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    if (!form.classes.length) return setError('Select at least one class');
    if (!form.lineItems.filter(li => li.itemId).length) return setError('Add at least one payment item');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        classes: form.classes,
        subjects: form.subjects,
        departments: form.departments,
        items: form.lineItems.filter(li => li.itemId).map(li => ({ itemId: li.itemId, amount: Number(li.amount || 0) })),
        effectiveDate: form.effectiveDate || undefined,
        dueDate: form.dueDate || undefined,
        active: form.active,
      };
      const res = await fetch(`/api/admin/payments/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete payment?')) return;
    await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
    await load();
  };

  const addLine = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { itemId: '', amount: 0 }] }));
  const removeLine = (idx) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
  const updateLine = (idx, patch) => setForm(f => ({ ...f, lineItems: f.lineItems.map((li, i) => i === idx ? { ...li, ...patch } : li) }));

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>
      <div className="mb-4">
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Create Payment</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Title</th><th className="p-2">Type</th><th className="p-2">Classes</th><th className="p-2">Items</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.title}</td>
                  <td className="p-2">{i.type?.name || ''}</td>
                  <td className="p-2">{(i.classes || []).map(c => c.name || '').join(', ')}</td>
                  <td className="p-2">{(i.items || []).length}</td>
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

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Payment" footer={null}>
        <form onSubmit={createSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="">Select Type</option>
            {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
          </label>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Classes</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.classes} onChange={e => setForm({ ...form, classes: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Subjects (optional)</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.subjects} onChange={e => setForm({ ...form, subjects: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Departments (optional)</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.departments} onChange={e => setForm({ ...form, departments: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line Items</label>
              <button type="button" onClick={addLine} className="text-blue-700">Add</button>
            </div>
            <div className="space-y-2 mt-1">
              {form.lineItems.map((li, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="border rounded px-2 py-1 flex-1" value={li.itemId} onChange={e => updateLine(idx, { itemId: e.target.value })}>
                    <option value="">Select Item</option>
                    {catalogItems.map(ci => <option key={ci._id} value={ci._id}>{ci.name}</option>)}
                  </select>
                  <input className="border rounded px-2 py-1 w-32" placeholder="Amount" value={li.amount} onChange={e => updateLine(idx, { amount: e.target.value })} />
                  <button type="button" onClick={() => removeLine(idx)} className="text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <input type="date" className="border rounded px-2 py-1" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
          <input type="date" className="border rounded px-2 py-1" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <textarea className="border rounded px-2 py-1 md:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Payment" footer={null}>
        <form onSubmit={editSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="">Select Type</option>
            {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
          </label>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Classes</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.classes} onChange={e => setForm({ ...form, classes: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Subjects (optional)</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.subjects} onChange={e => setForm({ ...form, subjects: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Departments (optional)</label>
            <select multiple className="border rounded px-2 py-1 w-full" value={form.departments} onChange={e => setForm({ ...form, departments: Array.from(e.target.selectedOptions).map(o => o.value) })}>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line Items</label>
              <button type="button" onClick={addLine} className="text-blue-700">Add</button>
            </div>
            <div className="space-y-2 mt-1">
              {form.lineItems.map((li, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="border rounded px-2 py-1 flex-1" value={li.itemId} onChange={e => updateLine(idx, { itemId: e.target.value })}>
                    <option value="">Select Item</option>
                    {catalogItems.map(ci => <option key={ci._id} value={ci._id}>{ci.name}</option>)}
                  </select>
                  <input className="border rounded px-2 py-1 w-32" placeholder="Amount" value={li.amount} onChange={e => updateLine(idx, { amount: e.target.value })} />
                  <button type="button" onClick={() => removeLine(idx)} className="text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <input type="date" className="border rounded px-2 py-1" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
          <input type="date" className="border rounded px-2 py-1" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/payments');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
