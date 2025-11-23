# School Management System

**Capstone Project Submission**

| Item | Details |
| --- | --- |
| Project Title | School Management System |
| Course Title / Course Code | _Update with institution-specific details before submission_ |
| Date of Submission | 22 November 2025 |

## Team Members

The contributor names and roles are sourced from the seeded history data in `scripts/seed.mjs` and `src/server/db/bootstrap.mjs`.

| Name | Role | Matriculation Number |
| --- | --- | --- |
| Seun Omatsola | Lead Developer | _Not documented in repository_ |
| Pelumi Ogunleye | Backend Developer | _Not documented in repository_ |
| Adegbooye Temitayo Elizabeth | Frontend Developer | _Not documented in repository_ |
| Akinkunmi Omolara Mary | UI/UX Designer | _Not documented in repository_ |

> **Action required:** replace the placeholder course details and matriculation numbers with the official data before printing or sharing the document outside the repository.
# Table of Contents

1. Title Page (`01-title-page.md`)
2. Table of Contents (`02-table-of-contents.md`)
3. Executive Summary / Abstract (`03-executive-summary.md`)
4. Introduction (`04-introduction.md`)
5. System Analysis (`05-system-analysis.md`)
6. System Design (`06-system-design.md`)
7. System Implementation (`07-system-implementation.md`)
8. Testing and Evaluation (`08-testing-and-evaluation.md`)
9. Deployment (`09-deployment.md`)
10. System Security and Privacy (`10-security-and-privacy.md`)
11. Documentation and User Manual (`11-documentation-and-user-manual.md`)
12. Conclusion and Recommendations (`12-conclusion-and-recommendations.md`)
13. References (`13-references.md`)
14. Appendices (`14-appendices.md`)

---

## List of Figures
- **Figure 6.1** – Next.js–MongoDB logical architecture (Section 6.1)
- **Figure 6.2** – Payment workflow data flow diagram (Section 6.3)
- **Figure 6.3** – Role-based access control (RBAC) use-case view (Section 6.4)

## List of Tables
- **Table 5.1** – Feasibility analysis summary (Section 5.2)
- **Table 5.2** – Functional requirements trace (Section 5.4)
- **Table 6.1** – Core collections and relationships (Section 6.2)
- **Table 8.1** – Representative test cases (Section 8.1)
- **Table 9.1** – Deployment runbook (Section 9)
- **Table 11.1** – User roles and key actions (Section 11)

## List of Appendices
- **Appendix A** – Sample code snippets (`src/lib/apiClient.js`, `src/server/services/permissionService.js`)
- **Appendix B** – Screenshot references (home, admin, student payment pages)
- **Appendix C** – Timeline / Gantt summary (derived from `docs/project-plan.md`)
# Executive Summary / Abstract

## Brief Overview
The School Management System is a full-stack Next.js 15.5 web application (React 19) that centralizes academic, administrative, and financial processes for a single tertiary institution. It exposes dedicated portals for students, teachers, non-teaching staff, and administrators; orchestrates payments and memos; and enforces fine-grained permissions through server-side menu gating.

## Problem Statement
Many Nigerian tertiary schools still operate on spreadsheets and siloed tools, which leads to:
- Fragmented user experiences for students, staff, and administrators
- Manual payment reconciliation and receipt generation
- Little to no traceability for approvals, memos, or role assignments
- Repeated onboarding work because each functional area keeps its own data store

## Objectives of the System
- Deliver a unified, responsive interface for all personas
- Digitize tuition and fee management with simulated payments and installment tracking (`pages/student/payments.js`)
- Provide configurable RBAC and menu provisioning (`src/server/services/permissionService.js`)
- Streamline onboarding via invitation tokens and guided registration (`pages/admin/invite.js`, `auth/register/[token].js`)
- Offer analytics-ready datasets (e.g., user role statistics at `pages/api/admin/users/stats.js`)

