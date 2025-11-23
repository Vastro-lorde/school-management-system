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
