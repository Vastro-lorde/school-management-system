import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

const defaultForm = {
  title: '',
  code: '',
  department: '',
  creditHours: 0,
  level: '',
  description: '',
  active: true,
};

function CourseForm({ form, setForm, departments }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        className="border rounded px-2 py-1"
        placeholder="Title"
        value={form.title}
        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
        required
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Code"
        value={form.code}
        onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
        required
      />
      <select
        className="border rounded px-2 py-1"
        value={form.department || ''}
        onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
      >
        <option value="">Select department (optional)</option>
        {departments.map(d => (
          <option key={d._id} value={d._id}>
            {d.name}{d.code ? ` (${d.code})` : ''}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        className="border rounded px-2 py-1"
        placeholder="Credit hours"
        value={form.creditHours}
        onChange={e => setForm(prev => ({ ...prev, creditHours: Number(e.target.value) }))}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Level"
        value={form.level}
        onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
        />
        Active
      </label>
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

export default function AdminCoursesPage({ menu }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [options, setOptions] = useState({ departments: [] });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/courses');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load courses');
      setItems(json.value || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/admin/courses/options');
      const json = await res.json();
      if (json.success) setOptions(json.value || { departments: [] });
    } catch (e) {
      // ignore, options stay empty
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
        creditHours: Number(form.creditHours) || 0,
        department: form.department || undefined,
      };
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create course');
      setForm(defaultForm);
      setOpenCreate(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (course) => {
    setEditing(course);
    setForm({
      title: course.title || '',
      code: course.code || '',
      department: course.department?._id || course.department || '',
      creditHours: course.creditHours ?? 0,
      level: course.level || '',
      description: course.description || '',
      active: course.active !== false,
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
        creditHours: Number(form.creditHours) || 0,
        department: form.department || undefined,
      };
      const res = await fetch(`/api/admin/courses/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update course');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete course?')) return;
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    await load();
  };

  const departmentLookup = useMemo(() => {
    const map = new Map();
    for (const dept of options.departments || []) {
      map.set(dept._id, dept.name);
    }
    return map;
  }, [options.departments]);

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <button onClick={() => { setForm(defaultForm); setOpenCreate(true); }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Course</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Title</th>
                <th className="p-2">Code</th>
                <th className="p-2">Department</th>
                <th className="p-2">Credit Hours</th>
                <th className="p-2">Level</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-t">
                  <td className="p-2 font-medium">{item.title}</td>
                  <td className="p-2">{item.code}</td>
                  <td className="p-2">{item.department?.name || departmentLookup.get(item.department) || '—'}</td>
                  <td className="p-2">{item.creditHours ?? 0}</td>
                  <td className="p-2">{item.level || '—'}</td>
                  <td className="p-2">{item.active !== false ? <span className="text-green-600">Active</span> : <span className="text-gray-500">Inactive</span>}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(item)} className="text-blue-700">Edit</button>
                    <button onClick={() => remove(item._id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="p-3 text-center opacity-70" colSpan={7}>No courses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Course" footer={null}>
        <form onSubmit={createSubmit} className="space-y-4">
          <CourseForm form={form} setForm={setForm} departments={options.departments || []} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Course" footer={null}>
        <form onSubmit={editSubmit} className="space-y-4">
          <CourseForm form={form} setForm={setForm} departments={options.departments || []} />
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/courses');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
