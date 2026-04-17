# Trust Mid-Year Data Capture 2025/26: Analysis Report

## Trust-level insights
- Strongest trust year-level core outcome: **EYFS (58.4%)**.
- Weakest trust year-level core outcome: **Year 4 (42.1%)**.
- Widest trust deprivation gap (Non-FSM minus FSM): **Year 3 (21.2pp)**.
- Highest weighted school composite: **LPS (58.3%)**; lowest: **LGPS (45.1%)**.

## High-priority inconsistencies
- **CRITICAL** EYFS / CHPS: All-pupil GLD is missing.
- **CRITICAL** EYFS / CVPS: GLD all-pupil value (52.0%) differs from weighted subgroup expectation (63.0%) by -11.0pp.
- **CRITICAL** EYFS / GHPS: All-pupil GLD is missing.
- **CRITICAL** EYFS / LGPS: GLD all-pupil value (53.0%) differs from weighted subgroup expectation (42.1%) by +10.9pp.
- **CRITICAL** Year 1 / HPS: FSM is non-integer (0.14).
- **CRITICAL** Year 2 / HPS: EHCP (5.0) is greater than SEND (3.0).
- **CRITICAL** Year 2 / LPS: PHONICS all-pupil value (77.0%) differs from weighted subgroup expectation (53.8%) by +23.2pp.
- **CRITICAL** Year 4 / GHPS: FSM W_GD (56.0%) exceeds W_ARE (6.0%).
- **CRITICAL** Year 4 / GHPS: FSM M_GD (75.0%) exceeds M_ARE (6.0%).
- **CRITICAL** Year 4 / GHPS: FSM C_GD (50.0%) exceeds C_ARE (12.0%).
- **CRITICAL** Year 4 / GHPS: R_GD all-pupil value (6.0%) differs from weighted subgroup expectation (24.3%) by -18.3pp.
- **CRITICAL** Year 4 / GHPS: W_ARE all-pupil value (62.0%) differs from weighted subgroup expectation (47.2%) by +14.8pp.
- **CRITICAL** Year 4 / GHPS: W_GD all-pupil value (13.0%) differs from weighted subgroup expectation (28.1%) by -15.1pp.
- **CRITICAL** Year 4 / GHPS: M_ARE all-pupil value (68.0%) differs from weighted subgroup expectation (47.2%) by +20.8pp.
- **CRITICAL** Year 4 / GHPS: M_GD all-pupil value (13.0%) differs from weighted subgroup expectation (32.4%) by -19.4pp.
- **CRITICAL** Year 4 / GHPS: C_ARE all-pupil value (53.0%) differs from weighted subgroup expectation (39.2%) by +13.8pp.
- **CRITICAL** Year 4 / GHPS: C_GD all-pupil value (4.0%) differs from weighted subgroup expectation (17.2%) by -13.2pp.
- **CRITICAL** Year 4 / LPS: M_GD all-pupil value (8.0%) differs from weighted subgroup expectation (20.3%) by -12.3pp.

## Suggested school follow-up questions
- Are all **FSM counts** integer pupil counts in every tab (for example Year 1 HPS appears decimal)?
- Can schools confirm whether **missing core metrics** are true missing returns or intentional exclusions?
- Where subgroup weighted checks fail by >10pp, should FSM/Non-FSM rates be corrected or is the subgroup definition not a strict partition?
- For rows where **GD exceeds ARE** (for example Year 4 GHPS FSM subgroup), is this data entry error or a field shift during copy/paste?
- Should national comparators be consistently included for each year and all core metrics, with one numeric format (decimal proportions)?
- For text-style entries (e.g. 'Above 25 64%'), should raw score and percentage be split into separate fields?

## Data-engineering recommendations for app productisation
- Store **long-format metric records** (`year`, `school`, `group`, `metric`, `value`) to simplify dynamic chart generation.
- Enforce a schema with typed fields: integer denominators, proportion metrics (0-1), and optional raw score fields.
- Add real-time validation rules for: denominator logic, GD<=ARE, combined<=subject minima, and subgroup weighted consistency.
- Add confidence labels based on subgroup size thresholds to prevent over-interpreting very small cohorts.
- Separate data quality diagnostics from attainment visuals so trust leaders can distinguish performance from data reliability.
