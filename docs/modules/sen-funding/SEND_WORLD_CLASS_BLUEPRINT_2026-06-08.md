---
status: draft
created: 2026-06-08
updated: 2026-06-08
owner: Schoolgle
scope: SEND Hub, pupil profile spine, Ofsted Readiness, Schoolgle Intelligence
---

# Schoolgle SEND World-Class Product Blueprint

## Executive Position

Schoolgle SEND should not be another provision-mapping tool. The product opportunity is a joined-up SEND operating system that gives the SENCO, headteacher, trust leader and governor one truthful picture of:

- who is on the SEND register;
- what support they receive;
- whether statutory and school-defined review cycles are on time;
- whether provision is working;
- whether evidence is strong enough;
- whether funding matches actual need and provision cost;
- whether the school can evidence inclusive mainstream practice under Ofsted's renewed inspection model.

The strategic product position is:

> Schoolgle SEND is the pupil-level inclusion, statutory workflow, evidence, funding and assurance spine for schools and trusts.

## Current Legal And Policy Baseline

As of 8 June 2026, current SEND compliance remains grounded in:

- the SEND Code of Practice: 0 to 25 years, last updated 12 September 2024;
- the Children and Families Act 2014, especially Part 3;
- the Special Educational Needs and Disability Regulations 2014;
- the Equality Act 2010 reasonable-adjustments duty;
- Ofsted's renewed school inspection toolkit/report-card model, in use from 10 November 2025.

The 2026 SEND reform consultation and schools white paper are product-roadmap context, not current law. The app must label future concepts such as Individual Support Plans, National Inclusion Standards and Targeted/Targeted Plus/Specialist layers as "future-ready" until statutory commencement is confirmed.

## Market Findings

The researched market splits into four groups:

| Market Group | Examples | What They Do Well | Gaps Schoolgle Can Exploit |
| --- | --- | --- | --- |
| Provision mapping | Tes Provision Map, Insight, Blue Hills | Interventions, pupil passports, costed provision, parent sharing | Weak EHCP lifecycle, weak funding reconciliation, limited cross-module evidence |
| SENCO workflow tools | SEN Master, Senflow, Student Radar/SENDlink, Educater | Register, annual reviews, APDR, document packs, statutory reminders | Limited whole-school evidence, inconsistent finance, limited Ofsted inclusion evidence |
| Evidence/assessment tools | Earwig Academic | Photo/video evidence, special-school evidence capture, parent sharing | Not a full SEND finance/statutory operating system |
| LA/EHCP platforms | Idox EHC Hub, Invision360 | EHCP workflow, LA collaboration, QA, statutory case handling | Not a school-owned SENCO/pupil-profile/funding/provision operating system |

Public pricing signals show a market ranging from roughly low hundreds per year to around £4.25-£4.50 per pupil/year, with many quote-only vendors. Schoolgle should not race to be cheapest; the differentiator should be recovered funding, reduced SENCO admin and inspection-ready evidence.

## Must-Match Capabilities

Schoolgle needs enough parity that SENCOs recognise the tool as credible:

1. SEND register with SEN Support, EHCP, primary/secondary need, status history and audit trail.
2. Pupil one-view profile linked to the canonical Schoolgle pupil spine.
3. APDR cycles with assess, plan, do and review records.
4. Provision mapping with interventions, responsible staff, frequency, duration, cost and impact.
5. EHCP lifecycle with EHC needs assessment, draft review, final plan, amendments, phase transfer and annual review.
6. Parent and pupil voice capture.
7. Document/evidence store linked to the pupil profile.
8. SENCO dashboard with caseload, overdue actions, upcoming reviews and incomplete evidence.
9. Import flow from Arbor/SIMS/Bromcom-style exports, with matching/review workflow for ambiguous pupils.
10. MAT/trust summary view.

## Must-Beat Capabilities

The product becomes exceptional if it goes beyond the market in these areas:

