# SEND Funding Reconciliation Product Spec

**Date:** 2026-05-09  
**Status:** Product enhancement approved for SEND & Inclusion Copilot roadmap  
**Purpose:** Define the finance-facing SEND funding module that helps schools understand expected high-needs income, actual payments received, backdating, variances and challenge evidence at pupil level.

---

## Executive Summary

SEND funding reconciliation should be a first-class part of `Schoolgle SEND & Inclusion Copilot`.

This is commercially important because it brings the finance team into the buying case. SENCOs need the pupil/evidence workflow; finance teams need clarity on what has been agreed, what should have been paid, what has actually arrived, what is backdated, and which pupils have variances that need challenge.

The module should answer:

1. What funding has been agreed for this pupil?
2. What level/band/points does that agreement represent?
3. What should the school expect to receive, and when?
4. What has actually been received?
5. Is there a shortfall, delay, overpayment, backdated payment or coding issue?
6. What evidence supports a challenge or query to the local authority?

---

## Product Name

Recommended feature name:

> `SEND Funding Reconciliation`

Alternative user-facing labels:

- `High Needs Funding Tracker`
- `Top-Up Funding Reconciliation`
- `SEND Funding & Banding`

---

## Why It Matters

Schools often struggle with:

- LA banding systems that differ by local authority;
- point-based or level-based funding agreements;
- payment timing that does not align neatly with meetings, panel decisions or EHCP amendments;
- backdated top-up payments;
- pupils moving in/out mid-year;
- phase transfers and changed provision;
- unclear remittance advice;
- matching LA payment files to individual pupils;
- finance systems showing total income without a clean pupil-level breakdown;
- SENCO and finance teams working from different records.

If Schoolgle can connect the SEND evidence workflow to expected funding and actual receipts, it becomes useful to SENCOs, business managers, CFOs and trust finance teams.

---

## Funding Framework To Encode

The product must keep national rules separate from local authority rules.

### National Concepts

| Concept | Product Treatment |
| --- | --- |
| Element 1 | Core school funding/basic entitlement, not usually pupil-level reconciliation inside SEND Copilot. |
| Element 2 / Notional SEN budget | School contribution towards additional SEN support up to the high-needs cost threshold, currently £6,000 per pupil per annum for mainstream settings. |
| Element 3 / Top-up funding | Pupil-level high-needs top-up paid by the resident/commissioning local authority above core/notional funding. |
| Place funding | Relevant for special schools, AP, SEN units and resourced provision; must be modelled separately from top-up. |
| I03 income | Consistent Financial Reporting code for high-needs top-up funding outside the school budget share. |
| Provision cost | Schoolgle-calculated actual or expected cost of delivering provision, using staff time, external services, resources and equipment. |

### Local Authority Concepts

Each LA can have its own:

- banding model;
- points model;
- descriptors;
- funding values;
- effective dates;
- payment schedule;
- backdating rules;
- panel decision process;
- templates and remittance files.

Schoolgle should store these as configurable LA funding rule packs, not hard-code one national formula.

---

## Core Workflow

### 1. Configure The LA Funding Model

For each local authority/funding year:

- LA name/code;
- funding year;
- band or points model;
- band descriptors;
- annual value by setting type;
- payment frequency;
- default effective-date rules;
- expected payment dates;
- remittance file pattern;
- local guidance/source link;
- confidence/status: verified, school-supplied, draft, expired.

### 2. Link Funding To Pupil

For each pupil:

- current EHCP/funding status;
- LA responsible for funding;
- agreed band/level/points;
- agreement source document;
- agreement date;
- effective from/to date;
- review/annual review/panel link;
- expected annual value;
- expected payment schedule;
- backdated period if applicable.

### 3. Calculate Expected Receipts

The system calculates:

- expected amount by period;
- expected amount to date;
- full-year expected amount;
- pro-rated amount for mid-year starts/leavers;
- backdated amount due;
- adjustments from band changes;
- forecast future receipts.

### 4. Import Actual Receipts

Schools upload:

- LA payment/remittance file;
- funding agreement;
- top-up funding statement;
- panel decision letter;
- finance ledger export;
- bank/finance system income extract where appropriate.

The system extracts:

- pupil name/identifier;
- UPN/pupil code if present;
- LA reference;
- band/points;
- period;
- amount;
- payment date;
- payment description;
- financial code.

### 5. Reconcile

For each pupil and period:

- expected;
- received;
- variance;
- timing status;
- backdated amount outstanding;
- overpayment/underpayment;
- unmatched receipt;
- missing receipt;
- coding issue;
- evidence source.

Statuses:

- matched;
- expected later;
- overdue;
- underpaid;
- overpaid;
- backdated due;
- unmatched payment;
- needs human review;
- disputed;
- resolved.

### 6. Challenge Or Query

Where variance exists, Schoolgle generates:

- query summary;
- pupil-level evidence;
- expected vs received table;
- relevant agreement/panel/review documents;
- suggested email to LA finance/SEND team;
- action with owner and due date;
- audit trail.

