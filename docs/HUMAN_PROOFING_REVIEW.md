# Human-Proofing Review

**Date:** 2026-03-19
**Persona:** Non-technical school administrator (office manager or deputy head)
**Standard:** Can they complete core tasks without developer assistance?

---

## Setup Journey Assessment

### Step 1: Sign Up and Create Organisation

**Clarity:** HIGH

- Google/Microsoft OAuth — familiar to all school staff
- School search by name or URN — natural for anyone who knows their school
- DfE auto-population of address, phone, etc. — impressive and trust-building
- **Potential confusion:** If school not found in DfE search (new school, free school, etc.) — "skip" option exists but may cause anxiety

### Step 2: Setup Wizard (/dashboard/setup)

**Clarity:** HIGH

- 5 clear steps with progress bar
- Each step shows count of imported/created items
- Direct links to relevant pages
- CSV template downloads accessible
- "Skip setup" option visible
- **Potential confusion:** "Import Pupils" links to Data Connections page, not a direct upload interface. User may not know how to upload a CSV from there.

### Step 3: Staff Import

**Clarity:** HIGH

- Template downloadable with embedded instructions (comment lines)
- Clear required/optional field indicators
- Error messages include row numbers and specific field names
- Warnings for missing optional data (email, employee_id)
- Fuzzy role matching ("Head" works, "Teacher" works) — forgiving
- **Potential confusion:** None significant. This is the strongest import experience.

### Step 4: Pupil Import

**Clarity:** MEDIUM

- Template downloadable with instructions
- Clear validation messages for invalid SEN codes
- Year group normalisation handles "Year 3", "Y4", "Reception" etc.
- **Potential confusion:**
  - Where to upload? No dedicated pupil upload UI page exists — must use API or setup wizard download + manual upload
  - What to do with errors? Errors list row numbers but there's no "fix and retry" UI
  - Relationship to attendance/SEND/behaviour not explained — "I imported pupils, why doesn't attendance show my children?"

---

## Module Usability Assessment

### Risk Register

**Can a school user...** | **Answer**
Complete all steps without help? | YES — clear "Add Risk" CTA, simple form, heatmap auto-updates
Understand the scoring? | MOSTLY — 5x5 matrix is standard but likelihood/impact definitions may be unclear
Know what to do next? | YES — risk detail shows mitigations, decisions, and direction of travel
Recover from mistakes? | YES — risks can be edited and status changed

### Staff Directory

**Can a school user...** | **Answer**
Add staff manually? | YES — clear modal form
Import from CSV? | YES — template + clear error messaging
Find a specific person? | YES — search/filter available
Understand what's imported vs manual? | NO — no "source" indicator on records

### Compliance Hub

**Can a school user...** | **Answer**
Start from nothing? | YES — 36 seeded templates provide starting point
Create a new policy? | YES — clear creation flow
Track review dates? | YES — review schedule with reminders
Understand the dashboard? | MOSTLY — some terminology may need explaining ("DPIA", "SAR")

### Estates

**Can a school user...** | **Answer**
Log a maintenance issue? | YES — helpdesk form is straightforward
Track compliance tasks? | YES — clear task list with statuses
Know which checks are overdue? | YES — status indicators and filtering

### Surveys

**Can a school user...** | **Answer**
Create a survey from scratch? | YES — builder is intuitive
Use AI to generate questions? | YES — prompt-based generation
Distribute and collect? | YES — share flow exists
Read results? | YES — analytics page with visualisations

### Attendance (with demo data)

**Can a school user...** | **Answer**
Understand this is demo data? | YES — banner visible (Phase 3 fix)
Know how to get real data in? | PARTIALLY — banner says "connect your MIS" but no MIS connector exists
Register attendance manually? | YES — mark registers via UI
Understand DfE codes? | PARTIALLY — 25 codes may overwhelm non-data staff

---

## Where Users Will Get Confused

### 1. "I imported pupils but attendance still shows demo data" (HIGH)

**Root cause:** `pupils` table and `attendance_registers` are separate data stores with no auto-sync.
**User expectation:** Importing pupils should populate attendance registers.
**Reality:** Must manually register or wait for MIS sync (which doesn't exist).
**Mitigation needed:** Setup wizard should explain this limitation clearly.

### 2. "What's the difference between actions and tasks?" (MEDIUM)

**Root cause:** Actions Hub creates `actions` records. Unified Tasks aggregates from 5 different tables. Same item may appear in both views with different names.
**User expectation:** One task system.
**Reality:** Multiple overlapping systems.
**Mitigation needed:** Clearer labelling or unified entry point.

### 3. "I deleted a staff member but their name still appears in documents" (MEDIUM)

**Root cause:** Document placeholders resolve at generation time. Previously generated documents retain the name. New documents with deleted staff get blank placeholders.
**User expectation:** Deletion cascades.
**Reality:** Documents are point-in-time snapshots.
**Mitigation needed:** Documentation / help text.

### 4. "Where do I upload pupil data?" (HIGH)

**Root cause:** Pupil import API exists but no dedicated upload UI page.
**User expectation:** A page where I can drag-and-drop a pupil CSV.
**Reality:** Must use setup wizard template download + external tool to call API, or wait for UI page to be built.
**Mitigation needed:** Build a simple pupil upload page or integrate into existing data connections page.

### 5. "Ed said it created a risk but my dashboard still shows 0" (LOW — reduced from MEDIUM)

**Root cause:** Context cache staleness. Phase 5 fix reduces cache to 2 min and invalidates after skill execution.
**User expectation:** Instant consistency.
**Reality:** Now near-instant (cache invalidated on skill success). Only affects rare edge cases where invalidation fails.

---

## Human-Proofing Scorecard

| Area                                        | Score    | Notes                                                             |
| ------------------------------------------- | -------- | ----------------------------------------------------------------- |
| Sign up + onboarding                        | 9/10     | Clean, DfE-enriched, fast                                         |
| Setup wizard                                | 7/10     | Good structure, pupil upload path unclear                         |
| Staff import                                | 9/10     | Excellent — fuzzy matching, clear errors                          |
| Pupil import                                | 5/10     | API works, but no upload UI — requires technical knowledge        |
| Core module use (Risk, Compliance, Estates) | 8/10     | Intuitive for school staff                                        |
| Understanding empty vs demo states          | 7/10     | Banners help, but "what to do next" guidance could be stronger    |
| Error recovery                              | 7/10     | Clear error messages, but no "fix and retry" flow for imports     |
| Understanding cross-module links            | 4/10     | Not obvious which modules share data                              |
| **Overall**                                 | **7/10** | **Usable by school staff for most tasks. Pupil import needs UI.** |

---

## Recommendations

### Must Fix Before Pilot Launch

1. **Pupil upload needs a UI page** — even a simple form that reads CSV and calls the API
2. **Setup wizard step 2 (pupils) should link to upload page**, not data connections

### Should Improve for Pilot Quality

3. **"Where does this data come from?" indicators** — show "Imported from CSV on 19 Mar 2026" on records
4. **Post-import summary on-screen** — not just API response, but visible confirmation page
5. **Clear help text on demo data banners** — "To see real data, import a pupil CSV from your MIS"
