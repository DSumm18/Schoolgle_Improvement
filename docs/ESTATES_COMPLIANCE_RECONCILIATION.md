# Estates Compliance — Codebase Reconciliation & Architecture Alignment

**Date:** 2026-03-20
**Method:** Exhaustive file search across 170+ files, schema inspection, UI page audit

---

## 1. Estates Compliance Capability Inventory

| Capability                         | In Code? | In UI?  | Backend? | End-to-End? | Duplicated? | Notes                                                                                                                                                                                                                                                                |
| ---------------------------------- | -------- | ------- | -------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statutory checks library**       | YES      | YES     | YES      | YES         | NO          | 18 domains, ~50+ inline checks + 5 external check files (COSHH 15, food safety, transport, safeguarding, seasonal). Domain metadata with icons/colours/order                                                                                                         |
| **Compliance tasks**               | YES      | YES     | YES      | YES         | NO          | Full CRUD via `estates_compliance_tasks` table + `TaskService.ts`. Recurring task support via `createNextOccurrence()`                                                                                                                                               |
| **Completions tracking**           | YES      | YES     | YES      | YES         | NO          | `estates_statutory_completions` table with status/RAG/evidence/findings. PL/pgSQL functions for summaries and overdue auto-update                                                                                                                                    |
| **Evidence upload/storage**        | YES      | YES     | YES      | PARTIAL     | NO          | `estates_evidence` table + `EvidenceService.ts`. Upload page exists but `EvidenceManager` component marked TODO                                                                                                                                                      |
| **Evidence gallery**               | YES      | YES     | YES      | YES         | NO          | `/estates-compliance/evidence` page with type filtering. Domain-specific evidence at check level                                                                                                                                                                     |
| **Document lifecycle**             | YES      | PARTIAL | YES      | PARTIAL     | NO          | `ai-document-verifier.ts` (591 lines) exists. `DocumentVerifier` component exists but is orphaned (not imported by any page)                                                                                                                                         |
| **Contractor self-service upload** | YES      | YES     | YES      | YES         | NO          | `upload_token` field on tasks + `/contractors/request-docs` endpoint                                                                                                                                                                                                 |
| **Contractor competence docs**     | YES      | YES     | YES      | YES         | NO          | `ContractorService.ts` (337 lines) with onboarding, accreditations, insurance tracking                                                                                                                                                                               |
| **Recurring scheduling**           | YES      | YES     | YES      | YES         | NO          | `is_recurring` + `recurrence_pattern` on tasks. `TaskService.createNextOccurrence()`                                                                                                                                                                                 |
| **Review cycles**                  | YES      | PARTIAL | YES      | PARTIAL     | NO          | `compliance_reviews` table (new, 20260320). API built. Show Me Site drawer wired. Not yet in Estates Compliance UI pages                                                                                                                                             |
| **Sign-off**                       | YES      | PARTIAL | YES      | PARTIAL     | NO          | `sign_off_status` fields added to tasks + completions (20260320). Show Me drawer has sign-off flow. Not in Estates Compliance pages                                                                                                                                  |
| **Audit trail**                    | YES      | YES     | YES      | YES         | NO          | `estates_audit_log` table + trigger. Check history pages. Completion timestamps                                                                                                                                                                                      |
| **COSHH register**                 | YES      | YES     | YES      | YES         | NO          | `coshh_register` table with 25+ fields including Vision AI. `/api/coshh` endpoint. Show Me Site drawer shows register                                                                                                                                                |
| **AI analysis (vision)**           | YES      | PARTIAL | YES      | PARTIAL     | NO          | `ai-document-verifier.ts` exists. `RoomScanCapture` component in room-checks page. COSHH analysis wired in `/api/coshh`. `DocumentVerifier` orphaned                                                                                                                 |
| **AI proposal review**             | YES      | YES     | YES      | YES         | NO          | Show Me Site COSHH drawer: AI findings → "Add to Register" → human confirmation                                                                                                                                                                                      |
| **Location-linked compliance**     | YES      | PARTIAL | YES      | PARTIAL     | NO          | `location_id`/`room_id` added to tasks/completions (20260320). `location_details` JSONB existed before. Show Me Site uses room model                                                                                                                                 |
| **Room/site overlays**             | YES      | YES     | N/A      | YES         | PARTIAL     | Show Me Site has 6 overlays (normal, tickets, compliance, evacuation, induction, COSHH). `/dashboard/estates/floor-plan` also has 8 overlays (fire exits, equipment, zones, hazards, accessibility, utilities, users, contractors) — **DUPLICATE floor plan viewer** |
| **Report ingestion**               | YES      | YES     | YES      | YES         | NO          | `analyze-findings` endpoint + `ContractorReportAnalyzer` component + `FindingsList` in findings page                                                                                                                                                                 |
| **Finding → action → closure**     | YES      | YES     | YES      | YES         | NO          | `findings-database.ts` (899 lines) classifies findings as statutory/good_practice/contractor_suggestion. Helpdesk tickets + actions system                                                                                                                           |
| **Overdue reminders**              | YES      | YES     | YES      | YES         | NO          | `reminder-service.ts` (619 lines + 209 line test). `/tasks/reminders/process` cron endpoint. PL/pgSQL `update_overdue_statutory_checks()`                                                                                                                            |
| **Dashboards / RAG**               | YES      | YES     | YES      | YES         | NO          | `RAGStatusService.ts` (238 lines). Main dashboard has RAG per domain. `get_domain_completion_summary()` PL/pgSQL                                                                                                                                                     |
| **AMP / strategic layer**          | NO       | NO      | NO       | NO          | NO          | Genuinely not built                                                                                                                                                                                                                                                  |
| **Benchmarking / KPI layer**       | NO       | NO      | NO       | NO          | NO          | Genuinely not built                                                                                                                                                                                                                                                  |
| **Daily checks (opening/closing)** | YES      | YES     | YES      | YES         | NO          | `daily-checks.ts` (539 lines) + UI page + `estates_daily_check_completions` table                                                                                                                                                                                    |
| **Diary / daily log**              | YES      | YES     | YES      | YES         | NO          | `estates_daily_diary` table + `/diary` page                                                                                                                                                                                                                          |
| **Helpdesk / ticketing**           | YES      | YES     | YES      | YES         | NO          | Full CRUD + comments + risk assessment + email-to-ticket ingestion                                                                                                                                                                                                   |
| **Condition survey**               | YES      | YES     | YES      | YES         | NO          | 777-line page + 572-line API. Hierarchical location grading                                                                                                                                                                                                          |
| **Energy management**              | YES      | YES     | YES      | YES         | NO          | 3165-line page + 11 API routes. Meter readings, HH analysis, anomaly detection, invoice parsing, governor reports                                                                                                                                                    |
| **Lettings**                       | YES      | YES     | YES      | YES         | NO          | 1283-line page + 374-line API                                                                                                                                                                                                                                        |
| **Incidents / RIDDOR**             | YES      | YES     | YES      | YES         | NO          | 1826-line page                                                                                                                                                                                                                                                       |
| **QR asset tags**                  | YES      | YES     | YES      | YES         | NO          | `QRCodeGenerator.tsx` component + asset-tags page                                                                                                                                                                                                                    |
| **Mobile inspections**             | YES      | YES     | YES      | YES         | NO          | `/inspections` page with location-based checklist                                                                                                                                                                                                                    |
| **Room checks (Vision AI)**        | YES      | YES     | YES      | YES         | NO          | `RoomCheckDashboard` + `RoomScanCapture` components. AM/PM room scanning                                                                                                                                                                                             |
| **Governor reports**               | YES      | YES     | YES      | YES         | NO          | `governor-reports.ts` (360 lines) + reports page                                                                                                                                                                                                                     |
| **Ed AI context**                  | YES      | YES     | YES      | YES         | NO          | `ed-context.ts` (520 lines) — Ed gets estates compliance context                                                                                                                                                                                                     |

