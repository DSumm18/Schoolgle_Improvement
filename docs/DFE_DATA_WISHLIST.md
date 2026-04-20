# DfE & Public Data Wishlist — What to Import Next

**Purpose:** A prioritised roadmap of public DfE and adjacent datasets that would enhance Schoolgle's forensic analysis capability. Each entry notes availability, value, effort, and the product unlock.

Last updated: 2026-04-20

---

## Priority 1 — HIGH VALUE, AVAILABLE NOW

### 1. Schools Financial Benchmarking (SFB) / CFR
**Status:** 🟢 Import in progress (background agent, 2026-04-20)
**Source:** explore-education-statistics.service.gov.uk / Schools Financial Benchmarking Service
**Per-school:** ✅ Yes
**Unlocks:**
- Teaching £ per pupil
- Average teacher cost (teaching £ ÷ FTE teachers)
- Cost-per-outcome (teaching £ ÷ 1pp KS2)
- Income vs expenditure, surplus/deficit, reserves
- Pupil Premium income tracking
- "Is this school expensive because of long-serving teachers?"

### 2. DfE Schools Census pupil-level tables (aggregated)
**Status:** 🟡 Partial — we have `dfe_data.census` but only basic fields
**Source:** DfE Schools Census statistics (January return)
**Per-school:** ✅ Yes
**Fields we don't have yet:**
- Pupil Premium eligibility %
- FSM6 (ever-eligible) vs current FSM
- SEND breakdown (SEN Support vs EHCP)
- Ethnicity breakdown
- First language breakdown
- Mobility (pupils who arrived/left during year)
- Summer-born %
**Unlocks:** Finer-grained demographic forensics, FSM6 for statutory disadvantage gap

### 3. Pupil Premium spending statements
**Status:** ❌ Not imported
**Source:** Schools publish on their own websites; DfE aggregates annually
**Per-school:** ✅ Yes (PDF-per-school, plus aggregated CSV)
**Unlocks:**
- How schools USE their PP funding
- Spend per eligible pupil
- Stated strategies (tutoring, curriculum, pastoral)
- Flagged vs outcomes — did the spend convert?

### 4. School Workforce Census — detailed teacher data
**Status:** 🟡 Partial — we have FTE totals but not detail
**Source:** DfE School Workforce Census (November return)
**Per-school:** ✅ Yes (some suppression for small schools)
**Fields missing:**
- Teacher turnover rate (entrants/leavers)
- Average teacher pay
- % with QTS
- % leadership
- Teaching vacancies
- Age/experience distribution
- Subject specialisms (for secondaries)
**Unlocks:**
- "Is Hollingwood expensive because experienced teachers?"
- Teacher retention as a leading indicator of school health
- Subject-specific capacity (e.g. secondary Maths teacher shortage)

### 5. KS4 attainment per school (secondary)
**Status:** 🟡 Table exists (40,285 rows) but not surfaced in Trust Assessor
**Source:** DfE KS4 statistics
**Unlocks:**
- Progress 8 score per school (THE headline secondary metric)
- Attainment 8, EBacc entry/average point, basics (5+ 4-9 inc E&M)
- Secondary analog to KS2 for our Impact Education analysis
- Primary→Secondary cohort tracking (same pupils, different phase)

### 6. Ofsted sub-judgements (we have overall, need more detail)
**Status:** 🟡 Partial — we have overall_rating, qoe, behaviour, leadership
**Source:** Ofsted inspection reports
**Fields missing:**
- EYFS judgement
- Sixth form judgement
- Safeguarding outcome (effective/not effective)
- Specific recommendations text
- Previous inspection comparisons
**Unlocks:** Inspector-perspective context on framework compliance

### 7. Absence reasons breakdown
**Status:** 🟡 We have overall + PA only; not reasons
**Source:** DfE Pupil Absence Statistics
**Fields missing:**
- Illness absence %
- Medical appointments %
- Authorised holiday %
- Unauthorised holiday %
- Religious observance %
- Late absence %
**Unlocks:** Pattern detection (e.g. high unauthorised holiday = cultural factor; high illness = mental health signal)

---

## Priority 2 — MEDIUM VALUE, MORE EFFORT

### 8. School-to-LSOA linkage
**Status:** ❌ Schema exists (`dfe_data.school_area_links`) but empty
**Source:** Postcode-to-LSOA lookup (ONS Postcode Directory, free)
**Effort:** Low (one-time mapping)
**Unlocks:**
- Link schools to `dfe_data.area_demographics` (32k rows with IMD, deprivation, housing)
- True local benchmarking: "Grove House vs schools within 1km in the same IMD decile"
- Catchment analysis (pupil postcode → school postcode distance)

