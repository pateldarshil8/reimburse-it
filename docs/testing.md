# Testing

Status: placeholder as of Day 1 (foundation). Will be filled in during Day 2/3 as the
workflow being tested actually exists to test.

This document will record the manual test pass against the scenarios called out in
`problem_statement.md` ("Testing Expectations" section), plus any automated tests added
if time allows within the 3-day compressed schedule.

## Planned manual test scenarios (per the official brief)

- [ ] Valid reimbursement submission
- [ ] Missing required information (title, amount, date, category, description)
- [ ] Missing receipt
- [ ] Invalid amount (zero / negative)
- [ ] Invalid category
- [ ] Unsupported receipt file type rejected server-side (not just by file extension)
- [ ] Duplicate submission prevented
- [ ] Reviewer approval
- [ ] Reviewer rejection with required reason
- [ ] Approved request marked as Paid
- [ ] Unauthorized reviewer action blocked (wrong role, returns 401/403)
- [ ] Requester attempting reviewer-only functionality blocked
- [ ] Requester attempting to approve or pay their own request blocked
- [ ] Search and filtering (status, category, requester, date, keyword)
- [ ] Pagination (correct page metadata, filters persist across pages)
- [ ] Dashboard totals match underlying data (requested/approved/pending/paid)
- [ ] Receipt access restricted to the request's submitter and reviewers/admins only
- [ ] Data persists across a refresh / redeploy (not held only in browser state)

## Approach

Given the 3-day compressed timeline, the primary testing method is a structured manual
pass through the scenarios above against the live Vercel deployment, using the seeded
demonstration accounts. Automated tests (see `PROJECT_PLAN.md` fallback order) are a
should-have added only if the core workflow, receipt handling, and required docs are
already complete — they are not a substitute for the manual pass above, which is kept
regardless of what else slips.

Results will be recorded here as: scenario, steps taken, expected result, actual result,
pass/fail, and any follow-up fix.
