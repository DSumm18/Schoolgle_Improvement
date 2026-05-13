# SEND & Inclusion Copilot — SENCO Day-in-the-Life Acceptance Scripts

Date: 2026-05-09  
Demo school: Grove House Primary School  
Product route: `/send-funding-demo` and `/dashboard/send/copilot`

## Purpose

These scripts test whether a SENCO can run the working day without paper files: check the diary, act on deadlines, add notes, upload reports, run statutory meetings, generate paperwork, reconcile funding and ask Ed to complete supported tasks.

The product must act as a working record. Original files remain in Drive/SharePoint; Schoolgle stores the structured record, notes, summaries, evidence links, actions, meeting outputs, funding reconciliation and audit trail.

## Statutory/Guidance Baseline

The product checks against these live reference points:

- SEND Code of Practice: 0 to 25 years, statutory guidance, England, last updated 12 September 2024: https://www.gov.uk/government/publications/send-code-of-practice-0-to-25
- Children and Families Act 2014, including local authority duty to secure specified special educational provision in an EHC plan: https://www.legislation.gov.uk/ukpga/2014/6/section/42
- SEND and Alternative Provision Improvement Plan, including digital-first, simpler EHC plan direction: https://www.gov.uk/government/publications/send-and-alternative-provision-improvement-plan
- Equality Act 2010 advice for schools, including reasonable adjustments and accessibility planning: https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/315587/Equality_Act_Advice_Final.pdf

## Script 1 — Morning Triage

**Goal:** SENCO starts the day and knows what matters.

1. Open `SEND Today`.
2. Confirm the screen shows the highest-priority action first.
3. Confirm the open action count is visible and can be explained.
4. Open the top funding variance.
5. Confirm the action routes to the relevant working area, not a dead panel.

**Expected result:** The SENCO sees the immediate work, why it matters, who owns it, the pupil affected, and the output it should create.

## Script 2 — Diary and Deadline Control

**Goal:** SENCO can see statutory dates, meeting dates, funding dates and expected next steps.

1. Open `Diary`.
2. Review statutory, meeting, funding and follow-up events.
3. Confirm each event shows:
   - pupil
   - date/time
   - expectation
   - next action
   - route to do the work
4. Use `Do next action` from a statutory/meeting event.

**Expected result:** The diary functions as the SENCO’s operational calendar and deadline tracker.

## Script 3 — Pupil One View

**Goal:** SENCO can understand one pupil without opening a paper file.

1. Open `Pupil One View`.
2. Confirm it shows need, status, risk, key worker, provision, attendance, attainment, parent voice, review date and evidence readiness.
3. Open diary/notes/upload shortcuts from the pupil record.

**Expected result:** A pupil’s working record is complete enough to brief staff, run a meeting and generate paperwork.

## Script 4 — Notes and Upload Intake

**Goal:** SENCO records daily context and uploads professional reports without losing traceability.

1. Open `Notes & Uploads`.
2. Save a SENCO note.
3. Confirm the note links to the pupil and annual review pack.
4. Confirm existing case notes show author, date, category and linked action.
5. Confirm the upload intake explains where reports, plans, forms and LA files go.
6. Confirm upload records show source, status, summary and what each upload creates.

**Expected result:** Notes and uploads create structured evidence, summaries and actions; they do not become another document dump.

## Script 5 — Meeting Using Existing Meeting Engine

**Goal:** SEND meetings reuse Schoolgle Meetings, not a parallel bespoke workflow.

1. Open `Meeting Copilot`.
2. Confirm the screen states it uses the existing Schoolgle Meetings engine with the `SEND EHCP Annual Review` template.
3. Start recording.
4. Add a statutory prompt to minutes.
5. Confirm the template outputs include minutes, actions and annual review report.
6. Continue to document generation.

**Expected result:** A SEND meeting behaves like the HR meeting tool conceptually: template, agenda, transcript/minutes, actions and output documents.

## Script 6 — Document Generation

**Goal:** The SENCO can create required outputs from approved records rather than rewriting them.

1. Open `Documents`.
2. Generate an annual review report draft.
3. Confirm available outputs include:
   - annual review report
   - EHCP amendment request
   - LA funding query
   - teacher one-page plan
   - parent meeting summary
4. Confirm the draft preview explains source inputs and review steps.

**Expected result:** The system produces reviewable drafts ready to export/upload/send after human approval.

## Script 7 — Evidence Pack

**Goal:** SENCO can see whether evidence is ready before sending paperwork.

1. Open `Evidence Packs`.
2. Confirm readiness percentage and missing evidence areas.
3. Generate the evidence pack.
4. Confirm missing evidence becomes actions.

**Expected result:** The system prevents late discovery of missing reports, views or provision evidence.

## Script 8 — Funding Reconciliation

**Goal:** SENCO and finance can see expected vs received funding and act on variances.

1. Open `Funding`.
2. Confirm expected, received, outstanding and backdated due values.
3. Confirm reconciliation rows show period, expected, received, variance and status.
4. Create a draft LA query.

**Expected result:** Funding queries are evidence-backed and ready for human approval.

## Script 9 — Leadership/Governance Evidence

**Goal:** SENCO can brief SLT, trust or governors without rebuilding spreadsheets.

1. Open `Leadership`.
2. Confirm SEND pupils, evidence readiness, funding variance and governor report state.
3. Confirm report types include SLT brief, governor report, Ofsted inclusion evidence and staff briefing.

**Expected result:** The system converts pupil-level work into leadership assurance.

## Script 10 — Ed SENCO Copilot Skills

**Goal:** Ed can support, search and complete tasks only where safe.

Ed must have SEND-specific callable skills:

- `send_list_open_actions`: list SEND actions by pupil, owner, priority, deadline and workflow.
- `send_create_case_note`: add a dated pupil note with category, linked action and audit trail.
- `send_summarise_upload`: summarise an uploaded report and propose evidence/action links.
- `send_prepare_meeting`: create a meeting from an approved template, agenda, invitees and pupil record.
- `send_generate_minutes_outputs`: turn approved minutes into actions, annual review report and document drafts.
- `send_check_ehcp_quality`: check whether needs, outcomes and provision wording is specific, quantified and evidenced.
- `send_build_evidence_pack`: assemble a pack from linked files, notes, views and professional advice.
- `send_reconcile_funding`: compare expected top-up funding against receipts and produce variance actions.
- `send_generate_la_query`: draft a funding or EHCP query pack for human approval.
- `send_generate_governor_report`: aggregate SEND work into leadership/governance reporting.

**Guardrails:**

- Ed can draft, summarise, route and prepare; it cannot submit statutory paperwork or contact the LA/parents without explicit human approval.
- Ed must cite the source record used: meeting, note, upload, evidence file, action, funding receipt or pupil record.
- Ed must flag uncertainty and missing evidence rather than inventing wording.

## Pass Criteria

The product passes the day-in-life test when:

1. A SENCO can start with `SEND Today` and know the next action within 30 seconds.
2. Every visible action has a pupil, owner, due date, source workflow and expected output.
3. Notes, uploads, meetings, evidence, funding and documents are linked to the pupil record.
4. Annual review paperwork can be generated from approved meeting/evidence records.
5. Funding variances can be identified and converted into query packs.
6. No workflow requires a paper file as the source of truth.
7. Ed has skill coverage for safe support and completion of repeat SENCO admin tasks.

