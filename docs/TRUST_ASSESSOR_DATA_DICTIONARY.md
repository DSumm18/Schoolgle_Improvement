# Trust Assessor data dictionary

Last reviewed: 15 May 2026

This document explains what each Trust Assessor layer is using, where the data comes from, what it populates, and what a school/trust needs to provide to unlock the richer analysis. It exists because Trust Assessor must be demoable and auditable: every number needs a labelled source, and no school should be judged from hidden, hard-coded, or mixed-year assumptions.

## Product principle

Trust Assessor has three distinct lenses:

1. **Published DfE lens** — rear-view, externally validated data. Useful for out-of-the-box setup, trust triage, LA comparison and historic challenge.
2. **School-submitted assessment lens** — current in-year teacher assessment snapshots, usually trust spreadsheets or in-app capture. Useful for “where are we now?” conversations, but requires moderation/evidence before high-stakes claims.
3. **Per-pupil MIS/CTF lens** — granular pupil-level journey and demographic analysis. This is the strongest layer for explaining gaps, cohorts and Ofsted readiness, but only appears when the school has uploaded/connected pupil-level data.

These lenses should be shown together, but not blended silently. A public 2024/25 KS2 value, a 2025/26 mid-year spreadsheet value, and a pupil-level CTF/MIS value are different evidence types.

## Non-negotiable data integrity rule

Do not cap, suppress, sample, or otherwise limit pupil records or evidence records in a way that changes headline counts, calculations, charts, or analysis.

Display limits are allowed only for usability, for example pagination, virtualised tables, or collapsed sections. If a view only renders part of a dataset it must still calculate from the full validated source and clearly say what is being shown, e.g. "showing 50 of 473 pupils".

If counts differ across the product, explain the source and scope difference instead of forcing them to match:

- DfE census roll is not the same as a school-submitted assessment capture count.
- A trust spreadsheet cohort count is not the same as the current pseudonymised pupil profile layer.
- Evidence points are not pupils.
- Pupil records with usable assessment evidence are not necessarily the full school roll.

Earlier prototype display caps were introduced to keep screens responsive/readable during development. They must not be treated as product logic. The product must show the data as it is, with labels and caveats.


## Confirmed PAYMAT data currently stored

PAYMAT parent organization: `PAYMAT — Pennine Academies Yorkshire`

| Layer | Stored data | What I found |
| --- | --- | --- |
| Trust spreadsheet uploads | `trust_spreadsheets` | Two captures: `autumn_term` from `26.xlsx` and `mid_year` from `Trust mid year Data Capture 2025_26 (2).xlsx`. |
| Trust spreadsheet fields | `trust_spreadsheets.parsed_data` | Schools: `CHPS`, `CVPS`, `FPS`, `GHPS`, `HPS`, `LGPS`, `LPS`. Year groups: EYFS and Years 1-6. Sections: `cohort`, `all_pupils`, `fsm6`, `not_fsm6`. |
| EAL in trust spreadsheet | Not present | The uploaded PAYMAT spreadsheets contain no EAL fields and no EAL/non-EAL attainment split. |
| EHCP/SEND/FSM in trust spreadsheet | Present | Cohort fields include `number_send`, `ehcp`, `number_fsm`, `number_in_cohort`. |
| Grove House pupil layer | Present | `pupil_assessments_pseudo`, `ls_pupils`, `pupil_assessment_events`, `assessment_source_batches`, and school assessment captures exist for Grove House. |
| Hollingwood pupil layer | Not present | Hollingwood has school assessment captures seeded from the trust spreadsheet, but no per-pupil pseudo records, no `ls_pupils`, no pupil assessment events, and no source batches. |

## Main data sources

