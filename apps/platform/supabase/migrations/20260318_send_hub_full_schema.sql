-- ============================================================
-- SEND Hub: Full Schema Migration
-- Date: 2026-03-18
-- Purpose: Complete SEND Hub with funding intelligence,
--          EHCP lifecycle, annual reviews, evidence files,
--          provision costing, and LA configuration
-- Depends on: 20260311_safeguarding_attendance_send_behaviour.sql
--             (send_register, send_graduated_approach,
--              send_provision_map, send_referrals)
-- ============================================================

-- ============================================================
-- 1. LA Funding Configuration (multi-LA support)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  la_code text NOT NULL,                             -- e.g., 'E45' (Bradford), 'E33' (Leeds)
  la_name text NOT NULL,                             -- e.g., 'Bradford Metropolitan Council'
  funding_year text NOT NULL,                        -- e.g., '2025-26'
  band_system_type text NOT NULL                     -- 'numeric', 'area_based', 'algorithm', 'other'
    CHECK (band_system_type IN ('numeric', 'area_based', 'algorithm', 'other')),
  payment_schedule text DEFAULT 'termly'             -- 'monthly', 'termly', 'annual'
    CHECK (payment_schedule IN ('monthly', 'termly', 'annual')),
  element_2_amount numeric(10,2) DEFAULT 6000,       -- Notional SEN budget per pupil
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(la_code, funding_year)
);

