# SCHOOLGLE DATA IMPORT MAPPING
## Onboarding Pipeline: File → Database Field Mapping

**Purpose**: Document exactly what data is extracted from which files and where it goes in the database.

**Use Case**: When a new school connects their Google Drive, the system scans for these standard files and imports data according to this mapping.

---

## QUICK REFERENCE: What Import Powers What Feature

| Feature | Required Data Source | Database Tables |
|---------|---------------------|-----------------|
| **Pupil Records** (Teaching & Learning) | Pupil Roll CSV (MIS export) | `pupils`, `ls_classes`, `ls_pupils` |
| **Attendance Module** | Pupil Roll CSV + Census XML | `pupils`, `pupil_census_snapshots` |
| **SEND Module** | Pupil Roll CSV + Census XML | `pupils`, `pupil_census_snapshots` |
| **Intelligence Module** | Census XML + Assessment Excel | `pupil_census_snapshots`, `pupil_assessments_pseudo` |
| **Compliance Dashboard** | Census XML | `school_census_aggregates` |
| **Pupil Premium Tracking** | Pupil Roll CSV + Census XML | `pupils` (PP flag), `pupil_census_snapshots` |

**Key Point**: **Pupil Roll CSV is REQUIRED** for any feature that displays pupil names. Census XML files provide demographic data but NOT pupil names (privacy design).

---

## OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCE OPTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐          ┌──────────────────────────────────────┐ │
│  │ GOOGLE DRIVE (Auto)  │          │ MIS EXPORT (Manual - Required)       │ │
│  ├──────────────────────┤          ├──────────────────────────────────────┤ │
│  │ • Census Reports (20)│          │ • Pupil_Roll.csv  ← PUPIL NAMES      │ │
│  │ • Assessments (20)   │          │ • Staff_Directory.csv                 │ │
│  │ • SEN Register       │          │ • Site_Plan.pdf                       │ │
│  └──────────────────────┘          └──────────────────────────────────────┘ │
│           │                                     │                            │
│           ▼                                     ▼                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATABASE TABLES                               │ │
│  ├───────────────────────┬────────────────────────────────────────────────┤ │
│  │ Compliance Tables     │ Teaching & Learning Tables                    │ │
│  │ (No pupil names)      │ (Has pupil names)                             │ │
│  ├───────────────────────┼────────────────────────────────────────────────┤ │
│  │ • census_imports      │ • pupils (master)                             │ │
│  │ • pupil_census_...    │ • ls_classes                                  │ │
│  │ • pupil_assessments_  │ • ls_pupils                                   │ │
│  │ • school_census_...   │                                              │ │
│  └───────────────────────┴────────────────────────────────────────────────┘ │
│                                                                             │
│  ⚠️  Census XML → Compliance tables ONLY (no names)                         │
│  ✅  Pupil Roll CSV → Teaching tables WITH names                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CENSUS REPORTS FOLDER

### File Pattern: `Census SPR*.xml`, `Census AUT*.xml`, `Census SUM*.xml`

**Standard DfE Census XML Format** (same across all schools)

| Database Table | Field | XML Path | Data Type | Privacy |
|----------------|-------|----------|-----------|---------|
| `census_imports` | census_term | `/CensusReturn/Headings/Term` | AUT/SPR/SUM | Safe |
| `census_imports` | census_year | `/CensusReturn/Headings/Year` | Integer | Safe |
| `census_imports` | reference_date | `/CensusReturn/Headings/Date` | Date | Safe |
| `census_imports` | serial_no | `/CensusReturn/Headings/SerialNo` | Integer | Safe |
| `census_imports` | source_filename | Uploaded filename | String | Safe |
| `census_imports` | source_drive_id | Google Drive file ID | String | Safe |

### Pupil Census Snapshots

