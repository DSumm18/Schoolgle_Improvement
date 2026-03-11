-- Website Compliance Scans
-- Stores results of school website compliance assessments
-- against DfE statutory requirements (35+ items)

CREATE TABLE IF NOT EXISTS website_compliance_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  school_type TEXT NOT NULL DEFAULT 'maintained' CHECK (school_type IN ('maintained', 'academy')),

  -- Overall scores
  overall_compliance_score INTEGER DEFAULT 0, -- 0-100
  overall_quality_score NUMERIC(3,1) DEFAULT 0, -- 1.0-5.0
  overall_clarity_score NUMERIC(3,1) DEFAULT 0, -- 1.0-5.0

  -- Counts
  total_requirements INTEGER DEFAULT 0,
  compliant_count INTEGER DEFAULT 0,
  partial_count INTEGER DEFAULT 0,
  not_found_count INTEGER DEFAULT 0,
  outdated_count INTEGER DEFAULT 0,
  pages_scanned INTEGER DEFAULT 0,
  pdfs_processed INTEGER DEFAULT 0,
  scan_duration_ms INTEGER DEFAULT 0,

  -- Detailed data (JSONB)
  priority_actions JSONB DEFAULT '[]'::jsonb,
  category_summary JSONB DEFAULT '[]'::jsonb,
  full_report JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One scan per organization (upsert pattern)
  UNIQUE(organization_id)
);

-- Index for fast org lookup
CREATE INDEX IF NOT EXISTS idx_website_compliance_scans_org
  ON website_compliance_scans(organization_id);

-- RLS
ALTER TABLE website_compliance_scans ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their org's scans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'website_compliance_scans'
    AND policyname = 'Users can read own org website scans'
  ) THEN
    CREATE POLICY "Users can read own org website scans"
      ON website_compliance_scans FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: service role can do everything (for API routes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'website_compliance_scans'
    AND policyname = 'Service role full access website scans'
  ) THEN
    CREATE POLICY "Service role full access website scans"
      ON website_compliance_scans FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Also ensure ed_website_knowledge has the right unique constraint for upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_ed_website_knowledge_org_url'
  ) THEN
    CREATE UNIQUE INDEX idx_ed_website_knowledge_org_url
      ON ed_website_knowledge(organization_id, page_url);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, skip
    NULL;
END $$;
