# School Management System — Project Plan

## 1. Executive Summary
This project evolves the existing Next.js-based demo into a comprehensive tertiary school management platform for single-institution university deployments. The application will support students, teachers, non-teaching staff, and system administrators with dedicated portals, simulated financial workflows, configurable result approval processes, and rich document management. The platform will leverage MongoDB Atlas as the primary data store and adopt in-memory caching on the backend to improve response times for frequently accessed resources.

## 2. Goals and Non-goals
### Goals
- Deliver role-specific experiences for students, teachers, staff, and administrators.
- Provide secure authentication, authorization, and fine-grained permission management.
- Enable simulated payment flows with financial reporting and receipts.
- Offer configurable result creation and approval workflows, as well as transcript and result downloads.
- Support faculty content management: assignments, assessments, class materials, meetings, and curriculum uploads.
- Centralize institution configuration (departments, classes, academic calendar, role definitions, process flows).
- Implement in-memory caching for read-heavy operations (dashboards, directory lookups, static references).
- Maintain a polished UI with generated imagery for marketing and dashboard use.
- Deliver dashboards with visual analytics (charts) and CSV export capabilities for each persona.
- Ensure Nigerian localization defaults (English language, NGN currency, local grading scale).

### Non-goals
- Integration with real payment gateways (only simulations are required).
- Deep LMS functionality such as real-time grading collaboration, plagiarism detection, or live proctoring.
- Mobile native applications (responsive web only).

## 3. Personas and User Journeys
### Students
- View dashboard with current courses, announcements, charts summarizing progress, and outstanding tasks.
- Inspect academic records: scores, class schedules, attendance, downloaded statements, transcripts.
- Review and simulate tuition and fee payments, download receipts, and track payment history.
- Maintain personal profile and academic portfolio.
- Submit assignments, tests, and exam responses online when enabled by course instructors.

### Teachers
- Access teaching schedule, course rosters, assigned classes, and meeting calendars.
- Create and manage assignments, tests, exams, and grading rubrics, including enabling online submissions.
- Upload lecture notes, curriculum documents, and recommended resources.
- Track designations (e.g., HOD, Director) and department responsibilities.
- Look up student profiles, attendance, and performance summaries.
- Participate in configurable result-approval workflows (e.g., submit, review, approve).

### Staff (Non-teaching)
- Roles such as bursar/finance, admissions, registry, directorates.
- Finance staff handle simulated invoices, payments (directly transition to paid status without mock bank reference numbers), refunds, and reconciliation reports.
- Admissions staff register walk-in students, capture biodata, and manage onboarding steps.
- Registry staff manage documents, transcripts, and certifications.
- Directors access reporting dashboards with charts and CSV exportable datasets.

### System Administrators
- Define organizational hierarchy: departments, faculties, programs, classes, and academic calendars.
- Configure role-based access control (RBAC) and permission templates.
- Maintain process flows for results creation, approval, and publishing.
- Manage system settings, feature flags, and integration credentials.
- Oversee audit logs, backups, and institution-wide configurations.

## 4. Solution Architecture
### Frontend
- Next.js 14+ (App Router) with TypeScript.
- UI framework: Tailwind CSS + component library (e.g., shadcn/ui or Chakra UI) for accessibility.
- State management: React Query (TanStack Query) for data fetching + caching on the client, Zustand for local state as needed.
- PDF generation for downloads via server-side rendering (React PDF) or headless Chrome service.
- Image handling: pre-generated hero/illustration images stored in `/public/assets`.
- Dashboards: charting via Recharts or Chart.js with export-to-CSV utilities on key data grids.

### Backend (within Next.js API routes or a dedicated `/api` folder)
- RESTful API modules per domain (auth, academics, finance, configuration).
- Authentication: JWT-based session tokens stored securely (HttpOnly cookies) with refresh tokens; optional NextAuth for simplicity.
- Authorization: RBAC with hierarchical permissions persisted in MongoDB; caching resolved permissions in-memory.
- In-memory caching: Node LRU cache (e.g., `lru-cache`) to store frequently accessed reference data (departments, roles, timetable snapshots) with TTL invalidation hooks.
- Background jobs: leverage serverless cron (Vercel Cron or external worker) for nightly syncs, report generation, cache warm-up.
- Document storage: use MongoDB GridFS or external storage (e.g., AWS S3) for large files; store metadata in MongoDB.

### Data Store
- MongoDB Atlas clusters with collections for users, roles, departments, courses, enrollments, assessments, payments, workflows, announcements, documents, logs.
- Schema validation using Zod or TypeScript interfaces; enforce indexes for query performance.

