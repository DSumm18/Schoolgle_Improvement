# Trust Assessor — Product Knowledge Base

**Single source of truth for Trust Assessor. Any Claude session / developer working on this product must start here.**

Last updated: 2026-04-18 (condensed)
Product lead: David Summerscales
Context: Schoolgle → School Improvement module → Trust Assessor

---

## 1. Product strategy

### Three data tiers (the sales funnel)

| Tier | Source | Price | Proves |
|---|---|---|---|
| **1 — FREE** | Trust's own spreadsheet | Hook | Internal inconsistencies, 0% GD flags, statistical impossibilities |
| **2 — PAID** | + Schoolgle DfE warehouse | Subscription | National percentile, 3-yr validated KS2, Bradford-style local benchmark |
| **3 — PREMIUM** | + Per-pupil CTF / MIS connection | £££ per school | Cohort journeys, over-levelling proof, Ed intervention plans, governor reports |

### Sales loop

Free exposes bad data → paid fills gaps → Lesson Studio fixes root cause (continuous auto-assessment) → data becomes reliable → no surprises at KS2.

### Business angles (reinforce everywhere)

1. "This wouldn't happen with Schoolgle's continuous assessment — AI flags drift in Term 2 Y2, not Term 5 Y6"
2. "Research-backed not opinion-based" — schools dispute DfE's own data if they dispute us
3. "Ed creates the plan, not just flags the problem" — named pupil intervention plans
4. "Governor pack in one click" — replaces 4 hours of HT/SBM work
5. "Works for any trust" — must be generic, not Grove-House-hardcoded

### Customer sensitivity — non-negotiable

Headteachers are paying customers. **Evidence-based** findings YES, **personally accusatory** language NO. Never "the headteacher failed" — always "the data raises questions governors might explore."

### Alex's Pennine Academies meeting (primary use case)

