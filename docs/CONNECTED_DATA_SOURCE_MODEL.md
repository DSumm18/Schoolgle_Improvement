# Connected Data Source Model

**Date:** 2026-03-19
**Purpose:** Define Schoolgle's data architecture as a connected-source platform, not a standalone system of record

---

## Core Architecture Principle

Schoolgle is a **connected data platform**. Schools provide structured source data via:

1. **Google Drive** — folders linked by share URL or OAuth, auto-scanned for structure
2. **OneDrive** — API-ready (code implemented, not yet wired to UI)
3. **Spreadsheet exports** — CSV/XLSX from MIS, FMS, payroll, HR systems
4. **Direct API** — Wonde connector for Arbor/SIMS/Bromcom (code exists, needs API key)
5. **Manual entry** — UI forms for data that originates in Schoolgle

This is not a workaround. This is the intended operating model.

---

## The Five Data Layers

### Layer 1: Cloud Storage Connection

Schools link a Google Drive folder. Schoolgle auto-detects structure using folder naming patterns:

| Pattern                    | Category    | Modules Powered             |
| -------------------------- | ----------- | --------------------------- |
| "pupil data", "pupil roll" | pupils      | Attendance, SEND, Behaviour |
| "attendance"               | attendance  | Attendance                  |
| "assessment", "tracker"    | assessments | Intelligence                |
| "behaviour"                | behaviour   | Behaviour                   |
| "staff", "hr"              | staff       | HR, Meetings, Documents     |
| "budget", "finance", "fms" | fms         | Finance                     |
| "payroll"                  | payroll     | ICFP, Strategic Plan        |
| "dfe", "external"          | dfe         | Intelligence                |
| "document", "policies"     | documents   | Compliance, Governance      |

**Table:** `school_data_connections` — stores folder_id, provider, detected_folders, total_files, last_scan_at

### Layer 2: Smart Ingest & Field Matching (Canvas)

When a file is uploaded or downloaded from cloud storage, Canvas analyses it:

- Auto-detects source system (Arbor, SIMS, Bromcom, Every HR, Sage, etc.)
- Matches columns using 40+ data fingerprints (UPN, NI number, pay scale, CFR code, etc.)
- Returns suggested mappings with confidence scores
- Network-effect registry learns from every school's approved mappings
- **No data persisted until user approves**

**Tables:** `canvas_source_signatures`, `canvas_field_mappings`

### Layer 3: Validated Import

Once mappings are approved, data flows to module-specific tables:

| Import Path       | Target Tables                                                                                                                      | Validation                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Staff CSV         | `staff_directory`                                                                                                                  | Fuzzy role matching, email dedup               |
| MIS Sync          | `staff_directory`, `staff_contracts`, `staff_dbs_records`, `staff_training_records`, `staff_qualifications`, `staff_right_to_work` | 6 tables populated from single sync            |
| Pupil CSV         | `pupils`                                                                                                                           | Year group normalisation, DfE SEN codes        |
| Finance FMS       | `finance_transactions`, `finance_budget_lines`, `finance_suppliers`                                                                | Checksum dedup, reversal matching, CFR mapping |
| Pupil Assessments | `pupil_assessments_pseudo`, `pupil_analysis_insights`                                                                              | HMAC-SHA256 pseudonymised, zero PII            |
| Estates Evidence  | `estates_evidence`                                                                                                                 | MIME type + size validation                    |
| Document Extract  | `extracted_data` → `validated_data`                                                                                                | AI extraction + human review                   |

### Layer 4: Schoolgle-Managed Data

On top of imported source data, Schoolgle adds its own workflow layer:

