# Incident Hub Product Spec

## Summary

Incident Hub is a Schoolgle Business app for recording, triaging, risk-scoring, assigning, evidencing, and closing incidents across a school or trust. It should become the central operational register for anything significant that happens in school life: accidents, near misses, safeguarding concerns, GDPR incidents, estates failures, complaints, contractor issues, behaviour events, staff matters, and serious operational events.

The app is not just a form store. It connects the incident to tasks, meetings, document production, risk, evidence, and module-specific records so leaders can see what happened, what has been done, what remains outstanding, and who is accountable.

## Product Positioning

Incident Hub should sit in Schoolgle Business as a cross-module app.

It connects to:

- Tasks Dashboard: assigned follow-up actions, due dates, overdue status, reminders, escalation.
- Document Hub: branded forms, letters, reports, investigation notes, and statutory records.
- Meeting Companion: linked fact-finding, HR, safeguarding, estates, parent, contractor, or review meetings.
- Estates Compliance: linked site defects, contractor issues, asbestos/fire/water safety follow-up.
- HR & People: linked staff incidents, absence, capability, disciplinary, grievance, return-to-work workflows.
- Safeguarding/SEND/Governance: linked specialist records and trust oversight where appropriate.
- Risk Register: incident risk scoring and serious-risk escalation.

## Core User Need

Schools currently lose operational control because incidents are scattered across emails, paper forms, Teams messages, memory, and disconnected systems. Leaders need one place to answer:

- What happened?
- Who knows about it?
- Who owns the next step?
- Has the right form been completed?
- Is it reportable or escalated?
- Is there evidence that required action happened?
- Has the incident been reviewed and closed?

## Primary Roles

- Reporter: any user who sees or is told about an incident.
- Incident owner: the person responsible for managing the incident through closure.
- Specialist lead: DSL, H&S lead, DPO, HR lead, estates lead, SENDCO, trust lead, or governor-facing lead.
- Approver: senior leader/trust role who signs off closure or escalation.
- Viewer: authorised user with read-only access to relevant incidents.

## Incident Types

Initial standard types:

- Pupil accident / first aid
- Staff accident / near miss
- Safeguarding concern
- Child missing / left site / supervision failure
- GDPR / data protection incident
- Estates hazard / defect
- Contractor incident / unsafe work
- Behaviour incident
- Parent complaint / concern
- HR staff conduct / workplace issue
- SEND provision concern
- Finance/procurement irregularity
- Other notable event

Each type should have its own source-backed checklist, document templates, escalation rules, and suggested meeting templates.

## Workflow

1. A user selects `Report Incident`.
2. The user gives minimal initial details: type, school/site, date/time, location, people involved, summary, immediate action taken.
3. The system creates an incident reference and initial risk score.
4. The system routes the incident to the correct owner or specialist lead.
5. The system generates required tasks from the incident type and risk level.
6. Ed Guided Capture can interview the reporter or assigned staff member to complete structured forms.
7. Document Hub generates branded reports, letters, forms, and records from approved templates.
8. Meeting Companion can launch linked meetings where investigation, review, or formal discussion is needed.
9. The chronology records every update, task, document, meeting, decision, and sign-off.
10. The incident is closed only when mandatory actions and approvals are complete.

## Risk Scoring

The app should use a transparent risk score rather than a hidden AI judgement.

Suggested factors:

- Severity: harm, disruption, statutory exposure, safeguarding risk.
- Likelihood of recurrence: isolated, possible, likely, ongoing.
- Vulnerability: child, SEND, medical need, staff vulnerability, public impact.
- Compliance exposure: statutory report, regulator interest, missed procedure.
- Reputational impact: parent concern, media/social risk, trust-level concern.

Risk output:

- Low: school-managed, routine completion.
- Medium: owner review and action plan required.
- High: senior leader/trust visibility.
- Critical: immediate escalation and closure approval required.

The system should explain why the score was suggested and allow an authorised user to override it with a reason.

## Dashboard-First Assignment

Email should be a notification channel, not the source of truth.

Assigned users should see incidents and actions in their dashboard:

- Assigned to me
- Overdue
- Due soon
- Awaiting my approval
- Needs information
- Linked meeting required
- Linked document awaiting approval

Reminders should be generated from due dates and risk level.

## Guided Capture

