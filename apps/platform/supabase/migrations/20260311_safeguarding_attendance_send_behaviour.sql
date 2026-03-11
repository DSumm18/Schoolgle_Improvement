-- Layer 8: P1 Critical Modules — Safeguarding, Attendance, SEND, Behaviour, Calendar
-- KCSIE 2025 compliant, Ofsted-ready

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SAFEGUARDING / CONCERN LOGGING (CPOMS alternative)
-- ═══════════════════════════════════════════════════════════════════════

-- 1a. safeguarding_concerns — core concern records
CREATE TABLE IF NOT EXISTS safeguarding_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Pupil (pseudonymised reference)
  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,

  -- Concern details
  concern_date DATE NOT NULL,
  concern_time TIME,
  reported_by UUID NOT NULL,
  reported_by_name TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  category TEXT NOT NULL CHECK (category IN (
    'physical_abuse', 'emotional_abuse', 'sexual_abuse', 'neglect',
    'child_sexual_exploitation', 'child_criminal_exploitation',
    'radicalisation', 'fgm', 'forced_marriage', 'honour_based',
    'peer_on_peer', 'online_safety', 'mental_health', 'self_harm',
    'domestic_abuse', 'substance_misuse', 'missing_education',
    'private_fostering', 'contextual_safeguarding', 'other'
  )),
  severity TEXT NOT NULL DEFAULT 'amber' CHECK (severity IN (
    'red', 'amber', 'green'
  )),

  description TEXT NOT NULL,
  body_map_data JSONB,

  -- Triage
  triaged_by UUID,
  triaged_by_name TEXT,
  triaged_at TIMESTAMPTZ,
  triage_outcome TEXT CHECK (triage_outcome IS NULL OR triage_outcome IN (
    'monitor', 'early_help', 'referral_cscs', 'referral_police',
    'referral_lado', 'referral_mash', 'internal_support',
    'no_further_action', 'escalate_dsl'
  )),
  triage_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'triaged', 'referred', 'monitoring', 'closed', 'reopened'
  )),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  closed_reason TEXT,

  -- Links
  linked_pupil_concerns UUID[] DEFAULT '{}',
  linked_scr_entry_id UUID,
  linked_low_level_concern_id UUID,

  -- Anonymous reporting
  is_anonymous BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_org ON safeguarding_concerns(organization_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_pupil ON safeguarding_concerns(organization_id, pupil_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_status ON safeguarding_concerns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_severity ON safeguarding_concerns(severity) WHERE severity = 'red';
CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_category ON safeguarding_concerns(category);

-- 1b. safeguarding_chronology — append-only timeline
CREATE TABLE IF NOT EXISTS safeguarding_chronology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  concern_id UUID NOT NULL REFERENCES safeguarding_concerns(id) ON DELETE CASCADE,

  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'concern_raised', 'triage', 'note', 'phone_call', 'meeting',
    'referral_made', 'referral_outcome', 'home_visit', 'agency_contact',
    'review', 'status_change', 'escalation', 'closure'
  )),
  summary TEXT NOT NULL,
  details TEXT,
  recorded_by UUID NOT NULL,
  recorded_by_name TEXT NOT NULL,

  -- External agency
  agency_name TEXT,
  agency_reference TEXT,

  -- Attachments
  attachments JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safeguarding_chron_concern ON safeguarding_chronology(concern_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_safeguarding_chron_org ON safeguarding_chronology(organization_id);

-- 1c. safeguarding_referrals — multi-agency referral tracking
CREATE TABLE IF NOT EXISTS safeguarding_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  concern_id UUID NOT NULL REFERENCES safeguarding_concerns(id) ON DELETE CASCADE,

  referral_type TEXT NOT NULL CHECK (referral_type IN (
    'cscs', 'police', 'lado', 'mash', 'early_help', 'camhs',
    'school_nurse', 'gp', 'health_visitor', 'other'
  )),
  agency_name TEXT NOT NULL,
  agency_contact TEXT,
  agency_reference TEXT,

  referred_by UUID NOT NULL,
  referred_by_name TEXT NOT NULL,
  referred_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  outcome TEXT CHECK (outcome IS NULL OR outcome IN (
    'accepted', 'declined', 'awaiting', 'assessment_started',
    'section_17', 'section_47', 'no_further_action', 'stepped_down'
  )),
  outcome_date DATE,
  outcome_notes TEXT,

  follow_up_date DATE,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safeguarding_referrals_concern ON safeguarding_referrals(concern_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_referrals_org ON safeguarding_referrals(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. ATTENDANCE MODULE
-- ═══════════════════════════════════════════════════════════════════════

-- 2a. attendance_registers — AM/PM marks
CREATE TABLE IF NOT EXISTS attendance_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,
  class_name TEXT,

  register_date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('AM', 'PM')),

  mark TEXT NOT NULL CHECK (mark IN (
    '/', '\\', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'L', 'M',
    'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
  )),

  recorded_by UUID,
  recorded_by_name TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),

  notes TEXT,
  minutes_late INT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, pupil_id, register_date, session)
);

