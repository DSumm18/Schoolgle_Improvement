-- ESTATES COMPLIANCE MODULE - PHASE 1 MIGRATION
-- Shared infrastructure: Assets, Contractors, Tasks, Helpdesk

-- Extend existing tables
ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS compliance_role TEXT
CHECK (compliance_role IN ('responsible_person', 'duty_holder', 'appointed_person', 'staff'));

COMMENT ON COLUMN public.organization_members.compliance_role IS
'Compliance role: responsible_person, duty_holder, appointed_person, staff';

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS compliance_rag_status TEXT DEFAULT 'green'
CHECK (compliance_rag_status IN ('red', 'amber', 'green'));

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS compliance_last_review DATE;

COMMENT ON COLUMN public.organizations.compliance_rag_status IS
'Overall compliance status: red (critical issues), amber (attention needed), green (compliant)';

ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS compliance_task_id UUID;

-- Create estates_assets table
CREATE TABLE IF NOT EXISTS public.estates_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'building', 'room', 'outlet', 'equipment',
    'fire_extinguisher', 'emergency_light', 'lift',
    'playground_equipment', 'accessibility_equipment', 'vehicle'
  )),
  category TEXT,
  subcategory TEXT,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  qr_code TEXT,
  barcode TEXT,
  building TEXT,
  floor TEXT,
  room TEXT,
  location_details JSONB,
  parent_asset_id UUID REFERENCES public.estates_assets(id),
  installation_date DATE,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  specifications JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'disposed', 'under_repair', 'retired'
  )),
  compliance_domains TEXT[] DEFAULT '{}',
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_assets IS 'Shared asset register for all compliance domains';

CREATE INDEX IF NOT EXISTS idx_estates_assets_org ON public.estates_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_assets_type ON public.estates_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_estates_assets_code ON public.estates_assets(code);
CREATE INDEX IF NOT EXISTS idx_estates_assets_parent ON public.estates_assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_estates_assets_location ON public.estates_assets(building, floor, room);

-- Create estates_contractors table
CREATE TABLE IF NOT EXISTS public.estates_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  address JSONB,
  services JSONB DEFAULT '[]'::jsonb,
  accreditations JSONB DEFAULT '[]'::jsonb,
  insurance_certificates JSONB DEFAULT '[]'::jsonb,
  safeguarding_docs JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restricted')),
  preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_contractors IS 'Register of external contractors for compliance work';

CREATE INDEX IF NOT EXISTS idx_estates_contractors_org ON public.estates_contractors(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_contractors_status ON public.estates_contractors(status);

-- Create estates_contracts table
CREATE TABLE IF NOT EXISTS public.estates_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.estates_contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'maintenance', 'service', 'inspection', 'consultancy', 'installation'
  )),
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  sla JSONB DEFAULT '{}'::jsonb,
  annual_cost NUMERIC(10,2),
  billing_frequency TEXT CHECK (billing_frequency IN (
    'monthly', 'quarterly', 'annually', 'one_off'
  )),
  asset_ids UUID[] DEFAULT '{}',
  compliance_domains TEXT[] DEFAULT '{}',
  contract_document_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'expiring', 'expired', 'terminated', 'pending_renewal'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_contracts IS 'Contract register linking contractors to services and assets';

CREATE INDEX IF NOT EXISTS idx_estates_contracts_org ON public.estates_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_contracts_contractor ON public.estates_contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_estates_contracts_status ON public.estates_contracts(status);
CREATE INDEX IF NOT EXISTS idx_estates_contracts_dates ON public.estates_contracts(end_date, renewal_date);

-- Create estates_user_qualifications table
CREATE TABLE IF NOT EXISTS public.estates_user_qualifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qualification_type TEXT NOT NULL,
  qualification_name TEXT NOT NULL,
  certificate_number TEXT,
  issuing_body TEXT,
  issued_date DATE,
  expiry_date DATE,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  evidence_id UUID REFERENCES public.evidence_items(id),
  scope JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending_verification')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, qualification_type, certificate_number)
);

COMMENT ON TABLE public.estates_user_qualifications IS 'User qualifications for authorization checks';

CREATE INDEX IF NOT EXISTS idx_estates_qualifications_org ON public.estates_user_qualifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_qualifications_user ON public.estates_user_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_estates_qualifications_type ON public.estates_user_qualifications(qualification_type);
CREATE INDEX IF NOT EXISTS idx_estates_qualifications_expiry ON public.estates_user_qualifications(expiry_date);

-- Create estates_delegations table
CREATE TABLE IF NOT EXISTS public.estates_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compliance_domain TEXT,
  task_types TEXT[] DEFAULT '{}',
  valid_from DATE NOT NULL,
  valid_until DATE,
  conditions TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id, compliance_domain, valid_from)
);

COMMENT ON TABLE public.estates_delegations IS 'Delegation records for task authorization';

