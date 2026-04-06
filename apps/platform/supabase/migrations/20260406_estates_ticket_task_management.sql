-- ESTATES MODULE: Ticket/Task Management System Enhancement
-- Task 022 — Extends existing estates tables with comprehensive ticket/task fields,
-- creates compliance_instances table, and adds missing columns to assets & contractors.
-- Builds on 20260123_estates_compliance_phase1.sql

-- ============================================================================
-- 1. EXTEND estates_helpdesk_tickets with Task 022 fields
-- ============================================================================

-- ticket_type: distinguishes compliance vs reactive vs planned tickets
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'maintenance_reactive'
CHECK (ticket_type IN ('compliance_scheduled', 'maintenance_reactive', 'improvement_planned'));

COMMENT ON COLUMN public.estates_helpdesk_tickets.ticket_type IS
'Ticket type: compliance_scheduled, maintenance_reactive, improvement_planned';

-- created_via: how the ticket was created
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'form'
CHECK (created_via IN ('form', 'ed_chatbot', 'auto_generated', 'system_scheduled', 'email'));

COMMENT ON COLUMN public.estates_helpdesk_tickets.created_via IS
'Source of ticket creation: form, ed_chatbot, auto_generated, system_scheduled, email';

-- assigned_to_name: denormalised display name
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- linked_compliance_check_id: FK to compliance checks (uses estates_compliance_tasks)
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS linked_compliance_check_id UUID REFERENCES public.estates_compliance_tasks(id);

-- linked_risk_entry_id: FK to risk_register if it exists, otherwise UUID for future FK
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS linked_risk_entry_id UUID;

-- cost tracking
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2);

ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(10,2);

-- due_date and completed_date
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- safeguarding_flag: auto-set for perimeter, CCTV, secure entry categories
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS safeguarding_flag BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.estates_helpdesk_tickets.safeguarding_flag IS
'Auto-set for perimeter security, CCTV, secure entry, and safeguarding-related categories';

-- risk_score: 5x5 matrix (1-25)
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 25);

COMMENT ON COLUMN public.estates_helpdesk_tickets.risk_score IS
'Risk score from 5x5 likelihood×impact matrix (1-25)';

-- evidence_urls: photo/document links
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[] DEFAULT '{}';

-- notes: timestamped notes with author
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.estates_helpdesk_tickets.notes IS
'Array of {author, author_name, text, created_at} timestamped note objects';

-- audit_trail: every status change with who/when/why
ALTER TABLE public.estates_helpdesk_tickets
ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.estates_helpdesk_tickets.audit_trail IS
'Array of {action, from_status, to_status, actor_id, actor_name, reason, timestamp} audit entries';

-- New indexes for the extended fields
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_ticket_type
  ON public.estates_helpdesk_tickets(ticket_type);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_due_date
  ON public.estates_helpdesk_tickets(due_date);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_safeguarding
  ON public.estates_helpdesk_tickets(safeguarding_flag) WHERE safeguarding_flag = true;

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_risk_score
  ON public.estates_helpdesk_tickets(risk_score);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_created_via
  ON public.estates_helpdesk_tickets(created_via);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_compliance_check
  ON public.estates_helpdesk_tickets(linked_compliance_check_id);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_risk_entry
  ON public.estates_helpdesk_tickets(linked_risk_entry_id);

-- ============================================================================
-- 2. CREATE compliance_instances TABLE
--    Tracks individual occurrences of scheduled compliance checks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estates_compliance_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Link to the parent compliance check definition
  compliance_check_id UUID NOT NULL REFERENCES public.estates_compliance_tasks(id) ON DELETE CASCADE,

  -- Scheduling
  due_date DATE NOT NULL,
  completed_date TIMESTAMPTZ,
  completed_by UUID,

  -- Status tracking
  status TEXT DEFAULT 'upcoming' CHECK (status IN (
    'upcoming', 'due', 'overdue', 'completed', 'skipped', 'cancelled'
  )),

  -- Evidence & documentation
  evidence_url TEXT,
  certificate_url TEXT,
  certificate_expiry DATE,
  certificate_reference TEXT,

  -- Contractor & cost
  contractor_id UUID REFERENCES public.estates_contractors(id),
  cost NUMERIC(10,2),
  invoice_reference TEXT,

  -- Result
  pass_fail TEXT CHECK (pass_fail IN ('pass', 'fail', 'partial', 'not_applicable')),
  findings JSONB DEFAULT '[]'::jsonb,
  remedial_actions JSONB DEFAULT '[]'::jsonb,

  -- Notes & metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_compliance_instances IS
