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
