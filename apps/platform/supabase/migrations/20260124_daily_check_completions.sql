-- DAILY CHECK COMPLETIONS
-- Tracks completion status of daily opening and closing checklists

-- Create estates_daily_check_completions table
CREATE TABLE IF NOT EXISTS public.estates_daily_check_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  check_type TEXT NOT NULL CHECK (check_type IN ('opening', 'closing')),
  check_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'completed', 'completed_with_issues', 'failed'
  )),
  -- Results as JSONB array of check item results
  results JSONB DEFAULT '[]'::jsonb,
  -- Each result: { item_id, status, notes, photo_url, completed_at }
  -- status: 'passed' | 'failed' | 'not_applicable'

  -- Summary counts
  total_items INTEGER NOT NULL DEFAULT 0,
  passed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  not_applicable_items INTEGER NOT NULL DEFAULT 0,

  -- Optional overall notes and photos
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one active completion per checklist per day
  UNIQUE(organization_id, check_type, check_date)
);

COMMENT ON TABLE public.estates_daily_check_completions IS
'Tracks completion status of daily opening and closing checklists for site staff';

COMMENT ON COLUMN public.estates_daily_check_completions.check_type IS
'Type of daily checklist: opening (morning) or closing (end of day)';
COMMENT ON COLUMN public.estates_daily_check_completions.results IS
'JSONB array of individual check item results with status, notes, and photos';
COMMENT ON COLUMN public.estates_daily_check_completions.status IS
'Overall status: in_progress, completed (all passed), completed_with_issues (some failed), or failed';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_completions_org ON public.estates_daily_check_completions(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_user ON public.estates_daily_check_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_type ON public.estates_daily_check_completions(check_type);
CREATE INDEX IF NOT EXISTS idx_daily_completions_date ON public.estates_daily_check_completions(check_date);
CREATE INDEX IF NOT EXISTS idx_daily_completions_status ON public.estates_daily_check_completions(status);
CREATE INDEX IF NOT EXISTS idx_daily_completions_org_date ON public.estates_daily_check_completions(organization_id, check_date DESC);

-- Create composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_daily_completions_dashboard ON public.estates_daily_check_completions(organization_id, check_type, check_date);

-- Enable RLS
ALTER TABLE public.estates_daily_check_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "estates_daily_completions_read" ON public.estates_daily_check_completions
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_daily_completions_write" ON public.estates_daily_check_completions
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

-- Service role policy (for API routes)
CREATE POLICY "estates_daily_completions_service_role" ON public.estates_daily_check_completions
  FOR ALL TO service_role
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_estates_daily_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estates_daily_completions_updated_at
  BEFORE UPDATE ON public.estates_daily_check_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_estates_daily_completions_updated_at();

-- Create view for today's checklist status
CREATE OR REPLACE VIEW public.today_daily_check_status AS
SELECT
  organization_id,
  check_type,
  check_date,
  status,
  started_at,
  completed_at,
  total_items,
  passed_items,
  failed_items,
  not_applicable_items,
  -- Determine if checklist is effectively complete
  CASE
    WHEN status IN ('completed', 'completed_with_issues') THEN true
    ELSE false
  END as is_complete,
  -- Overall pass rate
  CASE
    WHEN total_items > 0 THEN ROUND((passed_items::numeric / total_items::numeric) * 100)
    ELSE 0
  END as pass_percentage
FROM public.estates_daily_check_completions
WHERE check_date = CURRENT_DATE;

COMMENT ON VIEW public.today_daily_check_status IS
'View showing the status of today opening and closing checklists for all organizations';