CREATE INDEX IF NOT EXISTS idx_estates_delegations_org ON public.estates_delegations(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_delegations_delegator ON public.estates_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_estates_delegations_delegate ON public.estates_delegations(delegate_id);
CREATE INDEX IF NOT EXISTS idx_estates_delegations_domain ON public.estates_delegations(compliance_domain);

-- Create estates_compliance_tasks table
CREATE TABLE IF NOT EXISTS public.estates_compliance_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  compliance_domain TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  scheduled_for DATE NOT NULL,
  due_by DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'termly', 'annual', 'ad_hoc'
  )),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  task_source TEXT NOT NULL CHECK (task_source IN ('internal', 'external')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_contractor_id UUID REFERENCES public.estates_contractors(id),
  asset_id UUID REFERENCES public.estates_assets(id),
  location_details JSONB DEFAULT '{}'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'awaiting_contractor',
    'contractor_scheduled', 'completed', 'overdue', 'skipped', 'cancelled'
  )),
  delegator_id UUID REFERENCES auth.users(id),
  qualification_required TEXT,
  appointment_scheduled_for TIMESTAMPTZ,
  appointment_window_start TIMESTAMPTZ,
  appointment_window_end TIMESTAMPTZ,
  appointment_notes TEXT,
  upload_token TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  evidence_ids UUID[] DEFAULT '{}',
  photo_urls TEXT[] DEFAULT '{}',
  findings JSONB DEFAULT '[]'::jsonb,
  overall_compliance_status TEXT CHECK (overall_compliance_status IN (
    'compliant', 'non_compliant', 'action_required', 'not_assessed'
  )),
  ai_processed BOOLEAN DEFAULT false,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  linked_task_id UUID REFERENCES public.estates_compliance_tasks(id),
  parent_recurring_task_id UUID REFERENCES public.estates_compliance_tasks(id),
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  overdue_reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_compliance_tasks IS 'All compliance tasks across all domains';

CREATE INDEX IF NOT EXISTS idx_estates_tasks_org ON public.estates_compliance_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_domain ON public.estates_compliance_tasks(compliance_domain);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_type ON public.estates_compliance_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_status ON public.estates_compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_assigned ON public.estates_compliance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_contractor ON public.estates_compliance_tasks(assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_asset ON public.estates_compliance_tasks(asset_id);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_scheduled ON public.estates_compliance_tasks(scheduled_for, due_by);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_upload ON public.estates_compliance_tasks(upload_token);
CREATE INDEX IF NOT EXISTS idx_estates_tasks_recurring ON public.estates_compliance_tasks(parent_recurring_task_id);

-- Create estates_helpdesk_tickets table
CREATE TABLE IF NOT EXISTS public.estates_helpdesk_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  ticket_sequence INTEGER DEFAULT 1,
  module TEXT NOT NULL CHECK (module IN (
    'estates', 'hr', 'finance', 'teaching_learning', 'safeguarding', 'compliance', 'it'
  )),
  category TEXT NOT NULL,
  subcategory TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  asset_id UUID REFERENCES public.estates_assets(id),
  task_id UUID REFERENCES public.estates_compliance_tasks(id),
  contractor_id UUID REFERENCES public.estates_contractors(id),
  contract_id UUID REFERENCES public.estates_contracts(id),
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_contractor_id UUID REFERENCES public.estates_contractors(id),
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_progress', 'awaiting_parts',
    'awaiting_contractor', 'resolved', 'closed', 'reopened', 'on_hold'
  )),
  sla_target TIMESTAMPTZ,
  sla_met BOOLEAN,
  sla_breach_reason TEXT,
  email_from TEXT,
  email_subject TEXT,
  email_body TEXT,
  email_message_id TEXT,
  resolution TEXT,
  resolution_summary TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  first_response_at TIMESTAMPTZ,
  time_to_resolution_minutes INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_helpdesk_tickets IS 'Unified helpdesk system for all Schoolgle modules';

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_org ON public.estates_helpdesk_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_number ON public.estates_helpdesk_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_module ON public.estates_helpdesk_tickets(module);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_status ON public.estates_helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_priority ON public.estates_helpdesk_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_raised ON public.estates_helpdesk_tickets(raised_by);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_assigned ON public.estates_helpdesk_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_asset ON public.estates_helpdesk_tickets(asset_id);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_task ON public.estates_helpdesk_tickets(task_id);

-- Create estates_helpdesk_comments table
CREATE TABLE IF NOT EXISTS public.estates_helpdesk_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.estates_helpdesk_tickets(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_comments_ticket ON public.estates_helpdesk_comments(ticket_id);

-- Create estates_helpdesk_activity table
CREATE TABLE IF NOT EXISTS public.estates_helpdesk_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.estates_helpdesk_tickets(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'assigned', 'status_changed', 'priority_changed',
    'comment_added', 'resolved', 'closed', 'reopened', 'sla_breached'
  )),
  from_value TEXT,
  to_value TEXT,
  description TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_activity_ticket ON public.estates_helpdesk_activity(ticket_id);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_activity_type ON public.estates_helpdesk_activity(activity_type);

