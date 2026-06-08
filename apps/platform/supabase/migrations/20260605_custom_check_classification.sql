-- Distinguish school-created non-statutory checks from regulated/statutory checks.
-- Statutory frequencies are locked so schools cannot casually change legal/regulatory cadence.

ALTER TABLE public.custom_checks
  ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'non_statutory'
    CHECK (classification IN ('statutory', 'non_statutory')),
  ADD COLUMN IF NOT EXISTS frequency_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS statutory_reference TEXT;

UPDATE public.custom_checks
SET frequency_locked = true
WHERE classification = 'statutory';

CREATE INDEX IF NOT EXISTS idx_custom_checks_classification
  ON public.custom_checks(organization_id, classification);

COMMENT ON COLUMN public.custom_checks.classification IS
  'Whether this school-created check is statutory/regulated or non-statutory local good practice.';
COMMENT ON COLUMN public.custom_checks.frequency_locked IS
  'When true, the frequency is treated as regulation/strategy controlled rather than freely editable by the school.';
COMMENT ON COLUMN public.custom_checks.statutory_reference IS
  'Reference, policy, regulation, or internal decision source for statutory/regulated checks.';
