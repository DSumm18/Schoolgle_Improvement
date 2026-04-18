# Trust Assessor — Product Knowledge Base

**This is the single source of truth for the Trust Assessor product. Any Claude session, human developer, or agent working on this product must start here.**

Last updated: 2026-04-18
Product lead: David Summerscales
Context: Schoolgle School Improvement module

---

## 1. Product Strategy

### The three data tiers (sales funnel)

| Tier | Source | Price | Proves |
|---|---|---|---|
| **Tier 1** | Trust's own spreadsheet | Free hook | Internal inconsistencies, statistical impossibilities, data-quality alerts |
| **Tier 2** | + Schoolgle DfE warehouse | Paid subscription | National percentile, 3-yr validated KS2 comparison, Bradford/local benchmark |
| **Tier 3** | + Per-pupil CTF files | Premium per-school | Individual pupil journeys, over-levelling proof, Ed intervention plans, governor reports |

### Demo strategy for Alex's meeting (Pennine Academies Yorkshire)

- **Scene 1 (Shock):** Tier 1 analysis of trust spreadsheet → data quality flags, 0% GD patterns, year-group drops
- **Scene 2 (Validation):** + DfE layer → Farnham at 8th national percentile, predictive accuracy check
- **Scene 3 (Crown jewel, post-meeting):** + Grove House CTF → over-levelling proof, per-pupil cards, intervention plans

**Grove House is the reference school** — David's brother Alex Summerscales is headteacher. We have 473 unique pupils and 7,143 assessment records over 6 years. Use privately with Alex Aitken (Pennine enablement partner) to show what's possible, NOT in the wider trust meeting itself.

### Business angles that must be reinforced throughout

1. **"This wouldn't happen with Schoolgle"** — continuous assessment catches drift in Term 2 Y2, not Term 5 Y6
2. **"Research-backed not opinion-based"** — findings cite DfE, EEF, Strand/Demie, NALDIC, Ofsted — schools can't dispute their own regulator's data
3. **"Ed creates the plan, not just flags the problem"** — intervention plans per named pupil
4. **"Governor pack in one click"** — replaces 4 hours of HT/SBM work
5. **"Works for any trust"** — must be generic, not Grove-House-hardcoded

### Keep-the-wolves-away dynamic

Schools game self-reported data under inspection pressure. Headteachers resist transparency because it exposes performance. DPOs will try to block adoption because CTF ingestion "touches pupil data." Our counters:

- **Research citations** — unassailable evidence base
- **Pseudonymised-only per-pupil data** — HMAC-SHA256, no PII on the server
- **DPIA-ready** — data processing agreements, audit logs, right-to-delete
- **Value-first messaging** — "see what you could unlock" not "you're failing"

---

## 2. What Supabase DfE schema ACTUALLY contains

**23 tables. 9 populated. 14 empty (schema exists, data not loaded).**

### Tables with data — ready to use NOW

| Table | Rows | Key fields | Used in Trust Assessor? |
|---|---|---|---|
| `schools` | 52,152 | urn, name, la_name, postcode, number_of_pupils, percentage_fsm, trust_name, head_first_name, head_last_name, date_of_last_inspection | ❌ NO |
| `ks2_results` | 2,057,600 | urn, academic_year_start, subject, breakdown_topic, breakdown, expected_standard_pct, higher_standard_pct, average_scaled_score, progress_measure_score | ✅ YES |
| `exclusions` | 1,126,026 | urn, academic_year, exclusion_counts | ❌ NO |
| `workforce` | 207,590 | urn, fte_teachers, pupil_teacher_ratio, teaching_vacancy_rate, teachers_with_qts_pct, average_teacher_pay | ❌ NO |
| `attendance` | 205,867 | urn, overall_attendance_pct, persistent_absence_pct, authorized_absence_pct, illness_absence_pct | ❌ NO |
| `census` | 146,600 | urn, number_on_roll, fsm_pct, eal_pct, sen_pct | ✅ YES |
| `ofsted_inspections` | 36,354 | urn, inspection_date, overall_rating, quality_of_education, behaviour_and_attitudes, leadership_and_management | ❌ NO |
| `area_demographics` | 32,844 | lsoa_code, imd_rank, imd_decile, income_deprivation_score, ethnicity breakdown, education_deprivation_score | ❌ NO |
| `school_profiles` | 27,161 | urn, extended school profile | ❌ NO |