CREATE INDEX IF NOT EXISTS idx_attendance_reg_org_date ON attendance_registers(organization_id, register_date);
CREATE INDEX IF NOT EXISTS idx_attendance_reg_pupil ON attendance_registers(organization_id, pupil_id, register_date);
CREATE INDEX IF NOT EXISTS idx_attendance_reg_mark ON attendance_registers(mark) WHERE mark NOT IN ('/', '\\');

-- 2b. attendance_summaries — rolled-up per pupil per term
CREATE TABLE IF NOT EXISTS attendance_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  year_group TEXT,
  academic_year TEXT NOT NULL,
  term TEXT CHECK (term IS NULL OR term IN ('autumn', 'spring', 'summer', 'full_year')),

  possible_sessions INT DEFAULT 0,
  attended_sessions INT DEFAULT 0,
  authorised_absences INT DEFAULT 0,
  unauthorised_absences INT DEFAULT 0,
  late_sessions INT DEFAULT 0,

  attendance_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN possible_sessions > 0
      THEN ROUND((attended_sessions::NUMERIC / possible_sessions) * 100, 2)
      ELSE 0
    END
  ) STORED,

  is_persistent_absent BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN possible_sessions > 0
      THEN (attended_sessions::NUMERIC / possible_sessions) < 0.90
      ELSE false
    END
  ) STORED,

  is_severe_absent BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN possible_sessions > 0
      THEN (attended_sessions::NUMERIC / possible_sessions) < 0.50
      ELSE false
    END
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, pupil_id, academic_year, term)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sum_org ON attendance_summaries(organization_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_sum_pa ON attendance_summaries(is_persistent_absent) WHERE is_persistent_absent = true;
CREATE INDEX IF NOT EXISTS idx_attendance_sum_severe ON attendance_summaries(is_severe_absent) WHERE is_severe_absent = true;

-- 2c. attendance_interventions — auto-triggered actions
CREATE TABLE IF NOT EXISTS attendance_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,

  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'threshold_95', 'threshold_92', 'threshold_90', 'threshold_85',
    'persistent_absent', 'severe_absent', 'cme', 'pattern_detected',
    'manual'
  )),
  trigger_percent NUMERIC(5,2),

  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'letter_first', 'letter_second', 'letter_final',
    'parent_meeting', 'attendance_contract', 'ewo_referral',
    'cme_referral', 'home_visit', 'reward_programme',
    'mentor_assigned', 'other'
  )),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'escalated', 'closed'
  )),

  assigned_to UUID,
  assigned_to_name TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  outcome TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_int_org ON attendance_interventions(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_int_pupil ON attendance_interventions(organization_id, pupil_id);
CREATE INDEX IF NOT EXISTS idx_attendance_int_status ON attendance_interventions(status) WHERE status IN ('pending', 'in_progress');

-- ═══════════════════════════════════════════════════════════════════════
-- 3. SEND MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════

-- 3a. send_register — SEN register
CREATE TABLE IF NOT EXISTS send_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,
  class_name TEXT,

  sen_status TEXT NOT NULL CHECK (sen_status IN (
    'K', 'E', 'monitoring', 'removed'
  )),
  primary_need TEXT NOT NULL CHECK (primary_need IN (
    'SPLD', 'MLD', 'SLD', 'PMLD', 'SEMH', 'SLCN', 'HI', 'VI',
    'MSI', 'PD', 'ASD', 'OTH', 'NSA'
  )),
  secondary_need TEXT CHECK (secondary_need IS NULL OR secondary_need IN (
    'SPLD', 'MLD', 'SLD', 'PMLD', 'SEMH', 'SLCN', 'HI', 'VI',
    'MSI', 'PD', 'ASD', 'OTH', 'NSA'
  )),

  date_identified DATE NOT NULL,
  date_placed_on_register DATE,
  date_removed DATE,
  removal_reason TEXT,

  -- EHCP details
  has_ehcp BOOLEAN DEFAULT false,
  ehcp_start_date DATE,
  ehcp_annual_review_due DATE,
  ehcp_funding_band TEXT,
  ehcp_funded_hours NUMERIC(4,1),

  -- Key contacts
  senco_notes TEXT,
  parent_views TEXT,
  pupil_views TEXT,
  external_agencies TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, pupil_id)
);

