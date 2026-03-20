# Cross-Module Connection Matrix

**Date:** 2026-03-19
**Method:** Line-by-line code trace through actual data flow paths
**Standard:** Connection marked PROVEN only when traced through actual query → render → display code path

---

## Proven Connections (data flow traced end-to-end)

| From                             | To                   | Mechanism                                                                    | Data Flow                                 | Org Scoped                 | Status |
| -------------------------------- | -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- | -------------------------- | ------ |
| Staff Directory → Documents      | Placeholder resolver | `resolveFromStaff()` queries `staff_directory` by ID + org_id                | YES (Phase 5 fix)                         | **PROVEN**                 |
| Organisation → Documents         | Placeholder resolver | `resolveFromOrganization()` queries `organizations` by ID                    | YES                                       | **PROVEN**                 |
| Sickness Absence → Documents     | Placeholder resolver | `resolveFromAbsence()` queries `sickness_absence_records` + Bradford calc    | YES                                       | **PROVEN**                 |
| Contractor → Documents           | Placeholder resolver | `resolveFromContractor()` queries `estates_contractors` by ID + org_id       | YES (Phase 5 fix)                         | **PROVEN**                 |
| Meetings → Documents             | Placeholder resolver | `resolveFromMeeting()` queries `meetings` + `meeting_templates`              | Partial (no org filter on meeting lookup) | **PROVEN (partial scope)** |
| Actions → Unified Tasks          | Direct query         | `SELECT * FROM actions WHERE organization_id = ?`                            | YES                                       | **PROVEN**                 |
| Estates Tasks → Unified Tasks    | Direct query         | `SELECT * FROM estates_compliance_tasks WHERE organization_id = ?`           | YES                                       | **PROVEN**                 |
| Compliance Tasks → Unified Tasks | Direct query         | `SELECT * FROM compliance_tasks WHERE organization_id = ?`                   | YES                                       | **PROVEN**                 |
| Training Expiry → Unified Tasks  | Direct query         | `SELECT FROM compliance_training_completions WHERE organization_id = ?`      | YES                                       | **PROVEN**                 |
| Risk Register → Unified Tasks    | Direct query         | `SELECT FROM risk_register WHERE organization_id = ?`                        | YES                                       | **PROVEN**                 |
| Staff → Ed Context               | Count query          | `COUNT FROM staff_directory WHERE organization_id = ? AND is_active = true`  | YES                                       | **PROVEN**                 |
| Overdue Tasks → Ed Context       | Count query          | `COUNT FROM unified_tasks WHERE due_date < now AND status = pending`         | YES                                       | **PROVEN**                 |
| Helpdesk Tickets → Ed Context    | Count query          | `COUNT FROM estates_helpdesk_tickets WHERE status IN (open, in_progress)`    | YES                                       | **PROVEN**                 |
| Meetings → Ed Context            | List query           | `SELECT FROM meetings WHERE date > now LIMIT 10`                             | YES                                       | **PROVEN**                 |
| Risk Register → Ed Skills        | Full CRUD            | 6 skill handlers query `risk_register`, `risk_mitigations`, `risk_decisions` | YES                                       | **PROVEN**                 |
| Staff → Ed Skills                | Full CRUD            | 6 skill handlers query `staff_directory`                                     | YES                                       | **PROVEN**                 |
| Actions → Ed Skills              | Full CRUD            | 6 skill handlers query `actions`                                             | YES                                       | **PROVEN**                 |

## Partial/Fragile Connections

| From                          | To                             | Issue                                                                                               | Risk                                  | Status                 |
| ----------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- |
| Unified Tasks → Summary Stats | Only counts `actions` table    | Summary shows completion % from actions only; estates/compliance/risk tasks excluded from breakdown | Users see misleading completion rates | **FRAGILE**            |
| Unified Tasks → Pagination    | Only `actions` supports offset | Page 2+ shows duplicate estates/compliance/training tasks                                           | Data quality issue on pagination      | **FRAGILE**            |
| Ed Context → Post-Skill State | 2-min cache (reduced from 5)   | After skill creates data, next message may show stale count                                         | Confusing but self-correcting         | **IMPROVED (Phase 5)** |
| Documents → Deleted Records   | Silent empty placeholder       | If staff/contractor deleted after template created, `{{staff_name}}` renders as blank               | Document has empty fields, no error   | **FRAGILE**            |

## Connections That Don't Exist (But Might Be Expected)

| Expected Connection            | Reality                                                                | Impact                                                    |
| ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Pupils → Attendance registers  | `pupils` table exists but attendance module queries its own data store | Must enter pupil data separately in attendance            |
| Pupils → SEND register         | No auto-sync from `pupils` to `send_register`                          | SEND uses its own pupil entries                           |
| Pupils → Behaviour incidents   | No auto-sync from `pupils` to `behaviour_incidents`                    | Behaviour uses its own pupil entries                      |
| Actions → Evidence             | `linked_evidence` field exists but is never populated                  | Evidence-action linking is dead code                      |
| Meetings → Actions             | No FK or auto-creation flow                                            | Cannot create follow-up action from within a meeting      |
| Risk → Actions                 | Mitigations exist but don't auto-create corresponding actions          | Risk mitigation tracking is separate from action tracking |
| Governance Decisions → Actions | No schema link                                                         | Board decisions don't flow to action tracking             |
| Safeguarding → Behaviour       | No escalation link                                                     | Behaviour incidents don't auto-escalate to safeguarding   |
| Calendar → Meetings            | Separate event stores                                                  | Calendar events and meeting records are independent       |
| Surveys → Intelligence         | Survey responses not aggregated into analysis                          | Survey data is siloed                                     |

## Connection Architecture Summary

```
                      ┌─────────────────┐
                      │   Documents     │
                      │ (placeholder    │
                      │  resolver)      │
                      └──────┬──────────┘
                             │ Pulls from:
              ┌──────────────┼──────────────┐
              │              │              │
         Staff Dir    Organisation    Contractors
              │              │              │
         Absence       Meetings       (Estates)
              │
         (HR Module)

                      ┌─────────────────┐
                      │  Unified Tasks  │
                      │ (aggregator)    │
                      └──────┬──────────┘
                             │ Reads from:
         ┌───────────┬───────┼───────┬──────────┐
         │           │       │       │          │
      Actions    Estates  Compliance Training  Risk
         │        Tasks     Tasks   Expiry   Register
    (enriched)  (basic)   (basic)  (synth)   (synth)

                      ┌─────────────────┐
                      │    Ed AI        │
                      │ (context +      │
                      │  skills)        │
                      └──────┬──────────┘
                             │ Context from:
         ┌───────┬───────┬───┼───┬──────┬──────┐
         │       │       │   │   │      │      │
       Staff  Tasks  Tickets │ Risks Meetings │
       Count  Count  Count   │ Full  List   Intel
                           Org              Factors
                           Info
```

## Key Finding

**Documents** are the strongest cross-module integration point — pulling live data from 6 sources with org-scoped queries (now fixed in Phase 5).

**Unified Tasks** is the broadest aggregator — pulling from 5 tables — but has structural fragility in pagination and summary stats.

**Ed AI** has the widest read access (12+ tables) but writes only to modules with implemented skills (Staff, Actions, Estates, Risk, Documents).

**Pupil data is siloed.** The `pupils` table exists but doesn't auto-populate downstream modules. Each module (Attendance, SEND, Behaviour) maintains its own pupil records independently.
