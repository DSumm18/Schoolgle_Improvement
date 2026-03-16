-- ═══════════════════════════════════════════════════════════════════════
-- VIDEO ROOMS, ASSEMBLY BROADCAST & COMMUNICATION HUB
-- Created: 2026-03-15
-- Purpose: Integrate Google Meet / Microsoft Teams for assemblies,
--          parent meetings, governor meetings, staff briefings, and
--          classroom-to-classroom video. Schools use their EXISTING
--          Google Workspace / Microsoft 365 licences — zero extra cost.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. VIDEO ROOMS
-- Central registry of video meeting links — scheduled or ad-hoc
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Room identity
  room_name TEXT NOT NULL,               -- e.g. 'Morning Assembly', 'Y3 Parents Evening Slot 4'
  room_type TEXT NOT NULL DEFAULT 'meeting' CHECK (room_type IN (
    'assembly',           -- Head teacher → all classrooms (one-to-many)
    'staff_briefing',     -- SLT → all staff
    'parent_meeting',     -- Teacher ↔ parent (1:1 or small group)
    'governor_meeting',   -- Full board or committee
    'classroom_link',     -- Class-to-class collaboration
    'cpd_training',       -- Staff training / INSET
    'external',           -- External speakers, LA, Ofsted, etc.
    'meeting'             -- General meeting
  )),

  -- Video provider
  provider TEXT NOT NULL DEFAULT 'google_meet' CHECK (provider IN (
    'google_meet',        -- Google Meet (Workspace schools)
    'microsoft_teams',    -- Microsoft Teams (M365 schools)
    'zoom',               -- Zoom (some schools have this)
    'custom'              -- Custom embed URL
  )),

  -- Meeting link
  meeting_url TEXT,                      -- The actual Meet/Teams URL
  meeting_id TEXT,                       -- Provider-specific meeting ID
  join_code TEXT,                        -- Short join code if applicable

  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,                  -- iCal RRULE format: 'FREQ=WEEKLY;BYDAY=MO'
  timezone TEXT DEFAULT 'Europe/London',

  -- Who's involved
  host_id UUID,                          -- Staff member hosting
  host_name TEXT,
  participants JSONB DEFAULT '[]',       -- [{id, name, role, email}]
  max_participants INT,

  -- Audience (for broadcasts)
  target_zones UUID[] DEFAULT '{}',      -- Which zones/classrooms see this
  target_year_groups TEXT[] DEFAULT '{}', -- Which year groups
  is_whole_school BOOLEAN DEFAULT false,  -- Assembly = whole school

  -- Display integration
  show_on_display BOOLEAN DEFAULT false, -- Show join button on classroom boards
  auto_join_display BOOLEAN DEFAULT false, -- Auto-play on classroom boards (assembly mode)
  display_message TEXT,                  -- Message shown on display while in call

  -- Linked to other modules
  timetable_slot_id UUID,               -- Link to ls_timetable_slots
  meeting_id_ref UUID,                   -- Link to meetings table (governance)
  parent_evening_slot_id UUID,           -- Link to parents_evening_slots

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',          -- Future meeting
    'live',               -- Currently in progress
    'ended',              -- Completed
    'cancelled'           -- Cancelled
  )),

  -- Recording
  recording_url TEXT,                    -- If recorded
  recording_consent BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_rooms_org
  ON video_rooms(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_video_rooms_schedule
  ON video_rooms(organization_id, scheduled_start)
  WHERE status IN ('scheduled', 'live');
CREATE INDEX IF NOT EXISTS idx_video_rooms_type
  ON video_rooms(organization_id, room_type);
CREATE INDEX IF NOT EXISTS idx_video_rooms_live
  ON video_rooms(organization_id)
  WHERE status = 'live';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. VIDEO ROOM PARTICIPANTS LOG
-- Tracks who joined/left and when (for safeguarding audit)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  user_role TEXT,                         -- 'teacher', 'parent', 'governor', 'external'
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  join_method TEXT DEFAULT 'link' CHECK (join_method IN (
    'link',               -- Clicked meeting URL
    'display',            -- Auto-joined from classroom display
    'embed',              -- Joined via embedded player
    'app'                 -- Joined via mobile app
  )),
  device_type TEXT                        -- 'display', 'mobile', 'desktop'
);

