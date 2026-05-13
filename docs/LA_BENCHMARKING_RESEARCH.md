# LA Benchmarking - Top 10 KPIs Research

## Research Sources

1. [GOV.UK - Education Inspection Framework (November 2025)](https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025)
2. [GOV.UK - School inspection data summary report (IDSR) guide](https://www.gov.uk/guidance/school-inspection-data-summary-report-idsr-guide)
3. [GOV.UK - Primary school performance tables: 2025](https://www.gov.uk/government/statistics/primary-school-performance-tables-2025)
4. [GOV.UK - Primary school accountability in 2025: technical guide](https://www.gov.uk/government/publications/primary-school-accountability/primary-school-accountability-in-2025-technical-guide)
5. [DAISI EDUCATION - How Key Stage 2 Progress is calculated](https://daisi.education/how-is-key-stage-2-progress-calculated/)
6. [Primary IDSR prototype with floor standard examples](https://dera.ioe.ac.uk/id/eprint/30123/1/Primary_IDSR_prototype.pdf)

---

## Top 10 KPIs Ofsted Inspectors & School Improvement Leads Need

### 1. KS2 Combined Attainment (Reading, Writing, Maths)
**Why it matters:** Headline measure in IDSR, primary accountability metric
**Data source:** `ks2_results` table, subject="Reading, writing and maths"
**Comparison:** School vs LA vs National (62% 2025 national)
**Threshold:** Floor standard = 60% expected standard

### 2. KS2 Progress Scores (Reading, Writing, Maths)
**Why it matters:** Measures value-added, core to fair school assessment
**Data source:** `ks2_results.progress_measure_score`
**Comparison:** School vs LA vs National (0 = national average)
**Threshold:** < -5 (floor), < -2.5 (coasting) - varies by subject

### 3. Overall Attendance %
**Why it matters:** Attendance = learning time, Ofsted flag if < 95%
**Data source:** `attendance.overall_attendance_pct`
**Comparison:** School vs LA vs National (~94.5% primary)
**Threshold:** 95% = Ofsted concern flag

### 4. Persistent Absence %
**Why it matters:** DfE concern indicator, predictor of poor outcomes
**Data source:** `attendance.persistent_absence_pct`
**Comparison:** School vs LA vs National (~11.2%)
**Threshold:** > 10% = DfE concern

### 5. Disadvantaged Attainment Gap
**Why it matters:** EIF 2025 "Education inspection framework emphasises closing gaps"
**Data source:** `ks2_results` breakdown_topic="FSM" vs "All pupils"
**Comparison:** Disadvantaged vs Non-disadvantaged within school
**Calculation:** Gap = All pupils % - FSM %

### 6. Prior Attainment Progress Analysis
**Why it matters:** IDSR highlights "progress by pupil characteristic groups"
**Data source:** `ks2_results` breakdown_topic (low, middle, high prior attainers)
**Comparison:** Each group vs national same-group averages
**Purpose:** Identify if school adds value across ALL starting points

### 7. 3-Year Trend Analysis
**Why it matters:** IDSR flags "year-on-year trends (scores in bottom quintile for multiple years)"
**Data source:** All `ks2_results`, `attendance` by academic_year_start
**Comparison:** Rolling 3-year average vs previous 3-year
**Purpose:** Identify improvement or decline trajectories

### 8. Demographic Contextualisation (Value-Added Analysis)
**Why it matters:** Schools with high FSM% achieving national average ARE performing well
**Data source:** `census` (fsm_pct, eal_pct, sen_pct, mobility_pct)
**Usage:** Contextualise raw attainment against research expectations
**Purpose:** Fair comparison - adjust for intakes

### 9. Subject-Specific Strengths/Weaknesses
**Why it matters:** IDSR highlights subjects "significantly above/below national"
**Data source:** `ks2_results` by subject (Reading, GPS, Maths, RWM)
**Comparison:** Each subject vs LA and national
**Purpose:** Target curriculum improvement where needed

### 10. Workforce Stability Impact
**Why it matters:** Teacher turnover affects pupil progress (contextual factor)
**Data source:** `workforce` (fte_teachers, teaching_vacancy_rate)
**Comparison:** Year-on-year trends in staffing
**Purpose:** Correlate staffing changes with cohort outcomes

---

## Available DfE Data in Supabase

| Table | Key Columns | KPIs Supported |
|-------|-------------|----------------|
| `schools` | urn, la_code, la_name, phase_name, number_of_pupils, percentage_fsm | LA grouping, demographic context |
| `ks2_results` | academic_year_start, subject, breakdown, breakdown_topic, expected_standard_pct, higher_standard_pct, progress_measure_score, progress_measure_description | #1, #2, #5, #6, #7, #9 |
| `attendance` | academic_year_start, overall_attendance_pct, persistent_absence_pct, illness_absence_pct, excluded_pct | #3, #4, #7 |
| `census` | academic_year_start, number_on_roll, fsm_pct, eal_pct, sen_pct, mobility_pct | #8 |
| `workforce` | academic_year_start, fte_teachers, fte_teaching_assistants, teaching_vacancy_rate, pupil_teacher_ratio | #10 |
| `exclusions` | academic_year_start | Additional context |

---

## Implementation Design

### Phase 1: LA Benchmark Aggregation (Engine Layer)
- File: `packages/core-ai/src/engines/school-intelligence-engine.ts`
- Extend `getLaBenchmarks()` to include:
  - KS2 progress scores (not just attainment)
  - Disadvantaged gap analysis
  - Subject breakdowns (Reading, Maths, Writing)
  - 3-year trend calculations
  - Prior attainment subgroup analysis

### Phase 2: Demographic Clustering
- Create `getDemographicCohorts(urn: number)` function
- Group schools by FSM%, EAL%, SEN% bands (e.g., 0-10%, 11-20%, 21-30%, 30%+)
- Enable "fair comparison" against schools with similar intakes
- Add special provision detection (requires manual tagging or DfE dataset enhancement)

### Phase 3: Flexible Graph System
- New component: `BenchmarkChart.tsx`
- Auto-detects assessment periods from data (no hardcoded "autumn", "mid-year")
- Supports multi-year, multi-group comparisons
- Configurable Y-axis domains for different metrics
- Tooltip with contextual insights

### Phase 4: UI Overhaul
- Replace current LaBenchmarkCard with proper KPI dashboard
- KPI cards with:
  - Value + trend indicator (↑↓)
  - School/LA/National comparison
  - Threshold alerts (floor standard, Ofsted flag)
  - 3-year sparkline
- Expandable detail views with full charts
- Contextual narrative explaining what the data means

### Phase 5: Special Provision Identification
- Short term: Manual tagging in UI (school self-declares VI unit, nurture group)
- Long term: Import from DfE "schools with designated provisions" dataset
- Compare against other schools with similar provisions

---

## National Benchmarks (2025)

| Metric | National Average | Ofsted/DfE Threshold |
|--------|-----------------|---------------------|
| KS2 Combined (Expected) | 62% | < 60% = Floor standard |
| KS2 Progress Score | 0 (by definition) | < -5 (floor), < -2.5 (coasting) |
| Overall Attendance | 94.5% (primary) | < 95% = Ofsted flag |
| Persistent Absence | 11.2% | > 10% = DfE concern |

---

## Open Questions for User

1. **Special Provisions**: Do you want schools to self-declare VI units/nurture groups in the UI, or should we wait for DfE dataset import?

2. **Assessment Periods**: Our `school_cohort_outcomes` table uses `assessment_period` (e.g., "autumn", "spring", "eoy"). Should graphs auto-detect periods or allow filtering?

3. **Progress vs Attainment**: For primary schools, KS2 progress scores are only available for Year 6. Should we show internal assessment progress for other year groups from `school_cohort_outcomes`?

4. **Demographic Bands**: What FSM%/EAL%/SEN% bands make sense for clustering? (e.g., quintiles, deciles, or fixed thresholds?)

---

## Next Steps

1. ✅ Research completed - KPIs identified
2. ⏳ Extend `getLaBenchmarks()` with full KPI set
3. ⏳ Create demographic clustering function
4. ⏳ Build flexible graph component
5. ⏳ Redesign UI with proper KPI cards
6. ⏳ Test with Rawdon St Peter's (URN 107903, Leeds LA 383)
