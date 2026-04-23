# Aurora Primary School — Onboarding Test Pack

**Session Date:** 2026-03-20
**Status:** Ready to Build with Google Drive MCP
**Priority:** HIGH — Complete onboarding validation

---

## 🎯 OBJECTIVE

Build a complete, testable "Schoolgle Drive" folder structure for Aurora Primary School that mirrors what a real UK primary school would place in Google Drive/OneDrive before onboarding to Schoolgle.

**Goal:** Validate the full onboarding wizard flow from file detection through room mapping to site model publication.

---

## 📊 WHAT WE DISCOVERED

### Aurora Has REAL Source-Backed Data (✅)

**Location:** `apps/platform/test-harness/aurora-primary/`

**Real Files Available (9MB, 14 files):**
- **Pupils:** `arbor_pupil_roll.xlsx` (420 pupils, 14 classes)
- **Staff:** `arbor_staff_export.xlsx` (35 staff)
- **Classes:** `arbor_teacher_class_history.xlsx` (teacher assignments)
- **Attendance:** `arbor_attendance_termly.xlsx` (2.4MB)
- **Behaviour:** `arbor_behaviour_export.xlsx` (3.3MB)
- **SEND:** `sen_register_arbor.xlsx` (EHCP, provisions, funding)
- **Assessments:** `insight_tracker_export.xlsx` (1.7MB)
- **Finance:** `fms_budget_summary_3yr.xlsx`, `fms_detailed_cost_centre_*.xlsx`
- **Historic:** `historical_ks2_results.xlsx`

**Validation Script:** `scripts/validate-aurora-data.mjs` — Run this first to verify all Aurora data integrity.

### Aurora Was Missing Premises Data (❌ → ✅ NOW SPECIFIED)

**Missing in Real Data:**
- Site plans / floor plans / fire plans
- Room register
- Asset register
- Contractor register
- Compliance certificates
- Statutory compliance calendar

**Solution:** Create synthetic-but-realistic test files matching the TypeScript site model structure.

---

## 📁 COMPLETE FOLDER STRUCTURE

```
📁 Schoolgle Drive - Aurora Primary/
│
├─ 📁 00 - Read Me First/
│  ├─ 📄 00_WELCOME_START_HERE.md
│  ├─ 📄 01_FOLDER_STRUCTURE_GUIDE.md
│  └─ 📄 02_FILE_CHECKLIST.md
│
├─ 📁 01 - School Details/
│  ├─ 📄 school_profile.csv
│  ├─ 📄 ofsted_report_2022.pdf
│  └─ 📄 siams_inspection_2023.pdf
│
├─ 📁 02 - MIS Exports/
│  ├─ 📁 Pupils/         → arbor_pupil_roll.xlsx (REAL)
│  ├─ 📁 Staff/          → arbor_staff_export.xlsx (REAL)
│  ├─ 📁 Classes/        → arbor_teacher_class_history.xlsx (REAL)
│  ├─ 📁 Attendance/     → arbor_attendance_termly.xlsx (REAL)
│  ├─ 📁 Behaviour/      → arbor_behaviour_export.xlsx (REAL)
│  ├─ 📁 SEND/           → sen_register_arbor.xlsx (REAL)
│  └─ 📁 Assessment/     → insight_tracker_export.xlsx (REAL)
│
├─ 📁 03 - Finance/
│  ├─ 📁 Budget/         → fms_budget_summary_3yr.xlsx (REAL)
│  ├─ 📁 Cost Centres/   → fms_detailed_cost_centre_*.xlsx (REAL)
│  └─ 📁 Orders/         → purchase_orders_sample_2024-25.xlsx (SYNTHETIC)
│
├─ 📁 04 - Site Plans & Premises/
│  ├─ 📁 Site Plans/     → 4 x floor plan PDFs (SYNTHETIC)
│  ├─ 📁 Fire Plans/     → 2 x fire safety PDFs (SYNTHETIC)
│  └─ 📁 Room Data/      → room_register.xlsx, room_class_mapping.xlsx (SYNTHETIC)
│
├─ 📁 05 - Estates & Compliance/
│  ├─ 📁 Assets/         → asset_register_2025.xlsx (SYNTHETIC)
│  ├─ 📁 Contractors/    → contractor_register_2025.xlsx (SYNTHETIC)
│  ├─ 📁 Certificates/   → 8 x compliance certificates (SYNTHETIC)
│  ├─ 📁 Checks/         → statutory_compliance_calendar_2025.xlsx (SYNTHETIC)
│  └─ 📁 COSHH/          → coshh_register_2025.xlsx (SYNTHETIC)
│
├─ 📁 06 - Historic Imports/
│  └─ 📄 historical_ks2_results.xlsx (REAL)
│
└─ 📁 07 - Evidence & Photos/
   ├─ 📁 Compliance Evidence/
   └─ 📁 Site Photos/
```