### Tables with schema but EMPTY — need data loading

| Table | Rows | What's in schema |
|---|---|---|
| `ks1_results` | 0 | phonics_pass_pct, gld_pct, reading_pct, writing_pct, maths_pct, science_pct |
| `pupil_premium` | 0 | ever_6_fsm_count, current_fsm_count, service_children, adopted_from_care, pupil_premium_funding_gbp |
| `trusts` | 0 | Trust-level metadata |
| `school_area_links` | 0 | **Critical — links URN to LSOA for deprivation analysis** |
| `school_infrastructure` | 0 | Building data |
| `school_history` | 0 | URN changes (academy conversions) |
| `area_crime` | 0 | |
| `air_quality` | 0 | |
| `local_authority_finance` | 0 | |
| `local_authority_performance` | 0 | |
| `latest_ks2_results` | — | View |

---

## 3. Data we CAN surface immediately (no new data loading)

### Per Pennine school, we can pull:

**From `dfe_data.schools`:**
- Grove House: 417 pupils, 28.9% FSM, last inspected ... null (should be 2023-11-21 from ofsted_inspections)
- Farnham: 449 pupils, 27.4% FSM — was Outstanding 2016, Good Dec 2023 (downgraded)
- Full headteacher names, postcodes, trust affiliation

**From `dfe_data.attendance` (mid-year 2025/26):**
- Grove House: 94.48% attendance, 16.95% persistent absence
- Farnham: 94.33% attendance, 19.78% persistent absence
- Hollingwood: 93.98% attendance, 19.20% persistent absence
- All Pennine schools have persistent absence 16-27% — well above the national median of ~19%

**From `dfe_data.workforce`:**
- Grove House FTE teachers: 21.39 (2024) → 19.20 (2025) — loss of 2 FTE
- Lidget Green: 25.14 (2024) → 22.40 (2025) — loss of 2.7 FTE
- Hollingwood: 17.80 → 17.00 — minor loss
- Crossley Hall: 28.99 → 35.80 — gained 7 FTE
- **Pattern: trust-wide teacher turnover is visible and should be called out**

**From `dfe_data.ofsted_inspections`:**
- Grove House: RI in 2018, upgraded to Good in Nov 2023 — improvement trajectory visible
- Farnham: Outstanding 2016 → Good Dec 2023 — downgrade narrative
- Clayton Village: Good Dec 2024 (recent)
- 4 Pennine schools haven't been inspected since 2014-2017 — overdue

### Bradford local benchmarking (Tier 2 free upgrade)

**157 Bradford primary schools** in our DB. We can compute:
- Median Bradford attainment per year
- Deprivation-matched peer set (schools with 25-35% FSM in Bradford)
- "You're at the X percentile among Bradford primaries with similar FSM%"

**Cost: zero. Just SQL.**

---

## 4. CTF data — what we have vs what's in the file

### In `pupil_assessments_pseudo` schema (22 columns):

| Field | Populated for Grove House? | Notes |
|---|---|---|
| `pupil_hash` | ✅ 473 unique | HMAC-SHA256 |
| `year_group` | ✅ | 0-6 |
| `subject` | ✅ | reading/writing/maths/phonics/EYFS areas |
| `attainment_level` | ✅ | WTS/EXS/GDS/PK1-4/1/2 |
| `teacher_assessment` | ✅ 6394/7143 | Good coverage |
| `academic_year_start` | ✅ | 2020-2025 |
| `is_fsm` | ⚠️ Partial | Missing for 2022/23 cohort |
| `is_send` | ⚠️ Partial | Missing for 2022/23 cohort |
| `is_eal` | ⚠️ Partial | Missing for 2022/23 cohort |
| `gender` | ⚠️ Partial | Missing for 2022/23 cohort |
| `scaled_score` | ⚠️ 749/7143 | Phonics only |
| **`send_type`** | ❌ 0/7143 | **VI/HI/ASD/SEMH/SLCN/MLD/SLD/PMLD/PD** — CTF parser skipping |
| **`is_pp`** | ❌ 0/7143 | Pupil Premium flag — CTF parser skipping |
| **`progress_score`** | ❌ 0/7143 | Per-pupil progress — CTF parser skipping |
| **`prior_attainment_band`** | ❌ 0/7143 | EYFS baseline — CTF parser skipping |
| **`previous_period_level`** | ❌ 0/7143 | Period-over-period — CTF parser skipping |
| **`raw_score`** | ❌ 0/7143 | Raw test scores |

