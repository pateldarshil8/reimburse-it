# CDF Hackathon: Expense Tracker — Project Brief

**Format:** 3-day individual hackathon build
**Goal:** Submit and track reimbursement requests; reviewers approve/reject/complete them.

## Stack

- Frontend + backend: Next.js (App Router, TypeScript) — one repo, API routes double as the backend
- Styling: Tailwind CSS + shadcn/ui
- ORM: Prisma
- Database: PostgreSQL via Neon (or Supabase)
- Auth: Auth.js (credentials provider), roles: employee / reviewer
- Deployment: Vercel

## Data model

**Users:** id, name, email, password_hash, role, created_at

**ExpenseRequests:** id, submitter_id (FK), title, category, total_amount, currency, status, created_at, updated_at
Status flow: draft → submitted → approved | rejected → completed

**ReviewActions** (audit trail): id, request_id (FK), reviewer_id (FK), action, comment, created_at

## Scope cuts for the 3-day build

- No expense line-item breakdown — single amount field per request
- No real file storage — receipt as a text/URL field, not an actual upload
- Minimal auth — credentials provider, no password reset/email verification
- No admin UI — seed users via a Prisma seed script, not a management screen

## 3-day plan

**Day 1 — Foundation.** Set up Next.js + TypeScript + Tailwind + shadcn. Define Prisma
schema and push to Neon. Build auth with two roles and a seed script (2-3 test users).
Get role-gated routing working. Deploy an empty shell to Vercel immediately.

**Day 2 — Core workflow.** Submitter side: create/edit/submit a request, view own
requests with status badges. Reviewer side: queue of submitted requests, approve/reject
with a required comment (writes a ReviewActions row, updates status). This is the heart
of the grading criteria — don't rush it.

**Day 3 — Completion, polish, deploy.** Add `completed` status (reviewer marks an
approved request as completed). Add validation (no empty/zero-amount requests, can't
review your own request). Clean up empty states and errors. Full end-to-end pass as
both roles. Final deploy to Vercel, verify the live URL in a fresh session, write a
short README with setup steps and seeded logins.

**Fallback if behind schedule:** cut `completed` entirely and stop at approved/rejected
— a working two-state review flow beats a broken three-state one.

## Day 1 status

- [x] Next.js + TypeScript + Tailwind scaffolded
- [x] shadcn-style UI primitives added (button, input, label, textarea, card, badge, select)
- [x] Prisma schema defined (User, ExpenseRequest, ReviewAction)
- [x] Auth.js credentials provider + role-gated routing (`/employee`, `/reviewer`) via `src/proxy.ts`
- [x] Seed script for 3 test users
- [x] Pushed schema to a live Supabase database, 3 users seeded
- [x] Deployed to Vercel, auto-deploys on push to `main`
- [x] Verified live: login, role-gated routing, and DB round-trip all confirmed working
