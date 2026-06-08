# SEND & Inclusion Copilot: Arbor/MIS Data Model

Date: 2026-06-08

## Product Rule

Schoolgle should treat Arbor/MIS as the source of truth for core pupil identity and school-roll data, and Schoolgle as the source of truth for SEND workflow, case notes, meetings, statutory actions, funding reconciliation, generated documents, AI summaries and audit trails.

Default posture: read-only MIS integration. Write-back is only enabled where the school explicitly approves it, the Arbor partner/API permission shows the write scope, and the field is safe to update with a full audit trail.

## What We Pull From Arbor

The SEND Copilot import should create or update `send_register` and `send_mis_sync_snapshots` from:

- Pupil identifiers: Arbor student ID, UPN, admission number, on-roll status.
- Pupil profile: legal/preferred name hash or encrypted display name, year group, registration group/class, photo reference if permitted.
- SEND flags: SEN status, EHCP flag/status, primary SEN need, secondary SEN need, SEN start/end dates where available.
- School context: class teacher, key worker, timetable/group membership if relevant.
- Attendance context: current attendance summary and absence indicators used for SEND risk dashboards.
- Inclusion context: FSM/PP/EAL/CLA or in-care flags, medical/dietary/access arrangement indicators where permissioned and relevant.
- Contact metadata: parent/carer contact references and consent/communication metadata, not uncontrolled bulk duplication of contact details unless needed and agreed.

Arbor’s own help material lists important student data that can include UPN, language ability, access arrangements, SEN needs/status, medical conditions, FSM eligibility, in-care status, attendance and assessments in shared/integrated contexts. Arbor also states partner apps can request specific read/write scopes that the school can inspect before approval.

## What Schoolgle Owns

These are created and managed inside Schoolgle, linked to the pupil:

- `send_case_notes`: SENCO notes, parent contact notes, pupil voice, professional advice, decisions and provision notes.
- `send_pupil_actions`: next actions, owner, due date, priority, source workflow and required output.
- `sen_annual_reviews`: annual review dates, meeting outputs, amendment requests and statutory workflow status.
- `sen_ehcp_applications`: EHCP needs assessment/application lifecycle and evidence strength.
- `sen_evidence_files`: Drive/SharePoint source links, document metadata, AI summaries and evidence coverage.
- `sen_funding_allocations`: LA band, expected income, receipts, variances and reconciliation state.
- `send_case_file_access_log`: who viewed/created/exported/shared pupil SEND information and why.

## Write-Back Policy

Do not write SEND notes, professional reports, EHCP documents or funding reconciliations back to Arbor by default. These are sensitive Schoolgle workflow records and should remain in the secure SEND case file.

Possible write-back candidates, only after explicit approval:

- SEN register status where Schoolgle is the agreed workflow used by the SENCO and Arbor permission allows update.
- EHCP indicator or review date where the school wants the MIS kept aligned and the user confirms the change.
- Document reference or safe summary marker, not the sensitive document body.

Unsafe default write-back:

- Case notes.
- Parent/pupil voice text.
- Professional report summaries.
- LA challenge/funding dispute detail.
- AI-generated recommendations that have not been reviewed by a human.

## Integration Route

1. Arbor API route: become an Arbor integration partner, request the exact read scopes, and let the school approve the connection from Arbor's partner-app/API area.
2. Connected sheet route: the school exports or automates an Arbor report into an approved Google Sheet, Excel workbook or CSV in the Schoolgle evidence folder; Schoolgle imports the same schema as the API route.
3. Manual CSV route: acceptable MVP/import fallback for schools not ready to approve an API connection or maintain a connected sheet.

The working Grove House import workbook is `docs/modules/sen-funding/Grove_House_SEND_Import_Template.xlsx`. It contains tabs for `send_register`, `ehcp_provision_lines`, `funding_components`, `action_queue` and `evidence_files`, so the same file can feed the dashboard, pupil record, funding reconciliation and SEND report.

## Arbor CSV MVP: Layered Import Model

