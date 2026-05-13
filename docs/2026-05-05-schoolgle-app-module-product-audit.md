# Schoolgle App And Module Product Audit

**Date:** 2026-05-05  
**Purpose:** Friday sales-readiness review of every module and registered app in the platform.  
**Scope:** `apps/platform/src/lib/modules/registry.ts`, live dashboard routes, API route footprint, Supabase migrations, connector/product memory docs, and cross-module architecture notes.

## Executive Summary

Schoolgle has a strong product core, but the live registry exposes too much at once. The current registry lists **22 modules** and **97 apps**. Many are real or near-real products, but several are thin wrappers, duplicate entries, prototype-heavy screens, or products that should be folded into a stronger parent workflow before presenting to schools.

The Friday pitch should not try to sell 97 apps. It should sell **one connected school operating system** with a small number of clear product pillars:

1. **Inspection and improvement:** Ofsted Readiness, SIAMS Readiness, SEF, SDP, evidence, tasks, Trust Assessor.
2. **Compliance and policies:** Policy Manager, SOPs, training, SCR, GDPR, complaints, consent, website compliance.
3. **Estates and premises:** Assets, contractors, compliance checks, maintenance, condition survey, energy, lettings.
4. **HR and people:** Staff directory, training records, sickness, cover, performance, meetings, staff responsibilities.
5. **Documents and tasks:** Generated documents, unified task engine, approvals, audit trail.
6. **Data and intelligence:** School Intelligence, Canvas ingest, DfE/MIS imports, reporting, evidence signals.

The main product issue is not lack of code. It is **noise, duplication, and inconsistent app maturity**. A clean sales product should hide or consolidate lower-value apps and turn the strongest pages into a guided demo.

## Key Findings

### 1. The Registry Is Too Broad For Sales

The live module/app registry starts at `apps/platform/src/lib/modules/registry.ts` and defines 22 modules plus 97 app entries. This is useful internally, but too noisy for a school buyer. Several modules are product categories, while others are single apps, and one module (`canvas`) has no app assigned to it even though Canvas appears under `school-intelligence`.

**Recommendation:** Keep the internal registry, but create a pilot/sales navigation layer with 6 product pillars and hide low-confidence apps unless explicitly enabled.

### 2. The Connector Map Is Cleaner Than The Navigation

The connector source-of-truth map only defines a focused set of connected app scopes: Policy Manager, Ofsted Readiness, SIAMS Readiness, Trust Assessor, School Intelligence, Compliance, Estates, and Governance. That is a stronger product model than the full registry.

**Recommendation:** Use the connector map as the mental model for sales. Apps outside that map should be presented as "Schoolgle-managed operational logs" or "add-ons", not equal flagship products.

### 3. Several Apps Are Real But Misgraded By Page Size

Some routes are short because they delegate into strong components. Examples include Ofsted, Tasks, Compliance Training, Lesson Studio, and Compliance sub-apps. These should not be treated as stubs just because the page file is small.

**Recommendation:** Judge app fitness by route plus component plus API plus database, not by route file only.

### 4. There Are Clear Duplicates And Conflicts

Known conflicts:

| Conflict | Current State | Product Decision |
| --- | --- | --- |
| `estates-audit` and `governance-estates-assurance` | Both point to `/dashboard/estates/audit` | Keep one app. Position as Estates Assurance under Estates; expose governance report inside it. |
| `comms-hub` and `video-rooms` | Both point to `/dashboard/comms` | Keep Comms Hub; make Video Rooms a tab/card, not separate nav app. |
| `canvas` module and `canvas-home` app | Module exists with no apps; Canvas app is under `school-intelligence` | Remove or hide standalone Canvas module; keep Canvas inside School Intelligence. |
| Website Compliance entries | Exists under Website and Compliance/Ofsted style routes | Keep one checker and cross-link it from Compliance, Website, and Ofsted. |
| Action Plan, Actions Hub, SDP, Unified Tasks | Overlapping improvement/task concepts | Keep Unified Tasks as task engine; SDP is strategic plan; Action Plan should be retired or folded into SDP/Tasks. |
| Trust Analysis and Trust Assessor | Adjacent products with overlapping trust data | Keep Trust Assessor as the structured sellable product; Trust Analysis becomes an internal analysis/upload tool. |
| Lesson Studio and Lesson Studio (Teacher) | Two route entries for same product family | Keep Lesson Studio as one product with Headteacher/Teacher views. |

