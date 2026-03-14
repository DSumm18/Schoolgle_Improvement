# Schoolgle Cross-Module Architecture Map

**Date:** 2026-03-14
**Purpose:** Single reference document showing every connection between modules. Use this to avoid conflicts when working on different PRs/branches and to ensure integrations are maintained when merging to main.

---

## Module Inventory

| Module | Route | Status | Key Tables | Spec Location |
|--------|-------|--------|------------|---------------|
| **School Improvement** | `/dashboard` | Built | `assessments`, `evidence`, `actions` | — |
| **Ofsted Readiness** | `/dashboard` (Ofsted tab) | Built | `ofsted_*` | `docs/modules/ofsted-readiness/` |
| **SIAMS** | `/dashboard` (SIAMS tab) | Built | `siams_*` | — |
| **Actions Hub** | `/dashboard/actions-hub` | Built | `actions` | — |
| **HR / People** | `/dashboard/hr/people` | Built | `staff_directory` | — |
| **Meetings** | `/dashboard/hr/meetings` → `/dashboard/meetings` | Built | `meetings`, `meeting_templates` | — |
| **Estates Compliance** | `/estates-compliance` | Built | `estates_*`, `assets` | `docs/modules/estates-compliance/` |
| **Governance** | `/dashboard/governance` | Built | `governance_*` | — |
| **Compliance** | `/modules/compliance` | Built | `compliance_*`, `scr_*` | — |
| **Intelligence Engine** | `/dashboard` (Intelligence tab) | Built | `school_intelligence_*`, `pupil_*` | — |
| **Finance** | `/modules/finance` | Planned | `budget_*`, `cfr_*` | — |
| **SEND Hub** | `/modules/send` | Specced | `send_*` | `docs/modules/sen-funding/` |
| **Staff Connectors** | Cross-module (HR + all) | Specced | `connector_*`, `staff_connectors` | `docs/STAFF_CONNECTORS.md` |
| **Ed AI Chatbot** | Floating panel | Built | `ed_*` | `packages/ed-agents/` |
| **Surveys** | `/dashboard/surveys` | Built | `surveys`, `survey_*` | — |
| **Risk Register** | `/dashboard/risk` | Built | `risks`, `risk_*` | — |
| **Document Production** | `/dashboard/documents` | Built | `document_*` | — |
| **SDP** | `/dashboard/sdp` | Built | `sdp_*` | — |
| **SEF** | `/dashboard/sef` | Built | `sef_*` | — |

---

## Connection Map

### Visual Overview

