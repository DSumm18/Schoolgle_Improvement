# UK Education Analytics Research Notes (for product design)

## 1) What comparable tools do in practice

### DfE and public benchmark ecosystem
- **Primary accountability technical model** uses weighted MAT calculations and disadvantaged breakdowns; disadvantaged is aligned to FSM history plus looked-after / previously looked-after definitions.
  - Source: https://www.gov.uk/government/publications/primary-school-accountability/primary-school-accountability-in-2025-technical-guide
- **Phonics, MTC, EYFS official releases** provide national and subgroup benchmarks and confirm expected-standard framing for each statutory check.
  - Phonics (2024/25): https://explore-education-statistics.service.gov.uk/find-statistics/phonics-screening-check-attainment/2024-25
  - MTC (2024/25): https://explore-education-statistics.service.gov.uk/find-statistics/multiplication-tables-check-attainment/2024-25
  - EYFS profile (2024/25): https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2024-25

### School/MAT platform patterns
- **Arbor** emphasizes report-builder workflows, permissions, scheduled exports, and calculated fields; this is close to how trust leaders already consume data operationally.
  - https://support.arbor-education.com/hc/en-us/articles/208906425-Creating-bespoke-Custom-Report-Writer-reports-Introduction
  - https://support.arbor-education.com/hc/en-us/articles/4405767061905-Using-calculated-fields-in-the-Custom-Report-Writer
- **Juniper Sonar Tracker** surfaces tabular + graphical progress views, grouped by R/W/M and progress bands with drill-down to pupil level and subgroup views.
  - https://help.junipereducation.org/hc/en-gb/articles/21928254005149-Sonar-Tracker-Primary-Target-Analysis-Report
  - https://help.junipereducation.org/hc/en-gb/articles/31716272897437-Sonar-Tracker-Primary-Triangulation-of-Data-Analysis-Report

### Generic BI capability that matters for trusts
- **Row-level security and governed sharing** are standard in production analytics and should be built in from day one for school/trust role segregation.
  - https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security
- **Reliable refresh and gateway patterns** matter where data is pulled from MIS exports/on-prem systems.
  - https://learn.microsoft.com/en-us/power-bi/connect-data/

## 2) Domain glossary for this workbook
- **GLD**: Good Level of Development (EYFS headline). In official EYFS statistics, GLD means expected level in the defined 12 ELGs across the 5 required areas.
- **ARE**: Age Related Expectations / expected standard.
- **GD**: Greater depth / higher standard subset.
- **C ARE / C GD**: Combined R/W/M expected and greater-depth outcomes.
- **PHONICS**: Year 1 screening expected standard (recheck in Year 2 where needed).
- **MTC**: Year 4 Multiplication Tables Check (score out of 25; statutory since 2022).
- **SEND / SEN support / EHCP**: SEND includes SEN support + EHCP categories.
- **FSM6 style disadvantage**: pupils eligible for FSM at any point in last 6 years (plus looked-after criteria in accountability contexts).

## 3) Product patterns to copy for your app

1. **Ingestion + normalisation layer**
- Parse arbitrary spreadsheet templates into a canonical long model:
  - `cohort_fact(year, school, pupils_total, send, ehcp, fsm_count)`
  - `attainment_fact(year, school, subgroup, metric, value, source_cell)`
- Preserve source-cell provenance for every value to support audits and explainability.

2. **Rules engine (non-optional)**
- Hard validation:
  - integer checks on counts, `EHCP <= SEND <= cohort`, `FSM <= cohort`
  - metric range checks (`0..1` for proportions)
- Consistency checks:
  - weighted subgroup reconciliation vs all-pupil totals
  - `GD <= ARE`, `Combined <= min(R,W,M)`
- Reliability flags:
  - low denominator warnings for subgroup interpretations

3. **Insight layer**
- Trust weighted trajectories by year.
- School variance and ranking views.
- Deprivation/SEND gap visuals.
- Data quality confidence overlay on every chart.

4. **Delivery layer**
- Role-targeted views:
  - Trust executive, school leader, class/year lead.
- Drill-down:
  - Trust -> School -> Year -> Metric -> Subgroup.
- Export pack:
  - PDF narrative + board-ready slides + CSV issue log.

## 4) Prompt architecture for a robust AI analyst

### System prompt core
"You are a UK primary trust data analyst. Always separate performance insight from data quality confidence. Never infer cohort counts from percentages. Always show denominators for subgroup conclusions. Treat low-n subgroups as indicative only."

### Analysis prompt template
"Given a normalized dataset with year, school, subgroup, metric, value, and denominators, produce:
1) trust-level strengths/risks,
2) school outliers,
3) equity gaps (FSM, SEND),
4) anomalies likely caused by data-entry/template issues,
5) 10 follow-up questions for schools.
Return each statement with confidence level and evidence fields."

### Chart brief prompt template
"Create 6 visuals for trust leaders: trajectory, heatmap, school spread, deprivation gap, SEND gap, data quality risk map. Use clear labels, include denominator context where relevant, and mark low confidence metrics visually."

### Guardrail prompt template
"Before finalising any insight, run checks:
- denominator validity,
- subgroup weighted reconciliation,
- impossible ordering constraints (GD > ARE, Combined > component minima),
- missing core fields.
If checks fail, prioritise issue disclosure over interpretive claims."

## 5) MVP build order
1. Spreadsheet parser + schema mapper.
2. Validation/rules engine with severity scoring.
3. Chart generator + narrative generator from normalized output.
4. Prompted insight engine with citation/provenance anchors.
5. Multi-tenant auth + role permissions.
6. Benchmark connectors (DfE releases / internal trust targets).

## 6) Why this matters for this dataset specifically
Your file already demonstrates why this architecture is necessary:
- mixed numeric formats (decimal vs whole-percentage vs text strings),
- missing values in core fields,
- subgroup inconsistencies that can materially change interpretation,
- year-by-year benchmark coverage gaps.

A production app should treat these as first-class product concerns, not edge cases.