1. **Funding reconciliation:** import LA schedules, match EHCP pupils, flag missing/late/changed funding, compare provision cost against funding received, and prepare governor/finance reports.
2. **Evidence strength engine:** score evidence packs for APDR, EHCNA requests, annual reviews and band escalation; show what is missing before it becomes a failure.
3. **Meeting-to-action automation:** record meetings, transcribe them, generate minutes, extract decisions/actions, attach them to the pupil timeline, and create follow-up tasks.
4. **Ofsted inclusion evidence map:** automatically map SEND records to the renewed inspection toolkit: identification, inclusive teaching, reasonable adjustments, APDR, parent/pupil voice, specialist advice, attendance/behaviour adaptations, safeguarding vulnerability and leadership oversight.
5. **Pupil timeline:** every import, review, intervention, evidence upload, parent contact, meeting, provision change, funding change and Ofsted-linked finding appears in a single chronological record.
6. **AI case builder:** generate draft SENCO summaries, annual review packs, EHCNA evidence checklists, funding escalation narratives and governor report narratives from live evidence.
7. **Future-ready ISP model:** design current SEN Support/EHCP records so Individual Support Plans can be added later without re-platforming.

## Pupil One-View

Every pupil should have one canonical profile, with SEND as one major panel inside it rather than a disconnected module.

The profile should show:

- identity and school context: name, year group, class, status, import source, archived/live state;
- SEND overview: SEN status, needs, EHCP state, SENCO owner, review status;
- provision: current support, cost, frequency, responsible staff and impact;
- APDR: current cycle stage, evidence, next review, last review decision;
- EHCP and statutory timeline: request, assessment, draft, final, annual review, phase transfer;
- evidence and documents: plans, reports, meeting minutes, communications, specialist advice;
- attendance/behaviour/assessment signals where permitted and relevant;
- funding: band, amount, LA schedule match, actual provision cost, gap;
- tasks and actions: open, overdue, completed, linked to meetings/reviews/evidence;
- audit/GDPR: who changed what, source of data, export/delete/archive controls.

## Ofsted Readiness Integration

SEND should feed Ofsted Readiness directly rather than creating parallel assurance.

Clean integration points:

- generate `ofsted_findings` from SEND evidence gaps, APDR overdue status, EHCP assurance gaps, annual-review risks and funding/provision inconsistencies;
- extend Ofsted finding source types to include SEND-native records;
- create SEND tasks through the unified `actions`/tasks model, not only SEND-local actions;
- link `sen_evidence_files` and cloud documents as source-labelled evidence, not duplicated canonical documents;
- expose an "Inclusion Evidence Matrix" inside Ofsted Readiness that is powered by SEND data.

The key Ofsted question becomes:

> Can the school prove that pupils with SEND are identified early, supported well, included in mainstream life where appropriate, heard, reviewed, and making progress from their starting points?

## AI Design

AI should reduce admin and surface risk, not silently make statutory decisions.

Recommended AI jobs:

- suggest APDR targets from pupil need, staff notes and assessment evidence;
- draft meeting minutes and action plans from transcript;
- identify missing annual review/EHCP evidence;
- summarise parent/pupil voice into structured sections;
- compare provision cost and evidence against LA band descriptors;
- draft evidence-based funding escalation narratives;
- generate governor/trust SEND reports;
- create Ofsted inclusion evidence summaries;
- flag risky claims, stale data, missing voice, missing specialist advice and overdue statutory actions.

Guardrails:

- human confirmation required before statutory documents, external letters or funding challenges are finalised;
- AI recommendations must keep source references and confidence levels;
- future-reform terms must be labelled as policy/roadmap rather than current legal duty;
- pupil data use must follow the school-as-controller and Schoolgle-as-processor model.

## User Experience Principles

The app must be SENCO-simple, not consultant-clever.

