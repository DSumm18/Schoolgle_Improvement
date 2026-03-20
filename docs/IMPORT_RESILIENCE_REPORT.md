# Import Resilience Report

**Date:** 2026-03-19
**Method:** Code-path trace with 6 realistic messy-input simulations

---

## Staff Import (`/api/staff/import`) — RESILIENT

### Parser

- Uses **Papa Parse** (proper CSV library) — handles quoted fields, commas in values, various line endings
- Strips comment lines (# prefix)
- Transforms headers to lowercase with underscore normalisation

### Messy Input Handling

| Scenario                                           | Behaviour                         | Result     |
| -------------------------------------------------- | --------------------------------- | ---------- |
| Missing first_name                                 | Row rejected with clear error     | CORRECT    |
| Missing job_title                                  | Row rejected with clear error     | CORRECT    |
| Missing optional fields (phone, email, salutation) | Stored as null, import succeeds   | CORRECT    |
| Duplicate by email                                 | Existing record updated (upsert)  | CORRECT    |
| Duplicate by employee_id                           | Existing record updated (upsert)  | CORRECT    |
| Invalid salutation ("Lady")                        | Stored as null (silently ignored) | ACCEPTABLE |
| Fuzzy role ("Head" → headteacher)                  | 22+ fuzzy mappings work           | CORRECT    |
| Unknown role ("Lunch Supervisor")                  | Falls back to "other"             | CORRECT    |
| Action: "archive"                                  | Sets is_active=false              | CORRECT    |
| Comment lines in CSV                               | Stripped before parsing           | CORRECT    |
| Empty rows                                         | Skipped by Papa Parse             | CORRECT    |
| Mixed boolean formats (yes/true/y/1/Yes/TRUE)      | All normalised to true            | CORRECT    |

### Rating: PRODUCTION READY

---

## Pupil Import (`/api/pupils`) — RESILIENT (after Phase 4 fixes)

### Parser

- **Phase 3:** Used manual `line.split(",")` — fragile with quoted fields
- **Phase 4 fix:** Switched to **Papa Parse** — now handles commas in names, quoted fields, various encodings

### Messy Input Handling

| Scenario                                     | Behaviour                              | Result  |
| -------------------------------------------- | -------------------------------------- | ------- |
| Missing pupil_id                             | Row rejected with clear error          | CORRECT |
| Missing first_name                           | Row rejected with clear error          | CORRECT |
| Missing year_group                           | Row rejected with clear error          | CORRECT |
| Year group "Year 3"                          | Normalised to "3"                      | CORRECT |
| Year group "Y4"                              | Normalised to "4"                      | CORRECT |
| Year group "Reception"                       | Normalised to "R"                      | CORRECT |
| Year group "Nursery"                         | Normalised to "N"                      | CORRECT |
| Invalid SEN status "Z"                       | Row rejected with valid options listed | CORRECT |
| Invalid primary need "XYZ"                   | Row rejected with valid options listed | CORRECT |
| Gender "Female"                              | Normalised to "F" (Phase 4 fix)        | CORRECT |
| Gender "Male"                                | Normalised to "M" (Phase 4 fix)        | CORRECT |
| Gender "Boy"/"Girl"                          | Normalised to "M"/"F" (Phase 4 fix)    | CORRECT |
| Duplicate pupil_id                           | Upsert updates existing record         | CORRECT |
| Missing optional fields (DOB, class, gender) | Stored as null with warnings           | CORRECT |
| Mixed boolean formats                        | All normalised to true/false           | CORRECT |
| Comment lines                                | Stripped before parsing                | CORRECT |
| Names with commas ("Smith, Jr")              | Handled by Papa Parse (Phase 4 fix)    | CORRECT |

### Phase 4 Fixes Applied

1. **Gender normalisation** — added `normaliseGender()` mapping Male→M, Female→F, Boy→M, Girl→F, Other→O
2. **CSV parser** — replaced manual `split(",")` with Papa Parse for proper quoted-field handling

### Rating: PILOT READY (upgraded from "mostly resilient")

---

## Finance Import (`/api/finance/import`) — RESILIENT (hidden from pilot)

### Parser

- Handles FMS report formats (CSV/XLSX)
- Checksum dedup prevents double-import
- Dry-run mode for validation before commit
- Anomaly detection for unusual patterns

### Rating: BACKEND READY (module hidden from pilot navigation)

---

## Organisation User Import (`/api/organization/import`) — FUNCTIONAL

### Handling

| Scenario                          | Behaviour                                | Result  |
| --------------------------------- | ---------------------------------------- | ------- |
| Invalid email format              | Row rejected                             | CORRECT |
| Invalid role                      | Row rejected                             | CORRECT |
| Duplicate email (existing member) | Flagged as "exists" in preview           | CORRECT |
| Duplicate email (pending invite)  | Flagged as "exists" in preview           | CORRECT |
| Preview mode                      | Returns preview without creating records | CORRECT |

### Rating: PILOT READY

---

## Cross-Import Consistency

| Test                                                           | Status                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Staff import → staff appear in document placeholders           | VERIFIED (document resolver queries `staff_directory` live) |
| Staff import → staff appear in meeting attendee options        | VERIFIED (meetings query `staff_directory`)                 |
| Pupil import → pupils available in `GET /api/pupils`           | VERIFIED (direct table query)                               |
| Pupil import → pupils don't auto-populate attendance registers | KNOWN LIMITATION (separate data stores)                     |
| Re-import same file → no duplicates                            | VERIFIED (upsert on unique constraints)                     |

---

## Issues Resolved in Phase 4

| Issue                                        | Fix                                              | File                  |
| -------------------------------------------- | ------------------------------------------------ | --------------------- |
| Pupil gender "Female" stored as "FEMALE"     | Added `normaliseGender()` with 8 common mappings | `api/pupils/route.ts` |
| Pupil CSV with commas in names breaks parser | Replaced `split(",")` with Papa Parse            | `api/pupils/route.ts` |

## Issues Remaining (Acceptable for Pilot)

| Issue                                                      | Severity | Status                                      |
| ---------------------------------------------------------- | -------- | ------------------------------------------- |
| No import audit log (batch-level)                          | LOW      | Acceptable for pilot                        |
| Pupils don't auto-sync to attendance/SEND/behaviour tables | LOW      | Known limitation, documented                |
| Staff import doesn't validate email format                 | LOW      | Acceptable (dedup works without validation) |
