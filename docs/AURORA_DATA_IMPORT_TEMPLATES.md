# Aurora Primary School - Data Import Templates

## Overview

This folder contains templates for populating Aurora Primary School's data in Schoolgle. These templates are designed to:

1. **Align with Supabase database schema** - each template maps to specific database tables
2. **Keep personal details on Drive side** - names and sensitive info stay in Google Drive, only unique identifiers flow into Schoolgle
3. **Support various file formats** - budgets, payroll reports, MIS exports from historic data (see `1.Pennine` folder for examples)
4. **Handle data conflicts** - uses organization_id and employee_id to prevent conflicts with existing data

---

## Template Structure

```
📁 Aurora Data Import Templates/
├── 📄 00_SETUP_ORGANIZATION.csv           # Organization profile, DfE details, branding
├── 📄 01_STAFF_DIRECTORY.csv             # Staff with employee_id (names stay on Drive)
├── 📄 02_STAFF_EMERGENCY_CONTACTS.csv    # Emergency contacts per staff_id
├── 📄 03_STAFF_QUALIFICATIONS.csv         # QTS, PGCE, first aid, etc.
├── 📄 04_STAFF_TRAINING.csv               # CPD, safeguarding, mandatory training
├── 📄 05_STAFF_DBS_RECORDS.csv            # DBS checks (clear/barred status only)
├── 📄 06_PUPILS_MASTER.csv                # Pupil register with pupil_id
├── 📄 07_CLASSES_AND_GROUPS.csv           # Class assignments, year groups
├── 📄 08_GOVERNORS.csv                    # Governing body details
├── 📄 09_BUDGET_TEMPLATE.xlsx              # CFR-aligned budget (3-year forecast)
├── 📄 10_PAYROLL_IMPORT.csv               # Monthly payroll for reconciliation
├── 📄 11_CONTRACTORS.csv                   # Estates/Finance suppliers
├── 📄 12_ASSETS_REGISTER.csv              # Fixed assets, QR codes
├── 📄 13_COMPLIANCE_POLICIES.csv          # Statutory policy tracking
└── 📄 14_DATA_SOURCE_CONNECTIONS.csv       # MIS/Finance system credentials (encrypted)
```

---

## Key Design Principles

### 1. PII Protection - Keep Names on Drive

**What STAYS in Google Drive (PII):**
- Staff full names
- Pupil full names
- Personal addresses, phone numbers, email addresses
- National Insurance numbers
- DBS certificate content
- Medical details

**What FLOWS into Schoolgle (identifiers and role data):**
- `employee_id` - unique staff identifier (e.g., STF001, STF002)
- `pupil_id` - unique pupil identifier (school-assigned)
- `role_category` - job classification only
- `class_name` - class identifier (e.g., "3A", "Oak")
- `year_group` - year group only
- `qualification_type` - qualification category, not title
- `training_category` - training category, not description

### 2. Unique Identifier System

| Entity | Identifier Pattern | Example |
|---------|-------------------|---------|
| Staff | `STF` + 3-digit incrementing number | STF001, STF002 |
| Pupils | Year Group + 3-digit number | R001, 101, 601 |
| Governors | GOV + 2-digit number | GOV01, GOV02 |
| Suppliers | SUP + category + 3-digit | FIN001, EST001 |

### 3. File Format Support

Based on the `1.Pennine` folder analysis:

| File Type | Source Module | Template | Processing |
|-----------|---------------|----------|------------|
| Budget (CFR format) | Finance | `09_BUDGET_TEMPLATE.xlsx` | Canvas auto-ingest |
| Payroll reports | HR/Finance | `10_PAYROLL_IMPORT.csv` | Reconciliation log |
| MIS exports (Arbor/SIMS) | Data | Canvas auto-detect | Field matching |
| Policies | Compliance | `13_COMPLIANCE_POLICIES.csv` | Policy tracker |
| Asset lists | Estates | `12_ASSETS_REGISTER.csv` | QR code generation |

---

## Template Details

### 00_SETUP_ORGANIZATION.csv

