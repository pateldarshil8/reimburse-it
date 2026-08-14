# CDF Hackathon: Expense Tracker — Project Brief

**Format:** 3-day individual hackathon build (compressed from the official 5-day timeline)
**Goal:** Submit and track reimbursement requests; reviewers approve/reject/complete them.

> This brief was an informal, simplified scope written before the official CDF
> `problem_statement.md` and `README.md` were available. Those two documents are the
> real spec. Several things cut below (real receipt uploads, an Administrator role,
> search/filtering, dashboard totals, notifications, API docs, pagination) turned out
> to be Tier 1 requirements in the official brief, not optional extras. The plan below
> has been revised to close those gaps as far as 3 days allows — see
> **"Gap analysis vs. the official CDF problem statement"** below.

## Stack

- Frontend + backend: Next.js (App Router, TypeScript) — one repo, API routes double as the backend
- Styling: Tailwind CSS + shadcn/ui
- ORM: Prisma
- Database: PostgreSQL via Neon (or Supabase)
- Auth: Auth.js (credentials provider), roles: employee / reviewer
- Deployment: Vercel

## Data model (revised)

**Users:** id, name, email, password_hash, role (`employee` / `reviewer`, admin TBD — see
gap analysis), created_at

**ExpenseRequests:** id, submitter_id (FK), title, **expense_date**, category,
**description**, total_amount, currency, receipt_url (Supabase Storage object path, not
raw public URL), status, created_at, updated_at
Status flow: draft → submitted → approved | rejected → **paid** (schema enum renamed
from `completed` to `paid` during the Day 1 redo, so the internal value matches the
official spec's terminology directly — no UI-only relabeling needed)

**ReviewActions** (audit trail): id, request_id (FK), reviewer_id (FK, nullable — a
`submitted` action is self-logged by the requester, not a reviewer), action, comment
(nullable), previous_status, new_status, created_at

**Notifications**: id, user_id (FK), request_id (FK, nullable), message, read_at
(nullable), created_at — table now built as part of the Day 1 redo (schema + Supabase
migration); the notification-triggering logic and UI are still a Day 3 should-have, see
fallback order below.

**UserAudit** *(new, admin accountability)*: id, target_id (FK), actor_id (FK), action,
detail (nullable), created_at — records admin-performed role/account-status changes on
other users.

Two new scalar fields (`expense_date`, `description`) are required — they're part of the
official Tier 1 request form (`problem_statement.md` §3) and were missing from the
original schema.

## Scope cuts for the 3-day build (revised against the official Tier 1 checklist)

The official `problem_statement.md` treats several of the items below as **required**,
not optional. Cutting them under a 3-day compression is a real tradeoff, not a free
choice — each cut here must be disclosed in the README's "Known limitations" section and
in `docs/reflection.md`.

- **No expense line-item breakdown** — single amount field per request. Not required by
  the official spec either; safe cut.
- **Real receipt upload, upgraded from the original text/URL-only cut.** The official
  spec requires actual file upload (JPEG/PNG/PDF), backend file-type validation, a size
  limit, private storage, and authorized/signed access (§15). We're already on Supabase,
  so this is Supabase Storage with a private bucket + signed URLs — a moderate lift, not
  a rewrite. **Keeping this in scope**, not cutting it.
- **Minimal auth** — credentials provider, no password reset/email verification. Matches
  the official spec's own guidance ("preconfigured demonstration accounts" is an
  accepted approach). Safe cut.
- **Administrator role — reduced to a minimal version, not cut entirely.** The official
  spec lists this as part of Tier 1, not Tier 2. Full scope (account status history,
  etc.) won't fit in 3 days; a minimal version (view users, change role, activate/
  deactivate) will. If even that slips, it must be disclosed as a limitation, not
  silently dropped.
- **Notifications — should-have, cut first if time runs out.** Required by §16, but
  lower cost/impact than the items above; a simple in-app notification list is the
  fallback-first cut, with disclosure.
- **Full OpenAPI/Swagger documentation — replaced with documented API shape in
  `docs/architecture.md`.** The official spec asks for API docs (§13). Given the app is
  built on Server Actions rather than a REST layer, a couple of real API routes will be
  added specifically for the searchable/paginated request list (which also satisfies
  §14), and their shape documented in `docs/architecture.md` rather than a full
  OpenAPI spec.

## 3-day plan (revised)

**Day 1 — Foundation.** ✅ Done. Next.js + TypeScript + Tailwind + shadcn, Prisma schema,
Supabase database, Auth.js with two roles + seed script, role-gated routing, deployed to
Vercel and verified live end-to-end.

**Day 2 — Core workflow + the Tier 1 items that touch the data model.** This day now
carries more than just create/submit/review — the schema and reviewer-facing features
that were missing from the original plan land here, since Day 3 needs them to already
exist to layer validation and polish on top.