Language must be careful: "based on the funding model and documents uploaded, this appears to be a variance" rather than "the LA is wrong".

---

## User Experience

### SENCO View

The SENCO sees:

- funding status on the pupil one-view;
- evidence required for banding or change request;
- funding agreed after annual review/panel;
- whether provision cost exceeds funding;
- prompts to update funding after review outcomes.

### Finance View

The finance/business manager sees:

- expected high-needs income by month/term;
- actual receipts by month/term;
- pupil-level reconciliation;
- unmatched remittance lines;
- variance list;
- backdated funding due;
- export for finance review;
- trust/school summary.

### Trust View

The trust sees:

- total expected vs received high-needs funding;
- variances by school;
- funding exposure;
- pupils awaiting payment;
- backdated amounts due;
- local authority comparison;
- aged variance report.

---

## Product Screens

### Funding Overview

Cards:

- expected this year;
- received to date;
- outstanding expected;
- overdue/variance;
- backdated due;
- provision cost gap.

### Pupil Funding Tab

Shows:

- current band/points;
- LA and funding year;
- effective dates;
- payment schedule;
- linked EHCP/review/panel decision;
- expected receipts;
- actual receipts;
- variance;
- evidence/challenge actions.

### Reconciliation Workbench

Shows:

- uploaded LA file;
- suggested pupil matches;
- low-confidence matches;
- unmatched rows;
- variance calculations;
- approve/import button;
- audit log.

### Funding Challenge Pack

Generates:

- pupil funding summary;
- agreed funding source;
- expected vs received table;
- outstanding/backdated amount;
- evidence documents;
- suggested query wording;
- action log.

---

## Data Model Requirements

Existing schema already includes useful foundations:

- `sen_funding_configs`;
- `sen_funding_bands`;
- `sen_funding_allocations`;
- `send_provision_costs`;
- `sen_ehcp_applications`;
- `sen_annual_reviews`;
- `sen_evidence_files`.

Additional tables required:

| Table | Purpose |
| --- | --- |
| `sen_funding_payment_schedules` | Expected payment dates/periods by LA, pupil, allocation and funding year. |
| `sen_funding_receipts` | Actual imported receipt/remittance lines. |
| `sen_funding_reconciliation_runs` | One import/reconciliation event, with source file and summary. |
| `sen_funding_reconciliation_items` | Pupil-period match: expected, received, variance, status, confidence. |
| `sen_funding_source_documents` | Funding agreements, panel decisions, remittances and LA statements. |
| `sen_funding_variance_actions` | Query/challenge workflow linked to actions and communications. |

---

## AI Assistance

AI can help with:

- extracting funding details from LA letters/statements;
- mapping LA remittance files to pupils;
- identifying band/points/effective date;
- calculating likely expected receipt schedule;
- explaining variances in plain English;
- drafting finance queries;
- linking evidence to funding challenge packs.

AI must not:

- silently change financial records;
- assert entitlement where source evidence is weak;
- send challenge emails without human approval;
- override finance-team approval;
- assume local band values without a verified LA rule pack.

---

## Phase Recommendation

### Phase 1A: Funding Visibility

- Add pupil funding tab.
- Store current band/points, annual amount, effective date and source document.
- Show provision cost vs funding.
- Show expected annual income.

### Phase 1B: Reconciliation MVP

- Upload LA remittance/payment file.
- Match rows to pupils.
- Calculate expected vs received.
- Flag variance/backdated due.
- Generate query pack.

### Phase 2: Trust Finance Intelligence

- Multi-school expected vs received.
- Aged debt/variance report.
- LA comparison.
- Forecast receipts.
- Finance export.

---

## Commercial Impact

This should be sold as an add-on or premium tier because it gives measurable financial value.

Suggested pricing:

- school add-on: £500-£1,500 per year;
- trust add-on: £300-£750 per school per year;
- standalone finance reconciliation pilot: £5,000-£15,000 per trust depending on school count and LA complexity.

The sales line:

> Know what SEND funding you should receive, what has arrived, what is missing, and what evidence supports a query.

---

## Source References

- High needs funding 2026 to 2027 operational guide: <https://www.gov.uk/government/publications/high-needs-funding-arrangements-2026-to-2027/high-needs-funding-2026-to-2027-operational-guide>
- Schools operational guide 2026 to 2027: <https://www.gov.uk/government/publications/pre-16-schools-funding-local-authority-guidance-for-2026-to-2027/schools-operational-guide-2026-to-2027>
- Notional SEN budget guidance 2026 to 2027: <https://www.gov.uk/government/publications/pre-16-schools-funding-local-authority-guidance-for-2026-to-2027/the-notional-sen-budget-for-mainstream-schools-operational-guidance-2026-to-2027>
- Consistent financial reporting framework 2026 to 2027: <https://www.gov.uk/guidance/consistent-financial-reporting-framework-2026-to-2027/income>

