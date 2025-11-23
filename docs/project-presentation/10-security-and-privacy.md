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
