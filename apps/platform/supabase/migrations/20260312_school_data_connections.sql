-- School Data Connections
-- Generalised drive/cloud connection for all school data (MIS, Finance, Documents)
-- Replaces the Ofsted-specific ofsted_drive_connections for new connections

CREATE TABLE IF NOT EXISTS public.school_data_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'onedrive', 'sharepoint')),
    folder_id TEXT NOT NULL,
    folder_name TEXT,

    -- Auth
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expiry TIMESTAMPTZ,

    -- Connection metadata
    connected_by TEXT,
    connected_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,

    -- Scan state
    last_scan_at TIMESTAMPTZ,
    scan_status TEXT DEFAULT 'idle' CHECK (scan_status IN ('idle', 'scanning', 'complete', 'error')),
    scan_error TEXT,

    -- Detected folder structure (JSON map of folder paths to data categories)
    detected_folders JSONB DEFAULT '{}',
    -- e.g. {"MIS Exports/Pupil Data": {"category": "pupils", "files": 2}, "Finance Exports/Budget Reports": {"category": "fms", "files": 3}}

    -- Stats
    total_files INTEGER DEFAULT 0,
    total_folders INTEGER DEFAULT 0,
    last_modified_file TIMESTAMPTZ,

    -- One connection per org per provider
    UNIQUE(organization_id, provider)
);

-- RLS
ALTER TABLE public.school_data_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school_data_connections_org_access' AND tablename = 'school_data_connections') THEN
        CREATE POLICY school_data_connections_org_access ON public.school_data_connections
            FOR ALL
            USING (
                organization_id IN (
                    SELECT om.organization_id::uuid FROM organization_members om
                    WHERE om.user_id = auth.uid()::text
                )
            );
    END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_school_data_connections_org ON public.school_data_connections(organization_id);
