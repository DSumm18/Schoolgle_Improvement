# Schoolgle SEND Copilot Product Design

**Date:** 2026-05-09  
**Status:** Approved product direction; ready for Phase 1 implementation planning  
**Owner intent:** Build a simple, practical SENCO product that removes admin friction, improves statutory confidence, and keeps each pupil's SEND picture in one place.

---

## Executive Summary

Schoolgle SEND Copilot is a SENCO command centre for English schools and academy trusts. It should help a SENCO get the real work done: know who is on the register, what each pupil needs, what is overdue, what evidence is missing, what meetings must happen, what the law/guidance says, and what documents must be produced next.

The broader product line should be `Schoolgle SEND & Inclusion Copilot`. This keeps the SENCO workflow simple while allowing senior inclusion leaders, such as an Assistant Headteacher for Inclusion, to cover SEND, disadvantaged pupils, vulnerable pupils, emotional wellbeing, provision, staff support, curriculum adaptations, governor/trust reporting and inclusion evidence from the same operating layer.

The product should not feel like a compliance maze. The core experience should be:

1. open SEND;
2. see today's priorities;
3. search or filter pupils;
4. open a pupil;
5. run the next workflow: APDR, EHCP request, annual review, provision review, referral, transition or funding evidence pack;
6. leave with minutes, actions, documents and evidence trail completed.

The commercial wedge is not another provision map. Competitors already do register/provision/APDR reasonably well. The differentiated product is a meeting-to-evidence-to-documentation copilot that understands SEND statutory process and helps the SENCO produce better, faster, more consistent work with less admin.

---

## Product Positioning

### Public Message

> Give your SENCO back time. Schoolgle SEND Copilot brings pupil records, statutory workflows, meetings, evidence packs and AI-assisted documentation into one simple place.

### Internal Product Thesis

Many SEND administrator tasks can be automated or semi-automated:

- meeting scheduling and agendas;
- minute taking;
- action capture;
- document collation;
- evidence bundle creation;
- APDR and review cycle tracking;
- annual review paperwork;
- EHCP request evidence checking;
- funding and banding evidence organisation;
- parent/professional communication drafts;
- deadline and compliance monitoring.

The product should be marketed as SENCO enablement, not staff replacement. The adoption story is safer and stronger: fewer missed deadlines, clearer records, better pupil-centred evidence, less evening/weekend paperwork, and stronger trust-wide consistency.

---

## Target Users

### Primary User: SENCO

Needs:

- one clean overview of all SEND pupils;
- quick filtering by year, class, need, SEN status, EHCP, review due, provision and key worker;
- low-friction pupil profile;
- automated paperwork from meetings;
- confidence that statutory steps are not being missed;
- evidence packs that are easy to send to the local authority;
- no noisy dashboards or complex analytics unless they answer an immediate operational question.

### Strategic User: Assistant Headteacher / Inclusion Lead

Needs:

- one inclusion view across SEND, disadvantaged, vulnerable and wellbeing cohorts;
- evidence of impact for leaders, governors, trustees and Ofsted;
- simple reports for SLT and trust meetings;
- ability to connect pupil needs to staff support, CPD, curriculum adaptation and provision planning;
- oversight of behaviour, attendance and attainment risk where it affects inclusion;
- a clear development plan for inclusive practice, not just individual pupil paperwork.

### Secondary Users

- Headteacher / SLT: oversight, risk, statutory deadlines, resourcing, Ofsted inclusion evidence.
- Class teachers: simple pupil passport, strategies, provision expectations, review input.
- Teaching assistants / key workers: provision delivery notes, intervention attendance, impact updates.
- Parents / carers: views, meeting contributions, agreed actions, review documents.
- Trust SEND lead: cross-school visibility, consistency, risk, funding exposure and QA.
- Business manager / finance: high-needs funding, top-up payments, provision cost vs income.

---

## Day In The Life Workflow

### Morning: Open SEND Today

The SENCO sees a calm priority view:

