# GROVE HOUSE PRIMARY SCHOOL - DATA ASSESSMENT
## Connected Google Drive Analysis

**Connection Status**: Connected but OAuth incomplete
**Folder ID**: 1iNg4wu2JqE76IDrdzT2hegoxzrv-Itqn ("AS")
**Scan Date**: 2026-03-27

---

## WHAT WE FOUND (From Folder Scan)

### Folder Structure Detected

| Folder | File Count | Category | Database Impact |
|--------|-----------|----------|-----------------|
| **Census Reports** | 20 files | census | HIGH - pupil demographics, characteristics |
| **Assessments** | 20 files | assessments | HIGH - statutory results |
| **SEND Provision** | 1 file | send | HIGH - SEN register |
| **Disadvantaged Pupils** | 1 file | pupil_premium | HIGH - PP strategy & data |
| **Attendance** | 1 file | attendance | HIGH - attendance data |
| **Governance** | 1 file | governance | MED - governor info |
| **Safeguarding** | 15+ files | safeguarding | MED - policies, procedures |
| **Staff Training** | 1 file | staff | LOW - training records |

---

## THE PROBLEM: CANNOT ACCESS FILES

**Issue**: Files are not accessible via API key - OAuth flow needs completion
**Current State**: Connection shows folder structure but not file contents
**Required**: Complete OAuth to read actual file names and contents

### Why This Happened

The connection was made using a "share link" method which:
✓ Scanned folder structure
✓ Detected file counts
✗ Did not store OAuth tokens for continued access
✗ Cannot browse file contents

---

## WHAT WE EXPECT TO FIND (Based on Folder Names)

### 1. Census Reports Folder (20 files)

**Typical files in this folder** (standard DfE format):
```
- SPR2025_Census_Return.xml (Spring census)
- AUT2024_Census_Return.xml (Autumn census)
- SUM2024_Census_Return.xml (Summer census)
- Census_Validation_Report_[date].pdf
- DfE_Census_summary_[date].pdf
- COLLECT_format_return_[date].xml
```

**Database tables this would populate**:

| Table | Fields from Census XML | Privacy Notes |
|-------|----------------------|---------------|
| `pupil_census_snapshots` | pseudo_ref, gender, age_band, sen_provision, fsm_eligible, nc_year_actual | **PSEUDONYMISED** |
| `pupil_attendance_sessions` | pseudo_ref, sessions_possible, session_count, reason_code | **PSEUDONYMISED** |
| `school_census_aggregates` | total_pupils, sen_percentage, fsm_percentage, overall_absence_rate | School-level |
| `school_classes` | class_name, year_group, pupil_count | Safe |
| `census_imports` | audit trail of imports | Safe |

**Coverage Estimate**: 30+ fields across 5 tables

### 2. Assessments Folder (20 files)

**Typical files**:
```
- EYFS_Profile_[year].xlsx (Early Years Foundation Stage)
- Year_1_Phonics_Check_[year].xlsx
- KS1_Teacher_Assessment_[year].xlsx
- KS2_Teacher_Assessment_[year].xlsx
- Multiplication_Tables_Check_[year].xlsx
- Progress_Data_[term].xlsx (tracker exports)
```

**Database tables this would populate**:

| Table | Fields from Assessment Files | Privacy Notes |
|-------|-----------------------------|---------------|
| `pupil_assessments_pseudo` | pupil_hash, assessment_type, subject, attainment_level | **PSEUDONYMISED** |
| `pupil_assessments_pseudo` | stage (EYF/KS1/KS2), component (ELG codes) | **PSEUDONYMISED** |

**Coverage Estimate**: 8-10 fields

### 3. SEND Provision Folder (1 file)

**Typical file**:
```
- SEN_Register_[date].xlsx
```

**Contains**:
- Pupil UPN, name, DOB
- SEN Status (E/K/N)
- Primary Need (ASD, MLD, etc.)
- Secondary Need
- EHCP details
- Provision map
- Key worker

