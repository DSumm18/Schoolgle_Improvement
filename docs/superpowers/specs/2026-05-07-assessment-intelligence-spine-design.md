# Assessment Intelligence Spine Design

Date: 2026-05-07

## Purpose

Schoolgle needs one shared assessment spine so teacher judgements, manual class snapshots, CTF/MIS imports, Assessment Creator outputs, Trust Assessor analysis and Ofsted Readiness evidence all use the same source-labelled pupil-level data.

The goal is to stop treating spreadsheets as the product. Spreadsheets remain useful import shortcuts, but the product moat is pupil-level evidence over time.

## Product Principle

AI proposes. Teachers approve. Schoolgle stores the evidence trail.

Every assessment number must say:

- where it came from;
- who approved or locked it;
- which period it relates to;
- whether it is public DfE, school self-reported, imported pupil-level data, or teacher-approved assessment evidence;
- whether it is pupil-level truth or a derived aggregate.

No Grove House, Rochdale, Bradford, Pennine or other organisation-specific logic should exist in product code. Demo schools use the same tables and routes as every other school.

## Current Reality

### Existing Useful Pieces

- `pupil_assessments_pseudo` is the best existing pupil-level assessment timeline candidate.
- `school_assessment_imports` is the best existing source/provenance candidate.
- `ls_pupils` is the current pupil profile/enrichment layer, including current class, pupil reference and pupil characteristics.
- `assessment_creator_*` tables exist for blueprints, scans, marking proposals and evidence passports, but current API routes are still mostly mock/in-memory.
- `school_assessment_captures` and `school_assessment_cells` persist aggregate snapshot data, but migrations need firming up.
- Trust Assessor already consumes aggregate DfE, spreadsheet and some pupil-level data.
- Ofsted Readiness already has evidence/finding pipes that can receive assessment evidence summaries.

### Current Risks

- Aggregate spreadsheet values, current `ls_pupils` attainment fields and pupil-level imported assessments can be confused.
- `ls_pupils.attainment_*` is useful current profile data, but it lacks full timeline/provenance.
- `/api/trust-analysis/grove-house` is now org-scoped, but the name is misleading and should become a generic pupil-assessment intelligence route.
- Assessment Creator creates a convincing user journey, but its API routes do not yet persist the final evidence trail.
- Some code-used tables do not have clear migrations in the repo, so the schema needs tightening before we build more on top.

## Target Architecture

```text
Manual Teacher Snapshot
Assessment Creator Evidence Passport
CTF / MIS Assessment Import
Spreadsheet Import with Pupil Mapping
Lesson Studio Formative Assessment
        |
        v
Assessment Source / Import Batch
        |
        v
Pupil Assessment Events
        |
        +--> Derived Class / Cohort Aggregates
        +--> Trust Assessor
        +--> School Intelligence
        +--> Ofsted Readiness Evidence
        +--> Pupil / Class Assessment Views
```

## Canonical Data Model

### Assessment Source Batch

This records where a batch of assessment evidence came from.

Recommended table: keep or formalise `school_assessment_imports`, adding fields if missing.

Required fields:

| Field | Purpose |
| --- | --- |
| `id` | Source batch id |
| `organization_id` | School/trust/local authority scope |
| `school_id` / `school_urn` | School identity |
| `source_kind` | `manual_snapshot`, `assessment_creator`, `ctf_import`, `mis_import`, `spreadsheet_import`, `lesson_studio` |
| `source_label` | Human label shown in UI |
| `source_table` | Origin table or workflow |
| `source_id` | Origin record id |
| `file_name` | Optional source file name |
| `assessment_period` | Autumn 1, Autumn 2, Spring 1, Spring 2, Summer 1, Summer 2, statutory, etc. |
| `academic_year_start` | Numeric year, e.g. `2025` |
| `assessment_date` | Date assessment judgement relates to |
| `locked_at` | When evidence became final |
| `locked_by` | Staff/user id |
| `validation_tier` | `teacher_locked`, `teacher_reviewed_ai`, `imported_external`, `dfe_validated`, `draft` |
| `notes` | Batch-level notes |
| `created_at` | Audit |

### Pupil Assessment Event

Recommended table: extend/formalise `pupil_assessments_pseudo` or introduce a successor view/table if schema drift makes that safer.

Required event fields:

