-- ============================================================
-- NAVIGATOR MVP DATABASE SCHEMA
-- Aligns with existing organization_id multi-tenancy
-- ============================================================

-- 0. ADD ROLE TO ORGANIZATION_MEMBERS (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.organization_members 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'staff';
  END IF;
END $$;

-- Valid roles: 'admin', 'headteacher', 'sbm', 'staff', 'governor'
COMMENT ON COLUMN public.organization_members.role IS 'User role: admin, headteacher, sbm, staff, governor';

-- ============================================================
-- 1. EVIDENCE ITEMS
-- Central store for all uploaded files, photos, screenshots
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'doc', 'screenshot', 'spreadsheet')),
  file_size_bytes INTEGER,
  file_name TEXT,
  
  -- Classification
  category TEXT,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Source tracking
  source_type TEXT DEFAULT 'upload' CHECK (source_type IN ('upload', 'sop', 'navigator', 'pack', 'cloud_sync')),
  source_id UUID,
  
  -- Cloud integration (for existing EvidenceModal compatibility)
  cloud_provider TEXT,  -- 'google', 'onedrive', null for local
  cloud_file_id TEXT,
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_org ON public.evidence_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidence_category ON public.evidence_items(category);
CREATE INDEX IF NOT EXISTS idx_evidence_tags ON public.evidence_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_evidence_source ON public.evidence_items(source_type, source_id);

-- ============================================================
-- 2. TIMELINE ENTRIES
-- Generic audit trail - replaces/extends InterventionTimeline
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'evidence_added', 'pack_created', 'pack_exported', 'pack_approved',
    'sop_started', 'sop_completed', 'approval_decision', 'manual', 'system'
  )),
  
  -- Links to related objects
  source_type TEXT,
  source_id UUID,
  evidence_ids UUID[] DEFAULT '{}',
  
  -- Classification
  category TEXT,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Visual
  icon TEXT,  -- For UI display
  color TEXT, -- For UI display
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_org ON public.timeline_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created ON public.timeline_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON public.timeline_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_timeline_source ON public.timeline_entries(source_type, source_id);

-- ============================================================
-- 3. PACK TEMPLATES
-- Governor pack templates (seeded separately)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pack_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('governor', 'trustee', 'audit', 'inspection')),
  
  sections JSONB NOT NULL,
  estimated_time_minutes INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. PACKS
-- Governor/board pack instances
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES public.pack_templates(template_id),
  
  title TEXT NOT NULL,
  meeting_date DATE,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'changes_requested', 'approved', 'exported'
  )),
  
  sections JSONB NOT NULL DEFAULT '[]',
  current_version INTEGER DEFAULT 1,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packs_org ON public.packs(organization_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON public.packs(status);
CREATE INDEX IF NOT EXISTS idx_packs_template ON public.packs(template_id);

-- ============================================================
-- 5. PACK VERSIONS
-- Version history for audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pack_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  sections JSONB NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'manual_save', 'section_complete', 'submit', 'approval', 'export', 'restore'
  )),
  
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pack_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_pack_versions_pack ON public.pack_versions(pack_id);

-- ============================================================
-- 6. PACK APPROVALS
-- Approval workflow records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pack_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'changes_requested', 'rejected')),
  
  submitted_by UUID REFERENCES auth.users(id),
  decided_by UUID REFERENCES auth.users(id),
  
  comments TEXT,
  section_comments JSONB,
  
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pack_approvals_pack ON public.pack_approvals(pack_id);

-- ============================================================
-- 7. PACK EXPORTS
-- Export records with file links
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pack_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  exported_by UUID NOT NULL REFERENCES auth.users(id),
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SOP TEMPLATES
-- Standard operating procedure templates (seeded separately)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sop_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('estates', 'safeguarding', 'compliance', 'governance', 'finance', 'hr')),
  
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'termly', 'annual', 'ad_hoc')),
  
  steps JSONB NOT NULL,
  estimated_time_minutes INTEGER,
  owner_role TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. SOP RUNS