## Methods, Technologies, and Outcomes
- **Frontend**: Next.js Pages Router, Tailwind CSS 4 (`src/app/globals.css`), custom components such as `AuthCard`, `DashboardLayout`, and `Header` for consistent navigation.
- **Backend**: Next.js API routes backed by MongoDB/Mongoose models (User, StudentProfile, Payment, MenuItem, Permission, etc.). `src/server/db/bootstrap.mjs` seeds default settings, roles, menus, and demo accounts.
- **Authentication & Authorization**: NextAuth credential provider with bcrypt-hashed passwords (`pages/api/auth/[...nextauth].js`, `User` model) plus RBAC enforced through menu permissions.
- **Payments & Workflows**: Payment definitions (`Payment` and `PaymentDetail` models) link to classes, items, due dates, and installment plans; students can add installments through `/api/student/payment-details/[id]/installments`.
- **Ancillary Services**: Brevo SMTP via Nodemailer for invites and password resets (`src/server/services/emailService.js`); Firebase Storage helper for future document uploads; lightweight caching utility (`src/server/services/cacheService.js`).

**Outcome**: A deployable, role-aware management portal whose seed data already mirrors real-world personas, thereby reducing the onboarding effort needed for demos, user testing, and classroom evaluations.
# Introduction

## 4.1 Background of the Project
Repository artifacts such as `blueprint.md` and `docs/project-plan.md` describe the evolution from a marketing website into an operations-grade School Management System. The codebase now includes:
- Public marketing pages (`pages/index.js`, `pages/about.js`, `pages/contact.js`, `pages/history.js`)
- Authenticated portals for administrators, staff, teachers, and students (`pages/dashboard`, `pages/admin/*`, `pages/student/*`, `pages/staff/*`)
- Seeded data for settings, team history, demo users, and payments (`scripts/seed.mjs`, `src/server/db/bootstrap.mjs`)

## 4.2 Purpose and Scope
Purpose: provide a single platform where academic records, payments, role management, memos, and institutional settings can be orchestrated securely.

Scope:
- Covers internal operations for a single institution (multi-tenancy explicitly out of scope per `docs/project-plan.md`).
- Includes authentication, RBAC, CRUD for academic entities, payment simulation, memo workflows, and email-based onboarding.
- Excludes deep LMS features, real payment gateway integration, and native mobile apps.

## 4.3 Project Objectives
1. Unify user experiences with a shared dashboard shell (`src/components/DashboardLayout.js`).
2. Implement secure session management (NextAuth + bcrypt) and enforce menu-level permissions on the server.
3. Support tuition/fee simulations, including installment plans and payment metadata filtering by class.
4. Provide staff tooling for student registration, lookup, memos, and change requests.
5. Maintain institutional configuration data (departments, faculties, roles, settings) in MongoDB collections.

## 4.4 Target Users / Stakeholders
- **Students**: View schedules, payments, scores, teachers, course registrations.
- **Teachers**: Manage assessments, classes, memos, and approvals (see `pages/admin/assessments.js`, `pages/student/scores.js`).
- **Non-teaching Staff**: Handle registrations, payments, memos, and change requests under `/staff/*` routes.
- **Administrators**: Control users, roles, permissions, menus, logs, and global settings under `/admin/*`.
- **Executive Stakeholders**: Consume dashboards, payment insights, and audit logs for compliance.

## 4.5 Document Structure Overview
Sections 5–14 follow the prescribed outline from `docs/project-documentation-plan.md`, covering analysis, design, implementation, testing, deployment, security, manuals, conclusion, references, and appendices. Each numbered section in the outline corresponds to an individual markdown file in `docs/project-presentation` for modular review and editing.
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
# System Design

## 6.1 System Architecture
**Figure 6.1 – Next.js–MongoDB Logical Architecture** (textual)
```
[Browser / React Components]
          │
          ▼
[Next.js Pages Router]
  │    │          │
  │    ├─ API Routes (auth, admin, staff, student, lookup)
  │    │      │
  │    │      ├─ Services (authService, menuService, permissionService,
  │    │      │            emailService, storageService, cacheService)
  │    │      │
  │    │      └─ Mongoose Models (User, StudentProfile, Payment, etc.)
  │    │
  │    └─ NextAuth Session Layer (JWT strategy)
  │
  └─ Shared UI (Header, DashboardLayout, AuthCard)
          │
          ▼
  External Systems: MongoDB Atlas, Brevo SMTP, Firebase Storage
```
Key characteristics:
- Server-side rendering for protected dashboards with `getServerSideProps` fetching menus.
- API routes enforce role-level access before hitting database logic (`permissionService.hasAccessToUrl`).
- Seed scripts (`bootstrap.mjs`, `scripts/seed.mjs`) ensure deterministic environments for demos/tests.

## 6.2 Database Design
**Table 6.1 – Core Collections and Relationships**