### Critical CTF fields NOT in our schema yet (need schema + parser update)

| Field | What it unlocks |
|---|---|
| EHCP status | Separate from SEN Support — progress vs EHCP outcomes |
| Arrival date in UK | EAL language exposure context |
| FSM6 / ever-6-eligible | DfE statutory disadvantage measure |
| Admission date | Mobility — separating stable cohort from churn |
| Date of birth | Summer-born analysis |
| Home language | EAL nuance (some EAL are fluent bilingual) |

---

## 5. Forensic Methodology (proven in Grove House)

### The four-step evidential pattern

For any cohort anomaly (e.g. "decline"):

1. **Subject-by-subject moderation check** — only unmoderated subjects dropped = assessment drift, not decline
2. **Demographic expectation calculation** — using DfE/EEF gaps, compute expected attainment given FSM/SEND/EAL profile
3. **Before/after comparison** — which period matches demographic prediction? That period is the accurate assessment
4. **Statistical impossibility** — whole-cohort regressions >1-in-500 rarity

### The demographic expectation model (lib/trust-analysis/demographic-expectations.ts)

```
expected = national_baseline 
         - (fsm_pct/100 × fsm_gap)
         - (send_pct/100 × send_gap)
         - (eal_pct/100 × eal_gap_at_year)

where:
  fsm_gap = 18pp at KS1, 20pp at KS2 (EEF)
  send_gap = 25pp at KS1, 30pp at KS2 (EEF)
  eal_gap_at_year = { Y1: 20, Y2: 15, Y3: 8, Y4: 4, Y5: 0, Y6: -2 }
```

The EAL year-group curve is the clever bit — pupils catch up as language develops. This is from Strand, Demie & Lindorff (2018) Oxford/UCL research.

---

## 6. Research Citations Library (lib/trust-analysis/research-citations.ts)

10 citations ready to use:

1. **EEF Pupil Premium Guide 2024** — 18pp KS1, 20pp KS2 FSM gap
2. **Strand, Demie & Lindorff (2018) Oxford/UCL** — EAL trajectory
3. **NALDIC 2020** — 5-7 years for academic English proficiency
4. **DfE KS2 National Statistics 2024** — national baseline 60-61%
5. **DfE KS1 National Statistics 2023** — last statutory year, Reading 68%, Writing 60%, Maths 70%
6. **Ofsted Education Inspection Framework 2024** — inspectors flag schools whose TA exceeds external
7. **STA KS1 Moderation Guidance 2022** — Writing is the moderated KS1 subject
8. **EEF Special Educational Needs 2020** — 25pp KS1 SEND gap
9. **IFS Disadvantage Gap 2023** — gap widened since COVID
10. **Demie 2023 Lambeth LA Stats** — EAL trajectory quantified

Each is cited inline on findings. Schools can't argue with their own regulator's data.

---

## 7. What's built vs what's missing

### Built (in the Trust Assessor page)

- Trust spreadsheet parser (XLSX)
- Per-school tabs with profile header
- AI narrative (Intelligence Brain skills: school-assessment-analyst, trust-overview-analyst, ofsted-readiness-reviewer, data-quality-auditor, governor-assessment-report-writer)
- National percentile rank card (using ks2_results)
- Predictive accuracy check (3-yr DfE average vs mid-year prediction)
- Statistical impossibility alerts (0% GD, impossible swings, FSM errors)
- At-a-glance summary (severity verdict, top 3 findings, KPIs, next step)
- Forensic Verdict per school (demographic-adjusted Y1-Y6)
- Research-backed KPIs per school
- EAL trajectory chart (high-EAL schools)
- Cohort Forensics (Grove House — over-levelling proof)
- Cohort milestones journey (EYFS → Phonics → KS1)
- Per-pupil cards with pseudonyms (Blue Robin 42)
- Per-pupil weakest subject + "Plan with Ed" button
- Demographic disaggregation ("Defend your numbers")
- Governor Report Generator (4-page A4 HTML, AI-driven)
- Google Drive connector
- Data enrichment callout
- Non-GHPS Tier 3 upsell

