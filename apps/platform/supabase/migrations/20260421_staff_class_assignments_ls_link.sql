-- Link staff_class_assignments to ls_classes
-- Adds ls_class_id FK so class assignments resolve to a real ls_classes row,
-- unblocking: teacher dashboard home, SLT whole-school view, and lesson plan
-- visibility scoped to "my classes".
--
-- Existing staff_class_assignments rows continue to work via the legacy
-- (year_group + registration_group) fields. ls_class_id is nullable while
-- schools gradually tidy up their class records via Settings > Classes.

ALTER TABLE staff_class_assignments
  ADD COLUMN IF NOT EXISTS ls_class_id UUID REFERENCES ls_classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_class_assignments_ls_class
  ON staff_class_assignments(ls_class_id);

-- Best-effort backfill — map year_group (integer on assignment) to
-- ls_classes.year_group (text label). Only backfills where a single ls_classes
-- row matches for the org + year label; ambiguous cases left NULL for the
-- Settings UI to resolve.
DO $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  WITH year_map AS (
    SELECT -1 AS num, 'Nursery'::text AS label
    UNION ALL SELECT 0, 'Reception'
    UNION ALL SELECT 1, 'Year 1'
    UNION ALL SELECT 2, 'Year 2'
    UNION ALL SELECT 3, 'Year 3'
    UNION ALL SELECT 4, 'Year 4'
    UNION ALL SELECT 5, 'Year 5'
    UNION ALL SELECT 6, 'Year 6'
    UNION ALL SELECT 7, 'Year 7'
    UNION ALL SELECT 8, 'Year 8'
    UNION ALL SELECT 9, 'Year 9'
    UNION ALL SELECT 10, 'Year 10'
    UNION ALL SELECT 11, 'Year 11'
    UNION ALL SELECT 12, 'Year 12'
    UNION ALL SELECT 13, 'Year 13'
  ),
  -- Candidate matches: same org + same academic year + year label matches
  -- Prefer exact class_name = registration_group where both set
  candidates AS (
    SELECT
      a.id AS assignment_id,
      c.id AS ls_class_id,
      CASE
        WHEN a.registration_group IS NOT NULL
             AND LOWER(c.class_name) = LOWER(a.registration_group) THEN 1
        WHEN a.registration_group IS NULL
             AND c.class_name = ym.label THEN 2
        ELSE 3
      END AS priority
    FROM staff_class_assignments a
    JOIN year_map ym ON ym.num = a.year_group
    JOIN ls_classes c
      ON c.organization_id = a.organization_id
     AND c.academic_year = a.academic_year
     AND c.year_group = ym.label
    WHERE a.ls_class_id IS NULL
  ),
  ranked AS (
    SELECT
      assignment_id,
      ls_class_id,
      ROW_NUMBER() OVER (PARTITION BY assignment_id ORDER BY priority) AS rn
    FROM candidates
  )
  UPDATE staff_class_assignments sca
  SET ls_class_id = r.ls_class_id
  FROM ranked r
  WHERE sca.id = r.assignment_id
    AND r.rn = 1;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Backfilled ls_class_id on % staff_class_assignments rows', v_updated;
END $$;
