-- TASK 036: Security PII Remediation
-- Fixes VECTOR security findings #3, #4, #5

-- ═══════════════════════════════════════════════════════════════════════
-- Fix #3: pupils table stores first_name/last_name in plaintext
-- The API already pseudonymises via HMAC-SHA256, but the columns
-- should not exist in the schema. Drop them.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS pupils DROP COLUMN IF EXISTS first_name;
ALTER TABLE IF EXISTS pupils DROP COLUMN IF EXISTS last_name;
ALTER TABLE IF EXISTS pupils DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE IF EXISTS pupils DROP COLUMN IF EXISTS ethnicity;

-- ═══════════════════════════════════════════════════════════════════════
-- Fix #4: safeguarding_concerns.pupil_display_name stores freetext names
-- Replace with pupil_pseudonym_label (e.g. "Pupil A", "Pupil B") that
-- is auto-generated, never user-supplied PII.
-- Also tighten RLS to require org membership + teacher role minimum.
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the freetext column that could contain real names
ALTER TABLE IF EXISTS safeguarding_concerns DROP COLUMN IF EXISTS pupil_display_name;

-- Add a safe auto-label column (system-generated, e.g. "Pupil A")
ALTER TABLE IF EXISTS safeguarding_concerns
  ADD COLUMN IF NOT EXISTS pupil_pseudonym_label TEXT DEFAULT 'Unknown';

-- ═══════════════════════════════════════════════════════════════════════
-- Fix #5: staff_directory.national_insurance_number stored unencrypted
-- Remove the column entirely — NI numbers should not be stored in the
-- application database. Schools should use their payroll system for this.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS staff_directory DROP COLUMN IF EXISTS national_insurance_number;
