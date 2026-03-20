# Corrected Pilot Readiness Verdict

**Date:** 2026-03-19
**Phase:** Post-operational validation of connected data architecture
**Standard:** Not "does the code exist?" but "can a school use it, understand it, and trust it?"

---

## Executive Summary

Schoolgle has **12 data ingestion pipelines** at the backend level. Of these, **6 are operationally usable through the UI today**, **1 more is usable if unhidden from pilot navigation**, and **5 have strong backends but need UI wiring to be accessible to non-technical users**.

The platform can onboard a real school with realistic data. The experience ranges from excellent (pupil assessments, staff import) to frustrating (pupil import with no upload page, Drive connection with no import actions). With implementation partner support, all import paths work. For fully self-service onboarding, 2-3 UI improvements would close the gap.

---

## What Connected Data Paths Are Architecturally Real

All 12 pipelines exist in code with real API endpoints, real validation, real database operations, and real error handling:

| #   | Pipeline                 | Backend Maturity                                                        |
| --- | ------------------------ | ----------------------------------------------------------------------- |
| 1   | Staff CSV Import         | Production-grade (Papa Parse, 22+ fuzzy mappings, dedup)                |
| 2   | Pupil CSV Import         | Production-grade (Papa Parse, DfE validation, upsert)                   |
| 3   | Google Drive Connection  | Production-grade (real API calls, folder scanning, file preview)        |
| 4   | Canvas Smart Ingest      | Production-grade (40+ fingerprints, source detection, network learning) |
| 5   | MIS Read Service         | Functional (10 data types, zero-storage, canonical transforms)          |
| 6   | MIS Staff Sync           | Functional (populates 6 tables from single export)                      |
| 7   | Assessment Upload        | Production-grade (HMAC-SHA256, AI analysis, EEF matching)               |
| 8   | Payroll Parse            | Production-grade (zero-storage, auto-detect, on-costs calculation)      |
| 9   | Finance FMS Import       | Production-grade (CFR codes, checksum dedup, dry-run, reconciliation)   |
| 10  | Evidence Upload          | Production-grade (MIME validation, 50MB limit, AI extraction)           |
| 11  | Document Extraction      | Functional (regex + AI fallback, confidence scoring, approval gate)     |
| 12  | Data Validation Pipeline | Functional (extracted_data → validated_data lifecycle)                  |

---

## Which Are Operationally Usable Today

| Pipeline                | Has UI?                           | Self-Service? | Pilot Usable?         |
| ----------------------- | --------------------------------- | ------------- | --------------------- |
| Staff CSV Import        | YES (modal in HR page)            | YES           | **YES**               |
| Assessment Upload       | YES (PupilAssessmentUploader)     | YES           | **YES**               |
| Evidence Upload         | YES (estates compliance pages)    | YES           | **YES**               |
| Document Extraction     | YES (data-validation/upload page) | YES           | **YES**               |
| Google Drive Connection | YES (settings/data-connections)   | YES (browse)  | **YES (browse only)** |
| Drive File Preview      | YES (within data-connections)     | YES           | **YES**               |
| Payroll Parse           | YES (finance/payroll page)        | YES           | **YES if unhidden**   |
| Finance Budget Parse    | YES (finance page, client-side)   | YES           | **YES if unhidden**   |

## Which Require UI/Admin Wiring

| Pipeline            | Backend Ready? | Missing UI                                                        | Effort to Wire |
| ------------------- | -------------- | ----------------------------------------------------------------- | -------------- |
| Pupil CSV Import    | YES            | Upload page with file input + preview                             | 1-2 days       |
| Canvas Smart Ingest | YES            | Modal connecting DriveFilePicker → ingest API                     | 2-3 days       |
| MIS Read Service    | YES            | "Load from Drive" buttons on attendance/SEND/behaviour pages      | 2-3 days       |
| MIS Staff Sync      | YES            | "Sync Staff from MIS" button on staff directory                   | 1 day          |
| Finance API Import  | YES            | Wire client-side parse → API persist (budget page already exists) | 1-2 days       |

---

## Whether Realistic School Onboarding Is Currently Viable

### With implementation partner support: YES (8/10)

An implementation partner can:

1. Set up the org via the self-service onboarding flow (smooth)
2. Import staff via the Staff Directory CSV modal (smooth)
3. Import pupils by calling the API directly (functional, no UI)
4. Connect Google Drive folder (smooth)
5. Upload pupil assessments via the intelligence uploader (smooth, best UX)
6. Upload evidence documents (smooth)
7. Import finance data via API (functional, requires technical knowledge)
8. Parse payroll via direct URL to hidden page (functional)

