# Grove House Primary School - Data Import Analysis

**Date**: 2026-03-27
**Organization**: Grove House Primary School (d9d1ac2c-5eff-4043-98f4-98f4-e1c43f616fd3)

---

## Current State

### What's Connected
✅ **Google Drive Connection**: Active
- Folder ID: `1iNg4wu2JqE76IDrdzT2hegoxzrv-Itqn`
- 40 detected folders

### What's Available in Drive
| Folder | Files | What They Contain |
|--------|-------|-------------------|
| `01_Ofsted_Evidence/Census Reports/` | 20 files | DfE Census XML (pupil demographics, SEN, FSM, EAL) |
| `01_Ofsted_Evidence/Assessments/` | 20 files | Assessment results (EYFS, Phonics, KS1, KS2, MTC) |
| `01_Ofsted_Evidence/03_Achievement/` | 1 file | Progress data |

### What's Missing (Database Tables Not Created)
❌ `census_imports` - table doesn't exist
❌ `pupil_census_snapshots` - table doesn't exist
❌ `pupil_assessments_pseudo` - table doesn't exist
❌ `pupils` - table doesn't exist (master pupil table)
❌ `ls_classes` - table exists but EMPTY (0 records)
❌ `ls_pupils` - table exists but EMPTY (0 records)

---

## Data Sources → Target Tables Mapping

### 1. Census XML Files (Google Drive) → Compliance Tables

| Source | Target Table | Contains | Privacy |
|--------|--------------|----------|---------|
| `Census SPR2025.xml` | `census_imports` | Metadata: term, year, date | Safe |
| `Census SPR2025.xml` | `pupil_census_snapshots` | Pupil demographics (pseudonymised) | **UPNs hashed** |
| `Census SPR2025.xml` | `pupil_attendance_sessions` | Attendance data (pseudonymised) | **UPNs hashed** |
| `Census SPR2025.xml` | `school_census_aggregates` | School-level statistics | Safe |

**What Census XML DOESN'T Have**: Pupil names (for display in Lesson Studio)

### 2. Assessment Excel Files (Google Drive) → Assessment Table

| Source | Target Table | Contains | Privacy |
|--------|--------------|----------|---------|
| `KS2_2025.xlsx` | `pupil_assessments_pseudo` | Reading/Writing/Maths results | **UPNs hashed** |

### 3. Pupil Roll CSV (MIS Export) → Teaching & Learning Tables

| Source | Target Tables | Contains | Privacy |
|--------|---------------|----------|---------|
| `Pupil_Roll.csv` | `pupils` | Master pupil record with names | **Names stored** |
| `Pupil_Roll.csv` | `ls_classes` | Class groups | Safe |
| `Pupil_Roll.csv` | `ls_pupils` | Pupil display data (encrypted names) | **Names encrypted** |

---

## The Missing Piece

**Problem**: The Pupil Records page (`/dashboard/teaching-learning/pupils`) displays data from `ls_classes` and `ls_pupils`, which are EMPTY.

**Root Cause**: No pupil names have been imported. Census XML files can't provide names (privacy design).

**Solution**: Import a **Pupil Roll CSV** from the school's MIS (Arbor/SIMS/Bromcom).

---

## Required Import Files

### Minimum Required (for Pupil Records to work)

| File | Source | Purpose |
|------|--------|---------|
| `Pupil_Roll_[Grove House].xlsx` | MIS Export | **Pupil names, classes, year groups** |

**Required Columns**:
```
pupil_id, first_name, last_name, year_group, class_name
```

**Optional Columns** (enrich records):
```
gender, date_of_birth, sen_status (E/K/N), primary_need,
is_pupil_premium, is_eal, fsm_eligible, ethnicity
```

### Optional Additional Imports

| File | Source | Purpose |
|------|--------|---------|
| Census XML files | Google Drive (already connected) | Compliance data, SEN flags, FSM |
| Assessment Excel files | Google Drive (already connected) | Attainment data |

---

## Import Flow

```
┌─────────────────────┐
│  MIS Export CSV     │
│  (Pupil Roll)        │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ POST /api    │
    │ /pupils      │ ──────► pupils table (master)
    └──────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ POST /api/pupils/           │
    │ sync-to-lesson-studio       │ ──────► ls_classes + ls_pupils
    └──────────────────────────────┘
           │
           ▼
    ┌─────────────────────┐
    │  Pupil Records      │
    │  Page Now Works!    │
    └─────────────────────┘
```

---

## What the School Needs to Provide

### Option 1: Quick Start (Pupil Records only)

Export a CSV from your MIS with these columns:
```
pupil_id, first_name, last_name, year_group, class_name
```

Upload via: `/dashboard/pupils` → "Select Files" → "Connect [N] Pupils"

### Option 2: Full Data Import

1. **Census data** - Already available in Google Drive (20 files)
2. **Assessment data** - Already available in Google Drive (20 files)
3. **Pupil Roll CSV** - Export from MIS (required for names)

---

## Data Quality Check

Once imported, the Pupil Records page will show:
- ✅ Class list (Year 1 - Year 6, Reception)
- ✅ Pupil count per class
- ✅ Individual pupil profiles (with SEND, PP, EAL flags)
- ✅ Attainment data (if assessment files also imported)

---

## Next Steps

1. **Run migrations** (for database admin):
   - `20260327_census_data_schema.sql`
   - `20260319_pupils_master.sql` (if not already applied)

2. **Export pupil roll** from Grove House's MIS:
   - Arbor: Students → Reports → Student List → Export
   - SIMS: Reports → Student List → Export
   - Bromcom: Students → Export → Student Data

3. **Import via UI**:
   - Go to `/dashboard/pupils`
   - Upload the CSV
   - Pupils will appear in `/dashboard/teaching-learning/pupils`

4. **Optional - Import Census data** (for compliance/analytics):
   - Run census import job on Google Drive files
   - This will populate SEND, PP, EAL flags from official census data
