# Architecture

Status: complete as of Day 3 (final day). First drafted after Day 1 (foundation),
extended through Day 2 (core workflow, receipts, dashboard) and Day 3 (admin,
notifications, security hardening).

## Overview

ReimburseIt is a single Next.js 16 (App Router) application. There is no separate
backend service — Server Components, Server Actions, and Route Handlers under `src/app`
together act as the backend, talking to a Postgres database (hosted on Supabase) through
Prisma.

```
Browser
  │
  ▼
Next.js App Router (src/app)
  ├─ Server Components   → read data directly via Prisma (no client-side fetch waterfall)
  ├─ Server Actions       → mutations (create/submit/review/etc.), run server-side only
  ├─ Route Handlers (API) → src/app/api/**, used where a real HTTP endpoint is needed
  │                         (paginated/filterable list views, per §13/§14 of the brief)
  └─ Auth.js (JWT sessions) → authenticates requests, attaches role to the session
  │
  ▼
Prisma ORM (driver adapter: @prisma/adapter-pg)
  │
  ▼
Supabase Postgres  +  Supabase Storage (private "receipts" bucket)
```

## Why this stack

- **Next.js App Router, one repo:** the brief allows any stack; a single Next.js app
  removes the need to host and CORS-configure a separate API service, which matters for
  a compressed 3-day build.
- **Prisma 7 + `@prisma/adapter-pg` driver adapter:** Prisma 7 changed how the client is
  generated and how it connects (no `url`/`directUrl` on the `datasource` block; the
  connection is supplied at runtime through a driver adapter instantiated in
  `prisma.config.ts` and wherever the client is created). This project follows that
  pattern rather than the older `prisma-client-js` generator.
- **Auth.js (NextAuth) v5, Credentials provider, JWT sessions:** the brief explicitly
  allows "preconfigured demonstration accounts" as sufficient authentication depth. JWT
  sessions avoid needing a sessions table, and the role lives in the token so
  route-level authorization (see below) doesn't need a database round-trip.
- **Supabase for both Postgres and Storage:** one provider for the database and for
  private receipt file storage, rather than wiring up a separate object-storage
  service.

## Roles and route-level authorization

Three roles: `employee` (requester), `reviewer`, `admin`. Role is stored on `User.role`
and copied into the JWT/session on login (`src/auth.config.ts`).

Authorization happens in two layers:

1. **Routing layer (`src/proxy.ts` + `authConfig.callbacks.authorized`):** every request
   under `/employee/*`, `/reviewer/*`, or `/admin/*` is matched against the required role
   for that path prefix. A logged-out user is redirected to `/login`; a logged-in user
   with the wrong role is redirected to their own role's home page rather than shown a
   403 page, since there's nothing sensitive to hide behind that redirect.
2. **Server Action / Route Handler layer:** every mutation re-checks `auth()` and the
   caller's role server-side before touching the database. The routing-layer check
   controls page access; it is not treated as sufficient authorization for the mutation
   itself, per the brief's requirement (§10) that permissions be backend-enforced, not
   just hidden in the UI. Route Handlers return `401` for unauthenticated requests and
   `403` for authenticated-but-wrong-role requests.

A note on the `authConfig` split: Next.js 16's edge-runtime `proxy.ts` and the
full server-side `auth.ts` each instantiate their own `NextAuth(...)` config. Any
callback that needs to run in both places (role-based `authorized()` redirect logic)
has to live in the shared `src/auth.config.ts`, not only in `src/auth.ts`, or the edge
proxy silently falls back to default behavior.

## Data model

Defined in `prisma/schema.prisma`. Core entities:

- **User** — id, name, email, password hash, `role` (employee/reviewer/admin),
  `accountStatus` (active/inactive, admin-managed), timestamps.
- **ExpenseRequest** — the reimbursement request itself: submitter, title, category,
  `expenseDate`, `description`, `totalAmount`, currency, receipt file reference
  (`receiptUrl` object path + `receiptName`/`receiptType`), `status`.
- **ReviewAction** — an audit-trail row per workflow transition (submit / approve /
  reject / mark paid), recording who acted, when, the previous and new status, and an
  optional comment/reason. This is what backs each request's visible history.
- **Notification** — one row per in-app notification (recipient, message, related
  request, read/unread, timestamp).
- **UserAudit** — role and account-status changes performed by an admin on another user,
  for the same auditability requirement applied to account administration (§17).

### Status model

`draft → submitted → approved | rejected → paid`

