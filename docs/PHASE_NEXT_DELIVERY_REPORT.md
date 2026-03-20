# Self-Service Onboarding Delivery Report

**Date:** 2026-03-19
**Objective:** Close the gap between backend capability and self-service UI accessibility

---

## What Was Built

### 1. Pupil Upload Page (`/dashboard/pupils`)

**File:** `apps/platform/src/app/(dashboard)/dashboard/pupils/page.tsx`

Full self-service pupil CSV upload flow:

- Drag-and-drop zone accepting .csv files
- Template download button (calls `/api/pupils` with `{ template: true }`)
- Client-side preview showing first 10 rows with column detection
- Required columns highlighted in blue (pupil_id, first_name, last_name, year_group)
- Optional columns info panel
- "Import N Pupils" confirmation button
- Import progress indicator
- Results dashboard: imported count, updated count, error count
- Per-row error display with row numbers
- Warnings for missing optional data
- "Import More" and "Back to Setup" actions
- Error state with clear messaging and retry
- Accepts exports from Arbor, SIMS, Bromcom, or any spreadsheet
- Dark mode support throughout

### 2. Data Source Badge Component

**File:** `apps/platform/src/components/ui/DataSourceBadge.tsx`

Reusable trust signal components:

**DataSourceBadge** — Shows where a record came from:

- Recognises 9 source types: csv_import, manual, arbor, sims, bromcom, mis_sync, drive, api, csv
- Each has a distinct icon, label, and colour
- Shows import date when available
- Compact mode for use in table rows
- Falls back gracefully for unknown sources

**DataFreshnessBadge** — Shows data currency:

- Green "Fresh" badge if updated within 7 days
- Amber badge if updated within 30 days
- Red "Stale" badge if older than 30 days
- Shows days since last update

### 3. Setup Wizard — Pupil Link Fixed

**File:** `apps/platform/src/app/(dashboard)/dashboard/setup/page.tsx`

Changed the "Import Pupils" step to link to `/dashboard/pupils` (the new upload page) instead of `/dashboard/settings/data-connections` (which has no import actions).

---

## What Existing Capabilities Were Surfaced

| Capability            | Previous State                                | Now                                                      |
| --------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Pupil CSV import      | API only, no UI                               | **Full upload page with drag-drop, preview, validation** |
| Data source tracking  | `import_source` stored in DB but hidden       | **Reusable badge component ready for integration**       |
| Data freshness        | `imported_at` stored but not displayed        | **Reusable freshness badge ready for integration**       |
| Setup wizard → pupils | Linked to data connections (no import action) | **Links to dedicated upload page**                       |

---

## What Still Needs Integration

The badge components are built but need to be added to individual module pages:

| Module           | Integration Needed                                                                                       | Effort    |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------- |
| Staff Directory  | Add `<DataSourceBadge source={staff.import_source} importedAt={staff.imported_at} />` to staff list rows | 30 min    |
| Pupils list      | Build a pupils list page showing imported pupils with badges                                             | 2-3 hours |
| Data Connections | Add `<DataFreshnessBadge lastUpdated={connection.last_scan_at} />` to connection cards                   | 30 min    |
| Evidence list    | Already shows upload date — could add source badge                                                       | 30 min    |

---

## Self-Service Onboarding — Before vs After

| Step          | Before                              | After                                              |
| ------------- | ----------------------------------- | -------------------------------------------------- |
| Sign up       | SMOOTH (9/10)                       | SMOOTH (9/10)                                      |
| Setup wizard  | SMOOTH but pupils link wrong (7/10) | **SMOOTH with correct pupil link (8/10)**          |
| Staff import  | SMOOTH (9/10)                       | SMOOTH (9/10)                                      |
| Pupil import  | **NO UI — API only (3/10)**         | **Full upload page with preview (8/10)**           |
| Google Drive  | SMOOTH browse (7/10)                | SMOOTH browse (7/10)                               |
| Assessments   | SMOOTH (9/10)                       | SMOOTH (9/10)                                      |
| Evidence      | SMOOTH (8/10)                       | SMOOTH (8/10)                                      |
| Trust signals | Not visible (2/10)                  | **Components built, ready for integration (5/10)** |

### Self-service onboarding score: **6/10 → 7.5/10**

---

## Revised Readiness Position

| Dimension                 | Previous   | Current    | Change                                     |
| ------------------------- | ---------- | ---------- | ------------------------------------------ |
| Architecture Maturity     | 9/10       | 9/10       | —                                          |
| Onboarding Maturity       | 7/10       | **8/10**   | Pupil upload page closes main gap          |
| Pilot Usability           | 8/10       | **8.5/10** | Direct pupil upload, setup wizard improved |
| End-User Clarity          | 6/10       | **6.5/10** | Badge components built, need integration   |
| Admin/Operator Complexity | 7/10       | **7.5/10** | Less technical intervention needed         |
| **Overall**               | **7.5/10** | **8/10**   | Approaching self-service readiness         |

---

## Recommendation

### Status: APPROACHING SELF-SERVICE PILOT READY

The platform now has:

- **Full self-service for the top 5 onboarding tasks** (sign up, staff import, pupil import, assessments, evidence)
- **Trust signal components built** and ready for integration
- **Setup wizard correctly routes** to upload pages

### What still needs implementation support:

- Finance/payroll pages hidden from navigation (unhide decision needed)
- Data Connections browse → import actions not wired
- MIS read/sync has no UI triggers
- Canvas smart ingest has no frontend modal

### What would make this fully self-service:

1. Integrate trust badges into staff directory and pupil views (2-3 hours)
2. Unhide finance module for schools that import real FMS data (30 min config)
3. Add "Import this file" buttons to Data Connections file browser (1-2 days)

**With the pupil upload page built, the single biggest self-service blocker is closed.** A school admin can now complete the full onboarding flow through the UI without technical assistance for the core data: staff, pupils, assessments, and evidence.
