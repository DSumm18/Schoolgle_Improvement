-- ============================================================
-- Estates Routines — Dynamic Routine Templates
--
-- These tables support custom routine definitions created by
-- schools beyond the built-in opening/closing checklists.
--
-- Referenced by:
-- - /api/estates-compliance/routines (CRUD)
-- - /api/estates-compliance/daily-checks (fallback lookup)
-- - RoutineManager component (settings page)
--
-- The built-in opening/closing checklists are defined in
-- daily-checks.ts as DAILY_CHECKLISTS. These tables extend
-- that with school-created custom routines.
-- ============================================================

CREATE TABLE IF NOT EXISTS estates_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  recurrence TEXT NOT NULL DEFAULT 'daily'
    CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'termly', 'annual', 'ad_hoc')),
  recurrence_days INT[],              -- for weekly: days of week (0=Sun, 1=Mon, etc.)
  start_time TEXT,                     -- e.g., "07:00"
  deadline_time TEXT,                  -- e.g., "09:00"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estates_routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES estates_routines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'facilities',
  icon TEXT,
  item_order INT DEFAULT 0,
  requires_photo BOOLEAN DEFAULT false,
  requires_notes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estates_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE estates_routine_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on estates_routines" ON estates_routines
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on estates_routine_items" ON estates_routine_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_routines_org ON estates_routines(organization_id);
CREATE INDEX IF NOT EXISTS idx_routine_items_routine ON estates_routine_items(routine_id);