The brief's suggested six-state model (Draft / Submitted / Under Review / Approved /
Rejected / Paid) is intentionally collapsed to five internal states by merging
"Submitted" and "Under Review" into one `submitted` state — the brief explicitly permits
this ("You may combine Submitted and Under Review if your workflow is clearly
explained"). There is no separate reviewer "claim" step in this build, so a request
being visible to reviewers *is* it being under review; a distinct "claimed by reviewer
X" state would add a transition with no corresponding UI value at this scope.

The internal enum value for the final state is `paid` (not `completed`) — the schema
was updated during the Day 1 redo specifically so the terminology matches the brief and
the demo script (§ "Minimum Demonstration Scenario": "Mark an approved request as
Paid") word-for-word, rather than requiring a UI-only relabeling of a differently-named
enum.

## Receipt storage

Receipts are stored in a **private** Supabase Storage bucket (`receipts`), not a public
one. `src/lib/supabase-storage.ts` wraps the Supabase service-role client and exposes:

- `uploadReceipt(path, file, contentType)` — used by the submission Server Action.
- `getReceiptSignedUrl(path, expiresInSeconds)` — generates a short-lived signed URL,
  called only after the requesting user has been confirmed as either the request's
  submitter or a reviewer/admin. No receipt path is ever returned to the browser as a
  permanent public URL.

Upload validation (file type allow-list: JPEG/PNG/PDF; size limit) happens server-side
against the actual uploaded bytes/content-type, not just the filename extension, per §15
of the brief.

## API design

Most reads use Server Components calling Prisma directly — there is no client-side
fetch involved, so there's no separate "API" to design for those. Two areas get real
Route Handlers under `src/app/api/`, because they need to be callable with query
parameters for filtering/sorting/pagination independent of a page render:

- `GET /api/requests` — paginated, filterable, sortable list of reimbursement requests
  (status, category, requester, date range, keyword), used by both the reviewer queue
  and the requester's own request history.
- `GET /api/notifications` — paginated notification list.

Both follow a consistent response shape: `{ data: [...], page, pageSize, total,
totalPages }`. Errors follow `{ error: { message } }` with the corresponding HTTP status
(400 for validation, 401/403 for auth, 404 for missing resources) — no raw exception
detail is ever included in the response body.

This is intentionally not a full REST layer with OpenAPI/Swagger tooling wrapped around
every Server Action; the brief's §13 requirement for "API documentation... using OpenAPI,
Swagger, or an equivalent approach" is met here by documenting the actual request/response
shape of the two real endpoints in this file, since the majority of the app's mutations
are Server Actions rather than a conventional REST API surface.

## Deployment

- **Vercel** hosts the Next.js app, auto-deploying on push to `main`. `prisma generate`
  runs as part of the Vercel build step (`"build": "prisma generate && next build"`)
  rather than locally, since the local development sandbox used for this project
  blocks the CDN Prisma downloads its query engine binary from — Vercel's build
  environment has unrestricted network access, so this isn't a workaround visible to
  end users or graders, just where the generation step runs.
- **Supabase** hosts the Postgres database and the private receipts bucket.
- Secrets (database connection strings, `NEXTAUTH_SECRET`, Supabase service role key)
  are set as Vercel environment variables, never committed. `.env.example` documents
  every variable a fresh clone needs without containing real values.

## Admin and notifications (Day 3)

Admin functionality (`src/app/admin/`) follows the same guard pattern as the reviewer
actions: a `requireAdmin()` helper throws if the caller is unauthenticated or not an
admin, checked at the top of every mutating Server Action, independent of what the UI
exposes. Role changes and account activation/deactivation are written inside a
`prisma.$transaction([...])` alongside a `UserAudit` row, the same pattern
`ReviewAction` uses for request status transitions -- one consistent
mutation-plus-audit-row shape across both request review and account administration.
An admin is explicitly blocked (server-side) from changing their own role or
deactivating their own account, to avoid a no-admins-left state with no recovery path.

Notifications are written as a side effect of every status transition (inside the same
transaction as the transition itself, so a notification never exists without the
transition that caused it). The UI (`src/app/notifications/`) and the
`GET /api/notifications` Route Handler both read from the same `listNotifications`/
`unreadNotificationCount` helpers in `src/lib/notifications.ts`, scoped to the
authenticated caller's own `userId` -- there is no way to request another user's
notifications through either path.

## Known gaps and disclosed limitations

See `docs/reflection.md` for the full list with reasoning. In short: no automated test
suite (the sandbox this project was built in can't run `prisma generate` locally,
which made a fast local test loop impractical), no resubmission-after-rejection flow,
and no full OpenAPI spec (the two Route Handlers' shapes are documented in this file
instead, since most reads go through Server Components rather than a REST layer).

See `PROJECT_PLAN.md` for the day-by-day build log and `planning/planning.md` for the
original pre-code plan this was built against.
