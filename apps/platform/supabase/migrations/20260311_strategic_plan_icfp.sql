-- =====================================================
-- Strategic Planning & ICFP Migration
-- 2026-03-11
--
-- Tables:
--   1. strategic_plans          — 3-year capital/improvement plans
--   2. strategic_plan_items     — individual items within a plan
--   3. icfp_snapshots           — point-in-time ICFP calculations
--   4. icfp_staff_structure     — detailed staff structure for modelling
--   5. icfp_scenarios           — what-if modelling
--   6. budget_actuals_imports   — uploaded budget data for analysis
--   7. pay_scale_rates          — UK teacher/support pay scales (reference)
--   8. la_ledger_mappings       — LA-specific code mappings (network effect)
--
-- All tables use organization_id with org-based RLS except:
--   pay_scale_rates   — public reference data (SELECT for authenticated)
--   la_ledger_mappings — shared data (SELECT for authenticated)
-- =====================================================


-- =====================================================
-- 1. strategic_plans
-- =====================================================
CREATE TABLE IF NOT EXISTS strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'capital',
  status TEXT NOT NULL DEFAULT 'draft',
  start_year TEXT NOT NULL,
  end_year TEXT NOT NULL,
  total_budget NUMERIC(14,2),
  year_1_budget NUMERIC(14,2),
  year_2_budget NUMERIC(14,2),
  year_3_budget NUMERIC(14,2),
  contingency_budget NUMERIC(14,2),
  risk_appetite_statement TEXT,
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  board_meeting_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strategic_plans_org ON strategic_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_status ON strategic_plans(status);

ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plans' AND policyname = 'Users can view their organization''s strategic plans') THEN
    CREATE POLICY "Users can view their organization's strategic plans"
      ON strategic_plans FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plans' AND policyname = 'Users can create strategic plans for their organization') THEN
    CREATE POLICY "Users can create strategic plans for their organization"
      ON strategic_plans FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plans' AND policyname = 'Users can update their organization''s strategic plans') THEN
    CREATE POLICY "Users can update their organization's strategic plans"
      ON strategic_plans FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plans' AND policyname = 'Users can delete their organization''s strategic plans') THEN
    CREATE POLICY "Users can delete their organization's strategic plans"
      ON strategic_plans FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plans' AND policyname = 'Service role has full access to strategic_plans') THEN
    CREATE POLICY "Service role has full access to strategic_plans"
      ON strategic_plans FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 2. strategic_plan_items