---

## 2. Key Files Reviewed

### Library (36 files)

`src/lib/estates-compliance/` — statutory-checks.ts (1061), daily-checks.ts (539), coshh-checks.ts (227), food-safety-checks.ts (322), safeguarding-checks.ts (353), seasonal-checks.ts (416), transport-checks.ts (346), check-templates.ts (444), findings-database.ts (899), ai-document-verifier.ts (591), ed-context.ts (520), + 7 database files, 8 service files, governor-reports.ts, reminder-service.ts, tag-utils.ts

### API Routes (49 routes)

7 under `/api/estates-compliance/` + 42 under `/api/estates/` + 1 COSHH route + 1 compliance reviews route

### Pages (36 pages)

24 under `/estates-compliance/` + 12 under `/dashboard/estates/`

### Migrations (12 files)

11 original + 1 new (20260320_compliance_review_cycle.sql)

### Components (3 in `/components/estates/` + 8 orphaned)

---

## 3. What Already Exists and Should Be Kept

Everything below is well-built and should be preserved:

- **Statutory checks library** — 18 domains, comprehensive definitions, frequency metadata. This is the foundation.
- **Compliance tasks system** — Full lifecycle with recurrence, contractor assignment, evidence linking.
- **Statutory completions tracking** — RAG status, findings, PL/pgSQL summaries. Auto-overdue updates.
- **Evidence system** — Upload, verification, AI confidence scoring, domain linking.
- **Contractor management** — Onboarding, accreditations, insurance, self-service upload tokens.
- **Helpdesk** — Tickets, comments, risk assessment, email-to-ticket ingestion (471-line inbound handler).
- **Daily checks** — Opening/closing routines, mobile-optimised with photo capture.
- **Findings classification** — 899-line engine separating statutory/good_practice/contractor_suggestion. Estimated costs, HSE references.
- **Overdue reminders** — 619-line service with test coverage.
- **RAG status service** — Domain-level Red/Amber/Green calculation.
- **Energy management** — Comprehensive (3165-line page, 11 API routes).
- **Governor reports** — 360-line report generator.
- **Ed estates context** — 520-line context loader.
- **COSHH register** — Purpose-built table with Vision AI fields.
- **Seed data** — Aurora test data for contractors, assets, checks, tickets.

