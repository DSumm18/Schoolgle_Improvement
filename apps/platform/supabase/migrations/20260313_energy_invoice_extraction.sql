-- ============================================================================
-- Energy Invoice Extraction Pipeline Tables
-- PDF invoices -> AI extraction -> structured data for Finance/Estates/Forecast
-- ============================================================================

-- Energy meters registry (one row per physical meter)
CREATE TABLE IF NOT EXISTS energy_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  meter_type TEXT NOT NULL CHECK (meter_type IN ('electricity', 'gas', 'water', 'solar_generation')),
  meter_reference TEXT NOT NULL,
  serial_number TEXT,
  location TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, meter_reference)
);

-- Energy invoices (one row per invoice PDF)
CREATE TABLE IF NOT EXISTS energy_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_name TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  account_reference TEXT,
  supply_period_start DATE,
  supply_period_end DATE,
  supply_days INTEGER,
  contract_reference TEXT,
  net_amount NUMERIC(12,2),
  vat_amount NUMERIC(12,2),
  vat_rate NUMERIC(5,2) DEFAULT 5.0,
  total_amount NUMERIC(12,2),
  energy_type TEXT CHECK (energy_type IN ('electricity', 'gas', 'water')),
  source_file_id TEXT,
  source_file_name TEXT,
  extraction_model TEXT,
  extraction_confidence NUMERIC(5,2),
  extraction_status TEXT DEFAULT 'extracted' CHECK (extraction_status IN ('extracted', 'verified', 'disputed', 'failed')),
  raw_extraction JSONB,
  finance_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, invoice_number, supplier_name)
);

-- Per-meter line items from each invoice
CREATE TABLE IF NOT EXISTS energy_invoice_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invoice_id UUID NOT NULL REFERENCES energy_invoices(id) ON DELETE CASCADE,
  meter_id UUID REFERENCES energy_meters(id),
  meter_reference TEXT,
  meter_location TEXT,
  reading_date DATE,
  previous_reading NUMERIC(12,1),
  current_reading NUMERIC(12,1),
  units_consumed NUMERIC(12,1),
  kwh_consumed NUMERIC(12,1),
  energy_charge NUMERIC(10,2),
  standing_charge NUMERIC(10,2),
  ccl_charge NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  unit_rate_pence NUMERIC(8,3),
  standing_rate_pence NUMERIC(8,3),
  ccl_rate_pence NUMERIC(8,3),
  daily_average_kwh NUMERIC(10,2),
  co2_tonnes NUMERIC(8,4),
  gas_calorific_value NUMERIC(6,2),
  gas_correction_factor NUMERIC(8,5),
  source TEXT DEFAULT 'invoice',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_energy_meters_org ON energy_meters(organization_id);
CREATE INDEX IF NOT EXISTS idx_energy_invoices_org ON energy_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_energy_invoices_period ON energy_invoices(organization_id, supply_period_start);
CREATE INDEX IF NOT EXISTS idx_energy_invoice_readings_inv ON energy_invoice_readings(invoice_id);
CREATE INDEX IF NOT EXISTS idx_energy_invoice_readings_meter ON energy_invoice_readings(meter_id);

-- RLS
ALTER TABLE energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_invoice_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY energy_meters_org ON energy_meters FOR ALL USING (
  organization_id IN (SELECT om.organization_id::uuid FROM organization_members om WHERE om.user_id = auth.uid()::text)
);
CREATE POLICY energy_invoices_org ON energy_invoices FOR ALL USING (
  organization_id IN (SELECT om.organization_id::uuid FROM organization_members om WHERE om.user_id = auth.uid()::text)
);
CREATE POLICY energy_invoice_readings_org ON energy_invoice_readings FOR ALL USING (
  organization_id IN (SELECT om.organization_id::uuid FROM organization_members om WHERE om.user_id = auth.uid()::text)
);
