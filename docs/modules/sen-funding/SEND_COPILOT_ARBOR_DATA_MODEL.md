# SEND & Inclusion Copilot: Arbor/MIS Data Model

Date: 2026-05-09

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