CREATE INDEX IF NOT EXISTS idx_send_register_org ON send_register(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_register_status ON send_register(organization_id, sen_status);
CREATE INDEX IF NOT EXISTS idx_send_register_need ON send_register(primary_need);
CREATE INDEX IF NOT EXISTS idx_send_register_ehcp ON send_register(has_ehcp) WHERE has_ehcp = true;

-- 3b. send_graduated_approach — assess-plan-do-review cycles
CREATE TABLE IF NOT EXISTS send_graduated_approach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id UUID NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  cycle_number INT NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('autumn', 'spring', 'summer')),

  -- Assess
  assess_date DATE,
  assess_summary TEXT,
  assess_attainment TEXT,
  assess_progress TEXT,
  assess_barriers TEXT[] DEFAULT '{}',

  -- Plan
  plan_date DATE,
  plan_targets TEXT[] DEFAULT '{}',
  plan_strategies TEXT[] DEFAULT '{}',
  plan_resources TEXT[] DEFAULT '{}',
  plan_staff_involved TEXT[] DEFAULT '{}',
  plan_review_date DATE,

  -- Do
  do_notes TEXT,
  do_adjustments TEXT,

  -- Review
  review_date DATE,
  review_outcome TEXT CHECK (review_outcome IS NULL OR review_outcome IN (
    'targets_met', 'partial_progress', 'no_progress', 'regression'
  )),
  review_next_steps TEXT,
  review_change_provision BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'assess' CHECK (status IN (
    'assess', 'plan', 'do', 'review', 'completed'
  )),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_send_ga_register ON send_graduated_approach(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_ga_org ON send_graduated_approach(organization_id, academic_year);

-- 3c. send_provision_map — interventions × pupils × cost
CREATE TABLE IF NOT EXISTS send_provision_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  send_register_id UUID REFERENCES send_register(id) ON DELETE SET NULL,

  provision_name TEXT NOT NULL,
  provision_type TEXT NOT NULL CHECK (provision_type IN (
    'in_class_support', 'withdrawal_group', 'one_to_one',
    'specialist_teaching', 'therapy', 'equipment',
    'environmental_adaptation', 'other'
  )),

  frequency TEXT,
  duration_minutes INT,
  delivered_by TEXT,

  start_date DATE NOT NULL,
  end_date DATE,

  weekly_cost NUMERIC(8,2),
  annual_cost NUMERIC(10,2),
  funded_by TEXT CHECK (funded_by IS NULL OR funded_by IN (
    'school_budget', 'ehcp_funding', 'pupil_premium', 'catch_up',
    'la_top_up', 'external_grant', 'other'
  )),

  impact_measure TEXT,
  impact_outcome TEXT,

  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_send_provision_org ON send_provision_map(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_provision_pupil ON send_provision_map(organization_id, pupil_id);
CREATE INDEX IF NOT EXISTS idx_send_provision_active ON send_provision_map(active) WHERE active = true;

-- 3d. send_referrals — external agency referral tracking
CREATE TABLE IF NOT EXISTS send_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id UUID NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  referral_type TEXT NOT NULL CHECK (referral_type IN (
    'educational_psychologist', 'speech_language', 'occupational_therapy',
    'physiotherapy', 'camhs', 'paediatrician', 'school_nurse',
    'sensory_service', 'behaviour_support', 'ehcp_assessment', 'other'
  )),
  agency_name TEXT,

  referred_by UUID,
  referred_by_name TEXT,
  referred_at DATE NOT NULL,

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'draft', 'submitted', 'accepted', 'waiting_list', 'assessment',
    'report_received', 'declined', 'discharged', 'cancelled'
  )),

  expected_wait_weeks INT,
  appointment_date DATE,
  report_received_date DATE,
  report_summary TEXT,
  recommendations TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_send_referrals_register ON send_referrals(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_referrals_org ON send_referrals(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_referrals_status ON send_referrals(status) WHERE status IN ('submitted', 'waiting_list', 'assessment');

-- ═══════════════════════════════════════════════════════════════════════
-- 4. BEHAVIOUR & SANCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- 4a. behaviour_incidents — positive and negative
CREATE TABLE IF NOT EXISTS behaviour_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,

  incident_date DATE NOT NULL,
  incident_time TIME,
  location TEXT,
  lesson_period TEXT,

  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'positive', 'negative'
  )),

  -- Negative categories
  category TEXT CHECK (category IS NULL OR category IN (
    'disruption', 'defiance', 'verbal_abuse', 'physical_aggression',
    'bullying', 'cyberbullying', 'racist', 'homophobic', 'sexual',
    'substance', 'theft', 'damage', 'truancy', 'uniform',
    'mobile_phone', 'other_negative'
  )),

  -- Positive categories
  positive_category TEXT CHECK (positive_category IS NULL OR positive_category IN (
    'achievement', 'effort', 'kindness', 'leadership', 'improvement',
    'community', 'homework', 'attendance', 'other_positive'
  )),

  description TEXT NOT NULL,

  -- Staff involved
  recorded_by UUID NOT NULL,
  recorded_by_name TEXT NOT NULL,
  staff_involved TEXT[] DEFAULT '{}',

  -- Other pupils
  other_pupils_involved JSONB DEFAULT '[]',
  witnesses TEXT[] DEFAULT '{}',

  -- Outcome
  consequence TEXT CHECK (consequence IS NULL OR consequence IN (
    'verbal_warning', 'written_warning', 'loss_of_privilege',
    'detention_break', 'detention_lunch', 'detention_after_school',
    'community_service', 'internal_exclusion', 'fixed_term_exclusion',
    'permanent_exclusion', 'managed_move', 'alternative_provision',
    'restorative_justice', 'parent_contact', 'reward_points',
    'certificate', 'prize', 'house_points', 'none'
  )),
  consequence_details TEXT,

  -- Links
  linked_safeguarding_id UUID REFERENCES safeguarding_concerns(id),

  -- Parent notification
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  parent_response TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_behaviour_org ON behaviour_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_pupil ON behaviour_incidents(organization_id, pupil_id, incident_date);
CREATE INDEX IF NOT EXISTS idx_behaviour_type ON behaviour_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_behaviour_category ON behaviour_incidents(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behaviour_date ON behaviour_incidents(organization_id, incident_date DESC);

-- 4b. exclusions — FTE/PEX tracking with DfE return fields
-- Note: DfE data already has a VIEW called "exclusions", so we use behaviour_exclusions
CREATE TABLE IF NOT EXISTS behaviour_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  behaviour_incident_id UUID REFERENCES behaviour_incidents(id) ON DELETE SET NULL,

  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,

  exclusion_type TEXT NOT NULL CHECK (exclusion_type IN (
    'fixed_term', 'permanent', 'lunch_time'
  )),

  start_date DATE NOT NULL,
  end_date DATE,
  days NUMERIC(4,1) NOT NULL,

  reason TEXT NOT NULL CHECK (reason IN (
    'physical_assault_pupil', 'physical_assault_adult',
    'verbal_abuse_pupil', 'verbal_abuse_adult',
    'bullying', 'racist_abuse', 'sexual_misconduct',
    'drug_alcohol', 'damage', 'theft',
    'persistent_disruptive', 'other'
  )),

  -- DfE return fields
  is_sen BOOLEAN DEFAULT false,
  is_fsm BOOLEAN DEFAULT false,
  is_lac BOOLEAN DEFAULT false,
  ethnicity_code TEXT,

  -- Process
  headteacher_decision_date DATE,
  parent_notified_date DATE,
  governor_review_required BOOLEAN DEFAULT false,
  governor_review_date DATE,
  governor_decision TEXT CHECK (governor_decision IS NULL OR governor_decision IN (
    'upheld', 'overturned', 'not_reviewed'
  )),

  -- Reinstatement
  reintegration_meeting_date DATE,
  reintegration_plan TEXT,

  -- Managed move / AP
  managed_move_offered BOOLEAN DEFAULT false,
  alternative_provision TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exclusions_org ON exclusions(organization_id);
CREATE INDEX IF NOT EXISTS idx_exclusions_pupil ON exclusions(organization_id, pupil_id);
CREATE INDEX IF NOT EXISTS idx_exclusions_type ON exclusions(exclusion_type);
CREATE INDEX IF NOT EXISTS idx_exclusions_date ON exclusions(organization_id, start_date DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. ACADEMIC CALENDAR & EVENTS
-- ═══════════════════════════════════════════════════════════════════════

-- 5a. academic_terms — term dates
CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  academic_year TEXT NOT NULL,
  term_name TEXT NOT NULL CHECK (term_name IN (
    'autumn_1', 'autumn_2', 'spring_1', 'spring_2', 'summer_1', 'summer_2'
  )),

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  school_days INT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, academic_year, term_name)
);