```csv
# Aurora Primary School - Organization Setup
# Fields marked with * are required

field_name,value,schoolgle_target_table,notes
school_name*,Aurora Primary School,organizations.name
urn,123456,organizations.urn,DfE Unique Reference Number
la_code,123,organizations.local_authority,Local Authority code
school_type,Primary Academy,organizations.type,academy/voluntary_controlled etc
phase,Primary,organizations.phase,primary/secondary/all_through
age_range,3-11,organizations.age_range,Reception to Year 6
religion,None,organizations.religion,CofE/Catholic/None
pupil_count,240,organizations.pupil_count,Current on roll
created_date,2026-03-21,organizations.created_at,School opening date
headteacher_name*,[DO NOT IMPORT - Drive only],n/a,Keep in Google Drive only
headteacher_email*,headteacher@aurora.sch.uk,organizations.headteacher_email,For login only
business_manager_email*,finance@aurora.sch.uk,organizations.business_manager_email,For finance
school_address,[DO NOT IMPORT - Drive only],n/a,Keep in Google Drive only
school_phone,0161 123 4567,organizations.phone,Main office number
website,https://www.aurora.sch.uk,organizations.website,School website
term_dates_autumn,2026-09-01,term_dates.autumn_start,First day of autumn term
term_dates_spring,2027-01-05,term_dates.spring_start,First day of spring term
term_dates_summer,2027-04-21,term_dates.summer_start,First day of summer term
```

### 01_STAFF_DIRECTORY.csv

```csv
# Staff Directory - PII kept on Drive side
# employee_id flows to Schoolgle, names stay in Google Drive

action*,employee_id*,salutation,first_name*,last_name*,email*,phone,job_title*,role_category*,payroll_number,contract_type,fte,contract_hours,start_date,pension_scheme
keep,STF001,Mr,John,Smith,john.smith@aurora.sch.uk,,Headteacher,headteacher,HT001,Permanent,1.0,32.5,2020-09-01,teachers_pension
keep,STF002,Ms,Sarah,Jones,sarah.jones@aurora.sch.uk,,Deputy Headteacher,deputy_headteacher,HT002,Permanent,1.0,32.5,2021-09-01,teachers_pension
keep,STF003,Mrs,Emma,Williams,emma.williams@aurora.sch.uk,,Assistant Headteacher,assistant_headteacher,HT003,Permanent,1.0,32.5,2019-09-01,teachers_pension
keep,STF004,Mr,David,Brown,david.brown@aurora.sch.uk,,School Business Manager,business_manager,SB001,Permanent,1.0,35.0,2018-09-01,lgps
keep,STF005,Ms,Lisa,Taylor,lisa.taylor@aurora.sch.uk,,SENDCO,sendco,SC001,Permanent,0.8,26.0,2022-09-01,teachers_pension
keep,STF006,Miss,Emily,Davis,emily.davis@aurora.sch.uk,,Class Teacher,class_teacher,CT001,Permanent,1.0,32.5,2023-09-01,teachers_pension
keep,STF007,Mr,James,Miller,james.miller@aurora.sch.uk,,Site Manager,caretaker,FM001,Permanent,1.0,37.0,2020-06-01,lgps
keep,STF008,Mrs,Patricia,Wilson,patricia.wilson@aurora.sch.uk,,School Secretary,admin,AD001,Permanent,1.0,30.0,2019-01-15,lgps
keep,STF009,Mr,Robert,Moore,robert.moore@aurora.sch.uk,,PE Lead,subject_leader,PE001,Permanent,1.0,32.5,2021-09-01,teachers_pension
keep,STF010,Mrs,Helen,Anderson,helen.anderson@aurora.sch.uk,,Maths Lead,subject_leader,MA001,Permanent,1.0,32.5,2019-09-01,teachers_pension
new,STF011,Dr,Amanda,Clark,amanda.clark@aurora.sch.uk,,Class Teacher,class_teacher,CT011,Permanent,0.8,26.0,2024-09-01,teachers_pension
new,STF012,Miss,Rebecca,Harris,rebecca.harris@aurora.sch.uk,,Teaching Assistant,teaching_assistant,TA001,Fixed-term,1.0,32.5,2024-09-01,opted_out
```

**Key Fields:**
- `action`: `keep` (update existing), `new` (add), `remove` (leaving staff)
- `employee_id`: Unique identifier that flows to all HR tables
- `first_name`/`last_name`: **Stay in Google Drive only** - NOT imported to database
- `role_category`: Maps to: headteacher, deputy_headteacher, assistant_headteacher, subject_lead, phase_lead, class_teacher, sendco, business_manager, caretaker, admin, teaching_assistant

### 06_PUPILS_MASTER.csv

