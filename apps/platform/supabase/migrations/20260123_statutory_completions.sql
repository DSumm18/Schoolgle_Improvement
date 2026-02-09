-- STATUTORY CHECK COMPLETIONS
-- Tracks completion status of predefined statutory checks from statutory-checks.ts

-- Create estates_statutory_completions table
CREATE TABLE IF NOT EXISTS public.estates_statutory_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL, -- ID from statutory-checks.ts (e.g., 'legionella_risk_assessment')
  compliance_domain TEXT NOT NULL, -- Domain key (e.g., 'legionella', 'fire')
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'overdue', 'not_applicable', 'in_progress', 'awaiting_documentation'
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  next_due_date DATE NOT NULL,
  last_due_date DATE,
  evidence_ids UUID[] DEFAULT '{}',
  documents_received BOOLEAN DEFAULT false,
  contractor_id UUID REFERENCES public.estates_contractors(id),
  completion_duration_minutes INTEGER,
  findings JSONB DEFAULT '[]'::jsonb,
  rag_status TEXT DEFAULT 'amber' CHECK (rag_status IN ('red', 'amber', 'green')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, check_id, next_due_date)
);

COMMENT ON TABLE public.estates_statutory_completions IS
'Tracks completion status of predefined statutory checks from statutory-checks.ts';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_statutory_completions_org ON public.estates_statutory_completions(organization_id);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_check_id ON public.estates_statutory_completions(check_id);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_domain ON public.estates_statutory_completions(compliance_domain);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_status ON public.estates_statutory_completions(status);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_rag ON public.estates_statutory_completions(rag_status);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_next_due ON public.estates_statutory_completions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_statutory_completions_completed_by ON public.estates_statutory_completions(completed_by);

-- Create composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_statutory_completions_dashboard ON public.estates_statutory_completions(organization_id, compliance_domain, status);

-- Enable RLS
ALTER TABLE public.estates_statutory_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "estates_statutory_completions_read" ON public.estates_statutory_completions
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_statutory_completions_write" ON public.estates_statutory_completions
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

-- Service role policy
CREATE POLICY "service_statutory_completions" ON public.estates_statutory_completions
  FOR ALL TO service_role USING (true);

-- Update timestamp trigger
CREATE TRIGGER estates_statutory_completions_updated_at
  BEFORE UPDATE ON public.estates_statutory_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_estates_updated_at();

-- Function to get latest completion for a check
CREATE OR REPLACE FUNCTION get_latest_statutory_completion(
  p_organization_id UUID,
  p_check_id TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  completion_notes TEXT,
  next_due_date DATE,
  rag_status TEXT,
  documents_received BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.status,
    sc.completed_at,
    sc.completed_by,
    sc.completion_notes,
    sc.next_due_date,
    sc.rag_status,
    sc.documents_received
  FROM public.estates_statutory_completions sc
  WHERE sc.organization_id = p_organization_id
    AND sc.check_id = p_check_id
  ORDER BY sc.next_due_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get domain completion summary
CREATE OR REPLACE FUNCTION get_domain_completion_summary(
  p_organization_id UUID,
  p_compliance_domain TEXT
)
RETURNS TABLE (
  total_checks BIGINT,
  completed_checks BIGINT,
  overdue_checks BIGINT,
  pending_checks BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_checks,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_checks,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT as overdue_checks,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_checks,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC * 100, 2)
      ELSE 0
    END as completion_rate
  FROM public.estates_statutory_completions
  WHERE organization_id = p_organization_id
    AND compliance_domain = p_compliance_domain
    AND next_due_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update overdue status
CREATE OR REPLACE FUNCTION update_overdue_statutory_checks()
RETURNS VOID AS $$
BEGIN
  UPDATE public.estates_statutory_completions
  SET
    status = 'overdue',
    rag_status = 'red',
    updated_at = NOW()
  WHERE next_due_date < CURRENT_DATE
    AND status IN ('pending', 'in_progress', 'awaiting_documentation');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_latest_statutory_completion TO authenticated;
GRANT EXECUTE ON FUNCTION get_domain_completion_summary TO authenticated;
GRANT EXECUTE ON FUNCTION update_overdue_statutory_checks TO authenticated;

COMMENT ON FUNCTION get_latest_statutory_completion IS
'Get the most recent completion record for a specific statutory check';

COMMENT ON FUNCTION get_domain_completion_summary IS
'Get completion summary statistics for a compliance domain';

COMMENT ON FUNCTION update_overdue_statutory_checks IS
'Auto-update pending checks to overdue when due date passes';
