# ReimburseIt

Expense reimbursement tracker for Community Dreams Foundation. Employees submit
reimbursement requests; reviewers approve, reject, or complete them.

3-day hackathon build. See `PROJECT_PLAN.md` for the day-by-day plan and scope cuts.

## Stack

- **Frontend + backend:** Next.js (App Router, TypeScript) — API routes double as the backend
- **Styling:** Tailwind CSS + shadcn/ui (components hand-added, see `src/components/ui`)
- **ORM:** Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg` driver adapter — Prisma 7
  no longer reads `DATABASE_URL` from the schema file; see `prisma.config.ts` and `src/lib/prisma.ts`)
- **Database:** PostgreSQL via Supabase
- **Auth:** Auth.js (Credentials provider), roles: `employee` / `reviewer`
- **Deployment:** Vercel (auto-deploys on push to `main`)

## Live deployment

https://reimburse-it-pateldarshil8s-projects.vercel.app

## Setup

1. Install dependencies (this also runs `prisma generate` via `postinstall`):
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — pooled Supabase connection string (port 6543, `?pgbouncer=true`), used by the app at runtime
   - `DIRECT_URL` — direct Supabase connection string (port 5432), used by the CLI for `db push` (falls back to `DATABASE_URL` if unset)
   - `AUTH_SECRET` — generate with `npx auth secret`
3. Push the schema (client is regenerated automatically as part of `npm run build`, or run it directly):
   ```bash
   npm run db:push
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
`binaries.prisma.sh`, so `prisma generate` could never be verified locally there —
Vercel's build (which has normal network access) was used as the real test
environment instead, and the deployment above is confirmed working end-to-end
(login, role-gated routing, DB round-trip). Locally, `npm install` triggers
`prisma generate` automatically via `postinstall`.