| Database Table | Field | XML Path | Transformation | Privacy |
|----------------|-------|----------|----------------|---------|
| `pupil_census_snapshots` | pseudo_ref | `/CensusReturn/Pupil/UPN` | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_census_snapshots` | gender | `/CensusReturn/Pupil/Gender` | M/F | Safe |
| `pupil_census_snapshots` | age_at_census | Calculate from DOB | Integer | Safe |
| `pupil_census_snapshots` | age_band | Calculate from age_at_census | under_5/5-10/11-15/16+ | Safe |
| `pupil_census_snapshots` | postcode_district | `/CensusReturn/Pupil/Postcode` | First half only | Safe |
| `pupil_census_snapshots` | language_code | `/CensusReturn/Pupil/Language` | ENG/Other code | Safe |
| `pupil_census_snapshots` | is_eal | `language_code != 'ENG'` | Boolean derived | Safe |
| `pupil_census_snapshots` | school_lunch_taken | `/CensusReturn/Pupil/Meals` | Y/N | Safe |
| `pupil_census_snapshots` | service_child | `/CensusReturn/Pupil/ServiceChild` | Y/N | Safe |
| `pupil_census_snapshots` | fsm_eligible | `/CensusReturn/Pupil/FSM` | Boolean | Safe |
| `pupil_census_snapshots` | fsm_start_year | `/CensusReturn/Pupil/FSMStartYear` | Integer | Safe |
| `pupil_census_snapshots` | sen_provision | `/CensusReturn/Pupil/SENProvision` | E/K/N | Safe |
| `pupil_census_snapshots` | sen_type_primary | `/CensusReturn/Pupil/SENType` | SLCN/ASD/etc | Safe |
| `pupil_census_snapshots` | sen_unit_indicator | `/CensusReturn/Pupil/Resourced` | Boolean | Safe |
| `pupil_census_snapshots` | enrol_status | `/CensusReturn/Pupil/EnrolStatus` | C/M/S/F/O | Safe |
| `pupil_census_snapshots` | nc_year_actual | `/CensusReturn/Pupil/NCYear` | R/1-13 | Safe |
| `pupil_census_snapshots` | ethnicity | `/CensusReturn/Pupil/Ethnicity` | WBRI/WIRI/etc | Spring only |
| `pupil_census_snapshots` | census_term | From header | AUT/SPR/SUM | Safe |
| `pupil_census_snapshots` | census_year | From header | Integer | Safe |

**Privacy Rule**: Store `SHA-256(UPN + census_salt)[:24].toUpperCase()` as `pseudo_ref`. Never store raw UPN.

### Attendance Sessions (from Census)

| Database Table | Field | XML Path | Notes | Privacy |
|----------------|-------|----------|-------|---------|
| `pupil_attendance_sessions` | pseudo_ref | `/CensusReturn/Pupil/UPN` | **Hashed** | **PSEUDONYMISED** |
| `pupil_attendance_sessions` | snapshot_id | FK to pupil_census_snapshots | Auto-generated | Safe |
| `pupil_attendance_sessions` | period_type | Derived from file | "termly" | Safe |
| `pupil_attendance_sessions` | sessions_possible | `/CensusReturn/Pupil/SessionsPossible` | Integer | Safe |
| `pupil_attendance_sessions` | reason_code | `/CensusReturn/Pupil/Attendance/Code` | /\ |/\B/I/etc | Safe |
| `pupil_attendance_sessions` | session_count | `/CensusReturn/Pupil/Attendance/Sessions` | Integer | Safe |
| `pupil_attendance_sessions` | pseudo_ref | Hashed UPN | **PSEUDONYMISED** | **PSEUDONYMISED** |
| `pupil_attendance_sessions` | census_year | From header | Integer | Safe |
| `pupil_attendance_sessions` | census_term | From header | AUT/SPR/SUM | Safe |

### School Census Aggregates

| Database Table | Field | Calculation | Notes |
|----------------|-------|------------|-------|
| `school_census_aggregates` | total_pupils | COUNT(*) | All pupils |
| `school_census_aggregates` | total_male | COUNT(gender='M') |  |
| `school_census_aggregates` | total_female | COUNT(gender='F') |  |
| `school_census_aggregates` | total_sen_ehcp | COUNT(sen_provision='E') |  |
| `school_census_aggregates` | total_sen_support | COUNT(sen_provision='K') |  |
| `school_census_aggregates` | sen_percentage | (E+K)/total × 100 |  |
| `school_census_aggregates` | total_fsm_eligible | COUNT(fsm_eligible=true) |  |
| `school_census_aggregates` | fsm_percentage | fsm/total × 100 |  |
| `school_census_aggregates` | total_eal | COUNT(language_code != 'ENG') |  |
| `school_census_aggregates` | total_sessions_possible | SUM(sessions_possible) |  |
| `school_census_aggregates` | overall_absence_rate | (authorised + unauthorised) / possible × 100 |  |

---

## 2. ASSESSMENTS FOLDER

### File Patterns:

| File | Pattern | Assessment Type | Database Target |
|------|---------|-----------------|-----------------|
| EYFS results | `EYFS*.xlsx` or `EYFS*.xml` | EYFSP | `pupil_assessments_pseudo` |
| Phonics check | `Phonics*.xlsx` or `Y1_Phonics*.xml` | PHONICS | `pupil_assessments_pseudo` |
| KS1 results | `KS1*.xlsx` or `KS1_TA*.xml` | KS1 | `pupil_assessments_pseudo` |
| KS2 results | `KS2*.xlsx` or `KS2_TA*.xml` | KS2 | `pupil_assessments_pseudo` |
| MTC | `MTC*.xlsx` or `Multiplication*.xml` | MTC | `pupil_assessments_pseudo` |

### EYFS Profile Mapping

| Database Table | Field | Excel Column | Value Mapping | Privacy |
|----------------|-------|--------------|---------------|---------|
| `pupil_assessments_pseudo` | pupil_hash | UPN column | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | assessment_type | — | "EYFSP" | Safe |
| `pupil_assessments_pseudo` | stage | — | "EYF" | Safe |
| `pupil_assessments_pseudo` | component | ELG column names | Communication, Physical, PSED, Literacy, Maths, Understanding, Expressive | Safe |
| `pupil_assessments_pseudo` | result_qualifier | Value | "Emerging", "Expected", "Exceeding" | Safe |
| `pupil_assessments_pseudo` | attainment_level | Derived | Emerging=1, Expected=2, Exceeding=3 | Safe |
| `pupil_assessments_pseudo` | academic_year_start | From filename/context | 2021 = "2021-22" | Safe |

**EYFS ELG Columns** (standard 17 ELGs):
- CLA (Communication & Language)
- PHY (Physical Development)
- PSED (Personal, Social & Emotional)
- LIT (Literacy)
- MAT (Mathematics)
- UTW (Understanding the World)
- EA (Expressive Arts)

### Phonics Check Mapping

| Database Table | Field | Excel Column | Value Mapping | Privacy |
|----------------|-------|--------------|---------------|---------|
| `pupil_assessments_pseudo` | pupil_hash | UPN | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | assessment_type | — | "PHONICS" | Safe |
| `pupil_assessments_pseudo` | stage | — | "KS1" | Safe |
| `pupil_assessments_pseudo` | component | — | "CHK" | Safe |
| `pupil_assessments_pseudo` | result_qualifier | Score | "32" = 32, "Fail" = 0-31 | Safe |
| `pupil_assessments_pseudo` | attainment_level | Derived | 32+ = "WTS" (Working Towards Standard) | Safe |

### KS1 Teacher Assessment Mapping

| Database Table | Field | Excel Column | Value Mapping | Privacy |
|----------------|-------|--------------|---------------|---------|
| `pupil_assessments_pseudo` | pupil_hash | UPN | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | assessment_type | — | "KS1" | Safe |
| `pupil_assessments_pseudo` | stage | — | "KS1" | Safe |
| `pupil_assessments_pseudo` | component | Subject column | REA (Reading), WRI (Writing), MAT (Maths), SCI (Science) | Safe |
| `pupil_assessments_pseudo` | result_qualifier | Value | PKF, PKF/WTB, WTS, EXS, GDS | Safe |
| `pupil_assessments_pseudo` | attainment_level | Numeric derived | PKF=1, PKF/WTB=2, WTS=3, EXS=4, GDS=5 | Safe |

**KS1 Result Codes**:
- PKF = Pre-Key Stage (foundations)
- PKF/WTB = Pre-Key Stage/Working Towards
- WTS = Working Towards Standard
- EXS = Expected Standard
- GDS = Greater Depth Standard

### KS2 Teacher Assessment Mapping

| Database Table | Field | Excel Column | Value Mapping | Privacy |
|----------------|-------|--------------|---------------|---------|
| `pupil_assessments_pseudo` | pupil_hash | UPN | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | assessment_type | — | "KS2" | Safe |
| `pupil_assessments_pseudo` | stage | — | "KS2" | Safe |
| `pupil_assessments_pseudo` | component | Subject column | REA, WRI, MAT, GPS (Grammar) | Safe |
| `pupil_assessments_pseudo` | result_qualifier | Value | NS, PKF, WTS, EXS, HNM, HS, GDS | Safe |
| `pupil_assessments_pseudo` | attainment_level | Numeric derived | NS=0, PKF=1, WTS=3, EXS=4, HNM=4, HS=5, GDS=6 | Safe |

**KS2 Result Codes**:
- NS = Not scaled
- PKF = Pre-Key Stage
- WTS = Working Towards Standard
- EXS = Expected Standard (scaled 100-119)
- HNM = High Score (110-119)
- HS = Higher Score (120+)
- GDS = Greater Depth Standard (scaled 110+)

### MTC (Multiplication Tables Check) Mapping

| Database Table | Field | Excel Column | Value Mapping | Privacy |
|----------------|-------|--------------|---------------|---------|
| `pupil_assessments_pseudo` | pupil_hash | UPN | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | assessment_type | — | "MTC" | Safe |
| `pupil_assessments_pseudo` | stage | — | "KS2" (Year 4) | Safe |
| `pupil_assessments_pseudo` | component | — | "MTC" | Safe |
| `pupil_assessments_pseudo` | result_qualifier | Score | 0-25 | Safe |
| `pupil_assessments_pseudo` | attainment_level | Derived | 25 = "PASS", <25 = "FAIL" | Safe |

---

## 3. SEND PROVISION FOLDER

### File Pattern: `SEN_Register*.xlsx` or `SEND_Register*.xlsx`

| Database Table | Field | Excel Column | Notes | Privacy |
|----------------|-------|--------------|-------|---------|
| `pupils` | has_send_support | SEN Status != N | Boolean derived | Safe |
| `pupils` | sen_status | SEN Status column | E/K/N mapping | Safe |
| `pupils` | primary_need | Primary Need column | ASD, MLD, SLD, etc. | Safe |
| `pupils` | secondary_need | Secondary Need | If present | Safe |

**SEN Status Mapping**:
- E = Education, Health and Care Plan (EHCP) → `has_send_support = true`, `sen_status = 'E'`
- K = SEN Support → `has_send_support = true`, `sen_status = 'K'`
- N = No SEN → `has_send_support = false`, `sen_status = 'N'`
- P = Primary (old code) → map to K

**Primary Need Codes**:
- ASD = Autistic Spectrum Disorder
- MLD = Moderate Learning Difficulties
- SLD = Severe Learning Difficulties
- PMLD = Profound & Multiple Learning Difficulties
- SEMH = Social, Emotional & Mental Health
- SLCN = Speech, Language & Communication Needs
- HI = Hearing Impairment
- VI = Visual Impairment
- MSI = Multi-Sensory Impairment
- PD = Physical Disability
- OTH = Other

---

## 4. DISADVANTAGED PUPILS FOLDER

### File Pattern: `Pupil_Premium*.xlsx` or `PP_Register*.xlsx`

| Database Table | Field | Excel Column | Notes | Privacy |
|----------------|-------|--------------|-------|---------|
| `pupils` | is_pupil_premium | Pupil Premium column | Boolean | Safe |
| `pupils` | fsm_eligible | FSM Eligible column | Boolean | Safe |
| `pupils` | fsm_ever_6 | FSM Ever 6 (if present) | Boolean | Safe |

**PP Eligibility**:
- Column typically named "Pupil Premium", "PP Eligible", or similar
- Values: Y/N, Yes/No, 1/0
- Map to: `is_pupil_premium = true/false`

---

## 5. ATTENDANCE FOLDER

### File Pattern: `Attendance*.xlsx` or `Attendance_Summary*.pdf`

**If Excel (preferred format):**

| Database Table | Field | Excel Column | Notes | Privacy |
|----------------|-------|--------------|-------|---------|
| `pupil_attendance_sessions` | pseudo_ref | UPN/Student ID | **SHA-256 hash** | **PSEUDONYMISED** |
| `pupil_attendance_sessions` | period_type | — | "termly" (from context) | Safe |
| `pupil_attendance_sessions` | sessions_possible | Possible Sessions | Integer | Safe |
| `pupil_attendance_sessions` | reason_code | Mapped from column | /, \, B, I, G, O, etc. | Safe |
| `pupil_attendance_sessions` | session_count | Count for each code | Integer | Safe |

**Attendance Reason Codes**:
- `/` = Present (morning)
- `\` = Present (afternoon)
- `B` = Illness
- `C` = Medical/Dental
- `D` = Doctor/Dentist appointment
- `E` = Excluded
- `G` = Family holiday
- `H = Religious observance
- `I = Interview
- `J` = Excluded
- `L` = Late (before register closes)
- `M = Authorised absence
- `N` = Unauthorised absence
- `O` = Educational visit
- `P = Religious observance
- `R = Educational visit
- `S = Study leave
- `T = Traveller absence
- `U` = Unknown
- `V` = Educational visit
- `W = Unauthorized (illness)
- `X = Late (after register closes)
- `Y = Unable to attend due to exceptional circumstances
- `Z` = Not attending

**If PDF**:
- Parse using OCR/extraction
- Extract summary statistics
- May only get overall %, not session-level data

---

## 6. GOVERNANCE FOLDER

### File Pattern: `Governing_Body*.xlsx` or `Governor_List*.xlsx`

| Database Table | Field | Excel Column | Notes | Privacy |
|----------------|-------|--------------|-------|---------|
| `governors` (if exists) | name | Governor Name | Full name | Safe |
| `governors` | role | Role/Committee | Chair, Vice-Chair, etc. | Safe |
| `governors` | start_date | Start Date/Appointment | Date | Safe |
| `governors` | end_date | End Date/Term | Date or null | Safe |
| `governors` | committee | Committee | Finance, Resources, etc. | Safe |

**Note**: Governor data is typically NOT in the Evidence folder. This folder usually contains:
- Governance policies
- Meeting minutes
- Terms of reference

**Missing data**: Governor contact details, attendance records

---

## 7. SAFEGUARDING FOLDER (Multiple Subfolders)

### File Patterns: Policy documents (PDF/Word)

| Database Table | Field | Extraction Method | Notes |
|----------------|-------|-------------------|-------|
| `compliance_policies` | policy_name | Filename or OCR | "Safeguarding Policy", "Prevent Duty" |
| `compliance_policies` | category | Folder path | "safeguarding", "health_safety" |
| `compliance_policies` | last_review_date | OCR/extraction from doc | Extract date from content |
| `compliance_policies` | next_review_date | Calculate from review frequency | +1 year from last_review |

**Safeguarding Subfolders** (from Grove House structure):
- `Safeguarding_Policy` → Main safeguarding policy
- `Prevent_Duty` → Prevent strategy
- `Online_Safety` → E-safety policy
- `Site_Security` → Security arrangements
- `Safer_Recruitment` → SCR procedures
- `DSL_Arrangements` → DSL responsibilities
- `Referral_Procedures` → How to refer
- `CPOMS_Recording` → CPOMS usage
- `Single_Central_Record` → SCR guidance

---

## 8. MIS EXPORTS (Requested Separately)

These are NOT in the Evidence folder but can be requested from the school.

### 8.1 Pupil Roll Export

**File Pattern**: `Pupil_Roll*.xlsx` or `Student_Census*.xlsx`

| Database Table | Field | Excel Column | Notes |
|----------------|-------|--------------|-------|
| `pupils` | pupil_id | Student ID | MIS unique ID |
| `pupils` | pupil_ref | UPN | Keep for reference, hash for analytics |
| `pupils` | first_name | Legal First Name | Display name |
| `pupils` | last_name | Legal Last Name | Display name |
| `pupils` | date_of_birth | Date of Birth | Calculate age, keep DOB |
| `pupils` | gender | Gender | M/F |
| `pupils` | year_group | Year Group | R, 1-13 |
| `pupils` | class_name | Registration Form/Class | "Y4 Pine" |
| `pupils` | ethnicity | Ethnicity | WBRI, etc. |
| `pupils` | is_eal | First Language != English | Derived |
| `pupils` | is_pupil_premium | Pupil Premium column | Boolean |
| `pupils` | fsm_eligible | FSM Eligible | Boolean |
| `pupils` | is_looked_after | In Care / LAC | Boolean |
| `pupils` | has_send_support | SEN Status != N | Derived |
| `pupils` | sen_status | SEN Status | E/K/N |
| `pupils` | primary_need | SEN Primary Need | ASD, etc. |
| `pupils` | admission_date | Admission Date | Date |

### 8.2 Staff Directory Export

**File Pattern**: `Staff_Directory*.xlsx` or `Staff_List*.xlsx`

| Database Table | Field | Excel Column | Notes |
|----------------|-------|--------------|-------|
| `staff_directory` | payroll_number | Staff ID | STF-001, etc. |
| `staff_directory` | first_name | First Name | |
| `staff_directory` | last_name | Last Name | |
| `staff_directory` | email | Email | If present |
| `staff_directory` | job_title | Role | "Class Teacher", "Headteacher" |
| `staff_directory` | role_category | Derived from Role | headteacher, class_teacher, sendco, etc. |
| `staff_directory` | fte | FTE | Full-time equivalent |
| `staff_directory` | class_name | Class Assignment | "Y6 Hazel" |
| `staff_directory` | start_date | Start Date | |
| `staff_directory` | date_of_birth | DOB | If present (for DBS, pension) |
| `staff_directory` | national_insurance_number | NI | **Encrypt at app level** |
| `staff_directory` | teacher_reference_number | TRN | DfE number |
| `staff_dbs_records` | dbs_type | DBS Check | enhanced, standard, basic |
| `staff_dbs_records` | issue_date | DBS Date | From certificate |
| `staff_dbs_records` | certificate_number | DBS Number | Certificate reference |
| `staff_dbs_records` | status | Check result | clear, pending, etc. |

### 8.3 Site Plan (PDF)

**File Pattern**: `Site_Plan*.pdf` or `Floor_Plan*.pdf`

| Database Table | Field | Extraction Method | Notes |
|----------------|-------|-------------------|-------|
| `school_rooms` | room_number | OCR + Pattern matching | Extract "Room 1", "A1", etc. |
| `school_rooms` | room_name | OCR + Pattern matching | Extract "Y4 Pine", "Hall", etc. |
| `school_rooms` | building | OCR or default | "Main Building" |
| `school_rooms` | floor | OCR or default | "Ground", "1", "Basement" |
| `school_rooms` | room_type | School validates | classroom, hall, office, storage, toilet, kitchen |
| `school_rooms` | class_name | Match with school_classes.class_name | Link pupil data to rooms |

---

## IMPORT PROCESS FLOW

```
1. CONNECT SCHOOL DRIVE
   ├─ Scan for folders matching known patterns
   ├─ Detect file types by folder/content
   └─ Create import manifest

