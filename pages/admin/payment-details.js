import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

function Loading({ text = 'Loading...' }) {
  return <div className="py-6 text-center opacity-80">{text}</div>;
}

function Modal({ open, onClose, children, title = 'Record Payment' }) {
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

export default function AdminPaymentDetailsPage({ menu }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState({ students: [], payments: [] });
  const [form, setForm] = useState({ student: '', payment: '', method: 'cash', reference: '', status: 'completed', notes: '', amount: 0, date: '', useInstallments: false, installments: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [listRes, metaRes] = await Promise.all([
          fetch('/api/admin/payment-details').then(r => r.json()),
          fetch('/api/admin/payment-details/meta').then(r => r.json()),
        ]);
        if (!mounted) return;
        if (listRes?.success) setItems(listRes.value || []);
        if (metaRes?.success) setMeta(metaRes.value || { students: [], payments: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedPayment = useMemo(() => meta.payments.find(p => String(p._id) === String(form.payment)), [meta, form.payment]);
  useEffect(() => {
    // Reset form parts that depend on payment when selection changes
    setForm(f => ({ ...f, amount: 0, installments: [], useInstallments: false }));
  }, [selectedPayment?._id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function updateInstallment(idx, key, val) {
    setForm(prev => {
      const installments = [...prev.installments];
      const next = { ...installments[idx] };
      if (key === 'amount') next.amount = Number(val) || 0;
      else next[key] = val;
      installments[idx] = next;
      const amount = installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      return { ...prev, installments, amount };
    });
  }
  function addInstallment() {
    setForm(prev => ({ ...prev, installments: [...prev.installments, { amount: 0, date: new Date().toISOString().slice(0,10), method: 'cash', reference: '' }] }));
  }
  function removeInstallment(idx) {
    setForm(prev => {
      const installments = prev.installments.filter((_, i) => i !== idx);
      const amount = installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      return { ...prev, installments, amount };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        student: form.student,
        payment: form.payment,
        amount: Number(form.amount) || 0,
        method: form.method,
        reference: form.reference,
        status: form.status,
        notes: form.notes,
        date: form.date ? new Date(form.date) : undefined,
        installments: form.useInstallments ? form.installments.map(i => ({ amount: Number(i.amount) || 0, date: i.date, method: i.method, reference: i.reference })) : [],
      };
      const res = await fetch('/api/admin/payment-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
      if (res?.success) {
        setOpen(false);
  setForm({ student: '', payment: '', method: 'cash', reference: '', status: 'completed', notes: '', amount: 0, date: '', useInstallments: false, installments: [] });
        const list = await fetch('/api/admin/payment-details').then(r => r.json());
        if (list?.success) setItems(list.value || []);
      } else {
        alert(res?.message || 'Failed to create');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Payment Details</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setOpen(true)}>Record Payment</button>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Reference</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map(row => (
                <tr key={row._id} className="border-t">
                  <td className="px-3 py-2">{new Date(row.date || row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{`${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim() || row.student?.admissionNo}</td>
                  <td className="px-3 py-2">{row.payment?.title}</td>
                  <td className="px-3 py-2">{Number(row.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{Array.isArray(row.installments) && row.installments.length > 0 ? `Installments (${row.installments.length})` : row.method}</td>
                  <td className="px-3 py-2">{Array.isArray(row.installments) && row.installments.length > 0 ? '-' : row.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              <span className="mb-1">Student</span>
              <select name="student" value={form.student} onChange={onChange} className="border rounded px-2 py-2" required>
                <option value="">Select student</option>
                {meta.students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1">Payment</span>
              <select name="payment" value={form.payment} onChange={onChange} className="border rounded px-2 py-2" required>
                <option value="">Select payment</option>
                {meta.payments.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.useInstallments} onChange={e => setForm(prev => ({ ...prev, useInstallments: e.target.checked, installments: e.target.checked ? prev.installments : [], amount: e.target.checked ? prev.installments.reduce((s,it)=>s+(Number(it.amount)||0),0) : Number(prev.amount)||0 }))} />
              <span>Paid in installments</span>
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
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <label className="flex flex-col text-sm">
              <span className="mb-1">Reference</span>
              <input name="reference" value={form.reference} onChange={onChange} className="border rounded px-2 py-2" placeholder="Receipt/Txn ID" />
            </label>
            <div />
            <div className="text-right">
              <div className="text-xs uppercase opacity-70">Total</div>
              <div className="text-xl font-semibold">{Number(form.amount || 0).toLocaleString()}</div>
            </div>
          </div>

          <label className="flex flex-col text-sm">
            <span className="mb-1">Notes</span>
            <textarea name="notes" value={form.notes} onChange={onChange} className="border rounded px-2 py-2" rows={3} />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" disabled={submitting} className="px-3 py-2 bg-blue-600 text-white rounded">{submitting ? 'Saving...' : 'Save'}</button>
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
  const ok = await permissionService.hasAccessToUrl(role, '/admin/payment-details');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
