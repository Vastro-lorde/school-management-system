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
