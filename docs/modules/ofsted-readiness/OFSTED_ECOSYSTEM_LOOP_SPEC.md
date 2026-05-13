# Ofsted Readiness Ecosystem Loop

## Purpose

This document locks in the intended product direction for Ofsted Readiness so future development builds on the existing Schoolgle ecosystem rather than recreating separate workflows.

The Ofsted Readiness app should not be a one-off scanner. It should be a living cycle that detects inspection-readiness issues, links them to evidence and policy ownership, creates accountable tasks, verifies completion, and keeps checking as legislation, guidance, documents, and school practice change.

## Core Principle

Schoolgle should work as one connected operating system:

- **Dashboard** is the user's workload and navigation centre.
- **Modules** are the source of truth and audit trail.
- **Tasks** are actionable pointers into the correct source module.
- **Scans** create findings, not isolated reports.
- **Findings** become draft tasks only when they need human action.
- **Completion** should be verified by re-scan or evidence review.
- **Policy and statutory checks** must remain current with legislation and guidance.

## Existing Foundations

The system already has several pieces that should be extended, not rewritten:

- Ofsted Readiness app route and tabs.
- Google Drive / OneDrive evidence scanning.
- Website statutory compliance scanner.
- AI evidence matching.
- AI quality assessment prompts.
- Smart task generation.
- Compliance Policy Manager.
- Compliance task API.
- Unified task API.
- Dashboard task widget.
- Estates-style task surfacing and module-specific audit trails.

The implementation should connect these foundations rather than introduce a second task system or a separate Ofsted-only workflow.

## Desired User Experience

### Headteacher / SLT

The headteacher can run an Ofsted readiness scan and see:

- what was checked;
- what evidence was found;
- what is missing;
- what is present but weak;
- what is out of date;
- what legislation or guidance applies;
- what actions are recommended;
- which actions are required versus suggested improvements;
- which staff members have been assigned tasks;
- which issues have been completed and verified.

The headteacher should approve and allocate generated tasks before they appear on staff dashboards.

### Assigned Staff Member

The staff member sees assigned tasks in their normal dashboard, not by hunting through separate modules.

Example:

- Task: `Review and republish Safeguarding Policy`
- Module: `Ofsted Readiness`
- Source: `Website scan / policy check`
- Linked record: internal policy manager item or Google Drive policy
- Due date: suggested by severity
- Action: opens the correct policy, evidence record, or Ofsted finding

### System

The system keeps the audit trail:

- original scan finding;
- evidence source;
- rule version used;
- legislation/guidance source;
- generated task;
- assignee;
- completion history;
- verification result;
- next review date if recurring.

## Finding Lifecycle

Every scan issue should become a persistent finding with a lifecycle:

1. `identified` — scanner found an issue or opportunity.
2. `acknowledged` — headteacher has reviewed it.
3. `assigned` — a task has been approved and allocated.
4. `in_progress` — owner is working on it.
5. `completed` — owner marks the task complete.
6. `verification_required` — system needs to re-check evidence.
7. `verified` — scan confirms the issue is fixed.
8. `recurring` — the issue is resolved but has a future review cycle.
9. `dismissed` — headteacher decides no action is required, with rationale.

Findings should not disappear after a task is completed. They should remain as part of the inspection-readiness audit trail.

## Task Model

Ofsted Readiness should use the existing unified task ecosystem.

### Use Existing Tables Where Possible

- Use `actions` for improvement and Ofsted readiness actions.
- Use `compliance_tasks` where the task is directly tied to a compliance policy or statutory compliance item.
- Continue surfacing tasks through `/api/tasks`.

### Required Task Views

The dashboard should support:

- tasks assigned to me;
- tasks I created;
- tasks I assigned to others;
- overdue tasks;
- tasks by module;
- tasks by source;
- tasks requiring verification.

### Task Routing

Every generated task should carry routing metadata so clicking it opens the right source:

- Estates task → Estates task/helpdesk/compliance record.
- Compliance policy task → Policy Manager item.
- Ofsted readiness task → Ofsted finding/action panel.
- Website issue → Website scan result.
- Drive evidence issue → Drive document/evidence match.

## Policy Manager Integration

Policy-related findings should link into the compliance policy ecosystem.

### Policy Source Options

A policy may be:

- managed inside Schoolgle's Policy Manager;
- stored in Google Drive;
- stored in OneDrive;
- published on the school website;
- published on a trust website;
- absent or not yet identified.

The system should attempt to link findings to the best available source and make that source visible to the user.

