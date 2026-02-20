-- Ed RPA - Skills Library Database Schema
-- Schools can create, share, and reuse automation skills

-- ============================================================
-- SKILLS TABLE - Core skill definitions
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'hr', 'safeguarding', 'compliance', 'hse', 'admissions', 'welfare'

  -- Creator and visibility
  created_by_school UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,

  -- Eligibility (who can use this skill?)
  eligible_local_authorities TEXT[] DEFAULT ARRAY[]::TEXT[],
  eligible_systems TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['Arbor', 'SIMS', 'Bromcom', 'CPOMS']
  eligible_roles TEXT[] DEFAULT ARRAY[]::TEXT[],    -- ['admin', 'sbm', 'slt']

  -- Target form/system info
  target_url TEXT,
  target_name TEXT,  -- Human readable name
  target_system TEXT, -- 'Bradford LA Portal', 'CPOMS', etc.

  -- The skill definition (what to do)
  skill_definition JSONB NOT NULL,
  -- {
  --   steps: [
  --     { action: 'navigate', url: '...', selector: '...' },
  --     { action: 'type', selector: '#name', value: '${employee_name}' },
  --     { action: 'select', selector: '#role', value: '${role}' },
  --     { action: 'wait', ms: 1000 },
  --     { action: 'submit', selector: 'button[type="submit"]' }
  --   ],
  --   data_sources: {
  --     employee_name: 'arbor_hr.employee.name',
  --     role: 'arbor_hr.employee.role',
  --     absence_dates: 'arbor_hr.absence.dates'
  --   },
  --   safety: {
  --     require_review: true,
  --     required_role: 'school_business_manager',
  --     dual_approval: false
  --   }
  -- }

  -- Scheduling (for automated runs)
  schedule_config JSONB,
  -- {
  --   frequency: 'weekly',  -- 'daily', 'weekly', 'monthly'
  --   day_of_week: 'friday',
  --   time: '16:00',
  --   timezone: 'Europe/London'
  -- }

  -- Usage stats
  used_by_schools UUID[] DEFAULT ARRAY[]::UUID[],
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,  -- Percentage
  last_used_at TIMESTAMPTZ,

  -- Safety & Verification
  safety_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  risk_level TEXT DEFAULT 'medium',  -- 'low', 'medium', 'high', 'critical'

  -- Status
  is_active BOOLEAN DEFAULT true,
  deprecated BOOLEAN DEFAULT FALSE,
  deprecated_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(skill_key, created_by_school, version)
);

-- Enable RLS
ALTER TABLE ed_rpa_skills ENABLE ROW LEVEL SECURITY;

-- Public skills visible to everyone
CREATE POLICY "Public skills visible to all"
ON ed_rpa_skills FOR SELECT
USING (is_public = true AND is_active = true);

