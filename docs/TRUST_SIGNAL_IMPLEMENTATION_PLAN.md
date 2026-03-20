# Trust Signal Implementation Plan

**Date:** 2026-03-19

---

## Components Built

### DataSourceBadge

**File:** `apps/platform/src/components/ui/DataSourceBadge.tsx`

Shows where a record came from using connection-based language:

- "Connected via CSV" (not "CSV Import")
- "Added in Schoolgle" (not "Manual Entry")
- "Connected from Arbor" / "Connected from SIMS" / "Connected from Bromcom"
- "Synced from MIS"
- "Connected via Drive"
- "Connected via API"

Each source has a distinct icon and colour. Import date shown when available.

### DataFreshnessBadge

Shows data currency with traffic-light colours:

- Green: "Fresh (today)" or "Fresh (Xd ago)" — within 7 days
- Amber: "Xd ago" — within 30 days
- Red: "Stale (Xd ago)" — older than 30 days

---

## Integration Points (Ready for Wiring)

| Module                  | Where                | Badge Type                | Data Fields                                    |
| ----------------------- | -------------------- | ------------------------- | ---------------------------------------------- |
| Staff Directory list    | Each staff row       | DataSourceBadge (compact) | `staff.import_source`, `staff.imported_at`     |
| Staff Directory detail  | Staff profile header | DataSourceBadge (full)    | Same                                           |
| Pupil list (when built) | Each pupil row       | DataSourceBadge (compact) | `pupil.import_source`, `pupil.imported_at`     |
| Data Connections page   | Each connection card | DataFreshnessBadge        | `connection.last_scan_at`                      |
| Evidence list           | Each evidence item   | DataSourceBadge (compact) | `evidence.source_type`, `evidence.uploaded_at` |
| Intelligence analysis   | Analysis header      | DataFreshnessBadge        | `analysis.created_at`                          |

---

## Language Principles

### Use "Connected" not "Imported"

- "Connected via CSV on 19 Mar 2026" not "Imported from CSV on 19 Mar 2026"
- "Connected from Arbor" not "Imported from Arbor"

### Use "Added in Schoolgle" not "Manual Entry"

- For records created through the Schoolgle UI directly

### Use "Synced" for live connections

- "Synced from MIS" — for data pulled via Wonde or live API

### Use "Fresh / Stale" not "Up to date / Outdated"

- Traffic-light colours make status instantly visible
