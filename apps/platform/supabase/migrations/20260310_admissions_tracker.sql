-- Admissions Tracker Module
-- Tables for managing admission rounds, applications, waiting lists, and appeals

-- ─── Admissions Rounds ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admissions_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,                -- e.g. '2026-27'
  entry_year_group TEXT NOT NULL,             -- e.g. 'Reception', 'Year 7'
  pan INTEGER NOT NULL,                       -- Published Admission Number
  application_deadline DATE,                  -- National closing date
  offer_date DATE,                            -- National offer day
  acceptance_deadline DATE,                   -- Deadline to accept place
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  oversubscription_criteria JSONB,            -- Ordered criteria list
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admissions_rounds_org
  ON admissions_rounds(organization_id);
CREATE INDEX IF NOT EXISTS idx_admissions_rounds_status
  ON admissions_rounds(organization_id, status);

-- ─── Admissions Applications ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admissions_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES admissions_rounds(id) ON DELETE CASCADE,

  -- Child details
  child_name TEXT NOT NULL,
  child_dob DATE NOT NULL,

  -- Parent/carer details
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  address TEXT,
  postcode TEXT,

  -- Application details
  preference_rank INTEGER NOT NULL DEFAULT 1,
  distance_miles NUMERIC(6,3),               -- Straight-line distance
  oversubscription_criterion TEXT,            -- Tag: lac, ehcp, sibling, faith, staff_child, distance, other
  sibling_at_school BOOLEAN DEFAULT FALSE,
  looked_after_child BOOLEAN DEFAULT FALSE,
  ehcp_naming_school BOOLEAN DEFAULT FALSE,
  faith_evidence TEXT,                        -- Description of faith evidence

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'verified', 'offered', 'accepted', 'declined', 'waiting_list', 'withdrawn')),
  waiting_list_position INTEGER,

  -- Offer tracking
  offer_date DATE,
  acceptance_date DATE,
  decline_date DATE,

  -- Appeal tracking
  appeal_submitted BOOLEAN DEFAULT FALSE,
  appeal_date DATE,
  appeal_outcome TEXT CHECK (appeal_outcome IN ('upheld', 'dismissed', NULL)),
  appeal_notes TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admissions_apps_org
  ON admissions_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_round
  ON admissions_applications(round_id);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_status
  ON admissions_applications(round_id, status);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_criterion
  ON admissions_applications(round_id, oversubscription_criterion);
CREATE INDEX IF NOT EXISTS idx_admissions_apps_waiting
  ON admissions_applications(round_id, waiting_list_position)
  WHERE status = 'waiting_list';

-- ─── Row Level Security ─────────────────────────────────────────────────

ALTER TABLE admissions_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions_applications ENABLE ROW LEVEL SECURITY;

-- Rounds: org members can read, admin/slt can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_rounds_select') THEN
    CREATE POLICY admissions_rounds_select ON admissions_rounds
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_rounds_insert') THEN
    CREATE POLICY admissions_rounds_insert ON admissions_rounds
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'slt', 'headteacher')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_rounds_update') THEN
    CREATE POLICY admissions_rounds_update ON admissions_rounds
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'slt', 'headteacher')
        )
      );
  END IF;
END $$;

-- Applications: org members can read, admin/slt can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_apps_select') THEN
    CREATE POLICY admissions_apps_select ON admissions_applications
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_apps_insert') THEN
    CREATE POLICY admissions_apps_insert ON admissions_applications
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'slt', 'headteacher')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_apps_update') THEN
    CREATE POLICY admissions_apps_update ON admissions_applications
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'slt', 'headteacher')
        )
      );
  END IF;
END $$;

-- Service role bypass
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_rounds_service') THEN
    CREATE POLICY admissions_rounds_service ON admissions_rounds
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admissions_apps_service') THEN
    CREATE POLICY admissions_apps_service ON admissions_applications
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
