# Walkthrough Video

**Video link:** _to be added before submission -- record a 3-5 minute walkthrough
covering the items below, then paste the link here._

## Suggested script (per the official brief's video requirements)

Everything below has been built and manually verified against the live
deployment (`docs/testing.md`); this is a suggested recording order, not a
plan for future work.

1. **What you built and the stack** (30s) -- ReimburseIt, a Next.js 16 App
   Router app with Prisma/Postgres (Supabase) and Auth.js; Server Components/
   Server Actions/Route Handlers act as the backend (see
   `docs/architecture.md`).
2. **Requester workflow** (45s) -- log in as `employee@cdf.org`, create a
   request, show a validation error (e.g. submit with no receipt), attach a
   receipt, submit.
3. **Reviewer workflow** (60s) -- log in as `reviewer@cdf.org`, open the
   submitted request, view the receipt, approve one request with a comment,
   reject another with a required reason, mark an approved request as Paid.
4. **Back to the requester** (20s) -- show the updated status and the
   rejection reason on the employee side, and the notification it generated.
5. **Search, filtering, and dashboard totals** (30s) -- filter the reviewer
   queue by status/category/requester, show the pending count and financial
   totals updating.
6. **Admin** (30s) -- log in as `admin@cdf.org`, change a user's role,
   deactivate/reactivate an account, show the account-activity audit trail.
7. **Role-based access control** (20s) -- as the employee session, try
   navigating directly to `/admin` or `/reviewer` and show the redirect back.
8. **Data and receipt protection** (20s) -- explain Postgres persistence via
   Prisma, and that receipts live in a private Supabase Storage bucket
   accessed only via short-lived signed URLs after an authorization check.
9. **Testing and limitations** (20s) -- reference `docs/testing.md` for what
   was verified, and `docs/reflection.md` for known limitations (no automated
   tests, no resubmission-after-rejection) and what's next.

Target length: 3-5 minutes, per the brief.
