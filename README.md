# ReimburseIt

Expense reimbursement tracker for Community Dreams Foundation. Employees submit
reimbursement requests; reviewers approve, reject, or complete them.

3-day hackathon build. See `PROJECT_PLAN.md` for the day-by-day plan and scope cuts.

## Stack

- **Frontend + backend:** Next.js (App Router, TypeScript) — API routes double as the backend
- **Styling:** Tailwind CSS + shadcn/ui (components hand-added, see `src/components/ui`)
- **ORM:** Prisma
- **Database:** PostgreSQL via Neon (or Supabase)
- **Auth:** Auth.js (Credentials provider), roles: `employee` / `reviewer`
- **Deployment:** Vercel

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — your Neon (or Supabase) Postgres connection strings
   - `AUTH_SECRET` — generate with `npx auth secret`
3. Push the schema and generate the client:
   ```bash
   npm run db:push
   npm run db:generate
   ```
4. Seed test users:
   ```bash
   npm run db:seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Seeded logins

All seeded accounts use the password `password123`.

| Role     | Email              |
| -------- | ------------------ |
| employee | employee@cdf.org   |
| employee | employee2@cdf.org  |
| reviewer | reviewer@cdf.org   |

## Data model

- **User** — id, name, email, passwordHash, role, createdAt
- **ExpenseRequest** — id, submitterId, title, category, totalAmount, currency, status, createdAt, updatedAt
  - Status flow: `draft → submitted → approved | rejected → completed`
- **ReviewAction** (audit trail) — id, requestId, reviewerId, action, comment, createdAt

## Scope cuts

- No line-item breakdown — single `totalAmount` field per request
- No real file storage — receipt is a text/URL field, not an upload
- Minimal auth — Credentials provider, no password reset/email verification
- No admin UI — users are seeded via `npm run db:seed`, not managed in-app

## Note on this environment

This project was scaffolded in a network-restricted sandbox that could not reach
`binaries.prisma.sh`, so the Prisma client could not be generated here and the
build could not be fully type-checked locally. Everything else (Next.js compile,
Tailwind, routing, auth config) built successfully. Run `npm run db:generate`
(or `npm install`, which triggers it automatically) on a machine with normal
network access, or let Vercel's build do it, before your first real build.
