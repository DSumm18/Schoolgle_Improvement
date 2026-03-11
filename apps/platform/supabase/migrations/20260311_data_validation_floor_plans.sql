-- Data Validation Pipeline & Floor Plans / Energy Management Migration
-- Creates tables for:
--   1. AI data extraction → human validation pipeline (extracted_data, validated_data, data_validation_log)
--   2. Spatial estates management (estates_locations, floor_plans, asset_locations, asset_qr_scans)
--   3. Energy monitoring (energy_readings, energy_anomalies)

-- ═══════════════════════════════════════════════════════════════════════
-- 1. extracted_data — AI-extracted, unvalidated data from documents
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID,
  document_name TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'energy_bill', 'payroll_report', 'invoice', 'contractor_report', 'fms_report',
    'dbs_certificate', 'fire_ra', 'condition_survey', 'insurance_cert', 'gas_cert',
    'eicr', 'other'
  )),
  extraction_model TEXT,
  extracted_fields JSONB NOT NULL,
  cross_checks JSONB DEFAULT '{}',
  overall_confidence NUMERIC(5,2),
  anomalies_detected TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'pending_review', 'confirmed', 'edited_and_confirmed', 'rejected', 'expired'
  )),
  target_modules TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_extracted_data_org_status
  ON extracted_data(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_extracted_data_org_created
  ON extracted_data(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_data_doc_type
  ON extracted_data(document_type);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. validated_data — human-confirmed data (source of truth)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS validated_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  extracted_data_id UUID REFERENCES extracted_data(id) ON DELETE SET NULL,
  confirmed_fields JSONB NOT NULL,
  user_edits JSONB DEFAULT '{}',
  data_type TEXT NOT NULL CHECK (data_type IN (
    'energy_reading', 'invoice_amount', 'payroll_entry', 'compliance_cert',
    'meter_reading', 'asset_detail', 'pay_scale_entry'
  )),
  period_start DATE,
  period_end DATE,
  validated_by UUID NOT NULL,
  validated_by_name TEXT,
  validated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  distributed_to JSONB DEFAULT '[]',
  superseded_by UUID,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_validated_data_org_type
  ON validated_data(organization_id, data_type);
CREATE INDEX IF NOT EXISTS idx_validated_data_extracted
  ON validated_data(extracted_data_id);
CREATE INDEX IF NOT EXISTS idx_validated_data_current
  ON validated_data(is_current) WHERE is_current = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. data_validation_log — append-only audit trail
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS data_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_data_id UUID NOT NULL REFERENCES extracted_data(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'auto_extracted', 'cross_check_passed', 'cross_check_failed',
    'user_reviewed', 'confirmed', 'edited_and_confirmed', 'rejected',
    'post_commit_anomaly', 'superseded', 'expired'
  )),
  user_id UUID,
  user_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_validation_log_extracted
  ON data_validation_log(extracted_data_id, created_at);
CREATE INDEX IF NOT EXISTS idx_validation_log_org
  ON data_validation_log(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. estates_locations — rooms, buildings, floors, outdoor areas
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS estates_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID,
  parent_location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN (
    'site', 'building', 'floor', 'room', 'outdoor_area',
    'corridor', 'stairwell', 'plant_room', 'storage'
  )),
  room_code TEXT,
  floor_number INT,
  area_sqm NUMERIC(8,2),
  capacity INT,
  current_use TEXT,
  accessibility TEXT DEFAULT 'full' CHECK (accessibility IN ('full', 'limited', 'none')),
  accessibility_notes TEXT,
  hazards TEXT[] DEFAULT '{}',
  hazard_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estates_locations_org
  ON estates_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_locations_building
  ON estates_locations(building_id);
CREATE INDEX IF NOT EXISTS idx_estates_locations_parent
  ON estates_locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_estates_locations_type
  ON estates_locations(location_type);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. floor_plans — uploaded/generated building plans
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  floor_number INT,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'cad_dxf', 'cad_dwg', 'pdf', 'photo', 'manual_draw', 'satellite'
  )),
  source_file_url TEXT,
  svg_data TEXT,
  room_polygons JSONB DEFAULT '[]',
  extraction_confidence NUMERIC(5,2),
  validated BOOLEAN DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  scale_factor NUMERIC(8,4),
  dimensions JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_floor_plans_org
  ON floor_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_building
  ON floor_plans(building_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. asset_locations — pins assets to positions on floor plans
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS asset_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,
  position_x NUMERIC(8,2),
  position_y NUMERIC(8,2),
  icon_type TEXT CHECK (icon_type IS NULL OR icon_type IN (
    'fire_extinguisher', 'alarm_call_point', 'stop_cock', 'boiler',
    'distribution_board', 'asbestos', 'first_aid', 'defibrillator',
    'emergency_exit', 'fire_door', 'smoke_detector', 'cctv',
    'water_outlet', 'gas_meter', 'electric_meter', 'solar_panel', 'other'
  )),
  label TEXT,
  qr_code_id TEXT,
  nfc_tag_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_locations_org
  ON asset_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_locations_asset
  ON asset_locations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_locations_location
  ON asset_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_asset_locations_floor_plan
  ON asset_locations(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_asset_locations_qr
  ON asset_locations(qr_code_id) WHERE qr_code_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. asset_qr_scans — append-only scan log
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS asset_qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_location_id UUID REFERENCES asset_locations(id) ON DELETE SET NULL,
  asset_id UUID,
  scanned_by UUID,
  scanned_by_name TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  scan_type TEXT CHECK (scan_type IS NULL OR scan_type IN (
    'check', 'issue_report', 'service', 'inspection', 'info_view'
  )),
  scan_context TEXT CHECK (scan_context IS NULL OR scan_context IN (
    'daily_check', 'contractor_visit', 'ad_hoc', 'new_starter_tour'
  )),
  result JSONB,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_asset_location
  ON asset_qr_scans(asset_location_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_org
  ON asset_qr_scans(organization_id, scanned_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 8. energy_readings — meter readings and consumption data
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS energy_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_id TEXT NOT NULL,
  meter_type TEXT NOT NULL CHECK (meter_type IN (
    'electricity', 'gas', 'water', 'solar_generation', 'solar_export'
  )),
  reading_date TIMESTAMPTZ NOT NULL,
  reading_value NUMERIC(14,2),
  reading_type TEXT DEFAULT 'actual' CHECK (reading_type IN (
    'actual', 'estimated', 'hh_data'
  )),
  consumption_kwh NUMERIC(12,2),
  cost_amount NUMERIC(10,2),
  cost_rate NUMERIC(8,4),
  standing_charge NUMERIC(8,2),
  carbon_kg NUMERIC(10,2),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'manual', 'bill_scan', 'hh_upload', 'smart_meter', 'iot'
  )),
  validated_data_id UUID REFERENCES validated_data(id) ON DELETE SET NULL,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  data_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_energy_readings_meter
  ON energy_readings(organization_id, meter_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_energy_readings_type
  ON energy_readings(meter_type);

-- ═══════════════════════════════════════════════════════════════════════
-- 9. energy_anomalies — detected waste/issues
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS energy_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'weekend_usage', 'overnight_excess', 'holiday_heating', 'spike',
    'baseload_increase', 'unusual_pattern'
  )),
  title TEXT NOT NULL,
  description TEXT,
  detected_date DATE,
  estimated_waste_kwh NUMERIC(10,2),
  estimated_waste_cost NUMERIC(10,2),
  estimated_annual_cost NUMERIC(10,2),
  meter_id TEXT,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  evidence JSONB,
  status TEXT DEFAULT 'detected' CHECK (status IN (
    'detected', 'investigating', 'confirmed', 'resolved', 'accepted'
  )),
  task_id UUID,
  risk_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_energy_anomalies_org_status
  ON energy_anomalies(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_type
  ON energy_anomalies(anomaly_type);


-- ═══════════════════════════════════════════════════════════════════════
-- RLS — Enable Row Level Security on all tables
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE validated_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE estates_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_anomalies ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════
-- RLS Policies — Organization-based access via organization_members
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: standard org membership check subquery
-- organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())

-- ─── extracted_data ────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_data' AND policyname = 'extracted_data_select') THEN
    CREATE POLICY "extracted_data_select" ON extracted_data FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_data' AND policyname = 'extracted_data_insert') THEN
    CREATE POLICY "extracted_data_insert" ON extracted_data FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_data' AND policyname = 'extracted_data_update') THEN
    CREATE POLICY "extracted_data_update" ON extracted_data FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_data' AND policyname = 'extracted_data_delete') THEN
    CREATE POLICY "extracted_data_delete" ON extracted_data FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── validated_data ────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'validated_data' AND policyname = 'validated_data_select') THEN
    CREATE POLICY "validated_data_select" ON validated_data FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'validated_data' AND policyname = 'validated_data_insert') THEN
    CREATE POLICY "validated_data_insert" ON validated_data FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'validated_data' AND policyname = 'validated_data_update') THEN
    CREATE POLICY "validated_data_update" ON validated_data FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'validated_data' AND policyname = 'validated_data_delete') THEN
    CREATE POLICY "validated_data_delete" ON validated_data FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── data_validation_log (APPEND-ONLY: SELECT + INSERT only) ──────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_validation_log' AND policyname = 'validation_log_select') THEN
    CREATE POLICY "validation_log_select" ON data_validation_log FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_validation_log' AND policyname = 'validation_log_insert') THEN
    CREATE POLICY "validation_log_insert" ON data_validation_log FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- No UPDATE or DELETE policies — append-only audit log

