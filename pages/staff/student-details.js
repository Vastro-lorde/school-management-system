import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StaffStudentDetailsPage({ menu }) {
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName:'', lastName:'', dob:'', gender:'', guardianName:'', guardianPhone:'', guardianEmail:'', notes:'', photoBase64:'' });
  
  async function load() {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/students/${studentId}/details`).then(r=>r.json());
      if (res?.success) {
        setData(res.value);
        const p = res.value.profile || {};
        setForm(prev => ({ ...prev, firstName:p.firstName||'', lastName:p.lastName||'', dob: p.dob? new Date(p.dob).toISOString().slice(0,10):'', gender:p.gender||'', guardianName:p.guardian?.name||'', guardianPhone:p.guardian?.phone||'', guardianEmail:p.guardian?.email||'' }));
      } else if (res?.message) alert(res.message);
    } catch (e) { console.error(e); alert('Failed to load'); } finally { setLoading(false); }
  }

  function onFile(e){
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, photoBase64: reader.result }));
    reader.readAsDataURL(f);
  }

  async function submit(e){
    e.preventDefault();
    if (!studentId) return;
    const changes = {
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
      dob: form.dob || undefined,
      guardian: { name: form.guardianName, phone: form.guardianPhone, email: form.guardianEmail },
    };
    const res = await fetch(`/api/staff/students/${studentId}/change-requests`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ changes, notes: form.notes, photoBase64: form.photoBase64 }) }).then(r=>r.json());
    if (res?.success) { alert('Change request submitted for approval'); setForm(prev => ({ ...prev, notes:'', photoBase64:'' })); } else { alert(res?.message||'Failed'); }
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Student Details & Edit (Pending Approval)</h1>
      <div className="mb-4 flex gap-2 items-end">
        <input className="border rounded px-2 py-2 w-80" placeholder="Enter StudentProfile ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <button className="px-3 py-2 border rounded" onClick={load} disabled={!studentId || loading}>{loading?'Loading...':'Load'}</button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">Current Profile</div>
            <div className="text-sm space-y-1">
              <div><span className="opacity-70">Admission No:</span> {data.profile?.admissionNo}</div>
              <div><span className="opacity-70">Name:</span> {data.profile?.firstName} {data.profile?.lastName}</div>
              <div><span className="opacity-70">DOB:</span> {data.profile?.dob? new Date(data.profile.dob).toLocaleDateString(): ''}</div>
              <div><span className="opacity-70">Gender:</span> {data.profile?.gender||''}</div>
              <div><span className="opacity-70">Guardian:</span> {data.profile?.guardian?.name||''} • {data.profile?.guardian?.phone||''}</div>
              {data.profile?.photoUrl && <img alt="photo" src={data.profile.photoUrl} className="mt-2 w-40 h-40 object-cover rounded" />}
            </div>
          </div>
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">Propose Changes</div>
            <form onSubmit={submit} className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col"><span className="mb-1">First Name</span><input className="border rounded px-2 py-2" value={form.firstName} onChange={e=>setForm(prev=>({...prev, firstName:e.target.value}))} /></label>
                <label className="flex flex-col"><span className="mb-1">Last Name</span><input className="border rounded px-2 py-2" value={form.lastName} onChange={e=>setForm(prev=>({...prev, lastName:e.target.value}))} /></label>
                <label className="flex flex-col"><span className="mb-1">DOB</span><input type="date" className="border rounded px-2 py-2" value={form.dob} onChange={e=>setForm(prev=>({...prev, dob:e.target.value}))} /></label>
                <label className="flex flex-col"><span className="mb-1">Gender</span>
                  <select className="border rounded px-2 py-2" value={form.gender} onChange={e=>setForm(prev=>({...prev, gender:e.target.value}))}>
                    <option value="">-</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col"><span className="mb-1">Guardian Name</span><input className="border rounded px-2 py-2" value={form.guardianName} onChange={e=>setForm(prev=>({...prev, guardianName:e.target.value}))} /></label>
                <label className="flex flex-col"><span className="mb-1">Guardian Phone</span><input className="border rounded px-2 py-2" value={form.guardianPhone} onChange={e=>setForm(prev=>({...prev, guardianPhone:e.target.value}))} /></label>
                <label className="flex flex-col"><span className="mb-1">Guardian Email</span><input className="border rounded px-2 py-2" value={form.guardianEmail} onChange={e=>setForm(prev=>({...prev, guardianEmail:e.target.value}))} /></label>
              </div>
              <label className="flex flex-col"><span className="mb-1">Photo</span><input type="file" accept="image/*" onChange={onFile} /></label>
              <label className="flex flex-col"><span className="mb-1">Notes</span><textarea className="border rounded px-2 py-2" rows={3} value={form.notes} onChange={e=>setForm(prev=>({...prev, notes:e.target.value}))}></textarea></label>
              <div className="flex justify-end"><button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Submit for Approval</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'staff';
  const ok = await permissionService.hasAccessToUrl(role, '/staff/student-lookup');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'staff');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