| Field | Purpose |
| --- | --- |
| `id` | Event id |
| `organization_id` | School scope |
| `school_urn` | School identity |
| `source_batch_id` | Link to source/provenance |
| `source_kind` | Denormalised for simple querying |
| `pupil_hash` | Pseudonymised pupil identity |
| `pupil_ref_hash_method` | Hash method, normally `HMAC-SHA256(pupil_ref, organization_id)` |
| `current_pupil_profile_id` | Optional link to `ls_pupils.id` where safe |
| `class_id` | Class at time of assessment |
| `class_name` | Display label at time of assessment |
| `year_group_at_assessment` | Year group at the point of assessment |
| `current_year_group` | Current year group if different |
| `academic_year_start` | Numeric year |
| `assessment_period` | Term/checkpoint |
| `assessment_date` | Date judgement relates to |
| `subject` | Reading, writing, maths, science, SPaG |
| `framework` | School framework, NC, SATs, phonics, MTC, teacher judgement |
| `raw_level` | Original entered/imported level |
| `canonical_level` | Normalised level |
| `is_at_expected` | Boolean |
| `is_greater_depth` | Boolean |
| `scaled_score` | Optional statutory/standardised score |
| `raw_score` | Optional raw score |
| `max_score` | Optional max score |
| `teacher_comment` | Optional teacher explanation |
| `voice_transcript` | Optional speech-to-text transcript |
| `comment_summary` | Optional AI summary after teacher approval |
| `uncertainty_flag` | Teacher marked uncertain/borderline |
| `moderation_status` | `not_moderated`, `needs_moderation`, `moderated`, `challenged`, `confirmed` |
| `evidence_confidence` | `high`, `medium`, `low`, `mismatch` |
| `teacher_decision` | Accepted/edited/rejected where AI proposed |
| `teacher_marks` | Teacher-approved mark if relevant |
| `created_at` | Audit |
| `locked_at` | Audit |

### Pupil Context Snapshot

Each event should carry pupil context at the point of assessment or be joinable to it.

Required context:

- FSM / Pupil Premium;
- SEND;
- EHCP;
- SEN primary need where available;
- EAL;
- gender;
- looked-after / previously looked-after where available;
- current roll status;
- class/year group;
- context source and date.

`ls_pupils` remains the current pupil profile layer. Assessment events can be enriched by hashing `ls_pupils.pupil_ref` using the documented HMAC rule. Do not duplicate pupil identity truth in multiple places without a documented join rule.

## Manual Snapshot MVP

### User Flow

1. Teacher opens Teaching & Learning → Assessment Support.
2. Teacher chooses `Record assessment snapshot`.
3. Teacher selects class, subject, checkpoint/term and assessment date.
4. System loads pupils from `ls_pupils`.
5. Teacher enters one level per pupil.
6. Teacher may add optional comment.
7. Teacher may use voice input to populate the comment.
8. Teacher flags uncertainty where relevant.
9. Teacher locks the snapshot.
10. System writes source batch and pupil assessment events.
11. System derives class/cohort aggregates.
12. Trust Assessor and Ofsted Readiness can consume source-labelled outputs.

### Comment Rules

Comments are optional by default.

Schools may later configure local policy:

- optional comments;
- comments required for below expected;
- comments required for uncertainty;
- comments required for teacher override;
- comments required for moderation challenge.

The MVP should not block teachers from submitting unless the school has explicitly configured stricter rules.

### Voice Input

Voice input is a speed feature, not a separate source of truth.

Flow:

1. Teacher clicks microphone next to a pupil comment.
2. Browser speech recognition captures natural language where supported.
3. Transcript appears in the comment field.
4. Teacher edits transcript before lock.
5. Locked comment is stored as teacher-approved text.

If browser speech recognition is unavailable, the comment field still works manually.

The stored data should distinguish:

- raw transcript where retained;
- final teacher-approved comment;
- optional AI summary if generated.

## Assessment Creator Integration

Assessment Creator remains the richer evidence path.

When a paper/scan workflow finishes:

1. AI proposes marks and misconceptions.
2. Teacher accepts/edits/rejects proposals.
3. Evidence Passport is created.
4. Assessment Creator persists the passport.
5. Assessment Creator publishes teacher-approved pupil assessment events into the same canonical assessment spine.

Manual snapshot confidence is usually lower than Assessment Creator evidence, because it may not contain question-level proof. Assessment Creator evidence can be higher confidence because it links to questions, marks, objectives, misconceptions and teacher decisions.

## Derived Aggregates

Aggregates should be derived from pupil events, not manually retyped where possible.

Required derived outputs:

- class subject ARE/GD percentages;
- year-group subject ARE/GD percentages;
- Combined RWM+ using same-pupil Reading + Writing + Maths intersection;
- SEND / non-SEND splits;
- EHCP / SEN Support splits;
- FSM/PP splits;
- EAL / non-EAL splits;
- gender splits where useful;
- uncertainty counts;
- moderation-needed counts;
- evidence confidence distribution;
- teacher comment themes where approved.

