# Import Trust Signal Review

**Date:** 2026-03-19
**Question:** Can users understand where data came from, when it was refreshed, and whether they can trust it?

---

## Trust Signal Assessment by Module

### Staff Directory

| Signal                            | Present? | Evidence                                                                        |
| --------------------------------- | -------- | ------------------------------------------------------------------------------- |
| Source indicator (CSV/MIS/manual) | PARTIAL  | `import_source` column exists in DB (`csv_import` or `manual`). NOT shown in UI |
| Import date                       | PARTIAL  | `imported_at` stored per record. NOT shown in UI                                |
| Last refresh date                 | NO       | No "last imported" indicator on the staff list page                             |
| Editable vs read-only distinction | NO       | All fields appear editable regardless of source                                 |
| Import error feedback             | YES      | Clear row-level errors with field names during import                           |

**Trust score: 5/10** — Backend tracks provenance. UI doesn't surface it.

### Google Drive Connection

| Signal                       | Present? | Evidence                                             |
| ---------------------------- | -------- | ---------------------------------------------------- |
| Connection status            | YES      | "ACTIVE" badge, "READ-ONLY" badge                    |
| Last scan date               | YES      | Shown on connection card                             |
| File count by category       | YES      | Category cards show counts                           |
| File modification dates      | YES      | File browser shows `modifiedTime`                    |
| Connection freshness warning | NO       | No "data may be stale" warning if last scan > 7 days |

**Trust score: 7/10** — Good visibility into connection state. No staleness warnings.

### Pupil Assessment Upload

| Signal                 | Present? | Evidence                                                  |
| ---------------------- | -------- | --------------------------------------------------------- |
| Source system detected | YES      | Shows "Detected: Arbor" or similar                        |
| Privacy status         | YES      | "Zero-Knowledge Privacy" banner, colour-coded PII columns |
| Assessment period      | YES      | User selects Autumn/Spring/Summer                         |
| Import date            | YES      | Stored in `school_assessment_imports.created_at`          |
| Analysis freshness     | YES      | Intelligence page shows "Analysis from [date]"            |

**Trust score: 9/10** — Best trust signalling in the platform.

### Finance (Budget Upload)

| Signal              | Present? | Evidence                                           |
| ------------------- | -------- | -------------------------------------------------- |
| Demo data banner    | YES      | Added in Phase 1 when showing hardcoded data       |
| Source file name    | NO       | Client-side parsing doesn't store file metadata    |
| Import date         | NO       | No persistence of when budget was last uploaded    |
| CFR code validation | YES      | Parser validates against DfE code structure        |
| Data currency       | NO       | No indicator of financial year or reporting period |

**Trust score: 4/10** — Demo banner prevents confusion but real import lacks provenance.

### Attendance / SEND / Behaviour (with demo data)

| Signal                  | Present? | Evidence                                                       |
| ----------------------- | -------- | -------------------------------------------------------------- |
| Demo data banner        | YES      | Banners on all three pages when showing sample data            |
| "Connect MIS" guidance  | PARTIAL  | Attendance banner says "connect your MIS" but no MIS UI exists |
| Source system indicator | NO       | When real data exists, no indication of where it came from     |
| Data freshness          | NO       | No "last synced" or "imported on" indicator                    |

**Trust score: 5/10** — Demo banners work. Real data lacks provenance.

### Evidence Documents

| Signal                   | Present? | Evidence                                           |
| ------------------------ | -------- | -------------------------------------------------- |
| Upload date              | YES      | `uploaded_at` shown in evidence list               |
| Evidence type            | YES      | Category label on each document                    |
| Expiry date              | YES      | For certificates — shown with status               |
| Linked asset/task        | YES      | Association shown in evidence detail               |
| AI extraction confidence | YES      | Colour-coded confidence scores on extracted fields |

**Trust score: 8/10** — Strong provenance and confidence indicators.

---

## Overall Trust Signal Assessment

| Category                         | Score | Key Gap                                                       |
| -------------------------------- | ----- | ------------------------------------------------------------- |
| "Where did this come from?"      | 4/10  | Most modules don't show import source in UI                   |
| "When was it refreshed?"         | 3/10  | Import timestamps stored but not displayed                    |
| "Is this read-only or editable?" | 2/10  | No distinction between source data and Schoolgle-managed data |
| "Is this current?"               | 3/10  | No freshness warnings or "last synced" indicators             |
| "Is this real or demo?"          | 8/10  | Demo banners on all affected modules                          |
| "Can I trust the AI output?"     | 8/10  | Confidence scores, pseudonymisation messaging, EEF citations  |

**Overall trust signal score: 5/10**

---

## What Would Improve Trust Signals

### Quick Wins (1-2 days each)

1. **Show `import_source` and `imported_at` on staff records** — small badge "Imported from CSV on 19 Mar 2026"
2. **Show "last synced" on Data Connections page** — already stored, just not prominently displayed
3. **Add freshness warning** — if last scan > 7 days, show amber warning on Data Connections

### Medium Effort (3-5 days each)

4. **Source indicator on all imported records** — icon or badge showing CSV/MIS/Drive/Manual origin
5. **Read-only vs editable field distinction** — imported fields styled differently from Schoolgle-managed fields
6. **Data provenance dashboard** — single page showing all import sources, dates, record counts, freshness

### Longer Term

7. **Automated freshness alerts** — notify admin when Drive folder hasn't been updated in 30+ days
8. **Diff view on re-import** — show what changed between last import and new import