2. PARSE FILES BY TYPE
   ├─ Census XML → Extract pupil, attendance, aggregates
   ├─ Assessment XLSX → Extract results by subject/component
   ├─ SEN Register → Extract SEN status, needs
   ├─ PP Strategy → Extract PP eligibility
   └─ Policy PDFs → Extract review dates via OCR

3. TRANSFORM & PSEUDONYMISE
   ├─ Generate per-school salt for pseudonymisation
   ├─ Hash UPNs: pseudo_ref = SHA-256(UPN + salt)[:24].toUpperCase()
   ├─ Map result codes to attainment levels
   ├─ Derive boolean flags (is_eal, has_send_support, etc.)
   └─ Calculate aggregates (sen_percentage, fsm_percentage, etc.)

4. IMPORT TO DATABASE
   ├─ Create census_imports audit record
   ├─ Insert pupil_census_snapshots (one row per pupil per census)
   ├─ Insert pupil_attendance_sessions (one row per reason code per pupil)
   ├─ Insert pupil_assessments_pseudo (one row per subject/component)
   ├─ Insert school_census_aggregates (one row per census)
   ├─ Update pupils table with SEN/PP flags from separate files
   └─ Link classes to rooms (if site plan processed)

5. VALIDATION & VERIFICATION
   ├─ Show preview: "421 pupils, 37 staff, 14 classes ready to import"
   ├─ Highlight anomalies: "3 pupils without UPN"
   ├─ Flag missing data: "No room numbers detected"
   └─ School confirms → Finalise import