### 5. The Strongest Cross-Module Products Already Exist

The cross-module document notes identify Documents, Unified Tasks, and Ed AI as the strongest existing connective tissue. Documents pulls from staff, organisation, sickness absence, contractors, and meetings. Unified Tasks pulls from actions, estates, compliance, training expiry, and risk, but has known fragility around summary stats and pagination.

**Recommendation:** For Friday, show "everything becomes a task or evidence trail" as the core product story. After Friday, fix the Unified Tasks summary and pagination issues before relying on it heavily in demos.

## Recommended Friday Demo Shape

### Demo 1: Inspection Readiness Loop

Show: Ofsted Readiness -> evidence source card -> website/compliance check -> findings -> task assignment -> dashboard task.  
Message: "Schoolgle does not just store evidence. It checks it, explains what is missing, and turns gaps into accountable tasks."

### Demo 2: Compliance Operating Log

Show: Policies/SOPs in progress, Training Checker, SCR, GDPR, Complaints, Consent.  
Message: "Some school products do not need magic. They need one place to log, renew, evidence, and report."

### Demo 3: Estates Compliance

Show: Estates Compliance, assets, contractors, checks, evidence, condition survey, maintenance tickets.  
Message: "Premises compliance moves from paper and memory into scheduled, evidenced workflows."

### Demo 4: Staff And Responsibilities

Show: Staff Directory, training records, staff connectors/responsibilities, HR meetings/sickness if stable.  
Message: "The system knows who is responsible, what training they hold, and what expires next."

### Demo 5: Documents And Tasks

Show: Documents, templates, generated records, Unified Tasks.  
Message: "Every module can produce a record, assign work, and keep an audit trail."

## Module Verdicts