CREATE INDEX IF NOT EXISTS idx_academic_terms_org ON academic_terms(organization_id, academic_year);

-- 5b. school_events — all school events
CREATE TABLE IF NOT EXISTS school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'inset_day', 'parents_evening', 'open_day', 'school_trip',
    'sports_day', 'concert', 'assembly', 'exam', 'assessment_week',
    'inspection', 'governor_meeting', 'staff_meeting',
    'celebration', 'fundraiser', 'closure', 'other'
  )),

  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,

  location TEXT,
  year_groups TEXT[] DEFAULT '{}',

  -- Trip-specific
  risk_assessment_id UUID,
  trip_cost NUMERIC(8,2),
  trip_destination TEXT,

  -- Parents evening
  slot_duration_minutes INT,
  booking_open_date DATE,
  booking_close_date DATE,

  -- Visibility
  visible_to TEXT[] DEFAULT ARRAY['staff', 'parents', 'governors'],

  recurring_pattern TEXT CHECK (recurring_pattern IS NULL OR recurring_pattern IN (
    'weekly', 'fortnightly', 'monthly', 'termly', 'annually'
  )),

  created_by UUID,
  created_by_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_events_org ON school_events(organization_id, start_date);
CREATE INDEX IF NOT EXISTS idx_school_events_type ON school_events(event_type);
CREATE INDEX IF NOT EXISTS idx_school_events_date_range ON school_events(organization_id, start_date, end_date);

