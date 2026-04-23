-- School Rooms table for interactive site plan viewer
-- Stores room polygons, compliance status, and fire safety data

CREATE TABLE IF NOT EXISTS school_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,

  -- Identity
  room_name TEXT NOT NULL,
  room_code TEXT,
  block TEXT,
  room_type TEXT,
  floor TEXT DEFAULT 'ground',

  -- Polygon coordinates for Leaflet [[y,x], [y,x], ...]
  -- Uses CRS.Simple coordinate system (pixel coordinates from floor plan image)
  polygon_coords JSONB,

  -- Compliance
  compliance_status TEXT DEFAULT 'unknown'
    CHECK (compliance_status IN ('compliant', 'action_needed', 'overdue', 'unknown')),
  condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
  last_inspection_date DATE,
  next_inspection_due DATE,

  -- Fire safety
  fire_equipment JSONB DEFAULT '[]'::jsonb,
  has_emergency_lighting BOOLEAN DEFAULT false,
  has_fire_door BOOLEAN DEFAULT false,
  is_fire_escape_route BOOLEAN DEFAULT false,

  -- COSHH
  coshh_items_count INTEGER DEFAULT 0,
  coshh_last_audit DATE,

  -- Meta
  area_sqm NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE school_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view rooms for their own schools
CREATE POLICY "Users can view rooms for their school"
  ON school_rooms FOR SELECT
  USING (school_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert rooms for their school"
  ON school_rooms FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms for their school"
  ON school_rooms FOR UPDATE
  USING (
    school_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete rooms"
  ON school_rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_school_rooms_school_id ON school_rooms(school_id);
CREATE INDEX IF NOT EXISTS idx_school_rooms_block ON school_rooms(block);
CREATE INDEX IF NOT EXISTS idx_school_rooms_compliance ON school_rooms(compliance_status);
CREATE INDEX IF NOT EXISTS idx_school_rooms_room_type ON school_rooms(room_type);

-- Comments for documentation
COMMENT ON TABLE school_rooms IS 'Stores room data for interactive site plan viewer with polygon coordinates for Leaflet.js overlays';
COMMENT ON COLUMN school_rooms.polygon_coords IS 'Leaflet polygon coordinates as [[y,x], [y,x], ...] using CRS.Simple (pixel coords from floor plan image)';
COMMENT ON COLUMN school_rooms.compliance_status IS 'Compliance status: compliant=green, action_needed=amber, overdue=red, unknown=gray';
COMMENT ON COLUMN school_rooms.fire_equipment IS 'JSON array of fire equipment items with type, location, last_test_date';

-- Seed data for Grove House Primary School (demo data)
-- Replace with actual school_id in production
INSERT INTO school_rooms (
  id,
  school_id,
  room_name,
  block,
  room_type,
  polygon_coords,
  compliance_status,
  condition_rating,
  last_inspection_date,
  next_inspection_due,
  fire_equipment,
  has_emergency_lighting,
  has_fire_door,
  is_fire_escape_route,
  area_sqm
) VALUES
-- Main Hall (Block 1 - bottom center)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
 'Main Hall', 'Block 1', 'Hall',
  [[900, 400], [900, 900], [1300, 900], [1300, 400]],
  'compliant', 5,
  '2025-02-15', '2025-08-15',
  '[{"type": "extinguisher", "location": "Main entrance", "last_tested": "2025-01-10", "status": "compliant"}]',
  true, true, true, 120.5
),
-- Classrooms (Block 2 - above Main Hall)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Classroom 1', 'Block 2', 'Classroom',
  [[900, 200], [900, 450], [1100, 450], [1100, 200]],
  'action_needed', 4,
  '2025-01-20', '2025-07-20',
  '[{"type": "extinguisher", "location": "By door", "last_tested": "2024-12-01", "status": "compliant"}]',
  true, false, false, 45.0
),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Classroom 2', 'Block 2', 'Classroom',
  [[1100, 200], [1100, 450], [1300, 450], [1300, 200]],
  'compliant', 5,
  '2025-02-15', '2025-08-15',
  '[]',
  true, false, false, 45.0
),
-- Reception & Office (Block 3 - left center)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Reception', 'Block 3', 'Office',
  [[200, 700], [200, 1100], [600, 1100], [600, 700]],
  'compliant', 5,
  '2025-01-10', '2025-07-10',
  '[{"type": "detector", "location": "Ceiling", "last_tested": "2025-01-05", "status": "compliant"}]',
  true, false, false, 55.0
),
-- 2017 Extension (Block 4 - top left)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Staff Room', 'Block 4', 'Staff Room',
  [[200, 200], [200, 650], [550, 650], [550, 200]],
  'overdue', 3,
  '2024-11-01', '2025-02-01',
  '[{"type": "extinguisher", "location": "Near exit", "last_tested": "2024-10-15", "status": "expired"}]',
  false, true, false, 35.0
),
-- Right Wing (Block 5 - right side)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Library', 'Block 5', 'Library',
  [[1350, 200], [1350, 700], [1700, 700], [1700, 200]],
  'action_needed', 4,
  '2025-01-05', '2025-07-05',
  '[{"type": "detector", "location": "Main area", "last_tested": "2024-12-20", "status": "compliant"}]',
  true, false, false, 85.0
),
-- Bottom Right (Block 6)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Kitchen', 'Block 6', 'Kitchen',
  [[400, 1100], [400, 1260], [700, 1260], [700, 1100]],
  'compliant', 5,
  '2025-02-01', '2025-08-01',
  '[{"type": "extinguisher", "location": "Rear entrance", "last_tested": "2025-01-20", "status": "compliant"}]',
  true, true, true, 40.0
),
-- Hallway (main corridor)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
  'Main Hallway', 'Block 1', 'Corridor',
  [[1300, 400], [1300, 1100], [1400, 1100], [1400, 400]],
  'compliant', 4,
  '2025-01-15', '2025-07-15',
  '[]',
  true, false, true, 25.0
)
ON CONFLICT DO NOTHING;