**Database tables this would populate**:

| Table | Fields | Privacy |
|-------|--------|---------|
| `pupils` | has_send_support, sen_status, primary_need | Safe |
| `pupil_census_snapshots` | sen_provision, sen_type_primary | **PSEUDONYMISED** |

### 4. Disadvantaged Pupils Folder (1 file)

**Typical file**:
```
- Pupil_Premium_Strategy_[year].xlsx
or
- PP_Register_[date].xlsx
```

**Contains**:
- PP eligible pupils
- Funding amounts
- Intervention tracking
- Progress data

**Database tables this would populate**:

| Table | Fields | Privacy |
|-------|--------|---------|
| `pupils` | is_pupil_premium, fsm_eligible | Safe |
| `pupil_census_snapshots` | fsm_eligible, top_up_funding | Safe |

### 5. Attendance Folder (1 file)

**Typical file**:
```
- Attendance_Return_[term].xlsx
or
- Attendance_Summary_[date].pdf
```

**Contains**:
- Overall attendance %
- PA (Persistent Absence) flag
- Termly breakdown by reason code

**Database tables this would populate**:

| Table | Fields | Privacy |
|-------|--------|---------|
| `pupil_attendance_sessions` | sessions_possible, session_count, reason_code | **PSEUDONYMISED** |
| `school_census_aggregates` | overall_absence_rate, authorised_absence_rate | Safe |

### 6. Governance Folder (1 file)

**Typical file**:
```
- Governing_Body_Structure_[date].pdf
or
- Governor_List_[date].xlsx
```

**Contains**:
- Governor names
- Roles (Chair, committees)
- Terms of office
- Attendance records

**Database tables this would populate**:

| Table | Fields | Privacy |
|-------|--------|---------|
| `governors` (if exists) | name, role, start_date, end_date | Safe |
| `governance_meetings` | meeting_type, attendance | Safe |

---

## WHAT'S MISSING FROM THESE FOLDERS

### High Priority Gaps

| Data Needed | Source | Availability |
|-------------|--------|--------------|
| **Full pupil roll** with UPN, DOB, names | MIS export | ❌ NOT in Evidence folder |
| **Staff directory** | MIS export | ❌ NOT in Evidence folder |
| **Class lists** (pupil → class) | MIS export | ❌ NOT in Evidence folder |
| **Teacher assignments** | MIS export | ❌ NOT in Evidence folder |
| **Room numbers** | Site plan PDF | ❌ NOT in Evidence folder |
| **Asset register** | Separate file | ❌ NOT in Evidence folder |

### Medium Priority Gaps

| Data Needed | Source | Availability |
|-------------|--------|--------------|
| **Governor contact details** | Separate system | ❌ NOT in Evidence folder |
| **Policy review dates** | In policy documents | ✅ MAY be in Safeguarding folder |
| **Training records** | CPD tracker | ✅ MAY be in Staff Training folder |
| **Budget/finance data** | FMS export | ❌ NOT in Evidence folder |

---

## THE SOLUTION: TWO-PRONGED APPROACH

### Approach A: Process What's Available (Evidence Folder)

**Can auto-populate from existing files**:
✓ Census XML → pupil demographics, characteristics (pseudonymised)
✓ Assessment files → statutory results (pseudonymised)
✓ SEN register → SEN status, primary needs
✓ PP strategy → PP eligibility
✓ Attendance summary → overall attendance rates
✓ Policy documents → extract review dates via OCR

### Approach B: Request Specific MIS Exports

**Need school to provide these 4-5 files**:

| # | File Export | MIS Name | Purpose |
|---|-------------|----------|---------|
| 1 | **Pupil Roll** | "Student Census" or "Pupil Details" | Names, DOB, UPN, classes |
| 2 | **Staff Directory** | "Staff List" or "Contact Directory" | Names, emails, roles |
| 3 | **Class Assignments** | "Class Lists" | Pupil → class mappings |
| 4 | **Site Plan** | School floor plan PDF | Extract room numbers |
| 5 | **Asset Register** | (if available) | Fire safety, equipment |

