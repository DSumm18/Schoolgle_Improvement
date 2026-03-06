-- ============================================================================
-- Vision AI: Room Check Register + Vision Scan Sessions + COSHH Register
-- Date: 2026-03-07
-- Purpose: Tamper-proof premises evidence, room check scheduling,
--          vision scan persistence, COSHH register
-- ============================================================================

-- ============================================================================
-- 1. VISION SCAN SESSIONS -- Every vision AI analysis performed
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vision_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  context_type TEXT NOT NULL,

  location_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Results summary
  items_detected INT DEFAULT 0,
  issues_flagged INT DEFAULT 0,
  compliance_score DECIMAL(3, 2),

  -- Media (retained per GDPR policy)
  media_urls TEXT[],
  media_retention_until DATE,

  -- Full structured results
  report_json JSONB,
  report_pdf_url TEXT,

  -- Model used
  model_id TEXT,
  model_cost_estimate DECIMAL(8, 6),

  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_scans_org
  ON public.vision_scan_sessions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_scans_location
  ON public.vision_scan_sessions(location_id, created_at DESC);

ALTER TABLE public.vision_scan_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vision_scans_org_read" ON public.vision_scan_sessions;
CREATE POLICY "vision_scans_org_read" ON public.vision_scan_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vision_scans_org_insert" ON public.vision_scan_sessions;
CREATE POLICY "vision_scans_org_insert" ON public.vision_scan_sessions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. ROOM CHECK SCHEDULE -- Which rooms need AM/PM checks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_check_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  asset_id UUID NOT NULL,

  -- What checks are expected
  am_check_required BOOLEAN DEFAULT true,
  pm_check_required BOOLEAN DEFAULT true,
  am_deadline TIME DEFAULT '08:00',
  pm_deadline TIME DEFAULT '18:00',

  -- Who is responsible (optional -- anyone can do it)
  default_checker_id UUID,

  -- Term time vs holidays
  check_mode TEXT DEFAULT 'term',
  holiday_check_frequency TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_room_schedule_org
  ON public.room_check_schedule(organization_id);