-- ============================================================
-- 2. LA Funding Bands (band definitions per LA per year)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES sen_funding_configs(id) ON DELETE CASCADE,
  band_id text NOT NULL,                             -- e.g., '3', '4', 'Low', 'High', 'A', 'B'
  band_name text NOT NULL,                           -- e.g., 'Band 3 - Low', 'Band A - Cognition & Learning'
  band_order int,                                    -- For sorting
  value_mainstream numeric(10,2),                    -- £ for mainstream placement
  value_special numeric(10,2),                       -- £ for special school placement
  value_arp numeric(10,2),                           -- £ for Additionally Resourced Provision
  value_post16 numeric(10,2),                        -- £ for post-16 FE
  descriptors text,                                  -- Band definition / support level
  typical_hours text,                                -- e.g., '16-20 hours/week support'
  effective_from date,
  effective_to date,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(config_id, band_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_sen_bands_config ON sen_funding_bands(config_id);
CREATE INDEX IF NOT EXISTS idx_sen_bands_current ON sen_funding_bands(is_current) WHERE is_current = true;

-- ============================================================
-- 3. SEND Funding Allocations (per-pupil funding tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  -- Three Elements of SEN Funding
  element_1_awpu numeric(10,2) DEFAULT 0,            -- Age-Weighted Pupil Unit (reference)
  element_2_notional numeric(10,2) DEFAULT 6000,     -- School's notional SEN contribution
  element_3_topup numeric(10,2) DEFAULT 0,           -- LA top-up funding

  -- LA banding
  la_band text,                                      -- e.g., 'Band 3', 'Band D', 'Exceptional'
  la_band_amount numeric(10,2),                      -- Fund value for this band
  la_band_effective_from date,
  la_band_effective_to date,
  funding_band_id uuid REFERENCES sen_funding_bands(id) ON DELETE SET NULL,

  -- Payment tracking
  payment_frequency text DEFAULT 'termly'
    CHECK (payment_frequency IN ('termly', 'monthly', 'annual')),
  payments_received numeric(10,2) DEFAULT 0,         -- Running total received this year
  payments_expected numeric(10,2),                   -- What should have been received
  last_payment_date date,
  last_payment_amount numeric(10,2),

  -- CFR mapping (DfE Consistent Financial Reporting)
  cfr_income_code text DEFAULT 'I03',                -- SEN funding income
  cfr_expenditure_codes text[] DEFAULT ARRAY['E03'], -- E03 = support staff, E26 = bought services
  cost_centre text DEFAULT 'Pupil Support',

  -- Budget year
  academic_year text NOT NULL,                       -- e.g., '2025-26'
  financial_year text NOT NULL,                      -- May differ for academies

  -- Reconciliation
  reconciliation_status text DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending', 'matched', 'variance', 'disputed')),
  variance_amount numeric(10,2) DEFAULT 0,
  variance_reason text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, pupil_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_org ON sen_funding_allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_pupil ON sen_funding_allocations(pupil_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_band ON sen_funding_allocations(la_band);
CREATE INDEX IF NOT EXISTS idx_sen_funding_recon ON sen_funding_allocations(reconciliation_status)
  WHERE reconciliation_status != 'matched';
CREATE INDEX IF NOT EXISTS idx_sen_funding_year ON sen_funding_allocations(organization_id, academic_year);

-- ============================================================
-- 4. SEND Provision Costs (expenditure tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS send_provision_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,

  -- What the provision is
  provision_type text NOT NULL
    CHECK (provision_type IN ('staff_time', 'resource', 'external_service', 'equipment')),
  provision_description text NOT NULL,               -- e.g., '1:1 TA support - 15 hours/week'

  -- Staff costing (when provision_type = 'staff_time')
  staff_member_name text,                            -- Display name of staff member
  hours_per_week numeric(5,2),
  weeks_per_year numeric(4,1) DEFAULT 38,            -- School weeks
  hourly_rate numeric(8,2),                          -- From payroll
  on_costs_rate numeric(4,2) DEFAULT 0.2868,         -- Employer NI (8.8%) + Pension (20%)

  -- Calculated cost
  annual_cost numeric(10,2) NOT NULL,                -- hours x weeks x rate x (1 + on_costs)
  cfr_code text NOT NULL DEFAULT 'E03',              -- E03, E26, E19, E25, etc.
  cost_centre text DEFAULT 'Pupil Support',

  -- Period
  academic_year text NOT NULL,
  effective_from date,
  effective_to date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_prov_cost_org ON send_provision_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_prov_cost_pupil ON send_provision_costs(pupil_id);
CREATE INDEX IF NOT EXISTS idx_send_prov_cost_year ON send_provision_costs(academic_year);
CREATE INDEX IF NOT EXISTS idx_send_prov_cost_funding ON send_provision_costs(funding_allocation_id);

-- ============================================================
-- 5. EHCP Applications (lifecycle tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_ehcp_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  -- Application timeline (statutory 20-week process)
  request_date date NOT NULL,                        -- When school/parent requested assessment
  requested_by text,                                 -- 'school', 'parent', 'health', 'social_care'
  la_decision_date date,                             -- When LA decided to assess/not
  la_agreed_to_assess boolean,                       -- Did LA agree?
  assessment_start date,                             -- When 20-week clock starts
  draft_ehcp_date date,                              -- When draft EHCP issued (week 16)
  final_ehcp_date date,                              -- When final EHCP issued (week 20)
  placement_named date,                              -- When placement was named

  -- Status
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'decision_pending', 'assessing',
                      'draft_issued', 'consultation', 'final_issued',
                      'refused', 'withdrawn', 'appeal')),

  -- Statutory compliance
  weeks_taken int,                                   -- Calculated: request to final
  statutory_deadline_met boolean,                    -- Was 20-week deadline met?

  -- Evidence quality
  evidence_score numeric(3,1),                       -- 0-100 AI-scored evidence strength
  ai_analysis_date timestamptz,
  ai_analysis_summary text,

  -- Band recommendation
  recommended_band text,                             -- From Ed AI analysis
  actual_band text,                                  -- What LA actually awarded

  -- Timeline status
  timeline_status text DEFAULT 'on_track'
    CHECK (timeline_status IN ('on_track', 'at_risk', 'overdue')),

  -- Refusal / appeal
  refusal_reason text,
  appeal_submitted_date date,
  appeal_outcome text,

  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_ehcp_org ON sen_ehcp_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_sen_ehcp_pupil ON sen_ehcp_applications(send_register_id);
CREATE INDEX IF NOT EXISTS idx_sen_ehcp_status ON sen_ehcp_applications(status)
  WHERE status NOT IN ('final_issued', 'refused', 'withdrawn');
CREATE INDEX IF NOT EXISTS idx_sen_ehcp_timeline ON sen_ehcp_applications(timeline_status)
  WHERE timeline_status IN ('at_risk', 'overdue');

-- ============================================================
-- 6. Annual Reviews (EHCP annual review cycle)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_annual_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  -- Due dates
  review_year text NOT NULL,                         -- e.g., '2025-26'
  due_date date NOT NULL,                            -- When review must be held
  review_held_date date,                             -- When meeting actually took place

  -- Attendees
  attendees text[],                                  -- Names/roles of attendees
  parent_attended boolean,
  pupil_attended boolean,
  la_representative text,

  -- Submission
  submitted_to_la_date date,                         -- When paperwork sent to LA
  la_response_date date,                             -- When LA responded

  -- LA Decision
  outcome text
    CHECK (outcome IN ('maintain', 'amend', 'cease', 'pending')),
  outcome_notes text,

  -- Band change
  band_change_requested boolean DEFAULT false,
  previous_band text,
  requested_band text,
  approved_band text,

  -- Statutory tracking
  school_report_on_time boolean,                     -- Within LA deadline
  la_response_on_time boolean,                       -- Within 4 weeks
  la_response_notes text,

  -- Status
  status text DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'invitations_sent', 'paperwork_gathering',
                      'review_held', 'submitted_to_la', 'la_responded', 'completed')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, send_register_id, review_year)
);

