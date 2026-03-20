-- ============================================================
-- Compliance Review Cycle Enhancement
-- Adds location-linked reviews, sign-off, and recurring review
-- support to the existing estates compliance architecture.
--
-- This is NOT a new compliance system. It extends the existing
-- estates_compliance_tasks and estates_statutory_completions
-- tables with the fields needed for:
-- - monthly location-based COSHH reviews
-- - evidence-led reviews with AI-assisted findings
-- - responsible person sign-off
-- - recurring review cycles
-- - review audit history
-- ============================================================

-- 1. Add location_id and sign-off fields to tasks
ALTER TABLE estates_compliance_tasks
  ADD COLUMN IF NOT EXISTS location_id TEXT,
  ADD COLUMN IF NOT EXISTS room_id TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sign_off_status TEXT CHECK (sign_off_status IN ('pending', 'signed_off', 'rejected', 'deferred')),
  ADD COLUMN IF NOT EXISTS sign_off_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_proposals JSONB,
  ADD COLUMN IF NOT EXISTS review_type TEXT;

-- 2. Add location_id to statutory completions
ALTER TABLE estates_statutory_completions
  ADD COLUMN IF NOT EXISTS location_id TEXT,
  ADD COLUMN IF NOT EXISTS room_id TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 3. Create compliance_reviews table for review audit log
-- This is the authoritative record of each review cycle completion.
CREATE TABLE IF NOT EXISTS compliance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  compliance_domain TEXT NOT NULL,
  review_type TEXT NOT NULL,                  -- monthly_coshh, weekly_fire, termly_legionella, ad_hoc
  location_id TEXT,                            -- room/zone ID from site model
  location_name TEXT,                          -- human-readable location name

  -- Review cycle
  review_date DATE NOT NULL,
  due_date DATE,
  previous_review_id UUID REFERENCES compliance_reviews(id),

  -- Who
  reviewed_by UUID,
  reviewed_by_name TEXT,
  responsible_person_id UUID,
  responsible_person_name TEXT,

  -- Findings
  findings JSONB,                              -- { confirmed: [], new_items: [], missing_items: [], storage_concerns: [] }
  register_snapshot JSONB,                     -- snapshot of register at review time (for COSHH)
  evidence_ids UUID[],                         -- linked evidence records
  task_ids UUID[],                             -- linked compliance tasks

  -- AI analysis
  ai_analysis JSONB,                           -- raw AI analysis output
  ai_model TEXT,                               -- which model was used
  ai_proposals_accepted INT DEFAULT 0,
  ai_proposals_rejected INT DEFAULT 0,

  -- Sign-off
  sign_off_status TEXT DEFAULT 'pending'
    CHECK (sign_off_status IN ('pending', 'signed_off', 'rejected', 'deferred')),
  signed_off_by UUID,
  signed_off_by_name TEXT,
  signed_off_at TIMESTAMPTZ,
  sign_off_notes TEXT,

  -- Outcome
  overall_status TEXT DEFAULT 'pending'
    CHECK (overall_status IN ('pending', 'in_progress', 'compliant', 'concerns', 'non_compliant')),
  actions_raised UUID[],                       -- linked to actions/unified_tasks

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compliance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on compliance_reviews" ON compliance_reviews
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_compliance_reviews_org ON compliance_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_domain ON compliance_reviews(organization_id, compliance_domain);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_location ON compliance_reviews(organization_id, location_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_date ON compliance_reviews(organization_id, review_date DESC);

-- 4. Add indexes for location queries on existing tables
CREATE INDEX IF NOT EXISTS idx_tasks_location ON estates_compliance_tasks(organization_id, location_id);
CREATE INDEX IF NOT EXISTS idx_completions_location ON estates_statutory_completions(organization_id, location_id);
