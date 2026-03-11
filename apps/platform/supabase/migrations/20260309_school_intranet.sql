-- School Intranet Tables for Dashboard Redesign
-- Tables: school_announcements, school_quick_links, school_events

-- School Announcements
CREATE TABLE IF NOT EXISTS school_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  author_name TEXT,
  author_id UUID,
  pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- School Quick Links
CREATE TABLE IF NOT EXISTS school_quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  icon TEXT DEFAULT 'link',
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  link_type TEXT DEFAULT 'url' CHECK (link_type IN ('url','file','page')),
  file_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- School Events
CREATE TABLE IF NOT EXISTS school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'general' CHECK (event_type IN ('general','meeting','training','assembly','trip','deadline','holiday','inspection')),
  all_day BOOLEAN DEFAULT false,
  recurring TEXT CHECK (recurring IN ('none','daily','weekly','monthly','yearly')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_quick_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_read_announcements" ON school_announcements;
DROP POLICY IF EXISTS "org_admin_manage_announcements" ON school_announcements;
DROP POLICY IF EXISTS "org_member_read_quick_links" ON school_quick_links;
DROP POLICY IF EXISTS "org_admin_manage_quick_links" ON school_quick_links;
DROP POLICY IF EXISTS "org_member_read_events" ON school_events;
DROP POLICY IF EXISTS "org_admin_manage_events" ON school_events;
DROP POLICY IF EXISTS "service_role_all_announcements" ON school_announcements;
DROP POLICY IF EXISTS "service_role_all_quick_links" ON school_quick_links;
DROP POLICY IF EXISTS "service_role_all_events" ON school_events;

CREATE POLICY "org_member_read_announcements" ON school_announcements
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text
    )
  );

CREATE POLICY "org_admin_manage_announcements" ON school_announcements
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text AND om.role IN ('admin','slt')
    )
  );

CREATE POLICY "org_member_read_quick_links" ON school_quick_links
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text
    )
  );

CREATE POLICY "org_admin_manage_quick_links" ON school_quick_links
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text AND om.role IN ('admin','slt')
    )
  );

CREATE POLICY "org_member_read_events" ON school_events
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text
    )
  );

CREATE POLICY "org_admin_manage_events" ON school_events
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()::text AND om.role IN ('admin','slt')
    )
  );

-- Service role bypass policies for API routes
CREATE POLICY "service_role_all_announcements" ON school_announcements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_quick_links" ON school_quick_links
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_events" ON school_events
  FOR ALL USING (auth.role() = 'service_role');
