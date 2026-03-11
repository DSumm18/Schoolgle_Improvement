-- Lettings & Room Booking + Condition Survey Tables
-- Creates tables for:
--   1. Facilities available for letting
--   2. Bookings and hirers
--   3. Condition survey elements
--   4. Governor visits

-- ═══════════════════════════════════════════════════════════════════════
-- 1. lettings_facilities — rooms/spaces available for hire
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lettings_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN (
    'hall', 'sports_hall', 'classroom', 'field', 'playground',
    'kitchen', 'meeting_room', 'studio', 'other'
  )),
  capacity INT,
  hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  community_rate NUMERIC(8,2),
  charity_rate NUMERIC(8,2),
  amenities TEXT[] DEFAULT '{}',
  available_slots TEXT[] DEFAULT '{}',
  block_booking_discount NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lettings_facilities_org
  ON lettings_facilities(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. lettings_bookings — individual bookings
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lettings_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES lettings_facilities(id) ON DELETE CASCADE,

  -- Hirer details
  hirer_name TEXT NOT NULL,
  hirer_email TEXT,
  hirer_phone TEXT,
  hirer_organization TEXT,
  hirer_type TEXT NOT NULL CHECK (hirer_type IN (
    'community', 'commercial', 'charity', 'staff', 'internal'
  )),

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  recurring_frequency TEXT CHECK (recurring_frequency IS NULL OR recurring_frequency IN (
    'weekly', 'fortnightly', 'monthly'
  )),
  recurring_end_date DATE,
  parent_booking_id UUID REFERENCES lettings_bookings(id) ON DELETE SET NULL,

  -- Status and financials
  status TEXT NOT NULL DEFAULT 'enquiry' CHECK (status IN (
    'enquiry', 'provisional', 'confirmed', 'cancelled', 'completed'
  )),
  total_charge NUMERIC(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  invoice_sent BOOLEAN DEFAULT false,
  payment_received BOOLEAN DEFAULT false,

  -- Compliance
  safeguarding_checked BOOLEAN DEFAULT false,
  insurance_cert_provided BOOLEAN DEFAULT false,
  risk_assessment_provided BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lettings_bookings_org_date
  ON lettings_bookings(organization_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_lettings_bookings_facility
  ON lettings_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_lettings_bookings_status
  ON lettings_bookings(status);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. condition_survey_elements — building condition assessments
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS condition_survey_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,

  category TEXT NOT NULL CHECK (category IN (
    'structure', 'roof', 'external_walls', 'windows_doors',
    'internal_finishes', 'floors', 'ceilings', 'mechanical',
    'electrical', 'fire_safety', 'accessibility', 'external_areas'
  )),
  element TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  description TEXT,
  estimated_cost NUMERIC(12,2),
  priority TEXT NOT NULL DEFAULT 'desirable' CHECK (priority IN (
    'urgent', 'essential', 'desirable', 'cosmetic'
  )),
  photo_url TEXT,

  surveyed_by UUID,
  surveyed_by_name TEXT,
  surveyed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  next_survey_due DATE,

  -- Risk integration
  linked_risk_id UUID,
  linked_task_id UUID,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_condition_elements_org
  ON condition_survey_elements(organization_id);
CREATE INDEX IF NOT EXISTS idx_condition_elements_grade
  ON condition_survey_elements(grade);
CREATE INDEX IF NOT EXISTS idx_condition_elements_location
  ON condition_survey_elements(location_id);
CREATE INDEX IF NOT EXISTS idx_condition_elements_priority
  ON condition_survey_elements(priority) WHERE priority IN ('urgent', 'essential');

-- ═══════════════════════════════════════════════════════════════════════
-- 4. governor_visits — extend existing table with new columns
-- ═══════════════════════════════════════════════════════════════════════

-- Table already exists from governance migration. Add new columns additively.
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS focus_area TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS governor_name TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS rooms_to_visit UUID[] DEFAULT '{}';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS staff_to_meet TEXT[] DEFAULT '{}';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS key_questions JSONB DEFAULT '[]';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS documents_to_review TEXT[] DEFAULT '{}';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS strengths TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS areas_for_development TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS agreed_actions JSONB DEFAULT '[]';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS overall_rag TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS evidence_tags TEXT[] DEFAULT '{}';
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS report_text TEXT;
ALTER TABLE governor_visits ADD COLUMN IF NOT EXISTS planned_date DATE;

-- Backfill planned_date from existing scheduled_date column
UPDATE governor_visits SET planned_date = scheduled_date WHERE planned_date IS NULL AND scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_governor_visits_org_date
  ON governor_visits(organization_id, planned_date DESC);
CREATE INDEX IF NOT EXISTS idx_governor_visits_focus
  ON governor_visits(focus_area);
CREATE INDEX IF NOT EXISTS idx_governor_visits_status
  ON governor_visits(status);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE lettings_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lettings_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_survey_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE governor_visits ENABLE ROW LEVEL SECURITY;

-- Lettings facilities
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_facilities_select') THEN
  CREATE POLICY lettings_facilities_select ON lettings_facilities FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_facilities_insert') THEN
  CREATE POLICY lettings_facilities_insert ON lettings_facilities FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_facilities_update') THEN
  CREATE POLICY lettings_facilities_update ON lettings_facilities FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Lettings bookings
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_bookings_select') THEN
  CREATE POLICY lettings_bookings_select ON lettings_bookings FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_bookings_insert') THEN
  CREATE POLICY lettings_bookings_insert ON lettings_bookings FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lettings_bookings_update') THEN
  CREATE POLICY lettings_bookings_update ON lettings_bookings FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Condition survey
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'condition_elements_select') THEN
  CREATE POLICY condition_elements_select ON condition_survey_elements FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'condition_elements_insert') THEN
  CREATE POLICY condition_elements_insert ON condition_survey_elements FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'condition_elements_update') THEN
  CREATE POLICY condition_elements_update ON condition_survey_elements FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Governor visits
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'governor_visits_select') THEN
  CREATE POLICY governor_visits_select ON governor_visits FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'governor_visits_insert') THEN
  CREATE POLICY governor_visits_insert ON governor_visits FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'governor_visits_update') THEN
  CREATE POLICY governor_visits_update ON governor_visits FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;
