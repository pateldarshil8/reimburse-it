# Reflection

Status: placeholder as of Day 1 (foundation). Will be filled in on Day 3 once the build
is complete, per the brief's requirement that this cover tradeoffs made and tools used
across the whole project, not just the setup phase.

## What I built

_To be completed on Day 3: summary of the final feature set relative to the official
Tier 1 checklist._

## Key tradeoffs

_To be completed: the schedule compression (5-day brief → 3 personal days), and any
Tier 1 items that ended up cut, reduced in scope, or deferred despite being required —
tracked live in `PROJECT_PLAN.md`'s gap analysis and fallback-cut order as the build
progresses._

## AI tools and external resources used

This project was built with Claude (Anthropic) as a development assistant across
planning, scaffolding, and implementation, inside a Cowork session with direct file and
shell access. Per the brief's AI-use disclosure requirement:

- Claude was used to scaffold the Next.js/Prisma/Auth.js/Supabase architecture, write
  application code, resolve build/tooling issues (e.g. Prisma 7's driver-adapter
  architecture, Next.js 16's `proxy.ts` convention), and draft this documentation set.
- All architectural decisions (stack choice, data model, status model, scope cuts) were
  reviewed and directed by me, not auto-accepted from suggestions.
- No part of the application logic, schema, or seeded data was copied from an existing
  CDF or third-party hackathon solution; the brief was read directly from CDF's provided
  `problem_statement.md`, `planning.md`, and `README.md`.
- Standard open-source libraries only (Next.js, Prisma, Auth.js, Tailwind, Supabase JS
  client); no paid templates.

_To be expanded on Day 3 with specifics on which parts of Day 2/3 code required the most
manual correction or verification._

## What I'd improve next

_To be completed on Day 3: notifications UI, admin screen depth, automated test
coverage, and any other should-have items, depending on what the fallback-cut order in
`PROJECT_PLAN.md` ends up dropping._
