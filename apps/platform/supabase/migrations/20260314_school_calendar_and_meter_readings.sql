-- Migration: School Calendar Events + Energy Meter Readings
-- Created: 2026-03-14
-- Description:
--   1. school_calendar_events — reusable calendar overlay for energy, attendance, behaviour, cover
--   2. energy_meter_readings — meter readings with photo upload, AI extraction, supplier submission
--   3. Seed Aurora Primary calendar events
--   4. Storage bucket for meter reading images

BEGIN;

-- ============================================================================
-- 1. school_calendar_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS school_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'inset_day', 'bank_holiday', 'after_school_club', 'breakfast_club',
    'holiday_club', 'parents_evening', 'school_trip', 'staff_training',
    'lettings', 'exam_period', 'sports_day', 'custom'
  )),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,                -- nullable for single-day events
  start_time TIME,              -- nullable for all-day events
  end_time TIME,
  recurrence_pattern JSONB,     -- e.g. {"days": ["Mon","Tue","Wed","Thu"], "term_only": true}
  academic_year TEXT,           -- e.g. "2025-26"
  affects_energy BOOLEAN DEFAULT false,
  expected_occupancy_pct INTEGER CHECK (expected_occupancy_pct BETWEEN 0 AND 100),
  colour TEXT,                  -- hex colour for calendar display
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_calendar_events_org
  ON school_calendar_events(organization_id);

CREATE INDEX IF NOT EXISTS idx_school_calendar_events_dates
  ON school_calendar_events(organization_id, start_date);

CREATE INDEX IF NOT EXISTS idx_school_calendar_events_type
  ON school_calendar_events(organization_id, event_type);

-- RLS
ALTER TABLE school_calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_calendar_events' AND policyname = 'school_calendar_events_select'
  ) THEN
    CREATE POLICY school_calendar_events_select ON school_calendar_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_calendar_events.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_calendar_events' AND policyname = 'school_calendar_events_insert'
  ) THEN
    CREATE POLICY school_calendar_events_insert ON school_calendar_events
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_calendar_events.organization_id
            AND organization_members.user_id = auth.uid()::text
            AND organization_members.role IN ('admin', 'headteacher', 'slt')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_calendar_events' AND policyname = 'school_calendar_events_update'
  ) THEN
    CREATE POLICY school_calendar_events_update ON school_calendar_events
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_calendar_events.organization_id
            AND organization_members.user_id = auth.uid()::text
            AND organization_members.role IN ('admin', 'headteacher', 'slt')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_calendar_events' AND policyname = 'school_calendar_events_delete'
  ) THEN
    CREATE POLICY school_calendar_events_delete ON school_calendar_events
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = school_calendar_events.organization_id
            AND organization_members.user_id = auth.uid()::text
            AND organization_members.role IN ('admin', 'headteacher', 'slt')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 2. energy_meter_readings
-- ============================================================================

CREATE TABLE IF NOT EXISTS energy_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  meter_id UUID NOT NULL REFERENCES energy_meters(id),
  reading_value NUMERIC(12,2) NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME DEFAULT CURRENT_TIME,
  image_url TEXT,               -- Supabase Storage public URL
  image_storage_path TEXT,      -- internal path for deletion
  submitted_by TEXT NOT NULL,   -- user_id
  submitted_at TIMESTAMPTZ DEFAULT now(),
  ai_confidence NUMERIC(5,3),
  ai_meter_type TEXT,
  ai_notes TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  source TEXT DEFAULT 'photo' CHECK (source IN ('photo', 'manual', 'invoice', 'smart_meter')),
  sent_to_supplier BOOLEAN DEFAULT false,
  sent_to_supplier_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_energy_meter_readings_org
  ON energy_meter_readings(organization_id);

CREATE INDEX IF NOT EXISTS idx_energy_meter_readings_meter
  ON energy_meter_readings(meter_id, reading_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energy_meter_readings_unique
  ON energy_meter_readings(organization_id, meter_id, reading_date);

-- RLS
ALTER TABLE energy_meter_readings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_meter_readings' AND policyname = 'energy_meter_readings_select'
  ) THEN
    CREATE POLICY energy_meter_readings_select ON energy_meter_readings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_meter_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_meter_readings' AND policyname = 'energy_meter_readings_insert'
  ) THEN
    CREATE POLICY energy_meter_readings_insert ON energy_meter_readings
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_meter_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_meter_readings' AND policyname = 'energy_meter_readings_update'
  ) THEN
    CREATE POLICY energy_meter_readings_update ON energy_meter_readings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_meter_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'energy_meter_readings' AND policyname = 'energy_meter_readings_delete'
  ) THEN
    CREATE POLICY energy_meter_readings_delete ON energy_meter_readings
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = energy_meter_readings.organization_id
            AND organization_members.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. Seed Aurora Primary school calendar events
--    organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083'
-- ============================================================================