**Total: 40 files (11 real Aurora files + 29 synthetic test files)**

---

## 📋 SYNTHETIC FILES TO CREATE (WITH EXACT COLUMNS)

### Priority 1 — Critical for Onboarding Test

#### 1. school_profile.csv
```csv
urn,name,address,postcode,local_authority,phase,school_type,religious_character,telephone,email,headteacher,nor,opening_date
999001,Aurora Primary School,"123 Main Street, Leeds, West Yorkshire",LS19 6PP,Leeds,Primary,Community school,"Church of England","0113 1234567",admin@auroraprimary.co.uk,"Mrs J Williams",420,1910-09-01
```

#### 2. room_register_aurora.xlsx
**Sheet: Rooms**

| Room Code | Room Name | Floor | Room Type | Area (m²) | Capacity | Fire Exit | Notes |
|-----------|-----------|-------|-----------|-----------|----------|-----------|-------|
| RM-G-001 | Reception | Ground | Reception | 25 | 5 | Yes | Main entrance |
| RM-G-007 | Oak (Reception) | Ground | Classroom | 55 | 30 | Yes | EYFS |
| RM-G-008 | Maple (Reception) | Ground | Classroom | 55 | 30 | Yes | EYFS |
| RM-G-009 | Birch (Year 1) | Ground | Classroom | 55 | 30 | Yes | KS1 |
| RM-G-010 | Elm (Year 1) | Ground | Classroom | 55 | 30 | Yes | KS1 |
| RM-G-013 | Main Hall | Ground | Hall | 120 | 200 | Yes | Assembly/dining |
| RM-1-001 | Ash (Year 2) | First | Classroom | 55 | 30 | Yes | KS1 |
| RM-1-002 | Willow (Year 2) | First | Classroom | 55 | 30 | Yes | KS1 |
| RM-1-003 | Holly (Year 3) | First | Classroom | 55 | 30 | Yes | KS2 |
| RM-1-004 | Rowan (Year 3) | First | Classroom | 55 | 30 | Yes | KS2 |
| RM-1-007 | Cedar (Year 4) | First | Classroom | 50 | 30 | Yes | KS2 |
| RM-1-008 | Pine (Year 4) | First | Classroom | 50 | 30 | Yes | KS2 |
| RM-2-001 | Beech (Year 5) | Second | Classroom | 55 | 30 | Yes | KS2 |
| RM-2-002 | Chestnut (Year 5) | Second | Classroom | 55 | 30 | Yes | KS2 |
| RM-2-003 | Hazel (Year 6) | Second | Classroom | 55 | 30 | Yes | KS2 |
| RM-2-004 | Sycamore (Year 6) | Second | Classroom | 55 | 30 | Yes | KS2 |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Full specification: 35 rooms across Basement/Ground/First/Second floors**

**Columns Required:**
- Room Code (text, unique)
- Room Name (text)
- Floor (Basement/Ground/First/Second)
- Room Type (Classroom/Hall/Office/Staff Room/Library/ICT Suite/SEND Room/Kitchen/Dining/Toilet/Storage/Plant Room/Medical/Meeting Room/Cloakroom/Reception)
- Area (m²) (number)
- Capacity (integer)
- Fire Exit (Yes/No)
- Notes (text, optional)

#### 3. room_class_mapping_2025-26.xlsx
**Sheet: Class Mappings**

