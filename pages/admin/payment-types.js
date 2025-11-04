import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../src/components/Modal';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';

const recurrenceOptions = [
  { value: 'none', label: 'One time' },
  { value: 'term', label: 'Per term' },
  { value: 'semester', label: 'Per semester' },
  { value: 'session', label: 'Per session' },
  { value: 'annual', label: 'Annual' },
  { value: 'monthly', label: 'Monthly' },
];

const emptyForm = { name: '', description: '', recurrence: 'none', active: true };

export default function AdminPaymentTypesPage({ menu }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await fetch('/api/admin/payment-types');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Unable to fetch payment types');
      setItems(json.value || []);
    } catch (e) {
      setListError(e.message || 'Unable to fetch payment types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCloseModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditing(null);
    setForm(emptyForm);
    setSubmitting(false);
    setFormError('');
  };

  const onCreate = () => {
    setFormError('');
    setForm(emptyForm);
    setOpenCreate(true);
  };

  const createSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/payment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create payment type');
      handleCloseModal();
      await load();
    } catch (e) {
      setFormError(e.message || 'Failed to create payment type');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setFormError('');
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      recurrence: item.recurrence || 'none',
      active: !!item.active,
    });
    setOpenEdit(true);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/payment-types/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update payment type');
      handleCloseModal();
      await load();
    } catch (e) {
      setFormError(e.message || 'Failed to update payment type');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete payment type?')) return;
    try {
      const res = await fetch(`/api/admin/payment-types/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success && res.status !== 200) throw new Error(json.message || 'Failed to delete payment type');
      await load();
    } catch (e) {
      setListError(e.message || 'Failed to delete payment type');
    }
  };

  const displayItems = useMemo(() => {
    const map = Object.fromEntries(recurrenceOptions.map(opt => [opt.value, opt.label]));
    return items.map(item => ({ ...item, recurrenceLabel: map[item.recurrence] || item.recurrence }));
  }, [items]);

  const renderTable = () => {
    if (loading) return <div>Loading...</div>;
    if (!displayItems.length) {
      return (
        <div className="rounded border border-dashed p-6 text-center text-sm text-gray-600">
          No payment types found. Click "Add Payment Type" to get started.
        </div>
      );
    }
    return (
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Description</th>
              <th className="p-2">Recurrence</th>
              <th className="p-2">Active</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map(item => (
              <tr key={item._id} className="border-t">
                <td className="p-2 lowercase font-medium">{item.name}</td>
                <td className="p-2 max-w-xs whitespace-pre-wrap text-gray-700">{item.description || '—'}</td>
                <td className="p-2">{item.recurrenceLabel}</td>
                <td className="p-2">{item.active ? 'Yes' : 'No'}</td>
                <td className="p-2 text-xs text-gray-500">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</td>
                <td className="p-2 flex gap-3">
                  <button onClick={() => startEdit(item)} className="text-blue-700 hover:underline">Edit</button>
                  <button onClick={() => remove(item._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Payment Types</h1>
        <button onClick={onCreate} className="bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 transition">
          Add Payment Type
        </button>
      </div>
      {listError && <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</div>}
      {renderTable()}

      <Modal open={openCreate} onClose={handleCloseModal} title="Add Payment Type" footer={null}>
        <form onSubmit={createSubmit} className="grid grid-cols-1 gap-3">
          {formError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Name</span>
            <input
              className="border rounded px-3 py-2"
              placeholder="e.g. tuition"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Recurrence</span>
            <select
              className="border rounded px-3 py-2"
              value={form.recurrence}
              onChange={e => setForm({ ...form, recurrence: e.target.value })}
            >
              {recurrenceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
            />
            <span>Active</span>
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Description</span>
            <textarea
              className="border rounded px-3 py-2"
              rows={3}
              placeholder="Optional description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-3 py-1.5 rounded border">Cancel</button>
            <button
              className="bg-blue-600 text-white px-3 py-1.5 rounded disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={openEdit} onClose={handleCloseModal} title="Edit Payment Type" footer={null}>
        <form onSubmit={editSubmit} className="grid grid-cols-1 gap-3">
          {formError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Name</span>
            <input
              className="border rounded px-3 py-2"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Recurrence</span>
            <select
              className="border rounded px-3 py-2"
              value={form.recurrence}
              onChange={e => setForm({ ...form, recurrence: e.target.value })}
            >
              {recurrenceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
            />
            <span>Active</span>
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Description</span>
            <textarea
              className="border rounded px-3 py-2"
              rows={3}
              placeholder="Optional description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-3 py-1.5 rounded border">Cancel</button>
            <button
              className="bg-blue-600 text-white px-3 py-1.5 rounded disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/payment-types');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
