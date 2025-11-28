import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';
import permissionService from '../../src/server/services/permissionService.js';
import { getAllSettings } from '@/api/settings';

export default function AdminSettingsPage({ menu }) {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { key, label, value }
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllSettings();
        const docs = res?.data?.value || [];
        const items = docs.map(doc => ({
          key: doc.key,
          label: doc.key,
          description: `Setting key: ${doc.key}`,
          value: doc.value,
        }));

        setSettings(items);
      } catch (e) {
        console.error(e);
        alert('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openEditor(item) {
    setEditing(item);
    setEditValue(JSON.stringify(item.value, null, 2));
  }

  function closeEditor() {
    setEditing(null);
    setEditValue('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editing) return;
    let parsed;
    try {
      parsed = JSON.parse(editValue || '{}');
    } catch (err) {
      alert('Please provide valid JSON.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/${editing.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      }).then(r => r.json());
      if (!res?.success) throw new Error(res?.message || 'Failed to save setting');
      setSettings(prev => prev.map(s => (s.key === editing.key ? { ...s, value: parsed } : s)));
      closeEditor();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="opacity-80 mb-6 text-sm">Manage key public-facing content such as About, Contact and History.</p>

      {loading ? (
        <div className="py-6 text-center opacity-80">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.map(item => (
            <div
              key={item.key}
              className="border border-white/10 rounded-xl bg-gray-900/40 p-4 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm">{item.label}</div>
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="inline-flex items-center px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs opacity-70 mb-3">{item.description}</p>
                <pre className="text-[11px] bg-black/40 rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(item.value, null, 2)}
                </pre>
              </div>
            </div>
          ))}
          {settings.length === 0 && (
            <div className="col-span-full text-sm opacity-70">No settings found.</div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-xl border border-white/10 w-full max-w-2xl p-5 text-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">Edit {editing.label}</div>
                <div className="text-[11px] opacity-70">Key: {editing.key}</div>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <p className="text-xs opacity-70 mb-2">
              Edit the JSON structure for this setting. Be careful to keep the shape consistent with what the public pages expect.
            </p>
            <form onSubmit={handleSave} className="space-y-3">
              <textarea
                className="w-full h-64 bg-black/60 border border-white/15 rounded p-2 font-mono text-[11px] resize-none"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="text-xs px-3 py-1.5 rounded border border-white/20 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
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
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/settings');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