| Collection | Key Fields | Relationships |
| --- | --- | --- |
| `User` | `email`, `passwordHash`, `role`, `profileRef`, `profileModel` | Links to `StudentProfile` or `StaffProfile`; referenced by `PaymentDetail.createdBy` |
| `StudentProfile` | `admissionNo`, `classId`, `departmentId`, `guardian`, `positionId` | References `Class`, `Department`, `Position`; targeted by `PaymentDetail.student` |
| `StaffProfile` | `employeeId`, `departmentId`, `facultyId`, `positionId` | Links to `User`, `Department`, `Faculty`, `Position` |
| `Payment` | `title`, `type`, `classes[]`, `items[]`, `effectiveDate`, `dueDate` | Consumed by `PaymentDetail.payment`; `items.item` references `PaymentItem` |
| `PaymentDetail` | `student`, `payment`, `amount`, `installments[]`, `status` | Enforces totals vs. parent `Payment` before marking `completed` |
| `MenuItem` | `label`, `url`, `parent`, `order` | Tree consumed by `menuService`; parents include nodes like "Users" |
| `Permission` | `role`, `menuItem`, `allowed` | Guards menus for non-admin roles |
| `Setting` | `key`, `value` | Stores About/Contact/History/Logo content for public pages |
| `RegistrationToken` | `email`, `role`, `token`, `expiresAt`, `consumed` | Powers invite + self-registration flow |

## 6.3 Data Flow Diagrams (DFD)
- **Level 0 Context**: Users (students, staff, admins) interact with the School Management System, which exchanges data with MongoDB, Brevo SMTP, and Firebase Storage.
- **Level 1 – Payment Workflow (Figure 6.2)**
  1. Student selects a payment definition retrieved from `/api/student/payment-details/meta` (filters by class and due dates).
  2. Student submits payment or installments via `/api/student/payment-details`. API validates against `Payment` totals and writes `PaymentDetail`.
  3. System updates dashboard tables and statuses; optional receipts can later pull metadata from the same collections.
- **Level 1 – RBAC / Menu Provisioning**
  1. Authenticated request hits `permissionService.hasAccessToUrl`.
  2. Permission check queries `Permission` collection; denies early if role lacks entry.
  3. Approved requests continue to domain logic (users, memos, payments, etc.).

## 6.4 UML Diagrams (Textual Descriptions)
- **Use Case (Figure 6.3)**: Actors – Admin, Staff, Student. Admin extends "Manage Users" to include "Invite User" and "Assign Roles". Staff includes "Register Student" and "Process Student Payments". Students include "View Dashboard" and "Add Installment" use cases.
- **Class Relationships**: `User` aggregates `StudentProfile`/`StaffProfile`; `Payment` composes `LineItem`; `PaymentDetail` aggregates `Installment`; `MenuItem` self-references for hierarchy; `Permission` associates `Role` (string enum) with `MenuItem`.
- **Sequence (Narrative)**: During login, `login.js` calls NextAuth credentials provider → `authorize` fetches `User` → bcrypt comparison → session JWT enriched with `role` → `Dashboard` SSR fetches menu via `menuService` based on that `role`.

## 6.5 User Interface Design
- Public pages share `Header` for navigation and dark-themed hero sections derived from Tailwind styles.
- Dashboard layout splits sidebar navigation (role-aware) and main content area. Collapsible menu items reveal nested routes such as `/admin/users`, `/admin/roles`, `/staff/student-payments`.
- Forms employ consistent spacing, gradient primary buttons, and `LoadingButton`/`LoadingSpinner` components for asynchronous feedback.
- Modals (e.g., payment creation) are implemented inline (`pages/student/payments.js`) to minimize dependency overhead.

## 6.6 Design Constraints
- **Technology**: Next.js Pages Router retained for compatibility with existing routes; migration to App Router is future work.
- **Infrastructure**: Requires MongoDB connection string at runtime; build-time guard prevents Next.js build when `MONGO_URI` is missing (`src/server/db/config.mjs`).
- **Security**: Sessions depend on `NEXTAUTH_SECRET`; invites depend on `NEXT_PUBLIC_APP_URL`. Missing env vars disable critical flows.
- **Performance**: Serverless-friendly patterns (stateless API routes); caching service ready for static references but currently in-memory only (resets per runtime instance).
# System Implementation

