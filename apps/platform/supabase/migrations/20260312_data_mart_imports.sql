-- Data Mart Import Hub
-- Unified pipeline for importing data from any school system into Schoolgle's data mart
-- Schoolgle is a DATA PROCESSOR, not controller. Schools own their data in source systems.

-- ============================================================
-- 1. DATA SOURCES (which systems a school has connected)
-- ============================================================
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- System identification
  system_name TEXT NOT NULL,  -- e.g. 'Arbor', 'SIMS', 'SIMS FMS', 'Sage', 'Every HR'
  system_category TEXT NOT NULL CHECK (system_category IN (
    'mis', 'finance', 'hr', 'payroll', 'cloud_storage', 'public_data', 'other'
  )),
  connection_type TEXT NOT NULL CHECK (connection_type IN (
    'api', 'csv_import', 'google_drive', 'onedrive', 'wonde', 'manual'
  )),

  -- Connection details (no credentials stored — OAuth tokens in separate secure store)
  api_base_url TEXT,
  wonde_school_id TEXT,
  drive_folder_id TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'pending')),
  last_sync_records INTEGER,
  last_sync_errors TEXT[],

  -- Data available from this source
  provides_staff BOOLEAN DEFAULT false,
  provides_pupils BOOLEAN DEFAULT false,
  provides_attendance BOOLEAN DEFAULT false,
  provides_finance BOOLEAN DEFAULT false,
  provides_hr BOOLEAN DEFAULT false,
  provides_payroll BOOLEAN DEFAULT false,
  provides_timetable BOOLEAN DEFAULT false,
  provides_documents BOOLEAN DEFAULT false,

  -- School's notes
  notes TEXT,
  setup_by UUID,
  setup_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, system_name)
);

CREATE INDEX idx_data_sources_org ON data_sources(organization_id);

-- ============================================================
-- 2. IMPORT LOG (every CSV/API sync recorded)
-- ============================================================
CREATE TABLE IF NOT EXISTS data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES data_sources(id),

  -- What was imported
  import_type TEXT NOT NULL CHECK (import_type IN (
    'staff', 'pupils', 'attendance', 'transactions', 'budget',
    'suppliers', 'payroll', 'absences', 'timetable', 'contracts',
    'assessment', 'census', 'other'
  )),
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'json', 'xml', 'api_sync')),
  file_size_bytes INTEGER,

  -- Import metadata
  academic_year TEXT,     -- '2025-2026'
  financial_year TEXT,    -- '2025-26' (April-March)
  period TEXT,            -- e.g. 'September 2025', 'Q2', 'Month 6'
  snapshot_date DATE,     -- point-in-time this data represents

  -- Results
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'mapped', 'validated', 'imported', 'failed', 'superseded'
  )),
  total_rows INTEGER,
  rows_imported INTEGER,
  rows_skipped INTEGER,
  rows_errored INTEGER,
  error_details JSONB,    -- [{row: 5, field: 'amount', error: 'not a number'}]

  -- Column mapping (how source columns mapped to Schoolgle fields)
  column_mapping JSONB,   -- {source_col: schoolgle_field, ...}
  unmapped_columns TEXT[], -- columns we couldn't auto-map

  -- The raw data (kept for audit trail — school can verify what we received)
  raw_headers TEXT[],
  raw_row_count INTEGER,
  raw_checksum TEXT,       -- SHA-256 of original file

  -- Who imported
  imported_by UUID,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  superseded_by UUID REFERENCES data_imports(id),  -- when a newer import replaces this one

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_imports_org ON data_imports(organization_id);
CREATE INDEX idx_data_imports_type ON data_imports(organization_id, import_type, snapshot_date DESC);

-- ============================================================
-- 3. FINANCE TRANSACTIONS (the mart table for all finance data)
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_id UUID REFERENCES data_imports(id),

  -- Transaction identity
  transaction_date DATE NOT NULL,
  transaction_ref TEXT,        -- source system reference (PO number, invoice number, journal ref)
  transaction_type TEXT CHECK (transaction_type IN (
    'purchase_order', 'invoice', 'payment', 'journal', 'receipt',
    'credit_note', 'accrual', 'prepayment', 'virement', 'other'
  )),

  -- Coding
  cost_centre TEXT,            -- school's own code (e.g. '1100', 'CURR', 'SEN')
  ledger_code TEXT,            -- nominal/GL code from their system
  cfr_code TEXT,               -- mapped to DfE CFR code (E01-E32, I01-I18)
  cfr_description TEXT,        -- human-readable CFR category

  -- Amount
  gross_amount NUMERIC(12,2) NOT NULL,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - COALESCE(vat_amount, 0)) STORED,

  -- Direction
  is_income BOOLEAN DEFAULT false,  -- true = income, false = expenditure

  -- Supplier/payee
  supplier_name TEXT,
  supplier_ref TEXT,           -- their supplier code

  -- Budget tracking
  budget_line TEXT,            -- which budget line this hits
  budget_amount NUMERIC(12,2), -- budgeted amount for this line (for variance calc)

  -- Description
  description TEXT,
  notes TEXT,

  -- Period
  financial_year TEXT,         -- '2025-26'
  period_number INTEGER,       -- 1-12 (April=1)
  academic_year TEXT,          -- '2025-2026'

  -- Source tracking
  source_system TEXT,          -- 'SIMS FMS', 'Sage', etc.
  source_row_number INTEGER,   -- row in the original CSV

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finance_tx_org ON finance_transactions(organization_id);
CREATE INDEX idx_finance_tx_date ON finance_transactions(organization_id, transaction_date);
CREATE INDEX idx_finance_tx_cfr ON finance_transactions(organization_id, cfr_code, financial_year);
CREATE INDEX idx_finance_tx_supplier ON finance_transactions(organization_id, supplier_name);
CREATE INDEX idx_finance_tx_import ON finance_transactions(import_id);

