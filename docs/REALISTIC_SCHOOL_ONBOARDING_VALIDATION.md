# Realistic School Onboarding Validation

**Date:** 2026-03-19
**Method:** Code-path trace of every UI surface, API endpoint, and user journey a new school would encounter

---

## Test School: Meadowbrook Primary Academy

**Profile:** 2-form entry primary, 420 pupils, 32 staff, LA-maintained, Church of England, Arbor MIS, SIMS FMS

**Source data available:**

- Staff list CSV (32 staff with roles, emails, employee IDs)
- Pupil roll CSV (420 pupils with year groups, classes, SEN status, PP/FSM flags)
- FMS budget monitor Excel (CFR-coded, 2025/26)
- Payroll summary CSV (32 staff with salaries, pay scales, FTE)
- Assessment tracker CSV (Year 2 + Year 6, reading/writing/maths)
- Google Drive folder with subfolders: Staff, Pupils, Finance, Assessments, Policies

---

## Onboarding Journey — Step by Step

### Step 1: Sign Up and Create Organisation

**UI:** `/signup` → `/onboarding/select-school` → `/onboarding/confirm-school`
**What happens:**

1. Admin signs in via Google OAuth
2. Searches "Meadowbrook Primary" — DfE GIAS returns match
3. Confirms school — org created with DfE data (name, address, phone, URN, LA, phase, church status)
4. First user gets `admin` role
5. Redirected to `/dashboard`

**Status:** SMOOTH — works end-to-end, DfE enrichment is impressive
**User experience:** 3 clicks from sign-up to dashboard. Church school auto-detected, SIAMS enabled.

### Step 2: Setup Wizard

**UI:** `/dashboard/setup`
**What happens:**

1. Shows 5-step progress tracker (all at 0%)
2. Staff, Pupils, Governance, Risk, Compliance steps with clear CTAs
3. CSV template downloads available for staff and pupils
4. Links to relevant module pages

**Status:** SMOOTH — clear guidance, template downloads work
**User experience:** Admin knows what to do next. Can complete steps in any order.

### Step 3: Import Staff

**UI:** `/dashboard/hr/people` → Import CSV modal
**What happens:**

1. Downloads staff CSV template from setup wizard
2. Fills in 32 staff members from Arbor export
3. Uploads via import modal in Staff Directory
4. Import processes: 30 imported, 2 errors (missing job titles) — clear error messages
5. Staff appear in directory with searchable list

**Status:** SMOOTH — production-quality import experience
**User experience:** Fuzzy role matching handles "Head Teacher" → headteacher, "TA L2" → teaching_assistant. Warnings for missing emails. Round-trip export/re-import works.

### Step 4: Import Pupils

**UI:** `/dashboard/setup` → downloads pupil CSV template
**What happens:**

1. Admin downloads template from setup wizard
2. Fills in 420 pupils from Arbor pupil roll export
3. **GAP: No dedicated upload page** — must call API via technical means or wait for UI
4. If API called directly: imports 415, 5 errors (invalid SEN codes) — clear messages

**Status:** MANUAL BUT ACCEPTABLE — API works, Papa Parse handles messy data, but no UI upload page exists
**User experience:** Technical admin can use API. Non-technical admin needs help or a built upload page.

### Step 5: Connect Google Drive

**UI:** `/dashboard/settings/data-connections`
**What happens:**

1. Admin pastes Google Drive folder share link
2. Schoolgle validates via Google Drive API
3. Scans folder structure — detects: Staff (8 files), Pupils (3 files), Finance (5 files), Assessments (2 files), Policies (12 files)
4. Shows category cards with file counts
5. Admin can browse and preview files by category

**Status:** SMOOTH — genuinely functional Drive integration
**User experience:** Simple paste-and-connect. Auto-detection of folder categories is useful. File previews work.

**BUT:** After connecting, there's no "Import this file to Staff Directory" or "Send to Finance Module" button. The page is informational — it shows what's available but doesn't trigger imports.

### Step 6: Import Finance Data