- annual reviews due within 30/60/90 days;
- overdue APDR reviews;
- pupils with EHCP deadlines at risk;
- pupils with no current provision recorded;
- missing parent/pupil/professional views;
- referrals waiting for action;
- evidence packs below readiness threshold;
- meetings scheduled today;
- funding variances requiring follow-up.

No charts unless they directly drive action.

### Midday: Open A Pupil

The pupil profile answers:

- Who is this pupil?
- What is their SEND status and primary need?
- Do they have an EHCP?
- What are their outcomes/targets?
- What provision is in place?
- What evidence exists?
- What meetings have happened?
- What actions are open?
- What is missing?
- What is the next statutory or practical step?

### Afternoon: Run A Meeting

The SENCO chooses a meeting type:

- EHCP Annual Review;
- SEN Support APDR Review;
- EHCP Needs Assessment Planning;
- High Needs Funding / Band Review;
- Team Around the Child / Family;
- Transition Planning;
- Placement Consultation;
- Parent Concern / SEND Review;
- Individual Support Plan readiness review for future reforms.

The system:

- preloads pupil context;
- sets agenda and required attendees;
- shows required documents;
- records consent;
- records/transcribes the meeting;
- surfaces statutory prompts and suggested wording;
- captures accepted prompts into minutes;
- creates actions;
- generates meeting minutes and LA-ready outputs.

### End Of Day: Close The Loop

The system should show:

- documents generated;
- actions assigned;
- evidence gaps remaining;
- deadlines updated;
- next review date set;
- audit trail complete.

---

## Statutory And Guidance Framework

The product must maintain a versioned SEND guidance matrix. Each workflow should know which duties, deadlines and evidence expectations apply. This matrix should be treated as a product rule pack, not hard-coded text scattered through UI components.

### Current Framework To Support

| Area | Product Requirement |
| --- | --- |
| SEND Code of Practice 0-25 | Use as the core statutory guidance source for identification, SEN support, APDR, EHCP assessment/plans, reviews, participation and joint working. |
| Children and Families Act 2014 | Track duties around education, health and care needs assessments, EHC plans, best endeavours, co-production and SEN information reports. |
| SEND Regulations 2014 | Model procedural rules for EHC assessment, plan creation, annual reviews, amendment and ceasing processes. |
| Equality Act 2010 | Capture reasonable adjustments, disability access considerations and non-discrimination evidence. |
| Ofsted EIF from November 2025 | Surface inclusion evidence and support school leaders to demonstrate inclusive practice, not just individual paperwork. |
| DfE 2026 SEND Reform Consultation | Prepare for digital Individual Support Plans, stronger mainstream inclusion, Targeted/Targeted Plus support and future transition away from some current EHCP use cases. |

### Statutory Workflow Rules

| Workflow | Rules The Product Must Encode |
| --- | --- |
| SEN Support / APDR | Assess, Plan, Do, Review cycle; parent/pupil involvement; evidence of ordinarily available provision, targeted support, outcomes and impact. |
| EHCP Needs Assessment Request | Evidence of needs, provision tried, progress/impact, professional advice, parent/pupil views, why support may be required beyond SEN support. |
| EHCP Lifecycle | Track request date, LA decision to assess, advice gathering, draft plan, parent response period, consultation and final plan. |
| EHCP 20-week Process | Track final plan due date from request/LA awareness, with exception notes where applicable. |
| Annual Review | Review within 12 months of issue/previous review; collect views and advice; hold review; submit report/recommendations; track LA decision after review. |
| Phase Transfer | Flag statutory transfer points and plan review/amendment timing around school phase changes. |
| Provision Mapping | Link provision to need, outcome, frequency, duration, responsible adult, cost, evidence and review date. |
| Funding / Top-Up | Track Element 1/2/3, LA banding, expected vs received, provision cost and evidence supporting band change. |
| SEN Information Report | Help schools keep required website information current, including SENCO details and support arrangements. |
| Reasonable Adjustments | Capture adjustment, barrier, owner, review date and impact evidence. |

