# Census Schema Cross-Reference: Existing vs Proposed

**Date:** 23 March 2026
**Purpose:** Map new census data requirements onto existing Schoolgle database

---

## Executive Summary

**Good news:** ~60% of the proposed census schema already exists or can be extended from existing tables.

**Key additions needed:**
1. `census_imports` - Audit trail for census XML files
2. `pupil_census_snapshots` - Core census data (demographics, SEN, FSM, enrolment)
3. `pupil_attendance_sessions` - Attendance by reason code (termly snapshots)
4. `pupil_exclusions` - Exclusions data from census
5. `school_classes` - Class structure from census
6. `school_census_aggregates` - Pre-calculated dashboard metrics

**Mapping approach:** Use `organization_id` instead of `school_id` (existing pattern). Add `school_salt` to `organizations` table.

---

## Table-by-Table Comparison

### 1. School/Organization Level

| Proposed (`schools`) | Existing (`organizations`) | Action |
|----------------------|----------------------------|--------|
| `id` (UUID) | `id` (UUID) | ✅ Keep existing |
| `urn` (TEXT) | ❌ Missing | **ADD** `dfe_urn` TEXT |
| `la_code` (TEXT) | ❌ Missing | **ADD** `la_code` TEXT |
| `estab_number` (TEXT) | ❌ Missing | **ADD** `estab_number` TEXT |
| `school_name` | `name` | ✅ Use existing `name` |
| `phase`, `school_type`, `governance` | ❌ Missing | **ADD** as JSONB `school_metadata` |
| `school_salt` (TEXT - SECRET) | ❌ Missing | **ADD** `census_salt` TEXT (never exposed) |
| `mis_software` | ❌ Missing | **ADD** `mis_software` TEXT |
| `drive_folder_id` | ✅ `school_data_connections` | Use existing table |
| `drive_connected` | ✅ `school_data_connections` | Use existing table |

**Action:** Extend `organizations` table with census-specific fields.

---

### 2. Census Import Tracking

| Proposed (`census_imports`) | Existing | Action |
|------------------------------|----------|--------|
| `id`, `school_id` | - | **CREATE NEW** |
| `census_term` (AUT/SPR/SUM) | - | **NEW** |
| `census_year` (INTEGER) | - | **NEW** |
| `reference_date` (DATE) | - | **NEW** |
| `xversion`, `serial_no` | - | **NEW** |
| `source_filename`, `source_drive_id` | ✅ Similar to `school_assessment_imports` | Follow same pattern |
| `pupil_count`, `processed_at` | - | **NEW** |
| `processing_status` | ✅ `school_assessment_imports.status` | Use same pattern |

**Action:** Create `census_imports` table (follows `school_assessment_imports` pattern).

---

### 3. Pupil Census Snapshots (CORE TABLE)

| Proposed (`pupil_census_snapshots`) | Existing (`pupils`) | Action |
|--------------------------------------|---------------------|--------|
| `id`, `school_id` | `id`, `organization_id` | Use `organization_id` |
| `pseudo_ref` (SHA-256 hash) | ❌ `pupils` has PII (first_name, last_name, DOB) | **CREATE NEW** - Zero-PII table |
| `gender`, `age_at_census`, `age_band` | ✅ `gender` exists | Extend |
| `postcode_district` | ❌ Missing | **ADD** (first half of postcode only) |
| `language_code`, `is_eal` | ✅ `is_eal` exists | Extend |
| `school_lunch_taken` | ❌ Missing | **ADD** |
| `service_child`, `top_up_funding`, `plaa`, `young_carer` | ❌ Missing | **ADD** |
| `fsm_eligible`, `fsm_start_year` | ✅ `fsm_eligible` exists | Extend |
| `enrol_status`, `entry_date`, `part_time`, `boarder` | ❌ Partial | Extend |
| `nc_year_actual` | ✅ `year_group` exists | Use existing |
| `sen_provision` | ✅ `sen_status` exists | Map to existing |
| `sen_type_primary`, `sen_type_rank` | ✅ `primary_need` exists | Map to existing |
| `census_term`, `census_year`, `academic_year` | ❌ Missing | **ADD** (for longitudinal tracking) |