### Infrastructure and DevOps
- Environment separation: local, staging, production with `.env` management (Vault or Doppler optional).
- CI/CD via GitHub Actions (lint, test, type-check, build, automated deployments).
- Observability: logging via Pino + Logflare/Datadog, monitoring with health checks, metrics endpoint.
- Security: OWASP best practices, input validation, rate limiting, activity logging, encryption at rest/in transit.

## 5. Data Model (High-level)
- `User`: base entity with profile fields, contact, role assignments, designation metadata.
- `Role`: name, permissions array, scope (global/department-level), created by admin.
- `Permission`: action + resource definitions (e.g., `academics.results.view`).
- `StudentProfile`: linked to user, includes matriculation, program, current level, GPA, transcripts.
- `TeacherProfile`: linked to user, includes departments, designations, assigned courses.
- `StaffProfile`: linked to user, includes staff type, office, responsibilities.
- `Course`: code, title, units, department, prerequisites, curriculum docs.
- `Class`: cohort/semester info, timetable, assigned advisers.
- `Assessment`: assignments/tests/exams with schedules, weightings, and submission data.
- `Result`: assessment outcomes, approval status, audit trail.
- `Payment`: simulated payment records, invoices, receipts, ledger entries.
- `Workflow`: definitions for configurable result approval steps.
- `Document`: metadata for uploaded files (notes, curriculum, receipts, transcripts).
- `Announcement`: messages targeted by role/class/department.
- `Meeting`: scheduling records for lectures, staff meetings, defenses.
- `AuditLog`: system events for compliance.
- `LocalizationConfig`: defaults for currency (NGN), grading scales (Nigerian classification), and supported languages (English).

## 6. Feature Roadmap
### Phase 0 – Project Baseline (Week 0–1)
- Audit existing codebase and clean up unused boilerplate.
- Establish coding standards, linting, formatting, Git hooks (ESLint, Prettier, Husky).
- Convert project to TypeScript and App Router if not already done.
- Configure absolute imports and environment variable handling.
- Set up base layout, theme, navigation shell, role switcher placeholder.

### Phase 1 – Authentication & Authorization (Week 1–3)
- Implement user registration (admin only) and invitation flows.
- Integrate NextAuth or custom JWT auth with MongoDB.
- Build RBAC system with permission editor UI and backend enforcement middleware.
- Create audit log entries for auth events.

### Phase 2 – Core Domain Setup (Week 3–5)
- CRUD for departments, programs, courses, classes, academic calendar.
- Configure caching layer for reference data (departments, roles) using in-memory cache with TTL + invalidation hooks.
- Implement seeding scripts for demo data (sample faculties, users, classes).

### Phase 3 – Student Portal (Week 5–8)
- Dashboard summarizing current courses, upcoming deadlines, outstanding payments, and visual analytics with CSV export options.
- Academic records pages: course registrations, scores, CGPA, attendance.
- Payments module: view invoices, simulate payments (status transitions, receipts), download PDF receipts, and skip intermediate bank reference steps for the demo flow.
- Document downloads: transcripts (generated PDF), result statements, profile summary.
- Notification center for announcements and workflow updates.
- Submission center: manage online assignment/test/exam submissions and view feedback history.

### Phase 4 – Teacher Portal (Week 8–11)
- Dashboard with today's lectures, pending grading tasks, meetings.
- Class management: roster, attendance tracking, student lookup.
- Assignment & assessment creation with file uploads and grading, including configuration for online submissions and grading queues.
- Curriculum and resource uploads with versioning.
- Result entry interface integrated with workflow steps (submit for review, view status).

### Phase 5 – Staff Workspaces (Week 11–13)
- Finance workspace: manage invoices, simulated payment processing, ledger views, financial reports.
- Admissions workspace: register new students, manage onboarding tasks, assign matriculation numbers.
- Registry workspace: issue documents, manage transcript requests, handle approvals.
- Role-specific dashboards with KPIs and quick actions.
- Cross-portal analytics: reusable chart widgets and CSV exports for finance, admissions, and registry datasets.

### Phase 6 – Admin Control Center (Week 13–15)
- Role & permission builder with drag-and-drop or grouped toggles.
- Workflow designer for result approval: step definitions, responsible roles, SLA timers.
- System settings: academic year rollover, grading scales, document templates.
- Global reports: user statistics, system health.
- Localization center: configure Nigerian grading thresholds, currency formatting, and language strings.