| Source | Table/API | Owner | Used for | Confidence |
| --- | --- | --- | --- | --- |
| School org tree | `organizations`, `/api/organizations/children` | Schoolgle | Which schools a trust/user can see; URN-to-organization mapping; logo/name/sidebar scope. | High if org membership and URNs are correct. |
| GIAS/profile | `schools` | DfE import via Schoolgle warehouse | Phase, school type, LA, URN, trust/LA context, headteacher metadata, website. | High, but only as current imported snapshot. |
| KS2 outcomes | `ks2_results`, `/api/trust-analysis`, `/api/trust-analysis/public-data-report` | DfE warehouse | Primary RWM+, Reading, Writing, Maths; historic comparison; LA/national benchmarks; school public-data cards. | High where `is_suppressed=false` and row is available. |
| KS4 outcomes | `ks4_results`, `/api/trust-analysis/public-data-report` | DfE warehouse | Secondary Attainment 8, Progress 8 where populated, English/maths threshold, EBacc. | Medium/high; Progress 8 may be blank until mapped/imported. |
| Census context | `census`, `/api/trust-analysis`, `/api/trust-analysis/public-data-report` | DfE warehouse | NOR, FSM %, EAL %, SEN %, LA/national comparators, demographic snapshot. | High for school-level context; not pupil-level attainment. |
| Attendance | `attendance`, `/api/trust-analysis/public-data-report` | DfE warehouse | Overall attendance, absence, persistent absence, LA/national comparator, public-data heatmap. | High for published year. |
| Trust spreadsheet | `trust_spreadsheets` | School/trust upload | Current in-year attainment and cohort counts across trust. | Medium; self-reported, not externally validated. |
| In-app captures | `school_assessment_captures`, `school_assessment_cells` | Schoolgle-managed workflow | School-level locked snapshots seeded from spreadsheets or entered in-app. | Medium/high depending moderation; values are auditable and locked. |
| Per-pupil assessments | `pupil_assessments_pseudo` | School import via CTF/MIS | Pseudonymised pupil journey, FSM/SEND/EAL/gender flags where supplied, EYFS/KS1/KS2 trajectory. | High for uploaded source, privacy-safe, no pupil names server-side. |
| Pupil profile layer | `ls_pupils` | Schoolgle/MIS/class profile | Current pupil demographics, EHCP/SEND/EAL/PP, current reading/writing/maths fields. | Medium/high depending MIS freshness. |
| Teacher-locked events | `assessment_source_batches`, `pupil_assessment_events` | Schoolgle class assessment workflow | Teacher judgement snapshots, source labels, validation tiers and evidence timeline. | High for audit trail; still school-assessed. |
| AI narrative | `/api/trust-assessor/narrative` | Schoolgle AI workflow | Summaries of loaded, labelled data. | Advisory only; must cite source data and should not invent metrics. |

## Visible product areas

### 1. Trust / LA public-data heatmap

| Field | Source | Calculation | Notes |
| --- | --- | --- | --- |
| KS2 RWM+ | `ks2_results.expected_standard_pct` where subject is `Reading, writing and maths`, breakdown topic `All pupils`, breakdown `Total` | Direct percentage for selected `academic_year_end` | Combined RWM+ means pupils meeting expected+ in Reading, Writing and Maths together, not an average. |
| Reading/Writing/Maths | `ks2_results.expected_standard_pct` by subject | Direct percentage for selected year | Suppressed/missing rows show `—`. |
| Attendance | `attendance.overall_attendance_pct`, fallback `100 - overall_absence_pct` | Direct or derived percentage | Year-aligned to selected DfE year where available. |
| PA | `attendance.persistent_absence_pct` | Direct percentage | Lower is better. |
| FSM/SEND/EAL | `census.fsm_pct`, `census.sen_pct`, `census.eal_pct` | Direct percentages | Context only; does not tell us whether those groups achieved expected standard. |
| LA average | Same DfE table filtered to school’s LA and phase | Average of available rows | Must update with selected year and the school/trust LA. |
| National average | Same DfE table across open schools of matching phase where available | Average of available rows | Must update with selected year. |
| Colour | Current value vs LA/national threshold/comparator | Product rules | Colours are triage signals, not inspection grades. |

### 2. Published DfE context flags