-- 5c. parents_evening_slots — slot-based booking
CREATE TABLE IF NOT EXISTS parents_evening_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,

  teacher_id UUID,
  teacher_name TEXT NOT NULL,

  slot_time TIME NOT NULL,
  slot_date DATE NOT NULL,
  duration_minutes INT DEFAULT 10,

  -- Booking
  booked_by_pupil_id TEXT,
  booked_by_parent_name TEXT,
  booked_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'booked', 'completed', 'cancelled', 'no_show'
  )),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pe_slots_event ON parents_evening_slots(event_id);
CREATE INDEX IF NOT EXISTS idx_pe_slots_teacher ON parents_evening_slots(teacher_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_pe_slots_available ON parents_evening_slots(status) WHERE status = 'available';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE safeguarding_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_chronology ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_graduated_approach ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_provision_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents_evening_slots ENABLE ROW LEVEL SECURITY;

-- Helper macro for org-member check
-- Safeguarding: restricted to DSL/SLT/admin roles
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_concerns_select') THEN
  CREATE POLICY safeguarding_concerns_select ON safeguarding_concerns FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt', 'dsl', 'safeguarding_lead')
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_concerns_insert') THEN
  CREATE POLICY safeguarding_concerns_insert ON safeguarding_concerns FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_concerns_update') THEN
  CREATE POLICY safeguarding_concerns_update ON safeguarding_concerns FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt', 'dsl', 'safeguarding_lead')
    ));
END IF;
END $$;

