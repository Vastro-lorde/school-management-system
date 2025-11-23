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
