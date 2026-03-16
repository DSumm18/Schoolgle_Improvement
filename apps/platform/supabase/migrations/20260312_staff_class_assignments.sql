-- Staff Class Assignments
-- Maps staff to year groups / registration groups for the current academic year.
-- SLT manages these; teachers see data filtered by their assignments.

CREATE TABLE IF NOT EXISTS staff_class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,                    -- references staff_directory.id
  user_id TEXT,                              -- matches organization_members.user_id (for login filtering)
  staff_name TEXT NOT NULL,                  -- denormalised for display
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  year_group INTEGER NOT NULL,              -- 0=Reception, 1-6=Y1-Y6, 7-13 for secondary
  registration_group TEXT,                   -- Class name e.g. "Oak", "Maple", "3B"
  role TEXT NOT NULL DEFAULT 'Class Teacher', -- Class Teacher, PPA Cover, Job Share, TA, Supply
  fte_for_class NUMERIC(3,2) DEFAULT 1.0,   -- 0.0-1.0
  term TEXT NOT NULL DEFAULT 'All Year',     -- All Year, Autumn Only, Spring Only, etc.
  is_primary_teacher BOOLEAN DEFAULT true,   -- main class teacher vs support
  assigned_by TEXT,                          -- who made this assignment
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate assignments
  UNIQUE(organization_id, staff_id, academic_year, year_group, registration_group, role)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_class_assignments_org ON staff_class_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_staff ON staff_class_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_user ON staff_class_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_year ON staff_class_assignments(organization_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_class_assignments_lookup ON staff_class_assignments(organization_id, academic_year, year_group);

-- RLS
ALTER TABLE staff_class_assignments ENABLE ROW LEVEL SECURITY;

-- Org members can read assignments
DO $$ BEGIN
CREATE POLICY "org_members_read_class_assignments"
  ON staff_class_assignments FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()::text
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SLT+ can manage assignments
DO $$ BEGIN
CREATE POLICY "slt_manage_class_assignments"
  ON staff_class_assignments FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()::text
        AND om.role IN ('admin', 'headteacher', 'slt')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Year group labels view for convenience
CREATE OR REPLACE VIEW year_group_labels AS
SELECT
  0 AS year_group, 'Reception' AS label, 'R' AS short_label
UNION ALL SELECT 1, 'Year 1', 'Y1'
UNION ALL SELECT 2, 'Year 2', 'Y2'
UNION ALL SELECT 3, 'Year 3', 'Y3'
UNION ALL SELECT 4, 'Year 4', 'Y4'
UNION ALL SELECT 5, 'Year 5', 'Y5'
UNION ALL SELECT 6, 'Year 6', 'Y6'
UNION ALL SELECT 7, 'Year 7', 'Y7'
UNION ALL SELECT 8, 'Year 8', 'Y8'
UNION ALL SELECT 9, 'Year 9', 'Y9'
UNION ALL SELECT 10, 'Year 10', 'Y10'
UNION ALL SELECT 11, 'Year 11', 'Y11'
UNION ALL SELECT 12, 'Year 12', 'Y12'
UNION ALL SELECT 13, 'Year 13', 'Y13'
UNION ALL SELECT -1, 'Nursery', 'N';