```
                                    ┌──────────────────┐
                                    │  STAFF CONNECTORS │
                                    │  (Responsibility  │
                                    │   Engine)         │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┤────────────────────────────┐
                    │                        │                            │
          ┌─────────▼─────────┐    ┌─────────▼─────────┐      ┌─────────▼─────────┐
          │   HR / PEOPLE     │    │    COMPLIANCE      │      │    GOVERNANCE      │
          │                   │    │                    │      │                    │
          │ Staff Directory   │    │ Statutory roles    │      │ Governor links     │
          │ Payroll rates     │    │ Training tracking  │      │ Board reporting    │
          │ Absence tracking  │    │ SCR                │      │ Meeting minutes    │
          └───────┬───────────┘    └────────┬───────────┘      └────────┬───────────┘
                  │                         │                           │
     ┌────────────┼──────────┐              │                           │
     │            │          │              │                           │
┌────▼────┐ ┌────▼────┐ ┌───▼──────┐       │                           │
│ SEND    │ │ ESTATES │ │ FINANCE  │       │                           │
│ HUB     │ │         │ │          │       │                           │
│         │ │ Assets  │ │ Budget   │       │                           │
│ SEN reg │ │ Compli- │ │ CFR codes│       │                           │
│ EHCPs   │ │ ance    │ │ ICFP     │       │                           │
│ Funding │ │ Tasks   │ │ Contracts│       │                           │
└────┬────┘ └────┬────┘ └────┬─────┘       │                           │
     │           │           │              │                           │
     └─────┬─────┴───────────┘              │                           │
           │                                │                           │
     ┌─────▼──────────┐              ┌──────▼───────┐            ┌─────▼──────┐
     │   MEETINGS     │              │  ACTIONS HUB │            │  DOCUMENTS │
     │                │              │              │            │            │
     │ Templates per  │──────────────▶ Post-meeting │            │ Templates  │
     │ module         │   actions     │ actions      │            │ Generation │
     │ SEND, HR, Gov  │              │ EEF backing  │            │ Newsletters│
     └────────────────┘              └──────┬───────┘            └────────────┘
                                            │
                    ┌───────────────────────┤───────────────────┐
                    │                       │                   │
          ┌─────────▼─────────┐   ┌─────────▼──────┐   ┌───────▼──────┐
          │  INTELLIGENCE     │   │   SEF          │   │    SDP       │
          │  ENGINE           │   │                │   │              │
          │                   │   │ Living SEF     │   │ Priorities   │
          │ DfE data          │   │ Auto-populated │   │ Milestones   │
          │ Cohort tracking   │   │ from evidence  │   │ Linked to    │
          │ EEF matching      │   │                │   │ actions      │
          │ Pupil assessment  │   └────────────────┘   └──────────────┘
          └───────────────────┘

                    ┌───────────────────────────────────────────┐
                    │                ED AI CHATBOT               │
                    │                                           │
                    │  Sits above all modules. Routes to 12     │
                    │  specialist agents. Calls 43+ skills.     │
                    │  Accesses connector data for "who is..."  │
                    │  questions. Proactive task reminders.      │
                    └───────────────────────────────────────────┘
```

---

## Detailed Connection Registry

Each entry below documents a specific data flow between two modules. When modifying either module, check this registry to ensure the connection is maintained.

### Connection ID: C001 — HR → SEND Hub (Staff Allocation)

| Property | Value |
|----------|-------|
| **From** | HR / Staff Directory |
| **To** | SEND Hub |
| **Data Flow** | Staff records (ID, name, role, hourly rate) → SEND provision costing |
| **Shared Table** | `staff_directory` (read by SEND) |
| **Trigger** | SENCO assigns TA to EHCP pupil in SEND Hub |
| **Effect** | `send_provision_costs.staff_id` links to `staff_directory.id`; annual cost auto-calculated from payroll rate |
| **Reverse Flow** | Staff leaving/absent → SEND Hub alerts SENCO about affected pupils |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §4 |

### Connection ID: C002 — SEND Hub → Finance (Funding)

| Property | Value |
|----------|-------|
| **From** | SEND Hub |
| **To** | Finance Module |
| **Data Flow** | SEND funding allocations (Element 3 top-up, LA bands) → budget engine income lines |
| **Shared Table** | `send_funding_allocations` (written by SEND, read by Finance) |
| **Shared View** | `send_budget_position` (consumed by finance dashboard) |
| **CFR Mapping** | Income: I03 (SEN funding); Expenditure: E03 (support staff), E26 (bought-in services) |
| **Trigger** | SENCO adds pupil to SEN register with LA band |
| **Effect** | Finance sees new income line under CFR I03; provision costs appear under E03 |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §1 |

### Connection ID: C003 — Meetings → All Modules (Templates)

| Property | Value |
|----------|-------|
| **From** | Meetings Module |
| **To** | HR, SEND, Governance, Estates, Safeguarding, T&L |
| **Data Flow** | Meeting templates filtered by module; meeting outcomes create actions |
| **Shared Table** | `meeting_templates` (category field maps to modules) |
| **Template Categories** | `hr`, `send`, `governance`, `safeguarding`, `operational`, `teaching_learning`, `slt_leadership`, `general`, `custom` |
| **Trigger** | User navigates to meetings from a module context |
| **Effect** | Only templates for that module are shown |
| **Subscription Gating** | Template categories visible based on subscription plan |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §2 |

