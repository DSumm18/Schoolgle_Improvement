-- Safeguarding Module — Schema alignment migration
-- Adds columns expected by the API routes to the tables created in 20260311_safeguarding_attendance_send_behaviour.sql
-- This migration is designed to be idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ═══════════════════════════════════════════════════════════════════════
-- 1. safeguarding_concerns — add missing columns for API compatibility
-- ═══════════════════════════════════════════════════════════════════════

-- Reference number (SG-YYYY-NNN format)
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Pupil display name (pseudonymised, e.g. "Pupil A") — maps from pupil_name_encrypted
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS pupil_display_name TEXT DEFAULT 'Unknown Pupil';

-- Pupil pseudonym ID (HMAC hash) — maps from pupil_id
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS pupil_pseudonym_id TEXT;

-- Location of the concern
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS location TEXT;

-- Date/time of concern (API naming convention)
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS date_of_concern DATE;
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS time_of_concern TIME;

-- Witnesses present
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS witnesses TEXT;

-- Immediate actions taken by reporter
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS immediate_actions_taken TEXT;

-- Assignment and follow-up
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE safeguarding_concerns ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Unique index on reference_number per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_safeguarding_concerns_ref
  ON safeguarding_concerns(organization_id, reference_number)
  WHERE reference_number IS NOT NULL;

-- Index on follow_up_date for overdue queries
CREATE INDEX IF NOT EXISTS idx_safeguarding_concerns_followup
  ON safeguarding_concerns(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND status NOT IN ('closed');

-- ═══════════════════════════════════════════════════════════════════════
-- 2. safeguarding_chronology — add missing columns
-- ═══════════════════════════════════════════════════════════════════════

-- Description (API uses 'description', migration uses 'summary')
ALTER TABLE safeguarding_chronology ADD COLUMN IF NOT EXISTS description TEXT;

-- Metadata JSONB for structured data
ALTER TABLE safeguarding_chronology ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Allow nullable recorded_by for anonymous concerns
DO $$
BEGIN
  -- Make recorded_by nullable if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'safeguarding_chronology'
      AND column_name = 'recorded_by'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE safeguarding_chronology ALTER COLUMN recorded_by DROP NOT NULL;
  END IF;

  -- Make recorded_by_name nullable if it exists and isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'safeguarding_chronology'
      AND column_name = 'recorded_by_name'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE safeguarding_chronology ALTER COLUMN recorded_by_name DROP NOT NULL;
  END IF;
END$$;

-- Expand entry_type check to include additional types used by the API
-- Drop and recreate the constraint
DO $$
BEGIN
  -- Drop the existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'safeguarding_chronology'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%entry_type%'
  ) THEN
    EXECUTE 'ALTER TABLE safeguarding_chronology DROP CONSTRAINT ' ||
      (SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'safeguarding_chronology'
         AND constraint_type = 'CHECK'
         AND constraint_name LIKE '%entry_type%'
       LIMIT 1);
  END IF;
END$$;

ALTER TABLE safeguarding_chronology ADD CONSTRAINT safeguarding_chron_entry_type_check
  CHECK (entry_type IN (
    'concern_raised', 'triage', 'note', 'phone_call', 'meeting',
    'referral_made', 'referral_outcome', 'home_visit', 'agency_contact',
    'review', 'status_change', 'escalation', 'closure',
    'severity_change', 'parent_contact', 'disclosure', 'observation',
    'follow_up', 'reopened'
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 3. safeguarding_referrals — add missing columns
-- ═══════════════════════════════════════════════════════════════════════

-- Reference number (REF-YYYY-NNN format)
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- API-compatible column names
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS referred_to_agency TEXT;
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS referred_to_contact TEXT;
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS referral_reason TEXT;
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('urgent', 'standard'));
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS outcome_status TEXT DEFAULT 'pending'
  CHECK (outcome_status IN ('pending', 'accepted', 'declined', 'assessment_in_progress', 'completed', 'withdrawn'));
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS referral_date DATE;
ALTER TABLE safeguarding_referrals ADD COLUMN IF NOT EXISTS supporting_documents JSONB;

-- Allow nullable referred_by_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'safeguarding_referrals'
      AND column_name = 'referred_by_name'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE safeguarding_referrals ALTER COLUMN referred_by_name DROP NOT NULL;
  END IF;
END$$;

-- Unique index on referral reference_number per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_safeguarding_referrals_ref
  ON safeguarding_referrals(organization_id, reference_number)
  WHERE reference_number IS NOT NULL;

-- Expand referral_type to include additional types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'safeguarding_referrals'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%referral_type%'
  ) THEN
    EXECUTE 'ALTER TABLE safeguarding_referrals DROP CONSTRAINT ' ||
      (SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'safeguarding_referrals'
         AND constraint_type = 'CHECK'
         AND constraint_name LIKE '%referral_type%'
       LIMIT 1);
  END IF;
END$$;

ALTER TABLE safeguarding_referrals ADD CONSTRAINT safeguarding_ref_type_check
  CHECK (referral_type IN (
    'cscs', 'police', 'lado', 'mash', 'early_help', 'camhs',
    'school_nurse', 'gp', 'health_visitor', 'educational_psychologist',
    'social_worker', 'other'
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES (idempotent — only create if not exists)
-- ═══════════════════════════════════════════════════════════════════════

-- Ensure RLS is enabled (idempotent)
ALTER TABLE safeguarding_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_chronology ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_referrals ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes using service role client)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_concerns_service_all') THEN
    CREATE POLICY safeguarding_concerns_service_all ON safeguarding_concerns
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_chronology_service_all') THEN
    CREATE POLICY safeguarding_chronology_service_all ON safeguarding_chronology
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safeguarding_referrals_service_all') THEN
    CREATE POLICY safeguarding_referrals_service_all ON safeguarding_referrals
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
