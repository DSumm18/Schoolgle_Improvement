-- Custom Checks Table
-- Stores user-created compliance checks specific to each school's needs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom_checks table
CREATE TABLE IF NOT EXISTS public.custom_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  compliance_domain TEXT NOT NULL CHECK (
    compliance_domain IN (
      'legionella', 'fire', 'asbestos', 'electrical', 'gas',
      'water', 'mechanical', 'lifts', 'playground', 'accessibility',
      'security', 'manual_handling', 'working_at_height'
    )
  ),
  frequency TEXT NOT NULL CHECK (
    frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'termly', 'ad_hoc')
  ),
  estimated_duration INTEGER, -- in minutes
  requires_qualification TEXT,
  evidence_required TEXT[] DEFAULT '{}',
  checklist_items TEXT[] DEFAULT '{}',
  notes TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'organization', 'public')),
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  template_parent_id TEXT, -- ID of the template this was cloned from (could be built-in or custom)
  cloned_from UUID REFERENCES public.custom_checks(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_checks_organization_id ON public.custom_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_checks_compliance_domain ON public.custom_checks(compliance_domain);
CREATE INDEX IF NOT EXISTS idx_custom_checks_frequency ON public.custom_checks(frequency);
CREATE INDEX IF NOT EXISTS idx_custom_checks_visibility ON public.custom_checks(visibility);
CREATE INDEX IF NOT EXISTS idx_custom_checks_is_template ON public.custom_checks(is_template);
CREATE INDEX IF NOT EXISTS idx_custom_checks_tags ON public.custom_checks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_custom_checks_archived_at ON public.custom_checks(archived_at);
CREATE INDEX IF NOT EXISTS idx_custom_checks_created_at ON public.custom_checks(created_at DESC);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_custom_checks_name_trgm ON public.custom_checks USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_custom_checks_description_trgm ON public.custom_checks USING GIN (description gin_trgm_ops);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_custom_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_checks_updated_at_trigger ON public.custom_checks;
CREATE TRIGGER update_custom_checks_updated_at_trigger
  BEFORE UPDATE ON public.custom_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_checks_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(check_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.custom_checks
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = check_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS (Row Level Security) policies
ALTER TABLE public.custom_checks ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's custom checks (unless archived)
CREATE POLICY "Users can view organization custom checks"
  ON public.custom_checks
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    AND archived_at IS NULL
  );

-- Users can view public templates
CREATE POLICY "Users can view public templates"
  ON public.custom_checks
  FOR SELECT
  USING (visibility = 'public' OR is_template = true);

-- Users can create custom checks for their organization
CREATE POLICY "Users can create custom checks"
  ON public.custom_checks
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can update their organization's custom checks
CREATE POLICY "Users can update organization custom checks"
  ON public.custom_checks
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can delete (archive) their organization's custom checks
CREATE POLICY "Users can delete organization custom checks"
  ON public.custom_checks
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    archived_at IS NOT NULL -- Only allow archiving, not hard deletion via API
  );

-- Comments for documentation
COMMENT ON TABLE public.custom_checks IS 'User-created compliance checks specific to each school';
COMMENT ON COLUMN public.custom_checks.id IS 'Unique identifier for the custom check';
COMMENT ON COLUMN public.custom_checks.organization_id IS 'Organization that owns this check';
COMMENT ON COLUMN public.custom_checks.name IS 'Name of the custom check';
COMMENT ON COLUMN public.custom_checks.description IS 'Detailed description of what the check involves';
COMMENT ON COLUMN public.custom_checks.compliance_domain IS 'Which compliance domain this check belongs to';
COMMENT ON COLUMN public.custom_checks.frequency IS 'How often this check should be performed';
COMMENT ON COLUMN public.custom_checks.estimated_duration IS 'Estimated time to complete the check (in minutes)';
COMMENT ON COLUMN public.custom_checks.requires_qualification IS 'Required qualification to perform this check';
COMMENT ON COLUMN public.custom_checks.evidence_required IS 'List of evidence items required when completing this check';
COMMENT ON COLUMN public.custom_checks.checklist_items IS 'Checklist items to verify during the check';
COMMENT ON COLUMN public.custom_checks.visibility IS 'Who can see this check: private (school only), organization (MAT), or public (all schools)';
COMMENT ON COLUMN public.custom_checks.is_template IS 'Whether this check is saved as a template for reuse';
COMMENT ON COLUMN public.custom_checks.template_parent_id IS 'ID of the template this check was cloned from';
COMMENT ON COLUMN public.custom_checks.cloned_from IS 'ID of another custom check this was cloned from';
COMMENT ON COLUMN public.custom_checks.usage_count IS 'How many times this template has been used';
COMMENT ON COLUMN public.custom_checks.archived_at IS 'When the check was archived (soft delete)';