### Connection ID: C004 — Meetings → SEND Hub (Annual Review Flow)

| Property | Value |
|----------|-------|
| **From** | Meetings Module (EHCP Annual Review template) |
| **To** | SEND Hub |
| **Data Flow** | Completed meeting → minutes filed as evidence → actions created → LA deadline tracking |
| **Triggers** | Meeting marked complete |
| **Effects** | 1. Minutes auto-filed to `send_evidence_files`; 2. Actions created in Actions Hub linked to pupil; 3. If recommendation="amend", workflow created with 4-week LA deadline; 4. If band change, `send_funding_allocations` updated; 5. Next review auto-scheduled (12 months / 6 months for under-5s) |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §3 |

### Connection ID: C005 — Staff Connectors → HR (Profile Extension)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | HR / Staff Directory |
| **Data Flow** | Connector assignments display on staff profiles; leaving staff triggers impact analysis |
| **Shared Table** | `staff_connectors.staff_id` → `staff_directory.id` |
| **Trigger** | Connector assigned/removed; staff end_date set |
| **Effect** | Staff profile shows all connectors; leaving triggers `connector_change_log` and impact report |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5, §6 |

### Connection ID: C006 — Staff Connectors → Estates (Fire/H&S)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | Estates Module |
| **Connector Types** | Fire Marshal, H&S Lead, Caretaker Lead, Key Holder |
| **Data Flow** | Connector holders surface on estates dashboard; fire marshal tasks auto-generated |
| **Trigger** | Fire marshal connector assigned with building scope |
| **Effect** | Estates shows fire marshal per zone; recurring tasks created (weekly alarm test, termly drill) |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5.1, §8 |

### Connection ID: C007 — Staff Connectors → SEND Hub (SENCO/LAC)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | SEND Hub |
| **Connector Types** | SENCO, Deputy SENCO, Designated Teacher (LAC), Mental Health Lead |
| **Data Flow** | SENCO connector holder is the primary SEND contact; EHCP pupils linked to SENCO |
| **Trigger** | SENCO connector assigned |
| **Effect** | SEND Hub shows SENCO name; meeting templates auto-populate SENCO as chair; EHCP review invites include SENCO |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5.1 |

### Connection ID: C008 — Staff Connectors → Compliance (Statutory Roles)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | Compliance Module |
| **Data Flow** | All statutory connectors feed into compliance dashboard; training expiry creates compliance alerts |
| **Shared View** | `connector_compliance_status` |
| **Trigger** | Any statutory connector change; training expiry approaching |
| **Effect** | Compliance dashboard shows statutory role coverage; non-compliance flagged as high-priority |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5.1, §7 |

### Connection ID: C009 — Staff Connectors → Governance (Link Roles)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | Governance Module |
| **Data Flow** | Governor link roles reference staff connector holders (e.g. Safeguarding Governor links to DSL) |
| **Trigger** | Governor assigned as link governor for safeguarding → system shows current DSL name |
| **Effect** | Governance portal shows "Safeguarding Governor: Rev. Thompson → DSL: Mrs Jones" |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5.1 |

### Connection ID: C010 — Staff Connectors → Meetings (Auto-Invite)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors |
| **To** | Meetings Module |
| **Data Flow** | Meeting templates specify required connector types; system suggests attendees from connector holders |
| **Trigger** | New meeting created from SEND template → SENCO auto-suggested as chair |
| **Effect** | Meeting invite pre-populated with connector holders for that meeting type |
| **Spec** | `docs/STAFF_CONNECTORS.md` §5.1 |