-- ============================================================
-- 4. FINANCE SUPPLIERS (consolidated supplier list)
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_id UUID REFERENCES data_imports(id),

  supplier_name TEXT NOT NULL,
  supplier_ref TEXT,           -- code from source system
  category TEXT,               -- e.g. 'utilities', 'curriculum_resources', 'ICT', 'catering'

  -- Contact (from source system, not entered by us)
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,

  -- Spend analysis (calculated from transactions)
  total_spend_ytd NUMERIC(12,2) DEFAULT 0,
  total_spend_last_year NUMERIC(12,2) DEFAULT 0,
  transaction_count_ytd INTEGER DEFAULT 0,
  last_transaction_date DATE,
  avg_transaction_value NUMERIC(12,2),

  -- Contract info (if available from source)
  contract_start DATE,
  contract_end DATE,
  contract_value NUMERIC(12,2),
  payment_terms TEXT,          -- e.g. '30 days', '14 days'

  -- Benchmarking flags
  is_framework_supplier BOOLEAN DEFAULT false,  -- on DfE/ESPO/YPO framework
  framework_name TEXT,

  source_system TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, supplier_name)
);

CREATE INDEX idx_finance_suppliers_org ON finance_suppliers(organization_id);

-- ============================================================
-- 5. BUDGET LINES (budget monitoring by CFR code)
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_id UUID REFERENCES data_imports(id),

  financial_year TEXT NOT NULL,  -- '2025-26'
  cfr_code TEXT NOT NULL,
  cfr_description TEXT,
  cost_centre TEXT,

  -- Budget vs actual
  budget_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  committed_amount NUMERIC(12,2) DEFAULT 0,  -- POs raised but not yet paid
  actual_amount NUMERIC(12,2) DEFAULT 0,
  forecast_amount NUMERIC(12,2),             -- year-end projection

  -- Calculated
  variance NUMERIC(12,2) GENERATED ALWAYS AS (budget_amount - actual_amount) STORED,
  spend_percent NUMERIC(5,1) GENERATED ALWAYS AS (
    CASE WHEN budget_amount > 0 THEN ROUND((actual_amount / budget_amount) * 100, 1) ELSE 0 END
  ) STORED,

  -- RAG status
  rag_status TEXT CHECK (rag_status IN ('green', 'amber', 'red')),
  notes TEXT,

  is_income BOOLEAN DEFAULT false,
  source_system TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, financial_year, cfr_code, cost_centre)
);

CREATE INDEX idx_budget_lines_org_year ON finance_budget_lines(organization_id, financial_year);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_sources_read ON data_sources
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );
CREATE POLICY data_sources_manage ON data_sources
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
    )
  );

ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_imports_read ON data_imports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );
CREATE POLICY data_imports_manage ON data_imports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
    )
  );

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_tx_read ON finance_transactions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );
CREATE POLICY finance_tx_manage ON finance_transactions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
    )
  );

ALTER TABLE finance_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_suppliers_read ON finance_suppliers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );
CREATE POLICY finance_suppliers_manage ON finance_suppliers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
    )
  );

ALTER TABLE finance_budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_lines_read ON finance_budget_lines
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );
CREATE POLICY budget_lines_manage ON finance_budget_lines
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
    )
  );

-- ============================================================
-- 7. VIEWS for cross-domain analysis
-- ============================================================

-- Supplier spend summary with YoY comparison
CREATE OR REPLACE VIEW supplier_spend_summary AS
SELECT
  ft.organization_id,
  ft.supplier_name,
  ft.financial_year,
  ft.cfr_code,
  COUNT(*) as transaction_count,
  SUM(ft.net_amount) as total_spend,
  AVG(ft.net_amount) as avg_transaction,
  MIN(ft.transaction_date) as first_transaction,
  MAX(ft.transaction_date) as last_transaction
FROM finance_transactions ft
WHERE ft.is_income = false
  AND ft.supplier_name IS NOT NULL
GROUP BY ft.organization_id, ft.supplier_name, ft.financial_year, ft.cfr_code;

-- Monthly spend profile (for seasonality analysis)
CREATE OR REPLACE VIEW monthly_spend_profile AS
SELECT
  ft.organization_id,
  ft.financial_year,
  ft.period_number,
  ft.cfr_code,
  ft.is_income,
  SUM(ft.net_amount) as total_amount,
  COUNT(*) as transaction_count
FROM finance_transactions ft
GROUP BY ft.organization_id, ft.financial_year, ft.period_number, ft.cfr_code, ft.is_income;

-- Staff cost as % of total (ICFP key metric)
CREATE OR REPLACE VIEW staffing_cost_ratio AS
SELECT
  bl.organization_id,
  bl.financial_year,
  SUM(CASE WHEN bl.cfr_code IN ('E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11','E12') THEN bl.actual_amount ELSE 0 END) as staff_costs,
  SUM(CASE WHEN bl.is_income = false THEN bl.actual_amount ELSE 0 END) as total_expenditure,
  SUM(CASE WHEN bl.is_income = true THEN bl.actual_amount ELSE 0 END) as total_income,
  CASE
    WHEN SUM(CASE WHEN bl.is_income = true THEN bl.actual_amount ELSE 0 END) > 0
    THEN ROUND(
      SUM(CASE WHEN bl.cfr_code IN ('E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11','E12') THEN bl.actual_amount ELSE 0 END)
      / SUM(CASE WHEN bl.is_income = true THEN bl.actual_amount ELSE 0 END) * 100, 1
    )
    ELSE 0
  END as staffing_percent
FROM finance_budget_lines bl
GROUP BY bl.organization_id, bl.financial_year;