| Class Name | Year Group | Main Classroom | Alternative Room | Shared Spaces | Teacher | TA Support |
|------------|------------|----------------|------------------|---------------|---------|------------|
| Oak | Reception | RM-G-007 | RM-1-012 | Main Hall, EYFS outdoor | STF-003 | STA-015 |
| Maple | Reception | RM-G-008 | RM-1-012 | Main Hall, EYFS outdoor | STF-004 | STA-016 |
| Birch | Year 1 | RM-G-009 | | Main Hall | STF-005 | STA-017 |
| Elm | Year 1 | RM-G-010 | | Main Hall | STF-006 | STA-018 |
| Ash | Year 2 | RM-1-001 | RM-1-003 | Main Hall | STF-007 | |
| Willow | Year 2 | RM-1-002 | RM-1-004 | Main Hall | STF-008 | STA-019 |
| Holly | Year 3 | RM-1-003 | RM-1-001 | Library, ICT | STF-010 | STA-020 |
| Rowan | Year 3 | RM-1-004 | RM-1-002 | Library, ICT | STF-011 | |
| Cedar | Year 4 | RM-1-007 | RM-1-009 | Library, ICT | STF-012 | |
| Pine | Year 4 | RM-1-008 | RM-1-010 | Library, ICT | STF-013 | STA-021 |
| Beech | Year 5 | RM-2-001 | RM-1-007 | Hall, Library | STF-014 | STA-022 |
| Chestnut | Year 5 | RM-2-002 | RM-1-008 | Hall, Library | STF-017 | |
| Hazel | Year 6 | RM-2-003 | RM-2-005 | Hall, Library | STF-001 | STA-023 |
| Sycamore | Year 6 | RM-2-004 | RM-2-005 | Hall, Library | STF-002 | |

**Columns Required:**
- Class Name (Oak, Maple, Birch, Elm, Ash, Willow, Holly, Rowan, Cedar, Pine, Beech, Chestnut, Hazel, Sycamore)
- Year Group (Reception, Year 1-6)
- Main Classroom (Room Code from register)
- Alternative Room (optional)
- Shared Spaces (comma-separated)
- Teacher (Staff ID from arbor_staff_export.xlsx)
- TA Support (Staff ID, optional)

#### 4. asset_register_2025.xlsx
**Sheet: Assets**

| Asset ID | Asset Name | Category | Location | Floor | Purchase Date | Cost | Status | Compliance Domains |
|----------|------------|----------|----------|-------|---------------|------|--------|-------------------|
| AST-001 | Main Hall Projector | AV Equipment | Main Hall | Ground | 2023-07-15 | £1,200 | Active | electrical |
| AST-007 | Boiler | Heating | Boiler Room | Basement | 2020-06-15 | £8,500 | Active | gas, electrical |
| AST-008 | Fire Alarm Panel | Fire Safety | Main Hall | Ground | 2021-03-22 | £4,200 | Active | fire |
| AST-018a | Interactive Panel | ICT | Oak | Ground | 2023-08-15 | £2,800 | Active | electrical |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Full specification: 150+ assets including:**
- 14 interactive panels (one per classroom)
- Fire safety equipment
- Kitchen equipment
- Boiler
- ICT suite desktops
- Furniture sets

**Columns Required:**
- Asset ID (text, unique)
- Asset Name (text)
- Category (AV Equipment/Catering/Heating/Fire Safety/Welfare/Music/Storage/Furniture/ICT/Office)
- Location (Room Name)
- Floor (Basement/Ground/First/Second)
- Purchase Date (YYYY-MM-DD)
- Cost (£ currency)
- Status (Active/Retired/Under Repair)
- Compliance Domains (comma-separated: fire, gas, electrical, asbestos, legionella)

#### 5. contractor_register_2025.xlsx
**Sheet: Contractors**

| Contractor ID | Company Name | Contact Name | Email | Phone | Mobile | Services | Accreditations | Insurance Expiry | Preferred |
|---------------|--------------|--------------|-------|-------|--------|----------|----------------|------------------|-----------|
| CON-001 | FireSafe UK Ltd | John Mitchell | john.mitchell@firesafeuk.co.uk | 01179 123456 | 07700 900123 | Fire Alarm Maintenance | BAFE SP203-1 | 2025-05-15 | Yes |
| CON-003 | ABC Gas Services Ltd | David Wilson | d.wilson@abcgas.co.uk | 01179 345678 | 07700 900456 | Gas Safety Inspection | Gas Safe Register 123456 | 2025-06-01 | Yes |
| CON-008 | PowerCheck Electrical | Steve Harris | s.harris@powercheck.co.uk | 01179 123457 | 07700 901234 | EICR Inspection | NICEIC Approved | 2025-07-31 | Yes |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Full specification: 12 contractors matching seed data structure**

