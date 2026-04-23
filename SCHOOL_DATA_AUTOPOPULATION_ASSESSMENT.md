# SCHOOL DATA AUTO-POPULATION ASSESSMENT
## Grove House Primary School - Frictionless Onboarding Analysis

**Date**: 2026-03-27
**Purpose**: Assess what standard school data can populate the database automatically vs what gaps exist

---

## EXECUTIVE SUMMARY

### What We Found

Standard MIS exports (Arbor, SIMS, Bromcom) contain **~80% of core data** needed to populate the Schoolgle database automatically. The remaining ~20% requires clever solutions combining semi-automated processing (OCR, PDF parsing) and simple manual tools.

### Key Insight

Schools already have all the data we need—it's just locked in different formats:
- MIS exports (Excel/CSV) → pupil, staff, assessment data
- Site plans (PDF) → room numbers, spatial layout
- Ofsted evidence folders (PDF/Word) → policies, compliance dates
- Finance system (separate) → contracts, suppliers

---

## PART 1: DATA WE CAN AUTO-POPULATE ✓

### 1.1 PUPIL DATA (from Pupil Roll export)

| Database Field | MIS Export Field | Privacy Notes |
|----------------|------------------|---------------|
| `pupils.pupil_id` | Student ID | Safe |
| `pupils.first_name` | Legal First Name | Store for directory |
| `pupils.last_name` | Legal Last Name | Store for directory |
| `pupils.date_of_birth` | Date of Birth | Store, calculate age, keep DOB |
| `pupils.gender` | Gender | M/F |
| `pupils.year_group` | Year Group | R, 1, 2, ... |
| `pupils.class_name` | Registration Group | "Y4 Pine" |
| `pupils.ethnicity` | Ethnicity | WBRI, etc. |
| `pupils.is_eal` | First Language != English | Derived |
| `pupils.is_pupil_premium` | Pupil Premium | Boolean |
| `pupils.fsm_eligible` | FSM Eligible | Boolean |
| `pupils.is_looked_after` | In Care (LAC) | Boolean |
| `pupils.has_send_support` | SEN Status != N | Boolean |
| `pupils.sen_status` | SEN Status | E/K/N |
| `pupils.primary_need` | SEN Primary Need | ASD, MLD, etc. |

**Coverage**: ~15 fields auto-populated per pupil

### 1.2 STAFF DATA (from Staff export)

| Database Field | MIS Export Field | Notes |
|----------------|------------------|-------|
| `staff_directory.first_name` | First Name | Safe |
| `staff_directory.last_name` | Last Name | Safe |
| `staff_directory.job_title` | Role | "Class Teacher", "Headteacher" |
| `staff_directory.role_category` | Role (mapped) | headteacher, class_teacher, etc. |
| `staff_directory.fte` | FTE | 1.0, 0.8, etc. |
| `staff_directory.start_date` | Start Date | Contract start |
| `staff_directory.payroll_number` | Staff ID | STF-001, etc. |
| `staff_directory.class_name` | Class Assignment | "Y6 Hazel" |
| `staff_dbs_records.dbs_type` | DBS Check | enhanced, standard |
| `staff_dbs_records.issue_date` | DBS Date | Certificate date |

**Missing but needed**:
- Email address (often separate directory export)
- Phone number
- Emergency contacts
- Qualifications (QTS, PGCE)
- Room assignment

### 1.3 ASSESSMENT DATA (from Statutory Results export)

| Database Field | MIS Export Field | Privacy |
|----------------|------------------|---------|
| `pupil_assessments_pseudo.pupil_hash` | UPN (SHA-256 hashed) | **PSEUDONYMISED** |
| `pupil_assessments_pseudo.assessment_type` | Sheet name (EYFS/Phonics/KS1/KS2) | Safe |
| `pupil_assessments_pseudo.stage` | Derived from year | EYF/KS1/KS2 |
| `pupil_assessments_pseudo.subject` | Column name | Reading, Writing, Maths, ELG |
| `pupil_assessments_pseudo.attainment_level` | Value | EXP, GDS, WTK, PKF, etc. |
| `pupil_assessments_pseudo.academic_year_start` | Academic Year | 2021, 2022, etc. |

**Coverage**: EYFS GLD, Phonics check, KS1, KS2, MTC

### 1.4 ATTENDANCE DATA (from Attendance export)