| Module | Registry Apps | Current Fitness | Sellability | Product Decision |
| --- | ---: | --- | --- | --- |
| Governance | 3 | Partial. Governance portal and visits exist, but visit planning looks demo-heavy and estates assurance duplicates Estates Audit. | Medium | Keep, but sell as board evidence/reporting and policy oversight. Do not over-demo unless data is seeded. |
| Risk Register | 5 | Strong. Register, decisions, strategic plan, ICFP and trust overview all have substantial UI/API footprint. | High | Keep. This is a good leadership product, but align Strategic Plan with SDP to avoid duplication. |
| Inspection Readiness | 14 | Mixed but strategically central. Ofsted/SEF/evidence/data validation are strong; several improvement apps overlap or are prototype-heavy. | High | Keep as flagship, but slim navigation and fold Action Plan into Tasks/SDP. |
| Teaching & Learning | 8 | Lesson Studio is strong via components/API; surrounding planner/resource/assessment pages are thin. | Medium | Sell Lesson Studio only if needed. Hide thin companion apps until they are tabs in Lesson Studio. |
| Estates | 10 | Strong operational backend. Compliance, maintenance, energy, condition survey, lettings are meaningful; floor plan/asset tags need finishing. | High | Keep as flagship operations product. Consolidate old `/estate`, `/estates`, and `/estates-compliance` language. |
| Compliance | 16 | Strong component/API footprint but many route files are thin wrappers. User is already developing Policies/SOPs/Ofsted. | High | Keep as flagship. Turn sub-apps into consistent log/checker pages. |
| Finance | 5 | Backend/import paths exist; UI has demo-heavy budget pages and one missing page. | Medium | Hide advanced finance from Friday unless using payroll/deal finder. Build simple budget log MVP later. |
| Schoolgle Business | 1 | Incident Hub is substantial and API-backed. | Medium | Keep as "Incident Hub", but do not create a whole module around one app in sales nav. |
| HR & People | 7 | Staff Directory and meetings are functional; performance/cover are demo-heavy; staff connectors looks substantial but static. | High | Keep. Build practical staff logs first: training, sickness, cover, connectors. |
| Safeguarding | 1 | Large prototype/API-backed dashboard. Sensitive domain, needs safety review before sales. | Medium | Keep internal/beta. Avoid selling as full CPOMS replacement until audit, permissions, and data safety are proven. |
| School Intelligence | 1 | Canvas app route is thin but backed by broader intelligence architecture. | High | Sell as data/intelligence layer, not as a standalone Canvas UI until polished. |
| Attendance | 1 | Substantial page and APIs, but demo-heavy. | Medium | Keep as simple attendance/intervention log MVP, not a MIS replacement. |
| SEND | 1 | Substantial page and APIs, but demo-heavy and already specced in depth. | Medium | Keep as SEND log/provision MVP. Avoid claiming full SEND platform until evidence packs/funding flow are complete. |
| Behaviour | 1 | Substantial page and API, but demo-heavy. | Medium | Keep as incident/exclusion log MVP. Integrate with safeguarding later. |
| Communications | 8 | Strong operational footprint: notices, emergency broadcast, drills, displays, analytics. Some route duplication. | Medium | Keep Emergency Broadcast and Notices. Fold Video Rooms into Comms Hub. |
| Calendar | 1 | Large, API-backed, demo-heavy. | Medium | Keep as operational utility. Good for simple term dates/events/parents evening. |
| Surveys & Feedback | 3 | Survey creation/templates are functional; analytics route is missing. | Medium | Keep Surveys. Hide analytics until page exists. |
| School Website | 6 | Pages/design/news/compliance are API-backed; media library is static. | Medium | Keep as website/compliance add-on. Avoid over-selling as full CMS until media/publish flow is proven. |
| Connectors | 2 | Static hub and Canva templates. Connector backend exists elsewhere. | High as infrastructure, Low as app | Present connector setup as infrastructure, not as a product module. |
| Toolbox | 2 | Mostly static/thin. | Low | Hide from Friday nav. Use internally for mini-app discovery only. |
| Document Management | 1 | Functional route/API-backed. Strong cross-module value. | High | Keep and demo. Documents are one of the strongest connective products. |
| Canvas | 0 | Module exists with no direct apps. | Low as module | Remove/hide standalone module. Keep Canvas under School Intelligence. |

## App-By-App Audit

Status key:

- **Ship/Demo:** Worth showing now with seed data or live demo flow.
- **MVP Build:** Worth doing, but make it a simple log/checker first.
- **Consolidate:** Keep capability but move it under a stronger parent app.
- **Hide/Defer:** Do not show Friday unless specifically requested.
- **In Progress:** User is currently developing or has asked not to touch deeply.