This is the “look here first” layer. It should not claim current performance.

| Field | Source | Purpose |
| --- | --- | --- |
| Flagged school rank | Derived from public-data heatmap signals | Prioritises schools with multiple published DfE concerns. |
| KS2/attendance/FSM cards | DfE KS2, attendance, census | One-line historic context before a school visit. |
| CTA to school detail | UI state, no database write | Opens the school’s deeper tabs for questions and current capture data. |

### 3. School overview tab

| Field | Source | Calculation | Notes |
| --- | --- | --- | --- |
| Total pupils in submission | Current parsed trust spreadsheet or school capture | Sum of `cohort.number_in_cohort` across included year groups | Not the DfE census roll. |
| FSM % in submission | Current parsed trust spreadsheet/capture | Sum FSM / sum cohort | Current in-year school-submitted context. |
| SEND % in submission | Current parsed trust spreadsheet/capture | Sum SEND / sum cohort | Includes SEND count from capture; EHCP separately if present. |
| EAL % shown in overview | DfE census `eal_pct` | Latest DfE census row for school URN | PAYMAT spreadsheet does not provide EAL. |
| Y6 Combined | Current parsed trust spreadsheet/capture | `Year 6.all_pupils.c_are` | School-submitted, not SATs validated. |
| Radar / subject profile | Current parsed trust spreadsheet/capture | Reading, Writing, Maths, Combined values for Y6 | Shows current self-view. |
| Top findings | Derived from current capture, DfE percentile/three-year average where present | Deterministic rules | Should remain source-labelled. |

### 4. DfE intelligence tab

| Field | Source | Calculation | Notes |
| --- | --- | --- | --- |
| KS2 history | `/api/trust-analysis` from `ks2_results` | Current and predecessor URNs mapped to current URN | Handles academisation lineage. |
| Census trend | `/api/trust-analysis` from `census` | Year-by-year school-level context | EAL here is whole-school context only. |
| National percentile | `ks2_results` national distribution for selected/latest year | Position in national distribution | Only where current URN row exists; predecessor rows need lineage mapping. |
| Three-year average | `ks2_results` filtered to same URN and RWM+ | Mean of available years | Good for track record, not current-year prediction. |

### 5. Cohort and gaps tab

| Field | Source | Calculation | Notes |
| --- | --- | --- | --- |
| FSM6 gap snapshot | Trust spreadsheet/capture | Non-FSM combined ARE % minus FSM6 combined ARE % by year group | This is available because spreadsheet has `fsm6` and `not_fsm6`. |
| SEND/EHCP context | Trust spreadsheet/capture | Counts by year group | Spreadsheet has SEND/EHCP counts, but not SEND vs non-SEND attainment splits. |
| EAL comparison | Not available from PAYMAT spreadsheet | Requires per-pupil/MIS/CTF layer or future EAL/non-EAL spreadsheet section | Do not show as an attainment gap unless pupil-level data exists. |
| Year-group pipeline | Trust spreadsheet/capture | Adjacent cohort comparisons across Y1-Y6 | Useful as a prompt, but different cohorts are being compared. |

### 6. Pupil data tab

| Field | Source | Calculation | Notes |
| --- | --- | --- | --- |
| Trackable pupils | `pupil_assessments_pseudo` | Unique `pupil_hash` with multi-year records | Grove House has this; Hollingwood currently does not. |
| Pupil demographics | `pupil_assessments_pseudo`, enriched by `ls_pupils` | Boolean flags for FSM, SEND, EAL, gender | Server stores hashes, not names. |
| Current profile disaggregation | `ls_pupils` | Combined expected where reading, writing and maths all meet expected | This is strongest when MIS/class profile data is fresh. |
| “Defend Your Numbers” | Per-pupil records | Recalculate attainment after isolating/removing groups such as SEND/FSM/EAL | Only valid where per-pupil flags exist. |
| Unified evidence timeline | `pupil_assessment_events` + CTF records | Chronological source-labelled assessment events | Shows audit trail and validation tier. |

