-- DfE KS2 characteristic comparator warehouse
-- Source: DfE Explore Education Statistics, Key stage 2 attainment datasets.
-- Purpose: national, regional, local-authority and school-type comparators for
-- Trust Assessor pupil-characteristic narratives.

CREATE TABLE IF NOT EXISTS dfe_ks2_characteristic_comparators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  dataset_id TEXT NOT NULL,
  dataset_title TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_published_at TIMESTAMPTZ,
  source_release_title TEXT,
  source_release_slug TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  time_period TEXT NOT NULL,
  academic_year_start INTEGER,
  academic_year_end INTEGER,
  time_identifier TEXT,
  geographic_level TEXT NOT NULL,
  country_code TEXT,
  country_name TEXT,
  region_code TEXT,
  region_name TEXT,
  old_la_code TEXT,
  new_la_code TEXT,
  la_name TEXT,

  establishment_type_group TEXT,
  subject TEXT NOT NULL,
  breakdown_topic TEXT NOT NULL,
  breakdown TEXT NOT NULL,

  sex TEXT,
  disadvantage_status TEXT,
  fsm_status TEXT,
  ethnicity_major TEXT,
  ethnicity_minor TEXT,
  first_language TEXT,
  month_of_birth TEXT,
  sen_provision TEXT,
  sen_primary_need TEXT,

  establishment_count NUMERIC,
  eligible_pupil_count NUMERIC,
  expected_standard_pupil_count NUMERIC,
  higher_standard_pupil_count NUMERIC,
  expected_standard_pupil_percent NUMERIC,
  higher_standard_pupil_percent NUMERIC,
  average_scaled_score NUMERIC,
  progress_measure_score NUMERIC,
  progress_measure_lower_conf_interval NUMERIC,
  progress_measure_upper_conf_interval NUMERIC,

  raw_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_dfe_ks2_char_year_geo
  ON dfe_ks2_characteristic_comparators(academic_year_start, geographic_level, new_la_code, la_name);

CREATE INDEX IF NOT EXISTS idx_dfe_ks2_char_subject_breakdown
  ON dfe_ks2_characteristic_comparators(subject, breakdown_topic, breakdown);

CREATE INDEX IF NOT EXISTS idx_dfe_ks2_char_sen
  ON dfe_ks2_characteristic_comparators(academic_year_start, geographic_level, sen_provision, sen_primary_need)
  WHERE sen_provision IS NOT NULL OR sen_primary_need IS NOT NULL;

COMMENT ON TABLE dfe_ks2_characteristic_comparators IS
  'DfE KS2 attainment comparator rows by pupil characteristics and geography. Used by Trust Assessor to compare school-uploaded pupil groups against exact national/LA benchmarks.';