-- Active/completed SOP instances
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sop_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.sop_templates(template_id),
  
  context TEXT,
  
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'completed', 'abandoned'
  )),
  
  steps_data JSONB NOT NULL DEFAULT '[]',
  completion_notes TEXT,
  
  started_by UUID NOT NULL REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_runs_org ON public.sop_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_template ON public.sop_runs(template_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_status ON public.sop_runs(status);

-- ============================================================
-- 10. SOP REMINDERS
-- Recurring SOP scheduling
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sop_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.sop_templates(template_id),
  
  next_due_at TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  last_run_id UUID REFERENCES public.sop_runs(id),
  
  assigned_to UUID REFERENCES auth.users(id),
  snoozed_until TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, template_id)
);

-- ============================================================
-- 11. NAVIGATOR SESSIONS
-- Vision-lite screenshot guidance sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.navigator_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  screenshot_url TEXT,
  user_query TEXT,
  user_context TEXT,
  
  selected_system TEXT,
  selected_task TEXT,
  
  guidance_steps JSONB,
  suggested_sop_id TEXT,
  
  outcome TEXT CHECK (outcome IN ('evidence_saved', 'sop_started', 'guidance_only', 'dismissed')),
  evidence_id UUID REFERENCES public.evidence_items(id),
  linked_sop_run_id UUID REFERENCES public.sop_runs(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigator_user ON public.navigator_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_org ON public.navigator_sessions(organization_id);

-- ============================================================
-- 12. AUDIT LOG
-- System-wide audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  
  resource_type TEXT,
  resource_id UUID,
  
  action TEXT NOT NULL,
  
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_log(resource_type, resource_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Templates are public read for authenticated users
CREATE POLICY "pack_templates_read" ON public.pack_templates 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sop_templates_read" ON public.sop_templates 
  FOR SELECT TO authenticated USING (true);

-- Organization-scoped policies using existing pattern
CREATE POLICY "evidence_items_policy" ON public.evidence_items 
  FOR ALL TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "timeline_entries_policy" ON public.timeline_entries 
  FOR ALL TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "packs_policy" ON public.packs 
  FOR ALL TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "pack_versions_policy" ON public.pack_versions 
  FOR ALL TO authenticated 
  USING (pack_id IN (
    SELECT id FROM public.packs WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "pack_approvals_policy" ON public.pack_approvals 
  FOR ALL TO authenticated 
  USING (pack_id IN (
    SELECT id FROM public.packs WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "pack_exports_policy" ON public.pack_exports 
  FOR ALL TO authenticated 
  USING (pack_id IN (
    SELECT id FROM public.packs WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "sop_runs_policy" ON public.sop_runs 
  FOR ALL TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "sop_reminders_policy" ON public.sop_reminders 
  FOR ALL TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "navigator_sessions_policy" ON public.navigator_sessions 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "audit_log_read" ON public.audit_log 
  FOR SELECT TO authenticated 
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- Service role full access for server operations
CREATE POLICY "service_evidence" ON public.evidence_items FOR ALL TO service_role USING (true);
CREATE POLICY "service_timeline" ON public.timeline_entries FOR ALL TO service_role USING (true);
CREATE POLICY "service_pack_templates" ON public.pack_templates FOR ALL TO service_role USING (true);
CREATE POLICY "service_packs" ON public.packs FOR ALL TO service_role USING (true);
CREATE POLICY "service_pack_versions" ON public.pack_versions FOR ALL TO service_role USING (true);
CREATE POLICY "service_pack_approvals" ON public.pack_approvals FOR ALL TO service_role USING (true);
CREATE POLICY "service_pack_exports" ON public.pack_exports FOR ALL TO service_role USING (true);
CREATE POLICY "service_sop_templates" ON public.sop_templates FOR ALL TO service_role USING (true);
CREATE POLICY "service_sop_runs" ON public.sop_runs FOR ALL TO service_role USING (true);
CREATE POLICY "service_sop_reminders" ON public.sop_reminders FOR ALL TO service_role USING (true);
CREATE POLICY "service_navigator" ON public.navigator_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "service_audit" ON public.audit_log FOR ALL TO service_role USING (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

-- Create evidence storage bucket (run separately if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence', 
  'evidence', 
  true,
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "evidence_upload" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "evidence_read" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'evidence');

CREATE POLICY "evidence_delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
