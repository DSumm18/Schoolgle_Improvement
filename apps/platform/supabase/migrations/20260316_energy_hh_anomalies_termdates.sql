-- Half-hourly readings
CREATE TABLE IF NOT EXISTS energy_hh_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  reading_timestamp TIMESTAMPTZ NOT NULL,
  kwh NUMERIC(10,3) NOT NULL,
  day_type TEXT CHECK (day_type IN ('weekday', 'weekend', 'holiday', 'inset')),
  is_school_day BOOLEAN DEFAULT false,
  is_holiday BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hh_readings_meter_ts ON energy_hh_readings(meter_id, reading_timestamp);
CREATE INDEX IF NOT EXISTS idx_hh_readings_org ON energy_hh_readings(organization_id);
CREATE INDEX IF NOT EXISTS idx_hh_readings_org_ts ON energy_hh_readings(organization_id, reading_timestamp);

-- Energy anomalies
CREATE TABLE IF NOT EXISTS energy_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_id UUID REFERENCES energy_meters(id),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('overnight_usage', 'weekend_spike', 'holiday_heating', 'baseload_increase', 'unusual_pattern', 'meter_fault')),
  title TEXT NOT NULL,
  description TEXT,
  detected_date DATE NOT NULL,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  estimated_waste_kwh NUMERIC(10,1),
  estimated_waste_cost NUMERIC(10,2),
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'resolved', 'accepted')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_energy_anomalies_org ON energy_anomalies(organization_id);

-- School term dates for energy analysis
CREATE TABLE IF NOT EXISTS school_term_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_term_start DATE,
  half_term_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, academic_year, term_name)
);

CREATE INDEX IF NOT EXISTS idx_term_dates_org ON school_term_dates(organization_id);

-- Mileage claims for Scope 3 carbon reporting
CREATE TABLE IF NOT EXISTS mileage_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  claim_date DATE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  miles NUMERIC(8,1) NOT NULL,
  purpose TEXT,
  rate_pence NUMERIC(5,1) DEFAULT 45.0,
  amount_pence NUMERIC(10,0) GENERATED ALWAYS AS (miles * rate_pence) STORED,
  vehicle_type TEXT DEFAULT 'car' CHECK (vehicle_type IN ('car', 'motorcycle', 'bicycle')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mileage_claims_org ON mileage_claims(organization_id);

-- Enable RLS on all new tables
ALTER TABLE energy_hh_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_term_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS energy_hh_readings_org_access ON energy_hh_readings;
CREATE POLICY energy_hh_readings_org_access ON energy_hh_readings FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS energy_anomalies_org_access ON energy_anomalies;
CREATE POLICY energy_anomalies_org_access ON energy_anomalies FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS school_term_dates_org_access ON school_term_dates;
CREATE POLICY school_term_dates_org_access ON school_term_dates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS mileage_claims_org_access ON mileage_claims;
CREATE POLICY mileage_claims_org_access ON mileage_claims FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text));
