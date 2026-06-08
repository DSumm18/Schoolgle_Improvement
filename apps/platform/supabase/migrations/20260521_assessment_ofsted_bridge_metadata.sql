-- Assessment Intelligence → Ofsted Readiness bridge metadata.
-- Keeps statutory/public, school capture, pupil-level and School Improvement
-- signals source-labelled rather than blending them into one headline score.

ALTER TABLE IF EXISTS public.assessment_source_batches
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS demo_fixture_id TEXT,
  ADD COLUMN IF NOT EXISTS source_display_name TEXT,
  ADD COLUMN IF NOT EXISTS source_layer TEXT;

ALTER TABLE IF EXISTS public.assessment_source_batches
  DROP CONSTRAINT IF EXISTS assessment_source_batches_source_layer_check;

ALTER TABLE IF EXISTS public.assessment_source_batches
  ADD CONSTRAINT assessment_source_batches_source_layer_check
  CHECK (
    source_layer IS NULL OR source_layer IN (
      'dfe_rear_view',
      'school_capture',
      'pupil_level',
      'ofsted_bridge'
    )
  );

ALTER TABLE IF EXISTS public.school_assessment_imports
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS demo_fixture_id TEXT,
  ADD COLUMN IF NOT EXISTS source_display_name TEXT,
  ADD COLUMN IF NOT EXISTS source_layer TEXT;

ALTER TABLE IF EXISTS public.school_assessment_imports
  DROP CONSTRAINT IF EXISTS school_assessment_imports_source_layer_check;

ALTER TABLE IF EXISTS public.school_assessment_imports
  ADD CONSTRAINT school_assessment_imports_source_layer_check
  CHECK (
    source_layer IS NULL OR source_layer IN (
      'dfe_rear_view',
      'school_capture',
      'pupil_level',
      'ofsted_bridge'
    )
  );

ALTER TABLE IF EXISTS public.ofsted_findings
  DROP CONSTRAINT IF EXISTS ofsted_findings_source_type_check;

ALTER TABLE IF EXISTS public.ofsted_findings
  ADD CONSTRAINT ofsted_findings_source_type_check
  CHECK (
    source_type IN (
      'website_scan',
      'drive_scan',
      'document_inspection',
      'manual_review',
      'rules_update',
      'dfe_public_data',
      'school_assessment_capture',
      'ctf_pupil_layer',
      'assessment_creator',
      'school_improvement_signal'
    )
  );

CREATE INDEX IF NOT EXISTS idx_assessment_source_batches_demo
  ON public.assessment_source_batches (organization_id, is_demo, demo_fixture_id);

CREATE INDEX IF NOT EXISTS idx_assessment_source_batches_layer
  ON public.assessment_source_batches (organization_id, source_layer, source_kind);

COMMENT ON COLUMN public.assessment_source_batches.is_demo IS
  'Marks reusable synthetic demo fixtures so live school data is never confused with demo data.';

COMMENT ON COLUMN public.assessment_source_batches.source_layer IS
  'DfE rear-view, school capture, pupil-level or Ofsted bridge layer used for source-labelled reporting.';
