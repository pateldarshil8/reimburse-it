# Testing

Status: first real manual pass completed on Day 2, against the live Vercel deployment
and the production Supabase database, using the seeded demonstration accounts. Day 3
will extend this pass to cover the admin screen, notifications UI, and the remaining
unchecked scenarios below once receipt upload is fully wired up (see note at the
bottom).

## Manual test scenarios (per the official brief)

- [x] **Missing receipt blocks submission.** Opened the seeded draft "Regional
      volunteer summit travel" (no receipt attached) as `employee@cdf.org`, clicked
      "Submit for review" with no file chosen. Result: blocked with a field-level error
      ("A receipt is required to submit.") and a form-level error, request correctly
      stayed in `draft`. Matches problem_statement.md's required "missing receipt"
      scenario.
- [x] **Draft edit form loads existing data correctly.** The same draft's edit form
      pre-filled title, category (via the Radix select), expense date, amount, and
      description from the database on load.
- [x] **Reviewer dashboard totals are accurate.** Compared the queue's summary cards
      against the seed data by hand: Pending 1 / $84.50, Total requested $646.49, Total
      approved $251.99, Total paid $52.99 -- all matched before any actions were taken.
- [x] **Drafts are never visible to reviewers.** The seeded draft did not appear in the
      reviewer queue under any filter, confirming the backend-enforced exclusion in
      `listRequests` (not just a missing UI link).
- [x] **Reviewer approval.** Approved "Printer paper and toner" (`$84.50`, submitted)
      as `reviewer@cdf.org` with a comment. Status flipped to `Approved`, the approve/
      reject form was replaced by the "Mark as paid" form, and the comment appeared in
      the request's history immediately.
- [x] **Approved request marked as Paid.** Marked the same request as paid with a
      payment note. Status flipped to `Paid`, all action forms disappeared (terminal
      state), and the full three-entry history (submitted / approved / paid) rendered
      in order with the correct actor and timestamp on each entry.
- [x] **Dashboard totals update after a transition.** After the approve + pay actions
      above, Pending dropped to 0, Total pending to $0.00, Total approved rose to
      $336.49, and Total paid rose to $137.49 -- each figure hand-verified against the
      new status mix.
- [x] **Receipt fallback for demo data.** Seed rows reference storage paths with no
      real uploaded bytes; both the employee and reviewer detail pages correctly show
      "Not available" instead of erroring when the signed URL can't be generated.
- [x] **Filter state reflected in the URL.** Navigating directly to `/reviewer?status=
      submitted` pre-selected "Submitted" in the filter form and correctly scoped the
      list -- confirms filters are shareable/bookmarkable, not just client state.
- [x] **Session-based role routing.** Logging in as `employee@cdf.org` landed on
      `/employee`; visiting `/login` again while still authenticated redirected
      straight back to `/employee` rather than showing the form; signing out and back
      in as `reviewer@cdf.org` landed on `/reviewer` with the reviewer nav/badge.
- [ ] Valid reimbursement submission **with a real receipt file** -- `SUPABASE_URL` and
      `SUPABASE_SERVICE_ROLE_KEY` are now set locally and in Vercel, and the app has
      been redeployed with them. The receipt-*required* validation is confirmed (see
      above); the successful-upload path itself still needs one manual click-through,
      since this environment's browser automation can't attach a file to a file input
      (a hard restriction, not a bug in the app) -- see the note below.
- [ ] Invalid amount (zero / negative) -- covered by `ExpenseRequestFormSchema` (zod,
      `positive()`), not yet exercised live.
- [ ] Invalid / missing category -- covered by `z.enum(CATEGORIES)`, not yet exercised
      live.
- [ ] Unsupported receipt file type rejected server-side -- covered by
      `validateReceiptFile()`, blocked on the same missing key as above.
- [ ] Duplicate submission prevented -- a draft can only be submitted once (transitions
      out of `draft` on submit; re-submitting requires it to still be a draft), not yet
      exercised live end-to-end.
- [ ] **Reviewer rejection with required reason.** Not yet exercised live -- the one
      seeded `submitted` request was used for the approve/paid test above instead.
      `rejectRequest` shares the same transaction pattern as `approveRequest` (verified
      by code review) but hasn't been clicked through in the browser yet.
- [ ] Unauthorized reviewer action blocked (401/403) -- `GET /api/requests` returns 401
      unauthenticated / 403 for a non-member role by code review; not yet hit directly
      with an unauthenticated request.
- [ ] Requester attempting reviewer-only functionality blocked -- enforced by
      `src/proxy.ts` route matchers + per-action `requireReviewer()` checks; not yet
      exercised as a live cross-role attempt.
- [ ] Requester attempting to approve/pay their own request blocked -- `approveRequest`/
      `rejectRequest`/`markRequestPaid` all check `existing.submitterId === user.id`
      and refuse; not yet exercised live (no seeded reviewer-submitted request exists
      to test this against).
- [ ] Search and filtering by category/requester/date/keyword -- the status filter was
      exercised live (above); category/requester/date/keyword filters share the same
      `listRequests` implementation but haven't each been clicked through individually.
- [ ] Pagination -- only one page of results exists in the seeded data, so the
      Previous/Next controls haven't been exercised against a real second page yet.
- [ ] Data persistence across a redeploy -- implied by using Postgres rather than
      in-memory state, not yet explicitly re-verified after a fresh deploy.

## Note on receipt upload

`src/lib/supabase-storage.ts` requires `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` to actually write to the private `receipts` bucket. Both
are now set in `.env` (local) and in Vercel's project environment variables, and the
production deployment has been rebuilt since. What remains is a single manual
end-to-end check -- log in as an employee, attach a real file to the "Regional
volunteer summit travel" draft, and submit -- since this project's browser-automation
tooling can attach files to inputs from a connected folder but not from this session's
own scratch space, and the OPT project folder isn't the right place to leave a
temporary test file in.

## Approach

Manual pass performed directly against the production Vercel deployment and the live
Supabase database (not a local dev server, since `prisma generate` cannot run in the
sandboxed build environment used to develop this project -- see the note in
`README.md`). Automated tests remain a should-have, added only if time allows once the
core workflow, receipt handling, and required docs are complete, per the fallback order
in `PROJECT_PLAN.md`.
