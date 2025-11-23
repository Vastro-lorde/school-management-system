import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function StudentCourseRegistrationPage({ menu }) {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState({}); // formId -> selectedCourseIds
  const [savingFormId, setSavingFormId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/student/course-forms').then(r=>r.json());
      if (res?.success) {
        const value = res.value || [];
        setForms(value);
        const init = {};
        value.forEach(f => { if (f.submission?.selectedCourses) init[f._id] = f.submission.selectedCourses.map(c=>c._id); });
        setSelected(init);
      } else if (res?.message) alert(res.message);
    } catch (e) { console.error(e); alert('Failed to load'); } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  function toggle(formId, courseId) {
    setSelected(prev => {
      const current = prev[formId] || [];
      const next = current.includes(courseId) ? current.filter(x=>x!==courseId) : [...current, courseId];
      return { ...prev, [formId]: next };
    });
  }

  async function save(formId) {
    setSavingFormId(formId);
    try {
      const courseIds = selected[formId] || [];
      const res = await fetch('/api/student/course-forms', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ formId, selectedCourseIds: courseIds }) }).then(r=>r.json());
      if (res?.success) {
        alert('Submission saved');
        load();
      } else alert(res?.message || 'Failed to save');
    } catch (e) { console.error(e); alert('Failed to save'); } finally { setSavingFormId(null); }
  }

  return (
    <DashboardLayout menu={menu}>
      <h1 className="text-2xl font-semibold mb-4">Course Registration</h1>
      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-8">
          {forms.length === 0 && <div className="p-4 border rounded text-sm opacity-70">No published course forms available.</div>}
          {forms.map(form => {
            const sel = selected[form._id] || [];
            const disabled = form.status !== 'published';
            return (
              <div key={form._id} className="border rounded">
                <div className="px-3 py-2 flex items-center justify-between bg-gray-50">
                  <div>
                    <div className="font-semibold">{form.name || `${form.sessionId} - ${form.semester}`}</div>
                    <div className="text-xs opacity-60">Session: {form.sessionId} • Semester: {form.semester} • Status: {form.status}</div>
                  </div>
                  <div className="text-xs">
                    {form.department && <span className="mr-2">Dept: {form.department.name || form.department.code}</span>}
                    {form.faculty && <span>Faculty: {form.faculty.name}</span>}
                  </div>
                </div>
                <ul className="p-3 space-y-2 text-sm">
                  {form.courses.map(c => (
                    <li key={c._id} className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" disabled={disabled} checked={sel.includes(c._id)} onChange={()=>toggle(form._id, c._id)} />
                        <span className="font-medium">{c.code}</span>
                        <span>{c.title}</span>
                      </label>
                      <div className="text-xs opacity-60">{c.level || '-'} • {c.creditHours||0} CH</div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2 px-3 pb-3">
                  <button onClick={()=>save(form._id)} disabled={disabled || savingFormId===form._id} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{savingFormId===form._id ? 'Saving...' : 'Save Selection'}</button>
                </div>
              </div>
            );
          })}
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
  const ok = await permissionService.hasAccessToUrl(role, '/student/course-registration');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
