# Grove House Data Pipeline Reference

This note records where the Grove House Trust Assessor data currently lives, how the tables relate, and what is still required before subgroup narratives are allowed to make firm judgements.

## Current Source Map

| Layer | Table | What It Holds | Source Label To Show |
|---|---|---|---|
| Pupil profile | `ls_pupils` | Current pupil references, year group, SEND/EHCP, primary need, PP, EAL and current attainment fields | Grove House pupil/profile import |
| Pseudonymised assessment | `pupil_assessments_pseudo` | CTF/XML assessment rows keyed by `pupil_hash` | Grove House CTF/XML assessment import |
| Aggregate capture | `school_assessment_captures` | Named assessment captures such as Autumn and Mid-Year | Grove House Trust Assessor capture |
| Aggregate capture cells | `school_assessment_cells` | Year group, FSM/non-FSM and subject aggregate percentages | Grove House Trust Assessor capture cells |
| Public census context | `census` | NOR, FSM, EAL, SEN percentages by DfE year | Schoolgle DfE census warehouse |
| SEN provision context | `school_gias_extended_profiles` | DfE SEN 2024/25 school-level SEN Support, EHCP, unit/RP flags and primary need counts | DfE Special educational needs in England 2024/25 |
| Published KS2 | `ks2_results` | School-level KS2 outcomes and some characteristic rows | DfE KS2 institution-level data |

## Join Rule

- `ls_pupils.pupil_ref` is the school pupil reference/UPN-like key.
- `pupil_assessments_pseudo.pupil_hash` is generated with `HMAC-SHA256(UPN, organizationId)`.
- Analytics can enrich assessment rows by hashing `ls_pupils.pupil_ref` with the same organisation id and joining to `pupil_assessments_pseudo.pupil_hash`.
- This should be treated as an enrichment join, not a second source of pupil truth.

## Grove House Pilot Findings

- `ls_pupils` contains 409 Grove House pupil profile rows.
- 99/409 pupils are SEND/EHCP, which is 24.2%.
- DfE 2024/25 census/SEN profile shows 22.1% SEN, so the internal profile is directionally consistent.
- `pupil_assessments_pseudo` contains 7,143 CTF/XML assessment rows and 473 unique pupil hashes.
- 279 unique assessment hashes currently match `ls_pupils`; older/leaver cohorts will not all match the current roll.

Current `ls_pupils` attainment split:

| Group | Pupils | Reading ARE+ | Writing ARE+ | Maths ARE+ | Combined RWM ARE+ |
|---|---:|---:|---:|---:|---:|
| All | 409 | 62.6% | 65.3% | 65.8% | 41.6% |
| Non-SEND | 310 | 79.4% | 80.6% | 81.9% | 54.8% |
| SEND/EHCP | 99 | 10.1% | 17.2% | 15.2% | 0% |
| SEN Support | 58 | 17.2% | 29.3% | 25.9% | 0% |
| EHCP | 41 | 0% | 0% | 0% | 0% |
| PP | 94 | 57.4% | 63.8% | 64.9% | 40.4% |
| EAL | 153 | 63.4% | 66.0% | 72.5% | 47.1% |

These figures are useful for piloting the narrative, but exact national and Bradford/LA subgroup comparators must be imported before the product gives a formal judgement.

## Exact KS2 Comparator Pilot

The first comparator pass has been run from the official DfE 2024/25 revised KS2 characteristic datasets. The output is stored at:

- `analysis_outputs/grove-house/grove-house-ks2-characteristic-comparator-analysis.md`
- `analysis_outputs/grove-house/grove-house-ks2-characteristic-comparator-analysis.json`

Key Grove House findings from the current `ls_pupils` profile fields:

| Group | Grove House current combined RWM | National comparator | Bradford comparator | Interpretation |
|---|---:|---:|---:|---|
| Non-SEND | 54.8% | 74% | 71% | Below both exact non-SEN comparators; this cannot be explained by SEND alone. |
| SEND/EHCP | 0% | 24% | 25% | Below SEN provision comparator; needs careful provision/cohort review. |
| SEN Support | 0% | 29% | 30% | Below SEN Support comparator; check whether support pupils are being over-identified, under-supported, or assessed conservatively. |
| EHCP | 0% | 9% | 9% | Below EHCP comparator; interpret cautiously because EHCP cohorts are small and needs vary widely. |
| EAL | 47.1% | 64% | 60% | Below EAL comparators; EAL is not automatically an explanation for weaker outcomes. |

Source labels:

- School pupil/profile data: `ls_pupils`, Grove House organisation.
- National comparator: DfE KS2 attainment 2024/25 revised, `Attainment by pupil characteristics`.
- Bradford comparator: DfE KS2 attainment 2024/25 revised, `Attainment by region, local authority and pupil characteristics`, LA `E08000032`.
- School type comparator: DfE KS2 attainment 2024/25 revised, `Attainment by school type and pupil characteristics`.

## Official Comparator Imports Needed

| Dataset | DfE API Dataset ID | Purpose |
|---|---|---|
| KS2 Attainment by pupil characteristics | `c62e9901-58a5-ba76-aa0d-5ee4ef269776` | Exact national comparators for SEN, non-SEN, SEN Support, EHCP, FSM, EAL, sex, ethnicity, month of birth and primary need |
| KS2 Attainment by region, local authority and pupil characteristics | `d42e9901-ffd5-0871-87a4-5c99e5ae1f62` | Exact Bradford/Rochdale/LA comparators for the same pupil characteristic lenses |
| KS2 Attainment by school type and pupil characteristics | `0f2f9901-dd4d-9f74-b8d3-7933c9f0bba4` | National school-type comparators, including LA maintained versus academy |
| KS2 institution-level schools performance | `019afee4-e5d0-72f9-9a8f-d7a1a56eac1d` | School-level rows where characteristic-level outcomes are published and not suppressed |

