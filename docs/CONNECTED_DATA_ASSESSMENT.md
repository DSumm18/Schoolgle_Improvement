# Connected Data Assessment

**Date:** 2026-03-19
**Purpose:** Module-by-module view of source data needs, import model, mapping quality, and data trustworthiness

---

## Architecture Principle

Schoolgle is NOT the system of record for most operational data. It acts as:

- **Ingestion layer** — accepts data from source systems via CSV, spreadsheet, or API
- **Interpretation layer** — maps, validates, normalises, and cross-references
- **Workflow layer** — adds actions, notes, reviews, statuses, and follow-ups
- **Intelligence layer** — generates insights, flags, dashboards, and reports

Source-system data (MIS, payroll, finance) remains authoritative. Schoolgle-added workflow sits on top.

---

## Module Data Assessment

### 1. Staff Directory

| Aspect               | Status                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Source data**      | Staff names, roles, contact info, employee IDs                                                           |
| **Origin**           | School HR records, MIS, or manual entry                                                                  |
| **Import path**      | CSV import via `/api/staff/import` — FULLY FUNCTIONAL                                                    |
| **Template**         | Embedded in API (GET returns downloadable CSV template with 5 example rows)                              |
| **Validation**       | Required: first_name, last_name, job_title. Fuzzy role matching (13 categories). Email/employee_id dedup |
| **Merge logic**      | Update-or-insert by email OR employee_id. "remove"/"archive" action column supported                     |
| **Manual create**    | Yes — modal-based CRUD in UI                                                                             |
| **Source labelling** | No explicit "imported from" indicator per record                                                         |
| **Refresh model**    | Re-upload CSV to update. No automated sync                                                               |
| **Partial data**     | Works fine — only first/last/job required, everything else optional                                      |
| **Assessment**       | PRODUCTION READY for pilot. Import is robust, merge is sensible                                          |

### 2. Attendance

| Aspect               | Status                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Source data**      | Pupil names, year groups, daily AM/PM marks (25 DfE codes)                                                     |
| **Origin**           | MIS (Arbor, SIMS, Bromcom) or manual registration                                                              |
| **Import path**      | No CSV import exists. Manual registration via UI only                                                          |
| **Demo data**        | Returns demo registers when no real data exists (`is_demo: true` flag in API)                                  |
| **Validation**       | 25 DfE code system correctly implemented                                                                       |
| **Manual create**    | Yes — mark registers via UI                                                                                    |
| **Source labelling** | `is_demo` flag in API but NOT shown in UI                                                                      |
| **Assessment**       | PARTIALLY READY. Works for manual registration but no bulk import from MIS. Demo data needs UI-level indicator |

### 3. SEND Register

| Aspect            | Status                                                                              |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Source data**   | Pupil SEN status (K/E), primary/secondary needs, EHCP status, key workers           |
| **Origin**        | SENCO records, MIS, LA notifications                                                |
| **Import path**   | No CSV import. Falls back to MIS service, then demo data (15 hardcoded pupils)      |
| **Demo data**     | 15 realistic demo pupils returned when empty (`demo: true` flag)                    |
| **Manual create** | Yes — CRUD via UI                                                                   |
| **Assessment**    | PARTIALLY READY. Create flow works but no bulk import. Demo data needs UI indicator |

### 4. Finance

| Aspect          | Status                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| **Source data** | Budget lines, transactions, CFR codes, supplier data                                     |
| **Origin**      | FMS (Access, Sage, LA systems), budget monitoring reports                                |
| **Import path** | `/api/finance/import` — FUNCTIONAL (complex: dry-run, checksum dedup, anomaly detection) |
| **Dashboard**   | Shows DEMO DATA (hardcoded £1.45M budget) with warning banner (Phase 1 fix)              |
| **Assessment**  | BACKEND READY but dashboard not connected to imported data. Hidden from pilot navigation |

### 5. Governance

| Aspect            | Status                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Source data**   | Governor names, roles, term dates, skills, training, meetings                                       |
| **Origin**        | School/trust records, NGA, governor hub                                                             |
| **Import path**   | No CSV import. Manual creation via UI                                                               |
| **Manual create** | Yes — full CRUD for governors, meetings, training, policies, visits                                 |
| **Assessment**    | PILOT READY. Native Schoolgle data (not imported from another system). All data created in-platform |

### 6. Risk Register

