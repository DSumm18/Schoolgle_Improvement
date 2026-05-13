# Estates Compliance — Real-World Use Cases & Test Plan

This document keeps product development, QA, demos, and marketing aligned. Each use case describes a real school problem, the expected Schoolgle workflow, the database proof we should see, and the customer-facing story.

## Product Promise

Schoolgle Estates helps schools stay on top of statutory compliance, assets, contractors, evidence, and risk without forcing site teams to understand every policy, regulation, or database table.

The system should:

- reduce friction for caretakers and site staff
- keep statutory compliance evidence organised
- stop avoidable spend through warranty and contractor history checks
- turn reports and findings into risks, actions, watchlist items, or strategy items
- give SLT, finance, governors, and trustees a clear risk-led view
- let Ed create, update, summarise, and challenge work using the school’s own policies and SOPs

## Use Case 1 — Boiler Fault Under Warranty

**Persona:** Caretaker or school business manager  
**Situation:** A recently installed water heater/boiler keeps failing. The school might normally call a random contractor and pay for repair.

### Expected Workflow

1. User opens `Estates Compliance → Helpdesk → New Ticket`.
2. User searches for and selects the affected boiler/water heater from the asset register.
3. System checks warranty status automatically.
4. If warranty is active or expiring, system warns the user to contact the supplier/installer first.
5. User can still create the ticket for tracking.
6. If user decides to bypass warranty and use paid repair, they must record why.
7. Ticket description stores the warranty routing recommendation and override reason.
8. Any uploaded photos/PDFs attach to the ticket and linked asset.

### Database Proof

- `estates_helpdesk_tickets.asset_id` is populated.
- `estates_helpdesk_tickets.description` includes the warranty routing note.
- `estates_evidence.ticket_id` is populated for attachments.
- `estates_evidence.asset_id` is populated when an asset was selected.
- Asset detail page shows the ticket and evidence in the asset history.

### Test Script

- Create an asset with active warranty, supplier, purchase date, invoice number, and warranty expiry.
- Create a helpdesk ticket linked to that asset.
- Confirm the warranty warning appears before submit.
- Tick the paid-work override box without entering a reason.
- Confirm submit is blocked.
- Add reason: `Emergency make-safe required; warranty provider cannot attend today.`
- Submit ticket.
- Confirm ticket exists and contains the warranty note and reason.

### Marketing Story

“Schoolgle stops schools paying twice. If a boiler is still under warranty, the system flags the installer before anyone books paid repair.”

## Use Case 2 — Caretaker Off Sick, Compliance Check Handover

**Persona:** Cover caretaker, SBM, headteacher  
**Situation:** The usual caretaker is absent. Someone else needs to understand the fire alarm or legionella position quickly.

### Expected Workflow

1. User opens a specific compliance check.
2. The Compliance Briefing card shows current status, risk posture, evidence confidence, next due date, open actions, and key things to watch.
3. User reads the report-ready summary and timeline.
4. Ed can explain the SOP/policy and create follow-up tasks.

### Database Proof

- `estates_statutory_completions` contains latest completion.
- `estates_compliance_tasks` contains open actions where applicable.
- Evidence IDs are linked to the latest completion.
- Briefing derives from existing data, not manually typed dashboard text.

### Test Script

- Open a statutory check with a recent completion and evidence.
- Confirm status reads `Compliant now`.
- Add an open high-priority action linked to the same check.
- Refresh the page.
- Confirm risk posture increases and open action count appears.

### Marketing Story

“If the caretaker is off, the school still knows exactly where it stands.”

## Use Case 3 — Contractor Relationship History

**Persona:** SBM, CFO, estates lead  
**Situation:** A contractor has repeated delays, complaints, or high spend. The school needs evidence before renewing or replacing them.

### Expected Workflow

1. User opens contractor record.
2. System shows contacts, emergency details, finance contact, DBS/authority evidence, insurance, accreditations, contracts, reports, service visits, tickets, complaints, feedback, and spend.
3. Ed summarises performance risks and renewal considerations.

### Database Proof

- `estates_contractors` stores core contact/compliance status.
- `estates_contracts` stores contract terms and linked checks/assets.
- `estates_helpdesk_tickets.contractor_id` or `assigned_contractor_id` links work history.
- `estates_compliance_tasks.contractor_id` or `assigned_contractor_id` links planned work.
- Evidence/report records link back to contractor.

### Test Script

- Create contractor with insurance and DBS authority fields.
- Link them to a service contract.
- Create two service visits and one complaint.
- Confirm contractor page shows chronology and spend summary.
- Ask Ed: “Should we renew this contractor?”

### Marketing Story

“Every contractor interaction becomes evidence for better procurement decisions.”

## Use Case 4 — Condition Survey Becomes Strategy, Not Noise

**Persona:** CFO, estates lead, trustees  
**Situation:** A condition survey says multiple assets are end of life, but not all require immediate replacement.

### Expected Workflow

1. User uploads condition survey/report.
2. AI extracts draft findings.
3. System classifies each finding as compliance defect, operational repair, lifecycle concern, capital pressure, or watchlist.
4. The proposal shows route counts: task now, risk review, strategy item, watchlist, or asset-only update.
5. End-of-life but serviceable assets go to watchlist/strategy, not automatic urgent tasks.
6. Material risks become risk register entries for review, not hidden contractor recommendations.
7. Capital pressures become estate strategy candidates with year, cost, confidence, consequence if unfunded, and evidence source.

### Database Proof

- Source evidence/report is stored once.
- Draft findings reference the source evidence.
- Approved findings create linked tasks, risks, or strategy items.
- Watchlist items remain visible without becoming false urgent work.

### Test Script

