import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

function Modal({ open, onClose, children, title = 'Edit Payment' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-sm px-2 py-1 rounded hover:bg-gray-100" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function StaffStudentPaymentsPage({ menu }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    async function loadMeta() {
      const res = await fetch('/api/staff/payment-details/meta').then(r => r.json());
      if (res?.success) setStudents(res.value.students || []);
    }
    loadMeta();
  }, []);

  async function loadRows(studentId) {
    setLoading(true);
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId);
    const res = await fetch(`/api/staff/payment-details?${params.toString()}`).then(r => r.json());
    if (res?.success) setRows(res.value || []);
    setLoading(false);
  }

  function openEdit(row) {
    setEdit({ ...row, amount: Number(row.amount)||0, date: row.date ? row.date.slice(0,10) : '', installments: (row.installments||[]).map(i=>({ amount: Number(i.amount)||0, date: i.date?.slice(0,10) || '', method: i.method || 'cash', reference: i.reference || '' })) });
    setOpen(true);
  }

  function updateInstallment(idx, key, val) {
    setEdit(prev => {
      const next = { ...prev };
      const arr = [...(next.installments || [])];
      const item = { ...arr[idx] };
      if (key === 'amount') item.amount = Number(val)||0; else item[key] = val;
      arr[idx] = item;
      next.installments = arr;
      next.amount = arr.reduce((s,i)=>s+(Number(i.amount)||0),0);
      return next;
    });
  }
  function addInstallment() {
    setEdit(prev => ({ ...prev, installments: [...(prev.installments||[]), { amount: 0, date: new Date().toISOString().slice(0,10), method: 'cash', reference: '' }] }));
  }
  function removeInstallment(idx) {
    setEdit(prev => {
      const arr = (prev.installments||[]).filter((_,i)=>i!==idx);
      return { ...prev, installments: arr, amount: arr.reduce((s,i)=>s+(Number(i.amount)||0),0) };
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const payload = {
      id: edit._id,
      amount: Number(edit.amount)||0,
      installments: (edit.installments||[]).map(i=>({ amount: Number(i.amount)||0, date: i.date, method: i.method, reference: i.reference })),
      method: edit.method,
      reference: edit.reference,
      status: edit.status,
      notes: edit.notes,
      date: edit.date,
    };
    const res = await fetch('/api/staff/payment-details', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
    if (res?.success) {
      setOpen(false);
      loadRows(selected);
    } else {
      alert(res?.message || 'Failed to update');
    }
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Student Payments</h1>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-2" value={selected} onChange={e => { setSelected(e.target.value); loadRows(e.target.value); }}>
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center opacity-80">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map(row => (
                <tr key={row._id} className="border-t">
                  <td className="px-3 py-2">{new Date(row.date || row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.payment?.title}</td>
                  <td className="px-3 py-2">{Number(row.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <button className="px-2 py-1 text-sm border rounded" onClick={() => openEdit(row)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        {!edit ? null : (
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 items-end">
              <label className="flex flex-col text-sm">
                <span className="mb-1">Method</span>
                <select className="border rounded px-2 py-2" value={edit.method || 'cash'} onChange={e => setEdit(prev => ({ ...prev, method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                  <option value="mobile">Mobile</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1">Reference</span>
                <input className="border rounded px-2 py-2" value={edit.reference || ''} onChange={e => setEdit(prev => ({ ...prev, reference: e.target.value }))} />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1">Status</span>
                <select className="border rounded px-2 py-2" value={edit.status} onChange={e => setEdit(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <div className="font-medium">Installments</div>
              {(edit.installments || []).map((inst, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <div className="text-xs mb-1">Amount</div>
                    <input type="number" step="0.01" min="0" className="border rounded px-2 py-2 w-full" value={inst.amount} onChange={e => updateInstallment(idx, 'amount', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <div className="text-xs mb-1">Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full" value={inst.date} onChange={e => updateInstallment(idx, 'date', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <div className="text-xs mb-1">Method</div>
                    <select className="border rounded px-2 py-2 w-full" value={inst.method} onChange={e => updateInstallment(idx, 'method', e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                      <option value="mobile">Mobile</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs mb-1">Reference</div>
                    <input className="border rounded px-2 py-2 w-full" value={inst.reference || ''} onChange={e => updateInstallment(idx, 'reference', e.target.value)} />
                  </div>
                  <div className="col-span-1 text-right">
                    <button type="button" className="text-red-600 text-sm" onClick={() => removeInstallment(idx)}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="px-2 py-1 border rounded text-sm" onClick={addInstallment}>Add installment</button>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/student-payments');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