-- =====================================================
CREATE TABLE IF NOT EXISTS strategic_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategic_plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  year INT NOT NULL,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  funding_source TEXT,
  cfr_code TEXT,
  priority_rank INT,
  priority_band TEXT DEFAULT 'could',
  risk_register_id UUID,
  sdp_priority_id UUID REFERENCES sdp_priorities(id) ON DELETE SET NULL,
  sef_area_id TEXT,
  status TEXT DEFAULT 'planned',
  deferred_from_year INT,
  deferral_risk_id UUID,
  dependencies UUID[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strategic_plan_items_plan ON strategic_plan_items(strategic_plan_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plan_items_org ON strategic_plan_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plan_items_school ON strategic_plan_items(school_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plan_items_risk ON strategic_plan_items(risk_register_id);

ALTER TABLE strategic_plan_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plan_items' AND policyname = 'Users can view their organization''s strategic plan items') THEN
    CREATE POLICY "Users can view their organization's strategic plan items"
      ON strategic_plan_items FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plan_items' AND policyname = 'Users can create strategic plan items for their organization') THEN
    CREATE POLICY "Users can create strategic plan items for their organization"
      ON strategic_plan_items FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plan_items' AND policyname = 'Users can update their organization''s strategic plan items') THEN
    CREATE POLICY "Users can update their organization's strategic plan items"
      ON strategic_plan_items FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plan_items' AND policyname = 'Users can delete their organization''s strategic plan items') THEN
    CREATE POLICY "Users can delete their organization's strategic plan items"
      ON strategic_plan_items FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategic_plan_items' AND policyname = 'Service role has full access to strategic_plan_items') THEN
    CREATE POLICY "Service role has full access to strategic_plan_items"
      ON strategic_plan_items FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 3. icfp_snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS icfp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  number_on_roll INT,
  total_income NUMERIC(14,2),
  total_staff_cost NUMERIC(14,2),
  total_teaching_cost NUMERIC(14,2),
  total_leadership_cost NUMERIC(14,2),
  teacher_fte NUMERIC(5,2),
  leadership_fte NUMERIC(5,2),
  total_staff_fte NUMERIC(5,2),
  staffing_percent NUMERIC(5,2),
  pupil_teacher_ratio NUMERIC(5,2),
  average_class_size NUMERIC(5,2),
  average_teacher_cost NUMERIC(10,2),
  teacher_contact_ratio NUMERIC(5,3),
  leadership_percent NUMERIC(5,2),
  leadership_fte_percent NUMERIC(5,2),
  in_year_balance NUMERIC(14,2),
  carry_forward NUMERIC(14,2),
  structural_viability TEXT,
  benchmark_data JSONB DEFAULT '{}',
  source_data JSONB DEFAULT '{}',
  data_validated BOOLEAN DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_icfp_snapshots_org_date ON icfp_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_icfp_snapshots_org_year ON icfp_snapshots(organization_id, academic_year);

ALTER TABLE icfp_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_snapshots' AND policyname = 'Users can view their organization''s ICFP snapshots') THEN
    CREATE POLICY "Users can view their organization's ICFP snapshots"
      ON icfp_snapshots FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_snapshots' AND policyname = 'Users can create ICFP snapshots for their organization') THEN
    CREATE POLICY "Users can create ICFP snapshots for their organization"
      ON icfp_snapshots FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_snapshots' AND policyname = 'Users can update their organization''s ICFP snapshots') THEN
    CREATE POLICY "Users can update their organization's ICFP snapshots"
      ON icfp_snapshots FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_snapshots' AND policyname = 'Users can delete their organization''s ICFP snapshots') THEN
    CREATE POLICY "Users can delete their organization's ICFP snapshots"
      ON icfp_snapshots FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_snapshots' AND policyname = 'Service role has full access to icfp_snapshots') THEN
    CREATE POLICY "Service role has full access to icfp_snapshots"
      ON icfp_snapshots FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 4. icfp_staff_structure
-- =====================================================
CREATE TABLE IF NOT EXISTS icfp_staff_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  icfp_snapshot_id UUID REFERENCES icfp_snapshots(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  role_category TEXT NOT NULL,
  pay_scale TEXT,
  pay_point TEXT,
  fte NUMERIC(4,2) NOT NULL,
  base_salary NUMERIC(10,2),
  tlr_amount NUMERIC(8,2) DEFAULT 0,
  sen_allowance NUMERIC(8,2) DEFAULT 0,
  employer_ni NUMERIC(10,2),
  employer_pension NUMERIC(10,2),
  total_cost NUMERIC(10,2) NOT NULL,
  is_protected BOOLEAN DEFAULT false,
  protected_reason TEXT,
  deployed_to_other_school BOOLEAN DEFAULT false,
  deployed_school_id UUID,
  recharge_amount NUMERIC(10,2) DEFAULT 0,
  data_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_icfp_staff_snapshot ON icfp_staff_structure(icfp_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_icfp_staff_org ON icfp_staff_structure(organization_id);

ALTER TABLE icfp_staff_structure ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_staff_structure' AND policyname = 'Users can view their organization''s ICFP staff structure') THEN
    CREATE POLICY "Users can view their organization's ICFP staff structure"
      ON icfp_staff_structure FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_staff_structure' AND policyname = 'Users can create ICFP staff structure for their organization') THEN
    CREATE POLICY "Users can create ICFP staff structure for their organization"
      ON icfp_staff_structure FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_staff_structure' AND policyname = 'Users can update their organization''s ICFP staff structure') THEN
    CREATE POLICY "Users can update their organization's ICFP staff structure"
      ON icfp_staff_structure FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_staff_structure' AND policyname = 'Users can delete their organization''s ICFP staff structure') THEN
    CREATE POLICY "Users can delete their organization's ICFP staff structure"
      ON icfp_staff_structure FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_staff_structure' AND policyname = 'Service role has full access to icfp_staff_structure') THEN
    CREATE POLICY "Service role has full access to icfp_staff_structure"
      ON icfp_staff_structure FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 5. icfp_scenarios
-- =====================================================
CREATE TABLE IF NOT EXISTS icfp_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  icfp_snapshot_id UUID REFERENCES icfp_snapshots(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL,
  changes JSONB NOT NULL,
  projected_staffing_percent NUMERIC(5,2),
  projected_balance NUMERIC(14,2),
  projected_icfp JSONB,
  year_1_impact NUMERIC(14,2),
  year_2_impact NUMERIC(14,2),
  year_3_impact NUMERIC(14,2),
  risks_created TEXT[],
  risks_mitigated TEXT[],
  implementation_cost NUMERIC(12,2),
  implementation_timeline TEXT,
  recommended BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_icfp_scenarios_org ON icfp_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_icfp_scenarios_snapshot ON icfp_scenarios(icfp_snapshot_id);

ALTER TABLE icfp_scenarios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenarios' AND policyname = 'Users can view their organization''s ICFP scenarios') THEN
    CREATE POLICY "Users can view their organization's ICFP scenarios"
      ON icfp_scenarios FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenarios' AND policyname = 'Users can create ICFP scenarios for their organization') THEN
    CREATE POLICY "Users can create ICFP scenarios for their organization"
      ON icfp_scenarios FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenarios' AND policyname = 'Users can update their organization''s ICFP scenarios') THEN
    CREATE POLICY "Users can update their organization's ICFP scenarios"
      ON icfp_scenarios FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenarios' AND policyname = 'Users can delete their organization''s ICFP scenarios') THEN
    CREATE POLICY "Users can delete their organization's ICFP scenarios"
      ON icfp_scenarios FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icfp_scenarios' AND policyname = 'Service role has full access to icfp_scenarios') THEN
    CREATE POLICY "Service role has full access to icfp_scenarios"
      ON icfp_scenarios FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 6. budget_actuals_imports
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_actuals_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  file_name TEXT,
  file_type TEXT,
  academic_year TEXT,
  financial_year TEXT,
  raw_data JSONB,
  mapped_lines JSONB,
  total_income NUMERIC(14,2),
  total_expenditure NUMERIC(14,2),
  balance NUMERIC(14,2),
  la_ledger_mapping_id UUID,
  assumptions JSONB DEFAULT '{}',
  missing_items JSONB DEFAULT '[]',
  adjusted_position JSONB,
  data_validated BOOLEAN DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budget_imports_org_date ON budget_actuals_imports(organization_id, import_date DESC);

ALTER TABLE budget_actuals_imports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_actuals_imports' AND policyname = 'Users can view their organization''s budget imports') THEN
    CREATE POLICY "Users can view their organization's budget imports"
      ON budget_actuals_imports FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_actuals_imports' AND policyname = 'Users can create budget imports for their organization') THEN
    CREATE POLICY "Users can create budget imports for their organization"
      ON budget_actuals_imports FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_actuals_imports' AND policyname = 'Users can update their organization''s budget imports') THEN
    CREATE POLICY "Users can update their organization's budget imports"
      ON budget_actuals_imports FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_actuals_imports' AND policyname = 'Users can delete their organization''s budget imports') THEN
    CREATE POLICY "Users can delete their organization's budget imports"
      ON budget_actuals_imports FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_actuals_imports' AND policyname = 'Service role has full access to budget_actuals_imports') THEN
    CREATE POLICY "Service role has full access to budget_actuals_imports"
      ON budget_actuals_imports FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;


-- =====================================================
-- 7. pay_scale_rates (public reference data)
-- =====================================================
CREATE TABLE IF NOT EXISTS pay_scale_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  scale_type TEXT NOT NULL,
  point TEXT NOT NULL,
  annual_salary NUMERIC(10,2) NOT NULL,
  london_inner NUMERIC(10,2),
  london_outer NUMERIC(10,2),
  london_fringe NUMERIC(10,2),
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pay_scale_rates_lookup ON pay_scale_rates(academic_year, scale_type, point);

ALTER TABLE pay_scale_rates ENABLE ROW LEVEL SECURITY;

-- Public reference data: any authenticated user can read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_scale_rates' AND policyname = 'Authenticated users can view pay scale rates') THEN
    CREATE POLICY "Authenticated users can view pay scale rates"
      ON pay_scale_rates FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role'));
  END IF;
END $$;

-- Only service_role can modify reference data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pay_scale_rates' AND policyname = 'Service role can manage pay scale rates') THEN
    CREATE POLICY "Service role can manage pay scale rates"
      ON pay_scale_rates FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Seed 2025-26 pay scale data
INSERT INTO pay_scale_rates (academic_year, scale_type, point, annual_salary)
VALUES
  -- Main Pay Scale (MPS)
  ('2025-26', 'mps', 'M1', 30000.00),
  ('2025-26', 'mps', 'M2', 31737.00),
  ('2025-26', 'mps', 'M3', 33814.00),
  ('2025-26', 'mps', 'M4', 35949.00),
  ('2025-26', 'mps', 'M5', 38330.00),
  ('2025-26', 'mps', 'M6', 41333.00),
  -- Upper Pay Scale (UPS)
  ('2025-26', 'ups', 'UPS1', 43266.00),
  ('2025-26', 'ups', 'UPS2', 44870.00),
  ('2025-26', 'ups', 'UPS3', 46525.00),
  -- Leadership
  ('2025-26', 'leadership', 'L1', 47185.00),
  ('2025-26', 'leadership', 'L5', 51347.00),
  ('2025-26', 'leadership', 'L10', 57831.00),
  ('2025-26', 'leadership', 'L15', 64225.00),
  ('2025-26', 'leadership', 'L20', 71765.00),
  ('2025-26', 'leadership', 'L25', 79574.00),
  ('2025-26', 'leadership', 'L30', 88530.00),
  ('2025-26', 'leadership', 'L35', 97491.00),
  ('2025-26', 'leadership', 'L43', 131056.00),
  -- Unqualified Teacher Scale
  ('2025-26', 'unqualified', 'UQ1', 22924.00),
  ('2025-26', 'unqualified', 'UQ2', 24783.00),
  ('2025-26', 'unqualified', 'UQ3', 26700.00),
  ('2025-26', 'unqualified', 'UQ4', 28584.00),
  ('2025-26', 'unqualified', 'UQ5', 30483.00),
  ('2025-26', 'unqualified', 'UQ6', 33560.00)
ON CONFLICT DO NOTHING;


-- =====================================================
-- 8. la_ledger_mappings (shared reference data)
-- =====================================================
CREATE TABLE IF NOT EXISTS la_ledger_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  la_code TEXT NOT NULL,
  la_name TEXT NOT NULL,
  ledger_code TEXT NOT NULL,
  description TEXT,
  cfr_code TEXT NOT NULL,
  confidence TEXT DEFAULT 'user_confirmed',
  confirmed_by_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(la_code, ledger_code)
);

CREATE INDEX IF NOT EXISTS idx_la_ledger_mappings_la ON la_ledger_mappings(la_code);

ALTER TABLE la_ledger_mappings ENABLE ROW LEVEL SECURITY;

-- Shared data: any authenticated user can read (network effect)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'la_ledger_mappings' AND policyname = 'Authenticated users can view LA ledger mappings') THEN
    CREATE POLICY "Authenticated users can view LA ledger mappings"
      ON la_ledger_mappings FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role'));
  END IF;
END $$;

-- Only service_role can modify shared mappings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'la_ledger_mappings' AND policyname = 'Service role can manage LA ledger mappings') THEN
    CREATE POLICY "Service role can manage LA ledger mappings"
      ON la_ledger_mappings FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
