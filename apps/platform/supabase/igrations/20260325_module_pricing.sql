-- Module Pricing Table
-- Stores pricing per module for subscription calculations

CREATE TABLE IF NOT EXISTS module_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE, -- e.g., 'improvement', 'estates', etc.
  module_name TEXT NOT NULL, -- Display name
  description TEXT,
  planet TEXT, -- Solar System planet (Mercury, Venus, etc.)
  price_monthly INTEGER NOT NULL DEFAULT 0, -- Price in pence (£)
  price_yearly INTEGER NOT NULL DEFAULT 0, -- Price in pence (£)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE module_pricing ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage pricing
CREATE POLICY "Super admins can view module pricing"
  ON module_pricing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
      OR email = auth.email()
    )
  );

CREATE POLICY "Super admins can insert module pricing"
  ON module_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
      OR email = auth.email()
    )
  );

CREATE POLICY "Super admins can update module pricing"
  ON module_pricing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
      OR email = auth.email()
    )
  );

CREATE POLICY "Super admins can delete module pricing"
  ON module_pricing FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
      OR email = auth.email()
    )
  );

-- Insert Solar System module pricing
INSERT INTO module_pricing (module_id, module_name, description, planet, price_monthly, price_yearly, sort_order) VALUES
-- Mercury (School Improvement)
('improvement', 'School Improvement', 'Ofsted readiness, evidence management, SEF generation', 'Mercury', 4900, 49000, 1),

-- Venus (Governance)
('governance', 'Governance', 'Board meetings, training, policies, compliance tracking', 'Venus', 2900, 29000, 2),

-- Earth (Business Operations)
('estates', 'Business Operations', 'Compliance, asset register, contractors, HR', 'Earth', 3900, 39000, 3),

-- Mars (Compliance & Safeguarding)
('compliance', 'Compliance & Safeguarding', 'GDPR, policies, training, SCR, DSL concern logging', 'Mars', 2900, 29000, 4),

-- Jupiter (Communications)
('communications', 'Communications', 'Newsletters, notices, calendar, messaging', 'Jupiter', 1900, 19000, 5),

-- Saturn (Intelligence)
('intelligence', 'Schoolgle Intelligence', 'DfE trends, benchmarks, predictive analytics', 'Saturn', 3900, 39000, 6),

-- Uranus (Teaching & Learning)
('teaching', 'Teaching & Learning', 'Curriculum planning, assessment, observations', 'Uranus', 2900, 29000, 7),

-- Additional modules
('ed-ai', 'Ed AI', 'AI chatbot assistant with specialist agents', 'Moon', 4900, 49000, 8),
('surveys', 'Surveys', 'Survey builder and analysis', 'Asteroid', 900, 9000, 9),
('canvas', 'Canvas', 'Data intelligence platform', 'Asteroid', 2900, 29000, 10)

ON CONFLICT (module_id) DO NOTHING;

-- Helper function to calculate subscription total
CREATE OR REPLACE FUNCTION calculate_subscription_total(p_module_ids TEXT[])
RETURNS TABLE (
  module_id TEXT,
  module_name TEXT,
  price_monthly INTEGER,
  price_yearly INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.module_id,
    mp.module_name,
    mp.price_monthly,
    mp.price_yearly
  FROM module_pricing mp
  WHERE mp.module_id = ANY(p_module_ids)
    AND mp.is_active = true
  ORDER BY mp.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_module_pricing_module_id ON module_pricing(module_id);
CREATE INDEX IF NOT EXISTS idx_module_pricing_planet ON module_pricing(planet);
CREATE INDEX IF NOT EXISTS idx_module_pricing_active ON module_pricing(is_active);
