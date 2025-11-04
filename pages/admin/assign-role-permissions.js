import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '@/server/db/config';
import menuService from '@/server/services/menuService';
import permissionService from '@/server/services/permissionService';
import { authOptions } from '../api/auth/[...nextauth]';
import DashboardLayout from '@/components/DashboardLayout';

function computeDepths(items) {
  const byId = new Map(items.map(i => [i._id.toString(), i]));
  const memo = new Map();
  function depthOf(id) {
    const key = id.toString();
    if (memo.has(key)) return memo.get(key);
    const item = byId.get(key);
    if (!item || !item.parent) { memo.set(key, 0); return 0; }
    const d = 1 + depthOf(item.parent.toString());
    memo.set(key, d);
    return d;
  }
  return items.map(i => ({ ...i, depth: depthOf(i._id.toString()) })).sort((a,b) => (a.order??0)-(b.order??0));
}

export default function AssignRolePermissionsPage({ menu }) {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('');
  const [items, setItems] = useState([]);
  const [allowedIds, setAllowedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const itemsWithDepth = useMemo(() => computeDepths(items), [items]);
  const allowedSet = useMemo(() => new Set(allowedIds.map(String)), [allowedIds]);

  useEffect(() => {
    // load roles for selector
    async function loadRoles() {
      const res = await fetch('/api/admin/users/meta');
      const json = await res.json();
      if (json?.success) {
        setRoles(json.value.roles || []);
      }
    }
    loadRoles();
  }, []);

  async function loadPerms(r) {
    setLoading(true);
    const res = await fetch(`/api/admin/roles/permissions/${encodeURIComponent(r)}`);
    const json = await res.json();
    if (json?.success) {
      setItems(json.value.items || []);
      setAllowedIds(json.value.allowedIds || []);
    }
    setLoading(false);
  }

  const onRoleChange = (r) => {
    setRole(r);
    if (r) loadPerms(r);
    else { setItems([]); setAllowedIds([]); }
    setMsg('');
  };

  const toggleId = (id) => {
    const s = new Set(allowedSet);
    const key = id.toString();
    if (s.has(key)) s.delete(key); else s.add(key);
    setAllowedIds(Array.from(s));
  };

  const onSave = async () => {
    if (!role) { setMsg('Select a role'); return; }
    setSaving(true);
    setMsg('');
    const res = await fetch(`/api/admin/roles/permissions/${encodeURIComponent(role)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allowedIds }),
    });
    const json = await res.json();
    if (json?.success) setMsg('Permissions saved.'); else setMsg(json?.message || 'Failed to save');
    setSaving(false);
  };

  return (
    <DashboardLayout menu={menu}>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Assign Permissions to Role</h1>
      </div>
      <div className="max-w-3xl space-y-4">
        <label className="block text-sm w-full max-w-xs">
          <div className="mb-1">Role</div>
          <select className="w-full border rounded px-3 py-2 bg-white text-gray-900" value={role} onChange={e => onRoleChange(e.target.value)}>
            <option value="">Select role</option>
            {roles.map(r => (<option key={r.name} value={r.name}>{r.name}</option>))}
          </select>
        </label>
        {loading ? (
          <div className="py-4 opacity-80">Loading...</div>
        ) : role ? (
          <div className="border rounded divide-y bg-white text-gray-900">
            {itemsWithDepth.map(i => (
              <label key={i._id} className="flex items-center gap-3 px-3 py-2" style={{ paddingLeft: `${Math.min(i.depth,6)*12}px` }}>
                <input type="checkbox" checked={allowedSet.has(i._id.toString())} onChange={() => toggleId(i._id)} />
                <span className="text-sm">{i.label}</span>
                <span className="text-xs opacity-60">{i.url}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={saving || !role} onClick={onSave}>{saving ? 'Saving...' : 'Save Permissions'}</button>
          {msg ? <span className="text-sm opacity-80">{msg}</span> : null}
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  await dbConnect();
  const userRole = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(userRole, '/admin/role-permissions');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(userRole);
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