**Columns Required:**
- Contractor ID (text, unique)
- Company Name (text)
- Contact Name (text)
- Email (text)
- Phone (text)
- Mobile (text)
- Services (text)
- Accreditations (text)
- Insurance Expiry (YYYY-MM-DD)
- Preferred (Yes/No)

#### 6. statutory_compliance_calendar_2025.xlsx
**Sheet: Compliance Schedule**

| Check ID | Check Name | Compliance Domain | Frequency | Last Completed | Next Due | Responsible | Evidence Required | Status |
|----------|------------|-------------------|------------|----------------|----------|-------------|-------------------|--------|
| STAT-001 | Fire Risk Assessment | Fire | 3-yearly | 2024-09-01 | 2027-09-01 | SBM | FRA document | Due |
| STAT-003 | Fire Extinguisher Annual Service | Fire | Yearly | 2024-06-15 | 2025-06-15 | FireSafe UK | Certificate | Current |
| STAT-006 | Gas Safety Inspection | Gas | Yearly | 2024-08-15 | 2025-08-15 | ABC Gas | Certificate | Current |
| STAT-008 | EICR Inspection | Electrical | 5-yearly | 2020-03-10 | 2025-03-10 | PowerCheck | EICR report | Due |
| STAT-010 | Legionella Risk Assessment | Legionella | 2-yearly | 2023-09-15 | 2025-09-15 | Water Hygiene | Risk assessment | Current |

**Full specification: 15 statutory checks**

**Columns Required:**
- Check ID (text, unique)
- Check Name (text)
- Compliance Domain (Fire/Gas/Electrical/Legionella/Asbestos/Mechanical)
- Frequency (Weekly/Monthly/Quarterly/Yearly/3-yearly/5-yearly)
- Last Completed (YYYY-MM-DD)
- Next Due (YYYY-MM-DD)
- Responsible (person or contractor)
- Evidence Required (text)
- Status (Current/Due/Overdue/Not Applicable)

---

### Priority 2 — Important but Not Blocking

#### 7. coshh_register_2025.xlsx
**Columns:** Product ID, Product Name, Hazard Type, Storage Location, Quantity, Supplier, SDS Date, Risk Level, Controls Required
**Rows:** ~15 products (cleaning chemicals, science kit, etc.)

#### 8. purchase_orders_sample_2024-25.xlsx
**Columns:** PO Number, Date, Supplier, Category, Description, Amount, Budget Code, Status, Approved By
**Rows:** ~12 sample purchase orders

#### 9. Welcome/README files
- `00_WELCOME_START_HERE.md` — Onboarding instructions
- `01_FOLDER_STRUCTURE_GUIDE.md` — Purpose of each folder
- `02_FILE_CHECKLIST.md` — Required vs optional files

---

### Priority 3 — Can Defer or Create Simple Versions

#### 10. Site Plan PDFs (4 files)
- `aurora_site_overview_plan.pdf`
- `aurora_floor_plan_ground.pdf`
- `aurora_floor_plan_first.pdf`
- `aurora_floor_plan_second.pdf`

**Note:** Can generate from `apps/platform/public/site-plans/aurora-*.svg` files using conversion tools, or create simple PDFs showing room layouts.

#### 11. Fire Plan PDFs (2 files)
- `aurora_fire_evacuation_plan.pdf`
- `aurora_fire_risk_assessment_2024.pdf`

**Note:** Create synthetic but realistic versions matching compliance requirements.

#### 12. Certificate PDFs (8 files)
- Fire alarm, fire extinguisher, gas safety, electrical EICR, legionella, asbestos, emergency lighting, etc.

**Note:** Create synthetic certificates matching contractor register data.

---

## 🔧 HOW TO BUILD (NEXT SESSION WITH GOOGLE DRIVE MCP)

### Step 1: Create Folder Structure in Google Drive

Use MCP tools to:
1. Create folder "Schoolgle Drive - Aurora Primary"
2. Create all 7 top-level folders (00-07)
3. Create all subfolders

### Step 2: Copy Real Aurora Files

From local: `apps/platform/test-harness/aurora-primary/`