| Data Type       | Examples                                | Tables                                                              |
| --------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Actions & Tasks | Improvement actions, compliance tasks   | `actions`, `tasks`                                                  |
| Risk Register   | Risks, mitigations, decisions           | `risk_register`, `risk_mitigations`, `risk_decisions`               |
| Compliance      | Policies, training, GDPR records        | `compliance_items`, `compliance_versions`                           |
| Governance      | Board, governors, meetings, visits      | `governance_boards`, `governors`, `governor_meetings`               |
| Estates         | Assets, contractors, helpdesk tickets   | `estates_assets`, `estates_contractors`, `estates_helpdesk_tickets` |
| Meetings        | Agendas, minutes, signatures            | `meetings`, `meeting_attendees`, `meeting_minutes`                  |
| Documents       | Generated letters, reports, newsletters | `document_templates`, `generated_documents`                         |
| Surveys         | Questionnaires, responses, analysis     | `surveys`, `survey_questions`, `survey_responses`                   |

### Layer 5: Intelligence & Reporting

Cross-references imported + managed data to generate insights:

- DfE warehouse data (pre-populated: attendance, census, KS2, workforce, exclusions)
- EEF strategy matching (33 strategies ranked by impact × evidence)
- Cohort tracking with COVID impact adjustment
- Cross-module signals (estates alerts, compliance gaps, HR risks)

---

## Privacy Architecture

| Data Type            | Storage Model                                   | PII Handling                  |
| -------------------- | ----------------------------------------------- | ----------------------------- |
| MIS data             | **Zero storage** — read, process, discard       | Never persists                |
| Payroll              | **Zero storage** — parse, analyse, discard      | Never persists                |
| Pupil assessments    | **Pseudonymised** — HMAC-SHA256 client-side     | Server never sees names       |
| Staff records        | **Stored** — needed for HR, documents, meetings | Org-scoped, role-protected    |
| Finance transactions | **Stored** — needed for budget analysis         | Org-scoped, SLT-only access   |
| Estates evidence     | **Stored** — files needed for compliance        | Org-scoped, caretaker+ access |

---

## Source System Compatibility

| System          | Data Types                                        | Import Method               | Status                      |
| --------------- | ------------------------------------------------- | --------------------------- | --------------------------- |
| **Arbor**       | Pupils, attendance, behaviour, staff, assessments | Drive export or Wonde API   | FUNCTIONAL                  |
| **SIMS**        | Pupils, attendance, staff                         | Drive export                | FUNCTIONAL                  |
| **Bromcom**     | Pupils, attendance, staff                         | Drive export                | FUNCTIONAL                  |
| **ScholarPack** | Pupils, attendance                                | Drive export (CSV)          | FUNCTIONAL (CSV path)       |
| **SIMS FMS**    | Budget, transactions                              | Excel export                | FUNCTIONAL                  |
| **Access FMS**  | Budget, transactions                              | Excel export                | FUNCTIONAL                  |
| **Sage**        | Payroll, finance                                  | CSV export                  | FUNCTIONAL                  |
| **Civica**      | Finance                                           | Excel export                | FUNCTIONAL                  |
| **Every HR**    | Staff contracts, training                         | CSV export or Canvas ingest | FUNCTIONAL                  |
| **LA Payroll**  | Payroll summaries                                 | CSV export                  | FUNCTIONAL                  |
| **DfE**         | KS2 results, attendance, census                   | Pre-populated warehouse     | FUNCTIONAL                  |
| **Wonde**       | All MIS data (live API)                           | REST API                    | CODE EXISTS (needs API key) |

---

## What This Means for Pilot Readiness

Previous assessments marked several modules as "no bulk import" or "demo data only". This was **incorrect** when the full connected data architecture is considered:

| Module       | Previous Assessment    | Corrected Assessment                                                                |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| Staff        | "CSV import works"     | **12+ intake paths**: CSV, MIS sync (6 tables), Drive export, Canvas ingest         |
| Finance      | "Demo data, no import" | **FMS import fully functional**: Excel/CSV with validation, dry-run, reconciliation |
| Intelligence | "Requires DfE data"    | **3 intake paths**: Pseudonymised CSV, MIS read, DfE warehouse (pre-populated)      |
| Payroll/ICFP | "Not assessed"         | **Privacy-first parser**: Zero-storage analysis from any payroll CSV                |
| Attendance   | "Manual only"          | **MIS read path exists**: Arbor attendance exports readable via Drive/Wonde         |
| Estates      | "System of record"     | **Plus evidence upload + document extraction** with AI-powered field detection      |
