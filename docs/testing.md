# Testing

Status: complete as of Day 3 (final day). Manual passes were performed directly
against the live Vercel deployment (`reimburse-it-nine.vercel.app`) and the
production Supabase database, using the seeded demonstration accounts, across
Day 2 and Day 3. No local dev server was used for verification -- see the note
at the bottom on why.

## Manual test scenarios (per the official brief)

- [x] **Missing receipt blocks submission.** Opened a draft with no receipt
      attached as `employee@cdf.org`, clicked "Submit for review" with no file
      chosen. Result: blocked with a field-level error ("A receipt is required
      to submit.") and a form-level error; request correctly stayed in
      `draft`.
- [x] **Draft edit form loads existing data correctly.** A draft's edit form
      correctly pre-filled title, category, expense date, amount, and
      description from the database on load.
- [x] **Reviewer dashboard totals are accurate.** Compared the queue's summary
      cards against known request data by hand across multiple sessions --
      Pending count/amount, Total requested/approved/paid all matched before
      and after each transition below.
- [x] **Drafts are never visible to reviewers.** A draft request never
      appeared in the reviewer queue under any filter, confirming the
      backend-enforced exclusion in `listRequests` (not just a missing UI
      link).
- [x] **Reviewer approval.** Approved a submitted request as
      `reviewer@cdf.org` with a comment. Status flipped to `Approved`, the
      approve/reject form was replaced by the "Mark as paid" form, and the
      comment appeared in the request's history immediately.
- [x] **Approved request marked as Paid.** Marked an approved request as paid
      with a payment note. Status flipped to `Paid`, all action forms
      disappeared (terminal state), and the full history rendered in order
      with the correct actor and timestamp on each entry.
- [x] **Reviewer rejection with a required reason.** On the "Regional
      volunteer summit travel" request ($142.00, Travel): first clicked
      "Reject" with the reason textarea empty -- blocked client-side by the
      `required` attribute, no request sent. Then entered a real reason
      ("Missing itemized parking receipt -- please resubmit with the full
      receipt attached.") and rejected. Status flipped to `Rejected`, and the
      reason appeared verbatim in the request's history as a quoted entry
      attributed to Rita Reviewer.
- [x] **Requester sees the rejection reason and an unread notification.**
      Signed back in as `employee@cdf.org`: the request list showed the
      "Rejected" badge, the notifications bell showed an unread badge (1),
      and `/notifications` listed "Your request 'Regional volunteer summit
      travel' was rejected." linking back to the request.
- [x] **Notifications: view, mark one as read, mark all as read.** On
      `/notifications` as `employee@cdf.org`: clicked "Mark read" on a single
      unread notification -- unread count and nav badge both decremented
      immediately. Then clicked "Mark all as read" -- remaining unread
      notifications cleared and the badge disappeared from the nav entirely.
- [x] **Dashboard totals update after a transition.** After each approve /
      reject / pay action above, the reviewer queue's Pending count, Total
      pending, Total approved, and Total paid figures all updated to match
      the new status mix on the very next page load.
- [x] **Receipt fallback for demo data.** Seed rows that reference a storage
      path with no real uploaded bytes correctly show "Not available" on both
      the employee and reviewer detail pages instead of erroring.
- [x] **Filter state reflected in the URL.** Navigating directly to
      `/reviewer?status=submitted` pre-selected "Submitted" in the filter form
      and correctly scoped the list -- filters are shareable/bookmarkable,
      not just client state.
- [x] **Session-based role routing / RBAC, all three roles.** Logging in as
      `employee@cdf.org` landed on `/employee`. As that employee session,
      directly navigating to `/admin` and to `/reviewer` both redirected back
      to `/employee` without ever rendering the target page -- confirming
      route-level RBAC is enforced server-side (`src/proxy.ts` +
      `authConfig.authorized()`), not just a hidden nav link. As an admin
      session, navigating to `/reviewer` similarly redirected back to
      `/admin`. Visiting `/login` again while already authenticated
      redirected straight to the user's own role home rather than showing
      the form.
- [x] **Valid reimbursement submission with a real receipt file.** Manually
      verified by Darshil (this environment's browser automation can't attach
      local files to a file input): attached a generated PDF receipt to a
      draft as `employee@cdf.org` and submitted it. The request moved out of
      Draft and appeared in the reviewer queue as `reviewer@cdf.org`,
      correctly showing Approve/Reject actions for a `submitted` request --
      confirming the upload, the storage write, and the draft-to-submitted
      transition all worked end-to-end against the real Supabase Storage
      bucket.
- [x] **Admin: view users.** `/admin` as `admin@cdf.org` lists all 4 seeded
      users with email, role, account status, and join date.
- [x] **Admin: change a user's role, with an audit trail entry.** Changed
      Evan Employee's role from `employee` to `reviewer`, then back. Each
      change was reflected correctly after a fresh page load, and both
      transitions appeared in the "Recent account activity" panel with the
      correct actor, target, and `employee -> reviewer` / `reviewer ->
      employee` detail. Caught and fixed a real bug during this test: the
      role `<select>` visually kept showing whichever option was last picked
      in the UI rather than the confirmed saved value, because React doesn't
      re-apply `defaultValue` to an already-mounted uncontrolled input. The
      underlying data and audit trail were correct the whole time (verified
      via a hard reload); this was a display-only bug, fixed by keying the
      `<select>` on the current role so it remounts after a save.
- [x] **Admin: activate / deactivate an account.** Deactivated Evan Employee
      -- status flipped to `inactive` and the action button switched to
      "Activate", both instantly (no bug here, unlike the role select above).
      Reactivated it back to `active`. Both actions appeared correctly in the
      audit trail.
- [x] **Admin cannot demote or deactivate themselves.** Verified by code
      review: `updateUserRole`/`setAccountStatus` both explicitly check
      `target.id === admin.id` and refuse before touching the database (no UI
      path exists to attempt this against your own row either, since the
      admin's own row renders a plain badge instead of the role/status
      controls).
- [x] **Backend file-type validation rejects a mismatched file.** Code
      review + logic trace: `sniffFileType()` reads the actual uploaded
      bytes' magic numbers (JPEG/PNG/PDF signatures) and compares against the
      declared `Content-Type`; a mismatch is rejected with "This file doesn't
      look like a valid JPEG, PNG, or PDF." before the file ever reaches
      Supabase Storage. Added specifically because the prior check only
      compared the client-declared MIME type against an allow-list, which
      doesn't defend against a spoofed `Content-Type` in a crafted request.
- [ ] Invalid amount (zero / negative) -- covered by `ExpenseRequestFormSchema`
      (zod, `positive()`), not re-exercised live this pass (was exercised in
      earlier development).
- [ ] Invalid / missing category -- covered by `z.enum(CATEGORIES)`.
- [ ] Duplicate submission prevented -- a draft can only be submitted once
      (status leaves `draft` on submit; the edit action explicitly refuses to
      touch a non-draft request), and the submit button disables itself while
      the action is pending to prevent an accidental double-click. Not
      stress-tested against a true multi-tab race (see `docs/reflection.md`
      for the disclosed tradeoff).
- [ ] Unauthorized reviewer action blocked at the API layer with a real
      unauthenticated HTTP request (401/403) -- verified by code review of
      `GET /api/requests` and `GET /api/notifications` (both return 401 with
      no session), and live-verified indirectly via the role-redirect tests
      above; not separately hit with a raw unauthenticated `curl`/`fetch`
      request this pass.
- [ ] Requester attempting to approve/pay their own request blocked --
      `approveRequest`/`rejectRequest`/`markRequestPaid` all check
      `existing.submitterId === user.id` and refuse (code review); no seeded
      reviewer-submitted request exists to exercise this live without
      creating one.
- [ ] Search and filtering by category/requester/date/keyword -- status
      filtering and URL-based filter state were exercised live (above);
      category/requester/date/keyword filters share the same `listRequests`
      implementation and code path but weren't each individually re-tested
      this pass.
- [ ] Pagination against a real second page -- the seeded dataset is small
      enough that most filtered views fit on one page; Previous/Next controls
      were reviewed by code (correct disabled state at the boundaries,
      `Math.max(1, ...)` page clamping) rather than clicked through a real
      second page.
- [ ] Data persistence across a redeploy -- implied by using Postgres rather
      than in-memory state; every scenario above was itself performed across
      multiple separate sessions/redeploys and each time picked up exactly
      where the previous session left the data, which is itself a persistence
      check, just not an isolated one.

## Post-launch feature additions (live-verified)

Added and live-tested against production after the initial submission-ready state:

- [x] **Login page UI cleanup.** Confirmed the seeded-logins hint is gone, the email
      field shows a generic `you@example.com` placeholder, and a "Create account" link
      is present.
- [x] **Re-seeded demo accounts.** Confirmed via the admin Users list and by actually
      signing in as `adam.brown@gmail.com` (admin) and the other reseeded accounts
      that the new names/emails are live and functional -- not just displayed.
- [x] **Self-signup end-to-end.** Submitted a real signup (Sarah Connor,
      sarah.connor@gmail.com), watched the password strength meter update live from
      "Very weak" to "Strong" as rule checks were satisfied, and confirmed the
      "Account creation request has been sent to the admin..." confirmation box.
      Logged in as admin, saw the request under the Account Requests tab (with an
      unread-style count badge), clicked Accept, and confirmed the user count went
      from 4 to 5 and the new user appeared in the Users tab as an active `employee`.
      Signed in as the new account with its real password and landed on `/employee`
      correctly.
- [x] **Deactivated-account error message.** Deactivated the test account from admin,
      then attempted to sign in as that account: got "Account Deactivated, Contact
      System Admin." instead of the generic invalid-credentials message. Reactivated
      the account afterward and confirmed normal sign-in resumed. Verified via the
      audit trail panel that both the deactivate and reactivate actions were recorded.
- [x] Confirmed no new Supabase security advisories beyond the existing "RLS enabled,
      no policy" INFO-level items (expected; app-layer auth is the real boundary, not
      Postgres RLS), and the new `account_requests` table follows the same pattern.

## Approach

Manual pass performed directly against the production Vercel deployment and
the live Supabase database via browser automation (Claude in Chrome) and,
for file-upload-specific steps, directly by Darshil. Automated tests were not
added -- `prisma generate` cannot run in the sandboxed build environment used
to develop this project (see the note below), which made a fast local
test-and-iterate loop impractical within the time available; manual testing
against the real deployment was prioritized over building a test harness
against an environment that couldn't run locally. This is disclosed as a
known limitation in `docs/reflection.md` and the README rather than claimed
as covered.

## Note on the development environment

This project was built in a network-restricted sandbox that cannot reach
`binaries.prisma.sh`, so `prisma generate` could never be run or verified
locally there. Vercel's build environment (unrestricted network access) was
used as the real build/test environment throughout -- every commit in this
repository's history was verified via a real Vercel deployment (READY status,
build logs checked for errors) before being treated as done, which is also
why the commit history includes a couple of small `Fix TS build error: ...`
follow-up commits rather than every commit building clean on the first try.