To Google Drive folders:
- arbor-exports/* → appropriate 02 - MIS Exports subfolders
- tracker-exports/* → 02 - MIS Exports/Assessment
- fms-exports/* → 03 - Finance subfolders
- dfe-data/* → 06 - Historic Imports

### Step 3: Create Synthetic Spreadsheets

Using MCP tools or manual creation:
1. Create `school_profile.csv` with Aurora profile data
2. Create `room_register_aurora.xlsx` with 35 rooms (use column spec above)
3. Create `room_class_mapping_2025-26.xlsx` with 14 class mappings
4. Create `asset_register_2025.xlsx` with 150+ assets
5. Create `contractor_register_2025.xlsx` with 12 contractors
6. Create `statutory_compliance_calendar_2025.xlsx` with 15 statutory checks
7. (Optional) Create COSHH register, purchase orders, README files

### Step 4: Create/Skip PDF Files

**Option A:** Create simple synthetic PDFs using MCP or document generation
**Option B:** Skip PDFs initially, test onboarding with spreadsheet data only (most critical data is in spreadsheets)

### Step 5: Validate the Pack

1. Run Aurora validation: `node apps/platform/scripts/validate-aurora-data.mjs`
2. Verify all files present in Google Drive
3. Check folder structure matches specification

### Step 6: Test Onboarding

1. In Schoolgle platform: Settings → Data Connections
2. Connect to Google Drive
3. Run Readiness Scan
4. Start Setup Wizard
5. Step through full onboarding flow

---

## ✅ SUCCESS CRITERIA

**File Completeness:**
- ✅ All 11 real Aurora files copied
- ✅ All 6 Priority 1 synthetic files created
- ✅ Total 40 files in "Schoolgle Drive - Aurora Primary"

**Readiness Scan:**
- ✅ MIS Exports: 7/7 found
- ✅ Finance: 3/3 found
- ✅ Site Plans: 2/2 spreadsheets found (PDFs optional)
- ✅ Room Data: 2/2 found
- ✅ Estates: 3/3 found (assets, contractors, compliance calendar)
- ✅ Overall readiness: 95%+ (PDFs optional)

**Onboarding Wizard:**
- ✅ School profile detected and matched
- ✅ MIS exports validated (420 pupils, 35 staff, 14 classes)
- ✅ Room detection working (35 rooms detected from register)
- ✅ Class-to-room mapping possible (14 classes mapped)
- ✅ Assets imported (150+)
- ✅ Contractors imported (12)
- ✅ Compliance calendar populated (15 checks)
- ✅ Site model published successfully

**Database Verification:**
```sql
-- Post-onboarding, these queries should return:
SELECT COUNT(*) FROM pupils WHERE organization_id = 'aurora';  -- 420
SELECT COUNT(*) FROM staff_directory WHERE organization_id = 'aurora';  -- 35
SELECT COUNT(*) FROM estates_locations WHERE organization_id = 'aurora';  -- 35
SELECT COUNT(*) FROM estates_assets WHERE organization_id = 'aurora';  -- 150+
SELECT COUNT(*) FROM estates_contractors WHERE organization_id = 'aurora';  -- 12
```

---

## 📝 NOTES FOR NEXT SESSION

1. **You have Google Drive MCP access** — This is the key enabler
2. **All Aurora real files exist** — Just need copying to correct folders
3. **Synthetic file specifications are complete** — Use the column definitions above
4. **Start with Priority 1 files** — Those are critical for testing
5. **PDF files can be deferred** — Spreadsheets contain most important data
6. **Validation script exists** — Run `validate-aurora-data.mjs` first
7. **Test harness scenarios documented** — See `test-harness/aurora-primary/scenarios_and_stories.md` for test cases

---

## 🎯 NEXT SESSION PROMPT

Use this to continue work:

```
Continue building the Aurora Primary School onboarding test pack.

I now have Google Drive MCP access.

Context:
- We've specified the complete "Schoolgle Drive - Aurora Primary" folder structure (40 files)
- Real Aurora files exist in apps/platform/test-harness/aurora-primary/
- Synthetic file specifications are documented in memory/AURORA_ONBOARDING_PACK.md

Your tasks:
1. Create the full folder structure in my Google Drive
2. Copy all real Aurora files from test-harness to appropriate Drive folders
3. Create the 6 Priority 1 synthetic spreadsheets using MCP tools (room_register, room_class_mapping, asset_register, contractor_register, compliance_calendar, school_profile)
4. Validate the pack is complete
5. Test the Schoolgle readiness scan against this Drive folder

Start now. Be systematic. Confirm each step as complete before moving to the next.
```

---

**END OF DOCUMENTATION**
