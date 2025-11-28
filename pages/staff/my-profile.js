import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StaffMyProfilePage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  useEffect(()=>{ (async()=>{ try{ const res = await fetch('/api/staff/me').then(r=>r.json()); if(res?.success) setData(res.value); else if(res?.message) alert(res.message);}catch(e){console.error(e); alert('Failed to load');} finally { setLoading(false); } })(); }, []);
  const p = data || {};

  useEffect(() => {
    if (data) {
      setAvatarUrl(data.photoUrl || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
    }
  }, [data]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl, firstName, lastName, phone }),
      }).then(r => r.json());
      if (!res?.success) throw new Error(res?.message || 'Failed to update');
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }
  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      {loading? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4 text-sm space-y-1">
            <div><span className="opacity-70">Name:</span> {p.firstName} {p.lastName}</div>
            <div><span className="opacity-70">Employee ID:</span> {p.employeeId}</div>
            <div><span className="opacity-70">Department:</span> {p.department || '-'}</div>
            <div><span className="opacity-70">Position:</span> {p.positionId?.name || '-'}</div>
            {p.photoUrl && <img alt="photo" src={p.photoUrl} className="mt-2 w-40 h-40 object-cover rounded" />}
          </div>
          <form onSubmit={handleSave} className="border rounded p-4 text-sm space-y-3">
            <div className="font-semibold mb-1">Edit Profile</div>
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Avatar URL</label>
              <input className="w-full border rounded px-2 py-1 bg-gray-900/40" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">First Name</label>
                <input className="w-full border rounded px-2 py-1 bg-gray-900/40" value={firstName} onChange={e=>setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Last Name</label>
                <input className="w-full border rounded px-2 py-1 bg-gray-900/40" value={lastName} onChange={e=>setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Phone</label>
              <input className="w-full border rounded px-2 py-1 bg-gray-900/40" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <button type="submit" disabled={saving} className="mt-2 inline-flex items-center px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
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
  const ok = await permissionService.hasAccessToUrl(role, '/staff/my-profile');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'staff');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
