# Edge Case Test Results

**Date:** 2026-03-19
**Method:** Code-path trace with adversarial input scenarios

---

## Edge Cases Tested

### 1. Wrong File Format Uploaded as Evidence

**Input:** User uploads `.exe` file as estates evidence
**Trace:** `POST /api/estates/evidence` → MIME check at line 130 → `"application/x-executable"` not in ALLOWED_TYPES → returns 400 with clear message listing accepted types
**Result:** BLOCKED. User sees: `File type "application/x-executable" is not allowed. Accepted types: PDF, images...`

### 2. Oversized File Upload

**Input:** 75MB PDF
**Trace:** Size check at line 146 → `75MB > 50MB limit` → returns 400: `File size (75MB) exceeds the 50MB limit.`
**Result:** BLOCKED with clear message.

### 3. Duplicate Staff Import Then Edit

**Input:** Import staff CSV with Jane Smith. Edit Jane's email in UI. Re-import same CSV.
**Trace:** Re-import matches by original email → UPDATE overwrites UI changes with CSV values.
**Result:** **OVERWRITES UI EDITS.** This is by design (CSV is source of truth) but could surprise users who edited in Schoolgle then re-imported.
**Severity:** MEDIUM — documented limitation, not a bug.

### 4. Import Staff Then Delete Then Re-Import

**Input:** Import Jane Smith → delete in UI → re-import same CSV
**Trace:** Delete sets `is_active: false`. Re-import matches by email → UPDATE sets `is_active: true` (from CSV `is_active: yes`)
**Result:** **REACTIVATES deleted staff.** Correct behaviour for CSV-as-source but could surprise users.
**Severity:** LOW — expected for import-driven workflow.

### 5. Pupil With Commas in Name

**Input:** CSV row: `PUP010,"Smith, Jr",Oliver,3,3A,M,2017-01-01`
**Trace:** Papa Parse handles quoted fields correctly → `last_name = "Smith, Jr"` parsed as single field
**Result:** HANDLED (Phase 4 fix).

### 6. Pupil Import with Extra Columns

**Input:** CSV with columns: `pupil_id,first_name,last_name,year_group,favourite_colour,parent_phone`
**Trace:** Papa Parse headers normalised. Required columns present. Extra columns (`favourite_colour`, `parent_phone`) ignored in record construction — not in schema.
**Result:** HANDLED. Extra columns silently ignored, no error.

### 7. Empty CSV File

**Input:** `POST /api/pupils { csv: "" }`
**Trace:** Papa Parse returns empty data. `parseResult.data.length === 0`. Headers check finds no required columns.
**Result:** Returns 400: `Missing required columns: pupil_id, first_name, last_name, year_group`

### 8. CSV with Only Headers, No Data

**Input:** `pupil_id,first_name,last_name,year_group\n`
**Trace:** Papa Parse returns 0 data rows. Processing loop runs 0 iterations.
**Result:** Returns success with `imported: 0, errors: []`. Correct — nothing to import.

### 9. Hidden Route Direct Access

**Input:** User navigates directly to `/dashboard/finance` (hidden from sidebar)
**Trace:** Page loads normally (no route-level blocking). Finance dashboard renders with demo data + DEMO banner.
**Result:** ACCESSIBLE but honestly labelled. This is by design — pilot perimeter is navigation-level, not route-level.

### 10. Hidden Module in Ed

**Input:** User asks Ed: "Help me with my budget"
**Trace:** Intent classifier routes to finance-related keywords. Ed general agent handles without finance-specific specialist. No finance skills exist.
**Result:** Ed provides general budgeting guidance without claiming actionable finance skills. ACCEPTABLE.

### 11. Deleted Staff in Document Placeholder

**Input:** Create document template with `{{staff_name}}` → delete the staff member → generate document
**Trace:** `resolveFromStaff(deletedId, supabase, orgId)` → `.single()` returns null → function returns `{}` → template renders `""` for staff_name
**Result:** **Document generated with blank staff name field.** No error, no warning. User gets a document with "Dear ," instead of "Dear Jane Smith,".
**Severity:** MEDIUM — silent degradation, should at minimum log a warning.

### 12. Stale Ed Context After Skill

**Input:** Ask Ed "Create a risk for safeguarding" → immediately ask "How many risks do we have?"
**Trace (Phase 5):** Skill executes → `invalidateContextCache(orgId)` called → next message reloads fresh context
**Result:** **FIXED in Phase 5.** Context cache invalidated after skill execution, so count is fresh on next message.

### 13. User with No Organisation

**Input:** User authenticates but has no organization_members record
**Trace:** `withAuth` extracts no organizationId → if not `orgOptional`, returns 400 "organizationId is required"
**Result:** BLOCKED. User sees error. Should redirect to onboarding.

### 14. Concurrent Imports

**Input:** Two admins import different staff CSVs simultaneously
**Trace:** Each import runs independently. Upsert on email/employee_id handles conflicts. If both CSVs contain the same staff member with different data, last write wins (no locking).
**Result:** SAFE (no crashes) but last-write-wins could cause data inconsistency. ACCEPTABLE for pilot.

### 15. Year Group Edge Values

**Input:** Pupil CSV with year_group values: `"Year 14"`, `"Pre-School"`, `"0"`, `"-1"`, `"Reception Class"`
**Trace:**

- "Year 14" → regex extracts 14 → `parseInt("14") = 14` → exceeds range check (1-13) → falls through to `yg.trim()` → stored as "Year 14"
- "Pre-School" → no match → stored as "Pre-School"
- "0" → parseInt = 0 → fails range check (1-13) → stored as "0"
- "-1" → parseInt = -1 → fails range check → stored as "-1"
- "Reception Class" → upper = "RECEPTION CLASS" → doesn't match "RECEPTION" exactly → stored as "Reception Class"
  **Result:** **PARTIALLY HANDLED.** R and N are normalised, Year X and YX patterns work, but uncommon variants pass through unnormalised.
  **Severity:** LOW — data is stored (not lost), just not normalised. Schools use standard year groups in practice.

---

## Issues Found and Fixed in Phase 5

| Issue                                                  | Fix                                                                                      | File                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| Document resolver didn't scope staff/contractor by org | Added `organizationId` parameter to `resolveFromStaff()` and `resolveFromContractor()`   | `placeholder-resolver.ts`              |
| Ed context stale for 5 min after skill execution       | Reduced cache to 2 min + added `invalidateContextCache()` called after successful skills | `context-loader.ts`, `agent-router.ts` |

## Issues Found But Not Fixed (Documented)

| Issue                                                | Severity | Why Not Fixed                                                                      |
| ---------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| Re-import overwrites UI edits                        | MEDIUM   | By design — CSV is source of truth for import-driven workflow                      |
| Deleted record → blank document placeholder          | MEDIUM   | Silent degradation is safe but confusing. Production should validate before render |
| Unified tasks pagination duplicates non-action tasks | MEDIUM   | Structural issue in aggregation pattern. Needs architectural rework                |
| Unified tasks summary only counts actions table      | MEDIUM   | Same structural issue. Would need unified counting across all 5 sources            |
| Year group edge values not fully normalised          | LOW      | Uncommon in practice. "Year 14" and "Pre-School" are edge cases                    |
