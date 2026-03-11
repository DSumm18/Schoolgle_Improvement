-- Ofsted Drive Connections & Safeguarding Assessment
-- Persistent cloud drive connections for scheduled scans
-- Safeguarding checklist for binary Met/Not Met assessment

-- Drive connections table
CREATE TABLE IF NOT EXISTS public.ofsted_drive_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'onedrive')),
    folder_id TEXT NOT NULL,
    folder_name TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expiry TIMESTAMPTZ,
    connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_scan_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    scan_frequency TEXT DEFAULT 'manual' CHECK (scan_frequency IN ('manual', 'daily', 'weekly', 'monthly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, provider)
);

-- Safeguarding checklist items
CREATE TABLE IF NOT EXISTS public.ofsted_safeguarding_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    check_item TEXT NOT NULL,
    is_met BOOLEAN DEFAULT false,
    notes TEXT,
    evidence_link TEXT,
    checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, check_item)
);

-- Document presence check results
CREATE TABLE IF NOT EXISTS public.ofsted_document_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES public.ofsted_drive_connections(id) ON DELETE SET NULL,
    evaluation_area TEXT NOT NULL,
    expected_document TEXT NOT NULL,
    found BOOLEAN DEFAULT false,
    found_filename TEXT,
    found_path TEXT,
    found_modified_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'required' CHECK (priority IN ('required', 'recommended', 'optional')),
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, evaluation_area, expected_document)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drive_connections_org ON public.ofsted_drive_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_drive_connections_active ON public.ofsted_drive_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_safeguarding_checks_org ON public.ofsted_safeguarding_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_checks_org ON public.ofsted_document_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_checks_area ON public.ofsted_document_checks(evaluation_area);

-- RLS
ALTER TABLE public.ofsted_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofsted_safeguarding_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofsted_document_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drive connections
CREATE POLICY "Users can view own org drive connections"
    ON public.ofsted_drive_connections FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage drive connections"
    ON public.ofsted_drive_connections FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM user_org_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'slt')
    ));

-- RLS Policies for safeguarding checks
CREATE POLICY "Users can view own org safeguarding checks"
    ON public.ofsted_safeguarding_checks FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org safeguarding checks"
    ON public.ofsted_safeguarding_checks FOR ALL
    USING (organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid()));

-- RLS Policies for document checks
CREATE POLICY "Users can view own org document checks"
    ON public.ofsted_document_checks FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org document checks"
    ON public.ofsted_document_checks FOR ALL
    USING (organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid()));

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_ofsted_drive_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_drive_connections ON public.ofsted_drive_connections;
CREATE TRIGGER trigger_update_drive_connections
    BEFORE UPDATE ON public.ofsted_drive_connections
    FOR EACH ROW EXECUTE FUNCTION update_ofsted_drive_connections_updated_at();

CREATE OR REPLACE FUNCTION update_ofsted_safeguarding_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_safeguarding_checks ON public.ofsted_safeguarding_checks;
CREATE TRIGGER trigger_update_safeguarding_checks
    BEFORE UPDATE ON public.ofsted_safeguarding_checks
    FOR EACH ROW EXECUTE FUNCTION update_ofsted_safeguarding_checks_updated_at();

-- Comments
COMMENT ON TABLE public.ofsted_drive_connections IS 'Persistent Google Drive/OneDrive connections for Ofsted evidence scanning';
COMMENT ON TABLE public.ofsted_safeguarding_checks IS 'Safeguarding checklist items for binary Met/Not Met assessment';
COMMENT ON TABLE public.ofsted_document_checks IS 'Document presence check results against expected evidence checklist';
