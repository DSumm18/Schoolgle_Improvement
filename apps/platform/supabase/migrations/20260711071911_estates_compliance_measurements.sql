ALTER TABLE public.estates_statutory_completions
  ADD COLUMN IF NOT EXISTS measurement_data JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.estates_statutory_completions.measurement_data IS
  'Structured readings captured during the check, including value, unit, limits and automatic pass/fail result.';
