# DfE Data — Definitive Reference Guide

**Last updated:** 2026-04-15
**Purpose:** Single source of truth for what DfE data exists, where it comes from, what's in our database, and what schools need to provide. NEVER DO THIS RESEARCH AGAIN — consult this document.

---

## 1. What DfE Publishes at SCHOOL Level (Publicly Available)

| Dataset | Year Groups | Available Years | Published Where | In Our DB? |
|---------|-------------|-----------------|-----------------|------------|
| **KS2 Results** | Y6 | 2022/23 — 2024/25 | `api.education.gov.uk/statistics` + performance tables download | **YES** — `dfe_data.ks2_results` (2M+ rows, all England schools) |
| **KS4 Results** | Y11 | Multiple years | Same API | YES — `dfe_data.ks4_results` (40K rows) |
| **Census** | Whole school | 2019/20 — 2024/25 | Same API | YES — `dfe_data.census` (146K rows) — demographics only (NOR, FSM%, EAL%, SEN%, ethnicity) — **NO attainment data** |
| **Attendance** | Whole school | Multiple years | Same API | YES — `dfe_data.attendance` (206K rows) |
| **Exclusions** | Whole school | Multiple years | Same API | YES — `dfe_data.exclusions` (1.1M rows) |
| **Workforce** | Whole school | Multiple years | Same API | YES — `dfe_data.workforce` (208K rows) |
| **School Directory (GIAS)** | N/A | Current | `get-information-schools.service.gov.uk` | YES — `dfe_data.schools` (52K rows) |

## 2. What DfE Publishes ONLY at National/LA Level (NOT School Level)

| Dataset | Published Where | School Level? |
|---------|-----------------|---------------|
| **KS1 Results** (Reading, Writing, Maths) | Explore Education Statistics | **NO** — aggregate only. KS1 became non-statutory from 2023/24. Was on old performance tables (now retired). |
| **EYFSP / GLD** | Explore Education Statistics | **NO** — LA level only |
| **Phonics Screening** | Explore Education Statistics | **NO** — LA level only |
| **MTC** (Multiplication Tables Check) | Explore Education Statistics | **NO** — DfE explicitly states they don't publish school-level MTC |

### Critical: Census Does NOT Contain Attainment Data

The `census` table contains ONLY:
- `number_on_roll`, `number_of_boys`, `number_of_girls`
- `fsm_pct`, `eal_pct`, `sen_pct`, `mobility_pct`
- Ethnicity breakdowns (`white_british_pct`, `asian_pct`, etc.)

It does **NOT** contain reading/writing/maths percentages, phonics results, GLD, or any assessment data at any level.

## 3. What Schools Have (That We Need Them to Upload)

Schools possess rich assessment data that DfE no longer publishes at school level:

### Census Return (XML)
- Submitted to DfE termly
- Contains: pupil-level data including year group, FSM, SEND, EAL, ethnicity
- **Does NOT contain attainment levels** — the census is about pupil characteristics, not assessment results

### CTF (Common Transfer File) — XML v3
- Transferred between schools when pupils move
- Contains: UPN, prior attainment, assessment results, SEN status
- We have a parser: `apps/platform/src/lib/ctf-xml-parser.ts`

### Assessment Manager XML / MIS Exports
- Exported from Arbor, SIMS, Bromcom, etc.
- Contains: per-pupil attainment by subject, year group, assessment period
- Levels: WTS (Working Towards), EXS (Expected Standard), GDS (Greater Depth)
- Plus: scaled scores, teacher assessment grades, progress scores
- **This is the richest source** — richer than census or CTF
- We have a sample: `docs/data-connectors/sample-arbor-assessment-export.csv`

### What We Have for Grove House (URN 148201)
- **20 XML files** in `.tmp-xml/`: 6 FSP (EYFS), 2 KS1, 1 KS2, 11 Phonics
- **CTF parser** already built and tested
- **Import script**: `scripts/import-grove-house-data.ts`
- **Import plan**: `docs/superpowers/plans/2026-04-02-grove-house-data-import.md`
- **Organization ID**: `d9d1ac2c-5eff-4043-98f4-e1c43f616fd3`
- **Supabase table**: `pupil_assessments_pseudo` (pseudonymised per-pupil data)

## 4. Data Richness Comparison

