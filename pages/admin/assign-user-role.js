import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '@/server/db/config';
import menuService from '@/server/services/menuService';
import permissionService from '@/server/services/permissionService';
import { authOptions } from '../api/auth/[...nextauth]';
import DashboardLayout from '@/components/DashboardLayout';

export default function AssignUserRolePage({ menu }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/admin/users/meta');
      const json = await res.json();
      if (json?.success) {
        setUsers(json.value.users || []);
        setRoles(json.value.roles || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!userId || !role) { setMsg('Select a user and a role'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/users/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const json = await res.json();
    if (json?.success) setMsg('Role updated successfully.'); else setMsg(json?.message || 'Failed to update');
    setSaving(false);
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Assign Role to User</h1>
      </div>
      {loading ? (
        <div className="py-8 opacity-80">Loading...</div>
      ) : (
        <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <div className="mb-1">User</div>
            <select className="w-full border rounded px-3 py-2 bg-white text-gray-900" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email} ({u.role || 'none'})</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <div className="mb-1">Role</div>
            <select className="w-full border rounded px-3 py-2 bg-white text-gray-900" value={role} onChange={e => setRole(e.target.value)}>
              <option value="">Select role</option>
              {roles.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">
              {saving ? 'Saving...' : 'Assign Role'}
            </button>
            {msg ? <span className="text-sm opacity-80">{msg}</span> : null}
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/assign-user-role');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(role);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