-- Create estates_notification_templates table
CREATE TABLE IF NOT EXISTS public.estates_notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'task_due', 'task_overdue', 'finding_created', 'certificate_expiring',
    'inspection_reminder', 'sla_breach', 'contract_renewal'
  )),
  compliance_domain TEXT,
  subject TEXT,
  body_template TEXT,
  send_days_before INTEGER DEFAULT 0,
  send_days_after INTEGER,
  channels TEXT[] DEFAULT '{in_app,email}'::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estates-documents',
  'estates-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estates-images',
  'estates-images',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.estates_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_helpdesk_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_helpdesk_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "estates_assets_policy" ON public.estates_assets
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_contractors_policy" ON public.estates_contractors
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_contracts_policy" ON public.estates_contracts
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_user_qualifications_policy" ON public.estates_user_qualifications
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_delegations_policy" ON public.estates_delegations
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_compliance_tasks_policy" ON public.estates_compliance_tasks
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_helpdesk_tickets_policy" ON public.estates_helpdesk_tickets
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_helpdesk_comments_policy" ON public.estates_helpdesk_comments
  FOR ALL TO authenticated
  USING (ticket_id IN (
    SELECT id FROM public.estates_helpdesk_tickets WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  ));

CREATE POLICY "estates_helpdesk_activity_policy" ON public.estates_helpdesk_activity
  FOR ALL TO authenticated
  USING (ticket_id IN (
    SELECT id FROM public.estates_helpdesk_tickets WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  ));

CREATE POLICY "estates_notification_templates_read" ON public.estates_notification_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "estates_notification_templates_write" ON public.estates_notification_templates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid()::text AND om.role IN ('admin', 'sbm')
  ));

-- Storage policies
CREATE POLICY "estates_documents_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'estates-documents' AND
    array_to_string(storage.foldername(name), '/') IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "estates_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'estates-documents' AND
    array_to_string(storage.foldername(name), '/') IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "estates_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'estates-images' AND
    array_to_string(storage.foldername(name), '/') IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "estates_images_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'estates-images' AND
    array_to_string(storage.foldername(name), '/') IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

-- Service role policies
CREATE POLICY "service_estates_assets" ON public.estates_assets FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_contractors" ON public.estates_contractors FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_contracts" ON public.estates_contracts FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_qualifications" ON public.estates_user_qualifications FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_delegations" ON public.estates_delegations FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_tasks" ON public.estates_compliance_tasks FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_helpdesk" ON public.estates_helpdesk_tickets FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_comments" ON public.estates_helpdesk_comments FOR ALL TO service_role USING (true);
CREATE POLICY "service_estates_activity" ON public.estates_helpdesk_activity FOR ALL TO service_role USING (true);

-- Functions
CREATE OR REPLACE FUNCTION generate_estates_ticket_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_sequence), 0) + 1
  INTO seq_val
  FROM public.estates_helpdesk_tickets;

  RETURN 'EST-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_estates_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_estates_ticket_number();
    NEW.ticket_sequence := substring(NEW.ticket_number from 5)::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estates_helpdesk_ticket_number_trigger ON public.estates_helpdesk_tickets;
CREATE TRIGGER estates_helpdesk_ticket_number_trigger
  BEFORE INSERT ON public.estates_helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_estates_ticket_number();

CREATE OR REPLACE FUNCTION update_estates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estates_assets_updated_at BEFORE UPDATE ON public.estates_assets
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

CREATE TRIGGER estates_contractors_updated_at BEFORE UPDATE ON public.estates_contractors
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

CREATE TRIGGER estates_contracts_updated_at BEFORE UPDATE ON public.estates_contracts
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

CREATE TRIGGER estates_qualifications_updated_at BEFORE UPDATE ON public.estates_user_qualifications
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

CREATE TRIGGER estates_tasks_updated_at BEFORE UPDATE ON public.estates_compliance_tasks
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

CREATE TRIGGER estates_helpdesk_updated_at BEFORE UPDATE ON public.estates_helpdesk_tickets
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

-- Seed notification templates
INSERT INTO public.estates_notification_templates (template_id, name, description, notification_type, subject, body_template, send_days_before)
VALUES
  ('task_due_soon', 'Task Due Soon', 'Notify user when task is due soon', 'task_due', 'Task Due Soon', 'You have a compliance task due soon.', 1),
  ('task_overdue', 'Task Overdue', 'Notify user when task is overdue', 'task_overdue', 'Task Overdue', 'Your compliance task is overdue.', 0),
  ('finding_created', 'Finding Created', 'Notify responsible person when finding is created', 'finding_created', 'Compliance Finding Created', 'A finding has been created.', 0),
  ('certificate_expiring', 'Certificate Expiring', 'Notify when certificate is expiring', 'certificate_expiring', 'Certificate Expiring Soon', 'Certificate expires soon.', 30),
  ('inspection_reminder', 'Inspection Reminder', 'Reminder for upcoming inspection', 'inspection_reminder', 'Upcoming Inspection', 'Inspection scheduled.', 7)
ON CONFLICT (template_id) DO NOTHING;