-- Safeguarding chronology
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_chron_select') THEN
  CREATE POLICY safeguarding_chron_select ON safeguarding_chronology FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt', 'dsl', 'safeguarding_lead')
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_chron_insert') THEN
  CREATE POLICY safeguarding_chron_insert ON safeguarding_chronology FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Safeguarding referrals
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_ref_select') THEN
  CREATE POLICY safeguarding_ref_select ON safeguarding_referrals FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt', 'dsl', 'safeguarding_lead')
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_ref_insert') THEN
  CREATE POLICY safeguarding_ref_insert ON safeguarding_referrals FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_ref_update') THEN
  CREATE POLICY safeguarding_ref_update ON safeguarding_referrals FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt', 'dsl', 'safeguarding_lead')
    ));
END IF;
END $$;

-- Attendance: all staff can view and record
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_reg_select') THEN
  CREATE POLICY attendance_reg_select ON attendance_registers FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_reg_insert') THEN
  CREATE POLICY attendance_reg_insert ON attendance_registers FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_reg_update') THEN
  CREATE POLICY attendance_reg_update ON attendance_registers FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Attendance summaries
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_sum_select') THEN
  CREATE POLICY attendance_sum_select ON attendance_summaries FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_sum_insert') THEN
  CREATE POLICY attendance_sum_insert ON attendance_summaries FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_sum_update') THEN
  CREATE POLICY attendance_sum_update ON attendance_summaries FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Attendance interventions
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_int_select') THEN
  CREATE POLICY attendance_int_select ON attendance_interventions FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_int_insert') THEN
  CREATE POLICY attendance_int_insert ON attendance_interventions FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attendance_int_update') THEN
  CREATE POLICY attendance_int_update ON attendance_interventions FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- SEND register: SENCO + SLT + admin
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_register_select') THEN
  CREATE POLICY send_register_select ON send_register FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_register_insert') THEN
  CREATE POLICY send_register_insert ON send_register FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_register_update') THEN
  CREATE POLICY send_register_update ON send_register FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- SEND graduated approach
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ga_select') THEN
  CREATE POLICY send_ga_select ON send_graduated_approach FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ga_insert') THEN
  CREATE POLICY send_ga_insert ON send_graduated_approach FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ga_update') THEN
  CREATE POLICY send_ga_update ON send_graduated_approach FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- SEND provision map
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_prov_select') THEN
  CREATE POLICY send_prov_select ON send_provision_map FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_prov_insert') THEN
  CREATE POLICY send_prov_insert ON send_provision_map FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_prov_update') THEN
  CREATE POLICY send_prov_update ON send_provision_map FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- SEND referrals
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ref_select') THEN
  CREATE POLICY send_ref_select ON send_referrals FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ref_insert') THEN
  CREATE POLICY send_ref_insert ON send_referrals FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'send_ref_update') THEN
  CREATE POLICY send_ref_update ON send_referrals FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Behaviour: all staff can view and record
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'behaviour_select') THEN
  CREATE POLICY behaviour_select ON behaviour_incidents FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'behaviour_insert') THEN
  CREATE POLICY behaviour_insert ON behaviour_incidents FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'behaviour_update') THEN
  CREATE POLICY behaviour_update ON behaviour_incidents FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Exclusions: SLT + admin only for modifications
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exclusions_select') THEN
  CREATE POLICY exclusions_select ON exclusions FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exclusions_insert') THEN
  CREATE POLICY exclusions_insert ON exclusions FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exclusions_update') THEN
  CREATE POLICY exclusions_update ON exclusions FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    ));
END IF;
END $$;

-- Academic terms & events: all org members
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_terms_select') THEN
  CREATE POLICY academic_terms_select ON academic_terms FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_terms_insert') THEN
  CREATE POLICY academic_terms_insert ON academic_terms FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_terms_update') THEN
  CREATE POLICY academic_terms_update ON academic_terms FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school_events_select') THEN
  CREATE POLICY school_events_select ON school_events FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school_events_insert') THEN
  CREATE POLICY school_events_insert ON school_events FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school_events_update') THEN
  CREATE POLICY school_events_update ON school_events FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Parents evening slots
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pe_slots_select') THEN
  CREATE POLICY pe_slots_select ON parents_evening_slots FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pe_slots_insert') THEN
  CREATE POLICY pe_slots_insert ON parents_evening_slots FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pe_slots_update') THEN
  CREATE POLICY pe_slots_update ON parents_evening_slots FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;