- **Alex Summerscales** — David's brother, headteacher at Grove House (URN 148201)
- **Alex Aitken** — Pennine Yorkshire enablement partner (David's wife presents to)
- **Grove House** — crown jewel: 473 pupils, 7,143 CTF records, 6 years. Use privately with Alex Aitken, NOT in the wider trust meeting.
- **7 Pennine primary schools** in Bradford — trust code 17012

### Demo flow

- **Scene 1 (Shock):** Tier 1 spreadsheet analysis → data quality flags, 0% GD, year-group drops
- **Scene 2 (Validation):** + DfE layer → national percentiles, predictive accuracy check
- **Scene 3 (Crown jewel, post-meeting):** + Grove House CTF → over-levelling proof, per-pupil cards

---

## 2. Supabase DfE schema — what's there

**23 tables total. 10 populated, 13 empty.**

### Populated tables

| Table | Rows | Used? |
|---|---|---|
| `ks2_results` | 2,057,600 | ✅ |
| `exclusions` | 1,126,026 | ❌ |
| `school_history` | 501,924 | ✅ (GIAS imported) |
| `workforce` | 207,590 | ✅ Timeline |
| `attendance` | 205,867 | ✅ Timeline |
| `census` | 146,600 | ✅ |
| `schools` | 52,152 | ✅ Metadata |
| `ks4_results` | 40,285 | ❌ Secondary |
| `ofsted_inspections` | 36,354 | ✅ Timeline |
| `area_demographics` | 32,844 | ❌ Not linked |
| `school_profiles` | 27,161 | ❌ Summary |

### Empty (schema exists, data not loaded)

`ks1_results`, `pupil_premium`, `trusts`, `school_area_links` (URN→LSOA — critical), `school_infrastructure`, `area_crime`, `air_quality`, `local_authority_*`.

### CRITICAL: DfE does NOT publish per-school for

- **Phonics Screening** (LA level only)
- **MTC** (LA level only)
- **KS1** (post-2022/23 non-statutory, not per-school)

**This is the product moat.** Only schools have this data via Primary Assessment Gateway. Schoolgle's CTF connector is the ONLY way to surface the full externally-validated pathway per school. See `docs/DFE_DATA_DEFINITIVE_GUIDE.md` — do NOT re-research this.

---

## 3. CTF data (Grove House only)

473 unique pupils, 7,143 records, 6 years, stored in `pupil_assessments_pseudo`.

### Populated fields
`pupil_hash`, `year_group`, `subject`, `attainment_level`, `teacher_assessment` (6394/7143), `academic_year_start`, `scaled_score` (749 — phonics only)

### CTF fields parser is skipping (fix opportunity)
`send_type` (VI/HI/ASD/SEMH/SLCN/MLD/SLD/PMLD/PD), `is_pp`, `progress_score`, `prior_attainment_band`, `previous_period_level`, `raw_score`

### Not in schema (need migration)
EHCP status, arrival date UK, FSM6, admission date, DOB, home language.

---

## 4. Forensic methodology

### Four-step evidential pattern
1. Subject-by-subject moderation check — only unmoderated subjects dropped = drift, not decline
2. Demographic expectation calculation using DfE/EEF gaps
3. Before/after comparison — which period matches demographic prediction?
4. Statistical impossibility — whole-cohort regressions >1-in-500 rarity

### Demographic expectation model (`lib/trust-analysis/demographic-expectations.ts`)

```
expected = national_baseline
         - (fsm_pct/100 × fsm_gap)
         - (send_pct/100 × send_gap)
         - (eal_pct/100 × eal_gap_at_year)

fsm_gap:  18pp KS1, 20pp KS2 (EEF)
send_gap: 25pp KS1, 30pp KS2 (EEF)
eal_gap_at_year: { Y1:20, Y2:15, Y3:8, Y4:4, Y5:0, Y6:-2 }
```

EAL curve = Strand, Demie & Lindorff (2018) Oxford/UCL.

### Bidirectional validation

Same rigour for "looks amazing" schools (over-levelling suspicion) as underperformers. Hollingwood (+25pp above demographic prediction) is the counter-case to Grove House (+1pp above).

---

## 5. Research citations library

`lib/trust-analysis/research-citations.ts` — 14 citations + `evaluateResearchKpis()`:

EEF Pupil Premium 2024, Strand Demie Lindorff 2018, NALDIC 2020, DfE KS2 2024, DfE KS1 2023, Ofsted EIF 2024, STA KS1 Moderation 2022, EEF SEND 2020, IFS Disadvantage Gap 2023, Demie 2023, DfE Pupil Absence 2024, IFS Teacher Retention 2022, DfE School Travel 2022, EEF Ofsted Trajectory 2023.

Every forensic finding must cite ≥1 source.

---

## 6. Validation tiers (critical for pitch)

| Checkpoint | Year | Validation |
|---|---|---|
| EYFS Profile | Reception | Teacher, moderated sample |
| Phonics Y1 | Y1 | External test |
| Phonics Y2 retake | Y2 | External test |
| KS1 SATs | Y2 | **External UNTIL 2022/23**; self-reported since |
| MTC | Y4 | External test (since 2022) |
| Y3-Y5 teacher assessment | — | Self-reported, unchecked |
| KS2 SATs | Y6 | Fully external |

**The 4-year gap between Y2 KS1 and Y6 KS2 is where assessment drift happens.** The Cohort Validation Passport component visualises this per school.

---

## 7. Connector pattern

Three icons in every module app header:
1. **Google Drive** — live connection (no re-upload)
2. **Schoolgle DfE database** — backend
3. **School assessment data** (CTF / MIS: Arbor / SIMS / Bromcom)

Hover = status + last sync. Locked = grey with "unlock with" tooltip.

---

## 8. What's built (as of 2026-04-18)

### UI components
- At-a-glance summary, forensic verdict, national percentile, predictive accuracy
- Statistical impossibility alerts, research-backed KPIs
- EAL trajectory chart, Cohort Passport, Research Factors Checked
- Per-pupil card grid (year-group filter), Grove House deep dive
- School events timeline (embed + full page `/timeline`)
- Governor Assessment Report (HTML 4-page A4, interactive: present + edit + export)

### Infrastructure
- 5-tab layout: Overview / Forensic Review / Cohort Pathway / Pupil Level / Evidence
- Track-changes editing: EditableText + HideableCard, localStorage persistence
- Dev auth test user: `scripts/dev-auth/bootstrap.ts`, `scripts/dev-auth/screenshot.ts`
- Event emission from Trust Assessor → `school_timeline_events`

### Data imports
- 7 Pennine schools seeded with DfE-derived Timeline events
- GIAS history: 501,924 rows across 52,151 schools
- Grove House phonics surfaced from CTF

---

## 9. Known gaps

### Demo
- Populated-state visual verification requires real user session
- Further animation polish for interactive hover feel

### Data
- Phonics/MTC/KS1 per-school for non-Grove-House = Tier 3 upsell
- LA-level phonics/MTC context (deferred)
- CTF parser not populating `send_type`, `is_pp`, `progress_score`, `prior_attainment_band`

### Product
- Ed chat panel for edit assistance (AI-led rewording)
- Supabase persistence for report edits (v2, currently localStorage)
- Approval workflow (deputy → head → published)
- Component-level redaction (finer than hide card)

### GDPR
- DPIA template, DPA template, pseudonymisation certificate
- Right-to-delete audit flow, DPO FAQ pack

---

## 10. Generic scaling rules (for any trust)

1. Spreadsheet parser auto-detects schema (heuristics, not hardcoded columns)
2. Demographic inference from DfE tables when user has URN
3. All AI prompts school-agnostic
4. Connector UX shows what unlocks (tier meter)
5. Fall-through logic — Tier 3 missing → Tier 2 + CTA
6. Licensing gate — feature flags per subscription tier
7. NO hardcoded "Grove House" strings in display code

---

## 11. File locations

### Code
- Page: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`
- API: `apps/platform/src/app/api/trust-analysis/` + `/api/trust-assessor/`
- Helpers: `apps/platform/src/lib/trust-analysis/`
  - `types.ts` — PENNINE_SCHOOLS, URN_PREDECESSORS
  - `demographic-expectations.ts` — prediction model
  - `research-citations.ts` — 14 citations + KPI engine
  - `report-templates/governor-assessment.ts` — HTML report
- Components: `apps/platform/src/components/trust-assessor/`
  - `SchoolTabTabs.tsx`, `EditableText.tsx`, `HideableCard.tsx`
  - `CohortPassport.tsx`, `PupilCardGrid.tsx`
- Timeline: `apps/platform/src/components/school-events/Timeline.tsx`
- Intelligence Brain: `apps/platform/src/lib/intelligence-brain/skills.ts`
- GIAS import: `scripts/import-gias-school-history.mjs`
- Pennine seed: `scripts/seed-pennine-timeline.ts`
- Dev auth: `scripts/dev-auth/`

### Supabase tables
- `school_timeline_events` (unified events; note `school_events` was already a calendar table)
- `pupil_assessments_pseudo` (Grove House CTF)
- `dfe_data.*` (23-table warehouse)

---

## 12. Rules for Trust Assessor work

1. Read this doc first
2. Audit DB schema before coding (see `feedback_data_audit_before_build` memory)
3. Verify code is data-driven, not Grove-House-hardcoded
4. Every finding cites published research
5. Voice: exploratory, not accusatory (HTs are customers)
6. Connector pattern = icons in header, not banners
7. Connect limitations to product upsell
8. JSONB filters: use `.contains('metadata', {key:val})` — NOT `.eq()` (broken)
9. Always pass `organizationId` on `/api/events` GET
10. Use dev auth test user for screenshots; don't ask David to log in

---

## 13. Key decisions made

- **2026-04-17:** 3-tier data architecture, research citations library, Governor Report deployed, forensic methodology proven on Grove House (over-levelling at KS1)
- **2026-04-18 (morning):** Full DfE audit — 21 unused tables; DfE doesn't publish phonics/MTC/KS1 per school confirmed
- **2026-04-18 (afternoon):** 5-tab layout + track-changes editing delivered; customer sensitivity principle locked in
- **2026-04-18 (evening):** GIAS history imported across 52k schools; Grove House phonics surfaced; Cohort Passport wired

---

## 14. SFB Finance Import (2026-04-20)

### Source

- **DfE Financial Benchmarking and Insights Tool** — https://financial-benchmarking-and-insights-tool.education.gov.uk/data-sources
- CFR full-data workbooks (LA-maintained schools): `CFR_<year>_Full_Data_Workbook.xlsx`
- AAR download workbooks (academies / free schools): `AAR_<year>_download.xlsx`
- Data is based on schools' Consistent Financial Reporting (CFR) returns + academies' Accounts Return (AAR)
- Published by DfE annually, ~6 months after financial year end

### Table

`dfe_data.school_finance` (40 columns, unique on `(urn, financial_year)`)

Applied via migration: `apps/platform/supabase/migrations/20260420_dfe_school_finance.sql`

### Row counts imported (2026-04-20)

Total: **235,779 rows** across 20 datasets.

| Year     | CFR    | AAR    |
| -------- | -----: | -----: |
| 2014-15  | 16,904 |      — |
| 2015-16  | 16,240 |      — |
| 2016-17  | 15,225 |  6,893 |
| 2017-18  | 15,249 |  7,951 |
| 2018-19  | 14,071 |  8,767 |
| 2019-20  | 13,281 |  9,288 |
| 2020-21  | 12,806 |  9,646 |
| 2021-22  | 12,390 | 10,001 |
| 2022-23  | 12,020 | 10,295 |
| 2023-24  | 11,537 | 10,954 |
| 2024-25  | 10,701 | 11,560 |

Coverage: CFR 2014-15 through 2024-25 (11 years); AAR 2016-17 through 2024-25 (9 years). AAR workbooks for 2014-15 and 2015-16 are not published by DfE on the FBIT data-sources page.

### CFR code mapping

CFR raw codes captured directly:

| Column in `school_finance`    | CFR code(s)                                      |
| ----------------------------- | ------------------------------------------------ |
| `teaching_staff_gbp`          | E01                                              |
| `supply_staff_gbp`            | E02 + E10 + E26 (pre-aggregated by DfE)          |
| `education_support_gbp`       | E03                                              |
| `premises_staff_gbp`          | E04                                              |
| `admin_staff_gbp`             | E05                                              |
| `catering_staff_gbp`          | E06                                              |
| `pupil_premium_income_gbp`    | I05                                              |
| `sen_funding_gbp`             | I03                                              |
| `energy_gbp`                  | E16                                              |
| `learning_resources_gbp`      | E19                                              |
| `total_income_gbp`            | "Total Income: I01:I18 - E30" (DfE aggregate)    |
| `total_expenditure_gbp`       | "Total Expenditure: (E01:E29 + E31 + E32)"       |
| `total_staff_gbp`             | "Staff Total: (E01:E03) + E05 + (E07:E11) + E26" |
| `premises_gbp`                | "Premises: (E12:E14) + E04 + E28b"               |
| `reserves_gbp`                | "Revenue Reserve: B01 + B02 + B06"               |
| `surplus_deficit_gbp`         | "In-year Balance"                                |

AAR (academies) uses descriptive headers without the CFR code prefix. The importer maps AAR columns to the same canonical fields. AAR does NOT break out pupil premium separately (rolls up into other DfE grants), so `pupil_premium_income_gbp` is null for academy rows.

Per-pupil derived fields are computed on insert:
- `income_per_pupil_gbp` = total_income / pupils
- `expenditure_per_pupil_gbp` = total_expenditure / pupils
- `teaching_per_pupil_gbp` = teaching_staff / pupils
- `support_per_pupil_gbp` = education_support / pupils
- `avg_teacher_cost_gbp` = teaching_staff / fte_teachers

### Verification — Pennine Academies Yorkshire (2023-24)

```
Clayton Village Primary School      pupils=202  inc/pp=£6,718  teach/pp=£3,144  avgT=£67,054  surplus=£99k
Crossley Hall Primary School        pupils=666  inc/pp=£7,044  teach/pp=£2,790  avgT=£64,091  surplus=£650k
Farnham Primary School              pupils=446  inc/pp=£6,274  teach/pp=£2,852  avgT=£61,688  surplus=£324k
Grove House Primary School          pupils=415  inc/pp=£6,439  teach/pp=£2,713  avgT=£52,641  surplus=£477k
Hollingwood Primary School          pupils=454  inc/pp=£6,247  teach/pp=£2,405  avgT=£61,348  surplus=£664k
Laycock Primary School              pupils=89   inc/pp=£8,157  teach/pp=£3,899  avgT=£69,124  surplus=£92k
Lidget Green Primary School         pupils=526  inc/pp=£6,667  teach/pp=£3,038  avgT=£63,564  surplus=£340k
```

### Finding (the headline for the trust assessor)

**Clayton Village** (weakest outcomes, per the trust assessment narrative) has the **second-highest teaching £/pupil** (£3,144) and the **second-highest average teacher cost** (£67,054) in the trust. It has 9.47 FTE teachers for 202 pupils — a pupil:teacher ratio of ~21.

**Hollingwood** (strong outcomes) has the **lowest teaching £/pupil** (£2,405) but a similar average teacher cost (£61,348). It has 17.8 FTE for 454 pupils — ratio of ~25.5.

**So the per-pupil story is not "Clayton Village is under-staffed" — it's the opposite.** Clayton has more adults per child than Hollingwood, spends more per pupil on teaching, and still underperforms. This reframes the intervention conversation entirely — it's about how teaching time is deployed, not how much is spent.

### How to run

```bash
# 1. Apply migration (one-off)
psql $DATABASE_URL -f apps/platform/supabase/migrations/20260420_dfe_school_finance.sql

# 2. Download workbooks to /tmp/dfe_work/
#    (see scripts/import-sfb-finance.mjs header for URLs)

# 3. Run importer (must run from apps/platform/ so pg resolves)
cd apps/platform && node scripts/import-sfb-finance.mjs [--replace]
```

`--replace` truncates and reloads. Default is `ON CONFLICT DO NOTHING`, safe to re-run.

### Next enhancements

1. **Surface cost-per-pupil in Trust Assessor Staffing Context card** — feeds directly into the pupil:teacher ratio narrative, with 10-year trend
2. **Join to `dfe_data.workforce`** — the CFR returns FTE teacher counts, but `workforce` has richer age/experience/qualifications data. Cross-join = richer "who are the teachers" picture
3. **Average teacher cost outlier detection** — e.g. avgT > £80k in a primary school is unusual and worth flagging (senior leader heavy / part-time distortion / data error)
4. **Year-over-year delta view** — CFR deficits / reserve depletion are leading indicators of school-level stress; build `school_finance_trends` view

### Script

`scripts/import-sfb-finance.mjs` (symlinked/copied to `apps/platform/scripts/import-sfb-finance.mjs` because pg is only installed in the platform workspace). Header scanning is tolerant of DfE's year-on-year schema drift (header row position varies from 0 to 3 across years; column labels drift). See the `findHeaderRow` and `norm` helpers.

---

## Intra-Year Progression (April 2026)

### Overview

The Trust Assessor now supports a richer three-tier data model with term-on-term progression:

| Term | Source | Reliability Tier |
|------|--------|-----------------|
| EOY previous year | Trust/school spreadsheet | Self-reported |
| Autumn Term T1 | Trust Autumn data capture or per-school Data Summary | Self-reported |
| Mid-year T2 | Trust mid-year spreadsheet (main connector) | Self-reported |
| EOY Target | School target | Self-reported |
| KS1 2021/22 baseline | School Data Summary (Y6 sheet) | External (last statutory moderated year) |
| DfE KS2 SATs | Supabase `ks2_results` | External |

### Reliability Tier System (locked)

Every number displayed must carry one of three tiers:
- **External** — DfE validated (KS2 SATs, Ofsted, Workforce Census, KS1 2021/22)
- **Derived** — computed from validated inputs (e.g. Autumn→Mid delta)
- **Self-reported** — trust spreadsheet, school Data Summary, teacher assessment

Components: `TierPill`, `TierLegendBar` in `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`.

### Two Trust-Level Spreadsheets

The main connector now conceptually supports two trust spreadsheets (though UI currently handles one at a time):
- **Mid-year data capture** — the existing connector, parsed by `parseSpreadsheet()`
- **Autumn Term data capture** — same sheet structure as mid-year; can be loaded as a second file or parsed from the per-school Data Summary

Both have identical structure: year-group-per-tab, school-per-row (CVPS/CHPS/FPS/GHPS/HPS/LPS/LGPS).

### Per-School Data Summary File Structure

Files like `Copy of 2025 to 2026 LGPS Data summary.xlsx` have a different structure to the trust-level spreadsheet:
- One sheet per year group (EYFS through Y6)
- Each sheet has row structure:
  - Row matching "end of previous year" → EOY previous
  - Row matching "autumn" → Autumn Term T1
  - Row matching "mid year" → Mid-year T2
  - Row matching "end of year" → EOY current
  - Row matching "target" → EOY target
- For Y6 specifically: additional rows with KS1 and EYFS baseline data
- Columns: All pupils | FSM6 | Not FSM6, each group: R ARE, R GD, W ARE, W GD, M ARE, M GD, C ARE, C GD, [Phonics/MTC]

Parsed by `parseSchoolDataSummary()` in the Trust Assessor page. Results stored as `SchoolDataSummary` type.

### Outlier Thresholds

| Combined Autumn→Mid delta | Flag |
|--------------------------|------|
| ≤5pp | Normal (3–5pp is typical) |
| >5pp and ≤8pp | Amber pill "Outlier — check" |
| >8pp | Red pill "Significant outlier" |

These thresholds apply per subject (Reading, Writing, Maths, Combined) and to the subgroup comparison (FSM vs Non-FSM delta gap >5pp = unusual).

Writing is the subject most vulnerable to teacher-assessment drift between checkpoints.

### Subgroup Pattern: FSM vs Non-FSM delta

If Non-FSM delta > FSM delta + 5pp, flag as unusual. Typically Pupil Premium spend drives faster FSM progress. Reversed pattern suggests PP investment may not be reaching the intended group — or non-FSM cohort had more headroom.

### KS1 2021/22 Baseline Anchor (Y6 only)

For Y6 schools where the Data Summary includes KS1 2021/22 data:
- KS1 2021/22 = last externally moderated statutory assessment year — tagged as **External**
- Display as: `KS1 2021/22 Combined: 58.9% (External) → Y6 mid-year: 56% (self-reported) = -3pp vs external baseline`
- If mid-year is >5pp above KS1 baseline, surface as a question: "What evidence supports clearing the KS1 baseline by Xpp?"

### Auto-generated Headteacher Questions

When outliers are detected in the intra-year data, the Governor Report (page 4) auto-generates tailored questions instead of the standard five. Rules:
- Red outlier Combined (>8pp): "What's driving the X pp jump? What moderation supported it?"
- Writing jump >8pp: "Writing moderation between Autumn and Mid-year?"
- Non-FSM delta > FSM delta + 5pp: "PP investment appearing to drive non-FSM more than FSM — why?"
- Mid-year >5pp above KS1 baseline: "What evidence supports clearing KS1 baseline by X pp?"
- Always add: "What external validation would give the trust confidence in these figures?"

### Second Connector Slot (School Data Summary)

The connector strip now has a fourth slot: "+ School Summary" — accepts a per-school Data Summary XLSX file. The school is inferred from the filename (e.g. "LGPS Data summary" → LGPS). The summary data is passed to the SchoolTab only when the active school tab matches the summary's school abbreviation.

The summary data enhances:
- Forensic tab → "Intra-Year Progression" section (new, above Research KPIs)
- Forensic tab → "Pre-meeting verification checklist" (new, below Intra-Year)
- Governor Report → Page 4 with intra-year table + auto-generated questions + tier legend

### Test File

`apps/platform/src/lib/trust-assessor/intra-year-progression.test.ts` — 18 tests covering:
- Outlier threshold logic (5pp amber, 8pp red, boundaries)
- KS1 baseline gap calculation
- FSM subgroup pattern detection
- Governor report rendering with intra-year data
- Tier legend always visible
- Graceful fallback with no data