-- Schools can see their own skills
CREATE POLICY "Schools can see their own skills"
ON ed_rpa_skills FOR SELECT
USING (
  created_by_school IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Schools can create skills
CREATE POLICY "Schools can create skills"
ON ed_rpa_skills FOR INSERT
WITH CHECK (
  created_by_school IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Creators can update their skills
CREATE POLICY "Creators can update their skills"
ON ed_rpa_skills FOR UPDATE
USING (
  created_by_school IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- SKILL VERSIONS - Track changes to skills over time
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_skill_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES ed_rpa_skills(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  skill_definition JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(skill_id, version)
);

-- ============================================================
-- AUTOMATION RUNS - Track scheduled/triggered runs
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES ed_rpa_skills(id) ON DELETE CASCADE,

  -- Who triggered this?
  triggered_by UUID REFERENCES auth.users(id),
  triggered_by_school UUID REFERENCES organizations(id),
  trigger_type TEXT NOT NULL,  -- 'scheduled', 'manual', 'api', 'webhook'

  -- Run status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'awaiting_review', 'completed', 'failed', 'cancelled'
  progress JSONB,  -- { current_step: 3, total_steps: 10, current_action: 'Filling form...' }

  -- Data used in this run
  input_data JSONB,  -- The data that was filled into the form

  -- Review & approval
  requires_review BOOLEAN DEFAULT true,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,  -- 'approved', 'rejected', 'changes_requested'
  review_notes TEXT,

  -- Approval (if dual approval required)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Result
  result JSONB,  -- { success: true, confirmation: '...', submitted_at: '...' }
  error_message TEXT,

  -- Screenshots/visual proof (for audit)
  before_screenshot TEXT,  -- Before filling
  after_screenshot TEXT,   -- After filling
  diff_screenshot TEXT,    -- Highlighted changes

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_ed_rpa_runs_skill_status ON ed_rpa_runs(skill_id, status);
CREATE INDEX idx_ed_rpa_runs_school_status ON ed_rpa_runs(triggered_by_school, status);
CREATE INDEX idx_ed_rpa_runs_date ON ed_rpa_runs(started_at DESC);

-- ============================================================
-- RUN APPROVALS - For skills requiring approval
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_run_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ed_rpa_runs(id) ON DELETE CASCADE,
  approver UUID REFERENCES auth.users(id),
  decision TEXT NOT NULL,  -- 'approved', 'rejected', 'changes_requested'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(run_id, approver)
);

-- ============================================================
-- SKILL SUBSCRIPTIONS - Schools subscribe to skills
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_skill_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES ed_rpa_skills(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Customization (school can adapt a public skill)
  custom_config JSONB,  -- Override certain settings

  -- Status
  is_active BOOLEAN DEFAULT true,
  auto_run BOOLEAN DEFAULT false,  -- Run automatically on schedule?
  schedule_config JSONB,  -- Custom schedule for this school

  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,

  UNIQUE(skill_id, school_id)
);

-- ============================================================
-- AUDIT LOG - Track everything for compliance
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_rpa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- 'skill_created', 'run_started', 'run_completed', 'form_submitted', 'review_approved'
  skill_id UUID REFERENCES ed_rpa_skills(id),
  run_id UUID REFERENCES ed_rpa_runs(id),
  school_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),

  -- Event details
  details JSONB,

  -- Security & compliance
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_ed_rpa_audit_event_type ON ed_rpa_audit_log(event_type);
CREATE INDEX idx_ed_rpa_audit_school_date ON ed_rpa_audit_log(school_id, created_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get available skills for a school
CREATE OR REPLACE FUNCTION get_school_rpa_skills(
  school_org_id UUID,
  school_local_authority TEXT DEFAULT NULL,
  school_systems TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  skill_id UUID,
  skill_key TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  target_name TEXT,
  risk_level TEXT,
  is_subscribed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.skill_key,
    s.name,
    s.description,
    s.category,
    s.target_name,
    s.risk_level,
    EXISTS(
      SELECT 1 FROM ed_rpa_skill_subscriptions sub
      WHERE sub.skill_id = s.id AND sub.school_id = school_org_id AND sub.is_active = true
    ) AS is_subscribed
  FROM ed_rpa_skills s
  WHERE s.is_active = true
    AND (
      -- School's own skills
      s.created_by_school = school_org_id
      OR
      -- Public skills that match school's LA
      (s.is_public = true AND (
        school_local_authority IS NULL
        OR s.eligible_local_authorities IS NULL
        OR s.eligible_local_authorities @> ARRAY[school_local_authority]::TEXT[]
      ))
    )
  ORDER BY s.category, s.name;
END;
$$ LANGUAGE plpgsql;

-- Create a new automation run
CREATE OR REPLACE FUNCTION create_rpa_run(
  p_skill_id UUID,
  p_user_id UUID,
  p_school_id UUID,
  p_trigger_type TEXT DEFAULT 'manual',
  p_input_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
  v_requires_review BOOLEAN;
BEGIN
  -- Check if skill requires review
  SELECT COALESCE(
    (skill_definition->>'safety')::json->>'require_review',
    'true'
  )::BOOLEAN = TRUE INTO v_requires_review
  FROM ed_rpa_skills
  WHERE id = p_skill_id;

  -- Create the run
  INSERT INTO ed_rpa_runs (
    skill_id,
    triggered_by,
    triggered_by_school,
    trigger_type,
    input_data,
    requires_review,
    status
  ) VALUES (
    p_skill_id,
    p_user_id,
    p_school_id,
    p_trigger_type,
    p_input_data,
    v_requires_review,
    CASE WHEN v_requires_review THEN 'awaiting_review' ELSE 'pending' END
  )
  RETURNING id INTO v_run_id;

  -- Log the start
  INSERT INTO ed_rpa_audit_log (event_type, skill_id, run_id, school_id, user_id, details)
  VALUES (
    'run_started',
    p_skill_id,
    v_run_id,
    p_school_id,
    p_user_id,
    jsonb_build_object(
      'trigger_type', p_trigger_type,
      'requires_review', v_requires_review
    )
  );

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- Submit a run for approval
CREATE OR REPLACE FUNCTION submit_rpa_for_approval(
  p_run_id UUID,
  p_screenshot TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ed_rpa_runs
  SET
    status = 'awaiting_review',
    before_screenshot = p_screenshot,
    progress = jsonb_build_object(
      'status', 'Awaiting human review',
      'message', 'Please review before submitting'
    )
  WHERE id = p_run_id AND status = 'running';

  INSERT INTO ed_rpa_audit_log (event_type, run_id, details)
  VALUES (
    'awaiting_review',
    p_run_id,
    jsonb_build_object('screenshot_captured', p_screenshot IS NOT NULL)
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Approve and execute a run
CREATE OR REPLACE FUNCTION approve_rpa_run(
  p_run_id UUID,
  p_approver_id UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ed_rpa_runs
  SET
    review_decision = p_decision,
    reviewed_by = p_approver_id,
    reviewed_at = NOW(),
    review_notes = p_notes,
    status = CASE
      WHEN p_decision = 'approved' THEN 'pending'
      WHEN p_decision = 'rejected' THEN 'cancelled'
      WHEN p_decision = 'changes_requested' THEN 'awaiting_review'
    END
  WHERE id = p_run_id AND status = 'awaiting_review';

  -- Log the approval
  INSERT INTO ed_rpa_audit_log (event_type, run_id, user_id, details)
  VALUES (
    p_decision = 'review_' || p_decision,
    p_run_id,
    p_approver_id,
    jsonb_build_object('notes', p_notes)
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_school_rpa_skills TO authenticated;
GRANT EXECUTE ON FUNCTION create_rpa_run TO authenticated;
GRANT EXECUTE ON FUNCTION submit_rpa_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION approve_rpa_run TO authenticated;

-- ============================================================
-- SAMPLE DATA: Pre-configured skills
-- ============================================================

-- RIDDOR Injury Reporting (HSE)
INSERT INTO ed_rpa_skills (skill_key, name, description, category, target_url, target_name, eligible_roles, skill_definition, risk_level, is_public, safety_verified) VALUES
(
  'hse_riddor_injury_auto',
  'HSE RIDDOR Injury - Auto Fill',
  'Automatically fill RIDDOR injury reports from HR data',
  'hse',
  'https://notifications.hse.gov.uk/riddorforms/Injury',
  'HSE RIDDOR Injury Reporting',
  ARRAY['headteacher', 'slt', 'school_business_manager', 'site_manager']::TEXT[],
  '{
    "steps": [
      {"action": "navigate", "url": "https://notifications.hse.gov.uk/riddorforms/Injury"},
      {"action": "fill", "selector": "[name*=\"date\"]", "value": "${incident_date}", "type": "datetime"},
      {"action": "fill", "selector": "[name*=\"incident\"]", "value": "${incident_type}", "type": "select"},
      {"action": "fill", "selector": "[name*=\"person\"]", "value": "${person_name}", "type": "text"},
      {"action": "fill", "selector": "[name*=\"injury\"]", "value": "${injury_details}", "type": "textarea"},
      {"action": "fill", "selector": "[name*=\"location\"]", "value": "${location}", "type": "text"},
      {"action": "wait", "ms": 1000},
      {"action": "pause", "message": "Please review before submitting"}
    ],
    "data_sources": {
      "incident_date": "user_input",
      "incident_type": "user_input",
      "person_name": "user_input",
      "injury_details": "user_input",
      "location": "user_input"
    },
    "safety": {
      "require_review": true,
      "required_role": "school_business_manager",
      "dual_approval": false,
      "confirmation_message": "This is a legal report to the Health and Safety Executive. Please review carefully before submitting."
    }
  }'::jsonb,
  'high',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Bradford LA Sickness Report (example of LA-specific skill)
INSERT INTO ed_rpa_skills (skill_key, name, description, category, eligible_local_authorities, eligible_systems, target_url, target_name, skill_definition, risk_level, is_public, safety_verified) VALUES
(
  'bradford_la_sickness_weekly',
  'Bradford LA - Weekly Sickness Report',
  'Automatically submit weekly sickness absence reports to Bradford Council',
  'hr',
  ARRAY['Bradford']::TEXT[],
  ARRAY['Arbor', 'SIMS', 'Bromcom']::TEXT[],
  'bradford.gov.uk/sickness-reporting',
  'Bradford Council Sickness Reporting',
  '{
    "steps": [
      {"action": "export", "source": "hr_system", "query": "sickness_absences_last_7_days"},
      {"action": "navigate", "url": "https://bradford.gov.uk/sickness-reporting"},
      {"action": "login_check", "message": "Please ensure you are logged into Bradford LA portal"},
      {"action": "loop", "over": "${absences}", "do": [
        {"action": "fill", "selector": "#employeeName", "value": "${.employee_name}"},
        {"action": "fill", "selector": "#jobTitle", "value": "${.role}"},
        {"action": "fill", "selector": "#dateRange", "value": "${.absence_dates}"},
        {"action": "fill", "selector": "#absenceReason", "value": "${.reason}"},
        {"action": "fill", "selector": "#totalDays", "value": "${.days_count}"}
      ]},
      {"action": "pause", "message": "Please review all entries before submitting"},
      {"action": "wait_for_approval"}
    ],
    "data_sources": {
      "absences": "hr_system.sickness_absences_last_7_days"
    },
    "safety": {
      "require_review": true,
      "required_role": "school_business_manager",
      "dual_approval": false,
      "min_reviewers": 1
    }
  }'::jsonb,
  'medium',
  true,
  false  -- Requires verification by Bradford schools before full release
) ON CONFLICT DO NOTHING;