```

---

## FILE TYPE DETECTION RULES

When scanning folders, identify file types by:

| Pattern | Type | Priority | Notes |
|---------|------|----------|-------|
| `*census*.xml` | Census XML (DfE standard) | HIGH | Most reliable data source |
| `*Census*.xml` | Census XML (alternative naming) | HIGH | |
| `Census SPR*.xml` | Spring Census | HIGH | |
| `Census AUT*.xml` | Autumn Census | HIGH | |
| `Census SUM*.xml` | Summer Census | HIGH | |
| `*EYFS*.xlsx` | EYFS Profile | HIGH | Assessment data |
| `*Phonics*.xlsx` | Year 1 Phonics Check | HIGH | |
| `*KS1*.xlsx` | KS1 Teacher Assessment | HIGH | |
| `*KS2*.xlsx` | KS2 Teacher Assessment | HIGH | |
| `*MTC*.xlsx` | Multiplication Tables Check | HIGH | |
| `*SEN*Register*.xlsx` | SEN Register | HIGH | |
| `*SEND*Register*.xlsx` | SEN Register | HIGH | |
| `*Pupil*Premium*.xlsx` | PP Strategy/Register | HIGH | |
| `*Attendance*.xlsx` | Attendance Data | HIGH | |
| `*Governor*.xlsx` | Governor List | MEDIUM | |
| `*Site*Plan*.pdf` | Floor Plan | MEDIUM | OCR required |
| `*Floor*Plan*.pdf` | Floor Plan | MEDIUM | OCR required |
| `*.policy` | Policy Document | LOW | OCR for dates |
| `*.pdf` | Document | LOW | Content-specific parsing |

---

## ERROR HANDLING

### File Access Issues

| Error | Action |
|-------|--------|
| File is password-protected | Notify school, request unprotected version |
| File format unrecognised | Request standard format (Census XML, etc.) |
| File is corrupted | Log error, request re-export |
| Folder is empty | Log as no-data, continue |

### Data Quality Issues

| Issue | Detection | Action |
|-------|----------|--------|
| Missing UPN column | No UPN in file | Flag for school attention |
| Inconsistent date formats | Multiple date patterns | Normalise during import |
| Duplicate pupil records | Same UPN in multiple files | Use latest, flag duplicates |
| Missing essential columns | Required field null | Skip record, log warning |

---

## PRIVACY & SECURITY RULES

### What We Store

| Data Type | Storage | Justification |
|-----------|---------|---------------|
| Pupil names | Yes (clear) | Needed for school directory, "show me Year 4" |
| UPNs | No (hash only) | Unique identifier, sensitive |
| Dates of birth | Yes | Needed for age calculation, is not PII alone |
| Full postcodes | No (district only) | Too identifying, store first half only |
| Assessment results | Yes (pseudonymised) | Hashed UPN links, no names in analytics tables |
| Attendance data | Yes (pseudonymised) | Hashed UPN links, no names |

### Pseudonymisation Function

```sql
-- For each school, generate and store a random salt
UPDATE organizations SET census_salt = encode(gen_random_bytes(32), 'base64');

