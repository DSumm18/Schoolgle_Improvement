# Estates Compliance Demo Readiness — 11 July 2026

## Outcome

The compliance-check lifecycle now persists an auditable occurrence, supports notes and evidence, records the responsible individual/team, and automatically creates a linked helpdesk ticket when a check fails.

## Corrected Gaps

- Evidence upload failures now stop the completion instead of silently saving a record without its files.
- Failed checks use an explicit `failed` state and red RAG status.
- A failed check automatically creates a high/critical helpdesk ticket linked to the exact completion occurrence.
- Uploaded check evidence is linked to the generated ticket and retrieved on the ticket detail page.
- Ticket camera captures are uploaded to private Supabase Storage and recorded in `estates_evidence`; browser data URLs are no longer treated as persistent attachments.
- Check occurrences and tickets support assignment to an individual and/or a team.
- Repeated completed/failed occurrences no longer overwrite terminal history rows.
- Assignment changes are written to the helpdesk activity timeline.

## Verification Evidence

- Live migration `estates_compliance_failure_workflow` applied successfully to Supabase project `Schoolgle-Improvement`.
- Rollback database scenario passed for failed completion, automatic ticket linkage, individual assignment, team fields, and occurrence linkage.
- Private `estates-images` upload, signed retrieval (HTTP 200), and cleanup passed against live Supabase Storage.
- Targeted Vitest suite: 38 tests passed across statutory completions, estates tasks, and assets.
- Targeted ESLint: no errors in changed files; existing style warnings remain in legacy estates pages.
- Changed-file TypeScript check: no errors in the changed estates files. The repository-wide typecheck still has unrelated pre-existing errors.
- Playwright smoke test: route compiled and returned HTTP 200 with no console errors, request failures, or Next.js error overlay. Unauthenticated redirect reached `/login` after the existing auth safety timeout.

## Remaining Demo Checks

- Run one final authenticated browser walkthrough using the intended demo account: pass check, fail check, upload image/PDF, inspect generated ticket, change person/team assignment, comment, resolve, and revisit both histories.
- The unauthenticated dashboard currently stays visually blank until the auth safety timeout redirects to `/login`; authenticated demo users are not affected, but the login boundary should be tightened separately.
- Supabase advisors report existing project-wide RLS/performance findings outside this estates change. No new advisor finding was identified for the estates tables changed here.