Use two Arbor exports rather than forcing all SEND fields into the core pupil roll import:

1. **Core pupil roll import** — creates/updates the canonical Schoolgle pupil row from Arbor student ID, global student ID, legal name, sex, DOB, year group, registration/class and broad characteristics such as FSM, PP, EAL and current SEN status.
2. **SEN Status Assignments import** — overlays SEND-specific fields against the existing pupil row: SEN status, EHCP flag, monitoring flag, start date, end date, registration form and detailed SEN needs.

This is safer and more usable than making schools manually enrich the pupil-roll file. Schools can upload the pupil roll first, then upload Arbor's standard `SEN Status Assignments` report as a second layer. Missing fields should be surfaced as data-quality gaps rather than blocking the whole import.

Matching rule for the CSV MVP:

- Prefer a stable ID if Arbor can include one in the SEN report.
- If the standard report only contains `Student` and `Reg. Form`, match to the pupil roll by normalised legal first name + legal last name.
- Treat name-only matching as provisional. Show an import review screen for unmatched or ambiguous rows and recommend adding Arbor student ID or DOB to the report where possible.
- Do not silently create new pupils from the SEND layer; require the core pupil roll import first.
- Preserve raw `SEN Needs` text and derive `primary_need` only where the mapping is confident.

Grove House test on 2026-06-08:

- Core pupil export: 445 pupils.
- Arbor `SEN Status Assignments` export: 101 rows — 55 SEN Support, 42 EHCP, 4 Monitoring.
- Exact name match to pupil export: 94 rows.
- Ambiguous name matches: 0 rows.
- SEND report rows not found in the pupil export: 7 rows.
- Pupil export SEN rows not found in the SEND report: 16 rows.
- Status mismatches between matched rows: 0.

Conclusion: the report is a useful SEND overlay and probably more detailed than the pupil-roll SEN fields, but the standard export needs an import-review step because name-only matching left 23 rows requiring review across the two files.

## Grove House Recommended SEND Export Shape

Keep the core pupil import unchanged. Create a dedicated **SEND import** based on Arbor's `SEN Status Assignments` report, with a small number of extra columns added where Arbor allows it.

Minimum viable report:

| Column | Required | Schoolgle use |
| --- | --- | --- |
| `Arbor Student ID` | Yes | Stable match to the core pupil roll and `send_register.pupil_id`. |
| `Globally Unique Student ID` or `UPN` | Strongly recommended | Safer cross-file matching and future assessment/CTF alignment. |
| `Student` | Yes | Human review label only; do not rely on this as the only matching key. |
| `Reg. Form` | Yes | Current class/registration group fallback. |
| `Year Group` | Recommended | Dashboard grouping and import review. |
| `Date of Birth` | Recommended | Human-safe disambiguation where names collide; not a login secret. |
| `SEN Status` | Yes | `K`, `E`, or `monitoring`. Drives SEND register counts and EHCP flag. |
| `Start Date` | Yes | `date_identified` / `date_placed_on_register`. |
| `End Date` | Yes | `date_removed` when no longer ongoing. |
| `SEN Needs` | Yes | Preserve raw need text and derive `primary_need`/`secondary_need` where confident. |

Useful second-phase columns if Grove House wants EHCP management live quickly:

| Data | Why it matters |
| --- | --- |
| EHCP annual review due date / next review date | Enables overdue/this-term EHCP compliance KPIs. |
| EHCP start/final issue date | Starts statutory lifecycle tracking and retention context. |
| LA caseworker / local authority reference | Useful for annual reviews and chasing decisions. |
| Key worker / SENCO owner | Assigns actions and diary ownership. |
| SEN notes summary or latest SEN note date | Gives the SENCO chronology a starting point, but should be reviewed before import because notes are sensitive. |
| Provision/intervention names, frequency, duration and delivered-by | Needed for provision map and cost dashboard. |
| Funding band/top-up amount, if held in Arbor | Needed for SEND finance reconciliation; otherwise import from LA funding schedules. |