-- ─── estates_locations ─────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estates_locations' AND policyname = 'estates_locations_select') THEN
    CREATE POLICY "estates_locations_select" ON estates_locations FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estates_locations' AND policyname = 'estates_locations_insert') THEN
    CREATE POLICY "estates_locations_insert" ON estates_locations FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estates_locations' AND policyname = 'estates_locations_update') THEN
    CREATE POLICY "estates_locations_update" ON estates_locations FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estates_locations' AND policyname = 'estates_locations_delete') THEN
    CREATE POLICY "estates_locations_delete" ON estates_locations FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── floor_plans ───────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'floor_plans' AND policyname = 'floor_plans_select') THEN
    CREATE POLICY "floor_plans_select" ON floor_plans FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'floor_plans' AND policyname = 'floor_plans_insert') THEN
    CREATE POLICY "floor_plans_insert" ON floor_plans FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'floor_plans' AND policyname = 'floor_plans_update') THEN
    CREATE POLICY "floor_plans_update" ON floor_plans FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'floor_plans' AND policyname = 'floor_plans_delete') THEN
    CREATE POLICY "floor_plans_delete" ON floor_plans FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── asset_locations ───────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_locations' AND policyname = 'asset_locations_select') THEN
    CREATE POLICY "asset_locations_select" ON asset_locations FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_locations' AND policyname = 'asset_locations_insert') THEN
    CREATE POLICY "asset_locations_insert" ON asset_locations FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_locations' AND policyname = 'asset_locations_update') THEN
    CREATE POLICY "asset_locations_update" ON asset_locations FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_locations' AND policyname = 'asset_locations_delete') THEN
    CREATE POLICY "asset_locations_delete" ON asset_locations FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── asset_qr_scans (APPEND-ONLY: SELECT + INSERT only) ───────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_qr_scans' AND policyname = 'qr_scans_select') THEN
    CREATE POLICY "qr_scans_select" ON asset_qr_scans FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_qr_scans' AND policyname = 'qr_scans_insert') THEN
    CREATE POLICY "qr_scans_insert" ON asset_qr_scans FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- No UPDATE or DELETE policies — append-only scan log