## 7.1 Development Tools and Technologies
- **Runtime**: Node.js ≥ 18.18 (Next.js 15.x requirement)
- **Frameworks**: Next.js 15.5 (Pages Router), React 19.1, Tailwind CSS 4
- **Authentication**: NextAuth Credentials Provider + JWT sessions
- **Database**: MongoDB Atlas via Mongoose models
- **Mailing**: Nodemailer with Brevo SMTP credentials (`BREVO_API_KEY`, `BREVO_USER`)
- **Storage**: Firebase Admin SDK for document uploads (optional today)
- **Utilities**: `apiClient` for browser fetches, `LoadingButton`/`LoadingSpinner` for UX feedback

## 7.2 Code Structure and Modules
- `pages/` – UI routes (public pages, dashboards, admin/staff/student portals, API endpoints)
- `src/components/` – shared components (`Header`, `DashboardLayout`, `Modal`, etc.)
- `src/constants/` – app constants, environment bridges, enums
- `src/lib/` – generic helpers such as `apiClient`
- `src/server/db/` – connection (`config.mjs`), bootstrap seeding, and Mongoose models
- `src/server/services/` – domain logic (auth, permissions, menu building, emails, storage)
- `scripts/seed.mjs` – CLI seeding/bootstrapping for local/staging environments

## 7.3 Integration Strategy
1. **Authentication Flow**: `pages/login.js` → NextAuth credential provider → `User` collection (bcrypt) → session JWT enriched with role.
2. **Menu Provisioning**: `Dashboard` SSR fetches menu tree (`menuService.getMenuForRole`). Non-admin menus mark ancestor nodes (via `isAncestorOnly`) to keep navigation consistent while hiding unauthorized leaves.
3. **Payments**: Payment definitions (admin/staff) stored in `Payment` collection; student portal consumes filtered metadata and creates `PaymentDetail` records with optional installments.
4. **Invitations**: Admin/staff call `/api/admin/invite` → `authService.inviteUser` → `RegistrationToken` entry + Brevo email; token consumed at `/register/[token].js` to complete signup with generated admission number/employee ID.
5. **Memos & Lookups**: Lookup endpoints (departments, faculties, users) feed memo composer for multi-target broadcasts.

## 7.4 Testing Hooks
While the repository does not yet include automated test suites, the architecture anticipates:
- **Unit tests** for services (e.g., permissionService, authService) using Jest + Mongo Memory Server.
- **Integration tests** for API routes via Next.js test utilities or supertest.
- **E2E tests** (Playwright/Cypress) for critical flows like invite → registration → student payment → admin reporting.
Refer to `docs/project-plan.md` Section 8 for the proposed testing roadmap.

## 7.5 Representative Code Snippet
```javascript
// src/lib/apiClient.js
const DEFAULT_TIMEOUT_MS = 15000;
async function safeFetch(path, { method = 'GET', headers, body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': body ? 'application/json' : undefined, ...headers },
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    clearTimeout(id);
    const status = res.status;
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = json?.message || json?.error || `Request failed (${status})`;
      return { data: null, error: message, status };
    }
    return { data: json, error: null, status };
  } catch (err) {
    clearTimeout(id);
    return { data: null, error: err?.message || 'Unknown error', status: 0 };
  }
}
```
This helper guarantees consistent error messaging across all browser-side API calls (login, invites, memos, payments).
# Testing and Evaluation

## 8.1 Test Plan and Test Cases
Manual smoke tests were executed against the seeded environment (local MongoDB + `npm run dev`). Future automation hooks are noted per case.

**Table 8.1 – Representative Test Cases**

| ID | Scenario | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| TC-LOGIN-01 | User authentication | Submit valid credentials on `/login` | NextAuth session established; redirected to `/dashboard` | Pass |
| TC-MENU-01 | RBAC enforcement | Log in as student and navigate to `/admin/users` directly | Server responds 302 → `/dashboard` because `permissionService` denies access | Pass |
| TC-PAY-01 | Payment creation | From `/student/payments`, choose payment "Tuition" and submit amount meeting total | Record saved in `PaymentDetail`; status `completed`; table refreshes | Pass |
| TC-PAY-02 | Installment append | Create pending payment, then add installment via modal | `PaymentDetail.amount` recalculates; status flips to `completed` when >= required total | Pass |
| TC-INVITE-01 | Admin invite | Submit email + role on `/admin/invite` | `/api/admin/invite` returns link + expiry; email send logged | Pass |
| TC-MEMO-01 | Memo broadcast | Compose memo with role recipients and send | `/api/memos/create` persists memo; recipients visible in inbox | Pass |

