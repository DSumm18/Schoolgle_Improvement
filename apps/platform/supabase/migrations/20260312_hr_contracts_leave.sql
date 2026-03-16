-- HR Contracts & Leave Management
-- Foundation for staff contract tracking, leave entitlements, and Drive/OneDrive document linking

-- ============================================================
-- 1. STAFF CONTRACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,

  -- Contract basics
  contract_type TEXT NOT NULL DEFAULT 'permanent'
    CHECK (contract_type IN ('permanent', 'fixed_term', 'casual', 'zero_hours', 'supply', 'agency')),
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'term_time_only', 'term_time_plus', 'annualised_hours')),
  fte NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (fte > 0 AND fte <= 1.00),

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL = ongoing/permanent
  probation_end_date DATE,
  continuous_service_date DATE,  -- may predate start_date (e.g. transferred from another school in same trust)

  -- Working pattern
  weeks_per_year NUMERIC(4,1) DEFAULT 52.0,  -- 39 for term-time-only, 44 for TTO+5, etc.
  hours_per_week NUMERIC(4,1),  -- contracted hours
  working_days TEXT[],  -- e.g. ['monday','tuesday','wednesday','thursday','friday']

  -- Pay
  pay_scale TEXT,  -- e.g. 'MPS', 'UPS', 'Leadership', 'Support-H'
  pay_point TEXT,  -- e.g. 'M3', 'UPS1', 'L12'
  salary_actual NUMERIC(10,2),  -- actual salary after FTE/TTO adjustment
  salary_fte NUMERIC(10,2),  -- full-time equivalent salary
  on_costs_percent NUMERIC(5,2) DEFAULT 28.68,  -- employer NI + pension
  tlr TEXT,  -- e.g. 'TLR2a', 'TLR1c'
  sen_allowance NUMERIC(10,2),

  -- Notice & terms
  notice_period_weeks INTEGER DEFAULT 4,  -- varies: teachers = half term, support = 4 weeks, heads = 3 months
  is_current BOOLEAN NOT NULL DEFAULT true,
  superseded_by UUID REFERENCES staff_contracts(id),  -- when contract changes, link to replacement

  -- Source tracking
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'mis_sync', 'drive_import')),
  source_ref TEXT,  -- e.g. Arbor contract ID, Drive file ID
  last_synced_at TIMESTAMPTZ,

  -- Drive/OneDrive document link
  document_folder_id TEXT,  -- Google Drive folder ID or OneDrive item ID
  document_url TEXT,  -- direct link to contract document in Drive/OneDrive
  document_provider TEXT CHECK (document_provider IN ('google_drive', 'onedrive', 'sharepoint', 'manual_upload')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_staff_contracts_org ON staff_contracts(organization_id);
CREATE INDEX idx_staff_contracts_staff ON staff_contracts(staff_id);
CREATE INDEX idx_staff_contracts_current ON staff_contracts(organization_id, is_current) WHERE is_current = true;

-- ============================================================
-- 2. LEAVE ENTITLEMENTS (calculated per contract per year)
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES staff_contracts(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,  -- e.g. '2025-2026'

  -- Annual leave (support staff — teachers don't get "leave", they get school holidays)
  annual_leave_entitlement_days NUMERIC(4,1),  -- base entitlement from contract
  annual_leave_fte_adjusted NUMERIC(4,1),  -- after FTE pro-rata
  annual_leave_tto_adjusted NUMERIC(4,1),  -- after term-time-only pro-rata (weeks/52)
  annual_leave_carried_forward NUMERIC(4,1) DEFAULT 0,  -- max usually 5 days
  annual_leave_taken NUMERIC(4,1) DEFAULT 0,
  annual_leave_booked NUMERIC(4,1) DEFAULT 0,  -- approved but not yet taken
  annual_leave_remaining NUMERIC(4,1) GENERATED ALWAYS AS (
    COALESCE(annual_leave_tto_adjusted, annual_leave_fte_adjusted, annual_leave_entitlement_days, 0)
    + COALESCE(annual_leave_carried_forward, 0)
    - COALESCE(annual_leave_taken, 0)
    - COALESCE(annual_leave_booked, 0)
  ) STORED,

  -- Sickness (for tracking against policy triggers, not entitlement per se)
  sickness_days_taken NUMERIC(4,1) DEFAULT 0,
  sickness_spells INTEGER DEFAULT 0,
  bradford_factor INTEGER DEFAULT 0,

  -- Other leave types (days used this year)
  compassionate_leave_taken NUMERIC(3,1) DEFAULT 0,
  parental_leave_taken NUMERIC(4,1) DEFAULT 0,
  study_leave_taken NUMERIC(3,1) DEFAULT 0,
  unpaid_leave_taken NUMERIC(4,1) DEFAULT 0,
  toil_accrued NUMERIC(4,1) DEFAULT 0,  -- time off in lieu
  toil_taken NUMERIC(4,1) DEFAULT 0,

  -- Policy reference
  leave_policy TEXT DEFAULT 'standard',  -- school can define policies
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, staff_id, academic_year)
);

CREATE INDEX idx_leave_entitlements_org_year ON leave_entitlements(organization_id, academic_year);

-- ============================================================
-- 3. LEAVE REQUESTS (approval workflow)
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,

  leave_type TEXT NOT NULL CHECK (leave_type IN (
    'annual_leave', 'compassionate', 'parental', 'study',
    'unpaid', 'toil', 'medical_appointment', 'jury_service',
    'bereavement', 'religious_observance', 'other'
  )),

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_day_start BOOLEAN DEFAULT false,  -- PM only on start date
  half_day_end BOOLEAN DEFAULT false,    -- AM only on end date
  total_days NUMERIC(4,1) NOT NULL,

  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'withdrawn')),

  -- Approval chain
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  -- If cover needed
  cover_required BOOLEAN DEFAULT false,
  cover_arrangement_id UUID REFERENCES cover_arrangements(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_org ON leave_requests(organization_id);
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id, status);
CREATE INDEX idx_leave_requests_pending ON leave_requests(organization_id, status) WHERE status = 'pending';

