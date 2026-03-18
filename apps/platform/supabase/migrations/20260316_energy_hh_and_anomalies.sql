-- Migration: Energy Half-Hourly Readings + School Term Dates
-- Created: 2026-03-16
-- Description:
--   1. energy_hh_readings — half-hourly smart meter data for electricity
--   2. school_term_dates — term date ranges for energy/attendance analysis
--   Note: energy_anomalies already exists in 20260311_data_validation_floor_plans.sql

BEGIN;

-- ============================================================================
-- 1. energy_hh_readings — half-hourly smart meter data
-- ============================================================================

CREATE TABLE IF NOT EXISTS energy_hh_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  reading_timestamp TIMESTAMPTZ NOT NULL,
  kwh NUMERIC(10,3) NOT NULL,
  day_type TEXT CHECK (day_type IN ('weekday_term', 'weekday_holiday', 'weekend_term', 'weekend_holiday', 'bank_holiday', 'inset')),
  is_school_day BOOLEAN DEFAULT false,
  is_holiday BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'smart_meter' CHECK (source IN ('smart_meter', 'estimated', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hh_readings_meter_ts
  ON energy_hh_readings(meter_id, reading_timestamp);

CREATE INDEX IF NOT EXISTS idx_hh_readings_org
  ON energy_hh_readings(organization_id);

CREATE INDEX IF NOT EXISTS idx_hh_readings_org_ts
  ON energy_hh_readings(organization_id, reading_timestamp);

-- Prevent duplicate readings for same meter/timestamp
CREATE UNIQUE INDEX IF NOT EXISTS idx_hh_readings_unique
  ON energy_hh_readings(meter_id, reading_timestamp);

-- ============================================================================
-- 2. school_term_dates — term date ranges for energy/attendance analysis
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_school_term_dates_org
  ON school_term_dates(organization_id);

-- ============================================================================
-- 3. RLS
-- ============================================================================

ALTER TABLE energy_hh_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_term_dates ENABLE ROW LEVEL SECURITY;

-- energy_hh_readings policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_hh_readings' AND policyname = 'energy_hh_readings_select'
  ) THEN
    CREATE POLICY energy_hh_readings_select ON energy_hh_readings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_hh_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_hh_readings' AND policyname = 'energy_hh_readings_insert'
  ) THEN
    CREATE POLICY energy_hh_readings_insert ON energy_hh_readings
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_hh_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_hh_readings' AND policyname = 'energy_hh_readings_update'
  ) THEN
    CREATE POLICY energy_hh_readings_update ON energy_hh_readings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_hh_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_hh_readings' AND policyname = 'energy_hh_readings_delete'
  ) THEN
    CREATE POLICY energy_hh_readings_delete ON energy_hh_readings
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_hh_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- school_term_dates policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_term_dates' AND policyname = 'school_term_dates_select'
  ) THEN
    CREATE POLICY school_term_dates_select ON school_term_dates
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_term_dates.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_term_dates' AND policyname = 'school_term_dates_insert'
  ) THEN
    CREATE POLICY school_term_dates_insert ON school_term_dates
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_term_dates.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_term_dates' AND policyname = 'school_term_dates_update'
  ) THEN
    CREATE POLICY school_term_dates_update ON school_term_dates
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_term_dates.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_term_dates' AND policyname = 'school_term_dates_delete'
  ) THEN
    CREATE POLICY school_term_dates_delete ON school_term_dates
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_term_dates.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- Service role policies (bypass RLS for scripts)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_hh_readings' AND policyname = 'service_energy_hh_readings'
  ) THEN
    CREATE POLICY service_energy_hh_readings ON energy_hh_readings FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_term_dates' AND policyname = 'service_school_term_dates'
  ) THEN
    CREATE POLICY service_school_term_dates ON school_term_dates FOR ALL TO service_role USING (true);
  END IF;
END $$;

COMMIT;