### Connection ID: C011 — Staff Connectors → Homepage (Task Routing)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors (auto-tasks) |
| **To** | Staff Homepage |
| **Data Flow** | Connector tasks + module tasks routed to connector holder → appear on homepage |
| **Trigger** | Connector assigned → auto-tasks created; module task created referencing connector type |
| **Effect** | Homepage "Your Responsibilities" section shows all tasks grouped by connector |
| **Spec** | `docs/STAFF_CONNECTORS.md` §4 |

### Connection ID: C012 — Staff Connectors → Finance (Contract Management)

| Property | Value |
|----------|-------|
| **From** | Staff Connectors (Contract Manager type) |
| **To** | Finance Module |
| **Data Flow** | Contract manager connector links to contract record with financial value, review schedule |
| **Shared Table** | `contract_connector_links` |
| **Trigger** | Contract manager connector assigned |
| **Effect** | Review meetings auto-schedule; renewal deadlines create alerts; contract value links to budget |
| **Spec** | `docs/STAFF_CONNECTORS.md` §9 |

### Connection ID: C013 — Intelligence Engine → SEND Hub (Pupil Data)

| Property | Value |
|----------|-------|
| **From** | Intelligence Engine |
| **To** | SEND Hub |
| **Data Flow** | Pupil assessment analysis (gaps by SEN status) → SEND Hub intervention recommendations |
| **Shared Tables** | `pupil_assessments_pseudo`, `pupil_analysis_insights` |
| **Trigger** | Assessment data uploaded; intelligence analysis run |
| **Effect** | SEND Hub shows cohort-level attainment gaps for SEN pupils; EEF strategies recommended |
| **Spec** | — |

### Connection ID: C014 — Intelligence Engine → SEF/SDP

| Property | Value |
|----------|-------|
| **From** | Intelligence Engine |
| **To** | SEF (Self-Evaluation) and SDP (School Development Plan) |
| **Data Flow** | Analysis findings auto-populate SEF sections; priorities feed into SDP |
| **Trigger** | Intelligence analysis completed |
| **Effect** | Living SEF updated with latest data; SDP priorities linked to evidence |
| **Spec** | — |

### Connection ID: C015 — SEND Hub → Governance (Governor Report)

| Property | Value |
|----------|-------|
| **From** | SEND Hub |
| **To** | Governance Module |
| **Data Flow** | Anonymised SEND statistics → governor SEND report |
| **Trigger** | Governor meeting scheduled; SEND governor requests report |
| **Effect** | Auto-generated: SEN register count, EHCP compliance, funding position, concerns |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §5 |

### Connection ID: C016 — SEND Hub → Estates (Accessibility)

