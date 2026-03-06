-- Ed Website Embed Configuration
-- Stores how Ed should appear on each school's website

CREATE TABLE IF NOT EXISTS ed_embed_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  embed_key TEXT NOT NULL UNIQUE, -- Random key used in script tag

  -- School info
  school_name TEXT NOT NULL,
  website_url TEXT,

  -- Widget configuration
  welcome_message TEXT DEFAULT 'Hi! I''m Ed, your school assistant. How can I help you today?',
  theme TEXT DEFAULT 'standard' CHECK (theme IN ('standard', 'warm', 'cool', 'contrast')),
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  accent_color TEXT DEFAULT '#0ea5e9',
  features TEXT[] DEFAULT ARRAY['chat', 'voice'],

  -- Security
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = allow all
  is_active BOOLEAN DEFAULT TRUE,

  -- Tracking
  load_count INTEGER DEFAULT 0,
  last_loaded_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT one_config_per_org UNIQUE (organization_id)
);

CREATE INDEX idx_ed_embed_key ON ed_embed_configs(embed_key) WHERE is_active = TRUE;

ALTER TABLE ed_embed_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_embed" ON ed_embed_configs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_manage_embed" ON ed_embed_configs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'slt')
    )
  );

CREATE POLICY "service_manage_embed" ON ed_embed_configs
  FOR ALL USING (auth.role() = 'service_role');
