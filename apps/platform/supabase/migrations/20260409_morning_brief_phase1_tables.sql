-- Morning Brief Phase 1 — additional foundation tables
-- Spec: Task 033 — calendar_connections, staff_timetable, supply_agencies, staff_absences

-- ─── 1. calendar_connections ───────────────────────────────────────
-- OAuth connections to Google / Microsoft calendars

CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('school', 'individual')),
  encrypted_refresh_token TEXT NOT NULL,
  calendar_ids TEXT[],
  scopes TEXT[],
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  UNIQUE(user_id, provider, connection_type)
);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connections" ON calendar_connections
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role calendar access" ON calendar_connections
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 2. staff_timetable ────────────────────────────────────────────
-- Foundation for cover management — who teaches what, when

CREATE TABLE IF NOT EXISTS staff_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  period_number INTEGER NOT NULL,
  period_start TIME NOT NULL,
  period_end TIME NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('teaching', 'ppa', 'leadership', 'duty', 'intervention', 'available', 'other')),
  class_group TEXT,
  room TEXT,
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, day_of_week, period_number, effective_from)
);

ALTER TABLE staff_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_timetable_org_read" ON staff_timetable
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = staff_timetable.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "staff_timetable_org_write" ON staff_timetable
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = staff_timetable.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
        AND role IN ('admin', 'headteacher', 'slt')
    )
  );

CREATE POLICY "staff_timetable_service" ON staff_timetable
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 3. supply_agencies ────────────────────────────────────────────
-- Contractor register for supply / agency staff

CREATE TABLE IF NOT EXISTS supply_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  specialisms TEXT[],
  avg_response_time_hours DECIMAL(5,2),
  day_rate_gbp DECIMAL(8,2),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supply_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supply_agencies_org_read" ON supply_agencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = supply_agencies.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "supply_agencies_org_write" ON supply_agencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = supply_agencies.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
        AND role IN ('admin', 'headteacher', 'slt')
    )
  );

CREATE POLICY "supply_agencies_service" ON supply_agencies
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 4. staff_absences ─────────────────────────────────────────────
-- Absence tracking with cover status

CREATE TABLE IF NOT EXISTS staff_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  absence_date DATE NOT NULL,
  absence_type TEXT NOT NULL CHECK (absence_type IN ('sick', 'planned', 'emergency', 'training', 'trip', 'other')),
  cover_status TEXT DEFAULT 'pending' CHECK (cover_status IN ('pending', 'arranged', 'not_required')),
  cover_notes TEXT,
  supply_agency_id UUID REFERENCES supply_agencies(id),
  reported_by UUID,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  notify_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, absence_date)
);

ALTER TABLE staff_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_absences_org_read" ON staff_absences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = staff_absences.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "staff_absences_org_write" ON staff_absences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = staff_absences.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "staff_absences_service" ON staff_absences
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Indexes ───────────────────────────────────────────────────────

CREATE INDEX idx_calendar_connections_user ON calendar_connections (user_id, provider);
CREATE INDEX idx_staff_timetable_org_day ON staff_timetable (organization_id, day_of_week);
CREATE INDEX idx_supply_agencies_org ON supply_agencies (organization_id, is_active);
CREATE INDEX idx_staff_absences_org_date ON staff_absences (organization_id, absence_date);
CREATE INDEX idx_staff_absences_cover ON staff_absences (organization_id, cover_status) WHERE cover_status = 'pending';
