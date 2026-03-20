# Data Contract Matrix

**Date:** 2026-03-19
**Purpose:** Define the expected structure for each school-supplied data source

---

## What This Document Is

Each school connecting to Schoolgle may provide data via spreadsheets, exports, or cloud folders. This matrix defines the expected structure for each data type so that:

- Schools know what to provide
- Import validation can check against these contracts
- Canvas field matching can use these as target schemas

---

## 1. Staff Data

**Source:** MIS export, HR spreadsheet, or manual CSV
**API:** `POST /api/staff/import` or `POST /api/mis/sync?type=staff`
**Target table:** `staff_directory`

| Column        | Required | Type    | Validation                     | Notes                                       |
| ------------- | -------- | ------- | ------------------------------ | ------------------------------------------- |
| first_name    | YES      | Text    | Not empty                      |                                             |
| last_name     | YES      | Text    | Not empty                      |                                             |
| job_title     | YES      | Text    | Not empty                      |                                             |
| email         | No       | Email   | Format check                   | Used for dedup                              |
| employee_id   | No       | Text    |                                | Used for dedup                              |
| phone         | No       | Text    |                                |                                             |
| salutation    | No       | Text    | Mr/Mrs/Ms/Dr/Prof/Miss         |                                             |
| role_category | No       | Text    | Fuzzy matched to 13 categories | "Head"→headteacher, "TA"→teaching_assistant |
| is_active     | No       | Boolean | yes/no/true/false/y/n/1/0      | Default: true                               |
| is_super_user | No       | Boolean | Same as above                  | Default: false                              |

**Fuzzy role mappings:** head→headteacher, deputy/dht→deputy_headteacher, teacher→class_teacher, ta/ta2→teaching_assistant, senco→sendco, sbm→business_manager, site/facilities→site_manager, admin→support_staff

---

## 2. Pupil Data

**Source:** MIS export or manual CSV
**API:** `POST /api/pupils`
**Target table:** `pupils`

| Column           | Required | Type    | Validation             | Notes                                                |
| ---------------- | -------- | ------- | ---------------------- | ---------------------------------------------------- |
| pupil_id         | YES      | Text    | Unique per org         | School-assigned or MIS ID                            |
| first_name       | YES      | Text    | Not empty              |                                                      |
| last_name        | YES      | Text    | Not empty              |                                                      |
| year_group       | YES      | Text    | Normalised: R/N/1-13   | "Year 3"→"3", "Reception"→"R"                        |
| class_name       | No       | Text    |                        | e.g., "3A", "Oak"                                    |
| gender           | No       | Text    | M/F/O (normalised)     | "Female"→"F", "Boy"→"M"                              |
| date_of_birth    | No       | Date    | YYYY-MM-DD             |                                                      |
| pupil_ref        | No       | Text    |                        | MIS reference (e.g., ARB-100001)                     |
| is_pupil_premium | No       | Boolean |                        |                                                      |
| is_eal           | No       | Boolean |                        |                                                      |
| is_looked_after  | No       | Boolean |                        |                                                      |
| sen_status       | No       | Text    | K/E/monitoring/removed | DfE SEN status codes                                 |
| primary_need     | No       | Text    | DfE codes              | SPLD/MLD/SLD/PMLD/SEMH/SLCN/HI/VI/MSI/PD/ASD/OTH/NSA |
| fsm_eligible     | No       | Boolean |                        |                                                      |
| ethnicity        | No       | Text    | DfE codes              | WBRI/AIND/APKN etc.                                  |

---

## 3. Finance — Budget/FMS Export

**Source:** FMS system export (SIMS FMS, Access, Sage, Civica, Bromcom)
**API:** `POST /api/finance/import`
**Target tables:** `finance_transactions`, `finance_budget_lines`, `finance_suppliers`

| Column                 | Required | Type   | Validation         | Notes                                   |
| ---------------------- | -------- | ------ | ------------------ | --------------------------------------- |
| Cost Centre / CFR Code | YES      | Text   | E01-E99 or I01-I99 | DfE Consistent Financial Reporting code |
| Description            | YES      | Text   |                    | Budget line description                 |
| Budget Amount          | No       | Number |                    | Annual budget allocation                |
| Actual Amount          | No       | Number |                    | Year-to-date spend                      |
| Committed              | No       | Number |                    | Purchase orders not yet invoiced        |
| Transaction Date       | No       | Date   |                    | For individual transactions             |
| Supplier               | No       | Text   | Auto-normalised    | De-duplicated on import                 |
| Reference              | No       | Text   |                    | Invoice/PO number                       |
| Transaction Type       | No       | Text   | GL/PO/AP/SI/SC     | Auto-detected                           |

**Supported FMS formats:** SIMS FMS Budget Monitor, Bromcom Finance Export, Access Budget Report, Civica Financial Summary, Sage Transaction List

---

## 4. Payroll Summary

**Source:** Payroll system export or LA payroll report
**API:** `POST /api/payroll/parse`
**Storage:** NONE (zero-storage, analysis only)