### NOT built / broken / missing

| Issue | Priority |
|---|---|
| Visual design doesn't match Schoolgle platform (fonts, dark mode, motion style) | HIGH |
| Animations fire on mount not on scroll — user misses them | HIGH |
| Warning icons with no clear meaning | HIGH |
| Big product-pitch card needs fold-out tooltip | MEDIUM |
| Cohort Forensics is Grove-House-hardcoded, not generic | HIGH |
| Ofsted inspection history NOT displayed anywhere | HIGH |
| Attendance / persistent absence NOT displayed | HIGH |
| Workforce (teacher FTE turnover) NOT displayed | HIGH |
| Bradford/local benchmark NOT implemented | HIGH |
| Area deprivation (IMD) NOT linked — school_area_links empty | MEDIUM |
| CTF parser ignoring: send_type, is_pp, progress_score, prior_attainment_band | HIGH |
| KS1 historical data not loaded into ks1_results table | MEDIUM |
| Pupil Premium table empty — need DfE load | MEDIUM |
| GDPR/DPO readiness — zero work done | HIGH |
| DPIA template document | HIGH |
| Data Processing Agreement template | HIGH |
| Pseudonymisation certificate per import | MEDIUM |
| Connector "holding pit" UX with clear 3-step flow | HIGH |
| Scroll-triggered animations with whileInView | HIGH |

---

## 8. Data acquisition plan

### Phase A — Use what we have (zero cost, immediate)

1. Surface Ofsted history (36k inspections already in DB)
2. Surface attendance / persistent absence (205k rows already in DB)
3. Surface workforce turnover (207k rows already in DB)
4. Bradford local benchmark (157 Bradford primaries in DB)
5. Wire up `dfe_data.schools` metadata (52k schools already in DB)

### Phase B — Populate empty tables with public data (low cost, 1-2 weeks)

1. **KS1 historical data** — DfE CSV download (2018/19-2022/23 final year)
2. **Pupil Premium data** — DfE Pupil Premium Strategy CSV
3. **School → LSOA linkage** — postcode lookup service, populate school_area_links
4. **Trusts table** — DfE GIAS Trust download
5. **School history** — DfE academy conversion data

### Phase C — Enhance CTF parser (2-3 days dev)

1. Extract `send_type` from CTF XML (VI/HI/ASD categories)
2. Extract EHCP status (add to schema)
3. Extract FSM6 / ever-6
4. Extract admission date (add to schema)
5. Extract date of birth (add to schema for summer-born)

### Phase D — Third-party data acquisition (future)

1. **Accelerated Reader / reading age** — school internal systems (API)
2. **Standardised test providers** (PUMA/PiRA/SATS) — integration
3. **Mental health / SEMH screening** — school well-being systems

---

## 9. Design System (TODO — audit required)

**Must match the rest of Schoolgle platform.**

- [ ] Review Lesson Studio design language
- [ ] Document Schoolgle font stack
- [ ] Document colour palette (module accents, semantic colours)
- [ ] Document spacing / radius tokens
- [ ] Document animation tokens (durations, easings)
- [ ] Document card / panel patterns
- [ ] Dark mode strategy
- [ ] Governor-appropriate typography scale

**Action:** explore `apps/platform/src/app/(dashboard)/.../lesson-studio/` and other module homepages, document the tokens, rebuild Trust Assessor using those tokens.

---

## 10. GDPR / DPO readiness (TODO)

Must have these before talking to any school's DPO:

- [ ] Data Protection Impact Assessment (DPIA) template
- [ ] Data Processing Agreement (DPA) template
- [ ] Pseudonymisation certificate — proving PII never leaves school
- [ ] Right-to-delete audit flow
- [ ] Access audit log (who viewed what pupil data when)
- [ ] Retention policy (how long is pseudonymised data kept?)
- [ ] Legal basis document (contract basis for DfE data)
- [ ] Child-safeguarding review
- [ ] ICO registration confirmation (Schoolgle ZC103199)
- [ ] DPO FAQ pack — common objections + answers

**Critical:** the DPO concern is the biggest adoption blocker. Headteachers rely on DPO to say no. If we pre-empt every DPO objection with a written answer, we remove the blocker.

