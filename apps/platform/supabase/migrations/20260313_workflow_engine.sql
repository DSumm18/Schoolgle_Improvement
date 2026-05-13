-- ============================================================================
-- Workflow Engine
-- Cross-module orchestration for multi-step processes (inspection remediation,
-- procurement, onboarding, etc.) with phase gates, step dependencies,
-- recurring checks, escalation rules, and AI-assisted actions.
-- ============================================================================

-- ============================================================
-- 1. WORKFLOWS (top-level orchestration container)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template_slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed','cancelled')),
  current_phase INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Owner
  owner_id TEXT,
  owner_name TEXT,
  owner_role TEXT,

  -- Trigger
  trigger_type TEXT DEFAULT 'manual'
    CHECK (trigger_type IN ('manual','inspection_failure','incident','maintenance')),
  trigger_source_id UUID,
  ed_session_id TEXT,

  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON workflows(template_slug);

-- ============================================================
-- 2. WORKFLOW PHASES (ordered stages within a workflow)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','completed','skipped')),
  gate_type TEXT DEFAULT 'all_previous'
    CHECK (gate_type IN ('all_previous','manual','none')),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workflow_id, phase_number)
);

CREATE INDEX IF NOT EXISTS idx_workflow_phases_workflow ON workflow_phases(workflow_id);