| Column                 | Required | Type   | Validation                    | Notes                |
| ---------------------- | -------- | ------ | ----------------------------- | -------------------- |
| Name / Surname         | YES      | Text   |                               | Staff identification |
| Salary / Annual Salary | YES      | Number | £15k-£135k range              |                      |
| Role / Job Title       | No       | Text   |                               |                      |
| FTE                    | No       | Number | 0.0-1.0                       | Full-time equivalent |
| Pay Scale              | No       | Text   | M1-M6, U1-U3, L1-L43, SCP1-43 | Auto-classified      |
| Start Date             | No       | Date   |                               |                      |
| Contract Type          | No       | Text   | Permanent/Fixed-term/Bank     |                      |

**Output:** Staffing summary for ICFP analysis (total FTE, costs by category, staffing %)

---

## 5. Pupil Assessments (Pseudonymised)

**Source:** Assessment tracker export (Arbor, SIMS, Insight, Target Tracker, FFT)
**API:** `POST /api/intelligence/pupil-assessments`
**Target tables:** `school_assessment_imports`, `pupil_assessments_pseudo`, `pupil_analysis_insights`
**Privacy:** HMAC-SHA256 client-side pseudonymisation — server never sees pupil names

| Column             | Required | Type    | Validation                         | Notes                                  |
| ------------------ | -------- | ------- | ---------------------------------- | -------------------------------------- |
| pupil_hash         | YES      | Text    | 32+ chars (HMAC-SHA256)            | Client-side hash, not real name        |
| year_group         | YES      | Number  | 1-13                               |                                        |
| subject            | YES      | Text    | reading/writing/maths/science/etc. |                                        |
| attainment_level   | YES      | Text    | WTS/EXS/GDS/PKF                    | Working Towards/Expected/Greater Depth |
| is_fsm             | No       | Boolean |                                    | Free School Meals                      |
| is_send            | No       | Boolean |                                    | SEN Support or EHCP                    |
| is_eal             | No       | Boolean |                                    | English as Additional Language         |
| is_pp              | No       | Boolean |                                    | Pupil Premium                          |
| gender             | No       | Text    | M/F/O                              |                                        |
| scaled_score       | No       | Number  |                                    | KS2 scaled score                       |
| teacher_assessment | No       | Text    |                                    | Teacher judgement                      |
| progress_score     | No       | Number  |                                    | Value-added measure                    |

---

## 6. Attendance Data

**Source:** MIS export via cloud storage
**API:** `GET /api/mis/read?type=attendance`
**Storage:** Zero-storage (read, process, display)

| Column     | Expected | Type | Notes                                                                               |
| ---------- | -------- | ---- | ----------------------------------------------------------------------------------- |
| pupil_id   | YES      | Text | MIS student ID                                                                      |
| pupil_name | YES      | Text |                                                                                     |
| date       | YES      | Date |                                                                                     |
| session    | YES      | Text | AM/PM                                                                               |
| mark       | YES      | Text | DfE code: /, \, B, C, D, E, G, H, I, J, L, M, N, O, P, R, S, T, U, V, W, X, Y, Z, # |
| year_group | No       | Text |                                                                                     |
| class      | No       | Text |                                                                                     |

---

## 7. Estates Evidence Documents

**Source:** Scanned certificates, inspection reports, invoices
**API:** `POST /api/estates/evidence`
**Target table:** `estates_evidence`

| Field             | Required | Type | Validation                                                             |
| ----------------- | -------- | ---- | ---------------------------------------------------------------------- |
| file              | YES      | File | PDF/JPEG/PNG/GIF/WebP/HEIC/Word/Excel/PowerPoint/CSV/text              |
| title             | YES      | Text |                                                                        |
| evidence_type     | YES      | Text | certificate/invoice/inspection/incident_report/training/dbs_check/etc. |
| compliance_domain | No       | Text | fire/asbestos/legionella/electrical/gas/etc.                           |
| expiry_date       | No       | Date | For certificates                                                       |
| Max file size     | —        | —    | 50MB                                                                   |

---

## 8. Cloud Storage Folder Structure

**Source:** Google Drive or OneDrive shared folder
**API:** `POST /api/data-connections/link`

**Expected folder structure (auto-detected):**

```
School Data/
├── Staff/
│   ├── staff_list_2026.csv
│   └── contracts/
├── Pupils/
│   ├── pupil_roll_spring_2026.xlsx
│   └── sen_register.csv
├── Finance/
│   ├── budget_monitor_march_2026.xlsx
│   └── fms_transactions_q3.csv
├── Payroll/
│   └── payroll_summary_march_2026.csv
├── Attendance/
│   └── attendance_termly_spring_2026.xlsx
├── Assessments/
│   └── ks2_tracker_2026.csv
├── Documents/
│   ├── policies/
│   └── governance/
└── DfE/
    └── performance_tables_2025.xlsx
```

Schools don't need to follow this exact structure — Canvas auto-detects patterns in folder names and file contents.