---

## 11. Generic scaling rules (for any trust)

For the Trust Assessor to work out-of-box for any trust uploading any spreadsheet:

1. **Spreadsheet parser must auto-detect schema** — use `SHEET_PROFILES` with heuristics, not hardcoded column positions per school
2. **Demographic inference from DfE schools table** — if user has URN, auto-pull FSM%, EAL%, SEND% from census/schools tables
3. **Forensic methodology must be data-driven** — no "Grove House" strings in the code, replace with `{{school.name}}`
4. **AI narrative prompts must be school-agnostic** — all current prompts already are
5. **Connector UX must show what unlocks** — explicit tier meter at the top
6. **Fall-through logic** — if tier 3 data missing, show tier 2 + clear CTA to upgrade
7. **Licensing gate** — feature flags per subscription tier

---

## 12. Files and references

### Code locations
- Main page: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`
- API routes: `apps/platform/src/app/api/trust-analysis/` + `/api/trust-assessor/`
- Helpers: `apps/platform/src/lib/trust-analysis/`
  - `types.ts` — PENNINE_SCHOOLS, URN mapping
  - `demographic-expectations.ts` — prediction model
  - `research-citations.ts` — 10 citations + KPI engine
  - `report-templates/governor-assessment.ts` — HTML report template
- Intelligence Brain: `apps/platform/src/lib/intelligence-brain/skills.ts`

### Key memory files (persist across Claude sessions)
- `project_trust_assessor_methodology.md` — forensic method
- `project_alex_meeting_demo.md` — demo script
- `project_pennine_product_strategy.md` — sales funnel
- `project_trust_analysis_four_tiers.md` — pricing tiers

### User preferences (persistent)
- David Summerscales — CEO, Schoolgle
- Direct no-nonsense feedback
- Values: prove-with-data, not-hypothesis, match-existing-UI, scroll-trigger-animations
- Dislikes: wall-of-text AI output (use prose), fabricated data, feature bloat without design rigour
- Demo audience: Alex Aitken (Pennine), then heads/CEOs downstream

---

## 13. Next priorities (as of 2026-04-18)

**Immediate (before more features):**

1. ✅ Audit DfE schema — DONE (this document)
2. ⏳ Review Schoolgle platform design system (fonts, motion, dark mode)
3. ⏳ Surface existing DfE data: Ofsted history, attendance, workforce, Bradford benchmark
4. ⏳ Fix scroll-triggered animations (use `whileInView`)
5. ⏳ Make Cohort Forensics data-driven (remove Grove House hardcoding)
6. ⏳ GDPR / DPO document pack

**Short term:**

7. Enhance CTF parser (send_type, EHCP, progress_score, prior_attainment_band)
8. Populate KS1 historical data, Pupil Premium
9. Connector "holding pit" UX redesign
10. Fold-out tooltips for product pitch sections

---

## 14. Conversation log — key decisions made

- 2026-04-17: Adopted 3-tier data architecture
- 2026-04-17: Research citations library committed — EEF, DfE, Strand/Demie, NALDIC, STA, Ofsted
- 2026-04-17: Governor Report Generator deployed (4-page HTML template)
- 2026-04-17: Forensic methodology proven on Grove House (over-levelling at KS1)
- 2026-04-18: Full DfE schema audit — revealed 21 unused tables, 9 populated, 14 empty
- 2026-04-18: Visual design and animation gaps acknowledged — requires redesign phase
- 2026-04-18: GDPR/DPO readiness identified as adoption blocker — requires document pack

---

**Rule:** Update this document after any significant conversation. Do not lose context between sessions.

---

## 15. Decisions locked in 2026-04-18 (late session)

### Platform architecture (final)

**Three layers:**

1. **Data & Intelligence Platform (backend, invisible)**
   - Connectors, storage, Intelligence Brain, DfE warehouse, `school_events` Timeline
   
2. **School Intelligence module (user-facing reporting hub)**
   - Contains: Visualize (renamed Trust Analysis), Trust Assessor, future report templates
   - Where users go to SEE analysis
   - Productised — works for any school/trust
   
3. **Tools modules (what schools buy)**
   - Ofsted Readiness, Lesson Studio, Governance Portal, Assessment Tracker
   - Tools PRODUCE data, feed Timeline
   - School Intelligence REPORTS on that data

### The Timeline is the unifying layer

- One `school_events` table
- Every app writes to it on significant events
- Shared UI component overlays on performance graphs
- Shows causality: finding → action → intervention → measured impact
- Adopts the shape of `sim_studio_timeline_events` which already has the right fields
- Replaces fragmentation of 4 existing scattered event stores (audit_log, tool_audit_logs, sim_studio_timeline_events, InterventionEvent)

### Bidirectional validation principle

Forensic methodology applies both ways:
- Under-performers: is there a reason (demographics, teaching quality, leadership change)?
- Over-performers: are the numbers real or are they gaming?
- Same research-backed framework, applied honestly

### Closed-loop intervention cycle

```
Trust Assessor finds problem (event)
→ Ofsted Readiness creates action w/ EEF citation (event)
→ Lesson Studio delivers (event)
→ Assessment Tracker measures impact (event)
→ Trust Assessor re-analyses — improved? yes/no
→ If no: lesson observation → teacher feedback → possible HR process
```

All events on one Timeline = full audit trail = Ofsted-ready evidence.

### The "basic product" — assessment snapshot timeline

Before per-pupil data, the product works for any school via:
- School uploads assessment data each term (T1, T2, T3)
- Each upload = locked immutable snapshot
- Cohort progression tracked through snapshots
- No MIS connection needed for basic tier

### Decision: Starting phase = Option C

**Phase 1 (schema) + Trust Assessor event wiring + Timeline UI** — delivers visible value for Alex Aitken's Pennine meeting while laying foundation for everything else.

### Design requirements for Timeline UI

- MUST match existing Schoolgle design system (fonts, colours, spacing, motion tokens)
- Audit Lesson Studio + other modules for design language first
- Use `whileInView` scroll-triggered animations (not mount-fired)
- Category colour-coded events
- Causality chain connectors animate in
- Filterable by event type / date / source app
- Overlayable on performance graphs

### Research portfolio — next workstream

After Timeline foundation, build curated research library:
- Academic citations ranked A/B/C/D
- External data source catalog (Police.uk, Land Registry, IMD LSOA, etc.)
- Bidirectional validation tests (Grove House + Hollingwood contrast)
- Brain skills cite from this library


---

## 16. Timeline build log 2026-04-18

### What was built

**Migration — `apps/platform/supabase/migrations/20260418_school_events.sql`**
- Creates `public.school_timeline_events` table (renamed from `school_events` to avoid collision with existing calendar booking table)
- 20 columns: identity, timing, content, source/causality, attribution, evidence/metadata, tags
- 7 indexes including partial index on `metadata->>'school_urn'` for fast per-school queries
- RLS policies scoped via `organization_members.auth_id = auth.uid()` (not `user_id` which is text/Firebase UID)
- Applied live to `ygquvauptwyvlhkyxkwy` Supabase project via pg direct connection
- Migration verified: all 20 columns present, all 7 indexes created

**Event Registry — `apps/platform/src/lib/school-events/registry.ts`**
- 20 event type definitions across 7 source apps
- 8 Trust Assessor types: `ta.forensic-finding`, `ta.national-percentile`, `ta.predictive-accuracy-gap`, `ta.research-kpi-failed`, `ta.cohort-mismatch`, `ta.statistical-alert`, `ta.eal-trajectory-concern`, `ta.demographic-expectation-breach`
- 4 Ofsted Readiness stubs ready for future wiring
- 3 Lesson Studio stubs ready for future wiring
- 5 system events (DfE inspections, academy conversion, staff changes)
- `CATEGORY_COLORS` — 10 categories with Tailwind semantic palette (no hex)
- `SEVERITY_COLORS` — 5 severities with semantic palette
- `SOURCE_LABELS` — 7 source human labels
- 17 unit tests, all green

**Types — `apps/platform/src/lib/school-events/types.ts`**
- `SchoolEvent` — database row shape
- `SchoolEventInsert` — insert shape
- `SchoolEventFilters` — query parameter type

**Trust Assessor Event Emitter — `apps/platform/src/lib/school-events/emit-trust-assessor.ts`**
- Called client-side in a `useEffect` when a SchoolTab mounts
- De-duplicates by checking for existing events for school + academic year before inserting
- Emits: national percentile, predictive accuracy gap, statistical alerts, forensic verdict, failed research KPIs, EAL trajectory concern, cohort mismatch
- All non-fatal — never blocks UI

**API Routes**
- `GET /api/events` — paginated list (limit 500 max), filters: category, severity, source_app, from, to, school_urn
- `POST /api/events` — single event creation with registry validation
- `POST /api/events/batch` — batch insert (up to 100 events), used by Trust Assessor
- Both use `protectedRoute` wrapper + `createServiceRoleClient()` for bypass of RLS on insert

**Timeline Component — `apps/platform/src/components/school-events/Timeline.tsx`**
- Vertical timeline with left-aligned dot column, central connecting line, right content column
- Category-coloured dots (w-3 h-3, ring-2 ring-background) with spring scale animation on scroll entry
- Day-grouped events with sticky day labels (bg-background/80 backdrop-blur)
- Event cards: `bg-card border border-border rounded-2xl`, card-hover lift pattern
- Header: category pill + severity badge + source badge + relative time
- Expandable: shows impact_summary, event_type, recorded date
- All animations use `whileInView viewport={{ once: true, amount: 0.3 }}` — never mount-fired
- Spring: `{ type: 'spring', damping: 30, stiffness: 250 }`
- Category/severity/source filters + date range picker
- Skeleton loading (3 cards) + empty state
- `variant="embedded"` for Trust Assessor inline, `variant="full-page"` for `/timeline`

**Trust Assessor page wired (`page.tsx`)**
- `useEffect` at SchoolTab level computes forensic verdict + KPIs + EAL/cohort flags using same logic as render sections, emits via `emitTrustAssessorEvents`
- `eventsEmittedRef` prevents double-fire
- Timeline section renders below At-a-glance with "View full timeline →" link
- State: `timelineEvents`, `timelineLoading`

**Full-page timeline (`/timeline/page.tsx`)**
- Rewrites old audit log page to use new `school_timeline_events` table
- Supports `?school=URN` query param to filter by school
- School name lookup from URN for display
- Paginated load-more, 50 events per page

### Key decisions

1. **Table name collision**: `school_events` already existed as a calendar booking table. Renamed to `school_timeline_events`. All code uses this name.

2. **RLS auth column**: `organization_members.auth_id` (uuid, Supabase auth) is correct for RLS. `user_id` is text/Firebase UID and cannot be compared to `auth.uid()`. Applied the fix in migration.

3. **No causality chain SVG**: The animated SVG causality connector described in spec was intentionally deferred — requires event IDs to be resolved client-side before rendering. The expand/collapse pattern achieves the same information density with less complexity for v1.

4. **emitter is non-fatal**: All event emission errors are caught and logged as warnings — they must never block the Trust Assessor UI which is the primary user value.

### Test evidence

```
Test Files  1 passed (1)
Tests       17 passed (17)
Build       ✓ Compiled successfully in 16.0s
Migration   school_timeline_events: 20 columns, 7 indexes — applied to ygquvauptwyvlhkyxkwy
```

### Files created/modified

| File | Status |
|------|--------|
| `apps/platform/supabase/migrations/20260418_school_events.sql` | Created |
| `apps/platform/src/lib/school-events/registry.ts` | Created |
| `apps/platform/src/lib/school-events/types.ts` | Created |
| `apps/platform/src/lib/school-events/emit-trust-assessor.ts` | Created |
| `apps/platform/src/lib/school-events/registry.test.ts` | Created |
| `apps/platform/src/app/api/events/route.ts` | Created |
| `apps/platform/src/app/api/events/batch/route.ts` | Created |
| `apps/platform/src/components/school-events/Timeline.tsx` | Created |
| `apps/platform/src/app/(dashboard)/timeline/page.tsx` | Rewritten |
| `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` | Modified (imports + useEffect + Timeline embed) |

### What's next

- Wire Ofsted Readiness module to emit `ofsted.*` events when actions created/updated
- Wire Lesson Studio to emit `lesson.*` events on observation completion
- Add causality chain SVG connector (v2) using `triggered_by_event_id`
- Add `/api/events` to Ed AI intelligence specialist skill catalogue
- Expose timeline in the school intelligence hub sidebar