- Upload a sample survey with: `Boiler end of life, serviceable, estimated replacement £100,000 within 3 years`.
- Confirm draft finding is classified as capital pressure with `add_to_strategy`, risk `4/5`, and strategy year `3`.
- Confirm no urgent compliance task is created automatically.
- Upload/report a second finding: `CO readings elevated, repeated flame failure, risk to H&S`.
- Confirm it is classified as compliance defect with `create_task` and `create_risk`, risk `5/5`.
- Promote the serviceable boiler item to estate strategy year 3 with risk/consequence.
- Confirm finance/trustee report includes it.

### Current Build Proof

- `triageEstateFinding()` classifies findings before any write is made.
- `/api/estates/compliance-reports/analyse` now returns `triage`, `triage_summary`, and route counts in `summary_counts`.
- `/api/estates/condition-survey` returns each demo element with triage plus an overall triage summary.
- `ContractorReportAnalyzer` shows a clean risk routing summary and each finding card shows risk score and destination.

### Marketing Story

“Schoolgle turns condition surveys into a practical plan, not a panic list.”

## Use Case 5 — Finance Reprioritises Capital Work

**Persona:** CFO, trustees  
**Situation:** A £50,000 emergency roof repair means planned boiler replacement must move.

### Expected Workflow

1. Finance opens Estate Strategy.
2. They record a decision to defer or reprioritise an item.
3. System captures reason, approver, date, impact, residual risk, and what moved as a result.
4. Trustee report summarises changes since last meeting.

### Database Proof

- Strategy item status changes.
- Risk decision/audit event is recorded.
- Residual risk and funding gap remain visible.
- Generated report includes change narrative.

### Test Script

- Create two strategy items with year 1 funding need.
- Approve one and defer one due to budget pressure.
- Confirm audit trail records decision and impact.
- Generate trustee update.
- Open `Estates → Estate Strategy`.
- Confirm the page shows the three-year strategy separately from compliance checks.
- Confirm items are grouped by year with total planned value and high-risk counts.

### Current Build Proof

- Strategic plan APIs now use the actual `strategic_plans` and `strategic_plan_items` schema.
- Plan responses preserve the current UI shape while storing `plan_type`, `start_year`, `end_year`, and per-year budgets correctly.
- Plan items now store `strategic_plan_id`, `estimated_cost`, `priority_band`, `risk_score`, `is_statutory`, and source-module traceability.
- Prioritisation returns MoSCoW bands plus finance summary totals so it can feed trustee/CFO reporting.
- `/dashboard/estates/strategy` now presents Estate Strategy as a separate finance-facing app screen, not a compliance sub-tab.

### Marketing Story

“Finance can see what changed, why it changed, and the risk of not funding it.”

## Use Case 6 — SOP Guardrail Before Unsafe Action

**Persona:** Caretaker  
**Situation:** User wants to do something that conflicts with fire, water, asbestos, contractor, or safeguarding procedure.

### Expected Workflow

1. User asks Ed or starts a ticket/check.
2. Ed retrieves relevant SOP/policy context.
3. Ed warns if the proposed action conflicts with procedure.
4. Ed explains the reason in plain English.
5. If leadership approves a deviation, system records who approved and why.

### Database Proof

- SOP/policy is referenced in Ed response.
- Workflow/ticket records any deviation reason.
- Audit trail shows approval where required.

### Test Script

- Ask Ed: “Can I isolate this fire door because it keeps slamming?”
- Confirm Ed warns against unsafe change and points to fire safety procedure.
- Ask Ed to create a ticket instead.
- Confirm ticket is created with appropriate category and risk language.

### Marketing Story

“Ed helps site teams do the right thing before a shortcut becomes a safety issue.”

## Demo Checklist

- [ ] Compliance check briefing shows current position and risk posture.
- [ ] Asset picker finds an asset and checks warranty.
- [ ] Active warranty warning appears before ticket submission.
- [ ] Paid warranty bypass requires a reason.
- [ ] Ticket stores asset link and warranty note.
- [ ] Evidence upload links to ticket and asset.
- [ ] Ed can draft warranty claim email.
- [ ] Ed can create/update tickets.
- [ ] Ed can triage a report finding before creating noisy work.
- [ ] Ed can add a capital pressure to the three-year estate strategy.
- [ ] Ed can list overdue checks.
- [ ] Risk register receives material estates risks.
- [ ] Estate strategy receives capital/watchlist items only after review.

## Competitor Differentiation

Traditional systems help schools record checks, tasks, contractors, assets, and evidence. Schoolgle should do that, but also connect the dots:

- AI-guided workflows for non-specialist site staff
- compliance status separated from risk of becoming non-compliant
- warranty-aware ticket creation
- contractor relationship intelligence
- report-to-finding-to-risk triage
- finance/trustee strategy reporting
- Ed actions through chat, not just static dashboards

## Ed Chat Skill Tests

### Scenario A — Triage Before Action

Ask Ed: `The boiler report says the boiler is end of life but serviceable, likely replacement within 3 years, estimated £100,000. What should I do?`

Expected:

- Ed calls `triage_estate_finding`.
- Classification is `capital_pressure`.
- Route includes `add_to_strategy`, not `create_task`.
- Ed explains this is a budget-planning risk, not immediate non-compliance by itself.

### Scenario B — Strategy Item From Chat

Ask Ed: `Add that boiler replacement to the estate strategy for year 3 with a £100,000 estimate. The consequence is heating failure and emergency closure risk if it deteriorates.`

Expected:

- Ed calls `create_estate_strategy_item`.
- If no estate strategy exists, the system creates `Three-Year Estate Strategy`.
- A `strategic_plan_items` row is created with `strategic_plan_id`, `estimated_cost`, `year`, `source_module = estates`, and `consequence_if_unfunded`.
- Ed returns a plain-English confirmation with item, year, and estimated cost.
