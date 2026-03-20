# Module-to-Source Dependency Map

**Date:** 2026-03-19
**Purpose:** Map every pilot module to its data sources, distinguishing school-supplied from Schoolgle-managed data

---

## Legend

- **SOR** = System of Record (data originates in Schoolgle)
- **IMP** = Imported from school source system
- **DER** = Derived from other modules
- **PRE** = Pre-populated (DfE warehouse)

---

## Module Map

### 1. Staff Directory (HR → People)

| Data                                | Type | Source                | Import Path                             | Status     |
| ----------------------------------- | ---- | --------------------- | --------------------------------------- | ---------- |
| Staff names, roles, contacts        | IMP  | MIS or HR spreadsheet | CSV via `/api/staff/import`             | FUNCTIONAL |
| Staff contracts, DBS, training      | IMP  | MIS export            | MIS sync via `/api/mis/sync?type=staff` | FUNCTIONAL |
| Staff qualifications, right-to-work | IMP  | MIS export            | MIS sync (same as above)                | FUNCTIONAL |
| Module access, permissions          | SOR  | Schoolgle UI          | Manual assignment                       | FUNCTIONAL |
| Staff notes, reviews                | SOR  | Schoolgle UI          | Manual entry                            | FUNCTIONAL |

**Cloud Drive path:** School drops staff export in Drive → Schoolgle detects "staff" folder → file available for download + import

---

### 2. Risk Register

| Data                 | Type | Source                | Import Path         | Status     |
| -------------------- | ---- | --------------------- | ------------------- | ---------- |
| Risk entries, scores | SOR  | Schoolgle UI or Ed AI | Manual or Ed skills | FUNCTIONAL |
| Mitigations          | SOR  | Schoolgle UI or Ed AI | Manual or Ed skills | FUNCTIONAL |
| 4T Decisions         | SOR  | Schoolgle UI or Ed AI | Manual or Ed skills | FUNCTIONAL |
| Score history        | DER  | Auto-calculated       | On risk update      | FUNCTIONAL |

**No external import needed** — this is a pure system of record.

---

### 3. Compliance Hub

| Data                             | Type    | Source                | Import Path                  | Status     |
| -------------------------------- | ------- | --------------------- | ---------------------------- | ---------- |
| Policy templates                 | PRE     | Schoolgle (36 seeded) | Pre-loaded                   | FUNCTIONAL |
| Policy versions, reviews         | SOR     | Schoolgle UI          | Manual creation              | FUNCTIONAL |
| Training completions             | SOR/IMP | Manual or MIS sync    | Staff training from MIS sync | FUNCTIONAL |
| DBS/SCR records                  | SOR/IMP | Manual or MIS sync    | Staff DBS from MIS sync      | FUNCTIONAL |
| GDPR records (DPIA, SAR, Breach) | SOR     | Schoolgle UI          | Manual creation              | FUNCTIONAL |
| Complaints, concerns, consent    | SOR     | Schoolgle UI          | Manual creation              | FUNCTIONAL |

**Cross-module enrichment:** Training expiry feeds Unified Tasks. Policy review dates feed compliance reminders.

---

### 4. Estates & Compliance

| Data                      | Type    | Source                        | Import Path                | Status     |
| ------------------------- | ------- | ----------------------------- | -------------------------- | ---------- |
| Assets, locations         | SOR     | Schoolgle UI                  | Manual creation            | FUNCTIONAL |
| Contractors               | SOR     | Schoolgle UI                  | Manual creation            | FUNCTIONAL |
| Helpdesk tickets          | SOR     | Schoolgle UI or Ed AI         | Manual or Ed skills        | FUNCTIONAL |
| Compliance tasks          | SOR     | Schoolgle UI                  | Manual or seeded schedules | FUNCTIONAL |
| Evidence documents        | IMP     | Uploaded files or Drive links | `/api/estates/evidence`    | FUNCTIONAL |
| Extracted document fields | DER     | AI extraction                 | `/api/documents/extract`   | FUNCTIONAL |
| Energy meter readings     | SOR/IMP | Manual or photo extraction    | UI or AI extraction        | FUNCTIONAL |