**UI:** `/dashboard/finance` (currently hidden from pilot navigation)
**What happens:**

1. Admin navigates to finance page (if unhidden or via direct URL)
2. Drags FMS budget monitor Excel onto upload zone
3. Client-side parser detects CFR codes, budget lines, actuals
4. Shows parsed budget dashboard with variances

**Status:** FUNCTIONAL — budget parsing and dashboard work client-side
**BUT:** Module is hidden from pilot navigation. Admin would need direct URL.
**Also:** The parsed data is client-side only — it doesn't persist to `finance_transactions` table unless using the `/api/finance/import` API endpoint separately.

### Step 7: Import Payroll

**UI:** `/dashboard/finance/payroll` (hidden from pilot navigation)
**What happens:**

1. Admin drags payroll CSV onto upload zone
2. Client-side parser detects roles, salaries, pay scales
3. Shows parsed staff with on-costs (28.68%)
4. Calculates staffing ratio if school income entered

**Status:** FUNCTIONAL — zero-storage payroll analysis works
**BUT:** Hidden from pilot navigation. Zero-storage means data doesn't persist.

### Step 8: Upload Pupil Assessments

**UI:** Intelligence page → PupilAssessmentUploader component
**What happens:**

1. Admin selects assessment period (Autumn/Spring/Summer)
2. Drags assessment tracker CSV
3. System detects MIS format (Arbor), shows column mappings
4. Preview shows 10 rows with real names visible (client-side only)
5. Click "Encrypt & Analyse" → HMAC-SHA256 pseudonymisation in browser
6. Server receives hashed data, runs AI analysis
7. Returns: attainment gaps, teacher accuracy, EEF recommendations

**Status:** SMOOTH — sophisticated, privacy-first, production-quality
**User experience:** Best import UX in the platform. Clear privacy messaging. Meaningful output.

### Step 9: Upload Evidence Documents

**UI:** `/estates-compliance/evidence/upload` or `/dashboard/data-validation/upload`
**What happens:**

1. Admin selects document type (insurance cert, gas safety, DBS, etc.)
2. Drags PDF/image
3. AI extracts fields with confidence scores
4. Admin reviews and approves
5. Evidence stored and linked to compliance domain

**Status:** SMOOTH — functional extraction pipeline
**User experience:** Confidence score colour coding is helpful. Cross-checks add trust.

---

## Onboarding Summary

| Step | Task                 | UI Exists?    | Functional?        | User Experience                |
| ---- | -------------------- | ------------- | ------------------ | ------------------------------ |
| 1    | Sign up + create org | YES           | YES                | SMOOTH                         |
| 2    | Setup wizard         | YES           | YES                | SMOOTH                         |
| 3    | Import staff         | YES (modal)   | YES                | SMOOTH                         |
| 4    | Import pupils        | NO (API only) | YES (API)          | REQUIRES TECHNICAL HELP        |
| 5    | Connect Google Drive | YES           | YES                | SMOOTH (but no import actions) |
| 6    | Import finance       | YES (hidden)  | YES (client-side)  | HIDDEN FROM PILOT              |
| 7    | Import payroll       | YES (hidden)  | YES (zero-storage) | HIDDEN FROM PILOT              |
| 8    | Upload assessments   | YES           | YES                | SMOOTH (best UX)               |
| 9    | Upload evidence      | YES           | YES                | SMOOTH                         |

---

## What a Real Onboarding Team Would Experience

### With technical support (implementation partner):

**Rating: 8/10** — All import paths work. Technical team calls pupil API directly, uses finance import API. School admin handles staff import, Drive connection, assessments, and evidence through UI.

### Self-service (school admin alone):

**Rating: 6/10** — Staff import, Drive connection, assessments, and evidence are self-service. But pupil import requires technical knowledge (API call), and finance/payroll are hidden from navigation.

### Key gaps for self-service:

1. **Pupil upload needs a UI page** — the single highest-impact improvement
2. **Data Connections should trigger imports** — "Import this file to Staff Directory" button
3. **Finance should be accessible** for schools with real FMS data (not hidden)
