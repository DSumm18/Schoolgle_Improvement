-- ═══════════════════════════════════════════════════════════════════════
-- EMERGENCY BROADCAST SYSTEM + SCHOOL BRANDING
-- Created: 2026-03-15
-- Purpose: Real-time zone-aware emergency broadcasting to all connected
--          devices (classroom screens, mobiles, tablets) with floor plan
--          integration. Plus central school branding assets.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SCHOOL BRANDING
-- Central brand assets used across dashboard, displays, documents, emails
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS school_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Visual identity
  logo_url TEXT,                          -- Primary logo (uploaded to storage)
  logo_dark_url TEXT,                     -- Logo variant for dark backgrounds
  crest_url TEXT,                         -- School crest/badge (for formal docs)
  favicon_url TEXT,                       -- Favicon for display mode

  -- Colours
  primary_color TEXT DEFAULT '#1e40af',   -- Main brand colour
  secondary_color TEXT DEFAULT '#059669', -- Accent colour
  alert_color TEXT DEFAULT '#dc2626',     -- Emergency/urgent colour

  -- Identity
  school_name TEXT,                       -- Display name (may differ from GIAS)
  school_motto TEXT,                      -- Motto/strapline
  school_type TEXT,                       -- e.g. 'Academy', 'VA Primary', 'MAT'
  trust_name TEXT,                        -- If part of a MAT
  trust_logo_url TEXT,                    -- Trust logo

  -- Display preferences
  display_theme TEXT DEFAULT 'light' CHECK (display_theme IN ('light', 'dark', 'auto')),
  show_trust_branding BOOLEAN DEFAULT false,
  show_motto_on_display BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_school_branding_org ON school_branding(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. EMERGENCY BROADCAST ZONES
-- Links estates_locations to emergency zones with proximity scoring
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES estates_locations(id) ON DELETE SET NULL,

  zone_name TEXT NOT NULL,               -- e.g. 'Main Building Ground Floor', 'Sports Hall'
  zone_code TEXT,                        -- Short code for quick reference: 'MBG', 'SH'
  zone_type TEXT DEFAULT 'building' CHECK (zone_type IN (
    'site', 'building', 'wing', 'floor', 'outdoor'
  )),

  -- Proximity mapping (which zones are adjacent)
  adjacent_zone_ids UUID[] DEFAULT '{}',

  -- Assembly point for this zone
  assembly_point TEXT,                   -- e.g. 'Main Playground - South Gate'
  evacuation_route TEXT,                 -- e.g. 'Exit via Fire Door B, turn left to playground'

  -- Floor plan reference
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,
  highlight_region JSONB,                -- SVG region coordinates to highlight on floor plan

  -- Display devices registered to this zone
  -- (devices self-register when entering display mode)
  device_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_zones_org ON emergency_zones(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_zones_location ON emergency_zones(location_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. EMERGENCY BROADCASTS (the live alerts)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert classification
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'lockdown',           -- Intruder/threat: SILENT, hide, lock doors
    'evacuation',         -- Fire/gas: GET OUT, go to assembly point
    'shelter_in_place',   -- External hazard: stay inside, seal rooms
    'medical',            -- Medical emergency in a zone
    'bomb_threat',        -- Bomb threat: evacuate AWAY from suspect area
    'invacuation',        -- Bring outdoor pupils inside immediately
    'all_clear',          -- Stand down from any active alert
    'custom'              -- School-defined alert type
  )),
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN (
    'critical',           -- Immediate danger to life (red)
    'urgent',             -- Serious but not immediate (amber)
    'warning',            -- Awareness needed (yellow)
    'info'                -- Information only (blue)
  )),

  -- What happened and where
  title TEXT NOT NULL,                   -- e.g. 'LOCKDOWN - Intruder reported near Reception'
  message TEXT NOT NULL,                 -- Full instructions
  custom_instructions TEXT,              -- Additional context

  -- Zone targeting
  affected_zone_ids UUID[] DEFAULT '{}', -- Which zones are directly affected
  affected_zone_names TEXT[] DEFAULT '{}', -- Denormalized for quick display
  is_whole_school BOOLEAN DEFAULT false, -- Affects entire site

  -- Floor plan overlay
  show_floor_plan BOOLEAN DEFAULT true,  -- Show site map with affected area highlighted
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,

  -- Linked emergency plan (shows relevant procedures)
  emergency_plan_id UUID REFERENCES emergency_plans(id) ON DELETE SET NULL,

  -- Audio/visual settings
  play_audio BOOLEAN DEFAULT true,       -- Play alarm sound on devices
  audio_type TEXT DEFAULT 'alarm' CHECK (audio_type IN (
    'alarm',              -- Continuous alarm tone
    'siren',              -- Wailing siren
    'bell',               -- Repeated bell rings
    'tone',               -- Single attention tone
    'voice',              -- TTS reads the message
    'silent'              -- NO audio (lockdown - don't reveal location)
  )),
  screen_color TEXT DEFAULT 'red',       -- Background colour of takeover screen
  flash_screen BOOLEAN DEFAULT false,    -- Flash the screen for attention

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',             -- Currently broadcasting
    'escalated',          -- Escalated to higher severity
    'resolved',           -- Stood down
    'cancelled',          -- False alarm / cancelled
    'drill'               -- This was a planned drill
  )),

  -- Who triggered it
  triggered_by UUID NOT NULL,            -- User ID who activated
  triggered_by_name TEXT,                -- Denormalized name for audit
  triggered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  triggered_from TEXT,                   -- 'dashboard', 'mobile', 'display_panel', 'api'

  -- Resolution
  resolved_by UUID,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Drill tracking
  is_drill BOOLEAN DEFAULT false,
  drill_id UUID REFERENCES emergency_drills(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_org
  ON emergency_broadcasts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_active
  ON emergency_broadcasts(organization_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_triggered
  ON emergency_broadcasts(triggered_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. ZONE-SPECIFIC INSTRUCTIONS
-- Different instructions per zone based on proximity to incident
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_zone_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES emergency_broadcasts(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES emergency_zones(id) ON DELETE CASCADE,

  proximity TEXT NOT NULL CHECK (proximity IN (
    'affected',           -- The zone where the incident is happening
    'adjacent',           -- Neighbouring zones - heightened caution
    'distant'             -- Far from incident - different behaviour
  )),

  -- Zone-specific messaging
  instruction TEXT NOT NULL,             -- e.g. 'EVACUATE IMMEDIATELY via Fire Door C'
  secondary_instruction TEXT,            -- e.g. 'Do NOT use Main Corridor'
  assembly_point TEXT,                   -- Override: where this zone should go
  evacuation_route TEXT,                 -- Override: specific route for this zone

  -- Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ezi_broadcast ON emergency_zone_instructions(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_ezi_zone ON emergency_zone_instructions(zone_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. DEVICE REGISTRATIONS
-- Tracks which devices/screens are connected and in which zone
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_display_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  device_name TEXT NOT NULL,             -- e.g. 'Year 3 Classroom Board', 'Reception Display'
  device_type TEXT DEFAULT 'display' CHECK (device_type IN (
    'display',            -- Interactive whiteboard / projector
    'mobile',             -- Staff mobile device
    'tablet',             -- Tablet (e.g. office iPad)
    'desktop',            -- Desktop computer
    'kiosk'               -- Digital signage / entrance screen
  )),

  zone_id UUID REFERENCES emergency_zones(id) ON DELETE SET NULL,
  room_name TEXT,                        -- Human-readable room name

  -- Connection state
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  connection_token TEXT UNIQUE,          -- Unique token for SSE auth

  -- Capabilities
  has_audio BOOLEAN DEFAULT true,        -- Can play alarm sounds
  has_display BOOLEAN DEFAULT true,      -- Can show visual alerts
  screen_size TEXT,                      -- e.g. '1920x1080'

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edd_org ON emergency_display_devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_edd_zone ON emergency_display_devices(zone_id);
CREATE INDEX IF NOT EXISTS idx_edd_token ON emergency_display_devices(connection_token);
CREATE INDEX IF NOT EXISTS idx_edd_online ON emergency_display_devices(organization_id)
  WHERE is_online = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. ACKNOWLEDGEMENT TRACKING
-- Every room/device must acknowledge they received the alert
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES emergency_broadcasts(id) ON DELETE CASCADE,
  device_id UUID REFERENCES emergency_display_devices(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES emergency_zones(id) ON DELETE SET NULL,

  acknowledged_by UUID,                  -- User who pressed acknowledge
  acknowledged_by_name TEXT,
  acknowledged_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Status report from this location
  headcount INT,                         -- Number of people in this location
  all_accounted_for BOOLEAN,             -- Everyone present?
  missing_persons TEXT,                  -- Names of anyone unaccounted for
  needs_assistance BOOLEAN DEFAULT false, -- Medical/mobility assistance needed
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ea_broadcast ON emergency_acknowledgements(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_ea_zone ON emergency_acknowledgements(zone_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. BROADCAST AUDIT LOG
-- Immutable timeline of every action during an emergency
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emergency_broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES emergency_broadcasts(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'triggered',          -- Alert activated
    'escalated',          -- Severity increased
    'zone_added',         -- Additional zone affected
    'instruction_sent',   -- Zone instruction dispatched
    'acknowledged',       -- Room/device acknowledged
    'all_clear',          -- Stand down issued
    'resolved',           -- Emergency resolved
    'cancelled',          -- Alert cancelled (false alarm)
    'message_updated',    -- Instructions updated mid-emergency
    'device_connected',   -- New device joined
    'device_disconnected', -- Device lost connection
    'assistance_requested', -- Help requested from a zone
    'parent_notified',    -- Parent notification sent
    'emergency_services'  -- 999 called / arrived
  )),

  actor_id UUID,
  actor_name TEXT,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ebl_broadcast
  ON emergency_broadcast_log(broadcast_id, timestamp);

-- ═══════════════════════════════════════════════════════════════════════
-- 8. SEED DATA: Arrival Primary School
-- ═══════════════════════════════════════════════════════════════════════

-- School branding for demo org
INSERT INTO school_branding (
  organization_id,
  school_name, school_motto, school_type,
  primary_color, secondary_color,
  display_theme, show_motto_on_display
)
SELECT
  id,
  'Arrival Primary School',
  'Every child, every chance, every day',
  'Academy',
  '#1e40af', '#059669',
  'light', true
FROM organizations
WHERE name ILIKE '%arrival%' OR name ILIKE '%aurora%'
LIMIT 1
ON CONFLICT (organization_id) DO NOTHING;

-- Emergency zones for demo (linked to estates_locations if they exist)
DO $$
DECLARE
  v_org_id UUID;
  v_zone_main UUID;
  v_zone_upper UUID;
  v_zone_nursery UUID;
  v_zone_hall UUID;
  v_zone_outdoor UUID;
  v_zone_sports UUID;
BEGIN
  -- Get demo org
  SELECT id INTO v_org_id FROM organizations
  WHERE name ILIKE '%arrival%' OR name ILIKE '%aurora%'
  LIMIT 1;

  IF v_org_id IS NULL THEN RETURN; END IF;

  -- Create emergency zones
  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Main Building - Ground Floor', 'MBG', 'floor',
     'Main Playground (South Gate)', 'Exit via nearest fire door to south playground')
  RETURNING id INTO v_zone_main;

  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Main Building - Upper Floor', 'MBU', 'floor',
     'Main Playground (South Gate)', 'Descend via stairwell A or B, exit to south playground')
  RETURNING id INTO v_zone_upper;

  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Nursery & Reception Wing', 'NRW', 'wing',
     'Nursery Garden (East)', 'Exit via Nursery fire door to east garden')
  RETURNING id INTO v_zone_nursery;

  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Assembly Hall & Kitchen', 'AHK', 'building',
     'Main Playground (South Gate)', 'Exit via hall fire doors to south playground')
  RETURNING id INTO v_zone_hall;

  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Playground & Outdoor Areas', 'OUT', 'outdoor',
     'Sports Field (Far End)', 'Walk to far end of sports field')
  RETURNING id INTO v_zone_outdoor;

  INSERT INTO emergency_zones (organization_id, zone_name, zone_code, zone_type, assembly_point, evacuation_route)
  VALUES
    (v_org_id, 'Sports Hall & Changing Rooms', 'SPH', 'building',
     'Sports Field (Far End)', 'Exit via sports hall fire doors to field')
  RETURNING id INTO v_zone_sports;

  -- Set adjacency relationships
  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_upper, v_zone_hall, v_zone_nursery]
  WHERE id = v_zone_main;

  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_main]
  WHERE id = v_zone_upper;

  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_main, v_zone_outdoor]
  WHERE id = v_zone_nursery;

  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_main, v_zone_outdoor]
  WHERE id = v_zone_hall;

  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_nursery, v_zone_hall, v_zone_sports]
  WHERE id = v_zone_outdoor;

  UPDATE emergency_zones SET adjacent_zone_ids = ARRAY[v_zone_outdoor]
  WHERE id = v_zone_sports;

END $$;
