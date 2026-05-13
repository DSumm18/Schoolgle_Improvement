# Phase-Aware Trust Assessor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Trust Assessor phase-aware so mixed MATs show primary, secondary and special-school analysis only when those phases exist, while LA primary views remain clean.

**Architecture:** Extend the public-data report API with KS4 and phase summaries from existing DfE warehouse tables. Keep existing primary components intact, and add conditional phase tabs/sections that filter the same report data without hardcoding any trust or school.

**Tech Stack:** Next.js App Router, Supabase, TypeScript/React, existing Trust Assessor page and public-data API.

---

### Task 1: Extend public report API data

**Files:**
- Modify: `apps/platform/src/app/api/trust-analysis/public-data-report/route.ts`

- [ ] Add KS4 row types and latest-secondary helper.
- [ ] Fetch `ks4_results` for current report URNs.
- [ ] Add `phase_summary`, `secondaryBenchmarks`, and `latest.ks4_*` fields to each school.
- [ ] Keep existing LA primary virtual-school behaviour unchanged.

### Task 2: Add phase-aware UI sections

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`

- [ ] Add phase helper functions that classify primary, secondary and special schools from profile/type/phase.
- [ ] Add conditional phase tabs for public-data reports.
- [ ] Render Primary using the existing public DfE report component.
- [ ] Render Secondary and Special with compact source-labelled tables/cards.
- [ ] Hide tabs with zero schools.

### Task 3: Verify

**Commands:**
- `cd apps/platform && npm run build`
- Data readback for Carlton, Bradford/Rochdale/Leeds shape.

**Acceptance:**
- Carlton shows primary, secondary and special groupings.
- Bradford/Rochdale/Leeds primary LA views show no secondary/special UI if none are present.
- No bespoke Carlton hardcoding.