Privacy note for demos: the pupil-data API returns deterministic aliases generated from secure hashes, not names or raw MIS identifiers. Grove House can therefore demonstrate pupil-level journeys safely, provided we describe it as a demo-safe alias layer and not as a live named register.

## PAYMAT EAL answer

For PAYMAT/Hollingwood:

- The trust spreadsheets do **not** contain EAL.
- Hollingwood has no per-pupil layer currently stored.
- Therefore any Hollingwood EAL percentage must be treated as **DfE census context only**, not as an EAL attainment gap.
- The product should not say “EAL pupils are performing differently” for Hollingwood until a pupil-level MIS/CTF import or an EAL/non-EAL assessment section exists.

For Grove House:

- Grove House has `pupil_assessments_pseudo`, `ls_pupils`, and `pupil_assessment_events`.
- That means Grove House can support a richer demo: EAL/FSM/SEND pupil flags, pseudonymised pupil journeys, current-profile disaggregation, teacher-locked evidence and cohort tracking.
- The pupil-data route now follows the selected school organization rather than defaulting to the logged-in parent trust, so Grove House data can load when Grove House is selected from PAYMAT.

## Customer data requirements

| Product level | Customer provides | What Schoolgle can show |
| --- | --- | --- |
| Out-of-box setup | Trust/school names and URNs | DfE public-data heatmap, attendance, PA, FSM/SEND/EAL context, KS2/KS4 history, LA/national comparison. |
| Trust spreadsheet | Termly assessment capture with cohort counts, FSM6/non-FSM6 splits, SEND/EHCP/FSM counts | Current trust-wide view, cohort heatmap, FSM gap snapshot, data quality warnings, current vs historic challenge. |
| Improved spreadsheet | Add EAL count and ideally EAL/non-EAL attainment sections | EAL context and gap analysis from submitted assessment data. |
| MIS/CTF connection | Pseudonymised pupil records, demographics, assessment history | Pupil journey, subgroup impact, “defend your numbers”, Ofsted-ready evidence trail. |
| Evidence/Ofsted connection | Policies, SEF/SDP, website evidence, actions and evidence vault | Convert data concerns into Ofsted Readiness findings, tasks, evidence checks and leadership narrative. |

## Known risks and cleanup queue

| Risk | Status | Action |
| --- | --- | --- |
| Legacy static Pennine metadata exists in `apps/platform/src/lib/trust-analysis/types.ts` | Still present | Keep only where needed for old import mapping/tests; do not use as live source for EAL/FSM/NOR in product UI. |
| Legacy analysis helpers in `apps/platform/src/lib/trust-analysis/analysis.ts` assume Pennine abbreviations | Still present | Migrate or retire if reused; current product path should use scoped org/URN data. |
| Route name `/api/trust-analysis/grove-house` is misleading | Still present | Rename later to `/api/trust-analysis/pupil-layer` with backwards-compatible alias. |
| Attendance is in public-data report but not the older `/api/trust-analysis` response | Current design | OK if labelled, but avoid using older route for attendance claims. |
| EAL chart can be misread as an EAL attainment gap | Partly mitigated | It is now labelled as context only unless pupil-level data exists; long-term fix is a proper EAL/non-EAL chart from MIS/CTF. |

## Demo script language

Use this wording with customers:

> “The first layer is published DfE data. It gives us the historic external picture: attainment, attendance, absence, FSM, SEND and EAL context. The second layer is your current school-submitted assessment capture, so leaders can compare where they were with where they say they are now. The third layer is the powerful one: MIS/CTF pupil-level data. That lets Schoolgle explain which cohorts and groups are driving the headline figures and then push the right actions into Ofsted Readiness.”

Do not say:

> “Hollingwood’s EAL pupils are doing X.”

Say:

> “Hollingwood has a high EAL context in DfE census data. To make an EAL attainment claim, we need pupil-level data or an EAL/non-EAL assessment split.”
