-- Estates Floor Plans - 3D Building Visualization
-- Stores AI-detected building models from uploaded PDF/Image floor plans

CREATE TABLE IF NOT EXISTS estates_floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,

  -- The complete 3D building data (JSONB)
  building_data JSONB NOT NULL,

  -- File reference (stored in Supabase Storage)
  file_url TEXT,
  file_name TEXT,
  file_type TEXT, -- 'application/pdf', 'image/png', etc.

  -- AI Detection metadata
  detection_confidence DECIMAL(3,2),
  rooms_detected INTEGER,
  processed_at TIMESTAMPTZ,

  -- User corrections
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_estates_floor_plans_org ON estates_floor_plans(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estates_floor_plans_created ON estates_floor_plans(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estates_floor_plans_verified ON estates_floor_plans(is_verified) WHERE deleted_at IS NULL;

-- GIN index for building_data JSONB queries
CREATE INDEX IF NOT EXISTS idx_estates_floor_plans_building_data ON estates_floor_plans USING GIN (building_data);

-- RLS Policies
ALTER TABLE estates_floor_plans ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own floor plans
CREATE POLICY "Organizations can view own floor plans"
  ON estates_floor_plans FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  ));

-- Organizations can insert floor plans
CREATE POLICY "Organizations can insert floor plans"
  ON estates_floor_plans FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  ));

-- Organizations can update their own floor plans
CREATE POLICY "Organizations can update own floor plans"
  ON estates_floor_plans FOR UPDATE
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  ));

-- Organizations can delete their own floor plans
CREATE POLICY "Organizations can delete own floor plans"
  ON estates_floor_plans FOR DELETE
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  ));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_estates_floor_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estates_floor_plans_updated_at
  BEFORE UPDATE ON estates_floor_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_estates_floor_plans_updated_at();

-- Comments
COMMENT ON TABLE estates_floor_plans IS '3D building models extracted from school floor plans using AI vision models';
COMMENT ON COLUMN estates_floor_plans.building_data IS 'Complete Building3DData structure with rooms, floors, buildings as JSONB';
COMMENT ON COLUMN estates_floor_plans.detection_confidence IS 'AI model confidence score (0-1) from room detection';
COMMENT ON COLUMN estates_floor_plans.rooms_detected IS 'Number of rooms detected by the AI model';