### Legal Safety Guardrails

The product must not present itself as giving legal advice or guaranteeing outcomes against a local authority. It should present:

- statutory guidance support;
- process reminders;
- evidence readiness checks;
- suggested challenge wording;
- human-approved meeting prompts;
- source-linked guidance references.

Every generated challenge prompt should be reviewable before it is spoken, minuted or sent.

---

## Product Modules

### 1. SEND Today

Purpose: a low-noise action board for the SENCO.

Must show:

- reviews due/overdue;
- EHCP deadlines;
- APDR cycles due;
- missing evidence;
- scheduled meetings;
- referral status;
- funding variances;
- pupils needing attention.

Design rule: every card must answer "what do I need to do next?"

### 1a. Inclusion Leadership

Purpose: a simple senior-leader layer for Assistant Heads, trust SEND leads and inclusion leaders.

Must show:

- SEND, disadvantaged, vulnerable and wellbeing priorities;
- attainment/progress, attendance and behaviour risks filtered by cohort;
- provision impact and funding pressure;
- staff support and CPD actions linked to inclusion priorities;
- policy, governor/trust and Ofsted inclusion evidence status;
- generated SLT/governor/trust reports.

Design rule: this view should summarise risk and impact without exposing unnecessary sensitive pupil detail.

### 2. Pupil Register

Purpose: fast list of pupils with SEND or monitoring status.

Must support:

- search by name, pupil code or UPN where permitted;
- filters by year, class, SEN status, EHCP status, need type, key worker, review status;
- bulk import from Arbor/Wonde/Groupcall or CSV;
- clear privacy/RBAC controls;
- export where permitted.

### 3. Pupil One View

Purpose: one pupil, one truth.

Sections:

- summary;
- needs and barriers;
- SEN status and history;
- EHCP / ISP / APDR status;
- provision;
- outcomes and targets;
- evidence;
- meetings;
- referrals;
- parent/pupil voice;
- funding;
- actions;
- audit history.

### 4. Meeting Copilot

Purpose: turn SEND meetings into statutory-quality records and next actions.

Capabilities:

- meeting type selection;
- statutory agenda;
- attendees and invites;
- pre-meeting evidence checklist;
- consent capture;
- recording/transcription;
- live side-panel prompts;
- "add to minutes" button;
- action extraction;
- automatic minutes;
- document generation;
- source-linked guidance suggestions.

### 5. Evidence Pack

Purpose: make LA submissions and reviews easier and stronger.

Pack types:

- EHCP needs assessment request;
- EHCP annual review;
- high-needs funding / band change;
- placement consultation response;
- transition review;
- Ofsted inclusion evidence;
- tribunal/appeal-supporting evidence pack, labelled as organisational evidence not legal advice.

Evidence readiness should score:

- pupil/parent views;
- professional reports;
- APDR history;
- provision and impact;
- attendance/behaviour/context;
- attainment/progress;
- reasonable adjustments;
- cost/funding record;
- meeting minutes;
- missing or stale evidence.

### 6. Funding Intelligence

Purpose: connect provision, staffing, funding and evidence.

Capabilities:

- Element 1/2/3 tracking;
- LA band configuration;
- expected vs received;
- provision cost by pupil;
- cost by provision type;
- variance/dispute tracker;
- evidence supporting band changes;
- finance export/coding alignment.

This should be expanded into `SEND Funding Reconciliation`: a finance-facing workflow that compares what the school expects to receive for each pupil against what has actually arrived from the local authority. The detailed product note is `docs/modules/sen-funding/SEND_FUNDING_RECONCILIATION_SPEC.md`.

Additional capabilities:

- upload LA remittance/payment files, funding agreements, panel decisions and top-up statements;
- extract band, points, effective date, payment period and amount;
- calculate expected top-up funding by pupil, period and funding year;
- forecast expected receipt dates from the LA payment schedule;
- handle backdated funding, mid-year starts/leavers and band changes;
- reconcile actual receipts against expected receipts;
- flag missing, late, underpaid, overpaid, unmatched or backdated funding;
- generate a pupil-level funding query/challenge pack for human approval.

