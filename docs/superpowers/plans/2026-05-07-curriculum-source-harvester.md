# Curriculum Source Harvester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first reusable curriculum-source layer so Assessment Support can consume curriculum evidence from existing website scan output with source labels, confidence and review status.

**Architecture:** Add a pure `curriculum-harvester` library that classifies website pages/documents into curriculum candidates, extracts subject/year/term/topic signals, and returns a neutral Schoolgle curriculum map. Add an API route that reads the existing website scan tables and returns the harvested map. Add a small UI panel in Assessment Support showing whether an approved/needs-review curriculum map exists.

**Tech Stack:** Next.js App Router, Supabase service-role reads behind protected routes, TypeScript pure functions, Vitest.

---

### Task 1: Pure harvester logic

**Files:**
- Create: `apps/platform/src/lib/assessment-creator/curriculum-harvester.ts`
- Create: `apps/platform/src/lib/assessment-creator/__tests__/curriculum-harvester.test.ts`

- [ ] Add source row types for `website_scraped_pages` and `website_scraped_documents`.
- [ ] Add detectors for curriculum keywords, subject names, year groups, terms and source confidence.
- [ ] Add `harvestCurriculumSources(input)` returning sources, coverage summary and recommended next action.
- [ ] Test Grove House examples: maths page, Year 6 maths long-term PDF, Year 6 Autumn 2 MTP PDF, and a non-curriculum contact page.

### Task 2: API route

**Files:**
- Create: `apps/platform/src/app/api/assessment-creator/curriculum-sources/route.ts`

- [ ] Read the latest `website_scan_sessions` row for the authenticated organisation.
- [ ] Read related `website_scraped_pages` and `website_scraped_documents` rows.
- [ ] Call `harvestCurriculumSources` and return source-labelled candidates.
- [ ] Return an empty-but-useful response if the school has no website scan yet.

### Task 3: Assessment Support UI panel

**Files:**
- Create: `apps/platform/src/components/assessment-creator/CurriculumSourcePanel.tsx`
- Modify: `apps/platform/src/components/assessment-creator/AssessmentCreatorShell.tsx`

- [ ] Fetch `/api/assessment-creator/curriculum-sources` using the current session token.
- [ ] Show scan status, source count, confidence and next action.
- [ ] Show top curriculum sources with source URL, source type, subject/year/term signals and review status.
- [ ] Keep teacher-facing wording clear: this is not approved until a curriculum lead reviews it.

### Task 4: Validation

**Files:**
- Existing tests plus build command.

- [ ] Run `npx vitest run src/lib/assessment-creator/__tests__/curriculum-harvester.test.ts` from `apps/platform`.
- [ ] Run `npm run build` from `apps/platform`.
- [ ] Check Assessment Support visually in the browser if the dev server is running.
