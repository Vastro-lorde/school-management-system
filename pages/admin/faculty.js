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
  description: '',
  dean: '',
  departments: [],
  contactEmail: '',
  contactPhone: '',
  active: true,
};

function FacultyForm({ form, setForm, options }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        className="border rounded px-2 py-1"
        placeholder="Faculty name"
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        required
      />
      <select
        className="border rounded px-2 py-1"
        value={form.dean || ''}
        onChange={e => setForm(prev => ({ ...prev, dean: e.target.value }))}
      >
        <option value="">Select dean (optional)</option>
        {(options.staff || []).map(staff => (
          <option key={staff._id} value={staff._id}>
            {staff.name}{staff.employeeId ? ` (${staff.employeeId})` : ''}
          </option>
        ))}
      </select>
      <input
        className="border rounded px-2 py-1"
        placeholder="Contact email"
        value={form.contactEmail}
        onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Contact phone"
        value={form.contactPhone}
        onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
        />
        Active
      </label>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Departments</label>
        <select
          multiple
          className="border rounded px-2 py-1 w-full h-40"
          value={form.departments}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            setForm(prev => ({ ...prev, departments: selected }));
          }}
        >
          {(options.departments || []).map(dep => (
            <option key={dep._id} value={dep._id}>
              {dep.name}{dep.code ? ` (${dep.code})` : ''}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="border rounded px-2 py-1 md:col-span-2"
        rows={4}
        placeholder="Description"
        value={form.description}
        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
      />
    </div>
  );
}

export default function AdminFacultyPage({ menu }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [options, setOptions] = useState({ departments: [], staff: [] });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/faculty');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load faculty records');
      setItems(json.value || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/admin/faculty/options');
      const json = await res.json();
      if (json.success) setOptions(json.value || { departments: [], staff: [] });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadOptions();
  }, []);

  const createSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = {
        ...form,
        departments: form.departments || [],
        dean: form.dean || undefined,
      };
      const res = await fetch('/api/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create faculty');
      setForm(defaultForm);
      setOpenCreate(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      dean: item.dean?._id || item.dean || '',
      departments: (item.departments || []).map(dep => dep._id || dep),
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
      active: item.active !== false,
    });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      const body = {
        ...form,
        departments: form.departments || [],
        dean: form.dean || undefined,
      };
      const res = await fetch(`/api/admin/faculty/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update faculty');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete faculty?')) return;
    await fetch(`/api/admin/faculty/${id}`, { method: 'DELETE' });
    await load();
  };

  const staffLookup = useMemo(() => {
    const map = new Map();
    for (const staff of options.staff || []) map.set(staff._id, staff.name);
    return map;
  }, [options.staff]);

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Faculty</h1>
        <button onClick={() => { setForm(defaultForm); setOpenCreate(true); }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Faculty</button>
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
                <th className="p-2">Dean</th>
                <th className="p-2">Departments</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-t">
                  <td className="p-2 font-medium">{item.name}</td>
                  <td className="p-2">{item.dean?.name || staffLookup.get(item.dean) || '—'}</td>
                  <td className="p-2">
                    {(item.departments || []).length ? (
                      <div className="space-y-1">
                        {(item.departments || []).map(dep => (
                          <div key={(dep && dep._id) || dep} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block mr-1">
                            {dep?.name || dep}
                          </div>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="p-2">{item.active !== false ? <span className="text-green-600">Active</span> : <span className="text-gray-500">Inactive</span>}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(item)} className="text-blue-700">Edit</button>
                    <button onClick={() => remove(item._id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="p-3 text-center opacity-70" colSpan={5}>No faculty records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Faculty" footer={null}>
        <form onSubmit={createSubmit} className="space-y-4">
          <FacultyForm form={form} setForm={setForm} options={options} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Faculty" footer={null}>
        <form onSubmit={editSubmit} className="space-y-4">
          <FacultyForm form={form} setForm={setForm} options={options} />
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/faculty');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
