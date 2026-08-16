# Reflection

Status: complete as of Day 3 (final day).

## What I built

A full Create → Submit → Review → Approve/Reject → Paid reimbursement workflow
across three roles (employee/reviewer/admin), matching the official Tier 1
checklist:

- Credentials-based auth (Auth.js) with role stored on the JWT/session, and
  role-gated routing enforced server-side via middleware, not just hidden nav
  links.
- Employee: create/edit/submit a request, with a receipt required to submit
  (real upload to a private Supabase Storage bucket, backend-validated by
  actual file bytes, not just the declared MIME type or extension), own
  request list, and a detail/history view.
- Reviewer: a filterable/sortable/paginated queue, dashboard financial
  totals, approve / reject (with a required reason) / mark Paid, all
  backend-enforced (can't act on your own request, drafts are never visible
  to reviewers even via a crafted status filter).
- Admin: view all users (email, role, status, join date), change a user's
  role, activate/deactivate an account, with every change recorded in an
  audit trail and visible in a "Recent account activity" panel. Backend
  blocks an admin from demoting or deactivating themselves.
- Notifications: written on every status transition, with a list view,
  per-notification and mark-all "mark as read," and an unread-count badge in
  the nav, backed by both a Server Component read path and a documented
  `GET /api/notifications` endpoint.
- `GET /api/requests`: a real paginated/filterable/sortable REST endpoint
  (status, category, requester, date range, keyword), returning
  `{ data, page, pageSize, total, totalPages }` and proper 401/403/500
  responses rather than leaking exception detail.
- Persistent Postgres storage (Supabase) via Prisma, with a data model
  covering users, requests, review actions (audit trail), notifications, and
  admin/account audit history.

Two personal, git-backed tracks exist for this hackathon: this repository
(`reimburse-it`) follows my own compressed 3-day schedule; a second repo
(`reimburse-it-v2`, not this one) has its commit history deliberately
restructured to match the official 5-day cadence, so the actual CDF
submission repo can show authentic day-by-day progress when I copy that work
across. Both contain the same underlying feature set by the end.

## Key tradeoffs

- **3 days instead of 5.** I compressed the official 5-day brief into a
  personal 3-day schedule (see `PROJECT_PLAN.md`), which meant prioritizing
  the core workflow and backend-enforced security over Tier 2 stretch goals.
  No Tier 2 item was attempted at the expense of a Tier 1 requirement.
- **No full OpenAPI/Swagger spec.** Most reads go through Server Components
  calling Prisma directly rather than a client-side fetch, so there's no
  conventional REST surface to document for those. The two real Route
  Handlers (`/api/requests`, `/api/notifications`) are documented in
  `docs/architecture.md` with their query params, response shape, and error
  format instead of a generated spec -- a deliberate scope cut given the
  app's actual API surface is small.
- **Status model collapsed from six states to five.** The brief's suggested
  Draft/Submitted/Under Review/Approved/Rejected/Paid model is explicitly
  allowed to merge Submitted and Under Review; I did that, since a distinct
  "claimed by reviewer X" state would add a transition with no corresponding
  UI value at this scope.
- **No resubmission-after-rejection flow.** A rejected request is terminal in
  this build (Tier 2 stretch, not built) -- disclosed in the README rather
  than silently omitted.
- **Duplicate-submission prevention is UI + state-machine, not row-locked.**
  The submit button disables itself while its action is pending (stops
  accidental double-clicks), and a request can only leave `draft` once
  (re-editing a non-draft request is refused). I did not add
  transaction-level row locking against a true concurrent multi-tab race,
  since the brief explicitly scopes this as "not a production financial
  system" and that failure mode wasn't worth the added complexity at this
  scope.
- **Automated tests weren't built.** `prisma generate` cannot run in the
  sandboxed environment used to develop this project (it can't reach
  `binaries.prisma.sh`), which made a fast local test-and-iterate loop
  impractical. I chose to spend the available time on manual verification
  against the real, deployed production environment (see `docs/testing.md`)
  rather than building a test harness against an environment I couldn't run
  locally. This is a real gap relative to the Tier 2 "automated testing"
  stretch goal, and I'm disclosing it as such rather than claiming coverage
  I don't have.
- **Admin scope is intentionally minimal.** View/role-assign/activate-
  deactivate plus an audit-trail panel, matching exactly what
  `problem_statement.md` §1 asks for administrators -- I didn't build
  additional admin surface (e.g. a dedicated full-history page per user)
  beyond that.

## Problems encountered and fixed

Real bugs found during development and post-launch testing, not just disclosed
scope cuts (those are in "Key tradeoffs" above):

- **Admin role `<select>` showed a stale value after a successful update
  (Day 3).** Changing a user's role saved correctly (confirmed via a hard
  reload and the audit trail), but the dropdown kept displaying whichever
  option the admin had last picked in the UI rather than the saved value --
  React doesn't re-apply `defaultValue` to an already-mounted uncontrolled
  `<select>`. Fixed by keying the element on the current role
  (`key={role}`) so it remounts, and re-reads the fresh `defaultValue`,
  whenever the server-fetched role changes.
