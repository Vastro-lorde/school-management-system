# Documentation and User Manual

## 11.1 How to Use the System (User Guide)
1. **Access the Portal**: Navigate to `/portal` (auto-redirects to `/login`).
2. **Authenticate**: Enter email/password. Forgot password links trigger `/api/auth/reset` email workflow.
3. **Navigate Dashboard**: Sidebar reflects your role. Students see "My Payments", "My Timetable", etc.; staff/admin see administrative modules.
4. **Perform Actions**:
   - Students: view payments, add installments, check scores, update details.
   - Staff: register students, process payments, manage memos.
   - Admin: invite users, configure menus, review logs/settings.
5. **Sign Out**: Use the "Logout" button in the dashboard header (`DashboardLayout`).

## 11.2 Admin Guide
- **Invitations**: Visit `/admin/invite`, select role, TTL, and submit. Share generated link if email delivery is disabled in dev.
- **Menu & Permissions**: Use `/admin/menu`, `/admin/roles`, `/admin/permissions` to pair routes with roles (guarded via `permissionService`).
- **Payments**: Configure payment types, items, details, and insights across `/admin/payment-*` pages.
- **Audit & Logs**: `/admin/logs` (placeholder) ready for hooking into future `ActivityLog` records.
- **Settings**: Update institution details via `/admin/settings` (interacts with `Setting` collection).

## 11.3 Troubleshooting Instructions
- **Login Fails**: Confirm user exists in MongoDB, password hashed, and `NEXTAUTH_SECRET` matches environment.
- **Access Denied**: Check `Permission` documents for the role and ensure menu item URL matches API guard.
- **Email Not Sent**: Verify Brevo SMTP credentials (`BREVO_API_KEY`, `BREVO_USER`) and that `EMAIL_FROM` domain is authorized.
- **MongoDB Connection Error**: Ensure `MONGO_URI` is set for current environment; `dbConnect` throws friendly error otherwise.
- **Stale Seed Data**: Re-run `npm run seed` or execute `runBootstrap()` by restarting the server.

## 11.4 Role Quick Reference
**Table 11.1 – Roles and Key Actions**

| Role | Key Screens | Primary Actions |
| --- | --- | --- |
| Student | `/student/*` | View payments, add installments, check courses/scores/teachers, download documents (future) |
| Teacher | `/admin/assessments`, `/student/scores` (role-specific menu) | Manage assessments, view memos, monitor classes |
| Staff | `/staff/*`, `/memos/*` | Register students, process payments, manage change requests, send memos |
| Admin | `/admin/*`, `/dashboard` | Invite users, configure roles/menus, manage departments/courses/payments/logs |

> For deeper API documentation, inspect the route handlers under `pages/api/**`. They double as live documentation because each handler declares its expected methods, guard clauses, and JSON payload shapes.
