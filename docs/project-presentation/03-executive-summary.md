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