- Migrate schema: add `expense_date`, `description` to `ExpenseRequest`; add
  `Notification` model (build the table now even if the UI for it slips to a should-have
  in Day 3).
- Wire up Supabase Storage: private bucket for receipts, signed-URL generation on read,
  backend file-type + size validation on upload.
- Submitter side: create/edit/submit a request (all required fields, real receipt
  upload), view own requests with status badges, reviewer comments, and rejection
  reasons visible.
- Reviewer side: queue of submitted requests with search/filter (status, category,
  requester, date) and a real API route (`GET /api/requests`) backing it with pagination
  — this is what satisfies §7, §13, and §14 together instead of three separate efforts.
  Approve/reject with a required comment (writes a ReviewActions row, updates status).
- Reviewer dashboard totals: pending count, total pending amount (§6, §8 partial).
- Seed sample expense requests covering the scenarios the spec calls out: a valid
  request, one missing a receipt, one with an invalid amount (for testing, not seeded as
  valid data), an approved-awaiting-payment one, a rejected-with-reason one, a paid one.

This is still the heart of the grading criteria (30% core functionality) — don't rush it
to make room for the new items above; if something has to slip, it should be the
Notification UI or admin screen, not this.

### Day 2 status

- [x] Shared validation (zod schemas, categories, receipt-file checks) and a shared
      `listRequests` / `computeDashboardTotals` query layer, used by both roles and by
      `GET /api/requests`
- [x] Submitter: create/edit/submit a request, save-as-draft vs. submit-for-review via
      one form, receipt required to submit (validated and confirmed live), own request
      list with status badges, detail/history view with signed-URL receipt access
- [x] Reviewer: queue with search/filter (status/category/requester/date/keyword),
      sort, pagination; request detail page; approve / reject (required reason) / mark
      paid, each backend-checked (role, not-your-own-request, valid status transition)
- [x] Reviewer dashboard totals: pending count, total pending/requested/approved/paid
      -- confirmed accurate against seed data and after a live approve+pay transition
- [x] `GET /api/requests`: real endpoint, backend auth (401 unauthenticated / 403 wrong
      role), employee scope can't be widened by a client-supplied `requesterId`
- [x] Drafts are excluded from the reviewer queue at the query level, not just hidden
      in the UI (verified live: the seeded draft never appeared under any filter)
- [x] Notifications are written on every transition (submit/approve/reject/paid) --
      table populated, no UI yet (Day 3)