| Module | App | Route | Current Evidence | Decision | Next Step |
| --- | --- | --- | --- | --- | --- |
| Governance | Governance Portal | `/dashboard/governance` | Route and governance API/migration exist; page is mostly overview/static. | MVP Build | Make it a board/governor register plus meeting/visit summary. |
| Governance | Visit Planning | `/dashboard/governance/visits` | Large UI, no direct fetch in page, demo markers. | MVP Build | Persist visits, owners, outcomes and linked evidence/tasks. |
| Governance | Estates Assurance | `/dashboard/estates/audit` | Duplicate route with Estates GEMS Audit. | Consolidate | Remove from main governance nav; link governance report from Estates Audit. |
| Risk | Risk Register | `/dashboard/risk` | Substantial route and risk APIs/skills exist. | Ship/Demo | Seed a clean risk register and show scoring/mitigations. |
| Risk | Risk Decisions | `/dashboard/risk/decisions` | API-backed decisions page. | Ship/Demo | Position as board decision audit log. |
| Risk | Strategic Plan | `/dashboard/risk/strategic-plan` | API-backed strategic plan. | Consolidate | Align with SDP and Estate Strategy naming. |
| Risk | ICFP | `/dashboard/risk/icfp` | API-backed ICFP route. | Ship/Demo | Keep for trust/finance audiences; label as scenario analysis. |
| Risk | Trust Overview | `/dashboard/risk/trust` | Static/substantial trust overview. | MVP Build | Feed from real risk/Trust Assessor data or hide for single-school demos. |
| Inspection Readiness | Ofsted Readiness | `/dashboard/ofsted-readiness` | Strong component-backed app with findings/evidence/website/task integration. | In Progress | Keep developing; use as flagship if stable. |
| Inspection Readiness | SEF Builder | `/dashboard/sef` | API-backed generation/update route. | Ship/Demo | Show as output of evidence and inspection readiness. |
| Inspection Readiness | SDP Builder | `/dashboard/sdp` | Substantial static page with SDP backend/migrations. | MVP Build | Connect priorities to tasks and SEF findings. |
| Inspection Readiness | Action Plan | `/dashboard/action-plan` | Static task table style UI. | Consolidate | Fold into Unified Tasks and SDP. |
| Inspection Readiness | SIAMS Readiness | `/dashboard/siams` | Component-backed route and SIAMS API/migration exist. | MVP Build | Mirror Ofsted loop but simpler for church schools. |
| Inspection Readiness | Tasks | `/dashboard/tasks` | Component-backed UnifiedTaskList/TaskModal and task APIs. | Ship/Demo | Fix summary/pagination fragility before heavy use. |
| Inspection Readiness | My Evidence | `/evidence` | API-backed evidence list. | Ship/Demo | Make it the shared evidence vault across Ofsted/SIAMS/compliance. |
| Inspection Readiness | Audit Timeline | `/timeline` | API-backed event feed. | Ship/Demo | Use as audit trail proof in demos. |
| Inspection Readiness | Data Validation | `/dashboard/data-validation` | API-backed validation queue. | Ship/Demo | Position as "human approves imports before data flows." |
| Inspection Readiness | Trust Analysis | `/dashboard/school-improvement/trust-analysis` | AI canvas/upload style tool. | Consolidate | Make internal analysis engine inside Trust Assessor. |
| Inspection Readiness | Trust Assessor | `/dashboard/school-improvement/trust-assessor` | Very large route, many APIs, demo-heavy, user in progress. | In Progress | Keep as structured trust product; remove demo noise before sales. |
| Inspection Readiness | Pupil Premium | `/dashboard/pupil-premium` | Large prototype, no clear API fetch. | MVP Build | Simple strategy/spend/impact log first. |
| Inspection Readiness | Sports Premium | `/dashboard/sports-premium` | Large prototype, API touchpoints, demo markers. | MVP Build | Simple spend/impact statement tracker first. |
| Inspection Readiness | Admissions | `/dashboard/admissions` | Large route, API-backed, demo-heavy. | Hide/Defer | Not core Friday product unless a school explicitly asks. |
| Teaching & Learning | Lesson Studio | `/dashboard/teaching-learning/lesson-studio` | Thin route but large component/API/migration footprint. | Ship/Demo selectively | Show only if lesson planning is a sales theme. |
| Teaching & Learning | Lesson Studio (Teacher) | `/dashboard/lesson-studio` | Alternate route to same product family. | Consolidate | One Lesson Studio app with role-aware views. |
| Teaching & Learning | Lesson Planning | `/dashboard/teaching-learning/lesson-planning` | Thin placeholder-style page. | Consolidate | Fold into Lesson Studio. |
| Teaching & Learning | Resource Generator | `/dashboard/teaching-learning/resource-generator` | Thin placeholder-style page. | Consolidate | Fold into Lesson Studio resources tab. |
| Teaching & Learning | Assessment Support | `/dashboard/teaching-learning/assessment-support` | Thin wrapper. | Consolidate | Fold into Lesson Studio assessment tab. |
| Teaching & Learning | Parent Comms | `/dashboard/teaching-learning/parent-comms` | Thin page. | Consolidate | Move to Communications/Documents. |
| Teaching & Learning | Intervention Notes | `/dashboard/teaching-learning/intervention-notes` | Thin page. | Consolidate | Move under Attendance/SEND/School Intelligence interventions. |
| Teaching & Learning | Sim Studio | `/sim-studio` | Substantial standalone simulation UI, static. | Hide/Defer | Nice add-on, not Friday core. |
| Toolbox | Class Builder | `/dashboard/toolbox/class-builder` | Thin route but class builder API/migration exists. | MVP Build | Keep as mini-app after it has a complete flow. |
| Toolbox | Toolbox | `/dashboard/toolbox` | Static store-style page. | Hide/Defer | Hide from sales nav. |
| Documents | Document Management | `/dashboard/documents` | API-backed documents/templates. | Ship/Demo | Show templates, generated records, and data merge. |
| Business | Incident Hub | `/dashboard/incidents` | Strong API-backed incident register. | Ship/Demo selectively | Present as cross-module incident log, not separate "Business" suite. |
| Compliance | Compliance Hub | `/dashboard/compliance` | Thin route but component-backed. | In Progress | Make it the front door for Policies/SOPs/Training/SCR/GDPR. |
| Compliance | Policies | `/dashboard/compliance/policies` | User developing; API and component footprint exists. | In Progress | Use connector source-of-truth model; avoid copying policies as canonical. |
| Compliance | Document Builder | `/dashboard/compliance/docs` | Static/compliance document route. | Consolidate | Fold into Document Management. |
| Compliance | Training Checker | `/dashboard/compliance/training` | Component-backed TrainingDashboard and APIs. | Ship/Demo | Build simple staff training log with renewal rules and expiry tasks. |
| Compliance | Information Governance | `/dashboard/compliance/gdpr` | Component-backed GDPR dashboard/APIs. | MVP Build | Keep DPIA/SAR/breach/FOI logs simple and auditable. |
| Compliance | Compliance Tasks | `/dashboard/compliance/tasks` | Component-backed ComplianceTaskList and APIs. | Consolidate | Surface through Unified Tasks, keep module filtered view. |
| Compliance | Single Central Record | `/dashboard/compliance/scr` | Component-backed SCRDashboard and APIs. | MVP Build | Practical SCR log with renewal/missing-check flags. |
| Compliance | Complaints Tracker | `/dashboard/compliance/complaints` | Component-backed ComplaintsTracker/API. | MVP Build | Simple 3-stage complaints log and deadline reminders. |
| Compliance | Low-Level Concerns | `/dashboard/compliance/concerns` | Component-backed confidential log/API. | MVP Build | Keep restricted to DSL/headteacher; do safety review. |
| Compliance | Consent Manager | `/dashboard/compliance/consent` | Component-backed consent manager/API. | MVP Build | Simple pupil consent log and expiry/report export. |
| Compliance | FOI Tracker | `/dashboard/compliance/foi` | Component-backed but pilot hidden. | Hide/Defer | Keep hidden unless compliance buyer asks. |
| Compliance | DPO Service | `/dashboard/compliance/dpo` | Component-backed DPO panel/API. | Hide/Defer | Service proposition, not core platform demo. |
| Compliance | Website Compliance | `/dashboard/website-compliance` | API-backed scanner. | Ship/Demo | Consolidate with Website/Ofsted compliance checker. |
| Compliance | Workflows | `/dashboard/workflows` | Static workflow hub. | Consolidate | Make it internal engine behind SOPs/tasks. |
| Compliance | Procedures (SOPs) | `/dashboard/sops` | Large route, user developing. | In Progress | Strong Friday story if guided checklist flow is stable. |
| Compliance | School Meals | `/dashboard/school-meals` | Large API-backed route, demo-heavy. | Hide/Defer | Could become simple FSM/dietary log later. |
| HR & People | HR & People | `/dashboard/hr` | Static overview. | MVP Build | Make it a launchpad for staff, training, sickness, cover. |
| HR & People | Maternity Leave Calculator | `/dashboard/hr/maternity-leave-calculator` | Static calculator. | Ship/Demo selectively | Useful utility; not a flagship. |
| HR & People | Staff Directory | `/dashboard/hr/people` | API-backed CRUD/import. | Ship/Demo | Show CSV import/export and staff profile records. |
| HR & People | Meeting Companion | `/dashboard/hr/meetings` | API-backed meetings workflow. | MVP Build | Position as staff meeting/minutes companion. |
| HR & People | Staff Connectors | `/dashboard/connectors/staff` | Substantial UI, migration exists, no direct fetch in page. | MVP Build | Build simple responsibility assignment and expiry/task generation. |
| HR & People | Performance Management | `/dashboard/hr/performance` | Large API-backed prototype. | MVP Build | Simple appraisals/objectives log first. |
| HR & People | Cover Management | `/dashboard/hr/cover` | Large API-backed prototype. | MVP Build | Simple absence/cover log first. |
| Estates | Estates | `/dashboard/estates` | Static overview. | MVP Build | Make it launchpad to compliance/maintenance/assets. |
| Estates | Maintenance | `/dashboard/estates/maintenance` | API-backed. | Ship/Demo | Show ticket log, priority, assignee, evidence. |
| Estates | GEMS Audit | `/dashboard/estates/audit` | Static/demo-heavy. | Consolidate | Merge with condition survey/assurance. |
| Estates | Compliance Checks | `/estates-compliance` | Strong app and APIs. | Ship/Demo | Flagship estates product. |
| Estates | Energy & Utilities | `/dashboard/estates/energy` | Large API-backed energy module. | Ship/Demo selectively | Show invoice/meter analysis only if data seeded. |
| Estates | Floor Plan | `/dashboard/estates/floor-plan` | Thin route; APIs exist. | MVP Build | Complete basic floor-plan upload/view/pin flow. |
| Estates | Asset Tags | `/dashboard/estates/asset-tags` | Static QR/tag page. | MVP Build | Connect to real assets and printable labels. |
| Estates | Condition Survey | `/dashboard/estates/condition-survey` | Substantial page and API/migration. | Ship/Demo | Good operational demo. |
| Estates | Estate Strategy | `/dashboard/estates/strategy` | API-backed. | Ship/Demo selectively | Link condition survey risks to 3-year plan. |
| Estates | Lettings | `/dashboard/estates/lettings` | API-backed. | MVP Build | Useful log/income product, not Friday core. |
| Finance | Finance Hub | `/dashboard/finance` | Large demo-heavy UI. | Hide/Defer | Keep hidden unless finance is a meeting focus. |
| Finance | Budget Decisions | `/dashboard/finance/decisions` | Missing page. | Hide/Defer | Remove from nav or create simple redirect. |
| Finance | Budget Monitor | `/dashboard/finance/monitor` | Large demo-heavy UI, no direct fetch. | MVP Build | Wire to finance imports before selling. |
| Finance | Deal Finder | `/dashboard/deal-finder` | API-backed. | Ship/Demo selectively | Useful savings story; keep separate from core compliance pitch. |
| Finance | Payroll Import | `/dashboard/finance/payroll` | API-backed parser/import. | Ship/Demo selectively | Good for Trust Assessor/ICFP audiences. |
| Safeguarding | DSL Dashboard | `/dashboard/safeguarding` | Large API-backed prototype. | MVP Build | Treat as sensitive beta. Do not claim CPOMS replacement. |
| School Intelligence | Canvas | `/dashboard/school-intelligence/canvas` | Thin route, but intelligence/import backend exists. | Consolidate | Present as data layer inside School Intelligence/Trust Assessor. |
| Attendance | Attendance | `/dashboard/attendance` | Large API-backed prototype. | MVP Build | Simple attendance/intervention log; do not claim MIS replacement. |
| SEND | SENCO Dashboard | `/dashboard/send` | Large API-backed prototype plus full schema. | MVP Build | Simple SEN register/APDR/provision map first. |
| Behaviour | Behaviour | `/dashboard/behaviour` | Large API-backed prototype. | MVP Build | Simple incident/exclusion log first. |
| Communications | Comms Hub | `/dashboard/comms` | API-backed hub. | Ship/Demo selectively | Keep as parent hub. |
| Communications | Notices | `/dashboard/notices` | API-backed. | Ship/Demo selectively | Good simple utility. |
| Communications | Video Rooms | `/dashboard/comms` | Duplicate route with Comms Hub. | Consolidate | Make a tab/card inside Comms Hub. |
| Communications | Comms Analytics | `/dashboard/comms/analytics` | API-backed. | MVP Build | Keep, but demo only with seeded data. |
| Communications | Display Setup | `/display/setup` | API-backed device setup. | MVP Build | Useful if emergency/display product is in scope. |
| Communications | School Branding | `/dashboard/settings/branding` | Substantial settings page. | Ship/Demo selectively | Show as shared branding for documents/displays. |
| Communications | Emergency Broadcast | `/dashboard/emergency-broadcast` | API-backed. | Ship/Demo selectively | Strong operational product if live flow is safe. |
| Communications | Drill Scheduler | `/dashboard/emergency-broadcast/drills` | API-backed. | MVP Build | Good statutory log/checklist product. |
| Calendar | School Calendar | `/dashboard/calendar` | Large API-backed, demo-heavy. | MVP Build | Simple term dates/events/parents evening. |
| Surveys | Surveys | `/dashboard/surveys` | API-backed. | Ship/Demo selectively | Simple stakeholder feedback product. |
| Surveys | Templates | `/dashboard/surveys/templates` | API-backed. | Ship/Demo selectively | Pair with Surveys. |
| Surveys | Analytics | `/dashboard/surveys/analytics` | Missing page. | Hide/Defer | Remove from nav until implemented. |
| Website | Website Builder | `/dashboard/website` | API-backed. | MVP Build | Keep if website builder is a paid add-on. |
| Website | Pages | `/dashboard/website/pages` | API-backed. | MVP Build | Core CMS function. |
| Website | Design Studio | `/dashboard/website/design` | API-backed. | MVP Build | Core CMS function. |
| Website | News & Blog | `/dashboard/website/news` | API-backed. | MVP Build | Useful school website function. |
| Website | Media Library | `/dashboard/website/media` | Static page. | MVP Build | Needs upload/list/delete before selling as CMS. |
| Website | Web Compliance | `/dashboard/website/compliance` | Uses Ofsted website scan API. | Ship/Demo | Consolidate checker across Website/Compliance/Ofsted. |
| Connectors | Connectors Hub | `/dashboard/connectors` | Static UI; connector APIs elsewhere. | MVP Build | Make it the setup/status page for Schoolgle Connector. |
| Connectors | Canva Templates | `/dashboard/connectors/canva` | Static template library. | Hide/Defer | Nice freebie, not core product. |

