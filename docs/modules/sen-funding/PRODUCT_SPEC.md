# SEND Finance & Management Module: Product Specification

**Date:** 2026-03-14
**Status:** Research Complete — Ready for Implementation Planning
**Working Title:** "SEND Hub" (within Schoolgle Toolbox)

---

## 1. Executive Summary

### The Problem

Every school in England with SEND pupils (which is every school) faces three interlinked problems:

1. **Administrative overload** — SENCOs spend 74% of their time on paperwork instead of supporting pupils. 67% say their workload is unmanageable. 85% have no dedicated admin support. EHCP applications take 10-20 hours each to prepare.

2. **Money left on the table** — Schools don't reconcile their SEN funding. They trust whatever the LA pays is correct (it often isn't). They don't request band reviews when needs escalate. They miss the connection between provision costs and funding entitlement.

3. **Fragmented tools** — Schools use Provision Map (£795/yr) for provision mapping, Outlook for annual review reminders, Word templates for EHCP applications, spreadsheets for funding tracking, and filing cabinets for evidence. Nothing connects these workflows.

### The Opportunity

No existing tool combines SEND management with financial intelligence. The market is split:

| What Exists | What's Missing |
|-------------|---------------|
| Provision mapping (Provision Map, Blue Hills) | Funding reconciliation |
| EHCP workflow (Educater) | AI-powered case building |
| Evidence capture (Earwig) | Income forecasting |
| SEN register (MIS built-in) | Band validation |
| Annual review reminders | Statutory deadline enforcement |
| Governor reporting | Cross-school benchmarking |

**SEND Hub would be the first tool to close the entire loop**: graduated approach evidence → EHCP application → provision management → annual reviews → funding reconciliation → income forecasting → AI-assisted case building for band escalation.

### The Market

- **638,700 children** with EHCPs in England (January 2025, up 10.8% YoY)
- **1.7 million** total SEND pupils
- EHCPs have **more than doubled** since 2015
- Government investing **£7 billion more** for SEND by 2028-29
- Individual Support Plans (ISPs) replace EHCPs from **September 2030** — first-mover advantage for ISP-ready architecture
- Current SEN software market: **£400-900/year per school** for tools that do half of what we'd offer

---

## 2. Competitive Landscape

### Direct Competitors

| Product | Price | Strengths | Weaknesses |
|---------|-------|-----------|------------|
| **Provision Map** (Tes/EduKey) | £675-795/yr | Market leader, 1000+ targets, costed provisions, parent portal | No EHCP workflow, no funding reconciliation, can't upload multiple files, poor migration support |
| **Earwig Academic** | £400-2,400/yr | AI timelines, photo/video evidence, strong in special schools | No provision costing, no funding tracking, no EHCP application support |
| **Educater SENCO** | Unknown | EHCP/IEP workflow, multi-agency collaboration | No provision costing, no funding reconciliation, limited automation |
| **Senflow** | Unknown | Clean UI, MIS sync via a third-party data broker, annual review management | New entrant, limited features, unclear differentiation |
| **Blue Hills** | Unknown | Provision mapping, HNF evidence, PP tracking | SIMS-only integration, limited EHCP workflow |
| **SEN Master** | Unknown | SMART targets, provision mapping | No EHCP workflow, no funding tracking |

### Adjacent Systems

| System | Relevance |
|--------|-----------|
| **Arbor MIS** | Has basic SEN module but funding records are NOT linked to EHCPs. No reconciliation. |
| **SIMS MIS** | Legacy SEN module, declining market. Top-up funding maintained separately. |
| **CPOMS** | Safeguarding, not SEND management. But proves the "must-have specialist tool" model. |
| **Capita One / Synergy** | LA-level SEND case management. Not school-facing. Don't integrate with school tools. |

### Key Market Gaps We Fill

1. **End-to-end EHCP lifecycle** — No school tool covers the full journey
2. **Funding ↔ provision connection** — 81% of SENCOs struggle with funding (nasen 2024). No tool automates this
3. **Statutory deadline tracking** — Only 46.4% of EHCPs issued within 20 weeks. Schools can't track LA compliance
4. **AI analysis** — Only Earwig uses AI at all (just timelines). Nobody does pattern detection, case building, or cohort analysis
5. **ISP readiness** — LGA flagged current systems "unlikely to be ISP-ready." We build for 2030 from day one