-- ============================================================
-- 3. WORKFLOW STEPS (individual tasks within a phase)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES workflow_phases(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','done','blocked','skipped','waiting_external')),

  -- Assignment
  owner_role TEXT,
  owner_id TEXT,
  owner_name TEXT,

  -- Dependencies
  depends_on_step_ids UUID[] DEFAULT '{}',

  -- Linked entity (e.g. estates_finding, risk_register entry)
  linked_entity_type TEXT,
  linked_entity_id UUID,

  -- External system integration
  external_system TEXT,
  external_reference TEXT,
  is_automated BOOLEAN DEFAULT false,
  is_external BOOLEAN DEFAULT false,

  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approval_type TEXT,

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  completion_notes TEXT,
  completion_evidence JSONB DEFAULT '[]',
  notify_on_actionable BOOLEAN DEFAULT true,

  -- Recurring check fields
  check_frequency TEXT,
  last_checked_at TIMESTAMPTZ,
  next_check_due TIMESTAMPTZ,
  missed_check_count INTEGER DEFAULT 0,

  -- Consequence escalation
  escalation_rule JSONB,

  -- AI assistance config
  ai_assist_type TEXT,
  ai_assist_config JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_phase ON workflow_steps(phase_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_owner_role ON workflow_steps(owner_role);

-- ============================================================
-- 4. WORKFLOW TEMPLATES (reusable blueprints)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  phases JSONB NOT NULL,
  modules_touched TEXT[] DEFAULT '{}',
  total_steps INTEGER DEFAULT 0,
  estimated_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. PROCUREMENT REQUESTS (linked to workflow steps)
-- ============================================================
CREATE TABLE IF NOT EXISTS procurement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  workflow_id UUID REFERENCES workflows(id),
  workflow_step_id UUID REFERENCES workflow_steps(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'equipment'
    CHECK (category IN ('equipment','maintenance','supplies','service')),

  -- Budget
  estimated_amount DECIMAL(10,2),
  budget_line_cfr TEXT,

  -- Quotes
  quotes_required INTEGER DEFAULT 3,
  quotes JSONB DEFAULT '[]',
  selected_supplier TEXT,
  selected_amount DECIMAL(10,2),

  -- Approval
  approval_request_id UUID,
  approval_status TEXT DEFAULT 'draft'
    CHECK (approval_status IN ('draft','pending','approved','rejected')),

  -- External PO
  external_po_number TEXT,
  external_po_raised BOOLEAN DEFAULT false,
  external_po_date DATE,

  -- Invoice & Payment
  invoice_received BOOLEAN DEFAULT false,
  invoice_amount DECIMAL(10,2),
  invoice_reference TEXT,
  payment_confirmed BOOLEAN DEFAULT false,
  payment_date DATE,

  -- Links
  contractor_id UUID,
  deal_finder_product_id UUID,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procurement_org ON procurement_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_procurement_workflow ON procurement_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_procurement_approval ON procurement_requests(approval_status);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- --- workflows ---
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflows_select' AND tablename = 'workflows') THEN
    CREATE POLICY workflows_select ON workflows
      FOR SELECT USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_members om
          WHERE om.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflows_manage' AND tablename = 'workflows') THEN
    CREATE POLICY workflows_manage ON workflows
      FOR ALL USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_members om
          WHERE om.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflows_service' AND tablename = 'workflows') THEN
    CREATE POLICY workflows_service ON workflows
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- --- workflow_phases ---
ALTER TABLE workflow_phases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_phases_select' AND tablename = 'workflow_phases') THEN
    CREATE POLICY workflow_phases_select ON workflow_phases
      FOR SELECT USING (
        workflow_id IN (
          SELECT w.id FROM workflows w
          WHERE w.organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid()::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_phases_manage' AND tablename = 'workflow_phases') THEN
    CREATE POLICY workflow_phases_manage ON workflow_phases
      FOR ALL USING (
        workflow_id IN (
          SELECT w.id FROM workflows w
          WHERE w.organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid()::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_phases_service' AND tablename = 'workflow_phases') THEN
    CREATE POLICY workflow_phases_service ON workflow_phases
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- --- workflow_steps ---
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_steps_select' AND tablename = 'workflow_steps') THEN
    CREATE POLICY workflow_steps_select ON workflow_steps
      FOR SELECT USING (
        workflow_id IN (
          SELECT w.id FROM workflows w
          WHERE w.organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid()::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_steps_manage' AND tablename = 'workflow_steps') THEN
    CREATE POLICY workflow_steps_manage ON workflow_steps
      FOR ALL USING (
        workflow_id IN (
          SELECT w.id FROM workflows w
          WHERE w.organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid()::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_steps_service' AND tablename = 'workflow_steps') THEN
    CREATE POLICY workflow_steps_service ON workflow_steps
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- --- workflow_templates (public read, service role full) ---
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_templates_public_read' AND tablename = 'workflow_templates') THEN
    CREATE POLICY workflow_templates_public_read ON workflow_templates
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workflow_templates_service' AND tablename = 'workflow_templates') THEN
    CREATE POLICY workflow_templates_service ON workflow_templates
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- --- procurement_requests ---
ALTER TABLE procurement_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'procurement_requests_select' AND tablename = 'procurement_requests') THEN
    CREATE POLICY procurement_requests_select ON procurement_requests
      FOR SELECT USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_members om
          WHERE om.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'procurement_requests_manage' AND tablename = 'procurement_requests') THEN
    CREATE POLICY procurement_requests_manage ON procurement_requests
      FOR ALL USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_members om
          WHERE om.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'procurement_requests_service' AND tablename = 'procurement_requests') THEN
    CREATE POLICY procurement_requests_service ON procurement_requests
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 7. SEED: equipment-inspection-failure TEMPLATE
-- ============================================================
-- 7 phases, 38 steps covering the full lifecycle from inspection
-- failure to financial close-out.

INSERT INTO workflow_templates (slug, title, description, category, modules_touched, total_steps, estimated_days, phases)
VALUES (
  'equipment-inspection-failure',
  'Equipment Inspection Failure Remediation',
  'End-to-end workflow triggered when an estates inspection identifies a failed or high-risk item. Covers immediate safety, assessment, procurement, approval, work execution, sign-off, and financial close.',
  'estates',
  ARRAY['estates','procurement','finance','risk','compliance'],
  38,
  21,
  '[
    {
      "phase_number": 1,
      "title": "IMMEDIATE SAFETY",
      "description": "Secure the area, assess immediate danger, and take interim protective measures within 24 hours.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Isolate or cordon off affected area",
          "description": "Prevent access to the area where the failed equipment is located. Use barriers, signage, or locks as appropriate.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "estates_finding",
          "notify_on_actionable": true,
          "escalation_rule": {
            "if_not_done_within_hours": 2,
            "escalate_to": "headteacher",
            "message": "Safety cordon not confirmed within 2 hours of inspection failure"
          }
        },
        {
          "step_number": 2,
          "title": "Take photographic evidence of current state",
          "description": "Capture dated photographs of the failed item and surrounding area for insurance and compliance records.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "estates_finding",
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Log incident in risk register",
          "description": "Create or update the risk register entry with the inspection failure details, current risk score, and interim controls.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "risk_register",
          "ai_assist_type": "draft_risk_entry",
          "ai_assist_config": {
            "prompt": "Draft a risk register entry for an equipment inspection failure. Include: hazard description, who is affected, current controls, residual risk score, and recommended actions.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Notify headteacher and relevant staff",
          "description": "Send immediate notification to the headteacher, health & safety lead, and any staff whose areas are affected.",
          "owner_role": "site_manager",
          "is_automated": true,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true,
          "escalation_rule": {
            "if_not_done_within_hours": 1,
            "escalate_to": "headteacher",
            "message": "Inspection failure notification not sent within 1 hour"
          }
        },
        {
          "step_number": 5,
          "title": "Implement temporary safety measures",
          "description": "Put interim controls in place: alternative equipment, temporary barriers, adjusted room usage, or rescheduled activities.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 6,
          "title": "Update RIDDOR reporting if applicable",
          "description": "Assess whether the failure is RIDDOR-reportable (dangerous occurrence). If so, report to HSE within 10 days.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "HSE RIDDOR",
          "external_reference": "https://www.hse.gov.uk/riddor/",
          "notify_on_actionable": true
        },
        {
          "step_number": 7,
          "title": "Notify parents if pupil areas affected (conditional)",
          "description": "If the failure affects areas used by pupils (playground, hall, classroom), notify parents via the school communication channel.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": true,
          "approval_type": "headteacher_sign_off",
          "notify_on_actionable": true
        },
        {
          "step_number": 8,
          "title": "Contact insurance provider if significant damage (conditional)",
          "description": "For failures involving significant property damage or potential liability, notify the school insurance provider within 24 hours.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "insurance_provider",
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 2,
      "title": "ASSESSMENT",
      "description": "Determine root cause, scope of work, and whether repair or replacement is needed.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Review original inspection report",
          "description": "Obtain and review the full inspection report, noting specific failure points, inspector recommendations, and compliance references.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "estates_finding",
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Assess repair vs replacement",
          "description": "Evaluate whether the equipment can be repaired to a compliant standard or requires full replacement. Consider age, condition, parts availability, and cost-effectiveness.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "ai_assist_type": "repair_vs_replace",
          "ai_assist_config": {
            "prompt": "Analyse repair vs replacement options for the failed equipment. Consider: remaining useful life, repair cost vs replacement cost, compliance requirements, warranty status, and energy efficiency of newer models.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Define scope of work and specification",
          "description": "Write a clear specification for the required work, including technical requirements, compliance standards to meet, and any site-specific constraints.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "ai_assist_type": "draft_specification",
          "ai_assist_config": {
            "prompt": "Draft a scope of work specification for remediation of the equipment failure. Include: technical requirements, applicable British Standards, site access constraints, and completion criteria.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Identify budget line and available funds",
          "description": "Check CFR budget lines for premises maintenance or capital expenditure. Confirm available balance and whether a virement or additional funding is needed.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "finance_budget_line",
          "notify_on_actionable": true
        },
        {
          "step_number": 5,
          "title": "Determine urgency and target completion date",
          "description": "Set a target completion date based on risk severity, term dates, and regulatory deadlines. Flag if emergency procurement is needed.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 3,
      "title": "PROCUREMENT",
      "description": "Obtain quotes, compare options, and select a supplier following financial regulations.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Check approved contractor list",
          "description": "Review the school or trust approved contractor list for suitable suppliers. Check DBS status, insurance validity, and past performance ratings.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "contractor",
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Check Deal Finder for framework options",
          "description": "Search Schoolgle Deal Finder for DfE framework agreements, CPC contracts, or group purchasing options that may offer better value.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "deal_finder_product",
          "ai_assist_type": "deal_finder_search",
          "ai_assist_config": {
            "prompt": "Search for relevant framework agreements and deals for this type of equipment or service. Prioritise DfE-recommended frameworks and CPC contracts.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Request minimum 3 quotes",
          "description": "Send the scope of work to at least 3 suppliers and request itemised quotes with timescales. For amounts over Â£25k, consider formal tender.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "supplier_portal",
          "notify_on_actionable": true,
          "escalation_rule": {
            "if_not_done_within_hours": 120,
            "escalate_to": "headteacher",
            "message": "Quotes not received within 5 working days"
          }
        },
        {
          "step_number": 4,
          "title": "Log quotes in procurement record",
          "description": "Record all received quotes with supplier details, amounts, timescales, and any conditions. Attach quote documents as evidence.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "procurement_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 5,
          "title": "Evaluate quotes and recommend supplier",
          "description": "Compare quotes on price, quality, timescale, warranty, and past performance. Document the evaluation criteria and scoring.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "ai_assist_type": "quote_comparison",
          "ai_assist_config": {
            "prompt": "Compare the submitted quotes using a weighted scoring matrix: Price (40%), Quality/Specification (25%), Timescale (20%), Warranty (10%), Past Performance (5%). Recommend the best value option.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 6,
          "title": "Verify supplier DBS, insurance, and accreditations",
          "description": "Before finalising selection, confirm the chosen supplier has valid DBS checks (if working near children), public liability insurance, and relevant trade accreditations.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "supplier_verification",
          "notify_on_actionable": true
        },
        {
          "step_number": 7,
          "title": "Prepare approval request with recommendation",
          "description": "Create the formal approval request including: summary of failure, scope of work, quote comparison, recommended supplier, total cost, and budget impact.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "approval_request",
          "ai_assist_type": "draft_approval_request",
          "ai_assist_config": {
            "prompt": "Draft an approval request for expenditure following an equipment inspection failure. Include: background, options considered, recommended supplier with justification, cost breakdown, budget impact, and risk of not proceeding.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        },
        {
          "step_number": 8,
          "title": "Check if value triggers ATH 2025 thresholds",
          "description": "Verify expenditure against Academy Trust Handbook 2025 thresholds: up to Â£5k = HT, Â£5-25k = SLT+HT, Â£25-100k = CFO/CEO, over Â£100k = Board approval. Adjust approval routing accordingly.",
          "owner_role": "business_manager",
          "is_automated": true,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "approval_request",
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 4,
      "title": "APPROVAL",
      "description": "Route the expenditure through the appropriate approval chain based on value.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Submit approval request",
          "description": "Submit the expenditure approval request through Schoolgle approvals system with all supporting documentation attached.",
          "owner_role": "headteacher",
          "is_automated": true,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "approval_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Headteacher review and sign-off",
          "description": "Headteacher reviews the proposal, quotes, and recommendation. Approves or requests changes.",
          "owner_role": "headteacher",
          "is_automated": false,
          "is_external": false,
          "requires_approval": true,
          "approval_type": "headteacher_approval",
          "linked_entity_type": "approval_request",
          "notify_on_actionable": true,
          "escalation_rule": {
            "if_not_done_within_hours": 48,
            "escalate_to": "slt",
            "message": "Approval request awaiting headteacher sign-off for over 48 hours"
          }
        },
        {
          "step_number": 3,
          "title": "Escalate to governors/trust if above threshold",
          "description": "For amounts exceeding the headteacher delegation limit, escalate to governors (maintained) or trust board (academy) for approval.",
          "owner_role": "headteacher",
          "is_automated": true,
          "is_external": false,
          "requires_approval": true,
          "approval_type": "governor_approval",
          "linked_entity_type": "approval_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Confirm budget allocation and code",
          "description": "Once approved, confirm the budget allocation, CFR code, and any virement required. Update the budget forecast.",
          "owner_role": "headteacher",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "finance_budget_line",
          "notify_on_actionable": true
        },
        {
          "step_number": 5,
          "title": "Issue purchase order",
          "description": "Raise the purchase order in the school finance system (FMS, Sage, Access, etc.) and send to the selected supplier.",
          "owner_role": "headteacher",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "finance_system",
          "linked_entity_type": "procurement_request",
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 5,
      "title": "WORK EXECUTION",
      "description": "Manage the on-site delivery of repair or replacement work.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Schedule work with contractor",
          "description": "Agree start date, duration, access arrangements, and any disruption mitigation (e.g. room changes, term-time vs holiday work).",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "contractor_scheduling",
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Prepare site and notify affected staff/pupils",
          "description": "Clear the area, arrange alternative provision if needed, and communicate the work schedule to affected staff and parents.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Verify contractor credentials on arrival",
          "description": "Check contractor DBS, sign in, issue visitor badges, and brief on school safeguarding and fire procedures.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Monitor work progress",
          "description": "Conduct daily check-ins with the contractor during the work. Note any delays, additional issues discovered, or variations to the original scope.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "check_frequency": "daily",
          "notify_on_actionable": true,
          "escalation_rule": {
            "if_not_done_within_hours": 24,
            "escalate_to": "headteacher",
            "message": "Daily work monitoring check not completed"
          }
        },
        {
          "step_number": 5,
          "title": "Document any scope variations",
          "description": "If additional work is identified during execution, document the variation, get a revised quote, and seek approval before proceeding.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": true,
          "approval_type": "headteacher_sign_off",
          "linked_entity_type": "procurement_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 6,
          "title": "Receive completion notification from contractor",
          "description": "Contractor confirms work is complete. Obtain any certificates, test results, or warranty documentation.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "contractor",
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 6,
      "title": "SIGN-OFF",
      "description": "Verify the work meets the required standard and formally accept completion.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Conduct site manager inspection",
          "description": "Physically inspect the completed work against the original specification. Check quality, finish, and compliance with the scope of work.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Obtain compliance certificates",
          "description": "Collect all required certificates: electrical (EICR), gas safety, fire safety, structural, or equipment-specific test certificates as applicable.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "certification_body",
          "linked_entity_type": "compliance_document",
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Take completion photographs",
          "description": "Photograph the completed work from the same angles as the pre-work evidence. Store as completion evidence linked to the workflow.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Headteacher sign-off on completion",
          "description": "Headteacher reviews completion evidence, certificates, and site manager report. Formally approves the work as satisfactory.",
          "owner_role": "headteacher",
          "is_automated": false,
          "is_external": false,
          "requires_approval": true,
          "approval_type": "headteacher_sign_off",
          "notify_on_actionable": true
        },
        {
          "step_number": 5,
          "title": "Update risk register and estates records",
          "description": "Close or downgrade the risk register entry. Update the asset record with new inspection date, warranty details, and next service due date.",
          "owner_role": "site_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "risk_register",
          "ai_assist_type": "update_risk_entry",
          "ai_assist_config": {
            "prompt": "Update the risk register entry to reflect completed remediation. Reduce the risk score, note the controls now in place, set the review date, and close the entry if fully resolved.",
            "model": "openai/gpt-4o-mini"
          },
          "notify_on_actionable": true
        }
      ]
    },
    {
      "phase_number": 7,
      "title": "FINANCIAL CLOSE",
      "description": "Complete the financial lifecycle: invoice verification, payment, and budget reconciliation.",
      "gate_type": "all_previous",
      "steps": [
        {
          "step_number": 1,
          "title": "Receive and verify invoice",
          "description": "Check the invoice matches the purchase order, agreed price, and scope of work. Flag any discrepancies for resolution.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "procurement_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 2,
          "title": "Three-way match: PO, delivery, invoice",
          "description": "Confirm the purchase order, delivery/completion evidence, and invoice all align. This is a key internal control required by auditors.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "notify_on_actionable": true
        },
        {
          "step_number": 3,
          "title": "Authorise payment in finance system",
          "description": "Process the payment through the school finance system (FMS, Sage, Access, etc.) using the approved budget code.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": true,
          "approval_type": "payment_authorisation",
          "external_system": "finance_system",
          "linked_entity_type": "procurement_request",
          "notify_on_actionable": true
        },
        {
          "step_number": 4,
          "title": "Confirm payment to supplier",
          "description": "Verify the BACS payment has been processed and notify the supplier of payment with remittance advice.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": true,
          "requires_approval": false,
          "external_system": "banking",
          "notify_on_actionable": true
        },
        {
          "step_number": 5,
          "title": "Update budget forecast and CFR return",
          "description": "Reconcile the actual expenditure against budget. Update the in-year budget forecast and note the spend for the CFR return.",
          "owner_role": "business_manager",
          "is_automated": false,
          "is_external": false,
          "requires_approval": false,
          "linked_entity_type": "finance_budget_line",
          "notify_on_actionable": true
        },
        {
          "step_number": 6,
          "title": "Archive workflow and set warranty reminder",
          "description": "Mark the workflow as complete. Set a calendar reminder for warranty expiry and next scheduled inspection date.",
          "owner_role": "business_manager",
          "is_automated": true,
          "is_external": false,
          "requires_approval": false,
          "check_frequency": "annual",
          "notify_on_actionable": true,
          "ai_assist_type": "warranty_reminder",
          "ai_assist_config": {
            "prompt": "Calculate the warranty expiry date and next inspection due date based on the equipment type and supplier warranty terms. Create a reminder schedule.",
            "model": "openai/gpt-4o-mini"
          }
        }
      ]
    }
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  phases = EXCLUDED.phases,
  modules_touched = EXCLUDED.modules_touched,
  total_steps = EXCLUDED.total_steps,
  estimated_days = EXCLUDED.estimated_days,
  updated_at = now();

