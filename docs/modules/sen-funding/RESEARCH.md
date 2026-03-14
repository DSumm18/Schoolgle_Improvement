# SEN Funding Research: Building a SEN Finance Review Module

**Date:** 2026-03-14
**Focus:** Bradford and Leeds (West Yorkshire) Local Authorities
**Purpose:** Research to inform development of an out-of-the-box SEN Finance Review system

---

## Table of Contents

1. [How SEN Funding Works in England](#1-how-sen-funding-works-in-england)
2. [Bradford Council: SEN Funding Model](#2-bradford-council-sen-funding-model)
3. [Leeds City Council: SEN Funding Model](#3-leeds-city-council-sen-funding-model)
4. [School-LA Data Exchange & Reports](#4-school-la-data-exchange--reports)
5. [EHCP Annual Review & Reassessment Process](#5-ehcp-annual-review--reassessment-process)
6. [MIS Data (Arbor/SIMS/Bromcom)](#6-mis-data-arborsimsbromcom)
7. [Common Funding Issues & Reconciliation](#7-common-funding-issues--reconciliation)
8. [Post-16 SEN Funding Differences](#8-post-16-sen-funding-differences)
9. [Additionally Resourced Provisions (ARPs)](#9-additionally-resourced-provisions-arps)
10. [DfE Data Sources](#10-dfe-data-sources)
11. [Module Design Implications](#11-module-design-implications)

---

## 1. How SEN Funding Works in England

### The Three Elements of SEN Funding

SEN funding in England operates through a "Place-Plus" system with three layered elements:

#### Element 1: Core/Base Funding (AWPU)
- **Age Weighted Pupil Unit** — the basic per-pupil funding every school receives for each student
- For 2025-26, NFF AWPU values are approximately:
  - **Primary** (Key Stage 1 & 2): ~£3,680 per pupil
  - **Key Stage 3**: ~£5,196 per pupil
  - **Key Stage 4**: ~£5,842 per pupil
- This comes from the **Schools Block** of the Dedicated Schools Grant (DSG)
- Every pupil on roll generates Element 1 funding — including those with SEND

#### Element 2: Notional SEN Budget (the "£6,000 threshold")
- Schools are expected to fund up to **£6,000 per pupil per year** from their own budget for SEN support
- This is **not** a separate pot of money — it is a notional amount within the school's overall budget
- The LA identifies each school's notional SEN budget by combining portions of:
  - Basic entitlement (AWPU)
  - Deprivation funding (FSM, IDACI)
  - Low prior attainment factor (key proxy for SEN prevalence)
  - Lump sum allocation
- For 2025-26, the DfE requires LAs to allocate the notional SEN budget using these NFF factor weightings
- Schools must demonstrate they are using this £6,000 before requesting top-up
- **Key point for our module**: This £6,000 is notional — it doesn't mean a school gets £6,000 per SEN pupil. It's the amount they're expected to contribute from their overall budget before the LA provides additional funding

#### Element 3: Top-Up/High Needs Funding
- Paid by the LA from the **High Needs Block** of the DSG
- Triggered when a pupil has an EHCP (or, in some cases, SEN Support with exceptional needs)
- Calculated as: **Total cost of provision specified in EHCP minus £6,000 (Element 2) minus Element 1**
- In practice, most LAs use a **banding system** to determine the top-up amount
- For mainstream schools: top-up = band value (which already accounts for the £6,000 threshold)
- For special schools: **£10,000 place funding** (Elements 1+2 combined) + top-up

### The High Needs Block

- Part of the Dedicated Schools Grant (DSG), alongside Schools Block, Early Years Block, and Central Block
- For 2025-26: **£11.9 billion nationally** (9% cash increase on prior year)
- Allocated to LAs via the **High Needs National Funding Formula (NFF)** using proxy factors:
  - Population aged 2-18
  - Disability Living Allowance (DLA) rates
  - Health conditions
  - Low attainment at KS2 and KS4
  - Deprivation (IDACI and FSM)
  - Historic spend (50% weighting on 2017-18 baseline, reducing over time)
- The LA then distributes this to schools via place funding + top-up
- **Bradford's High Needs Block 2025-26**: Part of total DSG allocation of ~£760m
- **Leeds' High Needs Block 2025-26**: Part of their DSG (Leeds is one of the largest LAs)

### How Funding Flows

```
DfE (ESFA)
    │
    ├── Schools Block ──→ LA ──→ School Budget (includes Element 1 + Element 2 notional)
    │
    └── High Needs Block ──→ LA ──→ Place Funding (Element 1+2 for special/AP)
                                  └──→ Top-Up (Element 3) per EHCP pupil
```

---

## 2. Bradford Council: SEN Funding Model

### Bradford's EHCP Banded Model

Bradford introduced their current **Banded Model** in April 2020, replacing the previous "Ranges Model" which had 7 ranges with 7 funding steps.

#### Structure: 6 Bands, 6 Funding Steps

The banded model has **6 bands** (Band 1 to Band 6) with increasing levels of need and funding:

| Band | Top-Up Value (indicative) | Description |
|------|--------------------------|-------------|
| Band 1 | Lowest | Mild/moderate needs that can be mostly met within school's SEN budget |
| Band 2 | Low-moderate | Needs requiring some additional specialist support |
| Band 3 | Moderate | Significant needs requiring regular specialist intervention |
| Band 4 | Moderate-high | Complex needs requiring substantial specialist support |
| Band 5 | High | Very complex needs requiring intensive support |
| Band 6 | Highest | Exceptional/profound needs requiring maximum support |

**Note**: Exact £ values are set annually by Bradford Council via Schools Forum and published in the budget documents. The key documents are:
- **"The EHCP Banded Model for Funding Pupil-Led Need Top-up"** — published annually as an appendix to the Schools Budget
- Available at: `bradford.moderngov.co.uk` (search for EHCP Banded Model Appendix 3)
- Latest confirmed: 2024/25 version (ID=46338), 2023/24 (ID=40945), 2022/23 (ID=36784)

#### Key Features of Bradford's Model
- **Protections**: No EHCP in place on 1 April 2020 reduced in value due to model change
- **Separate rates** for mainstream vs special school placements
- **Band descriptors** define expected levels of support at each band
- Bands are assigned during the EHCP process by the SEND Panel
- Annual review can trigger band reassessment

### Bradford EHCP Process & Timelines
- Schools/parents can request an EHC Needs Assessment via Bradford's **Capita SEND Portal**
- **20-week statutory timeline** from request to final EHCP
- Key checkpoints:
  - Week 6: Decision on whether to assess
  - Week 16: Draft EHCP issued
  - Week 20: Final EHCP issued
- **Annual reviews** must be completed within 12 months of the EHCP being issued/last review
- Bradford uses Schools Forum to agree funding rates each year

### Bradford's Schools Budget Context
- 2024/25: Total Schools Budget of **£759.852m** was approved
- High Needs Block is a significant and growing proportion
- Bradford has been a Safety Valve/DfE high needs management area

### Key Bradford Contacts & Systems
- **SEND Portal**: Capita-based online system for EHCP requests, consultations, and reviews
- **Schools Forum**: Approves budget allocations including banding rates
- **Local Offer website**: `localoffer.bradford.gov.uk` — SEN Funding page
- **Bradford Schools Online (BSO)**: `bso.bradford.gov.uk` — for school-facing documents

---

## 3. Leeds City Council: SEN Funding Model

### Leeds' Funding for Inclusion (FFI) System

Leeds uses a distinctive model called **Funding for Inclusion (FFI)**, managed by the Special Educational Needs Statutory Assessment and Provision (SENSAP) team.

**Critical difference from most LAs**: FFI is **not dependent on having an EHCP**. It is based on assessed need, meaning schools can receive top-up funding for pupils on SEN Support without an EHCP.

#### FFI Bands — 7 Areas of Need

Unlike Bradford's numeric bands, Leeds categorises by **area of need**:

| Band | Area of Need | Description |
|------|-------------|-------------|
| **A Band** | Cognition & Learning (C&L) | Learning difficulties, specific learning difficulties |
| **B Band** | Vision (VI) | Visual impairment needs |
| **C Band** | Hearing (HI) | Hearing impairment needs |
| **D Band** | Physical Skills (PD) | Physical disability needs |
| **E Band** | Communication & Interaction (C&I) | Speech, language, communication needs; autism |
| **F Band** | Social, Emotional & Mental Health (SEMH) | Behavioural, emotional, mental health needs |
| **G Band** | Multi-Sensory Impairment (MSI) | Combined sensory needs |

Each band has **multiple levels** within it (e.g., Level 1, Level 2, Level 3+) with increasing funding amounts. A child can receive funding from **more than one band** simultaneously.

#### FFI Funding Levels
- Leeds publishes FFI funding level documents annually: **"EYFFI / FFI Funding Levels"**
- Available from: `leedsforlearning.co.uk` (Key Information & Funding Levels page)
- Latest: 2024/25 funding levels document published July 2024
- Provisional allocations are sent to schools each year

#### SENDIF+ (New from April 2025)
- A new funding model called **SENDIF+** was introduced from 1 April 2025
- Supports children aged 9 months to school age with complex needs
- Can be accessed through the EHC needs assessment (EHCNA) process
- Decision on SENDIF+ allocation made within **6 weeks** of EHCNA request
- Following EHCNA completion, SENDIF+ funding level may be adjusted if an EHCP is issued

### Leeds EHCP Process & Timelines
- Requests made to **SENSAP** team
- Parents, carers, young people (16+), or professionals can request
- Standard **20-week statutory timeline**
- Leeds emphasises the **Graduated Approach** (Assess → Plan → Do → Review) before EHCP referral
- **Key resource**: Leeds Local Offer (`leedslocaloffer.org.uk`)
- **SENDIASS**: Leeds SENDIASS provides independent advice (`sendiass.leeds.gov.uk`)

### Leeds SEND and Inclusion Transformation
- Leeds is currently undergoing a **SEND and Inclusion Transformation** programme
- Includes reforms to how funding is allocated
- Schools should check `leedslocaloffer.org.uk/education/send-and-inclusion-transformation` for updates

### Key Leeds Contacts & Systems
- **SENSAP**: Manages FFI and statutory assessments
- **Leeds for Learning**: `leedsforlearning.co.uk` — school-facing portal with FFI documents
- **Leeds Local Offer**: `leedslocaloffer.org.uk` — parent/public-facing
- **Leeds SENDIASS**: Independent advice service
- **Leeds Schools Forum**: Approves high needs budget

---

## 4. School-LA Data Exchange & Reports

### What LAs Send to Schools

1. **Funding Allocation Statement / Schedule**
   - Sent annually (usually spring term for the following financial year)
   - Lists each pupil with an EHCP and their allocated band/funding level
   - Typical fields:
     - Pupil name / UPN
     - Date of birth
     - EHCP start date
     - Band/level allocated
     - Top-up amount (£ per annum, usually paid termly or monthly)
     - Start date of current funding
     - Primary need type
     - Placement type (mainstream, resourced, special)

2. **Termly/Monthly Payment Schedules**
   - Shows actual payments being made
   - May include pro-rata calculations for mid-term starters/leavers
   - Adjustments for pupils who have left or transferred

3. **EHCP Consultation Requests**
   - When LA is considering placement at the school
   - School has 15 days to respond

4. **Annual Review Notifications**
   - LA confirms review due dates
   - Post-review: confirms whether EHCP maintained, amended, or ceased

### What Schools Submit to LAs

1. **School Census** (3x per year via MIS → DfE COLLECT)
   - SEN Status: N (No SEN), K (SEN Support), E (EHCP)
   - Primary Need Type code (see section 6)
   - SEN Provision mapping

2. **Annual Review Paperwork**
   - School hosts the review meeting
   - Submits: updated provision costs, progress data, professional reports
   - Recommendation: maintain, amend, or cease the EHCP
   - Must submit within 2 weeks of the review meeting

3. **EHCP Request Evidence** (for new assessments)
   - Graduated Approach evidence (Assess/Plan/Do/Review cycles)
   - Costed provision map showing £6,000+ spend
   - Professional assessments (EP, SaLT, etc.)
   - Pupil progress data

4. **Provision Cost Evidence**
   - Some LAs require schools to demonstrate how top-up funding is spent
   - Staff costs allocated to the pupil
   - Resources, equipment, therapy costs

### Data Verification Points (for our module)

Schools should be able to cross-reference:

| School Data | LA Data | Check |
|------------|---------|-------|
| SEN register (pupils with EHCPs) | LA funding schedule | Every EHCP pupil funded? |
| EHCP band recorded in MIS | Band on LA schedule | Bands match? |
| Actual funding received (bank) | Expected funding per schedule | Payments correct? |
| Pupil on roll | LA funding schedule | No funding for leavers? Getting funding for new starters? |
| Annual review dates | LA review due dates | Reviews on track? |
| Primary need in MIS | Primary need on EHCP | Codes aligned? |

---

## 5. EHCP Annual Review & Reassessment Process

### Standard Annual Review Timeline

1. **School convenes review meeting** — must be within 12 months of EHCP issue/last review (6 months for under-5s)
2. **Invite participants** — at least 2 weeks' notice (parents, LA rep, health, social care, other professionals)
3. **Gather reports** — school sends request for advice to all parties at least 2 weeks before
4. **Hold meeting** — discuss outcomes, provision, progress, any changes needed
5. **School sends paperwork to LA** — within 2 weeks of meeting
6. **LA decision** — within 4 weeks of receiving paperwork:
   - **Maintain** — EHCP unchanged
   - **Amend** — EHCP updated (may include band change)
   - **Cease** — EHCP discontinued (needs met without it)

### When Funding Bands Can Change

- **At annual review**: Most common trigger. School/parents can request reassessment if needs have changed
- **During the year**: Emergency/interim reviews can be requested by school, parent, or LA
- **Key transitions**: Year 6→7 (primary to secondary), Year 11→12 (post-16)
- **Triggers for upward band change**:
  - New diagnosis
  - Deteriorating condition
  - Evidence that current provision is insufficient
  - Increased complexity (e.g., additional need layered on)
- **Triggers for downward band change**:
  - Good progress — needs being met at lower level
  - Removal of a need category
  - Change in placement type

### Who Can Request Reassessment
- The school (via SENCO)
- Parents/carers
- The young person (if 16+)
- Health or social care professionals
- The LA themselves (e.g., following SEN2 data review)

### Emergency/Interim Reviews
- Can be requested at any time when there is a significant change in needs
- Examples: medical emergency, school exclusion risk, breakdown of placement
- Same process as annual review but expedited
- LA should respond within 4 weeks

### What Our Module Should Track
- Annual review due dates (12-month cycle from last review)
- Review outcome and any band change
- Whether LA has responded within statutory timeframes
- Whether band change has been reflected in funding payments
- Whether the school has evidence to support a band change request

---

## 6. MIS Data (Arbor/SIMS/Bromcom)

### SEN Data Fields in School Census

The school census captures these SEN-related fields for each pupil:

| Field | Values | Notes |
|-------|--------|-------|
| **SEN Provision** | N (No SEN), K (SEN Support), E (EHCP) | Statutory — must be accurate |
| **SEN Primary Need** | DfE code (see below) | Required for K and E pupils |
| **SEN Secondary Need** | DfE code (optional) | Additional need if applicable |
| **SEN Unit/RP indicator** | Yes/No | Whether pupil is in a resourced provision |
| **Member of SEN Unit** | Yes/No | Specific unit membership |
| **Resourced Provision** | Yes/No | In a resourced provision |

### DfE SEN Primary Need Codes

| Code | Need Type | Category |
|------|-----------|----------|
| SPLD | Specific Learning Difficulty | Cognition & Learning |
| MLD | Moderate Learning Difficulty | Cognition & Learning |
| SLD | Severe Learning Difficulty | Cognition & Learning |
| PMLD | Profound & Multiple Learning Difficulty | Cognition & Learning |
| SEMH | Social, Emotional & Mental Health | SEMH |
| SLCN | Speech, Language & Communication Needs | Communication & Interaction |
| ASD | Autistic Spectrum Disorder | Communication & Interaction |
| HI | Hearing Impairment | Sensory & Physical |
| VI | Visual Impairment | Sensory & Physical |
| MSI | Multi-Sensory Impairment | Sensory & Physical |
| PD | Physical Disability | Sensory & Physical |
| OTH | Other Difficulty/Disability | Other |

### How Arbor Stores SEN Data

Based on Arbor Help Centre documentation:
- **SEN Status**: Set at student profile level (N, K, E)
- **SEN Need Types**: Mapped to DfE codes with primary/secondary designation
- **EHCP**: Separate record with start date, review dates
- **Funding**: Can record student funding records (school-led, national tutoring programme, etc.)
- **Census module**: Validates SEN data before submission
- **SEN Register**: Exportable list of all SEN pupils with their statuses and need types
- **Migration**: When switching from SIMS to Arbor, SEN data (including historical statuses and EHCP records) is migrated

### How SIMS Stores SEN Data

- SEN registration with status and dates
- Need types linked to DfE codes
- EHCP record with statutory dates
- Provision mapping capability
- Census module validates and submits

### How Bromcom Stores SEN Data

- Student profile SEN section
- Census guide maps SEN fields
- Spring 2026 Census Guide available in documentation centre
- Similar structure to SIMS/Arbor

### Data Our Module Could Import From MIS

A CSV export from any MIS should include:
```
UPN, Surname, Forename, DOB, YearGroup, SEN_Status, Primary_Need, Secondary_Need,
EHCP_Start_Date, Last_Review_Date, Next_Review_Due, Funding_Band, LA_Allocation_Amount,
School_Provision_Cost, Notes
```

---

## 7. Common Funding Issues & Reconciliation

### Common Problems Schools Face

1. **Underfunding / Incorrect Band**
   - Child's needs have escalated but band hasn't been reviewed
   - LA has applied a lower band than the evidence supports
   - School is spending significantly more than the top-up provides

2. **Missing Pupils from Funding Schedule**
   - Pupil has EHCP but doesn't appear on LA payment schedule
   - Common after mid-year admissions or transfers from other LAs
   - Delay between EHCP being issued and funding starting

3. **Overpayment for Leavers**
   - School continues receiving funding after pupil has left
   - Must be repaid — but schools should check timing

4. **Payment Timing Issues**
   - Top-up paid termly in arrears vs. monthly in advance (varies by LA)
   - Pro-rata calculations for part-year pupils may be incorrect
   - New EHCPs: delay between EHCP finalisation and first payment

5. **Transition Gaps**
   - Year 6→7: Funding may not transfer smoothly between primary and secondary
   - Cross-LA transfers: Different banding systems, delays in LA-to-LA communication
   - Post-16: Different funding mechanism (ESFA) creates a gap

6. **Census Data Mismatches**
   - SEN Status in MIS doesn't match LA records
   - Wrong primary need code (affects future funding calculations)
   - Pupils shown as SEN Support (K) who should be EHCP (E)

### Reconciliation Process for Schools

**Monthly/Termly checks:**
1. Match SEN register against LA funding schedule — every EHCP pupil should have funding
2. Verify band/level matches what was agreed at last annual review
3. Check payment amounts match the published band values
4. Verify payments received in bank match the schedule
5. Check for any pupils who have left but are still being funded (flag for repayment)
6. Check for new starters with EHCPs who are not yet on the funding schedule

**Annual checks:**
1. Verify the notional SEN budget calculation is correct (check NFF factors)
2. Cross-reference total SEN expenditure against total SEN funding
3. Identify any unfunded EHCP provision (gap between cost and funding)
4. Check all annual reviews are on track (none overdue)
5. Review whether any pupils' needs have changed enough to warrant band review

### What Our Module Should Calculate

For each EHCP pupil:
```
Expected Annual Income = Band Value (from LA schedule)
Actual Provision Cost = Staff hours × hourly rate + resources + therapies
Funding Gap = Provision Cost - Band Value - £6,000 notional contribution
```

For the school overall:
```
Total EHCP Top-Up Income = Sum of all band values
Total Notional SEN Budget = LA's calculation of Element 2
Total SEN Expenditure = All SEN-related costs
Net SEN Position = (Top-Up + Notional) - Expenditure
```

---

## 8. Post-16 SEN Funding Differences

### Key Differences from Pre-16

- **Element 1**: Changes to the 16-19 funding formula (different AWPU calculation)
- **Element 2**: £6,000 threshold still applies but via different mechanism
- **Place funding**: Special post-16 institutions receive £10,000 per place (same as pre-16 special)
- **Top-up**: Still paid by the LA from High Needs Block
- **ESFA role**: The Education & Skills Funding Agency plays a bigger role in post-16
- **Study programmes**: Funding linked to study programme hours
- **EHCPs continue**: Can be maintained until age 25

### Sixth Form Colleges: The Key Issue

The Sixth Form Colleges Association has highlighted that SEND funding is one of the "key issues" for the sector:
- Element 2 funding is less transparent in FE/sixth form
- Some institutions absorb more SEN costs than funded
- Post-16 transition is a known gap in the system

### Implications for Our Module
- Need to handle different funding calculations for post-16 pupils
- Track EHCP transition from school phase to post-16 phase
- Alert when Year 11 pupils with EHCPs are approaching transition

---

## 9. Additionally Resourced Provisions (ARPs)

### What is an ARP?

An Additionally Resourced Provision (ARP) is a specialist unit within a mainstream school:
- Provides targeted support for pupils with particular needs (e.g., autism, hearing impairment)
- Pupils are on roll at the mainstream school
- Can access mainstream lessons alongside specialist support
- Commissioned by the LA with agreed number of places

### ARP Funding Model

- **Place funding**: £10,000 per agreed place (same as special school)
- **Top-up funding**: Per pupil, based on individual need level (banded)
- **Empty place funding**: Schools may still receive place funding for unfilled places (varies by LA agreement)
- **This is different from mainstream**: Mainstream schools don't get place funding, only AWPU + top-up

### Implications for Our Module
- Need to distinguish between mainstream EHCP pupils and ARP pupils
- Different funding calculations for ARP places
- Track occupancy vs. commissioned places

---

## 10. DfE Data Sources

### Available Data Sets

| Dataset | Records | Key Fields for SEN |
|---------|---------|-------------------|
| **SEN2 Return** | Annual LA return | EHCP volumes, timelines, placements, need types, age profiles |
| **School Census** | 3x per year | Pupil-level SEN status, need type, provision |
| **High Needs Allocations** | Annual | LA-level HNB allocation, place numbers |
| **School Funding Statistics** | Annual | Per-school notional SEN budget |
| **LA Expenditure** | Annual | How LAs spend their HNB |
| **EHCP Statistics** | Annual | National/LA trends in EHCPs |

### SEN2 Return Data

The SEN2 is a statutory return that LAs must submit annually to the DfE. Key data collected:
- Total EHCPs by the LA
- New EHCPs issued during the year
- EHCPs ceased during the year
- Timeliness of assessments (% completed within 20 weeks)
- Placement types
- Need type breakdowns
- Age profiles
- Mediation and tribunal data

**2025 headline data (England)**:
- 22.5% rise in pupils "educated elsewhere" than in schools
- Continued growth in EHCP numbers nationally
- Many LAs not meeting 20-week timeliness targets

### Relevant DfE URLs
- School Census data items: `gov.uk/guidance/complete-the-school-census/data-items-2025-to-2026`
- High needs operational guide: `gov.uk/government/publications/high-needs-funding-arrangements-2025-to-2026`
- Notional SEN budget guidance: `gov.uk/government/publications/pre-16-schools-funding-local-authority-guidance-for-2025-to-2026`
- EHCP statistics: `explore-education-statistics.service.gov.uk/find-statistics/education-health-and-care-plans`
- SEN in England: `explore-education-statistics.service.gov.uk/find-statistics/special-educational-needs-in-england`

---

## 11. Module Design Implications

### Core Features Needed

Based on this research, the SEN Finance Review module should provide:

#### 1. Pupil-Level EHCP Funding Register
- Import from MIS (Arbor/SIMS/Bromcom CSV export) or LA report
- Fields: UPN, name, DOB, year group, SEN status, primary need, EHCP start date, band, funding amount
- Track each pupil's funding journey over time

#### 2. LA Funding Schedule Import & Reconciliation
- Import LA funding allocation schedules (CSV/Excel)
- Auto-match to school's SEN register by UPN
- Flag discrepancies: missing pupils, wrong bands, wrong amounts
- Calculate expected vs. actual funding

#### 3. Funding Forecasting
- Project income based on current EHCP cohort
- Model scenarios: new EHCPs expected, pupils leaving, band changes
- Monthly/termly/annual income projections
- Alert for upcoming annual reviews that could change funding

#### 4. Band Validation & Recommendation Engine
- Based on the pupil's needs profile and provision costs, suggest whether the band is appropriate
- Flag pupils where provision cost significantly exceeds funding
- Suggest whether to request a band review at next annual review
- Compare against LA band descriptors

#### 5. Annual Review Tracker
- Calendar of all review due dates
- Track review status: due, overdue, completed, awaiting LA decision
- Time since review vs. statutory limits
- Track whether LA responded within 4 weeks

#### 6. Financial Dashboard
- Total EHCP income (actual and projected)
- Total SEN expenditure vs. income
- Per-pupil funding gap analysis
- Notional SEN budget utilisation
- Trend data over time

#### 7. LA-Specific Configuration
- Configurable banding systems (Bradford's 6 bands, Leeds' 7 area bands, etc.)
- Configurable band values (updated annually)
- Different calculation models for mainstream vs. ARP vs. special
- Post-16 funding calculations

#### 8. Transition Planning
- Year 6 and Year 11 EHCP pupils approaching transition
- Funding timeline showing when current funding ends
- Checklist for transition requirements

### Data Model (Key Entities)

```
sen_funding_config (per LA)
├── la_code, la_name
├── funding_year
├── band_system_type (numeric/area-based)
├── bands[] { band_id, band_name, band_value_mainstream, band_value_special, band_value_arp }
└── payment_schedule (termly/monthly)

pupil_ehcp_funding (per pupil per school)
├── pupil_id (pseudonymised), upn
├── ehcp_start_date, ehcp_status
├── current_band, current_funding_amount
├── primary_need_code, secondary_need_code
├── placement_type (mainstream/arp/special)
├── annual_review_due_date, last_review_date
├── la_schedule_amount, actual_received_amount
└── provision_cost_estimate

funding_reconciliation (per term/month)
├── period, pupil_id
├── expected_amount, received_amount
├── variance, variance_reason
└── action_required

funding_forecast
├── school_id, forecast_date, period
├── current_ehcp_count, projected_ehcp_count
├── current_monthly_income, projected_monthly_income
├── scenario (baseline/optimistic/pessimistic)
└── assumptions[]
```

### Integration Points

1. **MIS Import**: CSV from Arbor/SIMS/Bromcom (SEN register + EHCP data)
2. **LA Schedule Import**: CSV/Excel of funding allocations
3. **DfE Data**: Link to published band values and LA allocation data
4. **School Intelligence Engine**: Cross-reference with existing cohort data
5. **Pupil Assessment Analyser**: Link pseudonymised assessment data with funding profiles
6. **Estates**: No direct link, but SEN provision may require specific spaces/equipment

### Privacy Considerations

- **Pupil names**: Use existing pseudonymisation approach (HMAC-SHA256)
- **Funding data**: Sensitive — restrict to SBM, SENCO, Headteacher, Finance
- **LA data**: Public (funding schedules are shared with schools)
- **GDPR basis**: Legitimate interest (financial management) + legal obligation (SEN duties)

---

## Sources

### Government Guidance
- [Notional SEN budget guidance 2025-26](https://www.gov.uk/government/publications/pre-16-schools-funding-local-authority-guidance-for-2025-to-2026/the-notional-sen-budget-for-mainstream-schools-operational-guidance-2025-to-2026)
- [High needs funding operational guide 2025-26](https://www.gov.uk/government/publications/high-needs-funding-arrangements-2025-to-2026/high-needs-funding-2025-to-2026-operational-guide)
- [Schools operational guide 2025-26](https://www.gov.uk/government/publications/pre-16-schools-funding-local-authority-guidance-for-2025-to-2026/schools-operational-guide-2025-to-2026)
- [School Census data items 2025-26](https://www.gov.uk/guidance/complete-the-school-census/data-items-2025-to-2026)
- [NFF Policy Document 2025-26](https://assets.publishing.service.gov.uk/media/674f2609d7e2693e0e47d02a/NFF_Policy_document.pdf)

### Bradford
- [Bradford Local Offer - SEN Funding](https://localoffer.bradford.gov.uk/kb5/bradford/directory/service.page?id=pSTkLaRdAfs)
- [Bradford EHCP Banded Model 2024/25](https://bradford.moderngov.co.uk/mgConvert2PDF.aspx?ID=46338)
- [Bradford Schools Forum Budget Documents](https://bradford.moderngov.co.uk)
- [Bradford Local Offer - EHCP Process](https://localoffer.bradford.gov.uk/kb5/bradford/directory/service.page?id=cCtkWJH-QUY)

### Leeds
- [Leeds Inclusion Funding for SEND](https://www.leeds.gov.uk/schools-and-education/support-for-pupils-with-send/support-with-learning/inclusion-funding-for-send)
- [Leeds FFI Funding Levels](https://www.leedsforlearning.co.uk/Page/17424)
- [Leeds EHCP Information](https://www.leeds.gov.uk/schools-and-education/support-for-pupils-with-send/support-with-learning/education-health-and-care-needs-assessments-and-plans)
- [Leeds SENDIASS - FFI Information](https://sendiass.leeds.gov.uk/send-funding-ffi)
- [Leeds SEND Transformation](https://www.leedslocaloffer.org.uk/education/send-and-inclusion-transformation)

### Other Useful Sources
- [EHCP Banded Funding FAQ (Sheffield)](https://www.learnsheffield.co.uk/Partners/inclusion-task-force/Downloads/EHCP%20Banded%20Funding%20-%20Information%20and%20FAQ.pdf)
- [SEN Funding Guide (KIDS)](https://www.kids.org.uk/sendiass/advice/sen-funding/)
- [Understanding Notional SEN Budget (SENsible SENCO)](https://sensiblesenco.org.uk/understanding-notional-sen-budget/)
- [Funding Bands and EHCPs (Boyes Turner Solicitors)](https://www.senexpertsolicitors.co.uk/site/news/funding-bands-and-education-health-and-care-plans)
- [Arbor SEN Help Centre](https://support.arbor-education.com/hc/en-us/articles/203863481-Adding-SEN-Special-Educational-Need-and-EHCP-for-a-student)