```csv
# Pupils Master - Names stay on Drive side
# pupil_id flows to Schoolgle as the unique identifier

action*,pupil_id*,pupil_ref,first_name,last_name,date_of_birth,year_group,class_name,gender,is_pupil_premium,is_eal,is_looked_after,has_send_support,sen_status,primary_need,fsm_eligible,ethnicity
keep,P101R001,R-001,Sophie,Williams,2018-09-01,R,Oak,F,Yes,No,No,No,None,No,White British
keep,P101R002,R-002,Oliver,Brown,2018-11-15,R,Oak,M,Yes,No,No,K,SLD,Yes,White British
keep,P101R003,R-003,Harry,Smith,2019-01-20,R,Oak,M,No,Yes,No,E,MLM,No,White British
keep,P101101,101-001,Emily,Davis,2017-05-12,1,1A,F,Yes,No,No,No,None,No,Pakistani
keep,P101102,101-002,Jack,Miller,2017-08-23,1,1A,M,Yes,No,No,monitoring,None,No,White British
keep,P101203,203-001,Charlotte,Wilson,2016-04-18,2,2A,F,No,No,No,K,MLD,Yes,Indian
keep,P101204,203-002,William,Taylor,2016-06-30,2,2B,M,Yes,No,No,E,PD,No,White British
```

**Key Fields:**
- `pupil_id`: Unique identifier (Year group + 3-digit number)
- `first_name`/`last_name`: **Stay in Google Drive only**
- `sen_status`: K, E, monitoring, removed, null
- `primary_need`: SPLD, MLD, SLD, PMLD, SEMH, SLCN, HI, VI, MSI, PD, ASD, OTH, NSA

### 09_BUDGET_TEMPLATE.xlsx (CFR-Aligned)

**Sheet: CFR_Codes**

```csv
cfr_code,cfr_description,cfr_category,budget_y1,budget_y2,budget_y3,actual_y1,committed_y1,notes
E01,Teaching Staff,Expenditure,500000,515000,530454,490000,5000,Main scale + UPS
E02,Supply Staff,Expenditure,30000,30900,31827,28000,2000,Agency + supply
E03,Energy,Expenditure,45000,46350,47740,44000,1800,Utilities + fuel
I01,School Grant Allocation,Income,150000,154500,159135,152000,0,DfE grant
I02,Funding for Pupils with SEN,Income,45000,46350,47740,45000,0,High needs funding
```

**CFR Code Mapping:**
- E01-E07: Staff Costs (Teaching, Supply, Back Office, Premises, Supply Backfill, Buyback)
- E08: Energy
- I01-I09: Income (Grant, SEN, Pupil Premium, Facilities, etc.)
- D01: DfE Borrowing

### 10_PAYROLL_IMPORT.csv (Monthly Reconciliation)

```csv
payroll_month*,payroll_year*,employee_id*,gross_salary,net_pay,pension_contribution,employer_ni,employee_ni,other_deductions,take_home,payroll_provider,checksum
March 2026,2025-26,STF001,8500.00,6200.00,1200.50,950.00,650.00,500.00,6200.00,Paypath,SHA256_HASH
March 2026,2025-26,STF002,7200.00,5300.00,950.00,800.00,550.00,200.00,5300.00,Paypath,SHA256_HASH
```

**Purpose:** Reconcile against `finance_reconciliation_log` table. Source checksum tracks if the spreadsheet matches what was imported.

---

## Data Flow Architecture

```
Google Drive (School Side)                    Schoolgle Database
┌─────────────────────────┐                   ┌─────────────────────────────┐
│ 01_STAFF_DIRECTORY.csv    │                   │ staff_directory table           │
│ - Names (STAY HERE)         │  employee_id ────────▶│ - id, employee_id, email          │
│ - employee_id ─────────────┼───────────────────▶│ - job_title, role_category       │
│ - job_title                │                   │ - (NO names)                     │
└─────────────────────────┘                   └─────────────────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────┐                   ┌─────────────────────────────┐
│ 06_PUPILS_MASTER.csv       │  pupil_id ─────────▶│ pupils table                     │
│ - Names (STAY HERE)         │                   │ - id, pupil_id, year_group       │
│ - pupil_id ────────────────┼───────────────────▶│ - class_name, sen_status          │
│ - year_group, class_name    │                   │ - (NO names)                     │
└─────────────────────────┘                   └─────────────────────────────┘
```

---

## Join Mechanism

**How Data Reunites Without PII:**

1. **Staff Directory → Emergency Contacts**
   - Link via `employee_id` (e.g., STF001)
   - Names stay in Google Drive
   - Schoolgle shows: "STF001 - Class Teacher" (name looked up from Drive when displayed)