ALTER TABLE public.room_check_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_schedule_org_read" ON public.room_check_schedule;
CREATE POLICY "room_schedule_org_read" ON public.room_check_schedule
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "room_schedule_org_write" ON public.room_check_schedule;
CREATE POLICY "room_schedule_org_write" ON public.room_check_schedule
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. ROOM CHECKS -- Every individual check (tamper-proof evidence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  checked_by UUID NOT NULL,

  -- When and what type
  check_type TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Media evidence
  media_type TEXT DEFAULT 'image',
  media_urls TEXT[],
  media_retention_until DATE,

  -- Evidence integrity (tamper-proof)
  media_hash TEXT,
  device_gps POINT,
  device_id TEXT,
  capture_timestamp TIMESTAMP WITH TIME ZONE,
  server_received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Vision AI results
  vision_scan_id UUID REFERENCES public.vision_scan_sessions(id),
  ai_summary TEXT,
  items_detected INT DEFAULT 0,
  issues_found INT DEFAULT 0,
  compliance_score DECIMAL(3, 2),

  -- Module dispatches
  dispatched_to JSONB DEFAULT '[]',

  -- Holiday / contractor use
  work_notes TEXT,
  contractor_name TEXT,
  is_snagging BOOLEAN DEFAULT false,

  -- Tamper-proof locking
  evidence_locked BOOLEAN DEFAULT false,
  evidence_locked_at TIMESTAMP WITH TIME ZONE,

  status TEXT DEFAULT 'complete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_checks_org_date
  ON public.room_checks(organization_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_checks_asset_date
  ON public.room_checks(asset_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_checks_type
  ON public.room_checks(check_type);

ALTER TABLE public.room_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_checks_org_read" ON public.room_checks;
CREATE POLICY "room_checks_org_read" ON public.room_checks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "room_checks_org_insert" ON public.room_checks;
CREATE POLICY "room_checks_org_insert" ON public.room_checks
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 4. TAMPER PREVENTION -- Locked evidence cannot be modified
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_evidence_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.evidence_locked = true THEN
    RAISE EXCEPTION 'Cannot modify locked evidence record %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_room_checks_tamper_proof ON public.room_checks;
CREATE TRIGGER tr_room_checks_tamper_proof
  BEFORE UPDATE OR DELETE ON public.room_checks
  FOR EACH ROW EXECUTE FUNCTION prevent_evidence_tampering();

-- Auto-lock evidence after 24 hours (call via scheduled job / cron)
CREATE OR REPLACE FUNCTION auto_lock_evidence()
RETURNS void AS $$
BEGIN
  UPDATE public.room_checks
  SET evidence_locked = true, evidence_locked_at = NOW()
  WHERE evidence_locked = false
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DAILY STATUS VIEW -- Dashboard: one row per room per day
-- ============================================================================

CREATE OR REPLACE VIEW public.room_check_daily_status AS
SELECT
  rs.organization_id,
  rs.asset_id,
  rs.am_check_required,
  rs.pm_check_required,
  rs.am_deadline,
  rs.pm_deadline,
  rs.check_mode,
  CURRENT_DATE AS check_date,
  -- AM check
  am.id AS am_check_id,
  am.checked_by AS am_checked_by,
  am.checked_at AS am_checked_at,
  am.issues_found AS am_issues,
  am.ai_summary AS am_summary,
  am.compliance_score AS am_score,
  CASE
    WHEN am.id IS NOT NULL AND am.issues_found > 0 THEN 'issues'
    WHEN am.id IS NOT NULL THEN 'done'
    WHEN rs.am_check_required AND CURRENT_TIME > rs.am_deadline THEN 'missed'
    WHEN rs.am_check_required THEN 'pending'
    ELSE 'not_required'
  END AS am_status,
  -- PM check
  pm.id AS pm_check_id,
  pm.checked_by AS pm_checked_by,
  pm.checked_at AS pm_checked_at,
  pm.issues_found AS pm_issues,
  pm.ai_summary AS pm_summary,
  pm.compliance_score AS pm_score,
  CASE
    WHEN pm.id IS NOT NULL AND pm.issues_found > 0 THEN 'issues'
    WHEN pm.id IS NOT NULL THEN 'done'
    WHEN rs.pm_check_required AND CURRENT_TIME > rs.pm_deadline THEN 'missed'
    WHEN rs.pm_check_required THEN 'pending'
    ELSE 'not_required'
  END AS pm_status
FROM public.room_check_schedule rs
LEFT JOIN public.room_checks am
  ON am.asset_id = rs.asset_id
  AND am.check_type = 'am_open'
  AND am.checked_at::DATE = CURRENT_DATE
LEFT JOIN public.room_checks pm
  ON pm.asset_id = rs.asset_id
  AND pm.check_type = 'pm_close'
  AND pm.checked_at::DATE = CURRENT_DATE;

-- ============================================================================
-- 6. COSHH REGISTER -- Chemical inventory from Vision AI scans
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coshh_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Identification (from Vision AI)
  product_name TEXT NOT NULL,
  brand TEXT,
  manufacturer TEXT,
  barcode TEXT,

  -- Hazard Classification
  ghs_hazard_codes TEXT[],
  ghs_pictogram_codes TEXT[],
  signal_word TEXT,
  hazard_statements TEXT[],
  precautionary_statements TEXT[],

  -- Storage & Compliance
  storage_location_id UUID,
  storage_conditions TEXT,
  incompatible_with TEXT[],
  max_storage_quantity TEXT,
  current_quantity TEXT,
  expiry_date DATE,

  -- Documentation
  sds_url TEXT,
  risk_assessment_url TEXT,
  coshh_assessment_date DATE,

  -- Procurement link (for DealFind integration)
  linked_product_id UUID,
  last_purchase_date DATE,
  last_purchase_price DECIMAL(10, 2),
  last_supplier_id UUID,
  typical_reorder_interval_days INT,

  -- Vision AI metadata
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  last_scan_image_url TEXT,
  scan_confidence DECIMAL(3, 2),
  ai_flags TEXT[],

  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coshh_register_org
  ON public.coshh_register(organization_id);
CREATE INDEX IF NOT EXISTS idx_coshh_register_location
  ON public.coshh_register(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_coshh_register_expiry
  ON public.coshh_register(expiry_date)
  WHERE expiry_date IS NOT NULL;

ALTER TABLE public.coshh_register ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coshh_register_org_read" ON public.coshh_register;
CREATE POLICY "coshh_register_org_read" ON public.coshh_register
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "coshh_register_org_write" ON public.coshh_register;
CREATE POLICY "coshh_register_org_write" ON public.coshh_register
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. CONSUMPTION TRACKING -- For budget intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  product_name TEXT NOT NULL,

  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  purchase_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',

  budget_year TEXT,
  budget_category TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumption_org
  ON public.product_consumption(organization_id, purchase_date DESC);

ALTER TABLE public.product_consumption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consumption_org_read" ON public.product_consumption;
CREATE POLICY "consumption_org_read" ON public.product_consumption
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "consumption_org_write" ON public.product_consumption;
CREATE POLICY "consumption_org_write" ON public.product_consumption
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. SCHOOL BUDGET PERIODS -- For year-end intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  financial_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budgets JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, financial_year)
);

ALTER TABLE public.school_budget_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_periods_org_read" ON public.school_budget_periods;
CREATE POLICY "budget_periods_org_read" ON public.school_budget_periods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "budget_periods_org_write" ON public.school_budget_periods;
CREATE POLICY "budget_periods_org_write" ON public.school_budget_periods
  FOR ALL USING (true) WITH CHECK (true);
