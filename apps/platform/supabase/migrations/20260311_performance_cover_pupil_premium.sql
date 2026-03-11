-- Layer 9: P2 High-Value Modules — Performance Management, Cover, Pupil Premium
-- Plus Performance Management / Appraisal system

-- ═══════════════════════════════════════════════════════════════════════
-- 1. PERFORMANCE MANAGEMENT / APPRAISAL
-- ═══════════════════════════════════════════════════════════════════════

-- 1a. appraisal_cycles — academic year appraisal periods
CREATE TABLE IF NOT EXISTS appraisal_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  academic_year TEXT NOT NULL,
  cycle_name TEXT NOT NULL DEFAULT 'Annual Appraisal',

  objectives_due_date DATE,
  mid_year_review_date DATE,
  end_year_review_date DATE,
  pay_recommendation_due DATE,

  status TEXT NOT NULL DEFAULT 'objectives' CHECK (status IN (
    'objectives', 'mid_year', 'end_year', 'pay_review', 'completed'
  )),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_appraisal_cycles_org ON appraisal_cycles(organization_id, academic_year);

-- 1b. staff_appraisals — individual staff appraisal records
CREATE TABLE IF NOT EXISTS staff_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES appraisal_cycles(id) ON DELETE CASCADE,

  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  role TEXT,
  pay_scale TEXT,

  appraiser_id UUID,
  appraiser_name TEXT,

  -- Objectives
  objectives JSONB DEFAULT '[]',

  -- Mid-year review
  mid_year_date DATE,
  mid_year_progress TEXT,
  mid_year_evidence TEXT,
  mid_year_reviewer_notes TEXT,

  -- End-year review
  end_year_date DATE,
  end_year_summary TEXT,
  end_year_evidence TEXT,
  end_year_rating TEXT CHECK (end_year_rating IS NULL OR end_year_rating IN (
    'exceptional', 'good', 'requires_improvement', 'inadequate'
  )),

  -- Pay recommendation
  pay_recommendation TEXT CHECK (pay_recommendation IS NULL OR pay_recommendation IN (
    'no_progression', 'standard_progression', 'accelerated_progression',
    'upper_pay_range', 'tlr_recommendation', 'no_change'
  )),
  pay_recommendation_notes TEXT,
  pay_approved BOOLEAN,
  pay_approved_by TEXT,
  pay_approved_at TIMESTAMPTZ,

  -- CPD
  cpd_completed JSONB DEFAULT '[]',
  cpd_planned JSONB DEFAULT '[]',

  -- Lesson observations
  observations JSONB DEFAULT '[]',

  -- NQT/ECT specific
  is_ect BOOLEAN DEFAULT false,
  ect_term INT,
  ect_mentor_name TEXT,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'objectives_set', 'mid_year_complete', 'end_year_complete',
    'pay_recommended', 'completed'
  )),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, cycle_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_appraisals_org ON staff_appraisals(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_appraisals_cycle ON staff_appraisals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_staff_appraisals_staff ON staff_appraisals(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_appraisals_status ON staff_appraisals(status) WHERE status != 'completed';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. COVER MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════

-- 2a. staff_absences — staff absence recording
CREATE TABLE IF NOT EXISTS staff_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  role TEXT,

  absence_type TEXT NOT NULL CHECK (absence_type IN (
    'sickness', 'family_emergency', 'bereavement', 'medical_appointment',
    'training', 'jury_service', 'maternity', 'paternity', 'adoption',
    'authorised_unpaid', 'unauthorised', 'suspension', 'other'
  )),
  start_date DATE NOT NULL,
  end_date DATE,
  half_day BOOLEAN DEFAULT false,

  sick_note_provided BOOLEAN DEFAULT false,
  return_to_work_done BOOLEAN DEFAULT false,
  return_to_work_date DATE,
  return_to_work_notes TEXT,

  bradford_factor_trigger BOOLEAN DEFAULT false,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_absences_org ON staff_absences(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_absences_staff ON staff_absences(organization_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_absences_dates ON staff_absences(organization_id, start_date, end_date);

-- 2b. cover_arrangements — who covers absent staff
CREATE TABLE IF NOT EXISTS cover_arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  absence_id UUID REFERENCES staff_absences(id) ON DELETE SET NULL,

  cover_date DATE NOT NULL,
  period TEXT NOT NULL,
  class_name TEXT,
  year_group TEXT,
  subject TEXT,

  -- Original teacher
  absent_staff_id UUID,
  absent_staff_name TEXT,

  -- Cover
  cover_type TEXT NOT NULL CHECK (cover_type IN (
    'internal_teacher', 'internal_hlta', 'internal_cover_supervisor',
    'supply_teacher', 'split_class', 'cancelled', 'remote_work_set'
  )),
  cover_staff_id UUID,
  cover_staff_name TEXT,

  -- Supply details
  supply_agency TEXT,
  supply_daily_rate NUMERIC(8,2),
  supply_teacher_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'completed', 'cancelled'
  )),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cover_org_date ON cover_arrangements(organization_id, cover_date);
CREATE INDEX IF NOT EXISTS idx_cover_absence ON cover_arrangements(absence_id);
CREATE INDEX IF NOT EXISTS idx_cover_staff ON cover_arrangements(cover_staff_id, cover_date);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. PUPIL PREMIUM STRATEGY
-- ═══════════════════════════════════════════════════════════════════════

-- 3a. pupil_premium_strategies — 3-year strategy documents
CREATE TABLE IF NOT EXISTS pupil_premium_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  academic_year TEXT NOT NULL,
  strategy_year INT NOT NULL DEFAULT 1 CHECK (strategy_year IN (1, 2, 3)),

  -- School context
  total_pupils INT,
  pp_eligible INT,
  pp_funding NUMERIC(12,2),
  service_children INT,
  lac_children INT,
  post_lac_children INT,

  -- Strategy overview
  strategy_summary TEXT,
  challenges TEXT[] DEFAULT '{}',
  intended_outcomes JSONB DEFAULT '[]',

  -- DfE template fields
  publish_date DATE,
  review_date DATE,
  statement_authorised_by TEXT,
  pupil_premium_lead TEXT,
  governor_lead TEXT,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'under_review', 'archived'
  )),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_pp_strategy_org ON pupil_premium_strategies(organization_id, academic_year);