-- ============================================================
-- 4. PAY SCALES REFERENCE (DfE rates, updated annually)
-- ============================================================
CREATE TABLE IF NOT EXISTS pay_scales_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,  -- '2025-2026'
  scale_name TEXT NOT NULL,  -- 'MPS', 'UPS', 'Leadership', 'Support-A' through 'Support-H'
  pay_point TEXT NOT NULL,   -- 'M1', 'UPS3', 'L18', 'SCP6'
  annual_salary NUMERIC(10,2) NOT NULL,
  hourly_rate NUMERIC(8,2),  -- for support staff
  region TEXT NOT NULL DEFAULT 'rest_of_england'
    CHECK (region IN ('inner_london', 'outer_london', 'london_fringe', 'rest_of_england')),
  effective_from DATE,
  notes TEXT,

  UNIQUE(academic_year, scale_name, pay_point, region)
);

-- Seed 2025-2026 teacher pay scales (rest of England)
INSERT INTO pay_scales_reference (academic_year, scale_name, pay_point, annual_salary, region) VALUES
  ('2025-2026', 'MPS', 'M1', 31650, 'rest_of_england'),
  ('2025-2026', 'MPS', 'M2', 33483, 'rest_of_england'),
  ('2025-2026', 'MPS', 'M3', 35449, 'rest_of_england'),
  ('2025-2026', 'MPS', 'M4', 37536, 'rest_of_england'),
  ('2025-2026', 'MPS', 'M5', 39733, 'rest_of_england'),
  ('2025-2026', 'MPS', 'M6', 42233, 'rest_of_england'),
  ('2025-2026', 'UPS', 'U1', 44030, 'rest_of_england'),
  ('2025-2026', 'UPS', 'U2', 45546, 'rest_of_england'),
  ('2025-2026', 'UPS', 'U3', 47185, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L1', 47185, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L6', 53380, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L11', 60488, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L18', 74283, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L24', 88530, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L31', 105258, 'rest_of_england'),
  ('2025-2026', 'Leadership', 'L43', 131056, 'rest_of_england'),
  -- Unqualified teacher scale
  ('2025-2026', 'UQT', 'UQ1', 22924, 'rest_of_england'),
  ('2025-2026', 'UQT', 'UQ6', 33366, 'rest_of_england'),
  -- TLR payments
  ('2025-2026', 'TLR', 'TLR2_min', 3214, 'rest_of_england'),
  ('2025-2026', 'TLR', 'TLR2_max', 7847, 'rest_of_england'),
  ('2025-2026', 'TLR', 'TLR1_min', 9272, 'rest_of_england'),
  ('2025-2026', 'TLR', 'TLR1_max', 16461, 'rest_of_england'),
  -- SEN allowance
  ('2025-2026', 'SEN', 'SEN_min', 2539, 'rest_of_england'),
  ('2025-2026', 'SEN', 'SEN_max', 5009, 'rest_of_england')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. PERSONNEL FOLDER LINKS (Drive/OneDrive per staff member)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,

  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive', 'sharepoint')),
  folder_id TEXT NOT NULL,      -- Drive folder ID or OneDrive/SharePoint item ID
  folder_url TEXT,              -- human-readable link
  folder_name TEXT,             -- e.g. "Jane Smith - Personnel"

  -- Subfolder IDs (optional — school may not have this structure)
  contract_folder_id TEXT,
  absence_folder_id TEXT,
  performance_folder_id TEXT,
  dbs_folder_id TEXT,
  training_folder_id TEXT,

  -- Data classification
  sensitivity_level TEXT NOT NULL DEFAULT 'confidential'
    CHECK (sensitivity_level IN ('internal', 'confidential', 'highly_confidential_hr')),

  -- Sync state
  last_scanned_at TIMESTAMPTZ,
  file_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, staff_id, provider)
);