**Evidence flows from school files** (certificates, inspection reports) through upload + AI extraction + human validation.

---

### 5. Governance

| Data                 | Type | Source       | Import Path     | Status     |
| -------------------- | ---- | ------------ | --------------- | ---------- |
| Governors, board     | SOR  | Schoolgle UI | Manual creation | FUNCTIONAL |
| Meetings, attendance | SOR  | Schoolgle UI | Manual creation | FUNCTIONAL |
| Training matrix      | SOR  | Schoolgle UI | Manual creation | FUNCTIONAL |
| Policies, visits     | SOR  | Schoolgle UI | Manual creation | FUNCTIONAL |

**No external import needed** — pure system of record with manual entry.

---

### 6. Meetings

| Data                | Type | Source          | Import Path                 | Status     |
| ------------------- | ---- | --------------- | --------------------------- | ---------- |
| Meeting details     | SOR  | Schoolgle UI    | Manual creation             | FUNCTIONAL |
| Attendees           | DER  | Staff directory | Lookup from staff_directory | FUNCTIONAL |
| Minutes, signatures | SOR  | Schoolgle UI    | Manual or AI-assisted       | FUNCTIONAL |
| Linked actions      | DER  | Actions module  | FK to actions table         | FUNCTIONAL |

**Cross-module:** Attendees resolved from staff directory. Documents can pull meeting data for placeholder resolution.

---

### 7. Documents

| Data                      | Type | Source                 | Import Path                | Status     |
| ------------------------- | ---- | ---------------------- | -------------------------- | ---------- |
| Templates                 | PRE  | Schoolgle (38 seeded)  | Pre-loaded                 | FUNCTIONAL |
| Generated content         | DER  | 6 cross-module sources | Placeholder resolver       | FUNCTIONAL |
| Staff data in docs        | DER  | Staff directory        | Live query                 | FUNCTIONAL |
| Organisation data in docs | DER  | Organisation settings  | Live query                 | FUNCTIONAL |
| Meeting data in docs      | DER  | Meetings module        | Live query                 | FUNCTIONAL |
| Absence data in docs      | DER  | HR sickness records    | Live query + Bradford calc | FUNCTIONAL |
| Contractor data in docs   | DER  | Estates contractors    | Live query                 | FUNCTIONAL |

**Strongest cross-module integration** — pulls live data from 6 sources at generation time.

---

### 8. Surveys

| Data               | Type | Source             | Import Path            | Status     |
| ------------------ | ---- | ------------------ | ---------------------- | ---------- |
| Survey definitions | SOR  | Schoolgle UI or AI | Manual or AI-generated | FUNCTIONAL |
| Responses          | SOR  | Respondents        | Form submission        | FUNCTIONAL |
| Analysis           | DER  | AI analysis        | On-demand              | FUNCTIONAL |

**No external import needed** — self-contained.

---

### 9. Attendance

| Data                   | Type    | Source                    | Import Path                                      | Status     |
| ---------------------- | ------- | ------------------------- | ------------------------------------------------ | ---------- |
| Daily registers        | SOR/IMP | Manual UI or MIS read     | Manual marks or `/api/mis/read?type=attendance`  | FUNCTIONAL |
| Pupil list             | IMP     | MIS export                | Drive folder → detected as "attendance" category | FUNCTIONAL |
| Summaries, PA tracking | DER     | Calculated from registers | Auto-aggregated                                  | FUNCTIONAL |
| Interventions          | SOR     | Schoolgle UI              | Manual creation                                  | FUNCTIONAL |

**When no data:** Shows demo data with visible banner. School can either mark registers manually or connect MIS export via Drive.

---

### 10. SEND

| Data               | Type    | Source               | Import Path           | Status     |
| ------------------ | ------- | -------------------- | --------------------- | ---------- |
| SEN register       | SOR/IMP | SENCO records or MIS | Manual UI or MIS read | FUNCTIONAL |
| Graduated approach | SOR     | SENCO records        | Manual creation       | FUNCTIONAL |
| Provision map      | SOR     | SENCO records        | Manual creation       | FUNCTIONAL |
| EHCP tracking      | SOR     | SENCO records        | Manual creation       | FUNCTIONAL |

