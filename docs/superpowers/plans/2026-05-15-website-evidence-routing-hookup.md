# Website Evidence Routing Hookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect rich website scan context to Ofsted Readiness evidence areas without copying or moving school files.

**Architecture:** Add a pure website evidence router that scores pages/documents using source URL, discovered-on URL, page title, link text, filename, headings and statutory requirement rules. Feed those routed candidates into the existing website scan metadata so Grove House can show an explainable inventory before Phase 2 quality assessment creates findings/tasks.

**Tech Stack:** Next.js 16, TypeScript, Vitest, existing website compliance requirements, existing Ofsted framework type IDs.

---

### Task 1: Evidence Router

**Files:**
- Create: `apps/platform/src/lib/website-compliance/evidence-routing.ts`
- Test: `apps/platform/src/lib/website-compliance/evidence-routing.test.ts`

- [ ] Write failing tests for safeguarding, SEND, curriculum, attendance and trust-hosted policies.
- [ ] Implement `routeWebsiteEvidenceItem` and `routeWebsiteEvidenceItems`.
- [ ] Ensure routes include source URL, found-on URL, owner, confidence, signals, requirement key and Ofsted area.
- [ ] Run `npx vitest run apps/platform/src/lib/website-compliance/evidence-routing.test.ts`.

### Task 2: Phase 1 Scan Metadata Hook

**Files:**
- Modify: `apps/platform/src/lib/website-compliance/phase1-scraper.ts`

- [ ] Route stored pages and documents after crawl storage.
- [ ] Save route summary into `website_scan_sessions.progress.evidenceRouting`.
- [ ] Do not write to Drive, move files, delete files, or require Phase 2 to run.
- [ ] Keep existing API response shape backwards-compatible.

### Task 3: Validation

**Files:**
- Test: router and existing crawl-plan tests.

- [ ] Run the focused Vitest files.
- [ ] Check TypeScript syntax for touched files.
- [ ] Summarise exactly what is hooked up and what remains Phase 2 work.

### Local-Only Constraint

No commits, no pushes, and no customer Drive mutations. The scanner stores only Schoolgle metadata and source links.