## Product Packaging Recommendation

### Sell Now

| Product | Includes | Why |
| --- | --- | --- |
| Inspection Readiness Suite | Ofsted, SIAMS, SEF, SDP, Evidence, Website Compliance, Unified Tasks | Strongest strategic buyer story. |
| Compliance Suite | Policies, SOPs, Training, SCR, GDPR, Complaints, Consent, Compliance Tasks | Practical, school-admin painkiller. |
| Estates Compliance Suite | Assets, contractors, checks, maintenance, condition survey, evidence, energy | Operationally tangible and differentiated. |
| HR Essentials | Staff Directory, training records, sickness, cover, meetings, responsibilities | Easy to understand, high daily value. |
| Documents And Tasks | Templates, generated documents, approvals, tasks, audit timeline | Cross-module glue and strong demo story. |
| Risk And Assurance | Risk register, decisions, ICFP, strategic plan | Good for heads, MATs, governors. |

### Build As Simple Logs First

These are worthwhile, but should be intentionally basic at first:

| App Area | MVP Shape |
| --- | --- |
| Training | Staff member, course, completion date, expiry rule, certificate/evidence, next due task. |
| SCR | Staff member, check type, status, date seen, expiry, evidence reference, missing-check warning. |
| Complaints | Stage, complainant, owner, deadline, notes, outcome, evidence, next action. |
| Consent | Pupil, consent type, granted/declined, expiry, evidence, export. |
| Attendance | Pupil/cohort summary, concern flag, intervention, review date, task. |
| SEND | SEN register, need, APDR cycle, provision, review date, evidence. |
| Behaviour | Incident, category, pupil/cohort, action, exclusion, safeguarding escalation flag. |
| Calendar | Term dates, events, parents evening slots, reminders. |
| Finance | Budget import, CFR summary, variance, payroll/ICFP summary. |