---

## 3. Product Definition

### Core Modules

#### Module 1: SEND Register & Provision Mapping
*Replaces: Provision Map (£795/yr), spreadsheets*

- Import SEN register from Arbor directly where approved, from an Arbor-exported connected sheet, or from CSV
- Pupil profiles: SEN status (N/K/E), primary/secondary need codes, EHCP dates, funding band
- Costed provision mapping: staff hours × hourly rate + resources + therapies
- Intervention library with SMART targets (pre-built, customisable)
- One-page profiles / pupil passports
- Graduated approach (APDR) cycle tracking with evidence upload
- Parent sharing portal (view-only access to their child's provision and targets)

#### Module 2: EHCP Lifecycle Manager
*Replaces: Word templates, email chains, LA portal frustration*

- **Pre-application checklist**: What evidence is needed, what's missing, readiness score
- **Application builder**: Guided wizard that collects all required evidence, generates the SENCO report, pulls in assessment data, and produces a submission-ready pack
- **20-week tracker**: Visual timeline showing exactly where the application is in the statutory process, with countdown timers and alerts when the LA is overdue
- **Draft EHCP review**: Checklist for reviewing the LA's draft — is provision quantified? Are outcomes SMART? Does it match the evidence?
- **Consultation tracker**: When LA consults on placements, track the 15-day response window
- **EHCP document store**: All EHCP versions, amendments, professional reports in one place (multi-file upload)

#### Module 3: SEND Calendar & Annual Review Tracker
*Replaces: Outlook reminders, paper diaries*

- Annual review due dates auto-calculated from EHCP issue/last review
- Phase transfer deadlines (15 Feb / 31 Mar) with countdown
- Year 9+ Preparation for Adulthood flag
- Pre-review checklist: reports requested, parent views gathered, child views captured
- Post-review: track LA response against 4-week and 12-week statutory deadlines
- Escalation alerts when LA misses deadlines
- Transition planning for Year 6 and Year 11 pupils

#### Module 4: Funding Intelligence (The Differentiator)
*Replaces: Nothing — this doesn't exist anywhere*

- **LA funding schedule import**: Upload the LA's allocation spreadsheet/PDF. Auto-extract pupil-level funding data
- **Auto-reconciliation**: Match every EHCP pupil on school's register against LA funding schedule. Flag:
  - Pupils with EHCPs not appearing on LA schedule (missing funding)
  - Band mismatches (LA paying Band 3, annual review recommended Band 4)
  - Payment errors (amount received ≠ amount on schedule)
  - Funding for pupils who have left (overpayment to return)
  - New starters with EHCPs not yet funded (chase LA)
- **Payment tracking**: Match actual bank receipts against expected payments
- **Income forecasting**: Project monthly/termly/annual SEN income based on current cohort
- **Scenario modelling**: "If these 3 pupils in assessment get EHCPs at Band 3, income increases by £X"
- **Notional SEN budget calculator**: Verify the LA's calculation of Element 2 using NFF factors
- **Per-pupil funding gap analysis**: Provision cost vs. funding received vs. £6,000 threshold

#### Module 5: AI-Powered Case Building (Ed Integration)
*Replaces: Nothing — this doesn't exist anywhere*

- **Band validation**: AI analyses pupil's provision costs, need profile, and assessment data against LA band descriptors. Flags pupils where evidence supports a higher band
- **Escalation case builder**: Ed drafts the evidence summary for requesting a band change at annual review, referencing the pupil's data, provision costs, and the LA's own band descriptors
- **EHCP application strength scorer**: Before submitting an EHCP request, AI assesses whether the evidence pack is strong enough based on patterns from successful applications
- **Cohort pattern detection**: "3 of your ASD pupils are on Band 3 but your provision costs suggest Band 4. Here's a case for batch review"
- **Governor report generator**: Auto-generate the termly SEND governor report from live data

#### Module 6: LA Configuration Engine
*The infrastructure moat*

- Configurable banding systems per LA (Bradford's 6 numeric bands, Leeds' 7 area bands, Essex's levels, etc.)
- Band values updated annually (with historical tracking)
- Different calculation models: mainstream, ARP, special school, post-16
- LA-specific EHCP application templates and portal information
- Statutory timeline tracking calibrated to each LA's actual performance
- **Community-maintained**: As schools in each LA use the system, band data stays current

#### Module 7: Reporting & Benchmarking

- **SENCO dashboard**: My caseload, upcoming reviews, funding summary, overdue items
- **SBM/Finance dashboard**: Total SEN income vs. expenditure, payment status, forecast
- **Headteacher dashboard**: Strategic SEND position, staffing implications, governor report preview
- **Governor reporting**: Termly SEND report with financial position, compliance status, pupil outcomes
- **Cross-school benchmarking** (anonymised): "Schools with similar profiles in your LA average Band X for this need type"

---

## 4. SENCO Workflow: A Day in the Life

### Before SEND Hub

| Task | Time | Tools Used |
|------|------|-----------|
| Check which annual reviews are due this month | 20 mins | Paper diary, Outlook |
| Chase LA for response to reviews submitted 6 weeks ago | 30 mins | Email |
| Prepare evidence pack for new EHCP application | 4 hours | Word, filing cabinet, MIS exports |
| Check if top-up funding has arrived for new pupil | 15 mins | Phone call to SBM, LA email |
| Update provision map with costs | 45 mins | Provision Map software |
| Write SENCO report for annual review | 2 hours | Word template |
| Meeting with parent about EHCP progress | 1 hour | Paper EHCP, printed data |

**Total: 8+ hours, fragmented across 6+ tools**

### After SEND Hub

| Task | Time | How |
|------|------|-----|
| See all reviews due this month + preparation status | 2 mins | SEND Calendar dashboard |
| See which LA responses are overdue with statutory deadline tracking | 1 min | Automated alerts already sent |
| Generate EHCP evidence pack | 1 hour | Wizard pulls from MIS, auto-generates SENCO summary |
| Check funding status for all pupils | 2 mins | Reconciliation dashboard shows instantly |
| Update provision costs | 15 mins | Linked to staff timetable, auto-calculates |
| Generate annual review report | 30 mins | Pre-populated from provision data and assessments |
| Prepare for parent meeting | 10 mins | Pull up pupil's complete SEND profile |

**Total: ~2.5 hours, one tool. Saving: ~5.5 hours per day on admin-heavy days.**

---

## 5. Pricing Strategy

### Market Context

| Benchmark | Price Point |
|-----------|------------|
| Provision Map (market leader, provision mapping only) | £675-795/year |
| Earwig SENCO (evidence/assessment only) | £400-900/year |
| Earwig Gold (special schools, full suite) | £1,200-2,400/year + setup |
| CPOMS (safeguarding, comparison model) | ~£3/pupil/year |
| Arbor MIS Core (full MIS) | £2-3/pupil/year + base |
| Arbor MIS Perform (full MIS + analytics) | £9-10/pupil/year + base |

### Our Pricing (Recommended)

**Model: Flat annual subscription by school phase (not per-pupil)**

Schools prefer flat pricing for specialist tools — it's predictable and doesn't penalise schools with high SEND populations (who need the tool most).

| Tier | Target | Annual Price | What's Included |
|------|--------|-------------|-----------------|
| **SEND Essentials** | Small primary (under 200) | **£895/year** | SEN register, provision mapping, SEND calendar, annual review tracker, basic reporting |
| **SEND Professional** | Primary (200-500) | **£1,295/year** | Everything in Essentials + EHCP lifecycle manager + funding reconciliation + AI case building |
| **SEND Professional** | Secondary (500+) | **£1,795/year** | Everything in Professional, scaled for secondary caseloads |
| **SEND Professional** | Special school | **£1,995/year** | Full suite + specialist frameworks (B-Squared, Engagement Model integration) |
| **SEND Trust** | MAT (per school) | **£795-995/school/year** | Full Professional + cross-school benchmarking + trust-level reporting. Volume pricing. |

**Effective per-pupil cost**: £3-5/pupil/year (in line with CPOMS, well below MIS pricing)

### Justification: The ROI Argument

- Provision Map claims schools secure an average of **£15,500 additional funding** using their tool
- Our tool does that AND catches underpayments AND ensures correct band allocation
- Conservative estimate: **£10,000-30,000/year in recovered or correctly allocated funding** per school
- Against a subscription of £895-1,795: that's **6-30x ROI**
- Time saving for SENCO: **~6 hours/week** (133 hours/year) — equivalent to ~£4,000 in SENCO salary time
- **Total ROI: £14,000-34,000 per year** against a subscription of under £2,000

### Free Trial Strategy

- **30-day full-featured trial** (import your SEN data, see immediate reconciliation results)
- The "aha moment" is the first reconciliation: "You have 3 EHCP pupils not on the LA's funding schedule — that's potentially £18,000 in missing funding"
- After trial: data persists, but reconciliation and AI features lock

### Revenue Projections

| Scenario | Schools | Avg Revenue/School | Annual Revenue |
|----------|---------|-------------------|----------------|
| Year 1 (launch) | 200 schools | £1,200 | £240,000 |
| Year 2 (growth) | 800 schools | £1,300 | £1,040,000 |
| Year 3 (scale) | 2,500 schools | £1,200 | £3,000,000 |
| Year 5 (maturity) | 5,000 schools | £1,100 | £5,500,000 |

There are ~24,000 state schools in England. At 5,000 schools = ~21% market penetration. CPOMS achieved 20,000+ settings — the addressable market is there.

---

## 6. Why Schools Can't Say No

### The Pitch to the SENCO

> "You're spending 6 hours a week on SEND admin. Your school has 25 EHCP pupils but you've never checked if you're being paid correctly for all of them. Last year, 3 of your pupils' needs escalated but their bands weren't reviewed. That's potentially £15,000 in funding you didn't claim. SEND Hub does your reconciliation in 2 minutes, tracks every annual review deadline, and uses AI to tell you which pupils' evidence supports a higher band. It costs less than the funding you'll recover in the first month."

### The Pitch to the Headteacher

> "Our SENCO is drowning in paperwork. We're spending more on SEND provision than we're receiving in funding but we can't prove exactly where the gap is. SEND Hub gives us a complete financial picture — total SEN income vs expenditure, per-pupil gaps, and forecasted income. It generates the governor SEND report automatically. And it makes sure no EHCP pupil falls through the cracks on funding."

### The Pitch to the MAT CEO

> "You have 12 schools with 150+ EHCP pupils across the trust. Are you confident every one of them is correctly funded? SEND Hub gives you a trust-wide dashboard showing total SEND income, which schools have funding gaps, and where annual reviews are overdue. It benchmarks your schools against each other and against similar schools in each LA. One school recovering £20k in underfunding pays for the entire trust's subscription."

---

## 7. ISP Readiness: The 2030 Play

The government's 2026 Schools White Paper introduces **Individual Support Plans (ISPs)** replacing EHCPs from September 2030. The LGA has flagged that "current EHCP and case management systems are unlikely to be ISP-ready without upgrade or replacement."

### What ISPs Mean for Our Product

- ISPs will be **digital by default** — schools need a system that can generate and maintain digital plans
- ISPs are designed to be more **teacher-accessible** — not locked in a SENCO filing cabinet
- ISPs will require **real-time needs tracking** — not just annual review cycles
- The transition period (2026-2030) means schools need tools that handle BOTH EHCPs and ISPs

### Our Advantage

By building SEND Hub now with a flexible, modern architecture:
- We support EHCPs today AND can add ISP support as the spec becomes clear
- Schools that adopt us now won't need to switch tools when ISPs arrive
- We can influence the ISP digital standard through our installed base
- Competitors building on legacy architectures will struggle to adapt

---

## 8. The Complete Moat

| Layer | Moat Type | Difficulty to Replicate |
|-------|-----------|------------------------|
| **LA banding configurations** | Data moat | 151 LAs × annual updates × different systems. Years of data collection. |
| **AI case building** | Technology moat | Requires deep domain knowledge + training data from real EHCP applications. Ed already has SEND specialist agent. |
| **Embedded in Schoolgle ecosystem** | Platform moat | Already has MIS import, pupil pseudonymisation, School Intelligence Engine, staff directory, governance portal. A standalone tool can't match this. |
| **Cross-school benchmarking** | Network moat | Gets more valuable with every school. Can't be replicated without the installed base. |
| **SENCO workflow integration** | Switching cost | Once a SENCO has their entire SEND caseload in the system, switching is painful. (Provision Map users complain about manual migration.) |
| **ISP-ready architecture** | First-mover moat | Building for 2030 while competitors are stuck on 2015 architectures. |

---

## 9. Build Sequence (Suggested)

### Phase 1: Foundation (Months 1-2)
- SEND register with Arbor API, Arbor-exported connected sheet or CSV import
- LA banding configuration (start with Bradford and Leeds)
- Basic EHCP funding tracker (pupil × band × amount)
- SEND calendar with annual review due dates

### Phase 2: Financial Intelligence (Months 2-3)
- LA funding schedule import and auto-reconciliation
- Payment tracking and variance reporting
- Per-pupil funding gap analysis
- SENCO and SBM dashboards

### Phase 3: EHCP Lifecycle (Months 3-4)
- Graduated approach (APDR) tracking
- EHCP application builder with evidence checklist
- 20-week statutory timeline tracker
- Annual review workflow (preparation → meeting → submission → LA response tracking)

### Phase 4: AI Integration (Months 4-5)
- Ed SEND specialist: band validation against LA descriptors
- Case building for band escalation
- Application strength scorer
- Governor report auto-generation

### Phase 5: Scale (Months 5-6)
- Additional LA configurations (expand beyond Bradford/Leeds)
- Cross-school benchmarking (anonymised)
- Parent portal
- Income forecasting and scenario modelling

---

## 10. Technical Integration with Schoolgle

### Existing Components to Leverage

| Component | How It Connects |
|-----------|----------------|
| **Pupil Pseudonymiser** (`pupil-pseudonymiser.ts`) | HMAC-SHA256 hashing for SEND pupil data. Server never sees names. |
| **Pupil Assessment Analyser** (`pupil-assessment-analyser.ts`) | Gap analysis feeds into band validation — FSM/SEND/PP intersections |
| **School Intelligence Engine** (`school-intelligence-engine.ts`) | DfE data trends, cohort tracking, contextual factors |
| **Ed SEND Specialist Agent** (`agents.ts`) | Already has 60+ SEND routing keywords. Add funding skills. |
| **Skills Registry** (`school-skills-registry.ts`) | Add SEND Hub skill group (12 functions) |
| **Staff Directory** (`staff-directory.ts`) | Link provision costs to staff assignments |
| **Module Registry** (`registry.ts`) | Register as new module with accent colour and icon |
| **Protected Route Pattern** (`api-utils.ts`) | All API routes use existing auth middleware |
| **Supabase + RLS** | Organization-based access control for SEND data |

### Existing SEND Module (60-70% Built)

The codebase already contains a substantial SEND module with 4 database tables and full CRUD APIs:

| Component | Status | What It Does |
|-----------|--------|-------------|
| `send_register` table + `/api/send/register` | Built | Full SEN register: pupil_code, sen_status (K/E/monitoring), primary/secondary need, EHCP tracking, key_worker, parent_views, pupil_views |
| `send_graduated_approach` table + `/api/send/graduated-approach` | Built | APDR cycle tracking: 4-stage workflow (assess→plan→do→review), targets, outcomes, evidence references |
| `send_provision_map` table + `/api/send/provision-map` | Built | Costed provisions: intervention types, frequency, duration, cost, funding source, impact rating |
| `send_referrals` table + `/api/send/referrals` | Built | External agency referrals: 10 referral types, full lifecycle tracking, outcome recording |
| `/dashboard/send` page | Built | Multi-tab SENCO dashboard with register, provisions, referrals views |
| `/api/send/dashboard` | Built | SENCO dashboard statistics endpoint |
| Ed SEND Specialist Agent | Built | NASENCO-qualified AI persona with 30+ SEND keywords for routing |

### 14 Cross-Module Integration Points

SEND Hub is an **orchestration layer** — it connects existing modules rather than replacing them. Full details in `EVIDENCE_ECOSYSTEM.md`.

| # | Module | Integration | Key Value |
|---|--------|------------|-----------|
| 1 | **Meetings** | Annual review recording → AI transcript → evidence pack | Recorded meetings become submission-ready evidence |
| 2 | **Surveys** | Parent/pupil views questionnaires → linked to pupil | Statutory requirement met digitally, multi-language |
| 3 | **Document Production** | Auto-generate SENCO reports, one-page profiles, governor reports | Hours of Word template work → minutes |
| 4 | **Intelligence Engine** | Assessment gap analysis, cohort tracking, DfE benchmarks | Data-driven evidence for band validation |
| 5 | **Staff Directory** | Staff hourly rates → auto-calculate provision costs | Provision map costs always accurate and up-to-date |
| 6 | **Risk Register** | Risk assessments for complex needs pupils | Evidence of environmental modifications |
| 7 | **Compliance** | SEND policy, accessibility plan, SEN Information Report | Statutory documents linked to SEND profile |
| 8 | **Governance** | Governor SEND reports, monitoring visit records | Evidence of governor oversight |
| 9 | **Actions Hub** | Post-review actions with EEF-backed interventions | Track improvement actions with research backing |
| 10 | **SDP** | SEND priorities in school development plan | Strategic SEND goals linked to provision |
| 11 | **SEF** | SEND evidence feeds into self-evaluation | Automated SEF SEND sections |
| 12 | **Cloud Storage** | Auto-detect SEND documents in Google Drive/OneDrive | EP reports found in shared drives auto-linked |
| 13 | **Email Service** | LA deadline chasers, parent notifications, report requests | Automated communications when deadlines approach |
| 14 | **Behaviour Module** | Behaviour logs for SEMH pupils | Evidence of behavioural needs for EHCP applications |

### Database Tables

#### Already Built (migration: `20260311_safeguarding_attendance_send_behaviour.sql`)

```sql
-- These 4 tables already exist with full CRUD APIs
send_register (org_id, pupil_code, pupil_name, year_group, sen_status, primary_need, secondary_need,
               ehcp_start_date, ehcp_review_date, key_worker, parent_views, pupil_views, ...)
send_graduated_approach (register_id, cycle_number, stage, assess_date, plan_date, do_start,
                         review_date, targets, outcomes, evidence_refs, ...)
send_provision_map (register_id, provision_type, intervention_name, frequency, duration,
                    cost_per_session, funding_source, impact_rating, ...)
send_referrals (register_id, referral_type, agency_name, referral_date, status, outcome, ...)
```

#### New Tables Needed

```sql
-- LA banding configuration (the financial intelligence moat)
sen_funding_configs (la_code, la_name, funding_year, band_system_type, payment_schedule, notes)
sen_funding_bands (config_id, band_id, band_name, value_mainstream, value_special, value_arp, value_post16, descriptors)

-- Funding tracking (links to existing send_register)
sen_funding_allocations (register_id, funding_year, la_code, band_id, allocated_amount, actual_received, variance, notes)
sen_funding_schedules (org_id, la_code, period, import_date, raw_data, status, file_reference)

-- EHCP lifecycle (extends existing send_register)
sen_ehcp_applications (register_id, request_date, la_decision_date, assessment_start, draft_ehcp_date,
                       final_ehcp_date, status, evidence_score, timeline_status)
sen_annual_reviews (register_id, due_date, meeting_id, submitted_to_la_date, la_response_date,
                    outcome, band_change_requested, new_band_id, la_response_notes)

-- Evidence file storage (for external professional reports, photos, etc.)
sen_evidence_files (register_id, file_name, file_type, file_path, professional_name,
                    professional_role, report_date, ai_extracted_text, ai_summary, access_level, tags)
```

### API Routes

#### Already Built
```
/api/send/register          — Full CRUD for SEND register (GET, POST)
/api/send/register/[id]     — Individual pupil CRUD (GET, PUT, DELETE)
/api/send/dashboard         — SENCO dashboard statistics
/api/send/graduated-approach — APDR cycle CRUD (GET, POST)
/api/send/graduated-approach/[id] — Individual cycle CRUD (GET, PUT, DELETE)
/api/send/provision-map     — Costed provision CRUD (GET, POST)
/api/send/referrals         — External referral CRUD (GET, POST)
```

#### New API Routes Needed
```
/api/send/import             — Arbor API, connected sheet or CSV import
/api/send/funding/config     — LA banding configuration CRUD
/api/send/funding/bands      — Band values per LA per year
/api/send/funding/schedule   — Import/manage LA funding schedules
/api/send/funding/reconcile  — Run reconciliation engine
/api/send/funding/forecast   — Income projections + scenarios
/api/send/ehcp               — EHCP application lifecycle
/api/send/ehcp/[id]/timeline — 20-week statutory timeline
/api/send/reviews            — Annual review CRUD + tracking
/api/send/reviews/calendar   — Upcoming reviews with deadline status
/api/send/evidence           — File upload/management for external reports
/api/send/reports            — Dashboard, governor, and benchmarking reports
```

### Ed Skills (for AI Assistant)

```
SEND_HUB (12 functions):
-- Funding Intelligence
- get_send_register          — List all SEND pupils with status/band/funding
- run_funding_reconciliation — Compare school register vs LA schedule
- get_funding_forecast       — Project income based on current cohort
- validate_band_allocation   — AI check: does evidence support current band?
- build_escalation_case      — Generate evidence summary for band review

-- Evidence & Workflow
- score_ehcp_application     — Rate strength of EHCP evidence pack (0-100)
- get_missing_evidence       — What's missing from the evidence pack
- summarise_professional_reports — AI summary of uploaded EP/SALT/OT reports

-- Calendar & Tracking
- get_review_calendar        — Upcoming annual reviews and deadlines
- prepare_annual_review      — Pre-populate review pack from all modules
- track_ehcp_timeline        — 20-week application progress

-- Reporting
- generate_governor_report   — Auto-generate termly SEND report
```

---

## Sources

### Market & Pricing
- [Provision Map](https://www.provisionmap.co.uk/) — £675-795/yr
- [Earwig Academic Pricing](https://earwigacademic.com/price-list/) — £400-2,400/yr
- [CPOMS Pricing](https://www.cpoms.co.uk/pricing/) — ~£3/pupil/yr
- [Arbor MIS G-Cloud 14 Pricing](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/92647/565103461172958-pricing-document-2024-05-07-1029.pdf)
- [Bromcom G-Cloud 14 Pricing](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/93515/700712417558580-pricing-document-2025-02-13-1241.pdf)
- [Educater SENCO](https://www.educater.co.uk/software/senco/)
- [Senflow](https://www.senflow.co.uk/)
- [SEN Master](https://www.senmaster.co.uk/)

### SEND Context
- [nasen SENCO Survey 2024](https://nasen.org.uk/concero-school-offer) — 81% struggling with funding
- [EHCP Statistics 2025](https://explore-education-statistics.service.gov.uk/find-statistics/education-health-and-care-plans/2025) — 638,700 EHCPs
- [Schools Week: SENCOs on the Frontline](https://schoolsweek.co.uk/burnt-out-and-isolated-the-staff-on-the-send-crisis-frontline/)
- [Bath Spa SENCO Workload Report](https://www.bathspa.ac.uk/media/bathspaacuk/education-/research/senco-workload/SENCOWorkloadReport-FINAL2018.pdf)
- [IFS: Spending on SEN in England](https://ifs.org.uk/publications/spending-special-educational-needs-england-something-has-change)

### SEND Reform
- [Schools White Paper — SEND Reform 2026](https://educationhub.blog.gov.uk/2026/02/schools-white-paper-what-parents-need-to-know-about-changes-to-the-send-system/)
- [SEND Reform Consultation](https://www.gov.uk/government/consultations/send-reform-putting-children-and-young-people-first)
