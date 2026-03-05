-- ESTATES EVIDENCE MANAGEMENT
-- Extends evidence_items table for estates compliance specific needs

-- Create estates_evidence table
CREATE TABLE IF NOT EXISTS public.estates_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'certificate', 'report', 'photo', 'log', 'document', 'video', 'other'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'verified', 'rejected', 'expired', 'archived'
  )),

  -- File details
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes INTEGER,

  -- Cloud integration
  cloud_provider TEXT CHECK (cloud_provider IN ('google', 'onedrive')),
  cloud_file_id TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'upload', 'google_drive', 'onedrive', 'link', 'existing'
  )),

  -- Links to other entities
  compliance_domain TEXT,
  asset_id UUID REFERENCES public.estates_assets(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.estates_compliance_tasks(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES public.estates_contractors(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.estates_contracts(id) ON DELETE SET NULL,
  user_qualification_id UUID REFERENCES public.estates_user_qualifications(id) ON DELETE SET NULL,

  -- Certificate/Document specific
  document_number TEXT,
  issuing_body TEXT,
  issued_date DATE,
  expiry_date DATE,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_evidence_id UUID REFERENCES public.estates_evidence(id) ON DELETE SET NULL,

  -- AI verification
  ai_verified BOOLEAN DEFAULT false,
  ai_confidence_score NUMERIC(3,2),
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_evidence IS 'Evidence storage for estates compliance';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_estates_evidence_org ON public.estates_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_type ON public.estates_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_status ON public.estates_evidence(status);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_domain ON public.estates_evidence(compliance_domain);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_asset ON public.estates_evidence(asset_id);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_task ON public.estates_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_contractor ON public.estates_evidence(contractor_id);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_expiry ON public.estates_evidence(expiry_date);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_parent ON public.estates_evidence(parent_evidence_id);
CREATE INDEX IF NOT EXISTS idx_estates_evidence_tags ON public.estates_evidence USING GIN(tags);

-- Enable RLS
ALTER TABLE public.estates_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "estates_evidence_policy" ON public.estates_evidence
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

-- Service role policy
CREATE POLICY "service_estates_evidence" ON public.estates_evidence
  FOR ALL TO service_role USING (true);

-- Update timestamp trigger
CREATE TRIGGER estates_evidence_updated_at BEFORE UPDATE ON public.estates_evidence
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();
