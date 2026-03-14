-- ============================================================
-- School Website Builder — Database Schema
-- ============================================================
-- Stores website configurations, pages, content blocks,
-- media assets, navigation menus, and published snapshots.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Website configurations (one per organization)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  school_phase TEXT NOT NULL DEFAULT 'primary' CHECK (school_phase IN ('primary', 'secondary', 'all_through', 'any')),

  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  motto TEXT,

  -- Design system selections
  preset_id TEXT NOT NULL DEFAULT 'friendly',
  palette JSONB NOT NULL DEFAULT '{}',
  font_pairing_id TEXT NOT NULL DEFAULT 'nunito',
  hero_mask_id TEXT NOT NULL DEFAULT 'wave_bottom',

  -- Layer overrides (sparse — only what the school changed from the preset)
  layout_overrides JSONB DEFAULT '{}',
  shape_overrides JSONB DEFAULT '{}',
  colour_overrides JSONB DEFAULT '{}',
  typography_overrides JSONB DEFAULT '{}',
  motion_overrides JSONB DEFAULT '{}',
  imagery_overrides JSONB DEFAULT '{}',

  -- Homepage section visibility
  homepage_sections JSONB NOT NULL DEFAULT '{
    "hero": true,
    "welcome": true,
    "quickLinks": true,
    "latestNews": true,
    "keyInformation": true,
    "schoolValues": true,
    "galleryHighlight": true,
    "statistics": true,
    "testimonials": false,
    "socialFeed": false
  }',

  -- Content import
  imported_from_url TEXT,
  imported_at TIMESTAMPTZ,

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'setup', 'building', 'published', 'archived')),
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  last_published_html TEXT, -- hash of last published snapshot

  -- SEO defaults
  seo_title TEXT,
  seo_description TEXT,
  seo_image_url TEXT,

  -- Analytics
  google_analytics_id TEXT,
  cookie_consent_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Social links
  social_links JSONB DEFAULT '{}',

  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (organization_id)
);

-- Index for subdomain lookup (public website serving)
CREATE INDEX IF NOT EXISTS idx_school_websites_subdomain ON school_websites(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_websites_custom_domain ON school_websites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_websites_org ON school_websites(organization_id);

-- ------------------------------------------------------------
-- 2. Pages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Page identity
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'content' CHECK (page_type IN (
    'home', 'content', 'news_index', 'news_article', 'events', 'gallery',
    'contact', 'policies', 'staff', 'governors', 'curriculum',
    'admissions', 'send', 'pupil_premium', 'sports_premium', 'values',
    'custom'
  )),

  -- Hierarchy
  parent_id UUID REFERENCES website_pages(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Content (array of content blocks as JSONB)
  content_blocks JSONB NOT NULL DEFAULT '[]',

  -- Page-level overrides
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  show_breadcrumbs BOOLEAN NOT NULL DEFAULT true,
  show_sidebar BOOLEAN NOT NULL DEFAULT false,
  sidebar_content JSONB DEFAULT '[]',

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_image_url TEXT,
  no_index BOOLEAN NOT NULL DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Template
  template TEXT DEFAULT 'default',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_website_pages_website ON website_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_org ON website_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_parent ON website_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_type ON website_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_website_pages_slug ON website_pages(website_id, slug);

-- ------------------------------------------------------------
-- 3. Navigation menus
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  menu_location TEXT NOT NULL DEFAULT 'main' CHECK (menu_location IN ('main', 'footer', 'quick_links', 'utility')),
  label TEXT NOT NULL,
  url TEXT, -- null if page_id is set
  page_id UUID REFERENCES website_pages(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES website_navigation(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  icon TEXT, -- optional icon name

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_nav_website ON website_navigation(website_id);
CREATE INDEX IF NOT EXISTS idx_website_nav_location ON website_navigation(website_id, menu_location);

-- ------------------------------------------------------------
-- 4. Media library
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image/jpeg, application/pdf, etc.
  file_size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  folder TEXT DEFAULT 'general',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_media_website ON website_media(website_id);
CREATE INDEX IF NOT EXISTS idx_website_media_type ON website_media(file_type);

-- ------------------------------------------------------------
-- 5. News / blog posts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content_blocks JSONB NOT NULL DEFAULT '[]',
  featured_image_url TEXT,
  category TEXT DEFAULT 'news',
  tags TEXT[] DEFAULT '{}',
  author_name TEXT,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_website_posts_website ON website_posts(website_id);
CREATE INDEX IF NOT EXISTS idx_website_posts_status ON website_posts(website_id, status);
CREATE INDEX IF NOT EXISTS idx_website_posts_published ON website_posts(website_id, published_at DESC) WHERE status = 'published';

-- ------------------------------------------------------------
-- 6. Published snapshots (for static HTML delivery)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_published_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  version INTEGER NOT NULL DEFAULT 1,
  snapshot_hash TEXT NOT NULL,

  -- The full static site as a JSON map: { "/path": "<html>..." }
  pages JSONB NOT NULL DEFAULT '{}',

  -- Generated CSS
  css TEXT NOT NULL DEFAULT '',

  -- Metadata at time of publish
  page_count INTEGER NOT NULL DEFAULT 0,
  total_size_bytes INTEGER DEFAULT 0,

  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_snapshots_website ON website_published_snapshots(website_id);
CREATE INDEX IF NOT EXISTS idx_website_snapshots_latest ON website_published_snapshots(website_id, version DESC);

-- ------------------------------------------------------------
-- 7. Compliance checklist (DfE statutory requirements)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  requirement_id TEXT NOT NULL, -- references the static requirements list
  requirement_name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_statutory BOOLEAN NOT NULL DEFAULT true,

  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'not_applicable')),
  page_id UUID REFERENCES website_pages(id) ON DELETE SET NULL, -- which page satisfies this
  notes TEXT,
  last_checked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (website_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_website_compliance_website ON website_compliance_items(website_id);
CREATE INDEX IF NOT EXISTS idx_website_compliance_status ON website_compliance_items(website_id, status);

-- ------------------------------------------------------------
-- 8. Form submissions (contact forms on the published website)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES school_websites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  form_type TEXT NOT NULL DEFAULT 'contact',
  data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  ip_hash TEXT, -- hashed for GDPR
  read BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_forms_website ON website_form_submissions(website_id);
CREATE INDEX IF NOT EXISTS idx_website_forms_unread ON website_form_submissions(website_id, read) WHERE read = false;

-- ------------------------------------------------------------
-- RLS Policies
-- ------------------------------------------------------------

ALTER TABLE school_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_published_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_form_submissions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; these policies are for client-side access
CREATE POLICY "org_access" ON school_websites FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_pages FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_navigation FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_media FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_posts FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_published_snapshots FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_compliance_items FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

CREATE POLICY "org_access" ON website_form_submissions FOR ALL
  USING (organization_id = auth.uid()::uuid OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- Updated_at triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON school_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON website_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON website_navigation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON website_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON website_compliance_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
