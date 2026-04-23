# Aurora Primary School - Data Connector Matrix

## Overview

This matrix shows which data sources connect to which modules and apps in Schoolgle. Use this to understand what data needs to be imported and where it will surface.

---

## Data Flow Matrix

| Data Source | Template | Primary Tables | Connected Modules/Apps | Notes |
|--------------|----------|----------------|----------------------|-------|
| **Staff Directory** | `01_STAFF_DIRECTORY.csv` | `staff_directory` | HR & People, Governance, Actions Hub, Risk Register | employee_id links to all HR tables |
| **Emergency Contacts** | `02_STAFF_EMERGENCY_CONTACTS.csv` | `staff_emergency_contacts` | HR & People | Linked via staff_id |
| **Qualifications** | `03_STAFF_QUALIFICATIONS.csv` | `staff_qualifications` | HR & People, Compliance (training) | Linked via staff_id |
| **Training Records** | `04_STAFF_TRAINING.csv` | `staff_training_records` | HR & People, Compliance | Linked via staff_id |
| **DBS Records** | `05_STAFF_DBS_RECORDS.csv` | `staff_dbs_records` | Compliance, HR & People | Linked via staff_id |
| **Pupils Master** | `06_PUPILS_MASTER.csv` | `pupils` | Teaching & Learning, Attendance, Behaviour, SEND, Interventions | pupil_id links to all pupil tables |
| **Classes/Groups** | `07_CLASSES_AND_GROUPS.csv` | N/A (derived from pupils) | Teaching & Learning, Timetable | Links pupils to classes |
| **Budget** | `09_BUDGET_TEMPLATE.xlsx` | `budget_lines`, `finance_reconciliation_log` | Finance, Risk Register (ICFP) | CFR codes mapped |
| **Payroll** | `10_PAYROLL_IMPORT.csv` | `finance_reconciliation_log` | Finance, HR & People | Reconciliation only |
| **Contractors** | `11_CONTRACTORS.csv` | `estates_contractors`, `finance_suppliers` | Estates, Finance | Shared supplier table |
| **Assets** | `12_ASSETS_REGISTER.csv` | `estates_assets` | Estates | QR code generation |
| **Policies** | `13_COMPLIANCE_POLICIES.csv` | `compliance_policies` | Compliance, Governance | Policy tracker |
| **Data Sources** | `14_DATA_SOURCE_CONNECTIONS.csv` | `data_sources`, `school_data_connections` | Canvas (Data Intelligence) | MIS credentials (encrypted) |

---

## Module-to-Data Dependencies

### HR & People Module
```
staff_directory (STF001 ──────┬──────── staff_emergency_contacts
                                   │
                                   ├──────── staff_qualifications
                                   │
                                   ├──────── staff_training_records
                                   │
                                   ├──────── staff_dbs_records
                                   │
                                   ├──────── staff_right_to_work
                                   │
                                   ├──────── staff_medical_info
                                   │
                                   └──────── staff_disciplinary
```

### Governance Module
```
staff_directory ─────── governors (via staff_connector)
budget_lines ─�────────── finance_oversight (reports)
policies ────────────────── governance_policy_tracker
```

### Estates Module
```
contractors ─────────────── estates_contractors
assets_register ────────── estates_assets
budget_lines ──────────── estates_budget (energy, maintenance)
```

### Finance Module
```
budget_lines (CFR codes) ─┬── finance_dashboard
                         ├── icfp_staffing_modeller
                         ├── budget_monitor
                         └── finance_reconciliation_log (← payroll imports)
```

### Teaching & Learning Module
```
pupils (P101R001) ──────────┬── pupil_assessment_analyser
                              │
                              ├── interventions_tracker
                              │
                              ├── class_assignments
                              │
                              └── lesson_studio ( pupil context)
```

### Attendance Module
```
pupils ──────────────────── attendance_register (daily)
classes ───────────────── class_attendance_summary
```

### Behaviour Module
```
pupils ──────────────────── behaviour_incidents
pupils ──────────────────── behaviour_exclusions
```

### SEND Module
```
pupils ──────────────────── send_register
pupils ──────────────────── send_provision_costs
pupils ──────────────────── send_ehcp_annual_reviews
```

### Compliance Module
```
staff_directory ────────── compliance_training_tracker
policies ───────────────── compliance_policy_tracker
staff_training_records ─── compliance_training_completion
budget_lines ──────────── finance_compliance ( CFR I03 )
```