**Action:** Create `pupil_census_snapshots` as NEW table (zero-PII, longitudinal design).

**Key difference:** `pupils` table has PII (names, DOB) and is for live operational use. `pupil_census_snapshots` has NO PII and is for historical analysis.

---

### 4. Attendance Sessions

| Proposed (`pupil_attendance_sessions`) | Existing | Action |
|----------------------------------------|----------|--------|
| `id`, `snapshot_id`, `school_id` | - | **CREATE NEW** |
| `period_type` (termly/summer_ht2) | - | **NEW** |
| `sessions_possible` | - | **NEW** |
| `reason_code` (/ \ B C D E G H I J L M N O P R S T U V W X Y) | - | **NEW** |
| `session_count` | - | **NEW** |
| `pseudo_ref`, `census_year` | - | **NEW** |

**Action:** Create `pupil_attendance_sessions` table.

---

### 5. Exclusions

| Proposed (`pupil_exclusions`) | Existing | Action |
|-------------------------------|----------|--------|
| `id`, `snapshot_id`, `school_id` | - | **CREATE NEW** |
| `pseudo_ref`, `start_date` | - | **NEW** |
| `category` (SUSP/PERM) | - | **NEW** |
| `reason`, `sessions`, `sen_at_time` | - | **NEW** |

**Action:** Create `pupil_exclusions` table.

---

### 6. Classes

| Proposed (`school_classes`) | Existing (`staff_class_assignments`) | Action |
|----------------------------|--------------------------------------|--------|
| `id`, `school_id` | `organization_id` | Use `organization_id` |
| `census_import_id` | - | **NEW** |
| `class_name` | ✅ `class_name` exists | Keep existing |
| `year_group` | ✅ exists | Keep existing |
| `key_stage` | ❌ Missing | **ADD** |
| `teacher_count`, `ta_count` | ❌ Missing | **ADD** |
| `pupil_count` | ✅ Partial | Extend |
| `class_activity` | ❌ Missing | **ADD** |
| `census_year`, `census_term` | ❌ Missing | **ADD** (for historical tracking) |

**Action:** Extend existing `staff_class_assignments` or create separate `school_classes` table for census-derived class data.

---

### 7. Assessments

| Proposed (`pupil_assessments`) | Existing (`pupil_assessments_pseudo`) | Action |
|-------------------------------|----------------------------------------|--------|
| `id`, `school_id`, `pseudo_ref` | ✅ `organization_id`, `pupil_hash` | Use existing pattern |
| `assessment_type` (EYFSP/PHONICS/KS1/KS2) | ❌ Missing | **ADD** |
| `academic_year`, `stage`, `subject` | ✅ `academic_year_start`, `subject` exists | Extend |
| `component` (E01-E17, REA, WRI, etc.) | ❌ Missing | **ADD** |
| `method` (TA/TT) | ❌ Missing | **ADD** |
| `result`, `result_qualifier` | ✅ `attainment_level`, `scaled_score` exists | Extend |
| `result_date`, `source_file` | ❌ Missing | **ADD** |

**Action:** Extend existing `pupil_assessments_pseudo` table with census assessment fields.

---

### 8. Aggregates