### 7. Trust Dashboard

Purpose: central oversight across schools.

Capabilities:

- reviews due/overdue by school;
- EHCP applications by stage;
- evidence readiness by school;
- funding exposure;
- provision cost/income gap;
- top risk pupils without displaying unnecessary sensitive detail;
- common LA differences;
- trust-level QA sampling.

### 8. Leadership Outputs

Purpose: turn operational SEND/inclusion data into useful leadership documents.

Outputs:

- SLT Inclusion Brief;
- Governor SEND/Inclusion Report;
- Trust SEND/Inclusion Dashboard;
- Annual Inclusion Development Plan;
- Ofsted Inclusion Evidence Pack;
- New Staff SEND/Inclusion Briefing Pack;
- Resource and provision priority report.

---

## Data Integration Strategy

### Arbor / MIS Integration

Use a staged approach:

1. CSV import from Arbor as immediate MVP fallback.
2. Wonde connector for broad MIS compatibility and school-controlled data permissions.
3. Arbor direct API where partnership/API terms allow.
4. Groupcall/Xporter as an alternative for schools already using that route.

Data minimisation principle: request only the data required for SEND workflows.

Likely required fields:

- pupil identity and school identifiers;
- year group, registration group, class;
- contacts/parent-carer names where permitted;
- attendance summary;
- SEN status and primary/secondary need;
- FSM/PP/EAL/looked-after/contextual flags where used for support planning;
- assessment/progress summary where available;
- staff/class teacher/key worker links.

Schoolgle should store operational SEND workflow data in Supabase, but original source files and uploaded evidence should follow the established connector source-of-truth model.

### Cloud Evidence

Drive/SharePoint remains source of truth for original documents where files already exist. Schoolgle stores:

- file reference;
- extracted text;
- summary;
- classification;
- linked pupil/workflow;
- evidence readiness contribution;
- audit trail.

---

## Data Model Additions

Existing foundations already include `send_register`, APDR, provision map, referrals, EHCP applications, annual reviews, funding allocations, provision costs, evidence files and review history.

Phase 1 should add the missing copilot layer:

| Table | Purpose |
| --- | --- |
| `send_statutory_rule_packs` | Versioned legal/guidance rules by workflow. |
| `send_workflow_instances` | One running process per pupil: APDR, EHCP request, annual review, funding review. |
| `send_workflow_steps` | Required steps, status, due date, owner and evidence requirement. |
| `send_meeting_links` | Link generic meetings to pupil/workflow/review/application records. |
| `send_live_guidance_events` | AI/statutory prompts raised during a meeting, with accepted/dismissed status. |
| `send_evidence_requirements` | Evidence checklist definitions per workflow. |
| `send_evidence_pack_items` | Selected files/data/actions included in a pack. |
| `send_mis_connections` | MIS connector state, provider, scopes, last sync, field health. |
| `send_import_mappings` | Approved Arbor/Wonde/CSV field mappings for SEND data. |
| `sen_funding_payment_schedules` | Expected top-up receipt dates/periods by LA, pupil, allocation and funding year. |
| `sen_funding_receipts` | Actual imported receipt/remittance/payment lines. |
| `sen_funding_reconciliation_runs` | One upload/import/reconciliation event. |
| `sen_funding_reconciliation_items` | Pupil-period expected vs received calculation and variance status. |
| `sen_funding_variance_actions` | Finance query/challenge workflow linked to actions and communications. |

---

## AI And Automation

### AI Jobs

- summarise evidence;
- identify missing evidence;
- extract needs/provision/outcomes from EHCPs and reports;
- compare provision wording against specificity/quantification expectations;
- draft minutes;
- draft parent/professional requests;
- suggest statutory prompts during meetings;
- create actions;
- generate evidence pack narrative;
- produce trust-level risk summaries.

