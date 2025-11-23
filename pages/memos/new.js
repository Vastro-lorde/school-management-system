import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function NewMemoPage({ menu }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState([]); // {type,userId,role,departmentId,facultyId,label}
  const [lookup, setLookup] = useState({ term:'', results:[], loading:false });
  const [sending, setSending] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(()=>{ loadMeta(); }, []);
  async function loadMeta() {
    try {
      const [depRes, facRes] = await Promise.all([
        fetch('/api/lookup/departments').then(r=>r.json()),
        fetch('/api/lookup/faculties').then(r=>r.json()),
      ]);
      if (depRes?.success) setDepartments(depRes.value||[]);
      if (facRes?.success) setFaculties(facRes.value||[]);
    } catch (e) { /* silent */ }
  }

  async function search(term) {
    setLookup(l => ({ ...l, loading:true, term }));
    try {
      const res = await fetch(`/api/lookup/users?q=${encodeURIComponent(term)}`).then(r=>r.json());
      if (res?.success) setLookup(l => ({ ...l, results: res.value||[] })); else setLookup(l=>({...l, results:[]}));
    } catch (e) { console.error(e); setLookup(l=>({...l, results:[]})); } finally { setLookup(l=>({...l, loading:false})); }
  }

  function addRecipientUser(u) {
    if (recipients.some(r => r.type==='user' && r.userId===u.userId)) return;
    setRecipients(r => [...r, { type:'user', userId: u.userId, label: u.label }]);
  }
  function addRecipientRole(role) {
    if (recipients.some(r => r.type==='role' && r.role===role)) return;
    setRecipients(r => [...r, { type:'role', role, label: `Role: ${role}` }]);
  }
  function addRecipientDepartment(dep) {
    if (recipients.some(r => r.type==='department' && r.departmentId===dep._id)) return;
    setRecipients(r => [...r, { type:'department', departmentId: dep._id, label: `Department: ${dep.name}` }]);
  }
  function addRecipientFaculty(fac) {
    if (recipients.some(r => r.type==='faculty' && r.facultyId===fac._id)) return;
    setRecipients(r => [...r, { type:'faculty', facultyId: fac._id, label: `Faculty: ${fac.name}` }]);
  }
  function removeRecipient(idx) { setRecipients(r => r.filter((_,i)=>i!==idx)); }

  async function send(e) {
    e.preventDefault();
    setSending(true);
    try {
  const apiRecipients = recipients.map(r => ({ type: r.type, userId: r.userId, role: r.role, departmentId: r.departmentId, facultyId: r.facultyId }));
      const res = await fetch('/api/memos/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, body, recipients: apiRecipients }) }).then(r=>r.json());
      if (res?.success) { alert('Memo sent'); setSubject(''); setBody(''); setRecipients([]); }
      else alert(res?.message||'Failed');
    } catch (e) { console.error(e); alert('Failed'); } finally { setSending(false); }
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">New Memo</h1>
      <form onSubmit={send} className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm mb-1">Subject</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} className="border rounded p-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Body</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} className="border rounded p-2 w-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Recipients</span>
            <div className="flex gap-2">
              <button type="button" onClick={()=>addRecipientRole('student')} className="px-2 py-1 text-xs border rounded">All Students</button>
              <button type="button" onClick={()=>addRecipientRole('staff')} className="px-2 py-1 text-xs border rounded">All Staff</button>
              <button type="button" onClick={()=>addRecipientRole('teacher')} className="px-2 py-1 text-xs border rounded">All Teachers</button>
            </div>
          </div>
          <div className="space-y-2">
            {recipients.map((r,i)=>(
              <div key={i} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                <span>{r.label}</span>
                <button type="button" onClick={()=>removeRecipient(i)} className="text-red-600">x</button>
              </div>
            ))}
            {recipients.length===0 && <div className="text-xs opacity-60">No recipients selected.</div>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Departments</label>
            <div className="border rounded p-2 max-h-48 overflow-auto space-y-1 text-xs">
              {departments.map(dep => (
                <div key={dep._id} className="flex items-center justify-between">
                  <span>{dep.name}</span>
                  <button type="button" onClick={()=>addRecipientDepartment(dep)} className="px-2 py-0.5 border rounded">Add</button>
                </div>
              ))}
              {departments.length===0 && <div className="opacity-60">No departments</div>}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Faculties</label>
            <div className="border rounded p-2 max-h-48 overflow-auto space-y-1 text-xs">
              {faculties.map(fac => (
                <div key={fac._id} className="flex items-center justify-between">
                  <span>{fac.name}</span>
                  <button type="button" onClick={()=>addRecipientFaculty(fac)} className="px-2 py-0.5 border rounded">Add</button>
                </div>
              ))}
              {faculties.length===0 && <div className="opacity-60">No faculties</div>}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Search Users</label>
          <input value={lookup.term} onChange={e=>{ const v=e.target.value; setLookup(l=>({...l,term:v})); if(v.length>1) search(v); }} className="border rounded p-2 w-full" placeholder="Type name or ID" />
          <div className="border rounded mt-2 max-h-40 overflow-auto text-sm">
            {lookup.loading && <div className="p-2 text-xs opacity-60">Searching...</div>}
            {!lookup.loading && lookup.results.map(u => (
              <div key={u.userId} className="px-2 py-1 hover:bg-gray-50 cursor-pointer" onClick={()=>addRecipientUser(u)}>{u.label}</div>
            ))}
            {!lookup.loading && lookup.results.length===0 && lookup.term.length>1 && <div className="p-2 text-xs opacity-60">No matches.</div>}
          </div>
        </div>
        <div className="flex justify-end">
          <button disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{sending?'Sending...':'Send Memo'}</button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/memos/new');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(role);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