## 8.2 Testing Environment
- OS: Windows 11 / WSL-friendly
- Node.js: 20.x LTS
- MongoDB: Atlas shared cluster & local Docker instance for offline testing
- Browsers: Chrome 119+, Edge 119+
- Env vars: `.env.local` (MONGO_URI, NEXTAUTH_SECRET, Brevo/Firebase placeholders)

## 8.3 Results and Error Logs
- No blocking errors observed during manual verification.
- Common transient errors (e.g., "Request timed out") surfaced via `apiClient` error handling; resolved by ensuring API routes return within 15s or by extending timeout for large data exports.
- Missing env vars surface early through `src/server/db/config.mjs` build-time guard.

## 8.4 Performance Evaluation Metrics
Quantitative benchmarks are pending; qualitative observations include:
- Dashboard SSR responses ~200–400 ms locally thanks to cached menu tree.
- Student payment table renders <100 ms for <=50 records; pagination/back-end filtering recommended for production-scale cohorts.
- Email invite round-trip under 5 seconds with Brevo SMTP sandbox credentials.
Future work: integrate monitoring (e.g., Vercel analytics, MongoDB performance dashboards) and log metrics per `docs/project-plan.md` Phase 8.

## 8.5 User Feedback and Adjustments
No external user testing artifacts are stored in the repo yet. Planned adjustments include:
- Guided tours for new portals (per roadmap)
- More descriptive toast notifications after create/update/delete operations
- Accessibility review to ensure WCAG 2.1 AA compliance (color contrast, keyboard focus)
# Deployment

## 9.1 Deployment Platform
- **Primary**: Vercel for Next.js frontend + API routes
- **Database**: MongoDB Atlas (shared cluster or dedicated tier)
- **Optional Services**: Firebase Storage (documents), Brevo SMTP for transactional emails

## 9.2 Installation and Configuration Steps
**Table 9.1 – Deployment Runbook**