| Aspect             | Status                                                          |
| ------------------ | --------------------------------------------------------------- |
| **Source data**    | Risk descriptions, scores, mitigations, decisions               |
| **Origin**         | Native Schoolgle data                                           |
| **Import path**    | No import needed — system of record                             |
| **Manual create**  | Yes — full CRUD with dual scoring, heatmap, 4T decisions        |
| **Ed integration** | 6 skills implemented and working                                |
| **Assessment**     | PILOT READY. This is a system of record, not an ingestion layer |

### 7. Compliance Hub

| Aspect          | Status                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| **Source data** | Policies, training records, DBS checks, complaints, consent                |
| **Origin**      | Mixed — some imported (training dates), some native (policies, complaints) |
| **Import path** | 36 seeded templates. Manual creation for all record types                  |
| **Assessment**  | PILOT READY. Self-contained compliance management system                   |

### 8. Estates & Compliance

| Aspect          | Status                                                             |
| --------------- | ------------------------------------------------------------------ |
| **Source data** | Assets, locations, contractors, compliance tasks, helpdesk tickets |
| **Origin**      | Native Schoolgle data (system of record for estates management)    |
| **Import path** | No CSV import. All created via UI                                  |
| **Assessment**  | PILOT READY. System of record for estates operations               |

### 9. Meetings

| Aspect          | Status                                       |
| --------------- | -------------------------------------------- |
| **Source data** | Meeting details, attendees, minutes, actions |
| **Origin**      | Native Schoolgle data                        |
| **Assessment**  | PILOT READY. System of record                |

### 10. Documents

| Aspect                | Status                                                                               |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Source data**       | Templates with placeholders resolved from Staff, Org, Meetings, Absence, Contractors |
| **Origin**            | Hybrid — templates native, placeholder data from other modules                       |
| **Cross-module data** | Pulls live data from 6 sources via placeholder-resolver                              |
| **Assessment**        | PILOT READY. Strongest cross-module integration point                                |

### 11. Surveys

| Aspect          | Status                                    |
| --------------- | ----------------------------------------- |
| **Source data** | Survey definitions and responses          |
| **Origin**      | Native Schoolgle data                     |
| **Assessment**  | PILOT READY. Self-contained survey system |

### 12. School Intelligence

| Aspect          | Status                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| **Source data** | DfE warehouse data, pupil assessments, contextual factors                            |
| **Origin**      | DfE API feeds, school-uploaded CSVs (pupil assessment data)                          |
| **Import path** | Pupil assessment CSV upload with HMAC-SHA256 pseudonymisation                        |
| **DfE data**    | Pre-populated warehouse (attendance, census, KS2, workforce, exclusions)             |
| **Assessment**  | PILOT READY with caveats — requires DfE data and assessment uploads to be meaningful |

### 13. Behaviour

| Aspect          | Status                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| **Source data** | Behaviour incidents, consequences, exclusions                          |
| **Origin**      | Native Schoolgle or MIS sync                                           |
| **Demo data**   | 40+ dynamically generated demo incidents when empty                    |
| **Assessment**  | PARTIALLY READY. Manual create works, but demo data needs UI indicator |

### 14. Calendar

| Aspect          | Status                                            |
| --------------- | ------------------------------------------------- |
| **Source data** | Term dates, events, parents' evening slots        |
| **Origin**      | Native Schoolgle data                             |
| **Assessment**  | PILOT READY. System of record for school calendar |

---

## Key Finding: Demo Data vs Real Import

| Module         | Demo Data Present       | Has Real Import Path | Risk Level                 |
| -------------- | ----------------------- | -------------------- | -------------------------- |
| Staff          | No                      | Yes (CSV)            | LOW                        |
| Finance        | Yes (hardcoded budget)  | Yes (FMS import)     | MEDIUM (banner added)      |
| Attendance     | Yes (30 demo pupils)    | No (manual only)     | HIGH                       |
| SEND           | Yes (15 demo pupils)    | No (manual only)     | HIGH                       |
| Behaviour      | Yes (40 demo incidents) | No (manual only)     | HIGH                       |
| Cover          | Yes (demo absences)     | No                   | MEDIUM (hidden from pilot) |
| Performance    | Yes (demo cycle)        | No                   | LOW (hidden from pilot)    |
| Estates Energy | Yes (hardcoded meters)  | No                   | LOW                        |

## Recommendations

1. **Add UI demo data banner** for Attendance, SEND, and Behaviour pages when API returns `is_demo`/`demo` flag
2. **Build MIS CSV import** for pupil data (attendance, SEND, behaviour all need it)
3. **Label imported data** with source system and import date
4. **Never auto-display demo data** without visual indicator — current pattern is misleading
