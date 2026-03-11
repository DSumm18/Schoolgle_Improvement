-- Layer 10: P3 Completeness — Admissions, Sports Premium, Emergency Planning, School Meals

-- ═══════════════════════════════════════════════════════════════════════
-- 1. ADMISSIONS TRACKER
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admissions_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  entry_year_group TEXT NOT NULL,
  published_admission_number INT,
  application_deadline DATE,
  offer_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('planning', 'open', 'closed', 'offers_made', 'appeals', 'complete')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, academic_year, entry_year_group)
);

CREATE TABLE IF NOT EXISTS admissions_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES admissions_rounds(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  sibling_at_school BOOLEAN DEFAULT false,
  looked_after BOOLEAN DEFAULT false,
  ehcp BOOLEAN DEFAULT false,
  faith_criteria_met BOOLEAN,
  distance_miles NUMERIC(5,2),
  preference_rank INT,
  oversubscription_criteria TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'verified', 'offered', 'accepted', 'declined', 'waiting_list', 'appeal', 'withdrawn'
  )),
  waiting_list_position INT,
  offer_date DATE,
  response_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admissions_apps_round ON admissions_applications(round_id);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_org ON admissions_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_status ON admissions_applications(status);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. SPORTS PREMIUM STRATEGY
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sports_premium_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  total_funding NUMERIC(10,2),
  total_pupils INT,
  swimming_meeting_standard_percent NUMERIC(5,2),
  swimming_distance_percent NUMERIC(5,2),
  swimming_stroke_percent NUMERIC(5,2),
  strategy_summary TEXT,
  key_achievements TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'under_review', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, academic_year)
);

CREATE TABLE IF NOT EXISTS sports_premium_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES sports_premium_strategies(id) ON DELETE CASCADE,
  indicator TEXT NOT NULL CHECK (indicator IN (
    'engagement', 'profile', 'knowledge', 'broader_experience', 'competition'
  )),
  activity TEXT NOT NULL,
  description TEXT,
  budgeted_cost NUMERIC(8,2),
  actual_cost NUMERIC(8,2),
  impact TEXT,
  sustainability TEXT,
  evidence TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sp_spend_strategy ON sports_premium_spend(strategy_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. EMERGENCY PLANNING
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN (
    'lockdown', 'evacuation', 'shelter_in_place', 'bomb_threat',
    'intruder', 'fire', 'flood', 'gas_leak', 'pandemic', 'major_incident'
  )),
  title TEXT NOT NULL,
  description TEXT,
  procedures JSONB DEFAULT '[]',
  assembly_points JSONB DEFAULT '[]',
  key_contacts JSONB DEFAULT '[]',
  communication_plan TEXT,
  last_reviewed DATE,
  next_review_due DATE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  version INT DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_review', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES emergency_plans(id) ON DELETE SET NULL,
  drill_type TEXT NOT NULL CHECK (drill_type IN (
    'lockdown', 'fire_evacuation', 'shelter_in_place', 'bomb_threat', 'invacuation'
  )),
  drill_date DATE NOT NULL,
  start_time TIME,
  evacuation_time_seconds INT,
  all_accounted_for BOOLEAN,
  issues_found TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  conducted_by TEXT,
  pupil_count INT,
  staff_count INT,
  visitor_count INT,
  notes TEXT,
  next_drill_due DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_plans_org ON emergency_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_drills_org ON emergency_drills(organization_id, drill_date DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. SCHOOL MEALS / FSM TRACKING
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS school_meals_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meal_price NUMERIC(5,2) NOT NULL DEFAULT 2.50,
  uifsm_eligible_years TEXT[] DEFAULT ARRAY['Reception', 'Year 1', 'Year 2'],
  provider_name TEXT,
  provider_contract_end DATE,
  kitchen_type TEXT CHECK (kitchen_type IS NULL OR kitchen_type IN ('on_site', 'delivered', 'satellite')),
  dietary_options TEXT[] DEFAULT ARRAY['standard', 'vegetarian', 'halal', 'vegan', 'gluten_free'],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS pupil_meal_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id TEXT NOT NULL,
  pupil_name_encrypted TEXT,
  year_group TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('fsm', 'uifsm', 'paid', 'packed_lunch', 'home')),
  dietary_requirements TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  fsm_eligible BOOLEAN DEFAULT false,
  fsm_start_date DATE,
  fsm_end_date DATE,
  ever_6_fsm BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pupil_id)
);

CREATE TABLE IF NOT EXISTS daily_meal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  year_group TEXT,
  school_meals_count INT DEFAULT 0,
  fsm_count INT DEFAULT 0,
  uifsm_count INT DEFAULT 0,
  paid_count INT DEFAULT 0,
  packed_lunch_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  total_pupils INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, order_date, year_group)
);

CREATE INDEX IF NOT EXISTS idx_meal_reg_org ON pupil_meal_registrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_meal_reg_fsm ON pupil_meal_registrations(fsm_eligible) WHERE fsm_eligible = true;
CREATE INDEX IF NOT EXISTS idx_daily_meals_org ON daily_meal_orders(organization_id, order_date);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE admissions_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_premium_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_premium_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_meals_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupil_meal_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_orders ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT; pname TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admissions_rounds', 'admissions_applications',
    'sports_premium_strategies', 'sports_premium_spend',
    'emergency_plans', 'emergency_drills',
    'school_meals_config', 'pupil_meal_registrations', 'daily_meal_orders'
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