CREATE INDEX idx_staff_doc_folders_org ON staff_document_folders(organization_id);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Staff contracts: org members read, SLT+ manage
ALTER TABLE staff_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_contracts_read ON staff_contracts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY staff_contracts_manage ON staff_contracts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Leave entitlements: org members read own or SLT read all
ALTER TABLE leave_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY leave_entitlements_read ON leave_entitlements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY leave_entitlements_manage ON leave_entitlements
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Leave requests: staff can create own, SLT can manage all
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY leave_requests_read ON leave_requests
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY leave_requests_manage ON leave_requests
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Pay scales: public reference data, anyone can read
ALTER TABLE pay_scales_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_scales_read ON pay_scales_reference
  FOR SELECT USING (true);

-- Staff document folders: org members read, SLT manage
ALTER TABLE staff_document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_doc_folders_read ON staff_document_folders
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY staff_doc_folders_manage ON staff_document_folders
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'headteacher', 'slt')
    )
  );

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Calculate term-time-only leave entitlement
CREATE OR REPLACE FUNCTION calculate_tto_leave(
  base_entitlement NUMERIC,
  weeks_per_year NUMERIC,
  fte NUMERIC DEFAULT 1.0
) RETURNS NUMERIC AS $$
BEGIN
  -- Formula: base_days × (weeks_worked / 52.14) × FTE
  -- 52.14 = average weeks per year accounting for leap years
  RETURN ROUND(base_entitlement * (weeks_per_year / 52.14) * fte, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate total employment cost including on-costs
CREATE OR REPLACE FUNCTION calculate_total_cost(
  salary NUMERIC,
  on_costs_percent NUMERIC DEFAULT 28.68
) RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(salary * (1 + on_costs_percent / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 8. SEED AURORA PRIMARY CONTRACTS (test data)
-- ============================================================
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%Aurora%' LIMIT 1;
  IF v_org_id IS NULL THEN RETURN; END IF;

  -- Insert contracts for existing Aurora staff
  INSERT INTO staff_contracts (organization_id, staff_id, contract_type, employment_type, fte, start_date, weeks_per_year, hours_per_week, pay_scale, pay_point, salary_fte, notice_period_weeks, working_days, source)
  SELECT
    v_org_id,
    sd.id,
    CASE
      WHEN sd.job_title ILIKE '%supply%' THEN 'supply'
      WHEN sd.job_title ILIKE '%casual%' OR sd.job_title ILIKE '%lunchtime%' THEN 'casual'
      ELSE 'permanent'
    END,
    CASE
      WHEN sd.role_category IN ('teaching_assistant', 'support') AND sd.job_title NOT ILIKE '%full%' THEN 'term_time_only'
      WHEN sd.role_category = 'teaching' THEN 'full_time'
      WHEN sd.job_title ILIKE '%caretaker%' THEN 'full_time'
      WHEN sd.job_title ILIKE '%cleaner%' OR sd.job_title ILIKE '%lunchtime%' THEN 'term_time_only'
      ELSE 'full_time'
    END,
    CASE
      WHEN sd.job_title ILIKE '%part%' OR sd.job_title ILIKE '%0.%' THEN 0.60
      WHEN sd.job_title ILIKE '%lunchtime%' THEN 0.20
      WHEN sd.job_title ILIKE '%cleaner%' THEN 0.30
      ELSE 1.00
    END,
    '2024-09-01'::DATE,  -- academic year start
    CASE
      WHEN sd.role_category = 'teaching' THEN 52.0
      WHEN sd.job_title ILIKE '%caretaker%' THEN 52.0
      ELSE 39.0  -- term-time-only default
    END,
    CASE
      WHEN sd.role_category = 'teaching' THEN 32.5  -- directed time
      WHEN sd.job_title ILIKE '%lunchtime%' THEN 7.5
      WHEN sd.job_title ILIKE '%cleaner%' THEN 10.0
      ELSE 37.0  -- standard support
    END,
    CASE
      WHEN sd.role_category = 'teaching' AND sd.job_title ILIKE '%head%' THEN 'Leadership'
      WHEN sd.role_category = 'teaching' AND sd.job_title ILIKE '%deputy%' THEN 'Leadership'
      WHEN sd.role_category = 'teaching' THEN 'MPS'
      ELSE NULL
    END,
    CASE
      WHEN sd.job_title ILIKE '%headteacher%' THEN 'L18'
      WHEN sd.job_title ILIKE '%deputy%' THEN 'L11'
      WHEN sd.job_title ILIKE '%phase lead%' THEN 'M6'
      WHEN sd.role_category = 'teaching' THEN 'M3'
      ELSE NULL
    END,
    CASE
      WHEN sd.job_title ILIKE '%headteacher%' THEN 74283
      WHEN sd.job_title ILIKE '%deputy%' THEN 60488
      WHEN sd.job_title ILIKE '%phase lead%' THEN 42233
      WHEN sd.role_category = 'teaching' THEN 35449
      ELSE NULL
    END,
    CASE
      WHEN sd.job_title ILIKE '%head%' THEN 13  -- 3 months
      WHEN sd.role_category = 'teaching' THEN 8  -- half term
      ELSE 4  -- 4 weeks
    END,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    'manual'
  FROM staff_directory sd
  WHERE sd.organization_id = v_org_id
    AND sd.is_active = true
  ON CONFLICT DO NOTHING;
END $$;
