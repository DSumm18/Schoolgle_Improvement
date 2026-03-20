# Connected Data Operational Validation

**Date:** 2026-03-19
**Standard:** Not "does the API exist?" but "can a school user trigger it, understand it, and trust the result?"

---

## Validation Framework

For each ingestion path, I assess three levels:

- **Architecture**: Does the backend code exist and work?
- **UI/Workflow**: Can a user trigger it through the interface?
- **Trust**: Can the user understand and trust the result?

---

## 1. Staff CSV Import

| Level        | Score | Evidence                                                                                                      |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| Architecture | 10/10 | Papa Parse, 22+ fuzzy role mappings, email/employee_id dedup, archive action                                  |
| UI/Workflow  | 9/10  | Import modal in Staff Directory page, template download, clear error messages                                 |
| Trust        | 8/10  | Error messages include row numbers. Warnings for missing fields. No source/date indicator on imported records |

**Operationally usable:** YES — self-service by any school admin

---

## 2. Pupil CSV Import

| Level        | Score | Evidence                                                                               |
| ------------ | ----- | -------------------------------------------------------------------------------------- |
| Architecture | 9/10  | Papa Parse, DfE SEN validation, year group normalisation, gender normalisation, upsert |
| UI/Workflow  | 3/10  | API works but NO upload page exists. Template downloadable from setup wizard           |
| Trust        | 7/10  | API returns clear errors/warnings. No UI to see results                                |

**Operationally usable:** NO for self-service. YES with technical support (API call)

---

## 3. Google Drive Connection

| Level        | Score | Evidence                                                                       |
| ------------ | ----- | ------------------------------------------------------------------------------ |
| Architecture | 9/10  | Real Google Drive API calls, folder scanning, category detection, file preview |
| UI/Workflow  | 7/10  | Paste link → Connect → Browse. Clean UI. BUT no "Import this file" actions     |
| Trust        | 8/10  | Shows folder name, file count, last scan date, "ACTIVE"/"READ-ONLY" badges     |

**Operationally usable:** YES for connection and browsing. NOT YET for triggering imports from within the page.

---

## 4. Canvas Smart Ingest

| Level        | Score | Evidence                                                                                                      |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| Architecture | 9/10  | 40+ data fingerprints, source system auto-detection, network-effect learning                                  |
| UI/Workflow  | 2/10  | API exists (`/api/canvas/ingest`). DriveFilePicker component exists. But NO modal or page wires them together |
| Trust        | N/A   | User never sees it — no UI surface                                                                            |

**Operationally usable:** NO — backend ready, frontend not wired

---

## 5. MIS Read Service

| Level        | Score | Evidence                                                                      |
| ------------ | ----- | ----------------------------------------------------------------------------- |
| Architecture | 8/10  | 10 data types, Drive + Wonde sources, canonical type transforms, zero-storage |
| UI/Workflow  | 1/10  | API routes exist (`/api/mis/read`, `/api/mis/sync`). NO UI calls them         |
| Trust        | N/A   | User never sees it                                                            |

**Operationally usable:** NO — backend ready, no UI surfaces

---

## 6. MIS Staff Sync

| Level        | Score | Evidence                                                                                |
| ------------ | ----- | --------------------------------------------------------------------------------------- |
| Architecture | 9/10  | Populates 6 tables (directory, contracts, DBS, training, qualifications, right-to-work) |
| UI/Workflow  | 1/10  | `POST /api/mis/sync?type=staff` exists. NO UI trigger                                   |
| Trust        | N/A   | User never sees it                                                                      |

**Operationally usable:** NO — backend ready, no UI surfaces

---

## 7. Pupil Assessment Upload (Intelligence)

| Level        | Score | Evidence                                                                                  |
| ------------ | ----- | ----------------------------------------------------------------------------------------- |
| Architecture | 10/10 | HMAC-SHA256 client-side, zero-PII server, AI analysis, EEF matching                       |
| UI/Workflow  | 9/10  | PupilAssessmentUploader component: drag-drop, MIS detection, preview, encrypt, analyse    |
| Trust        | 9/10  | Privacy banner, colour-coded columns (red=PII, blue=assessment), severity-ranked insights |