| Database Field | MIS Export Field | Privacy |
|----------------|------------------|---------|
| `pupil_attendance_sessions.pseudo_ref` | UPN (SHA-256 hashed) | **PSEUDONYMISED** |
| `pupil_attendance_sessions.period_type` | Term | termly |
| `pupil_attendance_sessions.sessions_possible` | Possible Sessions | Integer |
| `pupil_attendance_sessions.session_count` | Present/Absent | Derived |
| `pupil_attendance_sessions.reason_code` | Mapped | /, \, B, I, etc. |
| `school_census_aggregates.*` | Aggregated | School-level stats |

### 1.5 CLASS & TEACHER ASSIGNMENTS

| Database Field | MIS Export Field | Notes |
|----------------|------------------|-------|
| `school_classes.class_name` | Class Name | "Y4 Pine" |
| `school_classes.year_group` | Year Group | "Year 4" |
| `school_classes.key_stage` | Derived | KS1, KS2 |
| `school_classes.pupil_count` | Count of pupils | Derived |

**Teacher-Class Linking** (from Teacher Class History):
- Staff ID → Class Name (historical, by academic year)
- Enables: "Who taught this class in 2022-23?"

---

## PART 2: CRITICAL GAPS ❌

### 2.1 ROOMS & SPATIAL DATA

**Problem**: MIS exports contain NO room numbers

**Impact**:
- Can't link pupils → classrooms (location)
- Can't link assets → rooms (fire extinguisher in room X)
- Can't link staff → rooms (teacher office)
- Can't generate floor plans

**Available Source**: Site plan PDF (every school has one)

**Proposed Solution**:
```
Upload Site Plan PDF
         ↓
    OCR Processing
         ↓
Extract Room Labels (pattern matching: "Room 1", "Y4 Pine", "Hall")
         ↓
Create rooms table entries
         ↓
School validates: "Yes, Room 12 is Y4 Pine Classroom"
         ↓
School adds: room_type (classroom), room_purpose
```

**Database Schema Needed**:
```sql
CREATE TABLE school_rooms (
  id UUID PRIMARY KEY,
  organization_id UUID,
  room_number TEXT,              -- "12", "A1"
  room_name TEXT,                -- "Y4 Pine", "Main Hall"
  room_type TEXT,                -- classroom, hall, office, storage
  building TEXT,                 -- "Main Building", "KS1 Block"
  floor TEXT,                    -- "Ground", "1"
  capacity INTEGER,
  has_projector BOOLEAN,
  has_whiteboard BOOLEAN,
  needs_renovation BOOLEAN,
  -- Link to class
  class_name TEXT UNIQUE,        -- "Y4 Pine"
  -- Link to staff (office assignments)
  staff_id UUID
);
```

### 2.2 BUILDING & SITE INFORMATION

**Problem**: No building list, floor counts, site areas

**Available Sources**:
- Site plan PDF (building outlines)
- DfE Capital Return (some schools)
- Asset register (may have building names)

**Proposed Tool**:
```
Simple Form: Building Setup
┌─────────────────────────────────┐
│ Building Name: [Main Building]  │
│ Number of Floors: [2]           │
│ Year Built: [1975]              │
│ Building Type: [Teaching Block] │
│                                 │
│ [+ Add Another Building]         │
└─────────────────────────────────┘
```

### 2.3 ASSETS & EQUIPMENT

**Problem**: MIS doesn't track fire extinguishers, boilers, ICT equipment

**Available Sources**:
- Asset register Excel (some schools)
- Fire safety log (separate)
- Manual entry

**Proposed Tool**:
```
Asset Import Tool
┌──────────────────────────────────────┐
│ Upload Asset Register Excel          │
│ OR                                    │
│ Manual Entry:                         │
│   - Asset Type: Fire Extinguisher    │
│   - Location: Room 12 (dropdown)      │
│   - Last Inspection: [date picker]    │
│   - Next Inspection: [auto-calc]      │
└──────────────────────────────────────┘
```

### 2.4 GOVERNORS & TRUSTEES

**Problem**: Governor data not in MIS

**Available Sources**:
- DfE Get Information about Schools (GIAS)
- Separate governor management system
- Clerk minutes