### Human Approval Rules

AI can draft, suggest and summarise. A user must approve:

- meeting prompts added to minutes;
- statutory challenge wording;
- documents sent externally;
- changes to pupil SEND status;
- evidence pack submission;
- funding challenge letters;
- any generated view attributed to parent/pupil/professional.

---

## UX Principles

1. SENCO-first, not compliance-officer-first.
2. One screen should usually have one job.
3. Every dashboard item must have an action.
4. Pupil one-view is the centre of gravity.
5. Use progressive disclosure: summary first, detail on click.
6. Avoid legalistic language unless the user asks for source detail.
7. Keep guidance beside the workflow, not in a separate knowledge base.
8. Make it obvious what is AI-generated and what is confirmed evidence.
9. Make importing from Arbor/Wonde feel like setup, not data engineering.
10. Make meetings feel calm: agenda, record, prompts, minutes, actions.

---

## Phase 1 Build Scope

Phase 1 should produce a demonstrable product:

1. SEND Today command centre.
2. Pupil One View.
3. Annual Review Meeting Copilot.
4. EHCP Request Evidence Pack readiness.
5. CSV/Arbor export import path into SEND register.
6. Versioned statutory rule pack for APDR, EHCP request and Annual Review.
7. Document generation from meeting minutes and evidence pack.
8. Assistant Headteacher role-coverage roadmap captured in `docs/modules/sen-funding/SEND_COPILOT_ROLE_COVERAGE_ASSISTANT_HEAD_INCLUSION.md`, without overloading the Phase 1 SENCO workflow.
9. Funding visibility: current band/points, annual amount, effective dates, source document and provision cost vs funding on the pupil one-view.

Out of scope for Phase 1:

- full LA portal submission;
- direct write-back into Arbor;
- parent portal;
- tribunal case management;
- full trust analytics beyond a simple summary;
- automated legal advice.
- full automated funding reconciliation across every LA file format, except where included in the optional funding reconciliation MVP.

---

## Success Criteria

The product is ready for pilot when a SENCO can:

- import or create a SEND pupil;
- see all key pupils and deadlines in SEND Today;
- open a pupil one-view;
- start an EHCP annual review workflow;
- gather required views/evidence;
- book and run a meeting;
- receive live statutory prompts;
- generate minutes and actions;
- produce an annual review/evidence pack;
- see what is missing before sending to the LA;
- show SLT/trust what is overdue, at risk or ready.

Commercial success means the pilot SENCO says:

> This saves me hours every week and stops things slipping.

---

## Pricing Recommendation

| Segment | Suggested Price |
| --- | --- |
| Primary / small school | £995-£1,495 per year |
| Secondary | £1,995-£2,995 per year |
| Special / AP / resource base | £2,995-£4,995 per year |
| MAT | £795-£1,295 per school per year, plus central dashboard |
| Premium meeting/funding intelligence | £500-£1,500 per school per year |
| LA evidence-quality pilot | £15,000-£35,000 per year |

---

## Key Sources

- SEND Code of Practice: <https://www.gov.uk/government/publications/send-code-of-practice-0-to-25>
- SEND Reform Consultation 2026: <https://www.gov.uk/government/consultations/send-reform-putting-children-and-young-people-first>
- Ofsted Education Inspection Framework from November 2025: <https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025>
- Children and Families Act 2014: <https://www.legislation.gov.uk/ukpga/2014/6/contents>
- SEND Regulations 2014: <https://www.legislation.gov.uk/uksi/2014/1530/contents>
- Equality Act 2010 advice for schools: <https://www.gov.uk/government/publications/equality-act-2010-advice-for-schools>
- Arbor third-party API integrations: <https://support.arbor-education.com/hc/en-us/articles/360009421273-Setting-up-and-managing-third-party-API-integrations-in-Arbor>
- Wonde API documentation: <https://docs.wonde.com/docs/api/sync/>