CREATE INDEX IF NOT EXISTS idx_sen_review_org ON sen_annual_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_sen_review_pupil ON sen_annual_reviews(send_register_id);
CREATE INDEX IF NOT EXISTS idx_sen_review_due ON sen_annual_reviews(due_date)
  WHERE status NOT IN ('completed');
CREATE INDEX IF NOT EXISTS idx_sen_review_status ON sen_annual_reviews(status)
  WHERE status != 'completed';

-- ============================================================
-- 7. SEND Evidence Files (document storage & AI extraction)
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  -- File details
  file_name text NOT NULL,
  file_type text NOT NULL
    CHECK (file_type IN ('ep_report', 'salt_report', 'ot_report', 'physio_report',
                         'medical', 'camhs_report', 'paediatric_report',
                         'school_report', 'parent_statement', 'pupil_views',
                         'annual_review_report', 'ehcp_draft', 'ehcp_final',
                         'provision_map', 'photo', 'video', 'other')),
  file_path text NOT NULL,                           -- Supabase Storage path
  file_size_bytes bigint,
  mime_type text,

  -- Upload metadata
  uploaded_by_name text,
  uploaded_at timestamptz DEFAULT now(),

  -- Professional metadata
  professional_name text,                            -- Who wrote/provided the report
  professional_role text,                            -- EP, SaLT, Paediatrician, etc.
  report_date date,                                  -- Date of the assessment/report

  -- Linking to EHCP / review processes
  linked_review_id uuid REFERENCES sen_annual_reviews(id) ON DELETE SET NULL,
  linked_application_id uuid REFERENCES sen_ehcp_applications(id) ON DELETE SET NULL,
  linked_referral_id uuid REFERENCES send_referrals(id) ON DELETE SET NULL,

  -- AI Processing
  ai_extracted_text text,                            -- Full text extracted from PDF
  ai_summary text,                                   -- AI-generated summary
  ai_recommendations text[],                         -- Key recommendations extracted
  ai_extraction_date timestamptz,

  -- Access control
  access_level text DEFAULT 'senco'
    CHECK (access_level IN ('senco', 'headteacher', 'slt', 'all_staff', 'restricted')),

  -- Versioning & tagging
  tags text[],
  is_current boolean DEFAULT true,
  superseded_by uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_evidence_org ON sen_evidence_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_sen_evidence_pupil ON sen_evidence_files(send_register_id);