### Phase 7 – Documents & Downloads (Week 15–16)
- Unified document service for generating PDFs (results, transcripts, profiles, payment receipts).
- Template management with dynamic data placeholders.
- Storage integration (GridFS/S3) with secure download URLs and access control.

### Phase 8 – Quality, Observability, and Deployment (Week 16–18)
- Comprehensive testing (unit, integration, end-to-end with Playwright/Cypress).
- Performance tuning: caching metrics, load testing, index optimization.
- Error monitoring (Sentry) and logging standardization.
- Set up staging/production deployment pipelines and rollback strategy.
- Prepare demo data set and walkthrough scripts.

## 7. UI/UX & Asset Strategy
- Create a design system (colors, typography, spacing) aligned with university branding.
- Define component library structure (atoms, molecules, organisms) for dashboards and forms.
- Generate imagery using AI tools (e.g., OpenAI's DALL·E 3, Midjourney) for hero banners, dashboard illustrations, faculty icons.
  - Document prompts and export sizes in `/public/assets/README.md` for reproducibility.
  - Optimize images (WebP) and include light/dark variations.
- Build accessibility checklist (WCAG 2.1 AA) and keyboard navigation testing.
- Provide localized UI copy, currency formatting (NGN), and grading visualizations aligned with Nigerian standards.

## 8. Testing Strategy
- Unit tests: domain services, permission checks, data transformers (Jest/Testing Library).
- Integration tests: API endpoints with MongoDB Memory Server.
- End-to-end tests: role-specific flows with Playwright (login, dashboard, CRUD, downloads).
- Performance tests: caching effectiveness, large class rosters, PDF generation load.
- Security testing: auth bypass attempts, rate limiting, audit log verification.

## 9. Deployment & Environments
- Local: Docker Compose with MongoDB, mocked email/SMS providers, seeded demo data.
- Staging: Hosted on Vercel (frontend/API) + MongoDB Atlas staging cluster; feature flag toggles for partial rollouts.
- Production: Hardened environment with backup policies, environment variable management, monitoring dashboards.
- Documentation: runbooks for deployment, incident response, user administration.

## 10. Risks and Mitigations
- **Complex RBAC and workflows** — start with modular permission system and extensive unit tests.
- **Document generation performance** — pre-generate heavy PDFs during off-peak hours and cache results.
- **Data consistency** — enforce schema validation, apply optimistic concurrency or versioning for approvals.
- **Cache invalidation** — centralize cache manager with event-driven invalidation on writes.
- **User adoption** — provide demo data, onboarding tours, and admin training materials.

## 11. Deliverables Checklist
- [ ] Updated architecture diagrams and ERD.
- [ ] Design system documentation with component catalog.
- [ ] Role-based dashboards with sample data for all personas.
- [ ] Simulated payment workflow with receipts and financial reports.
- [ ] Configurable result approval pipeline with audit trails.
- [ ] Document generation and download service (PDFs).
- [ ] Automated test suites with CI coverage reports.
- [ ] Deployment runbooks and monitoring dashboards.
- [ ] Demo script and sample credentials for presentations.

## 12. Timeline Overview (Indicative)
| Phase | Weeks | Key Milestones |
| --- | --- | --- |
| 0 | 0–1 | Baseline setup, linting, TypeScript migration |
| 1 | 1–3 | Auth & RBAC MVP, audit logs |
| 2 | 3–5 | Academic structure CRUD + caching |
| 3 | 5–8 | Student portal features, payment simulation |
| 4 | 8–11 | Teacher portal, assignments, workflows |
| 5 | 11–13 | Staff workspaces |
| 6 | 13–15 | Admin control center |
| 7 | 15–16 | Document generation |
| 8 | 16–18 | Testing, observability, deployment |

## 13. Clarified Decisions
- **Multi-tenancy** — Not in scope; the demo targets a single institution deployment.
- **Assessments** — Must support online submissions alongside metadata tracking.
- **Analytics** — Provide dashboards with charts and enable CSV exports for key datasets.
- **Payment Simulation** — Skip intermediary bank reference/reconciliation steps and transition invoices directly to a paid state.
- **Localization** — Default to Nigerian context: English language, NGN currency, and Nigerian grading standards.

## 14. Next Steps
1. Review and refine this plan with stakeholders to confirm priorities and adjust timeline.
2. Produce low-fidelity wireframes for each portal and validate with end users.
3. Define API contracts and data schemas; generate OpenAPI/Swagger documentation.
4. Set up development environment, CI/CD pipelines, and seed database.
5. Begin implementation following the phased roadmap.