- Use a left-to-right workflow runway: identify → plan → provide → review → evidence → report.
- Use sortable field tables for caseload work, not only card descriptions.
- Make the mobile flow one-thumb friendly for quick evidence capture, voice notes and photo upload.
- Keep the pupil profile calm: summary cards at the top, timeline underneath, deep details behind tabs.
- Use status language school staff understand: Due soon, Overdue, Missing evidence, Ready for review, Needs decision.
- Make every red/amber item actionable with a clear "what to do next" button.
- Avoid making SENCOs type twice: imports, transcripts, documents and tasks should pre-fill wherever safe.

## Data And Architecture Gaps To Close

Codebase review found these gaps before the product can be called coherent:

1. `send_register.pupil_id`, `pupils.pupil_id`, `send_register.id` and `pupil_record_id` semantics need to be documented and normalised.
2. SEND-local actions in `send_pupil_actions` need to surface through the unified tasks/actions experience.
3. Ofsted source typing needs SEND-native source types.
4. SEND evidence, EHCP, review and funding reconciliation APIs are partly specified but not fully implemented.
5. Older privacy comments conflict with the newer pupil spine storing names/DOB; the data-protection position needs one clear product policy.

## Delivery Sequence

### Phase 1: Data Spine And Register

- Finalise pupil spine policy, imports and archive/delete controls.
- Normalise SEND register linkage to `pupils`.
- Build pupil one-view shell with SEND panel and timeline.
- Ensure Grove House UAT data works end to end.

### Phase 2: SENCO Workflow

- Build editable SEND register and profile fields.
- Add APDR cycles, provision map, review dates and evidence upload.
- Add parent/pupil voice capture.
- Add sortable caseload tables and overdue filters.

### Phase 3: EHCP And Statutory Runway

- Add EHCP lifecycle fields and workflow.
- Add annual review tracker and statutory deadline alerts.
- Add meeting capture/transcription/minutes/actions.
- Add evidence-pack generator.

### Phase 4: Funding And Finance Differentiator

- Add LA funding schedule import.
- Match funding against EHCP pupils and provision cost.
- Add funding gap dashboard and governor/finance report.
- Add band/escalation evidence builder.

### Phase 5: Ofsted Inclusion And AI Assurance

- Generate Ofsted findings from SEND gaps.
- Add Inclusion Evidence Matrix to Ofsted Readiness.
- Add AI evidence-strength scoring and report generation.
- Add trust/governor SEND assurance dashboards.

## Acceptance Tests For The First Real Build

Using Grove House UAT data:

1. A SENCO can open the SEND register and see all imported SEND pupils with correct K/E status and primary need.
2. A pupil row opens a canonical pupil profile with SEND, class, documents and task timeline.
3. The SENCO can create an APDR cycle, add provision, upload evidence and set a review date.
4. An overdue APDR review appears on the SENCO dashboard and the unified task list.
5. An EHCP pupil can have an annual review date and statutory deadline warning.
6. A meeting transcript can generate draft minutes and actions linked to the pupil.
7. A missing-evidence issue can create an Ofsted Readiness finding linked back to the pupil SEND profile.
8. Funding data can be imported and reconciled against EHCP pupils.
9. A governor SEND report can be generated from live SEND data.
10. Archive/delete/export controls are visible for GDPR and retention handling.

## Research Sources Used

- GOV.UK, SEND Code of Practice: 0 to 25 years, last updated 12 September 2024.
- GOV.UK, School inspection: toolkit, operating guides and information, published 9 September 2025 and updated 5 November 2025.
- GOV.UK, Every child achieving and thriving, published 23 February 2026 and updated 27 April 2026.
- GOV.UK, SEND reform: putting children and young people first, consultation ran 23 February 2026 to 18 May 2026.
- Competitor review saved in Obsidian: `C:\2nd Brain\wiki\60 - Syntheses\SEND Management Software Competitor Comparison.md`.
- Statutory/Ofsted/reform synthesis saved in Obsidian: `C:\2nd Brain\wiki\60 - Syntheses\SEND Management Product Statutory Ofsted And Reform Context.md`.
- Existing repo specs in `docs/modules/sen-funding/`.