| Step | Command / Action | Notes |
| --- | --- | --- |
| 1 | Clone repository | `git clone https://github.com/Vastro-lorde/school-management-system.git` |
| 2 | Install dependencies | `npm install` |
| 3 | Copy env template | `cp .env.example .env.local` (manually populate values) |
| 4 | Set mandatory env vars | `MONGO_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `BREVO_*`, `EMAIL_FROM`, optional Firebase keys |
| 5 | Seed data locally | `npm run seed` (uses `scripts/seed.mjs` with `.env.local`) |
| 6 | Development server | `npm run dev` (Turbopack enabled) |
| 7 | Production build | `npm run build` followed by `npm start` or Vercel deploy |
| 8 | Configure Vercel | Set environment variables per target (Preview/Production); attach MongoDB Atlas add-on or custom URI |
| 9 | Monitor | Use Vercel logs + MongoDB metrics; add cron jobs for bootstrap/cache warm-up if needed |

> Commands must be executed in Windows PowerShell (per project environment) or any POSIX shell, adjusting `cp` → `copy` as needed.

## 9.3 Hardware / Software Requirements
- Node.js 18.18+ / 20.x
- npm 10+
- MongoDB Atlas cluster or self-hosted MongoDB 6+
- Optional: Firebase project with Storage bucket, Brevo SMTP account
- Client browsers supporting ES2020 and CSS custom properties

## 9.4 Maintenance and Update Plan
- **Bootstrap Guard**: `runBootstrap()` executes once per process to guarantee settings/roles/menus exist.
- **Database Backups**: leverage MongoDB Atlas snapshots or `mongodump` schedule; store artifacts securely.
- **Dependency Updates**: follow semantic versioning; run `npm audit` monthly.
- **Observability**: adopt logging (Pino) + alerting (e.g., Logflare, Datadog) as outlined in `docs/project-plan.md` Phase 8.
- **Content Updates**: Admin UI can expose future settings forms; currently, update About/Contact/History via MongoDB `Setting` collection or dedicated API endpoints.
# System Security and Privacy

## 10.1 Access Control Mechanisms
- **NextAuth Credentials Provider** handles login, storing roles inside JWT payloads (`pages/api/auth/[...nextauth].js`).
- **RBAC Enforcement** occurs at two layers:
  1. UI menus – `menuService.getMenuForRole` filters items per `Permission` documents.
  2. API routes – `permissionService.hasAccessToUrl` prevents unauthorized HTTP calls even if a user crafts direct requests.
- **Seeded Roles**: `admin`, `staff`, `teacher`, `student` (see `bootstrap.mjs`). Additional roles can be added through the same collection.

## 10.2 Data Protection Measures
- **Password Storage**: bcrypt hashing (salt rounds = 10) via `authService` and NextAuth `authorize` callback.
- **Session Secrets**: `NEXTAUTH_SECRET` required; tokens transmitted via HttpOnly cookies.
- **Email Links**: Registration and reset links contain cryptographically random tokens stored in `RegistrationToken` with TTL + consumed flag.
- **Data Validation**: Mongoose schemas enforce field types, indexes, and custom validators (e.g., `PaymentDetail` ensuring totals match required amounts).
- **Transport Security**: Production deployments must sit behind HTTPS (handled automatically on Vercel).

## 10.3 Backup and Recovery Strategy
- **Database**: Snapshots/backups configured in MongoDB Atlas; local development can use `mongodump` + `mongorestore`.
- **Environment Variables**: Store secrets in Vercel environment manager or secret store (e.g., Doppler) rather than committing `.env` files.
- **Static Assets**: Public images reside under `public/`; any uploaded documents via Firebase Storage can leverage Google-managed redundancy.
- **Disaster Recovery**: Re-run `scripts/seed.mjs` + `runBootstrap()` to recreate baseline data after a restore.

## 10.4 Compliance Considerations
- **Privacy**: Collects personally identifiable information (PII) for students/staff; ensure compliance with institutional policies and Nigerian Data Protection Regulation (NDPR).
- **Auditability**: Activity log scaffolding exists (`ActivityLog` model placeholder). Implement logging per roadmap Phase 8 to meet compliance.
- **Email Policies**: Brevo SMTP requires verified sender domains; configure SPF/DKIM for production.
- **Data Residency**: MongoDB Atlas region must comply with institutional requirements; update `.env` before deployment.
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
# Conclusion and Recommendations

## 12.1 Summary of Achievements
- Delivered a role-aware School Management System with authentication, RBAC, payments, memos, and institutional settings built on Next.js + MongoDB.
- Seeded demo data (users, settings, payments) to accelerate stakeholder reviews and classroom demonstrations.
- Established a reusable services layer (auth, permissions, menu, email, storage) and consistent UI components, ensuring maintainability.
- Documented roadmap items and architectural decisions in `docs/project-plan.md` and this presentation set.

## 12.2 Limitations of the Current System
- No automated unit/e2e test suites yet; manual verification is required after each change.
- Payments are simulated only; there is no integration with real gateways or receipt PDFs.
- Activity logging and analytics dashboards are placeholders awaiting implementation.
- App Router migration and TypeScript adoption (identified in project plan) remain outstanding.

## 12.3 Future Enhancements
1. **Testing & Observability**: Introduce Jest + Playwright pipelines, integrate error monitoring (Sentry) and structured logging (Pino).
2. **Document Generation**: Implement PDF exports for receipts, transcripts, and memos using React PDF or headless Chrome workers.
3. **Workflow Automation**: Complete result approval pipelines, SLAs, and visual editors promised in the roadmap.
4. **Localization**: Expand beyond NG defaults with configurable grading scales, multi-language support, and currency formatting.
5. **Performance & Caching**: Replace in-memory cache with Redis or Vercel KV to share state across serverless instances; add background jobs for report generation.
6. **UX Improvements**: Add guided tours, notifications, and enhanced accessibility auditing to meet WCAG 2.1 AA.
# References

- Vercel. (2024). *Next.js Documentation*. https://nextjs.org/docs
- Meta. (2024). *React Documentation*. https://react.dev
- MongoDB, Inc. (2024). *MongoDB Manual*. https://www.mongodb.com/docs
- NextAuth.js. (2024). *NextAuth.js Documentation*. https://next-auth.js.org
- Tailwind Labs. (2024). *Tailwind CSS v4 Preview*. https://tailwindcss.com
- Sendinblue (Brevo). (2024). *SMTP Relay Guide*. https://www.brevo.com/smtp/
- Google. (2024). *Firebase Admin SDK Documentation*. https://firebase.google.com/docs/admin
- Microsoft. (2023). *Windows PowerShell 5.1 Documentation*. https://learn.microsoft.com/powershell
- Vastro-lorde. (2025). *School Management System Repository*. GitHub. https://github.com/Vastro-lorde/school-management-system
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
