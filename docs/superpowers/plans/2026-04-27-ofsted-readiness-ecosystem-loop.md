# Ofsted Readiness Ecosystem Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production slice of the Ofsted readiness loop: persistent findings created from expert scan results, ready to become headteacher-approved tasks in the existing unified task ecosystem.

**Architecture:** Add a persistent `ofsted_findings` table as the audit layer beneath tasks. Website and evidence scans create or update findings; approved tasks continue to live in `actions` / `compliance_tasks` and surface through existing `/api/tasks`.

**Tech Stack:** Next.js API routes, Supabase/Postgres migrations, TypeScript pure helper functions, Vitest focused unit tests.

---

## Files

- Create: `apps/platform/src/lib/ofsted-readiness/findings.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/findings.test.ts`
- Create: `apps/platform/src/app/api/ofsted/findings/route.ts`
- Create: `apps/platform/supabase/migrations/20260427_ofsted_findings_loop.sql`
- Modify: `apps/platform/src/lib/website-compliance/phase2-assessor.ts`
- Modify: `apps/platform/src/app/api/tasks/route.ts`
- Modify: `apps/platform/src/lib/tasks/types.ts`

## Task 1: Pure Finding Classification

- [ ] Write failing tests for converting website scan assessments into Ofsted finding drafts.
- [ ] Implement `buildWebsiteFindingDraft`.
- [ ] Run `npx vitest run apps/platform/src/lib/ofsted-readiness/findings.test.ts`.

## Task 2: Database Foundation

- [ ] Add `ofsted_findings` table for persistent issue lifecycle.
- [ ] Add `ofsted_finding_events` table for audit trail.
- [ ] Add source routing columns to `actions` so tasks can open the originating finding/module.

## Task 3: Findings API

- [ ] Add `GET /api/ofsted/findings` with filters for status, severity, source, and assigned task.
- [ ] Add `POST /api/ofsted/findings` for creating/upserting scan-generated findings.
- [ ] Ensure all organization scoping comes from auth, not request body.

## Task 4: Website Scan Integration

- [ ] Import the finding helper into `phase2-assessor.ts`.
- [ ] After website assessments are stored, upsert findings for not found, outdated, red-flagged, weak, or suggested-improvement results.
- [ ] Do not auto-assign staff tasks yet; keep findings as headteacher-reviewable records.

## Task 5: Unified Task Metadata

- [ ] Extend task types with route/source metadata.
- [ ] Extend `/api/tasks` mapping so Ofsted/generated tasks can carry `route_path`, `source_record_id`, and `created_from_finding_id`.

## Task 6: Validation

- [ ] Run focused Vitest tests for the finding helper.
- [ ] Run a static import check by typechecking touched files where practical.
- [ ] Summarise any existing unrelated type/build failures rather than fixing unrelated work.