Funding demarcation:

- Arbor can hold pupil-level SEN status, SEN needs, EHCP indicators/history and student funding records such as top-up funding indicators. Treat this as useful context, not the full funding-control system.
- Schoolgle should become the workflow source of truth for SEND finance: LA band rules, expected top-up schedules, actual receipts, provision costs, evidence strength, variances, backdated payments and funding challenge actions.
- The SEND import should therefore accept any Arbor funding fields that are available, but must not depend on Arbor having all funding detail. Missing amount/source/band data should create a funding data-quality gap and prompt the school to import the LA funding schedule or enter the funding allocation in Schoolgle.
- Funding source should be captured separately from SEN status. A pupil may be `K` or `E`, but funding may still be school notional SEN budget, high-needs/top-up, EHCP band allocation, exceptional needs funding, DAF, tutoring/NTP or another LA-specific source.
- The user-facing import review should ask: "Is this SEND register only, or do you also want to create funding allocations from this file?" This avoids accidentally treating an Arbor census indicator as confirmed funding income.

Live register versus historic analysis:

- The operational SEND register should default to pupils on roll today, because it drives current SENCO work, EHCP reviews, provision, tasks and funding actions.
- Schoolgle must also preserve historic SEND cohort snapshots for MI, Ofsted readiness and intelligence analysis. Year 6 leavers, previous assessment cohorts and CTF-derived outcome cohorts should not stay on the live register, but their historic SEND status, EHCP status, primary need, pupil premium/EAL/FSM indicators and effective dates should remain available for analysis.
- Arbor `Current academic year` exports can be used as a historical snapshot source, but they should be labelled clearly as cohort/history imports rather than live-register imports.
- The import UI should therefore offer two import intents: `Live SEND register` and `Historic cohort / inspection analysis snapshot`.
- Historic snapshots should be minimised and access-controlled. They are for aggregated analysis, inspection preparation and trend reporting, not day-to-day task assignment.

Retention and school-controlled archive:

- The school remains the data controller for pupil/SEND records in Schoolgle. Schoolgle should provide processor-side tools that let authorised school users archive, retain, export, anonymise or delete pupil datasets in line with the school's own retention schedule and lawful basis.
- When a year group leaves, Schoolgle should flag that cohort as eligible for archive/removal rather than silently retaining it forever or deleting it automatically.
- Archive actions should support clear choices: keep identifiable historic MI, anonymise/pseudonymise for trend analysis, export then delete, or delete from Schoolgle.
- Archived pupils should be excluded from live operational screens by default, but still available to authorised users for legitimate historic MI where the school chooses to retain them.
- Deletion should be auditable at action level without retaining unnecessary pupil-identifiable content in the deletion log.
- The right to erasure is not automatic for every education record; the school must decide whether erasure applies, taking account of statutory duties, safeguarding, audit, inspection, legal claims and its published retention policy.

GDPR data retention tool:

- Add a settings area named `GDPR Data Retention`, linked from Settings and the GDPR/Information Governance app.
- Show pupil datasets by academic year, year group, import source, import date, pupil count, linked SEND/compliance/assessment records, live/archive status and last reviewed date.
- Each year group/cohort row should have clear actions: `View records`, `Download/export`, `Archive from live screens`, `Anonymise for MI`, `Delete from Schoolgle`.
- Before any archive/anonymise/delete action, show a plain-English impact summary: what screens will change, what reports will no longer work, what aggregated MI will remain, and whether the action can be reversed.
- Deletion must require a two-step confirmation and should strongly offer an export first. The warning should say that once identifiable data is deleted, Schoolgle cannot report on those pupils individually or restore the records unless the school re-imports them from source files.
- Archive is reversible; delete is not. Anonymisation/pseudonymisation may preserve cohort trends but permanently removes direct pupil-level reporting.
- All actions should create an audit event with actor, timestamp, organisation, action type, cohort scope, row counts and reason, but not retain unnecessary pupil-identifiable data in the audit event.

Pupil import dataset versioning:

- Every pupil import should create a dataset version with an `is_current` flag for the organisation/import type.
- When a school re-imports pupil data, the new successful import becomes the current dataset version.
- Pupils present in the previous current dataset but missing from the new import should not be deleted automatically. Flag them as `not_in_latest_import` / `archive_candidate` and show them in the import review.
- The import review should ask the school to confirm whether missing pupils are expected leavers, data errors, or should remain current.
- Current operational screens should use the latest confirmed current dataset plus any pupil records explicitly marked as current by the school.
- Historic datasets remain available only where retained by the school for MI, inspection, statutory reporting or audit purposes.

Adaptable Arbor import process:

- Arbor exports are inconsistent and schools may struggle to find the perfect report. Schoolgle should therefore use a smart preview layer before import.
- The smart preview should detect the export type from populated columns, not from the file name alone. Initial recognised types are `pupil_roll`, `send_status`, and `daily_attendance_class_seed`.
- The importer should use whatever high-confidence fields are present, show data-quality gaps for useful missing fields, and avoid blocking imports unless required identity/status fields are absent.
- For pupil roll imports, prefer Arbor Student ID and UPN/global ID, but allow a review flow where name/DOB/class are the only safe match fields.
- For SEND imports, use SEN status, ranked SEN needs, funded hours and effective dates when present; flag missing funding amount/band as a separate finance gap rather than a blocker.
- For daily attendance/register exports, use the file to seed classes and suggested staff-class assignments, but label it clearly as not a full weekly timetable.
- The user journey should be: upload any Arbor CSV, preview detected type and confidence, review mapped fields and gaps, choose import intent, then apply to the appropriate dataset.

Current implementation status in Schoolgle:

- `/dashboard/send` exists as a SENCO dashboard with tabs for overview, SEN register, graduated approach, provision map and referrals.
- `/dashboard/send/copilot` exists as a richer SEND & Inclusion Copilot prototype, currently driven by local demo data.
- APIs exist for `/api/send/dashboard`, `/api/send/register`, `/api/send/graduated-approach`, `/api/send/provision-map` and `/api/send/referrals`, with demo/MIS fallback behaviour.
- The database schema already covers the core register, APDR cycles, provision mapping, referrals, EHCP applications, annual reviews, evidence files and SEND funding.
- Before Grove House live use, the SEND API/schema should be hardened because some route field names and migration field names have drifted. The CSV import should write to the canonical schema, not the older demo/prototype assumptions.

Build recommendation:

1. Build a new `/dashboard/send/import` flow for `SEN Status Assignments`.
2. First screen: upload CSV and show match review.
3. Automatically match by Arbor Student ID; fallback to global ID/UPN; only then fallback to name + DOB/name + reg form.
4. Show four buckets before applying: matched, changed status, SEND-only rows, pupil-roll-only SEND rows.
5. Apply matched rows to `send_register` in an idempotent upsert.
6. Keep unmatched rows in an import review table rather than creating pupils silently.
7. After import, take the user straight to `/dashboard/send` with the real Grove House counts.

## Dashboard Use

The first login dashboard should be built from:

- `send_register` for total SEND register, EHCP plan count and pupil cohort filters.
- `send_pupil_actions` for “what do I do next?”.
- `sen_annual_reviews` and `sen_ehcp_applications` for statutory deadline KPIs.
- `sen_evidence_files` for evidence readiness and missing evidence actions.
- `sen_funding_allocations` plus receipts for variance and finance reconciliation.
- `send_case_notes` for pupil-file chronology and document-generation context.
- `send_case_file_access_log` for data protection and safeguarding audit.

## Sources Checked

- Arbor Help Centre: third-party integrations, read/write permissions, one-way/two-way integration model.
- Arbor Help Centre: setting up/managing API integrations and school approval through Partner Apps/API Users.
- Arbor Help Centre: shared teaching student data fields, including SEN needs/status and attendance/assessment examples.
- Arbor Partner page: REST/GraphQL API partner route and developer documentation availability.