**Proposed Tool**:
```
Governor Setup Wizard
┌──────────────────────────────────────┐
│ Import from GIAS (URN lookup)        │
│ OR                                    │
│ Manual Entry:                         │
│   Name: [Jane Smith]                  │
│   Role: [Chair of Governors]          │
│   Term Start: [date]                  │
│   Term End: [date]                    │
│   Committee: [Finance & Resources]    │
└──────────────────────────────────────┘
```

### 2.5 POLICIES & COMPLIANCE DATES

**Problem**: Policy review dates scattered across Word/PDF documents

**Available Sources**:
- Ofsted Evidence folder (Grove House has this!)
- School website
- Policy tracker (some schools use)

**Proposed Solution**:
```
Scan Ofsted Evidence Folder
         ↓
    OCR + Pattern Matching
         ↓
Extract: Policy Name, Review Date, Category
         ↓
Create compliance_tracking entries
         ↓
School validates and adds missing policies
```

### 2.6 STAFF GAPS

**Missing from Staff Export**:
- Email address (often separate directory export)
- Phone number
- Emergency contacts
- Qualifications (QTS number, PGCE details)
- Full training history

**Proposed Solutions**:
1. **Email/Phone**: Import from separate directory CSV, or school enters
2. **Emergency Contacts**: Simple form entry
3. **Qualifications**: Manual entry or scan certificates
4. **Training**: Import from CPD spreadsheet if available

---

## PART 3: PROPOSED ONBOARDING WORKFLOW

### Step 1: Automated MIS Import (5 minutes)

```
School uploads 3-4 files from their MIS:
  ☐ Pupil Roll export (CSV/XLSX)
  ☐ Staff export (CSV/XLSX)
  ☐ Statutory Results export (CSV/XLSX)
  ☐ Attendance export (CSV/XLSX)

System:
  - Validates file format
  - Maps columns automatically
  - Pseudonymises UPNs for assessment/attendance
  - Creates pupil, staff, class records
  - Shows preview: "421 pupils, 37 staff, 14 classes ready to import"
  - School confirms → Import
```

### Step 2: Site Plan Processing (5 minutes)

```
School uploads: Site Plan PDF

System:
  - OCR processing
  - Extracts room labels: "Room 1", "Y4 Pine", "Hall", "Office"
  - Creates draft rooms table
  - Shows: "Detected 24 rooms"

School validates:
  Room 12  → Is this "Y4 Pine"? [Yes/No/Custom name]
  Room 13  → Is this "Y4 Willow"? [Yes/No/Custom name]
  ...

  For each room, select type:
  [Classroom] [Office] [Hall] [Storage] [Toilet] [Kitchen] [Other]
```

### Step 3: Gap-Filling Tools (10-20 minutes)

```
Quick Setup Forms:

1. Buildings (if not detected from site plan)
   - Main Building, 2 floors

2. Governors
   - Import from GIAS or enter manually
   - 5-10 governors typically

3. Policies (auto-detected from Ofsted folder)
   - Review detected policies
   - Add any missing

4. Assets (optional)
   - Upload asset register or skip
   - Can do later
```

### Step 4: Final Review & Go Live

```
Summary Dashboard:
✓ 421 pupils imported
✓ 37 staff imported
✓ 14 classrooms linked
✓ 24 rooms detected and classified
✓ 8 governors added
✓ 45 policies tracked
⚠  0 assets (add later)

[Complete Setup] → Dashboard ready!
```

---

## PART 4: DATABASE SCHEMA ADDITIONS NEEDED

### 4.1 School Rooms Table

```sql
CREATE TABLE school_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Identification
  room_number TEXT NOT NULL,           -- "12", "A1", "Hall"
  room_name TEXT,                      -- "Y4 Pine Classroom", "Main Hall"
  room_code TEXT UNIQUE,               -- Derived from building+number

  -- Location
  building TEXT DEFAULT 'Main Building',
  floor TEXT,                          -- "Ground", "1", "Basement"
  room_type TEXT,                      -- classroom, hall, office, storage, toilet, kitchen, other

  -- Classification (for matching)
  class_name TEXT UNIQUE,              -- Links to school_classes.class_name
  key_stage TEXT,                      -- EYFS, KS1, KS2 (derived from class)

  -- Capacity & Features
  capacity INTEGER DEFAULT 30,
  has_projector BOOLEAN DEFAULT false,
  has_whiteboard BOOLEAN DEFAULT true,
  has_computers INTEGER DEFAULT 0,
  has_sink BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,

  -- Status
  is_in_use BOOLEAN DEFAULT true,
  needs_renovation BOOLEAN DEFAULT false,
  renovation_notes TEXT,

  -- Links
  main_staff_id UUID REFERENCES staff_directory(id),  -- Teacher's office
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link pupils to their classroom (transient - changes yearly)
CREATE TABLE pupil_classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  academic_year_start INTEGER NOT NULL,  -- 2024
  pupil_id UUID REFERENCES pupils(id),
  room_id UUID REFERENCES school_rooms(id),
  UNIQUE(organization_id, pupil_id, academic_year_start)
);
```