-- ─── energy_readings ───────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_readings' AND policyname = 'energy_readings_select') THEN
    CREATE POLICY "energy_readings_select" ON energy_readings FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_readings' AND policyname = 'energy_readings_insert') THEN
    CREATE POLICY "energy_readings_insert" ON energy_readings FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_readings' AND policyname = 'energy_readings_update') THEN
    CREATE POLICY "energy_readings_update" ON energy_readings FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_readings' AND policyname = 'energy_readings_delete') THEN
    CREATE POLICY "energy_readings_delete" ON energy_readings FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── energy_anomalies ──────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_anomalies' AND policyname = 'energy_anomalies_select') THEN
    CREATE POLICY "energy_anomalies_select" ON energy_anomalies FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_anomalies' AND policyname = 'energy_anomalies_insert') THEN
    CREATE POLICY "energy_anomalies_insert" ON energy_anomalies FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_anomalies' AND policyname = 'energy_anomalies_update') THEN
    CREATE POLICY "energy_anomalies_update" ON energy_anomalies FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_anomalies' AND policyname = 'energy_anomalies_delete') THEN
    CREATE POLICY "energy_anomalies_delete" ON energy_anomalies FOR DELETE
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- Service Role Bypass Policies — full access for API routes
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_data' AND policyname = 'service_extracted_data') THEN
    CREATE POLICY "service_extracted_data" ON extracted_data FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'validated_data' AND policyname = 'service_validated_data') THEN
    CREATE POLICY "service_validated_data" ON validated_data FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_validation_log' AND policyname = 'service_validation_log') THEN
    CREATE POLICY "service_validation_log" ON data_validation_log FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estates_locations' AND policyname = 'service_estates_locations') THEN
    CREATE POLICY "service_estates_locations" ON estates_locations FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'floor_plans' AND policyname = 'service_floor_plans') THEN
    CREATE POLICY "service_floor_plans" ON floor_plans FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_locations' AND policyname = 'service_asset_locations') THEN
    CREATE POLICY "service_asset_locations" ON asset_locations FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_qr_scans' AND policyname = 'service_qr_scans') THEN
    CREATE POLICY "service_qr_scans" ON asset_qr_scans FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_readings' AND policyname = 'service_energy_readings') THEN
    CREATE POLICY "service_energy_readings" ON energy_readings FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'energy_anomalies' AND policyname = 'service_energy_anomalies') THEN
    CREATE POLICY "service_energy_anomalies" ON energy_anomalies FOR ALL TO service_role USING (true);
  END IF;
END $$;