**Pupil data dependency:** If pupils imported via CSV (`/api/pupils`), SEN-flagged pupils have `sen_status` and `primary_need` fields already populated.

---

### 11. Behaviour

| Data       | Type    | Source                    | Import Path                                 | Status     |
| ---------- | ------- | ------------------------- | ------------------------------------------- | ---------- |
| Incidents  | SOR/IMP | Manual or MIS export      | Manual UI or `/api/mis/read?type=behaviour` | FUNCTIONAL |
| Exclusions | SOR     | Schoolgle UI              | Manual creation                             | FUNCTIONAL |
| Patterns   | DER     | Calculated from incidents | Auto-aggregated                             | FUNCTIONAL |

---

### 12. School Intelligence

| Data                       | Type | Source                        | Import Path                                                 | Status     |
| -------------------------- | ---- | ----------------------------- | ----------------------------------------------------------- | ---------- |
| DfE warehouse (5 datasets) | PRE  | DfE Explore Education Stats   | Pre-populated                                               | FUNCTIONAL |
| Pupil assessments          | IMP  | MIS tracker export            | Pseudonymised CSV via `/api/intelligence/pupil-assessments` | FUNCTIONAL |
| Contextual factors         | SOR  | School admin                  | Manual entry                                                | FUNCTIONAL |
| Analysis results           | DER  | AI cross-referencing          | On-demand via `SchoolIntelligenceEngine`                    | FUNCTIONAL |
| EEF recommendations        | DER  | Matched from 33 strategies    | Auto-matched to gaps                                        | FUNCTIONAL |
| Cohort tracking            | DER  | KS2 data + year group mapping | `cohort_reception_year = academic_year - year_group`        | FUNCTIONAL |

**Most data-rich module** — combines pre-populated DfE data, school-supplied assessments, and AI-generated insights.

---

### 13. Calendar

| Data                   | Type | Source       | Import Path     | Status     |
| ---------------------- | ---- | ------------ | --------------- | ---------- |
| Term dates             | SOR  | School admin | Manual creation | FUNCTIONAL |
| Events                 | SOR  | School admin | Manual creation | FUNCTIONAL |
| Parents' evening slots | SOR  | School admin | Manual creation | FUNCTIONAL |

**No external import needed.**

---

### 14. Finance (Hidden from Pilot)

| Data                | Type    | Source                  | Import Path                           | Status     |
| ------------------- | ------- | ----------------------- | ------------------------------------- | ---------- |
| Budget/transactions | IMP     | FMS export              | Excel/CSV via `/api/finance/import`   | FUNCTIONAL |
| Suppliers           | IMP/DER | From FMS import         | Auto-extracted + normalised           | FUNCTIONAL |
| Budget analysis     | DER     | Calculated from imports | CFR code grouping                     | FUNCTIONAL |
| Payroll summary     | IMP     | Payroll CSV             | Zero-storage via `/api/payroll/parse` | FUNCTIONAL |
| ICFP metrics        | DER     | Payroll + budget data   | Calculated                            | FUNCTIONAL |

**Note:** Backend is fully functional. Hidden from pilot because dashboard doesn't display imported data (shows demo instead). This is a **UI wiring issue**, not a data architecture issue.

---

## Source Data vs Schoolgle Data — Clear Separation

| Layer                       | Owned By                         | Examples                                                     | Editable in Schoolgle?         |
| --------------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------ |
| **Source data**             | School (via MIS, FMS, HR system) | Staff records, pupil rolls, budgets, attendance, assessments | Only via re-import from source |
| **Schoolgle workflow**      | Schoolgle                        | Actions, risks, compliance, meetings, documents, surveys     | YES — full CRUD                |
| **Derived intelligence**    | Schoolgle (AI)                   | Analysis results, EEF recommendations, cohort trends         | Regenerated on demand          |
| **Pre-populated reference** | DfE                              | KS2 results, census, attendance, workforce, exclusions       | NO — read-only                 |
