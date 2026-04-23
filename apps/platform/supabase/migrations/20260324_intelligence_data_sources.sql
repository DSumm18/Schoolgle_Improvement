-- Intelligence Data Sources
-- Tracks individual data files (census XMLs, assessment CTFs) for the Intelligence module
-- Each row represents one detected/parsed file type

CREATE TABLE IF NOT EXISTS public.intelligence_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Source identification
    source_type TEXT NOT NULL CHECK (source_type IN (
        'census_school',      -- School census XML
        'census_workforce',   -- Workforce census XML
        'assessment_eyfsp',   -- EYFSP results
        'assessment_phonics', -- Phonics screening check
        'assessment_ks1',     -- KS1 teacher assessment
        'assessment_ks2',     -- KS2 results
        'assessment_mtc',     -- Multiplication tables check
        'demographics_csv',   -- Class demographic CSVs
        'sen_report'          -- SEN register report
    )),

    -- File metadata
    file_id TEXT NOT NULL,              -- Google Drive file ID or OneDrive item ID
    file_name TEXT,
    file_mime_type TEXT,
    file_size BIGINT,
    file_modified_time TIMESTAMPTZ,

    -- Storage provider
    provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive', 'local')),

    -- Parsing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',     -- Detected but not yet parsed
        'parsing',     -- Currently being parsed
        'connected',   -- Successfully parsed and data available
        'partial',     -- Parsed but some data missing/incomplete
        'error'        -- Failed to parse
    )),

    -- Parsed data summary (cached for quick UI access)
    record_count INTEGER DEFAULT 0,
    data_summary JSONB DEFAULT '{}',  -- e.g. {"totalPupils": 408, "senCount": 95}

    -- Parsing metadata
    parsed_at TIMESTAMPTZ,
    parse_error TEXT,
    last_validated TIMESTAMPTZ,

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One source per org per type (keep only the most recent file)
    UNIQUE(organization_id, source_type)
);

-- RLS
ALTER TABLE public.intelligence_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY intelligence_data_sources_org_access ON public.intelligence_data_sources
    FOR ALL
    USING (
        organization_id IN (
            SELECT om.organization_id::uuid FROM organization_members om
            WHERE om.user_id = auth.uid()::text
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_data_sources_org ON public.intelligence_data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_data_sources_type ON public.intelligence_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_data_sources_status ON public.intelligence_data_sources(status);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_intelligence_data_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intelligence_data_sources_updated_at
    BEFORE UPDATE ON public.intelligence_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_intelligence_data_sources_updated_at();

-- Comments
COMMENT ON TABLE public.intelligence_data_sources IS 'Tracks individual data files for the Intelligence module (census XMLs, assessment CTFs)';
COMMENT ON COLUMN public.intelligence_data_sources.source_type IS 'Type of data file (census, assessments, etc.)';
COMMENT ON COLUMN public.intelligence_data_sources.status IS 'Connection status: pending, parsing, connected, partial, error';
COMMENT ON COLUMN public.intelligence_data_sources.record_count IS 'Number of records parsed (e.g., pupils, results)';
COMMENT ON COLUMN public.intelligence_data_sources.data_summary IS 'Cached summary data for quick UI access';