### Risk Register Module
```
budget_lines ──────────── risk_financial_exposure
staff_directory ────────── risk_staffing_key_personnel
estates_assets ────────── risk_premises_infrastructure
```

### Canvas (Data Intelligence)
```
ALL data sources ─────────── canvas_field_mappings (auto-learn)
payroll ────────────────── canvas_reconciliation_log
MIS exports ───────────── data_sources (auto-detected)
```

---

## Identifier Join Keys

### Staff Links
```
employee_id (e.g., STF001)
    │
    ├──► staff_directory.id (or employee_id field)
    ├──► staff_emergency_contacts.staff_id
    ├──► staff_qualifications.staff_id
    ├──► staff_training_records.staff_id
    ├──► staff_dbs_records.staff_id
    ├──► staff_right_to_work.staff_id
    ├──► staff_medical_info.staff_id
    └──► staff_disciplinary.staff_id
```

### Pupil Links
```
pupil_id (e.g., P101R001)
    │
    ├──► pupils.pupil_id
    ├──► attendance.pupil_id (when implemented)
    ├──► behaviour_incidents.pupil_id (when implemented)
    ├──► send_register.pupil_id (when implemented)
    └──► pupil_assessments.pupil_pseudo (pseudonymised)
```

### Organization Isolation
```
organization_id (UUID)
    │
    ├──► All staff records (filter by org)
    ├──► All pupil records (filter by org)
    ├──► All financial data (filter by org)
    └──► All governance data (filter by org)
```

---

## Cross-Module Data Sharing

### Example: DSL (Designated Safeguarding Lead)

| Module | How It Connects | Data Shown |
|--------|----------------|-------------|
| **HR** | `staff_connectors` table | DSL staff_id, role |
| **Compliance** | Training records | Safeguarding training completion |
| **Safeguarding** | `staff_directory.safeguarding_training` | DSL status, last training |
| **Governance** | Governors table | DSL governor liaison |
| **Estates** | Site manager via `staff_connectors` | Site-specific concerns |

**Implementation:**
1. HR maintains `staff_connectors` with `connector_type = 'DSL'`
2. Each module queries by connector type to identify DSL
3. PII (name, email) stored in `staff_directory`, looked up when needed
4. `employee_id` used as foreign key where needed

### Example: Budget to ICFP (Integrated Curriculum Financial Planning)

| Module | How It Connects | Data Shown |
|--------|----------------|-------------|
| **Finance** | `budget_lines` table | CFR code breakdown |
| **Risk** | `finance_reconciliation_log` | Budget vs actual variance |
| **ICFP** | `icfp_staffing_modeller` | Salary costs from budget |
| **Staff** | `staff_directory` | FTE, pay scale |

**Implementation:**
1. Budget template uses CFR codes (E01-E07, I01-I09)
2. Canvas maps CFR codes to `cfr_code` field in `budget_lines`
3. ICFP module queries by `cfr_code` = 'E01' (teaching staff)
4. Reconciliation log tracks budget vs actual

---

## Data Validation Rules

### Staff Data
```
employee_id: Required, unique, format STF###
email: Required, unique per organization
role_category: Required, must match enum values
payroll_number: Should be unique if present
```

### Pupil Data
```
pupil_id: Required, unique per organization
year_group: Required, format R/1-13
class_name: Optional, free text
sen_status: If set, primary_need should also be set
```

### Budget Data
```
cfr_code: Must match valid CFR code
budget_y1/y2/y3: Numeric, >= 0
actual_y1: Numeric, <= budget_y1 (for variance calculation)
```

---

## Import Order & Dependencies

### Phase 1: Foundation (Must be first)
1. **00_SETUP_ORGANIZATION.csv** - Creates org, required for all other imports
2. **01_STAFF_DIRECTORY.csv** - Staff records, basis for HR/Governance/Compliance

### Phase 2: HR Core (After staff_directory exists)
3. **02_STAFF_EMERGENCY_CONTACTS.csv**
4. **03_STAFF_QUALIFICATIONS.csv**
5. **04_STAFF_TRAINING.csv**
6. **05_STAFF_DBS_RECORDS.csv**

### Phase 3: Pupil Core (After organization exists)
7. **06_PUPILS_MASTER.csv**
8. **07_CLASSES_AND_GROUPS.csv**

### Phase 4: Organization-Wide (Can run in parallel)
9. **09_BUDGET_TEMPLATE.xlsx**
10. **11_CONTRACTORS.csv**
11. **12_ASSETS_REGISTER.csv**
12. **13_COMPLIANCE_POLICIES.csv**
13. **14_DATA_SOURCE_CONNECTIONS.csv**