- **Receipt file-type validation trusted the client-declared MIME type
  (Day 3 security review).** The upload check only compared `File.type`
  (attacker-controllable in a crafted request) against an allow-list.
  Fixed by sniffing the actual uploaded bytes' magic numbers
  (`src/lib/file-signature.ts`) and rejecting a mismatch before the file
  ever reaches Supabase Storage.
- **Reported: "Invalid email or password" right after an admin changes a
  user's role (post-launch).** Investigated by reproducing the reported
  sequence two independent ways -- once through the actual admin UI
  (change a role, sign out, sign back in as that user) and once by
  updating the role directly in the database to rule out any UI/timing
  involvement -- and in both cases the login succeeded normally with the
  new role and correct account layout. Could not reproduce a broken
  login. In the process of investigating, found and fixed two real,
  related issues instead of the literal report:
  - `authorize()` did an exact-match email lookup; the submitted email
    wasn't lowercased/trimmed the way signup already stores it, so an
    email typed with different casing than it was saved with (e.g.
    autocapitalized by a phone keyboard) would fail the lookup and show
    the same generic "Invalid email or password" message. Fixed in
    `src/auth.ts`.
  - An already-signed-in user's role was cached in their JWT at login
    time and never refreshed, so an admin changing that user's role had
    no visible effect until they manually signed out and back in --
    Server Components and Server Actions (which decide page content and
    admin/reviewer permissions) kept trusting the stale role for the
    rest of the session. Fixed with a Node-side `session` callback
    override in `src/auth.ts` that re-reads the current role from the
    database on every session read, plus each role-scoped layout
    (`src/app/{employee,reviewer,admin}/layout.tsx`) now re-checking
    `session.user.role` at render time and redirecting to the user's
    real current section if it no longer matches -- since the edge
    middleware (`src/proxy.ts`) still gates on the JWT's cached role
    (Prisma/pg can't run in the edge runtime) and can lag behind a role
    change until the next login. Verified live: changed a test account's
    role directly in the database while it was already signed in, then
    navigated without signing out -- it was redirected to the correct
    new section immediately, nav badge and all.
  - Given the very live, shared nature of testing this against production
    with a single shared admin login, it's also plausible the original
    report was affected by two people (me and the reporter) exercising
    role changes on the same accounts around the same time, which can
    look like unexpected behavior even when each individual change is
    working correctly -- noted here for completeness rather than as a
    confirmed root cause.

## AI tools and external resources used

This project was built with Claude (Anthropic) as a development assistant
across planning, scaffolding, and implementation, inside a Cowork session
with direct file and shell access, plus browser automation (Claude in
Chrome) for steps that required interacting with the Vercel and Supabase
dashboards, and for live testing against the deployed application. Per the
brief's AI-use disclosure requirement:

- Claude was used to scaffold the Next.js/Prisma/Auth.js/Supabase
  architecture, write application code, resolve build/tooling issues (e.g.
  Prisma 7's driver-adapter architecture, Next.js 16's `proxy.ts`
  convention, a TypeScript `Blob`-constructor type error caught by Vercel's
  build), and draft this documentation set.
- All architectural decisions (stack choice, data model, status model, scope
  cuts) were reviewed and directed by me, not auto-accepted from
  suggestions.
- Claude live-tested the deployed application (all three roles, the reject
  flow, notifications, admin actions) as part of Day 3 verification, and in
  the process found and fixed a real bug: the admin role `<select>` kept
  showing whichever option was last picked in the UI instead of the
  confirmed saved value after a successful update, because React doesn't
  re-apply `defaultValue` to an already-mounted uncontrolled input. The
  underlying data and audit trail were correct the whole time -- this was a
  display-only bug, caught by comparing the post-submit screenshot against a
  hard page reload, not by trusting the first render. I reviewed this fix
  (keying the `<select>` on the current role so it remounts after a save)
  before it shipped.
- Claude also flagged and fixed a real security gap during a Day 3 review
  against `problem_statement.md` §15/§18: receipt file-type validation only
  checked the client-declared `File.type`, which is attacker-controllable in
  a crafted request. I directed the fix (server-side magic-byte sniffing of
  the actual uploaded bytes) rather than accepting the original
  implementation as sufficient.
- No part of the application logic, schema, or seeded data was copied from
  an existing CDF or third-party hackathon solution; the brief was read
  directly from CDF's provided `problem_statement.md`, `planning.md`, and
  `README.md`.
- Standard open-source libraries only (Next.js, Prisma, Auth.js, Tailwind,
  Supabase JS client); no paid templates.

## What I'd improve next

- Automated test coverage (unit tests for the validation/RBAC logic, at
  minimum) -- the biggest gap relative to Tier 2, and the one I'm most
  explicit about not having built, for the environment reasons above.
- Resubmission-after-rejection, so a rejected request doesn't dead-end.
- A true multi-tab/concurrent-request guard against duplicate submissions
  (currently relies on UI-level pending-disable plus a state check that has
  a narrow theoretical race window).
- A generated OpenAPI spec for the two Route Handlers, once the API surface
  is worth the tooling investment.
- Email notifications alongside the in-app ones, and CSV/PDF export of
  requests, both flagged in `planning/planning.md` as Tier 2 stretch goals I
  didn't reach.