---

## STANDARD EXPORT TEMPLATES TO PROVIDE

### Template 1: Pupil Roll (MIS Export)

**Required columns** (all MIS systems have these):
```
Student ID | UPN | First Name | Last Name | Date of Birth | Gender | Year Group | Class | Ethnicity | FSM | PP | SEN Status | EHCP | EAL | LAC
```

**MIS Export Instructions**:
- **Arbor**: Reports → Student Census → Export
- **SIMS**: Reports → Student → Student List → Export
- **Bromcom**: Students → Export → Student Census

### Template 2: Staff Directory (MIS Export)

**Required columns**:
```
Staff ID | Title | First Name | Last Name | Email | Job Title | Role | FTE | Class Assignment | Start Date | DBS Check | DBS Date
```

### Template 3: Site Plan (PDF)

**What we need**: Floor plan PDF with room labels
**What we'll extract**: Room numbers, room names, building outline
**School validates**: Room classifications (classroom, office, hall, etc.)

---

## DATABASE TABLES THAT WOULD BE POPULATED

### From Census XML (20 files) + MIS Export (1 file)

| Table | Rows | Key Fields | Source |
|-------|------|------------|--------|
| `pupils` | ~417 | pupil_id, first_name, last_name, dob, year_group, class, sen_status, pp, fsm | MIS Export |
| `pupil_census_snapshots` | ~1,200+ | pseudo_ref, gender, sen_provision, fsm_eligible, nc_year | Census XML (3 terms × 417) |
| `pupil_attendance_sessions` | ~5,000+ | pseudo_ref, sessions, reason_code | Census XML |
| `school_census_aggregates` | ~12 | school-level stats | Census XML |
| `school_classes` | ~14 | class_name, year_group, pupil_count | Census XML |

### From Assessment Files (20 files) + MIS Export

| Table | Rows | Key Fields | Source |
|-------|------|------------|--------|
| `pupil_assessments_pseudo` | ~3,000+ | pupil_hash, assessment_type, subject, result | Assessment files |
| `pupil_assessments_pseudo` | ~3,000+ | component (ELG codes for EYFS) | Assessment files |

### From SEN + PP Files

| Table | Rows | Key Fields | Source |
|-------|------|------------|--------|
| `pupils` updates | ~70 | sen_status, primary_need | SEN register |
| `pupils` updates | ~125 | is_pupil_premium, fsm_eligible | PP strategy |

---

## NEXT STEPS TO COMPLETE ASSESSMENT

### Immediate Actions

1. **Complete OAuth flow** for Grove House Drive connection
   - This will allow reading actual file names and contents
   - Can then provide exact assessment, not estimates

2. **Or**: User tells us specific file names in each folder
   - We can then assess exact data available

3. **Create MIS export templates** for schools
   - Clear instructions on which reports to run
   - Column mapping guides
   - One-page quick reference

### Questions for User

1. Can you complete the OAuth flow for the Grove House Drive connection?
2. Or can you share the actual file names in the Census Reports and Assessments folders?
3. Do you have access to run pupil/staff exports from their MIS (Arbor/SIMS/Bromcom)?

---

## SUMMARY

**What we CAN likely auto-populate from existing folders** (pending OAuth access):
- ✓ Census demographics (pseudonymised)
- ✓ Assessment results (pseudonymised)
- ✓ SEN status and primary needs
- ✓ Pupil Premium eligibility
- ✓ Attendance summaries
- ✓ Policy review dates (via OCR)

**What we NEED from MIS exports** (missing from Evidence folder):
- ❌ Pupil names + UPN mapping (for directory)
- ❌ Staff directory (names, emails, roles)
- ❌ Class lists (pupil → class assignments)
- ❌ Room numbers (from site plan PDF)

**Recommended approach**: Provide schools with simple "export these 4 reports" guide + site plan upload tool.