| Proposed (`school_census_aggregates`) | Existing | Action |
|----------------------------------------|----------|--------|
| `id`, `school_id`, `census_import_id` | - | **CREATE NEW** |
| `census_term`, `census_year` | - | **NEW** |
| `total_pupils`, `total_male`, `total_female` | - | **NEW** |
| `pupils_by_year_group` (JSONB) | - | **NEW** |
| `total_sen_ehcp`, `total_sen_support`, `sen_percentage` | - | **NEW** |
| `total_fsm_eligible`, `fsm_percentage` | - | **NEW** |
| `total_eal`, `eal_percentage`, `language_breakdown` | - | **NEW** |
| `ethnicity_breakdown` (JSONB) | - | **NEW** |
| `overall_absence_rate`, `persistent_absence_rate` | - | **NEW** |
| `absence_by_reason` (JSONB) | - | **NEW** |

**Action:** Create `school_census_aggregates` table for pre-calculated metrics (powers zero-AI dashboard).

---

### 9. Ed Flags & Interventions

| Proposed | Existing | Action |
|----------|----------|--------|
| `ed_flags` | ❌ Missing | **CREATE NEW** (or extend `pupil_analysis_insights`) |
| `interventions` | ❌ Missing | **CREATE NEW** (actions hub may cover this) |

**Action:** Create `ed_flags` table. Consider if `interventions` is needed or if Actions Hub covers this.

---

## Fields to Add to Existing Tables

### `organizations` table
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dfe_urn TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS la_code TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS estab_number TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS school_metadata JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS census_salt TEXT; -- SECRET, never in API responses
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS mis_software TEXT;
```

### `pupil_assessments_pseudo` table
```sql
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS assessment_type TEXT;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS component TEXT;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS result_qualifier TEXT;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS result_date DATE;
ALTER TABLE pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS source_file TEXT;
```

---

## New Tables to Create

1. `census_imports` - Audit trail
2. `pupil_census_snapshots` - Core census data
3. `pupil_attendance_sessions` - Attendance by reason
4. `pupil_exclusions` - Exclusions data
5. `school_classes` - Class structure (or extend existing)
6. `school_census_aggregates` - Pre-calculated metrics
7. `ed_flags` - AI-generated concerns

---

## Privacy Architecture Confirmation

| Data Type | Proposed Storage | Current Storage | Decision |
|-----------|------------------|-----------------|----------|
| Pupil names | Google Drive only | `pupils.first_name`, `pupils.last_name` | Keep `pupils` for operational use. Create zero-PIO `pupil_census_snapshots` for census data. |
| DOB | Age only (calculated) | `pupils.date_of_birth` | Keep `pupils` for ops. Store `age_at_census` in snapshots. |
| UPN | SHA-256 hash only | ❌ Not stored | **DO NOT STORE**. Hash client-side, store `pseudo_ref` only. |
| Full postcode | District only (e.g. "BD2") | ❌ Not stored | Store `postcode_district` only in snapshots. |
| Assessment results | Pseudonymised | `pupil_assessments_pseudo.pupil_hash` | ✅ Already zero-PII |
| Attendance | Pseudonymised by pupil, aggregated by school | ❌ Not stored | Store `pupil_attendance_sessions` with `pseudo_ref` |

**Conclusion:** The existing `pupil_assessments_pseudo` table already follows the zero-PII pattern. Extend this pattern to census data.

---

## Next Steps

1. ✅ Create migration for new tables
2. ✅ Extend `organizations` table with census fields
3. ✅ Extend `pupil_assessments_pseudo` table with statutory assessment fields
4. Create XML parser library (`apps/platform/src/lib/census-xml-parser.ts`)
5. Create API endpoint for census XML upload (`/api/census/upload`)
6. Create census data connector skill for Ed
7. Test with Grove House Primary census XMLs

---

## File References

- Proposed schema: `C:\temp\files_extract\schoolgle-census-schema.sql`
- Build spec: `C:\temp\files_extract\schoolgle-claude-code-build-spec.md`
- Data review: `C:\temp\files_extract\schoolgle-data-review.md`
- Existing pupil assessment: `apps/platform/src/lib/pupil-assessment-analyser.ts`
- Existing migration: `apps/platform/supabase/migrations/20260309_pupil_assessment_analysis.sql`
