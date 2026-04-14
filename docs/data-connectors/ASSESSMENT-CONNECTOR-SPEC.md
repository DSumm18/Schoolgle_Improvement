# Assessment Data Connector — Specification

## Purpose

Connects pupil assessment data from the school's MIS (Arbor, SIMS, Bromcom, etc.) into Schoolgle's Lesson Studio. This is the single source of truth for pupil attainment data.

## Data Flow

```
School MIS (Arbor) → CSV Export → Upload to Schoolgle → Pseudonymise (client-side) → pupil_assessments_pseudo table → Lesson Studio reads attainment
```

## CSV Format (What Arbor Exports)

The school exports a CSV from Arbor with these columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `pupil_hash` | text | Yes | Pseudonymised UPN — HMAC-SHA256(UPN + school salt). Generated client-side. |
| `year_group` | integer | Yes | 0=Reception, 1-6 for primary |
| `is_fsm` | boolean | No | Free school meals eligible |
| `is_send` | boolean | No | On SEND register |
| `send_type` | text | No | SPLD, MLD, SLD, PMLD, SEMH, SLCN, HI, VI, MSI, PD, ASD, OTH |
| `is_eal` | boolean | No | English as additional language |
| `is_pp` | boolean | No | Pupil premium eligible |
| `gender` | text | No | M/F |
| `academic_year_start` | integer | Yes | e.g. 2025 for 2025/26 |
| `assessment_period` | text | Yes | Autumn, Spring, Summer, EOY, KS1, KS2 |
| `subject` | text | Yes | Reading, Writing, Maths, Science |
| `attainment_level` | text | Yes | PKF, PKE, WTS, EXS, GDS |
| `scaled_score` | integer | No | SATs scaled score (KS1/KS2) |
| `raw_score` | integer | No | Raw test score |
| `teacher_assessment` | text | No | Teacher assessment band |
| `progress_score` | numeric | No | Progress measure |
| `prior_attainment_band` | text | No | Low, Middle, High |

## How Lesson Studio Uses It

1. **`ls_pupils`** table already has pupils with `pupil_ref` (which IS the `pupil_hash`)
2. **`pupil_assessments_pseudo`** gets populated with the CSV data
3. Lesson Studio joins `ls_pupils.pupil_ref = pupil_assessments_pseudo.pupil_hash`
4. Latest attainment per subject feeds into:
   - Dashboard stats (At Expected+, Greater Depth, Below Expected)
   - Differentiation group assignment
   - Prerequisite gap analysis
   - Adaptive difficulty engine

## Connector Registration

Defined in `apps/platform/src/lib/data-connectors/sources/live-mis.ts` as `live-assessments`.

## Pseudonymisation

- HMAC-SHA256 with school-specific salt stored in browser localStorage
- Salt NEVER leaves the browser
- Server only receives hashed identifiers
- Names shown in Lesson Studio use `display_name_encrypted` from `ls_pupils` (separate field, resolved client-side)
- See `apps/platform/src/lib/pupil-pseudonymiser.ts` for implementation

## Sample File

See `docs/data-connectors/sample-arbor-assessment-export.csv` for a template with real pupil_hash values from Grove House test data.

## What Needs to Happen

1. School uploads CSV via the data connector UI
2. Client-side pseudonymiser hashes UPN → pupil_hash
3. Data goes into `pupil_assessments_pseudo`
4. Lesson Studio reads latest assessment per pupil per subject
5. Updates `ls_pupils.attainment_reading/writing/maths/science` from latest assessment data