### Policy Lifecycle

Policy findings should feed:

- review dates;
- renewal reminders;
- approval workflow;
- published status;
- version history;
- evidence links;
- future review schedule.

If a policy is fixed, the system should not simply close the task. It should schedule the next review through the compliance review cycle.

## Expert Rubrics

The Ofsted Readiness app must assess quality, not just presence.

Each item should have an expert rubric that checks:

- whether the document/page exists;
- whether it is current;
- whether the correct legislation/guidance is referenced;
- whether required content is included;
- whether it is specific to the school;
- whether placeholders remain;
- whether links are broken;
- whether dates and named roles are missing;
- whether evidence of implementation or impact is present;
- whether an inspector would consider it good enough.

### Example: Safeguarding Policy

The scanner should be able to detect:

- missing safeguarding policy;
- old KCSIE reference;
- missing DSL names or responsibilities;
- missing filtering and monitoring content;
- missing online safety content;
- placeholder text such as `[insert school name]`;
- generic policy not adapted to the school;
- missing review/approval date;
- unclear reporting or escalation process.

This can produce both required tasks and suggested improvements.

## Finding Severity

Findings should distinguish between:

- **Required action** — statutory, safeguarding, inspection-critical, or misleading content.
- **Recommended action** — important quality issue that should be addressed.
- **Suggested improvement** — policy exists and is compliant, but could be stronger.
- **Information only** — useful context but no action required.

This prevents the system from overwhelming schools with unnecessary tasks while still helping them improve.

## Scoring Model

Each checked item should receive a score:

- `0` — not found.
- `1` — found but unusable, outdated, or clearly non-compliant.
- `2` — present but weak or incomplete.
- `3` — meets expected statutory/inspection standard.
- `4` — strong, school-specific, and inspection-ready.
- `5` — excellent, with clear evidence of implementation and impact.

Scores should always show:

- rule version;
- source guidance;
- confidence;
- reason;
- recommended next action.

## Keeping Rules Current

Schoolgle should maintain a versioned statutory and inspection rules library.

Each rule should include:

- rule key;
- title;
- applicable school type;
- applicable phase;
- statutory/good-practice status;
- source guidance URLs;
- effective date;
- last verified date;
- next review date;
- rubric/checklist version;
- AI prompt version;
- change history.

The app should make this visible as a trust signal:

> Checked against Schoolgle statutory ruleset vYYYY.MM, last verified DD MMM YYYY.

This is a sales feature as well as a safety feature: Schoolgle monitors changes so schools do not have to manually track every guidance update.

## Guidance Monitoring

The maintained rules library should monitor official and high-trust sources, including:

- GOV.UK school website publishing guidance;
- GOV.UK academy publishing guidance;
- Keeping Children Safe in Education;
- Ofsted Education Inspection Framework;
- DfE pupil premium guidance and templates;
- PE and sport premium guidance;
- SEND regulations and SEND Code of Practice;
- Academy Trust Handbook;
- financial benchmarking / FBIT requirements;
- relevant consultations where future changes are signposted.

When a monitored rule changes:

1. Update the rule/rubric.
2. Version the change.
3. Identify affected schools/checks.
4. Mark relevant findings as requiring re-check.
5. Generate review prompts or draft tasks where action may be needed.

## Audit and Evidence Trail

Every generated finding and task should retain:

- source scan ID;
- evidence document/page URL;
- matched text or extracted quotes where safe;
- rule/rubric version;
- legislation/guidance source;
- AI model/prompt version;
- user who approved or dismissed;
- assignee;
- completion evidence;
- verification result;
- timestamps.

This is essential for trust, inspection readiness, and internal governance.

## Implementation Direction

Do not rewrite the existing system.

Build the missing glue:

1. Add a persistent Ofsted findings register.
2. Standardise evidence flows into the existing evidence/task ecosystem.
3. Link policy-related findings to Compliance Policy Manager.
4. Generate draft tasks requiring headteacher approval.
5. Surface approved tasks in the existing unified dashboard.
6. Add routing metadata so tasks open the correct source module.
7. Add verification and recurring review logic.
8. Add a versioned rules library with visible source and “last verified” metadata.

## Product Message

The product promise should be:

> Schoolgle does not just check whether your evidence exists. It checks whether it is current, complete, legally aligned, inspection-ready, and assigned to the right person when action is needed.

And:

> We keep the statutory checks up to date for you, so your readiness position evolves as guidance, evidence, and policies change.