-- For each pupil, compute pseudo_ref
pseudo_ref = encode(digest(UPN || census_salt, 'sha256'), 'base64')
           .substring(1, 24)
           .toUpperCase();

-- Same UPN + same school always produces same pseudo_ref
-- Different schools = different salts = different pseudo_refs
```

---

## DEPENDENCIES

### Tables That Must Exist First

1. `organizations` → School must exist before any data import
2. `pupils` → Should be imported before `pupil_assessments_pseudo` (for pupil_id lookup, though we use pseudo_ref)
3. `school_classes` → Should be created before room linking
4. `census_imports` → Audit record, must exist before pupil_census_snapshots

### Import Order

1. Import organizations (from signup/onboarding)
2. Import pupils (from MIS or Census XML for basic data)
3. Import school_classes (from Census XML or MIS)
4. Import census data (creates pupil_census_snapshots, pupil_attendance_sessions)
5. Import assessments (creates pupil_assessments_pseudo)
6. Import SEN/PP updates (updates pupils table)
7. Import site plan (creates school_rooms)
8. Link classes to rooms

---

## CRITICAL SUCCESS FACTORS

### For Successful Import

1. **Census XML files** are most reliable - contain most pupil data in standard format
2. **Assessment files** are usually standard (DfE format) - mapping is predictable
3. **MIS exports** vary by system but contain essential linking data (names → classes)
4. **Site plan PDF** requires OCR - fallback to manual entry if OCR fails

### Common Failure Points

1. **OAuth not completed** → Can't browse folders → Use share link + API key
2. **Files are password-protected** → School must remove protection
3. **Non-standard file names** → Use content inspection, not just filenames
4. **Multiple census files** → Import all, use latest for current view
5. **Missing UPN column** → Cannot link assessment/attendance → Flag immediately

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-27 | Initial mapping document for Grove House Primary School onboarding |