### Hide Or Defer For Friday

- Toolbox.
- Canva Templates.
- Survey Analytics until page exists.
- Budget Decisions until page exists.
- Admissions unless directly relevant.
- Full School Website Builder unless this is a sales focus.
- Safeguarding as a full product until permissions/safety/audit are reviewed.
- Sim Studio.
- Advanced Teaching & Learning sub-apps outside Lesson Studio.

## Build Plan

### Phase 0: Before Friday

1. Create a sales navigation mode that only exposes the 6 product pillars.
2. Hide missing routes: Budget Decisions and Survey Analytics.
3. Remove duplicate nav entries for Estates Assurance and Video Rooms.
4. Seed one realistic demo organisation with staff, training, policies, estates checks, tasks, evidence, risk items, and documents.
5. Ensure every shown app has an empty state, seeded state, and one obvious "create/log/import" action.
6. Add a "Connected source" card to the key apps using the Schoolgle Connector copy.
7. Prepare a single demo script around: scan/check -> finding/log -> task -> evidence/audit.

### Phase 1: Product Consistency

1. Standardise module landing pages so each one shows: health score, open tasks, due renewals, recent records, evidence source, and top actions.
2. Make simple log components reusable across Compliance, HR, Attendance, SEND, Behaviour and Governance.
3. Make all statutory/renewal apps create Unified Tasks using the same routing metadata.
4. Fix Unified Tasks summary stats and pagination fragility.
5. Add source labels everywhere: Drive/SharePoint source file, Schoolgle-managed row, DfE/MIS import, or derived intelligence.