| Property | Value |
|----------|-------|
| **From** | SEND Hub |
| **To** | Estates Module |
| **Data Flow** | Specialist facilities and equipment tracked in estates; accessibility needs informed by SEND |
| **Trigger** | SEND pupil requires physical adaptation |
| **Effect** | Estates creates accessibility task; sensory room / equipment in asset register |
| **Spec** | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` §6 |

### Connection ID: C017 — Actions Hub → All Modules

| Property | Value |
|----------|-------|
| **From** | Multiple modules |
| **To** | Actions Hub |
| **Data Flow** | Post-meeting actions, compliance tasks, SEND actions, estates work orders → unified action tracker |
| **Shared Table** | `actions` with `source_module` field |
| **Trigger** | Action created from any module |
| **Effect** | Appears in Actions Hub with module tag; EEF research backing applied where relevant |
| **Spec** | — |

### Connection ID: C018 — Ed AI → All Modules (Skills)

| Property | Value |
|----------|-------|
| **From** | Ed AI Chatbot |
| **To** | All modules via `/api/skills/invoke` |
| **Data Flow** | User questions → intent classification → specialist agent → skill execution → data read/write |
| **Skill Groups** | Staff (6), Actions (6), Estates (8), Estates Spatial (6), Intelligence (6), Risk (6), Document (7), Connectors (6 planned) |
| **Trigger** | User asks Ed a question or requests an action |
| **Effect** | Ed reads/writes data across any module; surfaces connector data for "who is..." queries |
| **Spec** | `packages/ed-agents/src/`, `apps/platform/src/lib/skills/` |

### Connection ID: C019 — Risk Register → Multiple Modules

| Property | Value |
|----------|-------|
| **From** | Risk Register |
| **To** | Estates, Compliance, HR, Governance |
| **Data Flow** | Risks tagged by module; mitigations link to actions; governance receives risk summary |
| **Trigger** | Risk created with module tag |
| **Effect** | Module dashboards show relevant risks; governor risk report auto-generated |
| **Spec** | — |

### Connection ID: C020 — Document Production → All Modules

| Property | Value |
|----------|-------|
| **From** | Document Production |
| **To** | All modules |
| **Data Flow** | Templates pull data from modules; generated documents stored centrally |
| **Trigger** | User generates a document (letter, report, newsletter) |
| **Effect** | Template variables populated from module data (staff names, pupil counts, dates) |
| **Spec** | — |

---

## Shared Data Patterns

### Pattern 1: Staff Directory as Hub

```
staff_directory
    ├── staff_connectors (what they're responsible for)
    ├── send_provision_costs (SEND pupils they support)
    ├── meeting attendees (meetings they attend)
    ├── actions (actions assigned to them)
    ├── connector_tasks (recurring tasks from responsibilities)
    ├── governance_governors (if they're a governor)
    └── estates tasks (if they're a key holder / fire marshal)
```

**Rule**: Staff Directory is the single source of truth for people. Every module references `staff_directory.id`, never duplicates staff data.

### Pattern 2: CFR Codes as Financial Language

```
Every financial transaction maps to a CFR code:
    I01-I18 = Income codes
    E01-E32 = Expenditure codes

Modules write to finance using CFR codes:
    SEND Hub → I03 (SEN funding income), E03 (support staff costs)
    HR → E01 (teaching staff), E02 (supply), E03 (support staff)
    Estates → E04 (premises staff), E12-E18 (premises costs)
    Governance → E28 (governance costs)
```

**Rule**: Any module that has financial impact must tag transactions with CFR codes so Finance can aggregate.

### Pattern 3: Module-Gated Shared Services

```
Meeting templates:      One system, templates filtered by module subscription
Connector types:        One registry, connectors surface in relevant modules
Actions:                One hub, actions tagged with source module
Documents:              One production system, templates per module
Risk register:          One register, risks tagged by module
```

**Rule**: Build once, filter by module. Never duplicate infrastructure.

### Pattern 4: Evidence as Currency

```
Evidence flows into multiple consumers:
    Ofsted Readiness ← evidence mapped to framework requirements
    SEF ← evidence populates self-evaluation
    SDP ← evidence justifies priorities
    SEND Hub ← evidence supports EHCP applications
    Actions Hub ← evidence validates action completion
    Governance ← evidence in governor reports
```

**Rule**: Evidence is created once and consumed by many. The `evidence` table is a platform-wide asset.

---

## Merge Conflict Prevention

### When Working on Module X, Check These Connections

| If you're changing... | Check these connections | Potential conflicts |
|----------------------|------------------------|---------------------|
| Staff Directory schema | C001, C005, Pattern 1 | SEND provision costs, connector assignments |
| Meeting templates | C003, C004, C010 | Template categories, auto-invite logic |
| Connector types | C005-C012 | Every module that surfaces connectors |
| SEND Hub tables | C001, C002, C004, C013, C015, C016 | Finance views, meeting flows, intelligence |
| Finance / budget engine | C002, C012, Pattern 2 | SEND budget position view, CFR mappings |
| Actions Hub | C004, C017 | Post-meeting actions from any module |
| Compliance module | C008, C019 | Connector compliance status, risk register |
| Ed AI skills | C018 | Any module whose skills are being modified |
| Intelligence Engine | C013, C014 | SEND Hub pupil data, SEF/SDP updates |

### Safe Merge Checklist

Before merging any branch to main:

1. **Check shared tables**: Does your branch modify any table referenced by another module?
2. **Check shared views**: Does your branch modify any SQL view consumed by another module?
3. **Check API contracts**: Does your branch change any API response shape used by other modules?
4. **Check connector types**: Does your branch add/modify connector type definitions?
5. **Check meeting templates**: Does your branch add/modify meeting template categories?
6. **Check CFR mappings**: Does your branch add/modify financial transactions?
7. **Run typecheck**: `npm run typecheck` catches interface mismatches
8. **Run tests**: `npm run test` catches integration failures

---

## Subscription Matrix

Which modules are available on each plan:

| Module | Free | Schools Basic | Schools Standard | Schools Premium | Trusts |
|--------|------|--------------|-----------------|-----------------|--------|
| School Improvement | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ofsted Readiness | — | ✅ | ✅ | ✅ | ✅ |
| SIAMS | — | — | ✅ (if church) | ✅ | ✅ |
| Actions Hub | ✅ (limited) | ✅ | ✅ | ✅ | ✅ |
| HR / People | — | ✅ | ✅ | ✅ | ✅ |
| Meetings | — | HR only | HR + SEND | All | All |
| Estates Compliance | — | — | ✅ | ✅ | ✅ |
| Governance | — | — | — | ✅ | ✅ |
| Compliance | — | — | ✅ | ✅ | ✅ |
| Intelligence Engine | — | — | ✅ | ✅ | ✅ |
| Finance | — | — | — | ✅ | ✅ |
| SEND Hub | — | — | ✅ | ✅ | ✅ |
| Staff Connectors | — | Basic | Standard | Full | Full + MAT |
| Surveys | — | — | ✅ | ✅ | ✅ |
| Risk Register | — | — | — | ✅ | ✅ |
| Document Production | — | ✅ | ✅ | ✅ | ✅ |
| SDP | — | — | ✅ | ✅ | ✅ |
| SEF | — | — | ✅ | ✅ | ✅ |
| Ed AI Chatbot | General only | + IT | + all except proc/gov | All | All |

---

## Ed AI Connector Skills (Planned)

When Staff Connectors are built, Ed gains 6 new skills:

| Skill | Example Prompt | Data Source |
|-------|---------------|-------------|
| `list_my_connectors` | "What am I responsible for?" | `staff_connector_summary` |
| `get_connector_holder` | "Who's the DSL?" | `staff_connectors` + `connector_types` |
| `check_compliance` | "Are we compliant on first aid?" | `connector_compliance_status` |
| `get_leaving_impact` | "What if Mrs Jones leaves?" | Impact analysis query |
| `get_overdue_tasks` | "What's overdue?" | `connector_tasks` |
| `schedule_task` | "Schedule fire drill for Thursday" | `connector_tasks` + calendar |

These add to the existing 43+ skills, bringing Ed to 49+ callable functions.

---

## File Location Reference

| What | Where |
|------|-------|
| This document | `docs/CROSS_MODULE_ARCHITECTURE.md` |
| Staff Connectors spec | `docs/STAFF_CONNECTORS.md` |
| SEND Hub product spec | `docs/modules/sen-funding/PRODUCT_SPEC.md` |
| SEND cross-module integration | `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` |
| SEND evidence ecosystem | `docs/modules/sen-funding/EVIDENCE_ECOSYSTEM.md` |
| SEND research | `docs/modules/sen-funding/RESEARCH.md` |
| Design system | `docs/DESIGN_SYSTEM.md` |
| Commercial architecture | `docs/COMMERCIAL_ARCHITECTURE.md` |
| Module registry (code) | `apps/platform/src/lib/modules/registry.ts` |
| Skills registry (code) | `apps/platform/src/lib/skills/school-skills-registry.ts` |
| Ed agents (code) | `packages/ed-agents/src/` |
| Meeting types (code) | `apps/platform/src/lib/meetings/types.ts` |