Aggregate tables or materialized views are acceptable for performance, but they must preserve source batch and period metadata.

## Trust Assessor Consumption

Trust Assessor should consume source-labelled derived views:

- DfE validated outcomes;
- public DfE context;
- manual teacher snapshots;
- Assessment Creator evidence;
- CTF/MIS pupil-level imports;
- aggregate spreadsheet imports.

Cards must label the layer clearly.

Examples:

- `Source: manual teacher judgement, Spring 1 2025/26, locked by class teacher`
- `Source: Assessment Creator evidence passport, teacher-reviewed AI marking`
- `Source: DfE KS2 2024/25 revised`
- `Source: CTF/XML pupil assessment import`

Trust Assessor should not compare internal/current teacher snapshots as if they were official DfE validated KS2 outcomes. It can compare them cautiously as current trajectory or live internal assessment.

## Ofsted Readiness Consumption

Assessment evidence should feed Ofsted Readiness as summarised, non-PII evidence.

Minimum integration:

- create assessment evidence summaries for `achievement`, `curriculum-teaching` and `inclusion`;
- link evidence summaries to `ofsted_evidence_matches`;
- create findings only where confidence is low, mismatch exists, or subgroup gaps are significant;
- let leaders assign tasks/actions rather than auto-creating them silently.

Ofsted should see:

- what assessment evidence exists;
- how current and recent it is;
- whether teachers approved it;
- what the school did next;
- whether leaders understand gaps and confidence.

## Grove House Demo Path

Grove House should be used as a demo school through the normal product path only.

No special Grove House code.

Demo setup:

1. Load Grove House pupils from `ls_pupils`.
2. Create one manual snapshot for a real class/year group.
3. Include a small number of optional teacher comments.
4. Include at least one uncertainty flag.
5. Lock the snapshot.
6. Show the derived Trust Assessor outputs.
7. Show the Ofsted evidence summary.

This proves the ecosystem without faking source labels.

## Implementation Sequence

### Phase 1 — Schema And Source Labels

- Formalise migrations for assessment source batches and pupil assessment events.
- Add missing fields to support source kind, validation tier, comments, voice transcript and moderation status.
- Add indexes for organization, pupil hash, class, subject, period and source batch.
- Add RLS/service-role policies.
- Add tests for source labels and Combined RWM+ same-pupil logic.

### Phase 2 — Manual Snapshot UI

- Add `Record assessment snapshot` entry point in Assessment Support.
- Load class pupils from `ls_pupils`.
- Capture subject/checkpoint/date.
- Capture per-pupil level, optional comment and uncertainty.
- Add browser voice input where available.
- Lock snapshot and write canonical events.

### Phase 3 — Derived Intelligence API

- Add generic pupil-assessment intelligence route.
- Replace misleading `/api/trust-analysis/grove-house` route name with generic org-scoped route.
- Return pupil journeys, subgroup lens, class aggregates and confidence summaries from canonical events.
- Keep legacy route only as a temporary alias if needed.

### Phase 4 — Trust Assessor Integration

- Add source-labelled pupil assessment timeline card.
- Add class/cohort aggregate view from canonical events.
- Add subgroup lens from canonical events.
- Ensure DfE, internal snapshot and Assessment Creator evidence are visually distinct.

### Phase 5 — Ofsted Evidence Integration

- Publish non-PII assessment evidence summaries.
- Link summaries to achievement, curriculum/teaching and inclusion.
- Surface low-confidence/mismatch findings for leader review.

### Phase 6 — Assessment Creator Persistence

- Make Assessment Creator APIs persist blueprints, scans, marking proposals and evidence passports.
- Publish teacher-reviewed outcomes into the canonical pupil assessment events table.

## Testing Requirements

- Unit test level normalisation.
- Unit test same-pupil Combined RWM+.
- Unit test source label generation.
- Unit test manual snapshot validation.
- Unit test voice transcript fallback to typed comments.
- API test source batch + event creation.
- API test locked snapshots cannot be silently edited.
- Trust Assessor test that DfE/current/manual/Assessment Creator layers are labelled differently.
- Ofsted integration test that evidence summaries do not expose pupil names.

## Non-Negotiables

- No pupil names stored in assessment intelligence tables.
- No hardcoded school names, URNs, local authorities or trust names in product logic.
- No unlabelled data.
- No fake comparator values.
- No silent mixing of DfE validated outcomes and internal teacher snapshots.
- AI suggestions are never final without teacher approval.
- Voice input is editable before lock.
- School-level policy may make comments required later, but MVP comments are optional.

