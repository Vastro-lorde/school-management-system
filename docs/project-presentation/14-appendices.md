# Appendices

## Appendix A – Sample Code Snippets
1. **API Client Utility** (`src/lib/apiClient.js`): Ensures consistent timeout + error responses for browser fetches (excerpt shown in Section 7.5).
2. **Permission Service** (`src/server/services/permissionService.js`): Guards URL access and manages role permission sets via MongoDB `Permission` collection.
3. **Payment Detail Model** (`src/server/db/models/PaymentDetail.js`): Demonstrates validation hooks for installment totals prior to status transitions.

## Appendix B – Screenshot References
(Generate fresh screenshots from the running app and store them under `docs/assets/` or an equivalent location.)
- **B.1** Home/Landing page (`pages/index.js`)
- **B.2** Admin Users dashboard with statistics widget (`pages/admin/users.js`)
- **B.3** Student Payments page showing installment modal (`pages/student/payments.js`)
- **B.4** Memo composer with lookup controls (`pages/memos/new.js`)

## Appendix C – Project Schedule (Gantt Summary)
Derived from `docs/project-plan.md` Section 12.

| Phase | Weeks | Scope Highlights |
| --- | --- | --- |
| 0 | 0–1 | Baseline setup, linting, TypeScript/App Router preparation |
| 1 | 1–3 | Authentication, RBAC MVP, audit logs |
| 2 | 3–5 | Academic structure CRUD, caching layer |
| 3 | 5–8 | Student portal (dashboard, payments, documents) |
| 4 | 8–11 | Teacher portal (assignments, grading workflows) |
| 5 | 11–13 | Staff workspaces (finance, admissions, registry) |
| 6 | 13–15 | Admin control center (roles, workflows, settings) |
| 7 | 15–16 | Document generation service |
| 8 | 16–18 | Testing, observability, deployment hardening |

## Appendix D – Data Dictionary Snapshot
- `settings.about`: Title + description for About page hero.
- `settings.contact`: Email, phone, address used on `/contact`.
- `settings.history`: Timeline array powering `/history` page.
- `StudentProfile.guardian`: nested object (name, phone, email) for emergency contacts.
- `Payment.items[]`: references `PaymentItem` amounts, enabling derived totals in `/api/student/payment-details/meta`.

## Appendix E – Environment Variable Checklist
| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Connects API routes and seed scripts to MongoDB |
| `NEXTAUTH_URL` | Tells NextAuth the canonical host for callbacks |
| `NEXTAUTH_SECRET` | Signs JWT sessions |
| `BREVO_API_KEY`, `BREVO_USER`, `EMAIL_FROM` | SMTP credentials for invites/password resets |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Optional overrides for bootstrap admin account |
| `FIREBASE_*` | Service account credentials for storage helper |
| `NEXT_PUBLIC_APP_URL` | Used when generating invite/reset links |
