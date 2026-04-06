-- COMPLIANCE CHECK LIBRARY
-- Task 021: Seed Statutory Compliance Check Library
-- Master reference table of 150+ statutory and best practice compliance checks
-- that UK schools must manage. This is pre-configured product knowledge —
-- schools get this out of the box, not as an empty framework.

-- ============================================================================
-- 1. CREATE compliance_check_category ENUM TYPE
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE compliance_check_category AS ENUM (
    'fire_safety',
    'electrical',
    'gas',
    'asbestos',
    'legionella_water',
    'loler_lifting',
    'pssr_pressure',
    'puwer_equipment',
    'coshh_hazardous',
    'working_at_height',
    'workplace_general',
    'cdm_construction',
    'playground',
    'kitchen_catering',
    'trees_grounds',
    'insurance',
    'accessibility',
    'lightning',
    'radon',
    'oil_storage',
    'pest_control',
    'emergency_planning',
    'building_fabric',
    'security',
    'grounds_maintenance',
    'water_energy',
    'vehicles',
    'administration'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. CREATE compliance_check_frequency ENUM TYPE
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE compliance_check_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'termly',
    '6_monthly',
    'annually',
    '2_yearly',
    '3_yearly',
    '5_yearly',
    '10_yearly',
    'as_needed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. CREATE compliance_check_priority ENUM TYPE
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE compliance_check_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. CREATE compliance_checks TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name TEXT NOT NULL,
  regulatory_source TEXT NOT NULL,
  category compliance_check_category NOT NULL,
  subcategory TEXT NOT NULL,
  frequency compliance_check_frequency NOT NULL,
  responsible_role TEXT NOT NULL DEFAULT 'Site Manager',
  requires_competent_person BOOLEAN NOT NULL DEFAULT false,
  generates_certificate BOOLEAN NOT NULL DEFAULT false,
  is_statutory BOOLEAN NOT NULL DEFAULT true,
  guidance_text TEXT NOT NULL,
  consequence_of_noncompliance TEXT NOT NULL,
  default_priority compliance_check_priority NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.compliance_checks IS
'Master library of statutory and best practice compliance checks for UK school estates. Pre-configured product data — NOT user-generated.';

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_checks_category
  ON public.compliance_checks(category);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_frequency
  ON public.compliance_checks(frequency);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_is_statutory
  ON public.compliance_checks(is_statutory);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_priority
  ON public.compliance_checks(default_priority);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_active
  ON public.compliance_checks(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_category_statutory
  ON public.compliance_checks(category, is_statutory);

-- ============================================================================
-- 6. ENABLE RLS
-- ============================================================================

ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

-- This is reference data — all authenticated users can read
CREATE POLICY "compliance_checks_read" ON public.compliance_checks
  FOR SELECT TO authenticated
  USING (true);

-- Only service role can write (seed data, admin updates)
CREATE POLICY "compliance_checks_service_write" ON public.compliance_checks
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- 7. UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_compliance_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_checks_updated_at
  BEFORE UPDATE ON public.compliance_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_checks_updated_at();