-- 3b. pupil_premium_interventions — spend items linked to strategy
CREATE TABLE IF NOT EXISTS pupil_premium_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES pupil_premium_strategies(id) ON DELETE CASCADE,

  intervention_name TEXT NOT NULL,
  eef_strand TEXT CHECK (eef_strand IS NULL OR eef_strand IN (
    'teaching', 'targeted_academic', 'wider_strategies'
  )),

  description TEXT,
  intended_outcome TEXT,
  success_criteria TEXT,

  -- Spend
  budgeted_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),

  -- Implementation
  staff_lead TEXT,
  target_pupils TEXT,
  year_groups TEXT[] DEFAULT '{}',

  -- EEF toolkit link
  eef_strategy TEXT,
  eef_evidence_strength TEXT CHECK (eef_evidence_strength IS NULL OR eef_evidence_strength IN (
    'very_high', 'high', 'moderate', 'low', 'very_low'
  )),
  eef_months_progress NUMERIC(3,1),

  -- Impact
  impact_assessment TEXT CHECK (impact_assessment IS NULL OR impact_assessment IN (
    'not_yet_measured', 'below_expected', 'expected', 'above_expected', 'significant'
  )),
  impact_evidence TEXT,
  gap_before NUMERIC(5,2),
  gap_after NUMERIC(5,2),

  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pp_interventions_strategy ON pupil_premium_interventions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_pp_interventions_org ON pupil_premium_interventions(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE appraisal_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupil_premium_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupil_premium_interventions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
  pname TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'appraisal_cycles', 'staff_appraisals', 'staff_absences',
    'cover_arrangements', 'pupil_premium_strategies', 'pupil_premium_interventions'
  ] LOOP
    pname := t || '_sel';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pname) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text))', pname, t);
    END IF;
    pname := t || '_ins';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pname) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text))', pname, t);
    END IF;
    pname := t || '_upd';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pname) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text))', pname, t);
    END IF;
  END LOOP;
END $$;
