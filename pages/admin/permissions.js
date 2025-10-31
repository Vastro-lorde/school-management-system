import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import enums from '../../src/constants/enums.mjs';

export default function AdminPermissionsPage({ menu, initialRole }) {
  const { ROLES } = enums;
  const availableRoles = ROLES.filter(r => r !== 'admin');

  const [role, setRole] = useState(initialRole || availableRoles[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [allowedIds, setAllowedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (r) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/permissions?role=${encodeURIComponent(r)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load');
      setMenuItems(json.value.menuItems);
      setAllowedIds(json.value.allowedIds);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(role); }, [role]);

  const toggle = (id) => {
    setAllowedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, allowedIds }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to save');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Permissions</h1>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded px-2 py-1 bg-white text-gray-900">
            {availableRoles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button onClick={save} disabled={saving} className="ml-auto bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {loading ? (
          <div className="opacity-70">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map(mi => (
              <label key={mi._id} className="flex items-center gap-2 border rounded p-3 bg-white/70 dark:bg-gray-900/40">
                <input type="checkbox" checked={allowedIds.includes(mi._id)} onChange={() => toggle(mi._id)} />
                <span className="font-medium">{mi.label}</span>
                <span className="text-xs opacity-60">{mi.url}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  if (session.user?.role !== 'admin') return { redirect: { destination: '/dashboard', permanent: false } };
  await dbConnect();
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)), initialRole: 'staff' } };
}
