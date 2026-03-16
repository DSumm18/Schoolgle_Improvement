-- ═══════════════════════════════════════════════════════════════════════
-- SCHOOL NOTICES, ANNOUNCEMENTS & DISPLAY FEED
-- Created: 2026-03-15
-- Purpose: General-purpose communication system for school notices,
--          events, reminders, celebrations, and live feed on classroom
--          displays. Complements emergency broadcasts.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SCHOOL NOTICES
-- The core notice/announcement/message table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS school_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  body TEXT,                              -- Rich text / markdown
  image_url TEXT,                         -- Optional hero image
  attachment_urls TEXT[] DEFAULT '{}',    -- PDFs, docs, etc.

  -- Classification
  notice_type TEXT NOT NULL DEFAULT 'announcement' CHECK (notice_type IN (
    'announcement',       -- General announcement
    'event',              -- Upcoming event (has event_date)
    'reminder',           -- Time-sensitive reminder
    'celebration',        -- Achievement, birthday, award
    'safeguarding',       -- Safeguarding notice (restricted audience)
    'maintenance',        -- Site/facilities notice
    'menu',               -- Lunch menu / catering
    'pta',                -- PTA / Friends of School
    'sport',              -- Sports results, fixtures
    'worship',            -- Collective worship / assembly theme
    'custom'              -- Free-form
  )),

  -- Priority & display
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'urgent',             -- Red banner, top of feed, push notification
    'high',               -- Highlighted, near top
    'normal',             -- Standard display order
    'low'                 -- Bottom of feed, rotational
  )),
  pin_to_top BOOLEAN DEFAULT false,      -- Sticky at top of feed
  show_on_display BOOLEAN DEFAULT true,  -- Show on classroom boards
  show_on_dashboard BOOLEAN DEFAULT true, -- Show on staff dashboard
  show_on_parent_app BOOLEAN DEFAULT false, -- Show on parent-facing app

  -- Audience targeting
  audience TEXT NOT NULL DEFAULT 'all_staff' CHECK (audience IN (
    'all',                -- Everyone (staff + parents + governors)
    'all_staff',          -- All school staff
    'teachers',           -- Teaching staff only
    'support_staff',      -- TAs, admin, premises
    'slt',                -- Senior leadership team
    'governors',          -- Governors only
    'parents',            -- Parents/carers
    'pupils',             -- Pupil-facing (display boards)
    'year_group',         -- Specific year groups (see target_year_groups)
    'custom'              -- Custom audience (see target_roles)
  )),
  target_year_groups TEXT[] DEFAULT '{}', -- e.g. ['Year 3', 'Year 4']
  target_roles TEXT[] DEFAULT '{}',       -- e.g. ['teacher', 'ta']
  target_zone_ids UUID[] DEFAULT '{}',   -- Only show on displays in these zones

  -- Scheduling
  publish_at TIMESTAMPTZ DEFAULT now(),  -- When to show (future = scheduled)
  expires_at TIMESTAMPTZ,                -- Auto-hide after this time
  is_published BOOLEAN DEFAULT true,

  -- Event-specific fields
  event_date DATE,                       -- For notice_type='event'
  event_time TIME,
  event_end_time TIME,
  event_location TEXT,                   -- e.g. 'Main Hall', 'Sports Field'
  event_recurring TEXT CHECK (event_recurring IS NULL OR event_recurring IN (
    'daily', 'weekly', 'fortnightly', 'monthly', 'termly', 'annually'
  )),

  -- Display rotation settings (for classroom boards)
  display_duration_seconds INT DEFAULT 15, -- How long to show in rotation
  display_style TEXT DEFAULT 'card' CHECK (display_style IN (
    'card',               -- Standard card with title + body
    'banner',             -- Full-width banner (urgent notices)
    'hero',               -- Large image with overlay text
    'ticker',             -- Scrolling text at bottom of screen
    'countdown',          -- Countdown to event
    'celebration'         -- Fireworks/confetti animation
  )),

  -- Engagement tracking
  view_count INT DEFAULT 0,
  acknowledgement_required BOOLEAN DEFAULT false,

  -- Authorship
  created_by UUID NOT NULL,
  created_by_name TEXT,
  updated_by UUID,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_notices_org
  ON school_notices(organization_id, is_published, publish_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_notices_type
  ON school_notices(organization_id, notice_type);
CREATE INDEX IF NOT EXISTS idx_school_notices_display
  ON school_notices(organization_id)
  WHERE show_on_display = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_school_notices_event
  ON school_notices(organization_id, event_date)
  WHERE notice_type = 'event';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. NOTICE ACKNOWLEDGEMENTS
-- Track who has seen/acknowledged important notices
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notice_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES school_notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  acknowledged_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_acks_notice
  ON notice_acknowledgements(notice_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. DISPLAY PRESETS
-- Saved configurations for different display boards
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS display_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  preset_name TEXT NOT NULL,             -- e.g. 'Reception Entrance', 'Staff Room', 'Year 3 Board'
  description TEXT,

  -- What to show
  show_clock BOOLEAN DEFAULT true,
  show_date BOOLEAN DEFAULT true,
  show_weather BOOLEAN DEFAULT false,
  show_logo BOOLEAN DEFAULT true,
  show_motto BOOLEAN DEFAULT true,
  show_timetable BOOLEAN DEFAULT false,  -- Current lesson from Lesson Studio
  show_notices BOOLEAN DEFAULT true,
  show_events BOOLEAN DEFAULT true,
  show_celebrations BOOLEAN DEFAULT true,
  show_lunch_menu BOOLEAN DEFAULT false,
  show_assembly_theme BOOLEAN DEFAULT false,

  -- Filtering
  notice_types TEXT[] DEFAULT '{}',       -- Empty = show all types
  zone_id UUID REFERENCES emergency_zones(id) ON DELETE SET NULL,
  year_groups TEXT[] DEFAULT '{}',        -- Filter notices by year group

  -- Rotation
  rotation_speed_seconds INT DEFAULT 10,  -- Time per notice in carousel
  max_notices INT DEFAULT 20,             -- Max notices in rotation

  -- Layout
  layout TEXT DEFAULT 'sidebar' CHECK (layout IN (
    'sidebar',            -- Notices on right, main content left
    'fullscreen',         -- Full-screen notice carousel
    'split',              -- Top/bottom split
    'ticker',             -- Main content with scrolling ticker at bottom
    'grid'                -- Grid of notice cards
  )),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_display_presets_org
  ON display_presets(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. QUICK MESSAGES
-- Pre-written messages staff can send to displays with one tap
-- Like "Assembly in 5 minutes" or "Wet play - stay in classrooms"
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quick_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  label TEXT NOT NULL,                   -- Button label
  message TEXT NOT NULL,                 -- Full message
  icon TEXT,                             -- Lucide icon name
  color TEXT DEFAULT '#1e40af',          -- Button/banner colour
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'weather', 'assembly', 'lunch', 'sports', 'end_of_day', 'custom'
  )),

  -- Display settings
  display_style TEXT DEFAULT 'banner',
  display_duration_minutes INT DEFAULT 30, -- Auto-dismiss after N minutes
  play_chime BOOLEAN DEFAULT false,       -- Play attention chime
  target_zones UUID[] DEFAULT '{}',       -- Empty = all zones

  -- Usage tracking
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quick_messages_org
  ON quick_messages(organization_id, sort_order);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. SEED: Quick Messages for Arrival Primary
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO quick_messages (organization_id, label, message, icon, color, category, display_style, display_duration_minutes, play_chime, sort_order)
SELECT
  org.id,
  qm.label,
  qm.message,
  qm.icon,
  qm.color,
  qm.category,
  qm.display_style,
  qm.display_duration_minutes,
  qm.play_chime,
  qm.sort_order
FROM organizations org,
(VALUES
  ('Assembly in 5 mins', 'Please make your way to the hall for assembly', 'users', '#4f46e5', 'assembly', 'banner', 30, true, 1),
  ('Wet Play', 'Wet play today — pupils to stay in classrooms during break', 'cloud-rain', '#6366f1', 'weather', 'banner', 120, true, 2),
  ('Lunch is Ready', 'Lunch service has started in the dining hall', 'utensils', '#059669', 'lunch', 'banner', 60, true, 3),
  ('End of Day', 'School day ends in 5 minutes. Please prepare for dismissal.', 'clock', '#d97706', 'end_of_day', 'banner', 15, true, 4),
  ('Sports Day Reminder', 'Sports Day tomorrow — pupils to come in PE kit', 'trophy', '#dc2626', 'sports', 'card', 1440, false, 5),
  ('Visitors on Site', 'We have visitors in school today. Please ensure lanyards are visible.', 'eye', '#7c3aed', 'general', 'ticker', 480, false, 6),
  ('After-School Clubs Cancelled', 'All after-school clubs are cancelled today', 'x-circle', '#dc2626', 'general', 'banner', 240, true, 7),
  ('School Photographer Tomorrow', 'School photos tomorrow — please wear full uniform', 'camera', '#0891b2', 'general', 'card', 1440, false, 8)
) AS qm(label, message, icon, color, category, display_style, display_duration_minutes, play_chime, sort_order)
WHERE org.name ILIKE '%arrival%' OR org.name ILIKE '%aurora%'
LIMIT 8;

-- Seed some demo notices
INSERT INTO school_notices (
  organization_id, title, body, notice_type, priority,
  show_on_display, audience, created_by, created_by_name,
  event_date, event_location, display_style
)
SELECT
  org.id,
  n.title,
  n.body,
  n.notice_type,
  n.priority,
  true,
  'all'::TEXT,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'System',
  n.event_date,
  n.event_location,
  n.display_style
FROM organizations org,
(VALUES
  ('Summer Fayre — Saturday 5th July',
   'Join us for our annual Summer Fayre! Stalls, games, BBQ, bouncy castle, and live music. Gates open at 12pm. Volunteers needed — please sign up at the office.',
   'event', 'high',
   '2026-07-05'::DATE, 'School Grounds', 'hero'),
  ('Year 6 Leavers Assembly',
   'Year 6 Leavers Assembly on Thursday 17th July at 2pm in the Main Hall. All Year 6 parents and carers are invited.',
   'event', 'normal',
   '2026-07-17'::DATE, 'Main Hall', 'card'),
  ('Star of the Week — Amara, Year 4',
   'Congratulations to Amara in Year 4 for outstanding effort in maths this week! Keep up the brilliant work!',
   'celebration', 'normal',
   NULL, NULL, 'celebration'),
  ('Packed Lunch Reminder',
   'Please remember: no nuts or nut products in packed lunches. We have children with severe allergies. Thank you for keeping everyone safe.',
   'reminder', 'high',
   NULL, NULL, 'banner'),
  ('PTA Meeting — Wednesday 19th March',
   'PTA meeting this Wednesday at 6pm in the Staff Room. All welcome! We will be discussing Summer Fayre plans and the playground fundraiser.',
   'pta', 'normal',
   '2026-03-19'::DATE, 'Staff Room', 'card'),
  ('Collective Worship Theme: Courage',
   'This week''s worship theme is Courage. Our Bible story is David and Goliath. Classes to explore what it means to be brave in our daily lives.',
   'worship', 'normal',
   NULL, NULL, 'card'),
  ('Football Results — Won 3-1!',
   'Congratulations to our Year 5/6 football team who beat Riverside Academy 3-1 yesterday. Goals from Oliver (2) and Isla. Next match: Thursday vs St Mary''s.',
   'sport', 'normal',
   NULL, NULL, 'celebration'),
  ('Menu Change Thursday',
   'Due to a delivery issue, Thursday''s lunch will be fish fingers and chips instead of roast dinner. Friday''s menu is unchanged.',
   'menu', 'normal',
   NULL, NULL, 'ticker')
) AS n(title, body, notice_type, priority, event_date, event_location, display_style)
WHERE org.name ILIKE '%arrival%' OR org.name ILIKE '%aurora%'
LIMIT 8;