CREATE INDEX IF NOT EXISTS idx_sen_evidence_type ON sen_evidence_files(file_type);
CREATE INDEX IF NOT EXISTS idx_sen_evidence_access ON sen_evidence_files(access_level);
CREATE INDEX IF NOT EXISTS idx_sen_evidence_current ON sen_evidence_files(is_current) WHERE is_current = true;

-- ============================================================
-- 8. SEND Review History (audit trail for all changes)
-- ============================================================
CREATE TABLE IF NOT EXISTS send_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  -- What changed
  change_type text NOT NULL
    CHECK (change_type IN ('status_change', 'band_change', 'provision_change',
                           'funding_update', 'review_completed', 'referral_update',
                           'ehcp_milestone', 'note_added', 'evidence_uploaded',
                           'register_added', 'register_removed')),
  change_description text NOT NULL,

  -- Before/after
  field_changed text,
  old_value text,
  new_value text,

  -- Who made the change
  changed_by_name text,
  changed_at timestamptz DEFAULT now(),

  -- Optional links
  linked_entity_type text,                           -- 'funding', 'review', 'ehcp', 'referral', 'provision'
  linked_entity_id uuid,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_history_org ON send_review_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_history_pupil ON send_review_history(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_history_type ON send_review_history(change_type);
CREATE INDEX IF NOT EXISTS idx_send_history_date ON send_review_history(changed_at);

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sen_funding_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_provision_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_ehcp_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_annual_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_review_history ENABLE ROW LEVEL SECURITY;

-- Funding configs: readable by all authenticated (reference data)
CREATE POLICY "sen_funding_configs_select" ON sen_funding_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sen_funding_configs_insert" ON sen_funding_configs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sen_funding_configs_update" ON sen_funding_configs
  FOR UPDATE TO authenticated USING (true);

-- Funding bands: readable by all authenticated (reference data)
CREATE POLICY "sen_funding_bands_select" ON sen_funding_bands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sen_funding_bands_insert" ON sen_funding_bands
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sen_funding_bands_update" ON sen_funding_bands
  FOR UPDATE TO authenticated USING (true);

-- Funding allocations: org-scoped
CREATE POLICY "sen_funding_allocations_select" ON sen_funding_allocations
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_funding_allocations_insert" ON sen_funding_allocations
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_funding_allocations_update" ON sen_funding_allocations
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Provision costs: org-scoped
CREATE POLICY "send_provision_costs_select" ON send_provision_costs
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_provision_costs_insert" ON send_provision_costs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_provision_costs_update" ON send_provision_costs
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- EHCP applications: org-scoped
CREATE POLICY "sen_ehcp_applications_select" ON sen_ehcp_applications
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_ehcp_applications_insert" ON sen_ehcp_applications
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_ehcp_applications_update" ON sen_ehcp_applications
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Annual reviews: org-scoped
CREATE POLICY "sen_annual_reviews_select" ON sen_annual_reviews
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_annual_reviews_insert" ON sen_annual_reviews
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_annual_reviews_update" ON sen_annual_reviews
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Evidence files: org-scoped
CREATE POLICY "sen_evidence_files_select" ON sen_evidence_files
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_evidence_files_insert" ON sen_evidence_files
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_evidence_files_update" ON sen_evidence_files
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "sen_evidence_files_delete" ON sen_evidence_files
  FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Review history: org-scoped (read-only for most, insert for system)
CREATE POLICY "send_review_history_select" ON send_review_history
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_review_history_insert" ON send_review_history
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ============================================================
-- 10. VIEW: SEND Budget Position (for Finance Dashboard)
-- ============================================================
CREATE OR REPLACE VIEW send_budget_position AS
SELECT
  sfa.organization_id,
  sfa.academic_year,
  COUNT(DISTINCT sfa.pupil_id) AS total_ehcp_pupils,
  SUM(sfa.element_3_topup) AS total_topup_expected,
  SUM(sfa.payments_received) AS total_topup_received,
  SUM(sfa.element_3_topup) - SUM(sfa.payments_received) AS topup_outstanding,
  SUM(sfa.element_2_notional) AS total_notional_commitment,
  COALESCE(costs.total_provision_cost, 0) AS total_provision_expenditure,
  SUM(sfa.element_2_notional) + SUM(sfa.element_3_topup) - COALESCE(costs.total_provision_cost, 0) AS net_send_position,
  SUM(CASE WHEN sfa.reconciliation_status = 'variance' THEN 1 ELSE 0 END)::int AS variance_count,
  SUM(sfa.variance_amount) AS total_variance
FROM sen_funding_allocations sfa
LEFT JOIN (
  SELECT organization_id, academic_year, SUM(annual_cost) AS total_provision_cost
  FROM send_provision_costs
  GROUP BY organization_id, academic_year
) costs ON costs.organization_id = sfa.organization_id
       AND costs.academic_year = sfa.academic_year
GROUP BY sfa.organization_id, sfa.academic_year;

-- ============================================================
-- 11. VIEW: EHCP Timeline Dashboard
-- ============================================================
CREATE OR REPLACE VIEW sen_ehcp_timeline_dashboard AS
SELECT
  ea.organization_id,
  ea.id AS application_id,
  sr.pupil_name_encrypted,
  sr.year_group,
  sr.primary_need,
  ea.status,
  ea.request_date,
  ea.la_decision_date,
  ea.assessment_start,
  ea.draft_ehcp_date,
  ea.final_ehcp_date,
  ea.timeline_status,
  ea.evidence_score,
  ea.recommended_band,
  ea.actual_band,
  -- Calculate weeks elapsed
  CASE
    WHEN ea.final_ehcp_date IS NOT NULL THEN
      EXTRACT(DAY FROM (ea.final_ehcp_date - ea.request_date))::int / 7
    ELSE
      EXTRACT(DAY FROM (now() - ea.request_date))::int / 7
  END AS weeks_elapsed,
  -- Deadline
  ea.request_date + INTERVAL '20 weeks' AS statutory_deadline,
  -- Overdue flag
  CASE
    WHEN ea.final_ehcp_date IS NULL
     AND now() > ea.request_date + INTERVAL '20 weeks'
    THEN true
    ELSE false
  END AS is_overdue
FROM sen_ehcp_applications ea
JOIN send_register sr ON sr.id = ea.send_register_id;

-- ============================================================
-- 12. VIEW: Annual Review Calendar
-- ============================================================
CREATE OR REPLACE VIEW sen_review_calendar AS
SELECT
  ar.organization_id,
  ar.id AS review_id,
  sr.pupil_name_encrypted,
  sr.year_group,
  sr.primary_need,
  sr.ehcp_funding_band,
  ar.review_year,
  ar.due_date,
  ar.review_held_date,
  ar.status,
  ar.outcome,
  ar.band_change_requested,
  ar.previous_band,
  ar.approved_band,
  -- Days until due
  CASE
    WHEN ar.review_held_date IS NOT NULL THEN NULL
    ELSE (ar.due_date - CURRENT_DATE)
  END AS days_until_due,
  -- Urgency
  CASE
    WHEN ar.review_held_date IS NOT NULL THEN 'completed'
    WHEN CURRENT_DATE > ar.due_date THEN 'overdue'
    WHEN CURRENT_DATE > ar.due_date - INTERVAL '14 days' THEN 'urgent'
    WHEN CURRENT_DATE > ar.due_date - INTERVAL '30 days' THEN 'upcoming'
    ELSE 'scheduled'
  END AS urgency
FROM sen_annual_reviews ar
JOIN send_register sr ON sr.id = ar.send_register_id;

-- ============================================================
-- 13. Updated timestamp triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_send_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'sen_funding_configs',
      'sen_funding_allocations',
      'send_provision_costs',
      'sen_ehcp_applications',
      'sen_annual_reviews',
      'sen_evidence_files'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW
       EXECUTE FUNCTION update_send_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Done. 8 new tables, 3 views, RLS policies, indexes, triggers.
-- Existing tables (send_register, send_graduated_approach,
-- send_provision_map, send_referrals) are untouched.
-- ============================================================