- [x] `accountStatus` now enforced at login (deactivated users can't sign in)
- [x] Build fixed and verified on Vercel (one TS fix needed: an object-literal status
      field was widening to `string` instead of the Prisma enum; fixed with an explicit
      type annotation)
- [x] Live smoke test via browser automation against the production deployment and
      real Supabase data: login/logout and role redirects, draft edit forms
      pre-filling correctly, missing-receipt validation, full approve → mark-paid
      lifecycle with history and dashboard totals updating correctly. See
      `docs/testing.md` for the full pass and what's still outstanding (reject flow,
      real file upload, and a few filter combinations weren't yet clicked through live).
- [ ] **Blocking gap:** `SUPABASE_SERVICE_ROLE_KEY` is still not set (locally or in
      Vercel), so real receipt file uploads can't be tested end-to-end yet -- upload
      failures are handled gracefully (form shows an error, the request itself still
      saves), but this needs to be resolved before Day 3's "receipt upload" demo-script
      item can be shown working for real.

**Day 3 — Completion, admin, docs, polish, deploy.**

- Add `paid` status (reviewer marks an approved request as Paid — UI label, see data
  model note above).
- Validation: no empty/zero-amount requests, no empty required fields, can't review your
  own request, can't submit twice, invalid workflow transitions rejected, no stack
  traces/DB errors exposed to the client.
- Minimal admin screen: list users, change role, activate/deactivate. Cut first if
  behind schedule, but disclose if cut.
- Notification UI (list, mark-as-read) if time allows; otherwise disclosed cut.
- Dashboard financial summary: total requested / approved / pending / paid (§8, rest of
  what Day 2 started).
- Responsive pass: verify major workflows at desktop/tablet/mobile widths.
- Required docs: `docs/architecture.md` (data flow + the API-route decision above),
  `docs/testing.md` (manual test pass against the spec's listed scenarios — automated
  tests only if time remains), `docs/reflection.md` (tradeoffs + AI tool disclosure),
  `docs/walkthrough.md` (link to the 3-5 minute video once recorded). README updated
  with features implemented, known limitations, future improvements.
- Full end-to-end pass as both roles (and admin, if built). Final deploy to Vercel,
  verify the live URL in a fresh session.

**Fallback order if behind schedule (cut from the bottom up):** notifications UI → admin
screen → dashboard totals polish → automated tests (keep the manual `docs/testing.md`
pass regardless — it's required, and cheap) → `paid` status (last resort; a working
two-state review flow beats a broken three-state one, but this is now the *last* thing
to cut, not the first, since §8's "total paid" and the demo script both depend on it).

## Day 1 status

Original Day 1 build:

- [x] Next.js + TypeScript + Tailwind scaffolded
- [x] shadcn-style UI primitives added (button, input, label, textarea, card, badge, select)
- [x] Auth.js credentials provider + role-gated routing via `src/proxy.ts`
- [x] Deployed to Vercel, auto-deploys on push to `main`

Day 1 redo, after the official CDF documents arrived (this pass):

- [x] Prisma schema rewritten: `admin` role, `accountStatus`, `expenseDate`/
      `description` on `ExpenseRequest`, receipt metadata fields, `Notification` and
      `UserAudit` models, `RequestStatus` enum renamed `completed` → `paid`
- [x] Auth generalized from a hardcoded employee/reviewer branch to an N-role lookup
      (`src/auth.config.ts`), admin route stub added (`/admin`)
- [x] Seed script rewritten: `admin@cdf.org` added, idempotency guard added, 5 sample
      expense requests seeded covering the scenarios the spec calls out (submitted,
      missing-receipt draft, approved-awaiting-payment, rejected-with-reason, full
      paid lifecycle)
- [x] Supabase Storage: private `receipts` bucket provisioned, `src/lib/
      supabase-storage.ts` added (upload + signed-URL helpers, not yet wired to a UI)
- [x] New schema + seed data pushed live to Supabase, verified via `list_tables` and
      `get_advisors` (no security warnings)
- [x] `planning/planning.md`, `problem_statement.md`, `docs/*.md` added to match the
      official repo structure
- [x] Full local build/Vercel/Supabase/repo-structure verification: Vercel production
      deployment READY on the new commit, Supabase tables match the new schema (4
      users / 5 requests / 8 review actions / 4 notifications, RLS on, no security
      warnings), local `OPT` folder and GitHub repo both match the CDF README's
      expected structure (`README.md`, `problem_statement.md`, `planning/planning.md`,
      `src/`, `docs/{architecture,testing,reflection,walkthrough}.md`)

**Day 1 is complete as of this pass.** Day 2 starts with the core workflow build
(create/submit/review/approve/reject, real receipt upload, dashboard totals,
search/filter/pagination) per the Day 2 plan above.

## Gap analysis vs. the official CDF problem statement

Compared against `problem_statement.md` and `README.md` (the real spec, as opposed to
the informal brief this document started from). `planning/planning.md` was also
provided by CDF, but its content is a PII-redaction/detection-model template — unrelated
to this project. Treated as a template mix-up and flagged separately rather than
followed; `planning/planning.md` in this repo has been rewritten for the actual project.

**Data model gaps (Day 2):** `expense_date` and `description` are required request
fields (§3) and were missing from the schema.

**Real receipt handling (Day 2):** §15 requires actual file upload with backend
validation and private, authorized-only storage — the original brief's "URL field only"
cut conflicts with this directly. Upgraded to Supabase Storage with a private bucket.

**Administrator role (Day 3, minimal):** §1 lists this under Tier 1. Full scope won't
fit in 3 days; a minimal view/role/activate-deactivate screen is the target, with
disclosure if it slips further.

**Reviewer dashboard totals, search/filtering, pagination, dashboard financial summary
(Day 2/3):** §6, §7, §8, §14 — none of these were in the original 3-day plan at all.
Added across Day 2 and Day 3.

**API design / documentation (Day 2):** §13 expects consistent API design with
OpenAPI/Swagger-style docs. Given the app is Server-Action-first, the plan adds real API
routes specifically for the searchable/paginated request list and documents the shape in
`docs/architecture.md`, rather than building a full REST layer just to wrap it in
OpenAPI.

**Notifications (Day 3, should-have):** §16 is required, but lowest priority relative to
the others given the 3-day compression — first thing cut if time runs short, with
disclosure.

**Required submission docs (Day 3):** `docs/walkthrough.md`, `docs/architecture.md`,
`docs/testing.md`, `docs/reflection.md`, plus README sections for features implemented,
known limitations, and future improvements — none existed. Cheap relative to their
rubric weight (10%), so kept in scope regardless of what else slips.

**Sample data (Day 2):** the spec wants seeded requests covering specific scenarios
(missing receipt, invalid amount, approved-awaiting-payment, rejected-with-reason,
paid), not just seeded users. Added to Day 2.

**Terminology (Day 1 redo):** the official spec and demo script say "Paid," this
project's enum said `completed`. Renamed the schema enum value itself to `paid` (rather
than a UI-only relabel), so the internal model and the demo script use the same word.

**Explicitly out of scope, confirmed fine:** pushing to the CDF-provided repo (handled
manually, outside this plan) and the 5-day-vs-3-day timeline compression itself — both
acknowledged and accepted tradeoffs, not gaps to close.
