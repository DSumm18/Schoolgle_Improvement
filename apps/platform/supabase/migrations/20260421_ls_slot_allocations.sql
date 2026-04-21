-- ls_slot_allocations: maps individual lesson objectives to specific timetable slots for a given week.
-- Created as part of the lesson-level curriculum allocation feature (April 2026).

CREATE TABLE IF NOT EXISTS ls_slot_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  timetable_slot_id UUID NOT NULL REFERENCES ls_timetable_slots(id) ON DELETE CASCADE,
  week_commencing DATE NOT NULL,
  unit_name TEXT NOT NULL,
  lesson_position INTEGER NOT NULL,
  lesson_title TEXT NOT NULL,
  nc_code TEXT,
  learning_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, timetable_slot_id, week_commencing)
);

-- RLS
ALTER TABLE ls_slot_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ls_slot_allocations_org_select" ON ls_slot_allocations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "ls_slot_allocations_org_insert" ON ls_slot_allocations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "ls_slot_allocations_org_update" ON ls_slot_allocations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "ls_slot_allocations_org_delete" ON ls_slot_allocations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    )
  );

-- Index for fast lookup by class + week
CREATE INDEX IF NOT EXISTS ls_slot_allocations_class_week_idx
  ON ls_slot_allocations (class_id, week_commencing);