Guided Capture is the Ed-powered interview layer inside Incident Hub.

It should:

- Ask one question at a time.
- Support voice and typed answers.
- Explain why key questions are being asked.
- Capture enough detail to complete the correct form.
- Avoid making final legal/statutory determinations without user approval.
- Produce a draft report for user review before filing.
- Flag missing detail, contradictions, and escalation triggers.

Example: pupil accident / first aid capture should ask who was injured, where and when it happened, what happened, witnesses, injury type, first aid given, parent/carer contact, whether the pupil returned to class/went home/went to hospital, and whether site/equipment factors contributed.

## Source-Backed Templates

Every incident type must have provenance, not just product judgement.

Each template/checklist item should store:

- Source title
- Publisher
- URL
- Source type: legislation, statutory guidance, regulator guidance, ACAS/HSE guidance, local policy, good practice
- Date checked
- Review due date
- Applies to
- Checklist items mapped to source references
- Expected evidence
- Red flags
- Suggested follow-up questions

Current relevant official source families include:

- HSE incident reporting in schools: https://www.hse.gov.uk/pubns/edis1.htm
- HSE RIDDOR reporting: https://www.hse.gov.uk/riddor/reporting/index.htm
- HSE first aid at work: https://www.hse.gov.uk/firstaid/
- Keeping children safe in education: https://www.gov.uk/government/publications/keeping-children-safe-in-education--2
- UK GDPR and Data Protection Act 2018 guidance from the ICO: https://ico.org.uk/for-organisations/
- ACAS disciplinary and grievance code: https://www.acas.org.uk/acas-code-of-practice-on-disciplinary-and-grievance-procedures
- HSE CDM 2015 guidance: https://www.hse.gov.uk/construction/cdm/2015/index.htm

Templates should be labelled as `Draft`, `Source-backed`, `Reviewed`, or `School-approved`. Schoolgle should not present a template as compliant unless its source mapping and review status support that.

## Records and Evidence

Each incident should maintain a chronology:

- Incident created
- Risk score changes
- Owner assigned
- Tasks created/completed
- Documents generated/approved/sent
- Meetings created/completed
- Notes added
- Evidence uploaded
- Escalation decisions
- Closure approval

Evidence should be linked, not duplicated where possible.

## Data Model Draft

Core tables:

- `incidents`
- `incident_people`
- `incident_tasks`
- `incident_documents`
- `incident_meetings`
- `incident_evidence`
- `incident_notes`
- `incident_chronology`
- `incident_type_templates`
- `incident_template_sources`
- `incident_risk_assessments`

Key `incidents` fields:

- `id`
- `organization_id`
- `school_id`
- `type`
- `title`
- `summary`
- `status`
- `risk_level`
- `risk_score`
- `owner_user_id`
- `reported_by_user_id`
- `occurred_at`
- `location`
- `escalation_level`
- `requires_approval`
- `closed_at`
- `closed_by_user_id`

## MVP Scope

Phase 1 should build the spine:

- Incident Hub app card and route.
- Central incident register.
- Create incident flow.
- Type, status, owner, risk score, and due date.
- Basic task assignment to dashboard.
- Chronology.
- Link existing document templates.
- Link existing meeting templates.

Phase 2 should add guided capture:

- Question sets for first aid / pupil accident, staff accident, data incident, estates hazard, and safeguarding concern.
- Voice input where supported.
- Draft report generation.
- Missing detail and escalation prompts.

Phase 3 should add advanced assurance:

- Source-backed checklist library.
- Trust-level dashboards.
- Risk trend analytics.
- Review/closure approval.
- External-reporting prompts.
- Template provenance UI.

## First Template Set

The first standard incident templates should be:

1. Pupil first aid / accident
2. Staff accident / near miss
3. Child missing / left site
4. Safeguarding concern
5. GDPR / data protection incident
6. Estates hazard / defect
7. Contractor unsafe work
8. Parent complaint
9. HR conduct concern
10. Behaviour serious incident

These should be treated as draft until source mapping is complete.

## Open Decisions

- Whether Incident Hub should live under `Business`, `Compliance`, or a new cross-module `Control` area.
- Whether all users can see `Report Incident` globally in the header.
- Whether low-risk incidents need approval to close.
- How trust-level visibility is controlled for safeguarding and HR-sensitive records.
- Which source-backed templates should be implemented first.

