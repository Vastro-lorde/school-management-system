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