---

## 4. What Exists but Is Not Utilised Properly

| Item                                      | Status        | What's Wrong                                                                                                              | Impact                                                         |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`DocumentVerifier` component**          | Orphaned      | Built but not imported by any page. The `ai-document-verifier.ts` (591 lines) backend exists                              | Schools can't use AI document verification through the UI      |
| **`EvidenceManager` component**           | Orphaned      | Built but marked TODO in evidence upload page                                                                             | Evidence upload page is simpler than intended                  |
| **`CheckHistoryTimeline` component**      | Orphaned      | Built but history page renders its own timeline                                                                           | Duplicate implementation                                       |
| **`FindingsAutoSuggest` component**       | Orphaned      | Built but not wired                                                                                                       | AI findings suggestions not available in check completion flow |
| **`TaskScheduler` component**             | Orphaned      | Built but not wired                                                                                                       | Scheduling done directly in pages instead                      |
| **`DomainManager` component**             | Orphaned      | Built but not wired                                                                                                       | Domain configuration not accessible                            |
| **`DiaryEntry` component**                | Orphaned      | Built but diary page renders inline                                                                                       | Duplicate approach                                             |
| **Floor plan viewer** (dashboard/estates) | Underutilised | Full overlay system with 8 modes exists at `/dashboard/estates/floor-plan` but was superseded by Show Me Site             | Two separate floor plan implementations                        |
| **Room checks Vision AI**                 | Underutilised | `RoomCheckDashboard` + `RoomScanCapture` exist at `/estates-compliance/room-checks` but not connected to COSHH or Show Me | Vision AI scanning capability exists but siloed                |
| **`ed-context.ts`**                       | Underutilised | 520 lines of estates context for Ed but Ed's estates specialist prompt doesn't reference these helpers                    | Ed doesn't get the full estates intelligence it could          |
| **`ai-document-verifier.ts`**             | Underutilised | 591 lines of document verification logic. Used nowhere in the UI                                                          | AI verification capability exists but not exposed              |

---

## 5. What Is Duplicated / Stale / Broken

| Item                                   | Issue             | Details                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Two floor plan systems**             | DUPLICATE         | `/dashboard/estates/floor-plan/page.tsx` (441 lines) has its own overlay system with 8 modes (fire exits, equipment, zones, hazards, accessibility, utilities, users, contractors). Show Me Site `/show-me/site/page.tsx` has a separate floor plan with 6 overlays. These should be unified or one should be deprecated. |
| **`estates_routines` tables**          | MISSING MIGRATION | `/api/estates-compliance/routines/route.ts` (107 lines) + `/api/estates-compliance/routines/[id]/route.ts` (112 lines) query `estates_routines` and `estates_routine_items` tables. **These tables are never created in any migration.** Any call to these routes will fail with a database error.                        |
| **Old compliance redirect**            | STALE             | `/dashboard/estates/compliance/page.tsx` is a redirect to `/estates-compliance`. The redirect works but the old route is unnecessary clutter.                                                                                                                                                                             |
| **Compliance domain in two locations** | STALE             | `/dashboard/estates/compliance/[slug]/page.tsx` and `/dashboard/estates/compliance/manage/page.tsx` exist as old stubs alongside the full `/estates-compliance/` system.                                                                                                                                                  |
| **8 orphaned components**              | STALE             | Components built but never wired into pages (listed in section 4).                                                                                                                                                                                                                                                        |

---