INSERT INTO school_calendar_events (organization_id, event_type, title, start_date, end_date, start_time, end_time, recurrence_pattern, academic_year, affects_energy, expected_occupancy_pct, colour, notes)
VALUES
  -- INSET days 2024-25
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 1 — Safeguarding & KCSIE',
   '2024-09-02', NULL, NULL, NULL, NULL, '2024-25', true, 30, '#FF6B6B',
   'Whole-staff safeguarding training. Pupils not in school.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 2 — Curriculum Planning',
   '2024-11-01', NULL, NULL, NULL, NULL, '2024-25', true, 30, '#FF6B6B',
   'Department planning and moderation day.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 3 — Assessment & Data',
   '2025-01-06', NULL, NULL, NULL, NULL, '2024-25', true, 30, '#FF6B6B',
   'Data analysis and target setting.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 4 — SEND & Inclusion',
   '2025-04-22', NULL, NULL, NULL, NULL, '2024-25', true, 30, '#FF6B6B',
   'SEND training and provision review.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 5 — Wellbeing & Transition',
   '2025-07-22', NULL, NULL, NULL, NULL, '2024-25', true, 30, '#FF6B6B',
   'Staff wellbeing and Year 6 transition planning.'),

  -- After-school clubs (Mon-Thu, term time)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'after_school_club', 'After-School Clubs',
   '2024-09-09', '2025-07-18', '15:30', '16:30',
   '{"days": ["Mon", "Tue", "Wed", "Thu"], "term_only": true}'::jsonb,
   '2024-25', true, 20, '#4ECDC4',
   'Football (Mon), Art (Tue), Coding (Wed), Drama (Thu). ~40 pupils per session.'),

  -- Breakfast club (Mon-Fri, term time)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'breakfast_club', 'Breakfast Club',
   '2024-09-03', '2025-07-18', '07:30', '08:45',
   '{"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "term_only": true}'::jsonb,
   '2024-25', true, 15, '#45B7D1',
   'Run by OPAL staff. ~30 pupils daily.'),

  -- Holiday club (summer 2025)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'holiday_club', 'Summer Holiday Club',
   '2025-07-28', '2025-08-15', '08:00', '17:00',
   '{"days": ["Mon", "Tue", "Wed", "Thu", "Fri"]}'::jsonb,
   '2024-25', true, 25, '#96CEB4',
   'External provider using school hall and playground. 3 weeks.'),

  -- Parents evenings
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'parents_evening', 'Autumn Parents Evening',
   '2024-11-14', NULL, '16:00', '19:30', NULL, '2024-25', true, 60, '#DDA0DD',
   'All year groups. 10-minute appointments.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'parents_evening', 'Spring Parents Evening',
   '2025-03-13', NULL, '16:00', '19:30', NULL, '2024-25', true, 60, '#DDA0DD',
   'All year groups. 10-minute appointments.'),

  -- Sports day
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'sports_day', 'Sports Day',
   '2025-06-27', NULL, '09:00', '15:00', NULL, '2024-25', true, 100, '#FFD93D',
   'Whole school. Parents invited from 13:00. Backup date 4 Jul.'),

  -- Lettings — Saturday morning football
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'lettings', 'Saturday Football (Lettings)',
   '2024-09-07', '2025-07-19', '09:00', '12:00',
   '{"days": ["Sat"]}'::jsonb,
   '2024-25', true, 10, '#F4A460',
   'Local youth football club. Hall and field. Term time + some holidays.'),

  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'lettings', 'Saturday Football (Lettings)',
   '2025-09-06', '2026-07-18', '09:00', '12:00',
   '{"days": ["Sat"]}'::jsonb,
   '2025-26', true, 10, '#F4A460',
   'Local youth football club. Renewed for 2025-26.'),

  -- 2025-26 INSET days
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'inset_day', 'INSET Day 1 — New Academic Year',
   '2025-09-01', NULL, NULL, NULL, NULL, '2025-26', true, 30, '#FF6B6B',
   'Whole-staff induction and safeguarding update.'),

  -- 2025-26 Breakfast club
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'breakfast_club', 'Breakfast Club',
   '2025-09-02', '2026-07-17', '07:30', '08:45',
   '{"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "term_only": true}'::jsonb,
   '2025-26', true, 15, '#45B7D1',
   'Continued from 2024-25. ~35 pupils daily.'),

  -- 2025-26 After-school clubs
  ('c64ed86b-9eab-49ee-9829-0706ff371083', 'after_school_club', 'After-School Clubs',
   '2025-09-08', '2026-07-17', '15:30', '16:30',
   '{"days": ["Mon", "Tue", "Wed", "Thu"], "term_only": true}'::jsonb,
   '2025-26', true, 20, '#4ECDC4',
   'Football (Mon), Science (Tue), Choir (Wed), Homework (Thu).')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Storage bucket for meter reading images
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('meter-readings', 'meter-readings', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