**Operationally usable:** YES — best import UX in the platform

---

## 8. Payroll Parse

| Level        | Score | Evidence                                                                          |
| ------------ | ----- | --------------------------------------------------------------------------------- |
| Architecture | 9/10  | Auto-detect columns, pay scale classification, on-costs calculation, zero-storage |
| UI/Workflow  | 8/10  | Drag-drop on `/dashboard/finance/payroll` page. BUT page is hidden from pilot nav |
| Trust        | 8/10  | Shows parsed staff table with calculations. "Save to ICFP" button                 |

**Operationally usable:** YES if page is accessible. Currently hidden from pilot navigation.

---

## 9. Finance FMS Import

| Level        | Score | Evidence                                                                                                                                                       |
| ------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture | 9/10  | CFR code mapping, checksum dedup, reversal matching, dry-run mode, audit logging                                                                               |
| UI/Workflow  | 6/10  | Budget upload on `/dashboard/finance` page (drag-drop). BUT page is hidden AND client-side parsing doesn't call `/api/finance/import` — they're separate paths |
| Trust        | 6/10  | Dashboard shows parsed data. But client-side vs API-imported data are disconnected                                                                             |

**Operationally usable:** PARTIALLY — client-side budget parsing works as a viewer. API import for persistent storage requires technical setup.

---

## 10. Evidence Upload

| Level        | Score | Evidence                                                                      |
| ------------ | ----- | ----------------------------------------------------------------------------- |
| Architecture | 9/10  | MIME validation (14 types), 50MB limit, Drive + upload sources, AI extraction |
| UI/Workflow  | 8/10  | Upload form in estates compliance pages. Clear type selection, file handling  |
| Trust        | 8/10  | Stored with title, type, domain, expiry date. Retrievable later               |

**Operationally usable:** YES — self-service by caretakers and above

---

## 11. Document Extraction

| Level        | Score | Evidence                                                                                         |
| ------------ | ----- | ------------------------------------------------------------------------------------------------ |
| Architecture | 8/10  | Regex + AI fallback, 4 document types (insurance, asbestos, gas, electrical), confidence scoring |
| UI/Workflow  | 7/10  | `/dashboard/data-validation/upload` page: drop document, select type, see extracted fields       |
| Trust        | 8/10  | Confidence scores colour-coded, cross-checks shown, approval gate before data flows              |

**Operationally usable:** YES — self-service with human review step

---

## Summary Matrix

| #   | Pipeline                | Architecture | UI/Workflow | Trust | Operationally Usable  |
| --- | ----------------------- | ------------ | ----------- | ----- | --------------------- |
| 1   | Staff CSV Import        | 10/10        | 9/10        | 8/10  | **YES**               |
| 2   | Pupil CSV Import        | 9/10         | 3/10        | 7/10  | **NO (needs UI)**     |
| 3   | Google Drive Connection | 9/10         | 7/10        | 8/10  | **YES (browse only)** |
| 4   | Canvas Smart Ingest     | 9/10         | 2/10        | N/A   | **NO (needs UI)**     |
| 5   | MIS Read Service        | 8/10         | 1/10        | N/A   | **NO (needs UI)**     |
| 6   | MIS Staff Sync          | 9/10         | 1/10        | N/A   | **NO (needs UI)**     |
| 7   | Assessment Upload       | 10/10        | 9/10        | 9/10  | **YES**               |
| 8   | Payroll Parse           | 9/10         | 8/10        | 8/10  | **YES (if unhidden)** |
| 9   | Finance FMS Import      | 9/10         | 6/10        | 6/10  | **PARTIAL**           |
| 10  | Evidence Upload         | 9/10         | 8/10        | 8/10  | **YES**               |
| 11  | Document Extraction     | 8/10         | 7/10        | 8/10  | **YES**               |

**Fully operationally usable today:** 5 of 11 (Staff, Assessment, Evidence, Document Extraction, Drive Connection)
**Usable if unhidden:** 1 more (Payroll)
**Backend ready, needs UI wiring:** 5 (Pupil, Canvas Ingest, MIS Read, MIS Sync, Finance API)