CREATE INDEX IF NOT EXISTS idx_vrp_room ON video_room_participants(room_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. ASSEMBLY SCHEDULES
-- Recurring assembly/worship schedule linked to video rooms
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assembly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,                    -- e.g. 'Whole School Assembly', 'KS1 Worship'
  assembly_type TEXT NOT NULL DEFAULT 'assembly' CHECK (assembly_type IN (
    'assembly',           -- Standard assembly
    'collective_worship', -- Church school worship
    'achievement',        -- Awards / celebration
    'singing',            -- Singing practice
    'visitor',            -- External speaker
    'class_led',          -- Class-led assembly
    'year_group'          -- Year group assembly
  )),

  -- Schedule
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,                          -- 'Main Hall', 'Virtual', 'Playground'
  is_virtual BOOLEAN DEFAULT false,       -- Broadcast to classrooms

  -- Who leads
  led_by TEXT,                            -- Role or specific person
  worship_theme TEXT,                     -- Current theme/value

  -- Targeting
  target_year_groups TEXT[] DEFAULT '{}',
  is_whole_school BOOLEAN DEFAULT true,

  -- Video room template
  default_provider TEXT DEFAULT 'google_meet',
  auto_create_room BOOLEAN DEFAULT true,  -- Auto-create video room each week

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assembly_schedules_org
  ON assembly_schedules(organization_id, is_active);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. SCHOOL COMMUNICATION PREFERENCES
-- Per-org settings for video provider, parent comms, etc.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Default video provider
  default_video_provider TEXT DEFAULT 'google_meet' CHECK (default_video_provider IN (
    'google_meet', 'microsoft_teams', 'zoom'
  )),

  -- Google Workspace integration
  google_workspace_domain TEXT,           -- e.g. 'school.edu'
  google_calendar_sync BOOLEAN DEFAULT false,

  -- Microsoft 365 integration
  microsoft_tenant_id TEXT,
  microsoft_calendar_sync BOOLEAN DEFAULT false,

  -- Parent communication
  parent_comms_provider TEXT CHECK (parent_comms_provider IS NULL OR parent_comms_provider IN (
    'parentmail', 'schoolcomms', 'studybugs', 'classlist', 'builtin'
  )),
  parent_app_enabled BOOLEAN DEFAULT false,

  -- Display settings
  display_auto_join_assemblies BOOLEAN DEFAULT true,
  display_show_upcoming_meetings BOOLEAN DEFAULT true,
  display_meeting_reminder_minutes INT DEFAULT 5,

  -- Safeguarding
  require_recording_consent BOOLEAN DEFAULT true,
  auto_record_governance BOOLEAN DEFAULT false,
  parent_meeting_chaperone BOOLEAN DEFAULT false, -- Require 2nd adult in parent calls

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. SEED DATA: Arrival Primary assemblies & quick rooms
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  SELECT id INTO v_org_id FROM organizations
  WHERE name ILIKE '%arrival%' OR name ILIKE '%aurora%'
  LIMIT 1;

  IF v_org_id IS NULL THEN RETURN; END IF;

  -- Communication settings
  INSERT INTO communication_settings (
    organization_id, default_video_provider,
    google_workspace_domain, display_auto_join_assemblies
  ) VALUES (
    v_org_id, 'google_meet',
    'arrivalprimary.edu', true
  ) ON CONFLICT (organization_id) DO NOTHING;

  -- Assembly schedules
  INSERT INTO assembly_schedules (organization_id, title, assembly_type, day_of_week, start_time, end_time, location, is_virtual, led_by, is_whole_school, target_year_groups)
  VALUES
    (v_org_id, 'Whole School Assembly', 'assembly', 1, '09:00', '09:20', 'Main Hall', true, 'Headteacher', true, '{}'),
    (v_org_id, 'Collective Worship', 'collective_worship', 2, '09:00', '09:15', 'Main Hall', true, 'Worship Lead', true, '{}'),
    (v_org_id, 'Singing Assembly', 'singing', 3, '09:00', '09:20', 'Main Hall', true, 'Music Lead', true, '{}'),
    (v_org_id, 'KS1 Achievement Assembly', 'achievement', 4, '09:00', '09:15', 'Main Hall', false, 'KS1 Phase Lead', false, ARRAY['Reception', 'Year 1', 'Year 2']),
    (v_org_id, 'KS2 Achievement Assembly', 'achievement', 4, '14:30', '14:50', 'Main Hall', false, 'KS2 Phase Lead', false, ARRAY['Year 3', 'Year 4', 'Year 5', 'Year 6']),
    (v_org_id, 'Friday Celebration Assembly', 'achievement', 5, '14:00', '14:30', 'Main Hall', true, 'Headteacher', true, '{}');

  -- Sample video rooms
  INSERT INTO video_rooms (
    organization_id, room_name, room_type, provider,
    meeting_url, scheduled_start, scheduled_end,
    host_name, is_whole_school, show_on_display, auto_join_display,
    status, created_by
  ) VALUES
    (v_org_id, 'Monday Morning Assembly', 'assembly', 'google_meet',
     'https://meet.google.com/abc-defg-hij',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '09:00')::TIMESTAMPTZ,
     (CURRENT_DATE + INTERVAL '1 day' + TIME '09:20')::TIMESTAMPTZ,
     'Mrs Carter (Headteacher)', true, true, true,
     'scheduled', v_user_id),
    (v_org_id, 'Staff Briefing', 'staff_briefing', 'google_meet',
     'https://meet.google.com/klm-nopq-rst',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '08:15')::TIMESTAMPTZ,
     (CURRENT_DATE + INTERVAL '1 day' + TIME '08:30')::TIMESTAMPTZ,
     'Mr Brown (Deputy Head)', false, false, false,
     'scheduled', v_user_id),
    (v_org_id, 'Governors Full Board Meeting', 'governor_meeting', 'google_meet',
     'https://meet.google.com/uvw-xyza-bcd',
     (CURRENT_DATE + INTERVAL '7 days' + TIME '18:00')::TIMESTAMPTZ,
     (CURRENT_DATE + INTERVAL '7 days' + TIME '19:30')::TIMESTAMPTZ,
     'Mrs Johnson (Chair)', false, false, false,
     'scheduled', v_user_id);

END $$;