'Individual occurrences of scheduled compliance checks — one row per check execution';

-- Indexes for compliance_instances
CREATE INDEX IF NOT EXISTS idx_compliance_instances_org
  ON public.estates_compliance_instances(organization_id);

CREATE INDEX IF NOT EXISTS idx_compliance_instances_check
  ON public.estates_compliance_instances(compliance_check_id);

CREATE INDEX IF NOT EXISTS idx_compliance_instances_status
  ON public.estates_compliance_instances(status);

CREATE INDEX IF NOT EXISTS idx_compliance_instances_due_date
  ON public.estates_compliance_instances(due_date);

CREATE INDEX IF NOT EXISTS idx_compliance_instances_contractor
  ON public.estates_compliance_instances(contractor_id);

CREATE INDEX IF NOT EXISTS idx_compliance_instances_overdue
  ON public.estates_compliance_instances(status, due_date)
  WHERE status IN ('due', 'overdue');

-- RLS
ALTER TABLE public.estates_compliance_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_instances_org_policy" ON public.estates_compliance_instances
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "service_compliance_instances" ON public.estates_compliance_instances
  FOR ALL TO service_role USING (true);

-- Updated_at trigger
CREATE TRIGGER estates_compliance_instances_updated_at
  BEFORE UPDATE ON public.estates_compliance_instances
  FOR EACH ROW EXECUTE FUNCTION update_estates_updated_at();

-- ============================================================================
-- 3. EXTEND estates_assets with Task 022 fields
-- ============================================================================

-- Lifecycle fields
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS expected_life_years INTEGER;

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS condition_grade TEXT CHECK (condition_grade IN ('A', 'B', 'C', 'D'));

COMMENT ON COLUMN public.estates_assets.condition_grade IS
'Condition grade: A=Good, B=Satisfactory, C=Poor, D=Bad/End of Life';

-- Financial fields
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS replacement_cost_estimate NUMERIC(10,2);

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS insurance_value NUMERIC(10,2);

-- Compliance linkage
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS linked_compliance_checks UUID[] DEFAULT '{}';

COMMENT ON COLUMN public.estates_assets.linked_compliance_checks IS
'UUIDs of compliance_tasks that apply to this asset';

-- Maintenance history
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS maintenance_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.estates_assets.maintenance_history IS
'Array of {date, type, description, contractor, cost, outcome} maintenance records';

-- Warranty tracking
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS warranty_expiry DATE;

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS warranty_provider TEXT;

-- Last inspection
ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS last_inspection_date DATE;

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS next_inspection_due DATE;

-- New indexes for asset extensions
CREATE INDEX IF NOT EXISTS idx_estates_assets_condition
  ON public.estates_assets(condition_grade);

CREATE INDEX IF NOT EXISTS idx_estates_assets_next_inspection
  ON public.estates_assets(next_inspection_due);

CREATE INDEX IF NOT EXISTS idx_estates_assets_warranty
  ON public.estates_assets(warranty_expiry);

-- ============================================================================
-- 4. EXTEND estates_contractors with Task 022 fields
-- ============================================================================

-- Trade categories
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS trade_categories TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.estates_contractors.trade_categories IS
'Trade categories: plumbing, electrical, gas, fire_safety, roofing, glazing, etc.';

-- Accreditation numbers
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS gas_safe_number TEXT;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS niceic_registration TEXT;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS other_accreditations_detail JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.estates_contractors.other_accreditations_detail IS
'Array of {body, number, expiry, verified} accreditation records';

-- Insurance
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS insurance_expiry DATE;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS public_liability_amount NUMERIC(12,2);

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS employers_liability_amount NUMERIC(12,2);

-- DBS checks
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS dbs_checked BOOLEAN DEFAULT false;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS dbs_expiry DATE;

-- Performance tracking
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) CHECK (rating BETWEEN 1.0 AND 5.0);

