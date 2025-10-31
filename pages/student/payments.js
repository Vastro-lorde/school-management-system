import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

function Modal({ open, onClose, children, title = 'Make Payment' }) {
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

export default function StudentPaymentsPage({ menu }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState({ payments: [] });
  const [form, setForm] = useState({ payment: '', useInstallments: false, installments: [], amount: 0, method: 'cash', reference: '', notes: '', date: '' });
  const [instOpen, setInstOpen] = useState(false);
  const [instFor, setInstFor] = useState(null);
  const [instForm, setInstForm] = useState({ amount: 0, date: new Date().toISOString().slice(0,10), method: 'cash', reference: '' });

  async function loadAll() {
    const [list, payments] = await Promise.all([
      fetch('/api/student/payment-details').then(r => r.json()),
      fetch('/api/admin/payment-details/meta').then(r => r.json()),
    ]);
    if (list?.success) setRows(list.value || []);
    if (payments?.success) setMeta({ payments: payments.value.payments || [] });
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }
  function updateInstallment(idx, key, val) {
    setForm(prev => {
      const arr = [...(prev.installments || [])];
      const it = { ...arr[idx] };
      if (key === 'amount') it.amount = Number(val)||0; else it[key] = val;
      arr[idx] = it;
      const amount = arr.reduce((s,i)=>s+(Number(i.amount)||0),0);
      return { ...prev, installments: arr, amount };
    });
  }
  function addInstallment() {
    setForm(prev => ({ ...prev, installments: [...(prev.installments||[]), { amount: 0, date: new Date().toISOString().slice(0,10), method: 'cash', reference: '' }] }));
  }
  function removeInstallment(idx) {
    setForm(prev => {
      const arr = (prev.installments||[]).filter((_,i)=>i!==idx);
      const amount = arr.reduce((s,i)=>s+(Number(i.amount)||0),0);
      return { ...prev, installments: arr, amount };
    });
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      payment: form.payment,
      amount: Number(form.amount)||0,
      installments: form.useInstallments ? form.installments.map(i=>({ amount: Number(i.amount)||0, date: i.date, method: i.method, reference: i.reference })) : [],
      method: form.method,
      reference: form.reference,
      notes: form.notes,
      date: form.date,
    };
    const res = await fetch('/api/student/payment-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
    if (res?.success) {
      setOpen(false);
      setForm({ payment: '', useInstallments: false, installments: [], amount: 0, method: 'cash', reference: '', notes: '', date: '' });
      loadAll();
    } else {
      alert(res?.message || 'Failed to create');
    }
  }

  async function addInst(e) {
    e.preventDefault();
    const res = await fetch(`/api/student/payment-details/${instFor}/.installments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(instForm) }).then(r => r.json());
    if (res?.success) {
      setInstOpen(false);
      setInstFor(null);
      setInstForm({ amount: 0, date: new Date().toISOString().slice(0,10), method: 'cash', reference: '' });
      loadAll();
    } else {
      alert(res?.message || 'Failed to add installment');
    }
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Payments</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setOpen(true)}>Make Payment</button>
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
                    <button className="px-2 py-1 text-sm border rounded" onClick={() => { setInstOpen(true); setInstFor(row._id); }}>Add installment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Make Payment Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1">Payment</span>
            <select name="payment" value={form.payment} onChange={onChange} className="border rounded px-2 py-2" required>
              <option value="">Select payment</option>
              {meta.payments.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.useInstallments} onChange={e => setForm(prev => ({ ...prev, useInstallments: e.target.checked, installments: e.target.checked ? prev.installments : [], amount: e.target.checked ? prev.installments.reduce((s,it)=>s+(Number(it.amount)||0),0) : Number(prev.amount)||0 }))} />
            <span>Pay in installments</span>
          </label>

          {!form.useInstallments ? (
            <div className="grid grid-cols-3 gap-3 items-end">
              <label className="flex flex-col text-sm">
                <span className="mb-1">Amount</span>
                <input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={onChange} className="border rounded px-2 py-2" required />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1">Date</span>
                <input name="date" type="date" value={form.date} onChange={onChange} className="border rounded px-2 py-2" />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1">Method</span>
                <select name="method" value={form.method} onChange={onChange} className="border rounded px-2 py-2">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                  <option value="mobile">Mobile</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              {(form.installments || []).map((inst, idx) => (
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
                    <input className="border rounded px-2 py-2 w-full" value={inst.reference || ''} onChange={e => updateInstallment(idx, 'reference', e.target.value)} placeholder="Txn/Receipt" />
                  </div>
                  <div className="col-span-1 text-right">
                    <button type="button" className="text-red-600 text-sm" onClick={() => removeInstallment(idx)}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="px-2 py-1 border rounded text-sm" onClick={addInstallment}>Add installment</button>
            </div>
          )}

          <label className="flex flex-col text-sm">
            <span className="mb-1">Reference</span>
            <input name="reference" value={form.reference} onChange={onChange} className="border rounded px-2 py-2" placeholder="Receipt/Txn ID" />
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1">Notes</span>
            <textarea name="notes" value={form.notes} onChange={onChange} className="border rounded px-2 py-2" rows={3} />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Submit</button>
          </div>
        </form>
      </Modal>

      {/* Add installment modal */}
      <Modal open={instOpen} onClose={() => setInstOpen(false)} title="Add installment">
        <form onSubmit={addInst} className="space-y-4">
          <div className="grid grid-cols-3 gap-3 items-end">
            <label className="flex flex-col text-sm">
              <span className="mb-1">Amount</span>
              <input type="number" step="0.01" min="0" className="border rounded px-2 py-2" value={instForm.amount} onChange={e => setInstForm(prev => ({ ...prev, amount: Number(e.target.value)||0 }))} />
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1">Date</span>
              <input type="date" className="border rounded px-2 py-2" value={instForm.date} onChange={e => setInstForm(prev => ({ ...prev, date: e.target.value }))} />
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1">Method</span>
              <select className="border rounded px-2 py-2" value={instForm.method} onChange={e => setInstForm(prev => ({ ...prev, method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="mobile">Mobile</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col text-sm">
            <span className="mb-1">Reference</span>
            <input className="border rounded px-2 py-2" value={instForm.reference} onChange={e => setInstForm(prev => ({ ...prev, reference: e.target.value }))} placeholder="Txn/Receipt" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded border" onClick={() => setInstOpen(false)}>Cancel</button>
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
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
  const ok = await permissionService.hasAccessToUrl(role, '/student/payments');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
