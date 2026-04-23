# SCHOOLGLE DATA REQUIREMENTS - SCHOOL EXPORT GUIDE

## Overview

To set up your Schoolgle platform with your school data, we need a few exports from your MIS (Management Information System). This document shows exactly what to export and how.

## Why We Need This Data

| Data | Purpose |
|------|---------|
| Pupil roll | Create pupil directory, class lists, enable Ed AI to refer to pupils by name |
| Staff directory | Staff list, roles, enable collaboration |
| Census data | Pupil characteristics, attendance, assessment analysis |
| Assessments | Track progress, identify gaps, populate dashboards |
| Site plan | Extract room numbers, link assets to locations |

---

## REQUIRED EXPORTS (3-4 files)

All MIS systems can export these reports. Choose your system below for specific instructions.

---

## OPTION 1: ARBOR

### 1. Pupil Roll Export

1. Go to **Students** → **Reports** → **Student Census**
2. Click **Generate Report**
3. Export as **Excel**
4. Save as: `Pupil_Roll_[school_name].xlsx`

**Columns we need** (all present in standard Arbor export):
| Column | Used For |
|--------|----------|
| Student ID | Unique identifier |
| UPN | Linking assessments (will be pseudonymised) |
| Legal First Name | Display name |
| Legal Last Name | Display name |
| Date of Birth | Age calculation |
| Gender | Demographics |
| Year Group | Class placement |
| Registration Form | Class name (e.g., "4 Pine") |
| Ethnicity | Demographics |
| First Language | EAL identification |
| FSM Eligible | Pupil Premium |
| Pupil Premium | Pupil Premium |
| In Care (LAC) | Looked After Children |
| SEN Status | SEN support level |
| SEN Primary Need | SEN category |

### 2. Staff Export

1. Go to **Students** → **Staff** → **Staff List**
2. Click **Export to Excel**
3. Save as: `Staff_Directory_[school_name].xlsx`

**Columns we need**:
| Column | Used For |
|--------|----------|
| Staff ID | Unique identifier |
| Title | Salutation |
| First Name | Display name |
| Last Name | Display name |
| Email | Contact |
| Role | Job title |
| FTE | Full-time equivalent |
| Teaching FTE | Teaching FTE |
| Class Assignment | Link to class |
| Start Date | Employment start |
| DBS Check | DBS status |
| DBS Date | Certificate date |

### 3. Site Plan

1. Locate your school site plan / floor plan PDF
2. Save as: `Site_Plan_[school_name].pdf`

**What we extract**:
- Room numbers (e.g., "Room 1", "A1")
- Room names (e.g., "Y4 Pine Classroom")
- Building outline

You will validate and classify rooms after import.

---

## OPTION 2: SIMS

### 1. Pupil Roll Export

1. Go to **Reports** → **Student** → **Student List**
2. Add columns (ensure these are selected):
   - Admission Number
   - UPN
   - Legal First Name
   - Legal Last Name
   - Date of Birth
   - Gender
   - Year Group
   - Reg Form
   - Ethnicity
   - First Language
   - FSM
   - Pupil Premium
   - SEN Provision
   - SEN Need
   - EHCP
3. Click **Export** → **Excel**

### 2. Staff Export

1. Go to **Reports** → **Staff** → **Staff List**
2. Ensure columns include:
   - Staff Code
   - Title
   - Forename
   - Surname
   - Email Address
   - Role
   - FTE
   - Contract Start Date
   - DBS Check
   - DBS Date
3. Click **Export** → **Excel**

### 3. Site Plan

Same as Option 1.

---

## OPTION 3: BROMCOM

### 1. Pupil Roll Export

1. Go to **Students** → **Export** → **Student Data**
2. Select **All Students**
3. Choose **Excel** format
4. Ensure these fields are included:
   - Student ID
   - UPN
   - First Name
   - Last Name
   - DOB
   - Gender
   - Year Group
   - Registration Group
   - Ethnicity
   - EAL Status
   - FSM
   - Pupil Premium
   - SEN Status
   - Primary Need
   - EHCP

### 2. Staff Export

1. Go to **Staff** → **Export** → **Staff List**
2. Choose **Excel** format
3. Ensure fields include:
   - Staff ID
   - Name fields
   - Email
   - Role
   - FTE
   - Start Date
   - DBS details

### 3. Site Plan

Same as Option 1.

---

## ALREADY IN YOUR GOOGLE DRIVE

If you've connected your Google Drive to Schoolgle, we may already have access to:

### Census Reports (DfE Census Returns)

**Files we look for**:
- `Census SPR2025.xml` (Spring census)
- `Census AUT2024.xml` (Autumn census)
- `Census SUM2024.xml` (Summer census)

**Contains** (no additional export needed):
- Pupil demographics (characteristics)
- Attendance data
- School aggregates

### Assessment Results

**Files we look for**:
- `EYFS_[year].xlsx` (Early Years Foundation Stage)
- `Phonics_[year].xlsx` (Year 1 Phonics Check)
- `KS1_[year].xlsx` (Key Stage 1 results)
- `KS2_[year].xlsx` (Key Stage 2 results)
- `MTC_[year].xlsx` (Multiplication Tables Check)

**Contains** (no additional export needed):
- Statutory assessment results
- Progress data

### SEN & Pupil Premium

**Files we look for**:
- `SEN_Register_[date].xlsx`
- `Pupil_Premium_Strategy_[year].xlsx`

**Contains** (no additional export needed):
- SEN status and needs
- Pupil Premium eligibility

---

## FILE CHECKLIST

Before starting import, ensure you have:

### Minimum Required (if NO Google Drive connection)

- [ ] `Pupil_Roll.xlsx` - Pupil data export
- [ ] `Staff_Directory.xlsx` - Staff data export
- [ ] `Site_Plan.pdf` - Floor plan

### With Google Drive Connection

If you've connected your Ofsted Evidence/Schoolgle Drive folder:

- [ ] Census files present (we'll detect automatically)
- [ ] Assessment files present (we'll detect automatically)
- [ ] `Pupil_Roll.xlsx` - For names/classes (still needed)
- [ ] `Staff_Directory.xlsx` - For staff emails (still needed)
- [ ] `Site_Plan.pdf` - For room numbers (still needed)

---

## TROUBLESHOOTING

### "I can't find that export in my MIS"

**Arbor**: Use the search function in Reports → Student Census

**SIMS**: Reports → Student List → Add columns if missing

**Bromcom**: Students → Export → Student Data

**Other systems**: Look for "Student Census", "Student List", "Staff Directory", or "Student Export"

### "I don't have a site plan PDF"

1. Check your DfE returns (may include floor plan)
2. Check your buildings/property insurance documents
3. Alternatively, we can create rooms manually after import

### "My column names are different"

That's okay! Our import process:
- Detects common column patterns
- Shows you a preview before importing
- Lets you map columns manually if needed

---

## WHAT HAPPENS NEXT

1. You provide the 3-4 files (or connect Google Drive)
2. We scan and validate the data
3. We show you a preview: "421 pupils, 37 staff, 14 classes detected"
4. You confirm the import
5. Data is imported and your Schoolgle dashboard is live

---

## PRIVACY NOTE

- Pupil names ARE stored in the database (needed for "Show me Year 4 Pine")
- UPNs are stored as secure hashes (one-way encryption)
- Assessment and attendance data is pseudonymised (no names in analytics)
- All data is isolated to your school (RLS - Row Level Security)
- You maintain full control and can export/delete anytime

---

## QUESTIONS?

Contact: support@schoolgle.co.uk
Subject: School Data Import