## 6. What Is Genuinely Missing

After reconciliation, these are the **real gaps** (not things that already exist but aren't surfaced):

| Gap                                            | Priority | Notes                                                                                                                                                                         |
| ---------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AMP / Asset Management Plan**                | LOW      | Strategic estate management layer — no code exists                                                                                                                            |
| **Benchmarking / KPI layer**                   | LOW      | School-to-school or year-to-year comparison — no code exists                                                                                                                  |
| **`estates_routines` migration**               | HIGH     | API routes exist but table doesn't. Need to either create the migration or remove the routes                                                                                  |
| **COSHH dedicated page in Estates Compliance** | MEDIUM   | COSHH is accessible via `[domain]` pages (`/estates-compliance/coshh`) but no purpose-built COSHH register UI exists in the Estates Compliance section — only in Show Me Site |
| **Review cycle UI in Estates Compliance**      | MEDIUM   | `compliance_reviews` table and API exist. Show Me Site has review start/complete/sign-off. But the main Estates Compliance pages don't show review cycles or sign-off status  |
| **Evidence upload integration**                | LOW      | `EvidenceManager` component exists but isn't wired into the upload page                                                                                                       |
| **Unified floor plan**                         | MEDIUM   | Two floor plan systems should converge or one should clearly supersede the other                                                                                              |

---

## 7. Recommended Aligned Architecture

### System of Record

**Estates Compliance** (`/estates-compliance/` pages + `estates_*` tables + `compliance_reviews` table)

This is and should remain the authoritative system. All compliance data lives here. All statutory checks, tasks, evidence, findings, reviews, and sign-offs write to these tables.

### Visual / Action Layer

**Show Me Site** (`/dashboard/show-me/site/`)

Show Me reads from the Estates Compliance tables and provides a room-based visual overlay. It should not store compliance data itself. It triggers actions (start review, complete review, sign off) that write back to the compliance tables via APIs.

### AI Admin-Reduction Layer

**Ed + Vision AI**

- Ed's estates specialist gets context from `ed-context.ts`
- Vision AI for room scanning exists in `RoomCheckDashboard`/`RoomScanCapture`
- AI document verification exists in `ai-document-verifier.ts`
- COSHH AI analysis exists in `/api/coshh`
- These should all feed through the same compliance tables, not create parallel data stores

### What Should Be Deprecated or Merged

| Item                                               | Action                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/estates/floor-plan` (8-overlay viewer) | **MERGE into Show Me Site** or keep as the "admin floor plan editor" while Show Me is the "operational overlay viewer"                       |
| `/dashboard/estates/compliance/` (old redirects)   | **DEPRECATE** — the redirect to `/estates-compliance/` is fine but the `[slug]` and `manage` stubs should be removed                         |
| Orphaned components (8)                            | **WIRE OR REMOVE** — either integrate `DocumentVerifier`, `EvidenceManager`, `FindingsAutoSuggest` into their intended pages, or delete them |
| `/api/estates-compliance/routines/` routes         | **CREATE MIGRATION OR REMOVE** — currently broken. Either create `estates_routines` + `estates_routine_items` tables or delete the routes    |

---

## 8. Recommended Next Build Order

### Immediate (fix broken things)

1. **Create `estates_routines` migration** OR remove the broken API routes — currently every call to `/api/estates-compliance/routines` fails
2. **Wire `EvidenceManager` component** into `/estates-compliance/evidence/upload` — the TODO has been sitting there

### Short-term (align review workflow)

3. **Surface review cycles in Estates Compliance UI** — the `compliance_reviews` data is written by Show Me but not visible in the main Estates Compliance pages. Add a "Reviews" tab or section to the main dashboard showing recent reviews, sign-off status, and next due dates.
4. **Wire room-check Vision AI into COSHH** — `RoomScanCapture` already captures room photos and exists at `/estates-compliance/room-checks`. Connect this to the COSHH AI analysis flow so a room scan automatically checks against the COSHH register.

### Medium-term (complete the loop)

5. **Overdue review reminders in cron** — add COSHH review due check to `/api/cron/daily`
6. **Unified floor plan decision** — either merge the two floor plan viewers or clearly designate one as "admin" and one as "operational"
7. **Fire Safety overlay in Show Me Site** — follows the proven COSHH pattern, ~1 hour

### Longer-term

8. **Wire orphaned components** — `DocumentVerifier`, `FindingsAutoSuggest`, `TaskScheduler` into their intended pages
9. **AMP / strategic estate management** — genuinely new build
10. **Benchmarking / KPIs** — genuinely new build