### Phase 5: Ongoing (Monthly/Weekly)
14. **10_PAYROLL_IMPORT.csv** - Monthly reconciliation

---

## Error Prevention

### Unique Identifier Conflicts
- **Staff**: `employee_id` unique per org, but same ID reused across orgs is OK
- **Pupils**: `pupil_id` includes year group prefix for uniqueness

### Orphaned Records
- Foreign key constraints prevent deletion of staff with dependent records
- Soft deletes (`is_active = false`) recommended instead of hard deletes

### Data Validation at Import
- **Required fields**: Checked before import, fail fast if missing
- **Enum values**: Validated against database constraints
- **Date formats**: ISO 8601 (YYYY-MM-DD) or UK format (DD/MM/YYYY)
- **Numeric values**: Parsed as float, handle currency symbols (£)

---

## Canvas Auto-Detection

When files are imported from `1.Pennine` (historic examples):

| File Pattern | Likely Source | Auto-Detected Fields |
|--------------|---------------|---------------------|
| *arbor*.csv | Arbor MIS | admission_number, legal_surname, legal_forename, year_group |
| *sims*.csv | SIMS | admission_no, surname, forename, nc_year |
| *payroll*.csv | Payroll system | employee_id, gross_pay, tax_code |
| *budget*.xlsx | Finance spreadsheet | CFR codes, budget categories |
| *policy*.pdf | Policy documents | policy_name, review_date, category |

Canvas learns field mappings across all schools:
1. First import: AI infers mappings based on column names and data patterns
2. Human review: Confirm or reject mappings
3. Network effect: Mappings improve for all schools over time

---

## Aurora Primary School - Import Checklist

Use this checklist to ensure complete data import:

### Pre-Import
- [ ] Create Aurora Primary School organization
- [ ] Confirm unique `employee_id` scheme doesn't conflict with existing data
- [ ] Confirm unique `pupil_id` scheme doesn't conflict
- [ ] Review `1.Pennine` folder for historic file format examples
- [ ] Set up Google Drive folder sharing with admin@schoolgle.co.uk

### Foundation
- [ ] Import `00_SETUP_ORGANIZATION.csv`
- [ ] Verify organization created successfully
- [ ] Note `organization_id` for reference

### Staff Data
- [ ] Import `01_STAFF_DIRECTORY.csv`
- [ ] Import `02_STAFF_EMERGENCY_CONTACTS.csv`
- [ ] Import `03_STAFF_QUALIFICATIONS.csv`
- [ ] Import `04_STAFF_TRAINING.csv`
- [ ] Import `05_STAFF_DBS_RECORDS.csv`
- [ ] Verify staff count matches expected

### Pupil Data
- [ ] Import `06_PUPILS_MASTER.csv`
- [ ] Import `07_CLASSES_AND_GROUPS.csv`
- [ ] Verify pupil count matches expected
- [ ] Check year group distribution

### Finance & Estates
- [ ] Import `09_BUDGET_TEMPLATE.xlsx`
- [ ] Import `11_CONTRACTORS.csv`
- [ ] Import `12_ASSETS_REGISTER.csv`
- [ ] Verify CFR code mappings in Canvas

### Governance & Compliance
- [ ] Import `08_GOVERNORS.csv`
- [ ] Import `13_COMPLIANCE_POLICIES.csv`
- [ ] Verify policy count and review dates

### Ongoing
- [ ] Import `10_PAYROLL_IMPORT.csv` (monthly)
- [ ] Review `finance_reconciliation_log` for discrepancies
- [ ] Update `canvas_field_mappings` for new file formats

---

## Support & Troubleshooting

**Issue**: Import fails with "employee_id conflict"
- **Cause**: Employee ID already exists in different role
- **Solution**: Use new `employee_id` or mark action as `update` instead of `new`

**Issue**: Pupil names appear in system despite PII protection
- **Cause**: Names imported to database directly
- **Solution**: Use pseudonymisation or keep names in Drive only

**Issue**: Budget figures don't match payroll
- **Cause**: Different source files, timing differences
- **Solution**: Review `finance_reconciliation_log`, accept source A or B

**Issue**: Can't tell which staff are DSL
- **Cause**: DSL not marked in staff_directory
- **Solution**: Add to `staff_connectors` table, query by connector type

---
*Version: 1.0*
*Last Updated: March 2026*
*For: Aurora Primary School Onboarding*
