# Pupil Import Specification

**Date:** 2026-06-08
**Status:** Implemented

---

## Purpose

Allow schools to bulk-import pupil data via CSV to populate Schoolgle's pupil-facing modules (Attendance, SEND, Behaviour) with real data instead of demo fallbacks.

Schoolgle is NOT the system of record for pupil data — the MIS (Arbor, SIMS, Bromcom) remains authoritative. This import creates a working copy for Schoolgle's workflow, analysis, and intelligence layers.

---

## Architecture

### New Components

| Component | Path                                             | Purpose                             |
| --------- | ------------------------------------------------ | ----------------------------------- |
| Migration | `supabase/migrations/20260319_pupils_master.sql` | Creates `pupils` table              |
| API Route | `src/app/api/pupils/route.ts`                    | GET (list) + POST (import/template) |

### Database Table: `pupils`

| Column             | Type      | Required | Notes                             |
| ------------------ | --------- | -------- | --------------------------------- |
| `id`               | UUID      | Auto     | Primary key                       |
| `organization_id`  | UUID      | Yes      | Multi-tenancy FK                  |
| `pupil_id`         | TEXT      | Yes      | School-assigned unique ID         |
| `pupil_ref`        | TEXT      | No       | MIS reference (e.g., ARB-100001)  |
| `first_name`       | TEXT      | Yes      |                                   |
| `last_name`        | TEXT      | Yes      |                                   |
| `date_of_birth`    | DATE      | No       | Optional; used for matching, age/year checks and pupil-facing verification support |
| `year_group`       | TEXT      | Yes      | R, N, 1-13                        |
| `class_name`       | TEXT      | No       | e.g., 3A, Oak, Reception          |
| `gender`           | TEXT      | No       | M, F, O                           |
| `is_pupil_premium` | BOOL      | No       | Default false                     |
| `is_eal`           | BOOL      | No       | Default false                     |
| `is_looked_after`  | BOOL      | No       | Default false                     |
| `has_send_support` | BOOL      | No       | Auto-set from sen_status          |
| `sen_status`       | TEXT      | No       | K, E, monitoring, removed         |
| `primary_need`     | TEXT      | No       | DfE SEN codes (SPLD, MLD, etc.)   |
| `fsm_eligible`     | BOOL      | No       | Default false                     |
| `ethnicity`        | TEXT      | No       | DfE ethnicity code                |
| `is_active`        | BOOL      | No       | Default true                      |
| `import_source`    | TEXT      | No       | csv, arbor, sims, manual          |
| `imported_at`      | TIMESTAMP | No       | Auto-set on import                |

**Unique constraint:** `(organization_id, pupil_id)` — upsert on re-import.

---

## API Endpoints

### GET /api/pupils

- Lists pupils for the authenticated user's organisation
- Filters: `year_group`, `class_name`, `sen_status`, `active_only`
- Requires: teacher role minimum
- Returns: `{ pupils: [...], count: N }`

### POST /api/pupils

- Accepts three formats:
  1. `{ template: true }` — returns CSV template text
  2. `{ csv: "header\nrow1\nrow2" }` — parses CSV text
  3. `{ pupils: [{...}, {...}] }` — array of pupil objects
  4. `{ pupil_id, first_name, ... }` — single pupil creation
- Requires: SLT role minimum
- Validates:
  - Required fields: pupil_id, first_name, last_name, year_group
  - SEN status against valid DfE values
  - Primary need against valid DfE codes
  - Year group normalisation (R/Reception, N/Nursery, Y3/Year3 → 3)
  - Boolean fields: yes/true/y/1 → true
- Returns: `{ imported, updated, errors, warnings, total_processed }`

---

## CSV Template

```csv
# Schoolgle Pupil Import Template
# Required: pupil_id, first_name, last_name, year_group
pupil_id,first_name,last_name,year_group,class_name,gender,date_of_birth,pupil_ref,is_pupil_premium,is_eal,is_looked_after,sen_status,primary_need,fsm_eligible,ethnicity
PUP001,Oliver,Thompson,3,3A,M,2017-09-15,,no,no,no,,,,WBRI
PUP002,Amelia,Patel,3,3A,F,2017-11-02,,yes,yes,no,,,,AIND
PUP003,Jack,Williams,4,4B,M,2016-07-20,,no,no,no,K,SPLD,,WBRI
```

---

## Validation Rules

| Field          | Rule                                                         |
| -------------- | ------------------------------------------------------------ |
| `pupil_id`     | Required, trimmed, unique per org                            |
| `first_name`   | Required                                                     |
| `last_name`    | Required                                                     |
| `year_group`   | Required, normalised: R/Reception→R, N/Nursery→N, Y3/Year3→3 |
| `sen_status`   | If provided: must be K, E, monitoring, or removed            |
| `primary_need` | If provided: must be valid DfE code                          |
| `gender`       | If provided: M, F, or O                                      |
| Booleans       | yes/true/y/1 → true, anything else → false                   |

---

## Merge Behaviour

- Uses Supabase upsert on `(organization_id, pupil_id)` conflict
- Existing records are updated with new values
- Re-import is safe and idempotent

---

## Layered SEND Import

Do not require schools to put every SEND detail into the core pupil-roll import. The core pupil import should accept broad SEN status where present, but the richer SEND record should be handled by a separate SEND-layer import.

Recommended Arbor MVP flow:

1. Import the core Arbor pupil roll first.
2. Import Arbor's standard `SEN Status Assignments` report as a second layer.
3. Match the SEND layer to existing pupils by stable ID where available. If the standard report only contains pupil name and registration form, match by normalised legal name and require review for unmatched or ambiguous rows.
4. Update SEND fields from the second layer: `send_status`, `ehcp`, monitoring flag, SEN start/end dates, registration form, raw SEN needs and derived `primary_need`.
5. Preserve raw Arbor `SEN Needs` text even when a DfE `primary_need` code can be derived.

Grove House cross-reference on 2026-06-08 showed this is viable but needs review: 94 of 101 SEND rows matched the pupil roll exactly, 0 were ambiguous, 7 SEND rows were not found in the pupil export, and 16 pupil-export SEN rows were not found in the SEND report.

---

## Security

- `protectedRoute` with `requiredRole: "slt"` for imports
- `protectedRoute` with `requiredRole: "teacher"` for reads
- Organisation scoping on all queries
- RLS enabled on `pupils` table
- Identifiable pupil data, including DOB, is product-scoped and must be covered by the customer DPA/product schedule
- DOB must not be used as a sole login secret; use it only as an optional matching or verification factor alongside a generated pupil pass/access token
- Schools remain responsible for accurate pupil, parent and carer privacy notices before uploading live pupil data

---

## Future Considerations

- Cross-module sync: populate `attendance_registers`, `send_register`, `behaviour_incidents` from `pupils` table
- MIS API connector: auto-sync from Arbor/SIMS/Bromcom
- Archival: end-of-year pupil transition (move year groups, mark leavers inactive)