## Data Required From A School

Minimum useful onboarding pack:

1. Current pupil profile export from MIS with pupil reference/UPN, year group, class, SEND status, EHCP flag, primary need, FSM/PP, EAL, gender and postcode where permitted.
2. Current assessment capture for reading, writing, maths and combined RWM by year group and subgroup.
3. CTF/XML statutory assessment exports where available for EYFS, phonics, KS1 and KS2.
4. Attendance/persistent absence export at pupil level if the school wants attendance-to-attainment diagnostics.
5. Pupil postcode or distance band if the school wants travel/distance/context analysis.

## Product Guardrails

- Do not make formal subgroup judgements using all-pupil national only when exact subgroup comparators exist.
- Do not present demo, mock or estimated comparators as real.
- Every card must show the school source, DfE source, academic year or term, and import/publication date.
- Keep `ls_pupils` as the current pupil profile source of truth and enrich assessment rows through the hashed pupil reference.
- If exact comparator data is missing, show “comparator pending” rather than filling the gap with a made-up value.
## Assessment Flow: Do Not Confuse These Layers

The product must keep three assessment layers separate. They can support each other, but they are not interchangeable.

### 1. Public DfE validated outcomes

This is the historic, published accountability layer.

- **Source examples:** `ks2_results`, DfE KS2 revised releases, GIAS/DfE census context.
- **Granularity:** school/cohort/subgroup published outcomes, not individual pupil identities.
- **Use in product:** external benchmark, multi-year trend, LA/national comparator, source-labelled public context.
- **Example question:** "How did this school's published Y6 combined RWM+ compare with similar schools or the LA?"

### 2. School aggregate capture spreadsheets

This is the school's self-reported assessment snapshot.

- **Source examples:** `trust_spreadsheets`, `school_assessment_captures`, `school_assessment_cells`.
- **Granularity:** year-group, subject, cohort percentages or counts.
- **Use in product:** trust/local-authority overview, heatmaps, autumn-to-mid-year movement, quick school comparison.
- **Limitation:** it does not tell us which pupil moved, stalled or declined. It can show "Y4 writing fell", but not who drove the fall.
- **Example question:** "Which year groups or schools look weaker in the latest autumn or mid-year capture?"

### 3. Pupil-level assessment / CTF / MIS export layer

This is the product moat.

- **Source examples:** `pupil_assessments_pseudo` and `ls_pupils`.
- **Granularity:** individual pseudonymised pupils, characteristics and assessment history.
- **Use in product:** pupil journey, subgroup split, SEND/non-SEND lens, EAL/FSM lens, intervention targeting, "defend your numbers".
- **Important join rule:** enrich `pupil_assessments_pseudo` from `ls_pupils` by deterministic `HMAC-SHA256(pupil_ref, organization_id)` when CTF rows have blank flags.
- **Example question:** "Are non-SEND pupils actually secure, or is their underperformance hidden inside the headline average?"

## Correct Comparison Logic

When we compare Grove House to DfE pupil-characteristic benchmarks, we must state exactly which school-side figure is being used:

| School-side figure | Valid comparator use | Risk if mislabelled |
| --- | --- | --- |
| DfE validated KS2 Y6 outcome | Compare directly with DfE national/LA published KS2 outcomes | Low risk, same accountability layer |
| Autumn/mid-year aggregate capture | Compare cautiously to expected benchmark trajectory, not as a final KS2 outcome | Medium risk: internal assessment, not published statutory data |
| Current `ls_pupils` attainment fields | Useful for live subgroup lens if clearly labelled as current Schoolgle profile | Medium risk: must not imply official DfE validated KS2 |
| Pupil-level CTF/MIS assessments | Strongest product insight for progress/journey/subgroup patterns | Low-to-medium risk if source, period and framework are explicit |

The product should never silently mix these. Every chart and narrative must label:

1. source table/file;
2. assessment period;
3. academic year;
4. cohort/year group now;
5. whether the figure is public DfE, school self-reported, or pupil-level imported data.

## Grove House: Current Interpretation

The current Grove House subgroup analysis uses `ls_pupils` current profile attainment fields and pupil characteristic flags. It is not yet the autumn-term aggregate spreadsheet.

The analysis is therefore:

> "Using Grove House's current Schoolgle pupil profile, how do the current pupil groups compare with the latest DfE KS2 pupil-characteristic benchmarks?"

That is useful, but the stronger commercial product argument comes from pupil-level imports:

> "Once the school supplies regular MIS/assessment exports, Schoolgle can track the same pupil through the year and across key stages, then show whether the headline cohort result is driven by SEND, disadvantage, EAL, prior attainment, mobility, or a hidden non-SEND performance issue."

## KS1 Status, May 2026

KS1 tests and teacher assessment remain optional for the 2025/26 academic year. GOV.UK states that 2025/26 arrangements remain unchanged and that schools may use optional KS1 tests and non-statutory teacher assessment frameworks. Some local authorities may still offer optional local collections, but this is not the same as a universal statutory national KS1 return.

Product implication:

- treat KS1 as a useful prior-attainment and transition signal where available;
- do not assume every school will have statutory KS1 data after the national change;
- encourage schools to keep clean pupil-level assessment records in Arbor/SIMS/Bromcom because that gives the product the strongest evidence trail regardless of statutory collection changes.
