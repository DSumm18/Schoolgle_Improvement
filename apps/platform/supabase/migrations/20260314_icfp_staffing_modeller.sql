-- =====================================================
-- ICFP Staffing Modeller Migration
-- 2026-03-14
--
-- Tables:
--   1. school_settings          — one row per school (phase, roll, GAG)
--   2. staff_posts              — live staffing structure
--   3. staffing_scenarios       — budget scenario containers
--   4. scenario_posts           — posts assigned to each scenario
--   5. pay_assumptions          — pay award assumptions per scenario
--   6. icfp_scenario_snapshots  — saved ICFP calculations (audit trail)
--
-- Note: icfp_snapshots already exists in 20260311_strategic_plan_icfp.sql
-- This migration adds scenario-specific snapshots as icfp_scenario_snapshots
--
-- All tables use organization_id with org-based RLS
-- =====================================================


-- =====================================================
-- 1. school_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phase TEXT CHECK (phase IN ('primary', 'secondary', 'special', 'all_through')),
  roll INTEGER DEFAULT 420,
  gag_per_pupil INTEGER DEFAULT 5200,
  financial_year_start DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_school_settings_org ON school_settings(organization_id);

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Users can view their organization''s school settings') THEN
    CREATE POLICY "Users can view their organization's school settings"
      ON school_settings FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Users can create school settings for their organization') THEN
    CREATE POLICY "Users can create school settings for their organization"
      ON school_settings FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Users can update their organization''s school settings') THEN
    CREATE POLICY "Users can update their organization's school settings"
      ON school_settings FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Users can delete their organization''s school settings') THEN
    CREATE POLICY "Users can delete their organization's school settings"
      ON school_settings FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Service role has full access to school_settings') THEN
    CREATE POLICY "Service role has full access to school_settings"
      ON school_settings FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 2. staff_posts (live staffing structure)
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('headteacher', 'slt', 'teachers', 'tas', 'support', 'volunteers')),
  salary NUMERIC(10,2) NOT NULL,
  fte NUMERIC(4,3) DEFAULT 1.000,
  on_cost_rate NUMERIC(5,4) DEFAULT 0.4280,
  dfe_code TEXT,
  pay_framework TEXT CHECK (pay_framework IN ('STPCD', 'NJC', 'HTPR', 'unpaid')),
  contract_type TEXT CHECK (contract_type IN ('permanent', 'fixed_term', 'supply')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_posts_org ON staff_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_posts_active ON staff_posts(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_staff_posts_tier ON staff_posts(tier);

ALTER TABLE staff_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_posts' AND policyname = 'Users can view their organization''s staff posts') THEN
    CREATE POLICY "Users can view their organization's staff posts"
      ON staff_posts FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_posts' AND policyname = 'Users can create staff posts for their organization') THEN
    CREATE POLICY "Users can create staff posts for their organization"
      ON staff_posts FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_posts' AND policyname = 'Users can update their organization''s staff posts') THEN
    CREATE POLICY "Users can update their organization's staff posts"
      ON staff_posts FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_posts' AND policyname = 'Users can delete their organization''s staff posts') THEN
    CREATE POLICY "Users can delete their organization's staff posts"
      ON staff_posts FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_posts' AND policyname = 'Service role has full access to staff_posts') THEN
    CREATE POLICY "Service role has full access to staff_posts"
      ON staff_posts FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 3. staffing_scenarios (budget scenario containers)
-- =====================================================
CREATE TABLE IF NOT EXISTS staffing_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_baseline BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staffing_scenarios_org ON staffing_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_staffing_scenarios_baseline ON staffing_scenarios(organization_id, is_baseline);

ALTER TABLE staffing_scenarios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffing_scenarios' AND policyname = 'Users can view their organization''s staffing scenarios') THEN
    CREATE POLICY "Users can view their organization's staffing scenarios"
      ON staffing_scenarios FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffing_scenarios' AND policyname = 'Users can create staffing scenarios for their organization') THEN
    CREATE POLICY "Users can create staffing scenarios for their organization"
      ON staffing_scenarios FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffing_scenarios' AND policyname = 'Users can update their organization''s staffing scenarios') THEN
    CREATE POLICY "Users can update their organization's staffing scenarios"
      ON staffing_scenarios FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffing_scenarios' AND policyname = 'Users can delete their organization''s staffing scenarios') THEN
    CREATE POLICY "Users can delete their organization's staffing scenarios"
      ON staffing_scenarios FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffing_scenarios' AND policyname = 'Service role has full access to staffing_scenarios') THEN
    CREATE POLICY "Service role has full access to staffing_scenarios"
      ON staffing_scenarios FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 4. scenario_posts (posts assigned to each scenario)
-- =====================================================
CREATE TABLE IF NOT EXISTS scenario_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES staffing_scenarios(id) ON DELETE CASCADE,
  staff_post_id UUID NOT NULL REFERENCES staff_posts(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'released', 'added')) DEFAULT 'active',
  override_salary NUMERIC(10,2),
  override_fte NUMERIC(4,3),
  position_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_scenario_posts_scenario ON scenario_posts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_posts_staff ON scenario_posts(staff_post_id);

ALTER TABLE scenario_posts ENABLE ROW LEVEL SECURITY;

-- scenario_posts doesn't have its own organization_id, so RLS joins through staffing_scenarios
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenario_posts' AND policyname = 'Users can view scenario posts via scenario org') THEN
    CREATE POLICY "Users can view scenario posts via scenario org"
      ON scenario_posts FOR SELECT
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenario_posts' AND policyname = 'Users can create scenario posts via scenario org') THEN
    CREATE POLICY "Users can create scenario posts via scenario org"
      ON scenario_posts FOR INSERT
      WITH CHECK (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenario_posts' AND policyname = 'Users can update scenario posts via scenario org') THEN
    CREATE POLICY "Users can update scenario posts via scenario org"
      ON scenario_posts FOR UPDATE
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenario_posts' AND policyname = 'Users can delete scenario posts via scenario org') THEN
    CREATE POLICY "Users can delete scenario posts via scenario org"
      ON scenario_posts FOR DELETE
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenario_posts' AND policyname = 'Service role has full access to scenario_posts') THEN
    CREATE POLICY "Service role has full access to scenario_posts"
      ON scenario_posts FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 5. pay_assumptions (pay award rates per scenario)
-- =====================================================
CREATE TABLE IF NOT EXISTS pay_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES staffing_scenarios(id) ON DELETE CASCADE,
  framework TEXT CHECK (framework IN ('STPCD', 'NJC', 'HTPR')),
  award_rate NUMERIC(5,4) NOT NULL,
  effective_month INTEGER CHECK (effective_month BETWEEN 0 AND 11),
  financial_year INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pay_assumptions_scenario ON pay_assumptions(scenario_id);

ALTER TABLE pay_assumptions ENABLE ROW LEVEL SECURITY;

-- pay_assumptions joins through staffing_scenarios for org scoping
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_assumptions' AND policyname = 'Users can view pay assumptions via scenario org') THEN
    CREATE POLICY "Users can view pay assumptions via scenario org"
      ON pay_assumptions FOR SELECT
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_assumptions' AND policyname = 'Users can create pay assumptions via scenario org') THEN
    CREATE POLICY "Users can create pay assumptions via scenario org"
      ON pay_assumptions FOR INSERT
      WITH CHECK (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_assumptions' AND policyname = 'Users can update pay assumptions via scenario org') THEN
    CREATE POLICY "Users can update pay assumptions via scenario org"
      ON pay_assumptions FOR UPDATE
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_assumptions' AND policyname = 'Users can delete pay assumptions via scenario org') THEN
    CREATE POLICY "Users can delete pay assumptions via scenario org"
      ON pay_assumptions FOR DELETE
      USING (scenario_id IN (
        SELECT id FROM staffing_scenarios WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_assumptions' AND policyname = 'Service role has full access to pay_assumptions') THEN
    CREATE POLICY "Service role has full access to pay_assumptions"
      ON pay_assumptions FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 6. icfp_scenario_snapshots (saved calculations)
-- Note: Named differently from icfp_snapshots (which
-- already exists in 20260311_strategic_plan_icfp.sql)
-- This table stores per-scenario calculation results.
-- =====================================================
CREATE TABLE IF NOT EXISTS icfp_scenario_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES staffing_scenarios(id) ON DELETE CASCADE,
  snapshot_date DATE DEFAULT current_date,
  staffing_pct NUMERIC(5,2),
  ptr NUMERIC(5,2),
  slt_pct NUMERIC(5,2),
  teach_pct NUMERIC(5,2),
  total_income NUMERIC(12,2),
  total_staffing NUMERIC(12,2),
  raw_data JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_icfp_scenario_snapshots_org ON icfp_scenario_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_icfp_scenario_snapshots_scenario ON icfp_scenario_snapshots(scenario_id);
CREATE INDEX IF NOT EXISTS idx_icfp_scenario_snapshots_date ON icfp_scenario_snapshots(organization_id, snapshot_date DESC);

ALTER TABLE icfp_scenario_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenario_snapshots' AND policyname = 'Users can view their organization''s ICFP scenario snapshots') THEN
    CREATE POLICY "Users can view their organization's ICFP scenario snapshots"
      ON icfp_scenario_snapshots FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenario_snapshots' AND policyname = 'Users can create ICFP scenario snapshots for their organization') THEN
    CREATE POLICY "Users can create ICFP scenario snapshots for their organization"
      ON icfp_scenario_snapshots FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenario_snapshots' AND policyname = 'Users can update their organization''s ICFP scenario snapshots') THEN
    CREATE POLICY "Users can update their organization's ICFP scenario snapshots"
      ON icfp_scenario_snapshots FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenario_snapshots' AND policyname = 'Users can delete their organization''s ICFP scenario snapshots') THEN
    CREATE POLICY "Users can delete their organization's ICFP scenario snapshots"
      ON icfp_scenario_snapshots FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenario_snapshots' AND policyname = 'Service role has full access to icfp_scenario_snapshots') THEN
    CREATE POLICY "Service role has full access to icfp_scenario_snapshots"
      ON icfp_scenario_snapshots FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- Useful views
-- =====================================================

-- Scenario cost summary: total cost per scenario with tier breakdown
CREATE OR REPLACE VIEW staffing_scenario_summary AS
SELECT
  ss.id AS scenario_id,
  ss.organization_id,
  ss.name AS scenario_name,
  ss.is_baseline,
  COUNT(sp.id) AS post_count,
  SUM(CASE WHEN sp.status != 'released' THEN 1 ELSE 0 END) AS active_post_count,
  SUM(
    CASE WHEN sp.status != 'released' THEN
      COALESCE(sp.override_fte, p.fte) *
      COALESCE(sp.override_salary, p.salary) *
      (1 + p.on_cost_rate)
    ELSE 0 END
  ) AS total_cost,
  SUM(CASE WHEN p.tier = 'headteacher' AND sp.status != 'released' THEN
    COALESCE(sp.override_fte, p.fte) * COALESCE(sp.override_salary, p.salary) * (1 + p.on_cost_rate)
  ELSE 0 END) AS headteacher_cost,
  SUM(CASE WHEN p.tier = 'slt' AND sp.status != 'released' THEN
    COALESCE(sp.override_fte, p.fte) * COALESCE(sp.override_salary, p.salary) * (1 + p.on_cost_rate)
  ELSE 0 END) AS slt_cost,
  SUM(CASE WHEN p.tier = 'teachers' AND sp.status != 'released' THEN
    COALESCE(sp.override_fte, p.fte) * COALESCE(sp.override_salary, p.salary) * (1 + p.on_cost_rate)
  ELSE 0 END) AS teachers_cost,
  SUM(CASE WHEN p.tier = 'tas' AND sp.status != 'released' THEN
    COALESCE(sp.override_fte, p.fte) * COALESCE(sp.override_salary, p.salary) * (1 + p.on_cost_rate)
  ELSE 0 END) AS tas_cost,
  SUM(CASE WHEN p.tier = 'support' AND sp.status != 'released' THEN
    COALESCE(sp.override_fte, p.fte) * COALESCE(sp.override_salary, p.salary) * (1 + p.on_cost_rate)
  ELSE 0 END) AS support_cost,
  SUM(CASE WHEN sp.status != 'released' THEN COALESCE(sp.override_fte, p.fte) ELSE 0 END) AS total_fte
FROM staffing_scenarios ss
LEFT JOIN scenario_posts sp ON sp.scenario_id = ss.id
LEFT JOIN staff_posts p ON p.id = sp.staff_post_id
GROUP BY ss.id, ss.organization_id, ss.name, ss.is_baseline;
