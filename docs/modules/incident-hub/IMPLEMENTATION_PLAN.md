# Incident Hub Implementation Plan

## Build Principle

Build Incident Hub as a cross-module register first, then add richer guided capture. The MVP should make incidents visible, assignable, risk-scored, and linked to tasks, meetings, and documents before attempting advanced AI interviewing.

## Phase 1: Register and Routing

### Goals

- Add Incident Hub as a Schoolgle Business app.
- Allow any authorised user to report an incident.
- Create a central register with filters and risk/status visibility.
- Assign ownership and tasks.
- Link incidents to existing documents and meetings.

### Frontend

- Add module/app registry entry for Incident Hub.
- Create `/dashboard/incidents` register page.
- Create `/dashboard/incidents/new` report flow.
- Create `/dashboard/incidents/[id]` detail page.
- Show incident chronology, assigned tasks, linked documents, linked meetings, and risk score.

### API

- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/[id]`
- `PATCH /api/incidents/[id]`
- `POST /api/incidents/[id]/tasks`
- `POST /api/incidents/[id]/documents`
- `POST /api/incidents/[id]/meetings`
- `POST /api/incidents/[id]/notes`

### Database

Create migration for:

- `incidents`
- `incident_people`
- `incident_notes`
- `incident_chronology`
- `incident_links`
- `incident_risk_assessments`

Use `organization_id` and optional `school_id` for trust/school-level visibility.

### Risk Engine

Create deterministic scoring utility:

- `severity`
- `likelihood`
- `vulnerability`
- `compliance_exposure`
- `reputational_impact`

Return:

- numeric score
- risk level
- explanation
- escalation recommendation

Do not rely on AI for the initial MVP risk score.

## Phase 2: Task and Dashboard Integration

### Goals

- Incident tasks appear in the user’s dashboard.
- Overdue age and reminders are visible.
- Escalation happens from risk level and overdue status.

### Work

- Reuse or extend unified task patterns under existing `/api/tasks`.
- Link task rows back to `incident_id`.
- Add dashboard card: `Your Incident Actions`.
- Add trust/school filters for leaders.
- Add status rollups: open, overdue, high risk, awaiting approval.

## Phase 3: Document Hub Integration

### Goals

- Generate branded documents from an incident.
- Use standard templates but allow school-custom templates.
- Store generated documents against the incident chronology.

### Work

- Add incident placeholder resolver support to Document Hub.
- Add initial document templates:
  - Pupil accident record
  - Staff accident / near miss report
  - Parent notification letter
  - Internal investigation note
  - Serious incident review report
  - GDPR incident record
  - Contractor unsafe work record
- Add generated document links to `incident_documents`.

## Phase 4: Meeting Companion Integration

### Goals

- Launch relevant meeting templates from an incident.
- Feed incident context into the meeting agenda.
- Link completed minutes back to the incident.

### Work

- Add `incidentId` support to meeting creation.
- Add suggested meeting templates by incident type:
  - HR fact-finding
  - Safeguarding review
  - Parent concern meeting
  - Contractor review
  - Serious incident review
  - Staff return-to-work / welfare meeting
- Add linked meeting timeline entries.

## Phase 5: Guided Capture

### Goals

- Use Ed to interview users into completing structured incident forms.
- Support voice and typed input.
- Produce draft forms for approval.

### Work

- Add guided capture templates with question order, required fields, source references, red flags, and follow-up prompts.
- Add `/dashboard/incidents/[id]/capture` flow.
- Add save/resume support.
- Add draft output panel.
- Add user approval before filing.

## Phase 6: Source-Backed Template Library

### Goals

- Make incident workflows defensible and auditable.
- Show why questions are asked and what standards they map to.

### Work

- Add tables:
  - `incident_type_templates`
  - `incident_template_questions`
  - `incident_template_sources`
  - `incident_template_reviews`
- Add status values:
  - `draft`
  - `source_backed`
  - `reviewed`
  - `school_approved`
- Add source panel in template preview.
- Add review due dates and “last checked” metadata.

## Phase 7: Trust Assurance Views

### Goals

- Give trusts oversight without exposing sensitive details unnecessarily.
- Show trends, outstanding actions, and risk concentration.

### Work

- Add trust dashboard:
  - high-risk open incidents
  - overdue actions
  - incidents by type
  - incidents by school
  - closure time
  - repeated location/person/category patterns
- Add role-based filters for safeguarding, HR, GDPR, and school-only records.

## MVP Acceptance Criteria

- A user can create an incident from the dashboard.
- An incident receives a deterministic risk score.
- The incident appears in a central register.
- The incident can have an owner, due date, status, and chronology.
- Tasks can be assigned from the incident.
- A document can be generated or linked from the incident.
- A meeting can be created or linked from the incident.
- Closure requires mandatory tasks to be complete.
- Sensitive incident types respect role-based access.

## Recommended First Build Slice

Start with:

1. App registry entry and register page.
2. Database migration for core incident tables.
3. Create incident flow with risk scoring.
4. Incident detail page with chronology.
5. Basic task creation.
6. Basic document and meeting links.

This gives the ecosystem shape immediately without waiting for the advanced AI capture layer.

