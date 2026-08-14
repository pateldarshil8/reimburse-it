# ReimburseIt

**Live URL:** https://reimburse-it-pateldarshil8s-projects.vercel.app

Expense reimbursement tracker built for the CDF SDE Hackathon. Employees submit
reimbursement requests; reviewers approve, reject, or mark them paid; admins manage
user roles and account status.

Personal 3-day compressed build (the official brief runs 5 days). See
`PROJECT_PLAN.md` for the day-by-day plan, scope decisions, and the gap analysis
against the official `problem_statement.md` / `README.md` (CDF-provided) requirements,
and `planning/planning.md` for the plan as written before coding began.

## Problem overview

Small organizations often track reimbursements through email, chat, paper receipts,
and spreadsheets, which makes it hard to answer three questions: what's been
submitted, what state is it in, and who needs to act next. ReimburseIt replaces that
with one workflow:

**Create → Submit → Review → Approve / Reject → Paid**

## Features implemented

_This section is updated as the build progresses through Day 2 and Day 3 — see
`PROJECT_PLAN.md` for what's done vs. still in progress._

- [x] Role-based accounts and routing: `employee`, `reviewer`, `admin`
- [x] Credentials-based auth (Auth.js), backend-enforced role checks
- [x] Data model covering requests, review actions/history, notifications, and
      admin/account audit history
- [x] Private Supabase Storage bucket provisioned for receipt files
- [x] Requester: create/edit/submit a reimbursement request, with a "receipt required
      to submit" rule enforced server-side (real file upload wired up, pending the
      `SUPABASE_SERVICE_ROLE_KEY` value -- see `docs/testing.md`)
- [x] Requester: own request list with status badges, detail/history view, signed-URL
      receipt access
- [x] Reviewer: queue with search/filter (status, category, requester, date, keyword),
      sort, and pagination
- [x] Reviewer: approve / reject (required reason) / mark Paid, with backend RBAC
      (can't act on your own request, drafts are never visible to reviewers)
- [x] Dashboard financial totals (pending count, total pending/requested/approved/paid)
- [x] `GET /api/requests`: real paginated/filterable/sortable API endpoint
- [x] Notifications are written on every status transition (approve/reject/paid) --
      no UI to view them yet, that's Day 3
- [ ] Admin: view/manage users and account status
- [ ] In-app notifications UI (list, mark-as-read)

## Tech stack

- **Frontend + backend:** Next.js 16 (App Router, TypeScript) — Server Components,
  Server Actions, and Route Handlers under `src/app` act as the backend
- **Styling:** Tailwind CSS + a hand-built shadcn/ui-style component library
  (`src/components/ui`)
- **ORM:** Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg` driver adapter —
  Prisma 7 no longer reads `DATABASE_URL` from the schema file; see
  `prisma.config.ts` and `src/lib/prisma.ts`)
- **Database:** PostgreSQL via Supabase
- **File storage:** Supabase Storage, private bucket, signed URLs for receipt access
- **Auth:** Auth.js (Credentials provider), JWT sessions, roles: `employee` /
  `reviewer` / `admin`
- **Deployment:** Vercel (auto-deploys on push to `main`)

See `docs/architecture.md` for the full data-flow and API design explanation.

## Setup

1. Install dependencies (this also runs `prisma generate` via `postinstall`):
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — pooled Supabase connection string (port 6543, `?pgbouncer=true`), used by the app at runtime
   - `DIRECT_URL` — direct Supabase connection string (port 5432), used by the CLI for `db push` (falls back to `DATABASE_URL` if unset)
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API; the service role key is server-only, never expose it to the client
3. Push the schema (client is regenerated automatically as part of `npm run build`, or run it directly):
   ```bash
   npm run db:push
   ```
4. Seed demonstration data:
   ```bash
   npm run db:seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Run instructions

Once running (locally at `http://localhost:3000`, or via the live URL above), log in
with one of the seeded accounts below. Each role is redirected to its own area
(`/employee`, `/reviewer`, `/admin`) and route access is enforced server-side.

## Demo credentials

All seeded accounts use the password `password123`.

| Role     | Email              |
| -------- | ------------------ |
| employee | employee@cdf.org   |
| employee | employee2@cdf.org  |
| reviewer | reviewer@cdf.org   |
| admin    | admin@cdf.org      |

## Data model

- **User** — id, name, email, passwordHash, role (`employee`/`reviewer`/`admin`),
  accountStatus (`active`/`inactive`), createdAt
- **ExpenseRequest** — id, submitterId, title, category, expenseDate, description,
  totalAmount, currency, receipt file reference (name/type/storage path), status,
  createdAt, updatedAt
  - Status flow: `draft → submitted → approved | rejected → paid`
- **ReviewAction** (audit trail) — id, requestId, reviewerId, action, comment,
  previousStatus, newStatus, createdAt
- **Notification** — id, userId, requestId, message, readAt, createdAt
- **UserAudit** — id, targetId, actorId, action, detail, createdAt (admin role/account
  status changes)

Full schema: `prisma/schema.prisma`.

## Known limitations

_To be finalized on Day 3 once the build is complete — tracked live as scope decisions
in `PROJECT_PLAN.md`. As of Day 2:_

- Real receipt upload requires `SUPABASE_SERVICE_ROLE_KEY` to be set (locally and in
  Vercel); until then, submitting with a new file fails gracefully with an error
  rather than silently succeeding -- see `docs/testing.md`.
- No line-item breakdown — single `totalAmount` field per request
- Minimal auth — Credentials provider, no password reset/email verification (matches
  the brief's own "preconfigured demonstration accounts" guidance)
- Admin functionality is scoped to a minimal view/role-assignment/activation screen,
  not full account-status history in the UI
- No full OpenAPI/Swagger spec — API shape for the paginated list endpoint is
  documented in `docs/architecture.md` instead
- No resubmission-after-rejection flow (Tier 2 stretch, not built)

## Future improvements

- Automated test coverage beyond the manual pass in `docs/testing.md`
- Email notifications alongside in-app notifications
- CSV/PDF export of requests
- Multiple approval levels / budget-limit warnings

## Note on this environment

This project was scaffolded in a network-restricted sandbox that could not reach
`binaries.prisma.sh`, so `prisma generate` could never be verified locally there —
Vercel's build (which has normal network access) was used as the real test
environment instead. Locally, `npm install` triggers `prisma generate` automatically
via `postinstall`.
