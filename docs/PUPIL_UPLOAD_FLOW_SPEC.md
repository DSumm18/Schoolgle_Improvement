# Connect Pupil Data — Flow Specification

**Date:** 2026-03-19
**File:** `apps/platform/src/app/(dashboard)/dashboard/pupils/page.tsx`

---

## Product Positioning

This page is framed as **connecting a data source**, not uploading a file. The school links their pupil roll from their MIS, and Schoolgle uses this connected source to power attendance, SEND, and behaviour modules.

Key language:

- "Connect Pupil Data" (not "Upload Pupils")
- "Connect a pupil data file" (not "Upload your CSV")
- "Your school retains full control of this data"
- "You can refresh, replace, or disconnect this source at any time"
- "Connect additional sources later as they become available"

---

## User Flow

### State 1: Idle (No source connected)

- Header: "Connect Pupil Data"
- Subheader: "Link your pupil roll from your MIS export or school records"
- Drop zone: "Connect a pupil data file — Drop a CSV export here, or click to browse"
- Accepted formats: ".csv exports from Arbor, SIMS, Bromcom, or any spreadsheet"
- Template download: "Data Format Templates — Download the expected column format with example data"
- Required columns panel (blue): pupil_id, first_name, last_name, year_group
- Optional columns listed
- Data control notice: "Your data, your control. Schoolgle connects to the data sources you authorise..."

### State 2: Preview

- File info banner (green): filename, row count, column count
- "Choose different file" option
- Preview table: first 10 rows with required columns highlighted in blue
- "Connect N Pupils" button
- "Back" button

### State 3: Connecting

- Spinner: "Connecting N pupils..."
- Subtext: "Validating and linking pupil records to your school"

### State 4: Complete

- Success banner: "Data Source Connected"
- Stats: Connected / Updated / Errors
- Warnings (if any)
- Errors with row numbers (if any)
- "Connect Another Source" / "Back to Setup" actions

### State 5: Error

- Error banner: "Connection Error" with specific message
- "Try Again" button

---

## Data Control Principles

1. School chooses what to connect
2. School can refresh (re-connect same source with updated data)
3. School can replace (connect different source)
4. Connected data powers downstream modules (attendance, SEND, behaviour)
5. Disconnecting stops future insights but doesn't delete existing records
6. Schoolgle never claims ownership of connected data
