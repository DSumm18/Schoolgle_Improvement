-- Pupils Master Table
-- Optional canonical pupil reference for cross-module consistency.
-- Modules can still operate independently, but this table allows
-- a single CSV import to populate pupil data across Attendance, SEND, and Behaviour.

CREATE TABLE IF NOT EXISTS pupils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id TEXT NOT NULL,             -- School-assigned or MIS-provided unique ID
  pupil_ref TEXT,                      -- MIS student reference (e.g., ARB-100001)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  year_group TEXT NOT NULL,            -- e.g., 'R', '1', '2', ..., '13'
  class_name TEXT,                     -- e.g., '3A', 'Oak', 'Year 4 Blue'
  gender TEXT,                         -- M, F, O
  is_pupil_premium BOOLEAN DEFAULT false,
  is_eal BOOLEAN DEFAULT false,
  is_looked_after BOOLEAN DEFAULT false,
  has_send_support BOOLEAN DEFAULT false,
  sen_status TEXT,                     -- K, E, monitoring, removed, null
  primary_need TEXT,                   -- SPLD, MLD, SLD, PMLD, SEMH, SLCN, HI, VI, MSI, PD, ASD, OTH, NSA
  fsm_eligible BOOLEAN DEFAULT false,
  ethnicity TEXT,
  is_active BOOLEAN DEFAULT true,
  import_source TEXT,                  -- e.g., 'csv', 'arbor', 'sims', 'manual'
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, pupil_id)
);

ALTER TABLE pupils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pupils" ON pupils
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pupils_org_id ON pupils(organization_id);
CREATE INDEX IF NOT EXISTS idx_pupils_year_group ON pupils(organization_id, year_group);
CREATE INDEX IF NOT EXISTS idx_pupils_class ON pupils(organization_id, class_name);
