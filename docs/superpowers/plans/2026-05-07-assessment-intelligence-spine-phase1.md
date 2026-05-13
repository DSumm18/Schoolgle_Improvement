# Assessment Intelligence Spine Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the source-labelled assessment intelligence foundation: canonical source batches, pupil-level assessment events, and pure logic for labels, level normalisation, manual snapshot event creation, and same-pupil Combined RWM+.

**Architecture:** Add a focused `assessment-intelligence` library that sits between manual snapshots, Assessment Creator, CTF/MIS imports, Trust Assessor and Ofsted Readiness. Create new canonical tables rather than mutating ambiguous existing tables first; later adapters can publish from existing flows into this spine.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Supabase SQL migrations, HMAC-SHA256 pseudonymised pupil identity.

---

## Files

- Create `apps/platform/src/lib/assessment-intelligence/types.ts` for shared domain types.
- Create `apps/platform/src/lib/assessment-intelligence/assessment-events.ts` for pure functions.
- Create `apps/platform/src/lib/assessment-intelligence/assessment-events.test.ts` for TDD coverage.
- Create `apps/platform/supabase/migrations/20260507_assessment_intelligence_spine.sql` for source batches and pupil events.
- Update `docs/modules/school-improvement/GROVE_HOUSE_DATA_PIPELINE_REFERENCE.md` only if implementation reveals a terminology correction.

## Task 1: Pure Assessment Event Logic

- [ ] Write failing tests for:
  - level normalisation;
  - source-label generation;
  - same-pupil Combined RWM+;
  - manual snapshot event payload creation.
- [ ] Run `cd apps/platform; npx vitest run src/lib/assessment-intelligence/assessment-events.test.ts` and verify failure because files/functions do not exist.
- [ ] Implement `types.ts` and `assessment-events.ts`.
- [ ] Re-run the focused Vitest file and verify pass.

## Task 2: Canonical Schema Migration

- [ ] Add `assessment_source_batches`.
- [ ] Add `pupil_assessment_events`.
- [ ] Include indexes for org, school URN, pupil hash, source batch, subject/class/period.
- [ ] Include validation checks for source kind, validation tier, moderation status and confidence.
- [ ] Include RLS with service-role write access and authenticated scoped-read placeholder policies.
- [ ] Verify SQL by reviewing for idempotent `create table if not exists` and `create index if not exists`.

## Task 3: Verification

- [ ] Run focused Vitest tests.
- [ ] Run `cd apps/platform; npm run build`.
- [ ] Report typecheck separately if repo-wide errors remain unrelated.