### 4.2 Buildings Table

```sql
CREATE TABLE school_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  building_name TEXT NOT NULL,
  building_code TEXT,
  building_type TEXT,                  -- teaching, admin, sports, other
  address TEXT,

  -- Physical
  year_built INTEGER,
  number_of_floors INTEGER DEFAULT 1,
  floor_area_sqm NUMERIC(10,2),

  -- Use
  is_accessible BOOLEAN DEFAULT false,
  has_lift BOOLEAN DEFAULT false,

  -- Site plan
  site_plan_coordinates JSONB,        -- For overlay on map
  external_photo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Enhanced Assets Table

```sql
-- Extend estates_assets with room links
ALTER TABLE estates_assets ADD COLUMN room_id UUID REFERENCES school_rooms(id);
ALTER TABLE estates_assets ADD COLUMN room_number TEXT;  -- Denormalized for quick lookup
```

### 4.4 Staff Room Assignment

```sql
-- Link staff to offices/rooms
CREATE TABLE staff_room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  staff_id UUID REFERENCES staff_directory(id),
  room_id UUID REFERENCES school_rooms(id),
  assignment_type TEXT,               -- office, classroom, hotdesk, other
  is_primary BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, room_id, is_primary)
);
```

---

## PART 5: PRIVACY & SECURITY CONSIDERATIONS

### 5.1 Pupil Data Pseudonymisation

**DO NOT STORE** (use hash only):
- UPN (store SHA-256 hash with per-school salt)
- Full postcode in census (district only: "BD2")

**CAN STORE** (for directory):
- Pupil names (for school display)
- Date of birth (needed for age calculation)
- Class assignments

**PSEUDONYMISE** (for analytical data):
- Assessment data: link via SHA-256(UPN + salt)
- Attendance data: link via SHA-256(UPN + salt)

### 5.2 Staff Data

**CAN STORE**:
- Names, emails, job titles (directory data)
- DBS status (clear/pending only, not certificate content)
- Qualifications (type, date, awarding body)
- Training records (mandatory compliance)

**DO NOT STORE** (unless encrypted):
- National Insurance number
- Full address (for payroll)
- Salary data (aggregate only)
- Medical details (summary only for first aiders)

---

## PART 6: SUMMARY OF NEXT STEPS

### Immediate (Required for MVP)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Create MIS import pipeline (pupil, staff, assessments) | 3 days |
| P0 | Implement pupil pseudonymisation | 1 day |
| P0 | Create school_rooms table | 1 day |
| P1 | Build site plan OCR room extractor | 2 days |
| P1 | Create room classification UI tool | 1 day |
| P1 | Link classes → rooms | 1 day |

### Short Term (Enhances experience)

| Priority | Task | Effort |
|----------|------|--------|
| P2 | Governor import from GIAS | 1 day |
| P2 | Policy scanner for Ofsted folder | 2 days |
| P2 | Asset register import template | 1 day |
| P3 | Staff qualification entry | 1 day |
| P3 | Building setup wizard | 1 day |

### Long Term (Nice to have)

| Priority | Task | Effort |
|----------|------|--------|
| P3 | Certificate OCR (qualifications) | 3 days |
| P3 | Floor plan visual editor | 5 days |
| P4 | Timetable import | 3 days |
| P4 | Parent contact import | 2 days |

---

## CONCLUSION

**We can auto-populate ~80% of core school data** from standard MIS exports. The remaining gaps are solvable through:

1. **Site plan OCR** → room extraction (schools all have these)
2. **Simple validation tools** → school confirms room classifications
3. **Targeted manual entry** → governors, policies, assets

The key insight is that schools already have this data—we just need to provide the right import and validation tools to unlock it.