### Phase 2: Data And Evidence Integration

1. Connect pupil master data into Attendance, SEND and Behaviour to remove siloed pupil records.
2. Connect policy findings into Policy Manager rather than separate Ofsted-only tasks.
3. Connect risk mitigations and governance decisions into Unified Tasks.
4. Connect survey results into School Intelligence.
5. Connect meetings to follow-up actions.

### Phase 3: Commercial Packaging

1. Create pricing/product pages for: Inspection Readiness, Compliance Suite, Estates Suite, HR Essentials, Risk and Assurance, Data Intelligence.
2. Move mini-apps and experimental tools behind feature flags.
3. Add per-app readiness labels internally: `sell_now`, `pilot`, `internal`, `hidden`.
4. Add a product owner note to each app: buyer, value prop, data source, operational record, and renewal/task rules.

## Highest Priority Fixes

1. **Navigation cleanup:** 97 exposed apps is too much. Hide/consolidate before a sales demo.
2. **Missing pages:** Remove or implement `/dashboard/finance/decisions` and `/dashboard/surveys/analytics`.
3. **Duplicate routes:** Resolve `/dashboard/estates/audit` and `/dashboard/comms` duplicates.
4. **Unified Tasks correctness:** Fix summary stats and pagination before using it as the central proof point.
5. **Pupil data silos:** Attendance, SEND and Behaviour should share `pupils` rather than maintaining separate records.
6. **Connector consistency:** Apps should say what is source of truth and what Schoolgle stores.
7. **Demo seed data:** A seeded school will make the system feel finished without overbuilding every app.

## Final Product Principle

Schoolgle should feel like a calm operating layer over school evidence, compliance, people, premises and improvement work. The sellable version is not "look at all these apps"; it is:

> Connect your school evidence and records, let Schoolgle find what needs attention, assign the right work to the right person, and keep the audit trail ready for leaders, governors and inspectors.