2. **Staff Directory → DBS Records**
   - Link via `employee_id`
   - Only status stored: `clear`, `barred`, `pending`
   - Certificate content stays in Drive

3. **Staff Directory → Qualifications**
   - Link via `employee_id`
   - Only `qualification_type`, `reference_number`, `expiry_date` stored
   - Certificate PDF stays in Drive

4. **Pupils → Attendance/Behaviour/SEND**
   - Link via `pupil_id` (e.g., P101R001)
   - Names stay in Google Drive
   - Schoolgle shows: "R/Oak - 3 pupils absent" (details fetched from Drive when needed)

---

## Aurora Primary School Setup Process

### Step 1: Organization Creation
1. Populate `00_SETUP_ORGANIZATION.csv`
2. System creates organization record with `organization_id`
3. This ID becomes the foreign key for all subsequent imports

### Step 2: Staff Import
1. Populate `01_STAFF_DIRECTORY.csv`
2. System creates staff records with unique `employee_id`
3. Names stored locally in Drive, only `employee_id` + role data flows to database

### Step 3: Pupil Import
1. Populate `06_PUPILS_MASTER.csv`
2. System creates pupil records with unique `pupil_id`
3. Names stored locally, only identifiers flow to database

### Step 4: Budget & Finance Import
1. Populate `09_BUDGET_TEMPLATE.xlsx`
2. Canvas auto-ingests and maps CFR codes to budget categories
3. Creates `finance_reconciliation_log` entry for audit trail

### Step 5: Historic Data Processing
1. Review `1.Pennine` folder for example file formats
2. Canvas auto-detects source system (Arbor, SIMS, etc.)
3. Field mappings learned via `canvas_field_mappings` table

---

## Handling Existing Data Conflicts

### Scenario: Aurora Primary School Already Exists

**Problem:** Database already has test data from development

**Solution 1: Organization Isolation**
- Aurora Primary School gets unique `organization_id`
- No data leakage between organizations
- Templates import into clean Aurora org only

**Solution 2: Employee ID Conflicts**
- `employee_id` is unique per organization
- STF001 in Aurora ≠ STF001 in another school
- No cross-org conflicts

**Solution 3: Pupil ID Conflicts**
- `pupil_id` prefixed with organization code or year
- `organization_id` + `pupil_id` forms composite key
- Each school has separate pupil namespace

---

## Reconciliation & Audit Trail

### Finance Reconciliation Log
Every import creates a `finance_reconciliation_log` entry:
- `source_checksum`: SHA-256 of original file
- `source_total_expenditure`: From spreadsheet
- `db_total_expenditure`: Calculated from imported data
- `exceptions`: Any discrepancies detected

### GDPR Article 5(1)(d) Compliance
The `canvas_reconciliation_log` tracks:
- When data from two sources conflicts (e.g., Arbor vs Payroll)
- Resolution: `accept_a`, `accept_b`, `manual_value`
- Approved by: `approved_by`, `approved_at`

---

## File Format Examples from Pennine Folder

### Budget Export Format (CFR-aligned)
```
CFR Code,Description,Category,Y1 Budget,Y1 Actual,Y2 Budget
E01,Teaching Staff,Expenditure,500000,490000,515000
E02,Supply Staff,Expenditure,30000,28000,30900
```

### Payroll Export Format
```
Employee ID,Name,Gross,Tax,NI,Pension,Net
HT001,John Smith,8500,1500,950,1200,4850
HT002,Sarah Jones,7200,1200,800,950,4250
```

### MIS Export Format (Arbor)
```
Admission Number,Legal Surname,Legal Forename,Year Group,Class,PP,ELK,SEN
R001WILSO,Sophie,Williams,R,Oak,Yes,No,E,K
```

---

## Next Steps

1. **Copy these templates to your Google Drive** in the `Aurora Primary School` folder
2. **Populate each template** with real data (names stay in Google Drive)
3. **Share the folder with Schoolgle** using admin@schoolgle.co.uk
4. **Run the Data Import Wizard** in Schoolgle to:
   - Auto-detect file formats
   - Map columns to database fields
   - Validate data integrity
   - Create reconciliation log entries

---

## Support Files

- `IMPORT_WIZARD_GUIDE.md` - Step-by-step import instructions
- `CONNECTOR_MATRIX.md` - Which data connects to which modules
- `TROUBLESHOOTING.md` - Common import issues and solutions

---
*Version: 1.0*
*Last Updated: March 2026*
*For: Aurora Primary School Onboarding*
