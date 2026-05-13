# Ofsted Readiness Intelligence Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Ofsted Readiness to Schoolgle's existing Trust Assessor, school intelligence, evidence, policy, and task ecosystem without replacing the current app.

**Architecture:** Keep Ofsted Readiness as the inspection workspace. Add thin, scoped glue that reads validated intelligence, creates persistent findings only when action is needed, and routes approved work into the existing unified task/actions system.

**Tech Stack:** Next.js 16 App Router, Supabase service-role routes via `protectedRoute`, Vitest for pure helpers, existing Schoolgle Connector and `actions` task tables.

---

## Current Map

**Already exists:**
- Ofsted page and tabs at `apps/platform/src/app/(dashboard)/dashboard/ofsted-readiness/page.tsx`.
- Drive connection panel, evidence checklist, website scan, document checker, framework self-view, safeguarding panel, findings panel.
- Ofsted APIs under `apps/platform/src/app/api/ofsted/*`.
- Persistent findings loop in `apps/platform/src/lib/ofsted-readiness/findings.ts`, `apps/platform/src/components/ofsted/OfstedFindingsPanel.tsx`, and `apps/platform/supabase/migrations/20260427_ofsted_findings_loop.sql`.
- Finding assignment creates `actions` records with `module = "ofsted-readiness"` and routing metadata for dashboard task surfacing.
- Trust Assessor data is scoped by org URNs in `apps/platform/src/app/api/trust-analysis/route.ts`; Combined RWM+ uses `subject = 'Reading, writing and maths'`, `breakdown_topic = 'All pupils'`, `breakdown = 'Total'`.
- School Intelligence stores DfE, cross-module, EEF, and suggested action outputs in `school_intelligence_analyses`.
- Schoolgle Connector target exists in `apps/platform/src/lib/schoolgle-connector.ts` and `school_data_connections`.

**Needs finishing:**
- Ofsted does not yet show a concise inspection intelligence brief from Trust Assessor / School Improvement data.
- Ofsted Drive UI still encourages public shared links; the secure target is the Schoolgle Connector folder approach.
- Ofsted scans should converge on `school_data_connections` / `Schoolgle/Ofsted Readiness` rather than a separate public-link-only `ofsted_drive_connections` path.
- Findings need more sources beyond website scans: DfE/intelligence concerns, data quality warnings, document age, and policy lifecycle events.
- Completion verification and recurring review logic are still early.

## Target Workflow

1. Leader connects the Schoolgle Connector using OAuth and the dedicated `Schoolgle` folder.
2. The connector creates or uses `Schoolgle/Ofsted Readiness`, `Schoolgle/Trust Assessor`, `Schoolgle/MIS Exports`, `Schoolgle/Policies`, and related folders.
3. Ofsted Readiness scans only approved connector folders plus the school website.
4. Ofsted overview shows:
   - school self-view from `ofsted_assessments`;
   - AI/evidence view from evidence matches, website scans, findings, and inspection intelligence;
   - Trust Assessor / DfE context with explicit data tier labels.
5. Scanner outputs become `ofsted_findings`, not isolated reports.
6. Headteacher/admin reviews findings, assigns approved actions, and tasks appear via `/api/tasks`.
7. Completion moves the finding into verification, then a re-scan or evidence review marks it verified or reopens it.
8. Policy/document expiry creates recurring findings and tasks through the policy/compliance lifecycle.

## Data Security Rules

- Do not add broad Drive scanning.
- Do not require "Anyone with the link" for Ofsted evidence.
- Use `auth.organizationId`; never accept caller-provided org IDs for data access.
- Store explicit values, source labels, confidence, and data tier.
- Never average Reading, Writing and Maths to create Combined RWM+; it means pupils meeting expected+ in all three together.

## Task 1: Add Inspection Intelligence Brief

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/intelligence-brief.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/intelligence-brief.test.ts`
- Create: `apps/platform/src/app/api/ofsted/intelligence-brief/route.ts`
- Create: `apps/platform/src/components/ofsted/OfstedIntelligenceBrief.tsx`
- Modify: `apps/platform/src/components/ofsted/index.ts`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/ofsted-readiness/page.tsx`

- [ ] Write failing tests for the pure brief builder.
- [ ] Build the pure brief helper with explicit source labels and RWM+ wording.
- [ ] Add protected API that reads only the authenticated org and direct child orgs.
- [ ] Add compact overview UI for context, concerns, warnings, and suggested inspection questions.
- [ ] Add the panel to the Ofsted overview above findings.
- [ ] Run targeted Vitest and type/build checks.

## Task 2: Retire Public Link UX For Ofsted

**Files:**
- Modify: `apps/platform/src/components/ofsted/DriveConnectionPanel.tsx`
- Modify: `apps/platform/src/app/api/ofsted/connections/link/route.ts`
- Test: add or extend route/helper test if a test harness exists for route-level API behavior.

- [ ] Replace paste-link copy with a Schoolgle Connector CTA.
- [ ] Return a clear `400` from the Ofsted public-link route explaining the secure connector path.
- [ ] Keep existing active connections visible so current users are not stranded.
- [ ] Verify the page does not instruct schools to make folders public.

## Task 3: Scan From Schoolgle Connector Folder

**Files:**
- Modify: `apps/platform/src/app/api/ofsted/connections/route.ts`
- Modify: `apps/platform/src/app/api/ofsted/connections/scan/route.ts`
- Reuse: `apps/platform/src/lib/google-oauth-tokens.ts`
- Reuse: `apps/platform/src/lib/schoolgle-connector.ts`

- [ ] Read `school_data_connections` first, falling back only to existing Ofsted connections for migration.
- [ ] Resolve the `Ofsted Readiness` child folder inside the approved `Schoolgle` folder.
- [ ] Use OAuth access tokens for Drive listing and downloads.
- [ ] Reject scans outside the connector folder boundary.

## Task 4: Convert Intelligence Concerns Into Findings

**Files:**
- Modify: `apps/platform/src/lib/ofsted-readiness/findings.ts`
- Create tests in `apps/platform/src/lib/ofsted-readiness/*`
- Modify or create API under `apps/platform/src/app/api/ofsted/findings/*`

- [ ] Add finding source type for `school_intelligence`.
- [ ] Map DfE/intelligence concerns to `quality_gap`, `red_flag`, or `information_only`.
- [ ] Preserve source metadata: DfE year, URN, data tier, subject, subgroup, and confidence.
- [ ] Avoid generating tasks automatically; require leader assignment.

## Task 5: Verification And Recurrence

**Files:**
- Modify: `apps/platform/src/app/api/tasks/route.ts`
- Modify: `apps/platform/src/app/api/ofsted/findings/*`
- Modify: `apps/platform/src/components/ofsted/OfstedFindingsPanel.tsx`

- [ ] When an Ofsted task is completed, mark the source finding `verification_required`.
- [ ] Add a re-check action for website/document findings.
- [ ] Add next-review dates for policy/document findings.
- [ ] Surface verification-required tasks on dashboard via existing `/api/tasks`.

