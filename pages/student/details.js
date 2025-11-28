import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StudentDetailsPage({ menu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  useEffect(() => { (async () => {
    try { const res = await fetch('/api/student/details').then(r=>r.json()); if (res?.success) setData(res.value); else if (res?.message) alert(res.message); }
    catch(e){ console.error(e); alert('Failed to load details'); } finally { setLoading(false); }
  })(); }, []);

  const profile = data?.profile; const cls = data?.class; const reg = data?.registeredSubjects || [];

  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.photoUrl || '');
      setAvatarPublicId(profile.avatarPublicId || '');
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', 'avatars');
    setUploading(true);
    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      }).then(r => r.json());
      if (!res?.url || !res?.publicId) throw new Error(res?.error || 'Failed to upload avatar');

      const swap = await fetch('/api/me/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAvatarUrl: res.url, newAvatarPublicId: res.publicId }),
      }).then(r => r.json());
      if (!swap?.success) throw new Error(swap?.message || 'Failed to update avatar');

      setAvatarUrl(res.url);
      setAvatarPublicId(res.publicId);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl, firstName, lastName }),
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
      <h1 className="text-2xl font-semibold mb-4">My Details</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-4 md:col-span-2">
            <div className="font-semibold mb-2">Profile</div>
            <div className="text-sm space-y-1">
              <div><span className="opacity-70">Admission No:</span> {profile?.admissionNo}</div>
              <div><span className="opacity-70">Name:</span> {profile?.firstName} {profile?.lastName}</div>
              <div><span className="opacity-70">DOB:</span> {profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''}</div>
              <div><span className="opacity-70">Gender:</span> {profile?.gender}</div>
            </div>
          </div>
          <form onSubmit={handleSave} className="border rounded p-4 text-sm space-y-3">
            <div className="font-semibold mb-1">Edit Profile</div>
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Avatar</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold cursor-pointer hover:bg-emerald-500">
                  <span>{uploading ? 'Uploading...' : 'Change Avatar'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {avatarUrl && (
                  <span className="text-[10px] opacity-70 truncate max-w-[140px]">{avatarUrl}</span>
                )}
              </div>
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
            <button type="submit" disabled={saving} className="mt-2 inline-flex items-center px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">Class</div>
            {cls ? (
              <div className="text-sm space-y-1">
                <div><span className="opacity-70">Name:</span> {cls.name}</div>
                <div><span className="opacity-70">Level:</span> {cls.level || '-'}</div>
                <div><span className="opacity-70">Year:</span> {cls.year || '-'}</div>
                <div><span className="opacity-70">Subjects:</span> {(cls.subjects||[]).map(s=>s.name).join(', ')}</div>
              </div>
            ) : (<div className="text-sm opacity-70">No class assigned</div>)}
          </div>
          <div className="border rounded p-4 md:col-span-2">
            <div className="font-semibold mb-2">Registered Subjects</div>
            {reg.length === 0 ? (<div className="text-sm opacity-70">No registered subjects yet.</div>) : (
              <ul className="list-disc pl-6 text-sm">
                {reg.map(s => <li key={s._id}>{s.name} <span className="opacity-60">({s.subjectCode||''})</span></li>)}
              </ul>
            )}
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
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/student/details');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
