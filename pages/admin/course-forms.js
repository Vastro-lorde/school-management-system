import React, { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import permissionService from '../../src/server/services/permissionService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function AdminCourseFormsPage({ menu }) {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [modal, setModal] = useState({ open: false });

  async function load() {
    setLoading(true);
    try {
      const [formsRes, coursesRes, deptRes, facRes] = await Promise.all([
        fetch('/api/admin/course-forms').then(r=>r.json()),
        fetch('/api/admin/courses').then(r=>r.json()),
        fetch('/api/admin/departments').then(r=>r.json()),
        fetch('/api/admin/faculty').then(r=>r.json()),
      ]);
      if (formsRes?.success) setForms(formsRes.value||[]);
      if (coursesRes?.success) setCourses(coursesRes.value||[]);
      if (deptRes?.success) setDepartments(deptRes.value||[]);
      if (facRes?.success) setFaculties(facRes.value||[]);
    } catch (e) { console.error(e); alert('Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  function openCreate() {
    setModal({ open: true, id: null, name:'', sessionId:'', semester:'', facultyId:'', departmentId:'', courseIds: [], status:'draft', approved:false });
  }
  function openEdit(f) {
    setModal({ open: true, id: f._id, name: f.name||'', sessionId: f.sessionId||'', semester: f.semester||'', facultyId: f.faculty?._id||'', departmentId: f.department?._id||'', courseIds: (f.courses||[]).map(c=>c._id), status: f.status, approved: !!f.approved });
  }
  function closeModal(){ setModal({ open: false }); }

  async function saveForm(e) {
    e.preventDefault();
    try {
      const body = { name: modal.name, sessionId: modal.sessionId, semester: modal.semester, facultyId: modal.facultyId||null, departmentId: modal.departmentId||null, courseIds: modal.courseIds, status: modal.status, approved: modal.approved };
      const res = await fetch('/api/admin/course-forms', { method: modal.id ? 'PUT' : 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(modal.id ? { id: modal.id, ...body } : body) }).then(r=>r.json());
      if (res?.success) { closeModal(); load(); }
      else alert(res?.message || 'Failed to save');
    } catch (e) { console.error(e); alert('Failed to save'); }
  }
  async function publish(id) {
    const ok = confirm('Publish this course form?'); if (!ok) return;
    const res = await fetch('/api/admin/course-forms', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id, publish: true }) }).then(r=>r.json());
    if (res?.success) load(); else alert(res?.message || 'Failed to publish');
  }
  async function closeForm(id) {
    const ok = confirm('Close this course form?'); if (!ok) return;
    const res = await fetch('/api/admin/course-forms', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id, close: true }) }).then(r=>r.json());
    if (res?.success) load(); else alert(res?.message || 'Failed to close');
  }
  async function remove(id) {
    const ok = confirm('Delete this course form?'); if (!ok) return;
    const res = await fetch(`/api/admin/course-forms?id=${id}`, { method: 'DELETE' }).then(r=>r.json());
    if (res?.success) load(); else alert(res?.message || 'Failed to delete');
  }

  return (
    <DashboardLayout menu={menu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Course Forms</h1>
        <button onClick={openCreate} className="px-3 py-2 bg-blue-600 text-white rounded">New Form</button>
      </div>

      {loading ? <div className="py-6 text-center opacity-80">Loading...</div> : (
        <div className="space-y-3">
          {forms.map(f => (
            <div key={f._id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{f.name || `${f.sessionId} - ${f.semester}`}</div>
                  <div className="text-xs opacity-60">Session: {f.sessionId} • Semester: {f.semester} • Status: {f.status} • Courses: {f.courses?.length||0}</div>
                </div>
                <div className="flex gap-2">
                  {f.status !== 'published' && <button onClick={()=>publish(f._id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Publish</button>}
                  {f.status === 'published' && <button onClick={()=>closeForm(f._id)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Close</button>}
                  <button onClick={()=>openEdit(f)} className="px-2 py-1 text-xs bg-gray-200 rounded">Edit</button>
                  <button onClick={()=>remove(f._id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <form onSubmit={saveForm} className="bg-white rounded p-4 w-full max-w-2xl space-y-3">
            <div className="text-lg font-semibold">{modal.id ? 'Edit' : 'Create'} Course Form</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Name<input className="border rounded p-2 w-full" value={modal.name} onChange={e=>setModal(v=>({...v,name:e.target.value}))} /></label>
              <label className="text-sm">Session ID<input className="border rounded p-2 w-full" value={modal.sessionId} onChange={e=>setModal(v=>({...v,sessionId:e.target.value}))} required /></label>
              <label className="text-sm">Semester<input className="border rounded p-2 w-full" value={modal.semester} onChange={e=>setModal(v=>({...v,semester:e.target.value}))} required /></label>
              <label className="text-sm">Faculty<select className="border rounded p-2 w-full" value={modal.facultyId} onChange={e=>setModal(v=>({...v,facultyId:e.target.value}))}><option value="">--</option>{faculties.map(f=> <option key={f._id} value={f._id}>{f.name}</option>)}</select></label>
              <label className="text-sm">Department<select className="border rounded p-2 w-full" value={modal.departmentId} onChange={e=>setModal(v=>({...v,departmentId:e.target.value}))}><option value="">--</option>{departments.map(d=> <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
              <label className="text-sm">Status<select className="border rounded p-2 w-full" value={modal.status} onChange={e=>setModal(v=>({...v,status:e.target.value}))}><option value="draft">draft</option><option value="published">published</option><option value="closed">closed</option></select></label>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Courses</div>
              <div className="border rounded max-h-48 overflow-auto p-2 space-y-1">
                {courses.map(c => (
                  <label key={c._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={modal.courseIds.includes(c._id)} onChange={()=> setModal(v=> ({...v, courseIds: v.courseIds.includes(c._id) ? v.courseIds.filter(x=>x!==c._id) : [...v.courseIds, c._id]}))} />
                    <span className="font-medium">{c.code}</span>
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-3 py-2 rounded border">Cancel</button>
              <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
            </div>
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
  const role = session.user?.role || 'student';
  const ok = await permissionService.hasAccessToUrl(role, '/admin/course-forms');
  if (!ok) return { redirect: { destination: '/dashboard', permanent: false } };
  const menu = await menuService.getMenuForRole(session.user?.role || 'student');
  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}