| Data Source | Per-Pupil? | Year Group? | FSM/SEND? | R/W/M Levels? | Scaled Scores? | Progress? |
|-------------|-----------|-------------|-----------|---------------|----------------|-----------|
| DfE KS2 (public) | No (school %) | Y6 only | By breakdown | YES | YES | YES (2023) |
| DfE Census (public) | No (school %) | No | YES (whole school) | **NO** | **NO** | **NO** |
| School Census XML | Yes | Yes | Yes | **NO** (characteristics only) | **NO** | **NO** |
| Assessment Manager / MIS Export | **Yes** | **Yes** | **Yes** | **YES** | **YES** | **YES** |
| CTF XML | Yes | Yes | Partial | Yes (prior attainment) | Yes | No |
| Trust Spreadsheet (self-report) | No (year group %) | Yes | Partial (FSM6/NonFSM) | Yes (ARE/GD) | No | No |

**Conclusion: Assessment Manager / MIS exports (Arbor, SIMS, etc.) are the richest source.** They give us per-pupil, per-subject, per-assessment-period data with attainment levels, scaled scores, and can be cross-referenced against FSM/SEND/EAL/PP status.

## 5. Supabase Database Architecture

### Public Schema (Views)
All `public.` tables for DfE data are **VIEWS** pointing to `dfe_data.` tables:
- `public.ks2_results` → `dfe_data.ks2_results`
- `public.census` → `dfe_data.census`
- `public.attendance` → `dfe_data.attendance`
- etc.

### DfE Data Schema (`dfe_data.`)
The actual tables with data:
- `dfe_data.ks2_results` — 2M+ rows, unique on `(urn, academic_year_start, subject, breakdown_topic, breakdown)`
- `dfe_data.ks1_results` — **EMPTY** (schema exists, 0 rows — school-level KS1 not available from DfE)
- `dfe_data.census` — 146K rows
- `dfe_data.schools` — 52K rows
- `dfe_data.attendance` — 206K rows
- `dfe_data.exclusions` — 1.1M rows
- `dfe_data.workforce` — 208K rows
- `dfe_data._ks2_staging` — temp table for bulk imports

### Pupil-Level Schema (App Data)
- `public.pupil_assessments_pseudo` — pseudonymised per-pupil assessment data (from MIS/CTF uploads)
- `public.school_assessment_imports` — import metadata (file tracking)
- `public.pupil_analysis_insights` — AI-generated analysis per import

## 6. Product Tiers

### Tier 1: Public DfE Data (Free — no agreement needed)
Schools provide: a self-reported spreadsheet (like Pennine's mid-year data capture)
We provide:
- 3-year KS2 track record analysis (validated vs claimed)
- Pipeline consistency checks within their spreadsheet
- Progress measures (school adds/loses value)
- Census demographic trends (FSM%, EAL%, NOR)
- Disadvantage gap analysis
- Data quality flags
- Per-school narrative reports with Ofsted questions

### Tier 2: Census Upload (Requires school agreement)
Schools provide: their assessment exports from Arbor/SIMS/Bromcom
We provide:
- Full cohort journey tracking from EYFS to KS2 (every assessment point)
- Per-pupil attainment analysis (pseudonymised)
- Teacher assessment accuracy validation
- AI-powered intervention recommendations
- Cross-referencing FSM/SEND/EAL/PP against attainment
- Fills every gap in the cohort journey chart

### Data for Tier 2 (What to Ask Schools For)
1. **Assessment Manager export** (CSV/XML from Arbor/SIMS) — the richest source
2. **CTF files** if available — good for prior attainment and transfers
3. **School census XML** — useful for pupil characteristics but NOT for attainment

## 7. URN Mapping Notes

Some schools changed URN when they became academies:
- **Lidget Green PS**: URN 107212 (2023 and earlier) → URN 150016 (2024+, as part of Pennine Trust)
- Always check both URNs when querying historical data

## 8. API Reference

### DfE Public Statistics API
- Base URL: `https://api.education.gov.uk/statistics/v1`
- Publications: `/publications`
- Datasets: `/publications/{id}/data-sets`
- Query: `POST /data-sets/{id}/query`
- School-level location code: `SCH`

### Supabase
- Project: `ygquvauptwyvlhkyxkwy`
- Public views expose `dfe_data.*` tables via REST API
- Direct connection: `postgresql://postgres.ygquvauptwyvlhkyxkwy:...@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`

---

**DO NOT REPEAT THIS RESEARCH. This document is the answer. Update it when things change.**
