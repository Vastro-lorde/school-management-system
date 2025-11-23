# System Analysis

## 5.1 Problem Definition
Manual spreadsheets and disconnected portals make it difficult for a tertiary institution to:
- Keep user data (students, staff, roles) synchronized and auditable
- Track simulated tuition/fee payments, statuses, and receipts
- Manage approvals, memos, and permissions without developer intervention
- Maintain consistent branding and experience across marketing and operational pages

The existing repository addresses these gaps by consolidating them into a single Next.js + MongoDB stack with role-scoped features and seeded demo content.

## 5.2 Feasibility Study

**Table 5.1 – Feasibility Analysis Summary**

| Dimension | Evidence from Repository | Assessment |
| --- | --- | --- |
| Technical | Next.js 15.5 + React 19, MongoDB via Mongoose models, Firebase storage helpers, Brevo SMTP integration | Feasible – modern, well-supported stack with reusable services |
| Economic | Open-source dependencies; deployable on Vercel + MongoDB Atlas free tiers for demos | Feasible – minimal licensing cost for academic deployment |
| Operational | RBAC enforced via `permissionService`, email-based onboarding, dashboards for every persona | Feasible – workflows mirror institutional roles and can be demoed immediately |

## 5.3 Requirements Gathering
Requirements were derived from:
- `docs/project-plan.md` user journeys (students, teachers, staff, admins)
- `blueprint.md` design goals and completed steps
- Seed data for About, Contact, History, and Payment settings (showing expected content structure)
- Existing page implementations (e.g., `/student/payments`, `/admin/users`, `/memos/new`)
These artifacts function as living documentation replacing traditional interview transcripts.

## 5.4 System Requirements Specification (SRS)

### Functional Requirements (excerpt)
**Table 5.2 – Functional Requirements Traceability**

| ID | Requirement | Implemented In |
| --- | --- | --- |
| FR-01 | Users must authenticate via email/password and maintain sessions | `pages/api/auth/[...nextauth].js`, `pages/login.js`
| FR-02 | Admin/staff can invite new users via expiring tokens | `pages/admin/invite.js`, `pages/api/admin/invite.js`, `authService.createRegistrationToken`
| FR-03 | Role-based menu visibility and URL guarding | `src/server/services/menuService.js`, `permissionService.hasAccessToUrl`
| FR-04 | Students can view/make payments and add installments | `pages/student/payments.js`, `/api/student/payment-details/*`, `PaymentDetail` model
| FR-05 | Staff can register and look up students | `/staff/register-student.js`, `/staff/student-lookup.js`
| FR-06 | Memo creation and inbox/outbox flows | `pages/memos/*.js`, `/api/memos/*`
| FR-07 | Admin dashboards display KPIs by role | `pages/admin/users.js`, `/api/admin/users/stats`
| FR-08 | Settings (about/contact/history) are editable via API | `pages/api/settings/*`, `Setting` model

### Non-functional Requirements
- **Performance**: API utilities (`src/lib/apiClient.js`) enforce 15s timeouts and consistent error handling; caching service prepared for read-heavy data.
- **Security**: Bcrypt-hashed passwords, JWT-based sessions, permission checks on every API route.
- **Usability**: Responsive Tailwind-based UI, consistent header and dashboard layout, loading spinners and modals for long operations.
- **Maintainability**: Clear separation between API routes, services, and models; seeding scripts keep demo data reproducible.
- **Localization**: Defaults target NG contexts (currency, language) per `docs/project-plan.md`.