COMMENT ON COLUMN public.estates_contractors.rating IS
'Average rating 1.0-5.0 based on completed work';

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS total_spend NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;

ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS average_response_hours NUMERIC(6,1);

-- Active flag (spec calls for is_active, status already exists but let's add explicit flag)
ALTER TABLE public.estates_contractors
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- New indexes for contractor extensions
CREATE INDEX IF NOT EXISTS idx_estates_contractors_gas_safe
  ON public.estates_contractors(gas_safe_number) WHERE gas_safe_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_estates_contractors_insurance_expiry
  ON public.estates_contractors(insurance_expiry);

CREATE INDEX IF NOT EXISTS idx_estates_contractors_dbs_expiry
  ON public.estates_contractors(dbs_expiry) WHERE dbs_checked = true;

CREATE INDEX IF NOT EXISTS idx_estates_contractors_rating
  ON public.estates_contractors(rating);

CREATE INDEX IF NOT EXISTS idx_estates_contractors_trade
  ON public.estates_contractors USING gin(trade_categories);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function: Auto-set safeguarding_flag based on category
CREATE OR REPLACE FUNCTION auto_set_safeguarding_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category IS NOT NULL AND NEW.category IN (
    'perimeter_security', 'cctv', 'secure_entry', 'access_control',
    'safeguarding', 'fencing', 'gates', 'visitor_management',
    'lighting_external', 'emergency_exits'
  ) THEN
    NEW.safeguarding_flag := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estates_helpdesk_safeguarding_trigger ON public.estates_helpdesk_tickets;
CREATE TRIGGER estates_helpdesk_safeguarding_trigger
  BEFORE INSERT OR UPDATE OF category ON public.estates_helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_safeguarding_flag();

-- Function: Append to audit_trail on status change
CREATE OR REPLACE FUNCTION append_ticket_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.audit_trail := COALESCE(NEW.audit_trail, '[]'::jsonb) || jsonb_build_object(
      'action', 'status_changed',
      'from_status', OLD.status,
      'to_status', NEW.status,
      'timestamp', NOW()::text
    );
  END IF;
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    NEW.audit_trail := COALESCE(NEW.audit_trail, '[]'::jsonb) || jsonb_build_object(
      'action', 'priority_changed',
      'from_value', OLD.priority,
      'to_value', NEW.priority,
      'timestamp', NOW()::text
    );
  END IF;
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    NEW.audit_trail := COALESCE(NEW.audit_trail, '[]'::jsonb) || jsonb_build_object(
      'action', 'assigned',
      'from_value', OLD.assigned_to::text,
      'to_value', NEW.assigned_to::text,
      'timestamp', NOW()::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estates_helpdesk_audit_trail_trigger ON public.estates_helpdesk_tickets;
CREATE TRIGGER estates_helpdesk_audit_trail_trigger
  BEFORE UPDATE ON public.estates_helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION append_ticket_audit_trail();

-- Function: Auto-update compliance_instance status based on due_date
CREATE OR REPLACE FUNCTION update_compliance_instance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'upcoming' AND NEW.due_date <= CURRENT_DATE THEN
    NEW.status := 'due';
  END IF;
  IF NEW.status = 'due' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS compliance_instance_status_trigger ON public.estates_compliance_instances;
CREATE TRIGGER compliance_instance_status_trigger
  BEFORE INSERT OR UPDATE ON public.estates_compliance_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_instance_status();

-- ============================================================================
-- 6. VIEWS for reporting
-- ============================================================================

-- Overdue tickets view
CREATE OR REPLACE VIEW public.estates_overdue_tickets AS
SELECT
  t.id,
  t.organization_id,
  t.ticket_number,
  t.title,
  t.ticket_type,
  t.priority,
  t.status,
  t.due_date,
  t.safeguarding_flag,
  t.risk_score,
  t.assigned_to,
  t.assigned_to_name,
  t.contractor_id,
  CURRENT_DATE - t.due_date AS days_overdue,
  t.estimated_cost,
  t.created_at
FROM public.estates_helpdesk_tickets t
WHERE t.due_date < CURRENT_DATE
  AND t.status NOT IN ('resolved', 'closed');

-- Compliance check schedule view
CREATE OR REPLACE VIEW public.estates_compliance_schedule AS
SELECT
  ci.id AS instance_id,
  ci.organization_id,
  ct.task_name AS check_name,
  ct.compliance_domain,
  ct.task_type AS check_type,
  ci.due_date,
  ci.status,
  ci.contractor_id,
  ec.company_name AS contractor_name,
  ci.cost,
  ci.pass_fail,
  ci.certificate_expiry,
  ct.frequency,
  ci.completed_date,
  ci.created_at
FROM public.estates_compliance_instances ci
JOIN public.estates_compliance_tasks ct ON ct.id = ci.compliance_check_id
LEFT JOIN public.estates_contractors ec ON ec.id = ci.contractor_id;

-- Ticket stats summary view
CREATE OR REPLACE VIEW public.estates_ticket_stats AS
SELECT
  t.organization_id,
  COUNT(*) FILTER (WHERE t.status NOT IN ('resolved', 'closed')) AS open_tickets,
  COUNT(*) FILTER (WHERE t.status = 'new' OR t.status = 'open') AS new_tickets,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress_tickets,
  COUNT(*) FILTER (WHERE t.status IN ('awaiting_parts', 'awaiting_contractor')) AS awaiting_tickets,
  COUNT(*) FILTER (WHERE t.status IN ('resolved', 'closed')) AS resolved_tickets,
  COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('resolved', 'closed')) AS overdue_tickets,
  COUNT(*) FILTER (WHERE t.safeguarding_flag = true AND t.status NOT IN ('resolved', 'closed')) AS safeguarding_open,
  COUNT(*) FILTER (WHERE t.priority = 'critical' AND t.status NOT IN ('resolved', 'closed')) AS critical_open,
  COUNT(*) FILTER (WHERE t.ticket_type = 'compliance_scheduled') AS compliance_tickets,
  COUNT(*) FILTER (WHERE t.ticket_type = 'maintenance_reactive') AS maintenance_tickets,
  COUNT(*) FILTER (WHERE t.ticket_type = 'improvement_planned') AS improvement_tickets,
  COALESCE(SUM(t.estimated_cost) FILTER (WHERE t.status NOT IN ('resolved', 'closed')), 0) AS open_estimated_cost,
  COALESCE(SUM(t.actual_cost) FILTER (WHERE t.status IN ('resolved', 'closed')), 0) AS resolved_actual_cost,
  AVG(t.time_to_resolution_minutes) FILTER (WHERE t.time_to_resolution_minutes IS NOT NULL) AS avg_resolution_minutes
FROM public.estates_helpdesk_tickets t
GROUP BY t.organization_id;

-- Asset condition summary view
CREATE OR REPLACE VIEW public.estates_asset_condition_summary AS
SELECT
  a.organization_id,
  COUNT(*) AS total_assets,
  COUNT(*) FILTER (WHERE a.condition_grade = 'A') AS grade_a,
  COUNT(*) FILTER (WHERE a.condition_grade = 'B') AS grade_b,
  COUNT(*) FILTER (WHERE a.condition_grade = 'C') AS grade_c,
  COUNT(*) FILTER (WHERE a.condition_grade = 'D') AS grade_d,
  COUNT(*) FILTER (WHERE a.next_inspection_due < CURRENT_DATE) AS inspections_overdue,
  COUNT(*) FILTER (WHERE a.next_inspection_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS inspections_due_30d,
  COUNT(*) FILTER (WHERE a.warranty_expiry < CURRENT_DATE) AS warranties_expired,
  COALESCE(SUM(a.replacement_cost_estimate) FILTER (WHERE a.condition_grade IN ('C', 'D')), 0) AS poor_condition_replacement_cost
FROM public.estates_assets a
WHERE a.status = 'active'
GROUP BY a.organization_id;

-- ============================================================================
-- 7. GRANT PERMISSIONS ON VIEWS
-- ============================================================================

GRANT SELECT ON public.estates_overdue_tickets TO authenticated;
GRANT SELECT ON public.estates_compliance_schedule TO authenticated;
GRANT SELECT ON public.estates_ticket_stats TO authenticated;
GRANT SELECT ON public.estates_asset_condition_summary TO authenticated;
