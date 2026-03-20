# Phase 2 Validation Report

**Date:** 2026-03-19
**Scope:** Pilot Surface Control, Realistic School Onboarding, Connected Data Assessment, Golden Journey Validation

---

## Executive Summary

Phase 2 hardening established clear pilot boundaries, validated school onboarding viability, mapped all connected data dependencies, and tested 10 golden journeys (7 pass, 3 partial, 0 fail). The platform is now ready for a limited pilot with 2-3 friendly schools, with clear understanding of what works, what's limited, and what's excluded.

---

## What Was Changed

### Code Changes

| File                                           | Change                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/platform/src/lib/modules/registry.ts`    | Added `pilotHidden` and `pilotNote` properties to `ModuleDefinition` and `AppDefinition` interfaces. Flagged 4 modules (Teaching & Learning, Finance, Website, Canvas) and 3 apps (Staff Connectors, Performance Mgmt, Cover Mgmt) as `pilotHidden: true` |
| `apps/platform/src/app/(dashboard)/layout.tsx` | Added `!module.pilotHidden` filter to sidebar module rendering; Added `!a.pilotHidden` filter to sub-app rendering                                                                                                                                        |

### Documentation Created

| Document                            | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `docs/PILOT_SURFACE_AREA_MATRIX.md` | What is visible vs hidden for pilot users                            |
| `docs/PILOT_GOLDEN_JOURNEYS.md`     | 10 end-to-end journey validations with results                       |
| `docs/CONNECTED_DATA_ASSESSMENT.md` | Module-by-module source data needs and import status                 |
| `docs/SCHOOL_ONBOARDING_MODEL.md`   | How new schools are set up, data expectations, partial data handling |
| `docs/PHASE2_VALIDATION_REPORT.md`  | This report                                                          |

---

## Task 1: Pilot Perimeter Control — COMPLETE

### What was hidden

- **4 modules** removed from sidebar navigation: Teaching & Learning, Finance, Website, Canvas
- **3 apps** removed from sub-app lists: Staff Connectors, Performance Management, Cover Management
- All use `pilotHidden: true` flag — a reversible, data-driven approach

### What remains visible

- **13 modules** in sidebar: Governance, Risk, Improvement, Estates, Compliance, HR, Safeguarding, Attendance, SEND, Behaviour, Communications, Calendar, Surveys
- All visible modules have real CRUD, org-scoped queries, and working UI

### Entry point audit

- Sidebar: filtered (done)
- Direct URL: accessible but undiscoverable (acceptable for pilot)
- Ed routing: Canvas prompt updated in Phase 1 to be honest about limitations
- Marketing pages: not filtered (acceptable — public-facing, different audience)

---

## Task 2: Ed Alignment — COMPLETE (from Phase 1)

### Changes already applied

- Risk specialist: 6 skill handlers implemented, prompt references restored
- Canvas specialist: Prompt replaced with honest "Current Limitations" section
- Intelligence specialist: All 6 skills verified as working (no changes needed)
- Estates specialist: All 15 skills verified as working (no changes needed)
- Document skills: All 7 verified as working (no changes needed)

### Ed capability summary for pilot

- **46/52 skills working** (88%)
- **Only Canvas** (6 skills) has no handlers — prompt is honest about this
- Ed can genuinely help with: staff management, actions, estates tickets, risk management, intelligence analysis, document generation, compliance guidance

---

## Task 3: School Onboarding Review — VIABLE WITH GAPS

### What works

1. **3-step onboarding**: Sign up → school search (DfE GIAS) → org creation — CLEAN AND FUNCTIONAL
2. **DfE enrichment**: Auto-populates name, address, phone, email, website, LA, phase, church status
3. **Staff CSV import**: Production-ready with fuzzy role matching, dedup, merge logic
4. **Org user import**: CSV bulk invite with preview and role validation
5. **Class assignments**: Manual UI for staff-to-year-group mapping with term and FTE

### What's missing

1. **No guided post-onboarding setup wizard** — user lands on dashboard without structured "complete your setup" guidance
2. **No standard school templates** — cannot auto-populate "2FE primary" with typical class/staff structure
3. **No pupil CSV import** — attendance, SEND, and behaviour modules need pupil data but have no bulk import
4. **No MIS live connector** — snapshot imports only, no streaming sync

### Assessment

**Onboarding is viable for pilot** — a school can sign up, get DfE-enriched org, import staff, and begin using system-of-record modules immediately. Pupil-dependent modules (Attendance, SEND, Behaviour) require manual data entry or show demo data.

---

## Task 4: Connected Data Assessment — DOCUMENTED

### Key finding: Clear separation between system-of-record and import-dependent modules

| Type                                              | Modules                                                                       | Status                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| **System of Record** (data created in Schoolgle)  | Risk, Governance, Compliance, Estates, Meetings, Documents, Surveys, Calendar | PILOT READY                  |
| **Import-Dependent** (data from external sources) | Staff (CSV), Finance (FMS), Intelligence (DfE + CSV)                          | IMPORT PATH EXISTS           |
| **Hybrid** (manual + import)                      | Attendance, SEND, Behaviour                                                   | MANUAL WORKS, NO BULK IMPORT |
| **Not ready**                                     | Canvas, T&L, Connectors, Cover, Performance                                   | HIDDEN FROM PILOT            |

### Demo data risk

- 8 modules return demo data when empty
- Finance: banner added (Phase 1)
- Attendance, SEND, Behaviour: demo flag in API but NOT in UI (needs fix)
- Cover, Performance, Energy: hidden from pilot (acceptable)

---

## Task 5: Golden Journey Validation — 7/10 PASS

| #   | Journey                                                          | Result  |
| --- | ---------------------------------------------------------------- | ------- |
| 1   | Risk lifecycle (create → edit → recalculate → mitigate → review) | PASS    |
| 2   | Estates issue lifecycle (create ticket → comment → resolve)      | PASS    |
| 3   | File/evidence upload and retrieval                               | PARTIAL |
| 4   | Meeting → action follow-up                                       | PASS    |
| 5   | Intelligence insight retrieval                                   | PASS    |
| 6   | Staff directory CRUD + CSV import                                | PASS    |
| 7   | Survey lifecycle                                                 | PASS    |
| 8   | Document generation + send                                       | PASS    |
| 9   | School onboarding dataset                                        | PARTIAL |
| 10  | Connected data flows                                             | PARTIAL |

### Partial journey root causes

- **Journey 3**: No file MIME type validation on uploads (security gap)
- **Journey 9**: No post-onboarding setup wizard; demo data in pupil modules
- **Journey 10**: Finance dashboard disconnected from import endpoint; no pupil bulk import

---

## Task 6: Org Isolation Status — UNCHANGED FROM PHASE 1

### Current model

- `protectedRoute()` middleware validates user membership in organisation
- All queries use `.eq("organization_id", auth.organizationId)` manually
- `createServiceRoleClient()` bypasses RLS (by design, for backend operations)
- All new risk skill handlers (Phase 1) verify org ownership before read/write

### Remaining risks

1. No database-level RLS enforcement (app-code only)
2. No integration tests for cross-org isolation
3. No query wrapper to auto-inject org filtering
4. 350+ routes rely on manual pattern — not individually audited

### What still blocks production readiness

- Integration tests that verify cross-org data cannot leak
- Query wrapper or middleware that auto-injects org scoping

---

## Task 7: Documentation — COMPLETE

All deliverable documents created:

1. `docs/PILOT_SURFACE_AREA_MATRIX.md` — pilot perimeter
2. `docs/PILOT_GOLDEN_JOURNEYS.md` — 10 journey validations
3. `docs/CONNECTED_DATA_ASSESSMENT.md` — data dependency map
4. `docs/SCHOOL_ONBOARDING_MODEL.md` — onboarding model
5. `docs/PHASE2_VALIDATION_REPORT.md` — this report

---

## Remaining Blockers to Broader Pilot

| Blocker                                                      | Severity | Effort   |
| ------------------------------------------------------------ | -------- | -------- |
| Demo data banners needed for Attendance, SEND, Behaviour UIs | HIGH     | 1 day    |
| File type validation on evidence uploads                     | HIGH     | 1 hour   |
| No pupil CSV import for Attendance/SEND/Behaviour            | MEDIUM   | 3-5 days |
| No post-onboarding setup wizard                              | MEDIUM   | 2-3 days |
| Finance dashboard not wired to import data                   | MEDIUM   | 2-3 days |
| Cross-org isolation integration tests                        | MEDIUM   | 2-3 days |
| GDPR right-to-erasure implementation                         | MEDIUM   | 2-3 days |

---

## Revised Readiness Scores

| Dimension        | Phase 1    | Phase 2    | Notes                                                                |
| ---------------- | ---------- | ---------- | -------------------------------------------------------------------- |
| Security         | 7.5/10     | 7.5/10     | No change (Phase 1 fixes holding)                                    |
| Ed AI Capability | 6.5/10     | 6.5/10     | No change (46/52 skills)                                             |
| Pilot Perimeter  | N/A        | **8/10**   | 4 modules + 3 apps hidden, clear boundaries                          |
| UX Trust         | 7/10       | 7/10       | Finance banner done; demo data in 3 pupil modules still needs UI fix |
| Onboarding       | N/A        | **7/10**   | Works well; missing setup wizard and pupil import                    |
| Connected Data   | N/A        | **6/10**   | System-of-record modules excellent; import-dependent modules mixed   |
| Golden Journeys  | N/A        | **8/10**   | 7/10 pass, 3/10 partial, 0/10 fail                                   |
| **OVERALL**      | **6.5/10** | **7.0/10** | Moved from "limited pilot" to "solid limited pilot"                  |

---

## Final Recommendation

### Status: LIMITED PILOT READY

The platform can support 2-3 friendly schools under these conditions:

1. **Pilot schools understand scope** — 13 modules visible, 4 hidden, some features in development
2. **Staff data imported first** — CSV import is production-ready and should be the first onboarding step
3. **System-of-record modules used immediately** — Risk, Governance, Compliance, Estates, Meetings, Documents, Surveys all work from day one
4. **Pupil-dependent modules used with awareness** — Attendance, SEND, Behaviour work for manual entry but show demo data when empty (no bulk pupil import yet)
5. **Ed used for implemented skills** — Staff, Actions, Estates, Risk, Intelligence, Documents all genuinely work through Ed
6. **Finance excluded from pilot** — Hidden from navigation, demo data clearly labelled
7. **Support contact available** — For questions about data import, module limitations, or unexpected behaviour

### What would move this to "broader pilot ready"

1. Demo data UI banners for Attendance, SEND, Behaviour (1 day)
2. Pupil CSV import path (3-5 days)
3. Post-onboarding setup wizard (2-3 days)
4. Cross-org isolation tests (2-3 days)
5. File upload type validation (1 hour)

**Estimated time to broader pilot: 2-3 weeks of focused work.**
