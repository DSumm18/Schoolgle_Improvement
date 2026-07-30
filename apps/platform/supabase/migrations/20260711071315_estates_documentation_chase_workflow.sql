ALTER TABLE public.estates_statutory_completions
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS documentation_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documentation_received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documentation_last_chased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documentation_last_chased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documentation_chase_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_estates_statutory_completions_docs_chase
  ON public.estates_statutory_completions(organization_id, documentation_last_chased_at)
  WHERE status = 'awaiting_documentation';

COMMENT ON COLUMN public.estates_statutory_completions.documentation_chase_count IS
  'Number of recorded contractor/documentation follow-ups for this inspection occurrence.';

ALTER TABLE public.custom_checks
  DROP CONSTRAINT IF EXISTS custom_checks_frequency_check;
ALTER TABLE public.custom_checks
  ADD CONSTRAINT custom_checks_frequency_check CHECK (frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly', '6_monthly', 'termly',
    'annually', '2_yearly', '3_yearly', '5_yearly', '10_yearly',
    'as_needed', 'ad_hoc'
  ));