### Fully self-service: PARTIAL (6/10)

A school admin alone can complete steps 1, 2, 4, 5, 6 through the UI. Steps 3 (pupils), 7 (finance API), and 8 (payroll — hidden) require technical knowledge or access to hidden pages.

---

## What a Pilot User Would Genuinely Experience

### Day 1: Onboarding

- Sign up → DfE school search → org created with enriched data → **impressed**
- Setup wizard shows 5 steps → downloads staff CSV template → imports 30 staff → **confident**
- Tries to import pupils → downloads template → **stuck** (no upload page)
- Connects Google Drive → sees folder structure detected → browses files → **curious but no action available**

### Day 2: Using Core Modules

- Creates 5 risks in Risk Register → heatmap populates → **useful**
- Starts compliance review with 36 templates → creates 3 policies → **productive**
- Generates a document → staff name auto-populated → **delighted**
- Asks Ed "Add a teaching assistant" → staff created → **impressed**
- Asks Ed "Show me our risks" → risk register displayed → **useful**

### Day 3: Advanced Features

- Uploads pupil assessment CSV → auto-detects Arbor → pseudonymises → analyses → **impressive**
- Sees attainment gaps by FSM/SEND/gender → EEF recommendations → **high value**
- Tries to check attendance → sees demo data with banner → **understands, wants real data**
- Looks for "where did my data come from?" → **can't find provenance information**

### Day 7: Re-engagement

- Returns to dashboard → sees setup wizard at 2/5 → **knows what's left**
- Re-imports staff with updated list → clean upsert → **confident**
- Wonders if Drive folder has new files → checks Data Connections → sees last scan date → **acceptable**

---

## Remaining Blockers to Broader Rollout

### Blocking (must fix before next-level rollout)

1. **Pupil upload UI page** — the single highest-impact gap for self-service onboarding
2. **Trust signals** — import provenance not surfaced in UI (5/10 trust score)

### Important (should fix for quality)

3. **Data Connections import actions** — "Import this file to [Module]" buttons
4. **MIS UI surfaces** — "Load from Drive" on attendance/SEND/behaviour pages
5. **Finance dashboard wired to imported data** — currently shows demo even when real data exists via API

### Nice to Have (for maturity)

6. **Canvas Smart Ingest modal** — UI for the sophisticated field matching system
7. **MIS Staff Sync button** — one-click enrichment from MIS export
8. **Data provenance dashboard** — single view of all imports, sources, dates, freshness
9. **Freshness warnings** — amber alert when data hasn't been refreshed in 7+ days

---

## Revised Readiness Scores

### Three-Dimensional Assessment

| Dimension                     | Score | Justification                                                         |
| ----------------------------- | ----- | --------------------------------------------------------------------- |
| **Architecture Maturity**     | 9/10  | 12 pipelines, 150+ tables, production-grade validation, privacy-first |
| **Onboarding Maturity**       | 7/10  | Smooth with partner (8/10), self-service gap for pupils (6/10)        |
| **Pilot Usability**           | 8/10  | 13 modules visible, 9/10 golden journeys pass, Ed 46/52 skills        |
| **End-User Clarity**          | 6/10  | Trust signals weak (5/10), import provenance not surfaced             |
| **Admin/Operator Complexity** | 7/10  | Most flows require admin expertise, some need technical support       |

### Overall: **7.5/10** (operational, weighted by usability reality)

This is different from the previous architectural score of 8.5/10 because this assessment weights **what a user actually experiences** rather than what the backend can do.

---

## Final Recommendation

### Status: READY FOR CONTROLLED PILOT LAUNCH WITH IMPLEMENTATION SUPPORT

The platform has genuinely strong connected-data architecture (9/10) that exceeds what most competitors offer. However, the gap between backend capability and self-service UI accessibility means that:

- **With an implementation partner:** Schools can be fully onboarded and operational across all pilot modules. Rating: 8/10.
- **Self-service:** Schools can complete most of onboarding but get stuck at pupil import and miss finance/payroll capabilities. Rating: 6/10.

### The honest position:

Schoolgle is a **pilot-ready platform that benefits from guided onboarding**. This is normal for enterprise school software — competitors like Arbor, Bromcom, and SIMS all require implementation support for initial setup.

The architecture is ahead of the UI. This is the right way round — it's much easier to build UI for working backends than to build backends for pretty UIs.

### What would move this to fully self-service:

1. Pupil upload UI page (1-2 days)
2. Data Connections import actions (2-3 days)
3. Trust signal badges on imported records (1-2 days)

**Total: ~1 week of focused work would close the self-service gap.**