### 9. Teacher retention / destination data
**Status:** ❌ Not imported
**Source:** DfE School Workforce Census "Teacher flows"
**Unlocks:**
- Where do teachers leave to? (Private, other state, out of teaching)
- Retention by pay scale
- Flight risk flagging

### 10. KS1 / Phonics / MTC per school
**Status:** ❌ Confirmed NOT PUBLISHED per school by DfE
**Source:** Only via Primary Assessment Gateway (schools themselves)
**Note:** This is the product moat — Schoolgle's CTF ingestion is the only way
**See:** `docs/DFE_DATA_DEFINITIVE_GUIDE.md`

### 11. Progress 8 disadvantage breakdown
**Status:** ❌ Not imported
**Source:** DfE KS4 statistics
**Unlocks:** Disadvantaged-pupil Progress 8 vs non-disadvantaged (secondary equivalent of our KS2 gap analysis)

---

## Priority 3 — CONTEXTUAL, NICE-TO-HAVE

### 12. Police.uk crime data
**Source:** `data.police.uk` API — free, per-postcode, monthly
**Effort:** Medium (API integration, crime within X km of school)
**Unlocks:** "Crime rate in catchment correlates with absence — research cites 3-5pp impact per standard deviation"

### 13. Land Registry Price Paid Data
**Source:** HM Land Registry — free CSV download per month
**Effort:** Medium (large file, filter to postcode prefix)
**Unlocks:** Average house price in catchment as proxy for socioeconomic profile (beyond FSM)

### 14. Local Authority Finance (`dfe_data.local_authority_finance` — empty)
**Source:** DfE LA-level income and expenditure statistics
**Unlocks:** LA-level benchmarking (school vs LA average)

### 15. ONS Census 2021 detailed breakdowns
**Source:** ONS — free
**Effort:** High (large, complex)
**Unlocks:** Per-LSOA ethnicity, language, qualifications, housing tenure — feeds `area_demographics` with more depth

### 16. DfE destination data (post-KS4)
**Source:** DfE Destination Statistics
**Unlocks:** Where do Y11 leavers go? (Sixth form, college, apprenticeship, NEET) — long-term school quality signal

### 17. School complaints / Ofsted inspection complaints
**Source:** Ofsted — not consistently published per school
**Effort:** High / may not be feasible

### 18. Trust-level data (`dfe_data.trusts` — empty)
**Source:** GIAS trust/MAT download
**Effort:** Low
**Unlocks:** Trust-level metrics (total pupils, total schools, central team, growth pattern)

---

## Priority 4 — RESEARCH & THIRD-PARTY

### 19. EEF Teaching & Learning Toolkit (structured data)
**Source:** EEF publishes strategy ratings (impact months, cost, evidence)
**Effort:** Low (one-time import of their ~40 strategies)
**Unlocks:** Research-backed intervention matching (already partially done; formalise)

### 20. NFER / FFT benchmark data
**Source:** Requires commercial partnership
**Effort:** High
**Unlocks:** School-specific Progress 8 / KS2 predictions that are more sophisticated than DfE's

