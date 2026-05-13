# SEND & Inclusion Copilot — Operational SENCO Use Cases

Date: 2026-05-09

## Correction To Product Model

SEND case notes, professional reports, EHCP documents, evidence packs, meeting minutes and funding evidence must live inside the confidential pupil file.

The top-level app should only show:

- `SEND Today`: work queue and safe summary metadata.
- `SEND Register`: pupil list and filters.
- `Pupil File`: the selected pupil’s confidential record.
- `SENCO Diary`: deadlines and meetings with limited metadata, routing into the pupil file.
- `Leadership`: aggregated reporting, without unnecessary pupil-level detail.

The product should not expose a global `Notes & Uploads` or global `Documents` area for SEND content. Those functions exist, but they are subordinate areas inside each pupil file.

## Confidential Pupil File Structure

Each pupil file contains:

1. `Overview`: need, status, provision, attendance/attainment context, review due date and risk.
2. `Case notes & uploads`: dated notes, professional reports, parent/pupil views, file summaries and linked actions.
3. `Meetings`: SEND meeting templates using the existing Schoolgle Meetings engine.
4. `Evidence`: current EHCP/APDR/funding/review pack readiness.
5. `Documents`: annual review reports, EHCP amendment requests, LA queries, teacher one-page plans and parent summaries.
6. `Funding`: expected/received top-up funding, backdating, variances and query packs.
7. `Audit`: who viewed/changed/generated/sent each item.

## Use Case 1 — SENCO Adds A Note

1. SENCO opens `SEND Register`.
2. SENCO opens the pupil.
3. SENCO selects `Case notes & uploads` inside the pupil file.
4. SENCO adds a note with category, date, author, sensitivity and linked action.
5. System saves the note to that pupil file only.
6. System updates evidence/actions if the note indicates missing provision, parent view, professional advice or review risk.

## Use Case 2 — SENCO Uploads A Professional Report

1. SENCO opens the pupil file.
2. SENCO selects `Case notes & uploads`.
3. SENCO uploads the report or links to Drive/SharePoint.
4. System summarises the report and extracts needs, recommendations, provision wording and evidence tags.
5. SENCO approves the summary.
6. System updates evidence pack and suggests actions.

## Use Case 3 — SENCO Runs An Annual Review

1. SENCO opens diary or pupil file.
2. SENCO starts the `SEND EHCP Annual Review` meeting template from the pupil file.
3. System pulls pupil record, case notes, uploaded reports, current EHCP, provision, parent/pupil views and funding evidence.
4. Meeting is recorded/minuted through the existing Schoolgle Meetings engine.
5. SENCO approves minutes.
6. System generates actions and draft annual review report.

## Use Case 4 — SENCO Generates EHCP Update Material

1. SENCO opens `Documents` inside the pupil file.
2. SENCO selects annual review report or EHCP amendment request.
3. System drafts from approved meeting minutes, evidence, notes, parent/pupil views and professional reports.
4. System flags unsupported wording or missing evidence.
5. SENCO approves/export/uploads the document.

## Use Case 5 — SENCO/Finance Checks Funding

1. SENCO opens `Funding` inside the pupil file or follows an action from `SEND Today`.
2. System compares expected top-up against received LA payment lines.
3. Variance creates an action and draft LA query pack.
4. Business manager/SENCO approves before sending.

## Use Case 6 — SENCO Uses The Diary

1. SENCO opens `SENCO Diary`.
2. Diary shows dates, event type, pupil, expectation and next action.
3. Sensitive details stay hidden until the SENCO opens the pupil file.
4. SENCO selects `Do next action`.
5. System routes to the correct pupil-file area.

## Security Rules

- All SEND notes/uploads/documents are pupil-scoped.
- Global views show minimum necessary metadata.
- Role-based access must distinguish SENCO, headteacher/SLT, teacher, SEND admin, finance and governor/trust roles.
- Teachers should usually see strategies/one-page plans and assigned actions, not the full SEND case file.
- Finance should see funding records and relevant evidence, not unnecessary professional/medical notes.
- Governors/trustees should see aggregate reporting unless explicitly authorised.
- Every note, upload, generated document, meeting output and external send must have an audit trail.