### 21. Teacher pay scale data
**Source:** DfE STPCD (School Teachers' Pay and Conditions Document)
**Unlocks:** Decoding average teacher cost — M1 vs M6 vs UPS3 vs leadership pay ranges

---

## Priority 5 — SPECULATIVE / FUTURE

### 22. Attendance intervention outcomes
**Source:** DfE attendance hub pilots
**Status:** Limited public data

### 23. SEND tribunal outcomes
**Source:** First-tier Tribunal (SEND) — published decisions
**Effort:** High

### 24. School closure / merger announcements
**Source:** DfE press releases / GIAS change feed (partially covered by school_history)

---

## Recommended order

1. **SFB finance** (in progress)
2. **KS4 results surfacing** — we already have the data, just plumb it
3. **School Workforce Census detail** — fills vacancy/pay/turnover gaps
4. **School-to-LSOA link** — unlocks existing `area_demographics` (32k rows)
5. **Absence reasons** — adds depth to attendance forensics
6. **EEF toolkit structured import** — formalises intervention matching
7. **Pupil Premium spending** — cross-references spend vs outcomes
8. **Ofsted sub-judgements + recommendations text** — richer inspection context

Items 1-8 would take Schoolgle from "good" to "genuinely best-in-class for UK primary trust analysis" with ~20 hours of work total.

---

## Multi-spreadsheet connector — spec

**Context:** David's wife has historic trust data capture spreadsheets in potentially different formats year-on-year. Want to ingest ALL of them, align formats, build a timeline of assessments, flag when the format/author changed (could indicate different person doing the levelling).

### Desired behaviour

1. **Upload ≥1 spreadsheet** (via Drive connector or direct upload, multiple files supported)
2. **Auto-detect per-file schema** — sheet names, column headers, year coverage
3. **Normalise to canonical internal schema** — YearGroup × Subject × Metric
4. **Handle format drift** — 2022/23 spreadsheet may have different columns to 2025/26
5. **Build a longitudinal timeline** — each spreadsheet = one snapshot, ordered by date
6. **Flag format changes** — "Format changed in 2024/25 — possibly new author, new approach, or new template"
7. **Highlight attainment trend across snapshots** — same cohort tracked through snapshots
8. **Detect "re-levelling" events** — if the same cohort's attainment jumps between snapshots without a statutory assessment, flag as a levelling change (different teacher, different approach)

### Technical approach

```typescript
interface SpreadsheetSnapshot {
  id: string;
  filename: string;
  uploadedAt: string;
  sourceType: 'drive' | 'upload';
  academicYear: string;  // detected: "2025/26"
  term: 'T1' | 'T2' | 'T3' | 'EOY' | 'unknown';
  submittedDate: string | null;  // detected from filename / sheet metadata
  
  schema: {
    detectedFormat: 'standard-trust' | 'per-school-tabs' | 'per-yeargroup-tabs' | 'custom';
    sheetNames: string[];
    columnHeaders: Record<string, string[]>;  // per-sheet
    confidence: number;  // 0-1
    warnings: string[];
  };
  
  normalised: {
    schools: string[];  // detected abbrevs
    yearGroups: string[];
    metrics: {
      [school: string]: {
        [yearGroup: string]: {
          cohortSize?: number;
          fsm?: number;
          send?: number;
          ehcp?: number;
          reading?: { are: number; gd: number };
          writing?: { are: number; gd: number };
          maths?: { are: number; gd: number };
          combined?: { are: number; gd: number };
          phonics?: number;
          mtc?: number;
        };
      };
    };
  };
  
  integrity: {
    rowsParsed: number;
    rowsRejected: number;
    missingFields: string[];
    suspiciousValues: { field: string; value: any; reason: string }[];
  };
}
```

### Forensic value

Once we have multiple snapshots for the same school across years:

1. **Cohort trace**: Y4 in 2024/25 T1 → Y5 in 2025/26 T1 — same pupils. Does attainment rise sensibly?
2. **Levelling drift**: if Y4 R ARE was 55% in T1 and 70% in T2 (same cohort, 4 months later), that's a re-levelling event — flag.
3. **Author pattern detection**: if the spreadsheet format changes AND levelling jumps simultaneously — the person doing it changed.
4. **Term-on-term progress**: rare external checkpoint opportunity.
5. **Trust-wide drift**: if ALL schools jump in T2 of a given year, it's probably a trust-level directive (moderation exercise or relaxed standards).

### Build phases

- **Phase 1:** Single-spreadsheet ingestion (already done, current Trust Assessor)
- **Phase 2:** Multi-file upload + snapshot storage
- **Phase 3:** Schema auto-detection + normalisation
- **Phase 4:** Longitudinal comparison + drift flagging
- **Phase 5:** AI narrative on drift ("This cohort's Reading ARE jumped 12pp between T1 and T2 of 2024/25 without external assessment — worth confirming whether a different teacher levelled them")

### Storage

New Supabase table:

```sql
create table if not exists public.trust_data_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  filename text not null,
  uploaded_at timestamptz default now(),
  source_type text,
  academic_year text,
  term text,
  detected_format text,
  schema_confidence numeric,
  normalised jsonb not null,  -- the full parsed data
  integrity jsonb,
  raw_file_path text,  -- pointer to uploaded file in Supabase Storage
  created_by uuid references users(id)
);

create index trust_data_snapshots_org on public.trust_data_snapshots (organization_id);
create index trust_data_snapshots_year on public.trust_data_snapshots (academic_year);
```

### UI

- New "Data Snapshots" section in the Trust Assessor
- Shows chronological list of uploaded spreadsheets
- Click a snapshot → view the parsed data
- "Compare snapshots" → diff view showing changes
- "Export timeline" → cohort trace across snapshots

---

## How to use this document

- Start of any new Trust Assessor session: review this wishlist for context
- Add new dataset candidates when encountered
- Mark items 🟢 when done, 🟡 when partial, ❌ when not started
- Update effort estimates as real work lands
