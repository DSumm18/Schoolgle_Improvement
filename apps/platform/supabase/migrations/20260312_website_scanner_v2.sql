-- ============================================================================
-- Website Scanner V2: Two-phase architecture (Scrape → Assess)
-- ============================================================================
-- Phase 1: Scrape everything, store all content + documents
-- Phase 2: Assess against rubrics, store results per requirement
-- All scraped content also feeds into Ed's knowledge base
-- ============================================================================

-- ─── Scan Sessions ──────────────────────────────────────────────────────────
-- Tracks the lifecycle of a scan: scraping → assessing → complete
CREATE TABLE IF NOT EXISTS website_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  trust_url TEXT,                    -- auto-detected trust domain for academies

  -- Auto-detected school metadata
  school_type TEXT DEFAULT 'maintained' CHECK (school_type IN ('maintained', 'academy')),
  school_phase TEXT DEFAULT 'all' CHECK (school_phase IN ('primary', 'secondary', 'all_through', 'all')),
  is_church_school BOOLEAN DEFAULT false,

  -- Scan lifecycle
  status TEXT NOT NULL DEFAULT 'scraping'
    CHECK (status IN ('scraping', 'scraped', 'assessing', 'assessed', 'failed')),
  progress JSONB DEFAULT '{}'::jsonb,  -- { step, total, message }
  error_message TEXT,

  -- Stats
  pages_found INTEGER DEFAULT 0,
  documents_found INTEGER DEFAULT 0,
  pages_scraped INTEGER DEFAULT 0,
  documents_scraped INTEGER DEFAULT 0,

  -- Timestamps
  scrape_started_at TIMESTAMPTZ DEFAULT NOW(),
  scrape_completed_at TIMESTAMPTZ,
  assess_started_at TIMESTAMPTZ,
  assess_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One active scan per org (latest wins)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_sessions_org
  ON website_scan_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_status
  ON website_scan_sessions(status);

-- ─── Scraped Pages ──────────────────────────────────────────────────────────
-- Every HTML page found on the school/trust website
CREATE TABLE IF NOT EXISTS website_scraped_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES website_scan_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Page identity
  url TEXT NOT NULL,
  canonical_url TEXT,                -- normalised URL for dedup
  title TEXT,

  -- Source
  source TEXT DEFAULT 'school' CHECK (source IN ('school', 'trust')),

  -- Content
  extracted_text TEXT,               -- FULL text, no truncation
  headings JSONB DEFAULT '[]'::jsonb,  -- [{level, text}]
  links_found JSONB DEFAULT '[]'::jsonb, -- [url, ...]
  meta_description TEXT,

  -- Metadata
  http_status INTEGER,
  word_count INTEGER DEFAULT 0,
  content_hash TEXT,                 -- SHA-256 for change detection

  -- Timestamps
  crawled_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_session
  ON website_scraped_pages(session_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_org
  ON website_scraped_pages(organization_id);

-- ─── Scraped Documents ──────────────────────────────────────────────────────
-- Every PDF, DOCX, XLSX etc. found on the school/trust website
-- Separate from pages because documents have different metadata
CREATE TABLE IF NOT EXISTS website_scraped_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES website_scan_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document identity
  url TEXT NOT NULL,
  filename TEXT,                     -- extracted from URL or Content-Disposition
  title TEXT,                        -- from PDF metadata or link text

  -- Source
  source TEXT DEFAULT 'school' CHECK (source IN ('school', 'trust', 'google_drive')),
  found_on_page_url TEXT,            -- which page linked to this document
  link_text TEXT,                    -- the anchor text used to link to this doc

  -- File info
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'pptx', 'doc', 'csv', 'txt', 'other')),
  file_size_bytes INTEGER,
  page_count INTEGER,                -- for PDFs

  -- Content
  extracted_text TEXT,               -- FULL text, no truncation
  extraction_method TEXT,            -- pdf2json | mammoth | gemini_ocr | failed
  extraction_error TEXT,             -- if extraction failed, why

  -- Metadata
  word_count INTEGER DEFAULT 0,
  content_hash TEXT,                 -- SHA-256 for change detection
  dates_found JSONB DEFAULT '[]'::jsonb,  -- dates extracted from content

  -- Timestamps
  crawled_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, url)
);

CREATE INDEX IF NOT EXISTS idx_scraped_docs_session
  ON website_scraped_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_scraped_docs_org
  ON website_scraped_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraped_docs_type
  ON website_scraped_documents(file_type);

-- ─── Requirement Assessments ────────────────────────────────────────────────
-- One row per requirement per scan session
-- The assessment result after checking against the rubric
CREATE TABLE IF NOT EXISTS website_requirement_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES website_scan_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Requirement identity
  requirement_key TEXT NOT NULL,     -- matches ComplianceRequirement.key
  requirement_name TEXT NOT NULL,
  category TEXT NOT NULL,

  -- Assessment result
  status TEXT NOT NULL DEFAULT 'not_assessed'
    CHECK (status IN ('compliant', 'partial', 'not_found', 'outdated', 'not_assessed')),
  compliance_score INTEGER DEFAULT 0,  -- 0-100
  quality_score INTEGER DEFAULT 0,     -- 1-5
  clarity_score INTEGER DEFAULT 0,     -- 1-5

  -- Evidence: which pages/docs support this requirement
  evidence_page_ids UUID[] DEFAULT '{}',   -- refs to website_scraped_pages
  evidence_doc_ids UUID[] DEFAULT '{}',    -- refs to website_scraped_documents
  evidence_urls TEXT[] DEFAULT '{}',       -- direct URLs for display
  evidence_quotes TEXT[] DEFAULT '{}',     -- key quotes from content

  -- Currency check
  currency_status TEXT DEFAULT 'unknown'
    CHECK (currency_status IN ('current', 'possibly_outdated', 'outdated', 'unknown')),
  legislation_refs_found TEXT[] DEFAULT '{}',  -- legislation cited in the docs
  legislation_current BOOLEAN,                  -- do refs cite current legislation?
  review_date_found DATE,

  -- Gaps and recommendations
  gaps TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',

  -- AI metadata
  rubric_version TEXT,               -- version of the rubric used
  ai_model_used TEXT,
  ai_tokens_used INTEGER DEFAULT 0,
  confidence NUMERIC(3,2) DEFAULT 0,
  assessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, requirement_key)
);

CREATE INDEX IF NOT EXISTS idx_req_assessments_session
  ON website_requirement_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_req_assessments_org
  ON website_requirement_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_req_assessments_status
  ON website_requirement_assessments(status);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE website_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scraped_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_requirement_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their org's data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scan_sessions_org_read') THEN
    CREATE POLICY scan_sessions_org_read ON website_scan_sessions
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scraped_pages_org_read') THEN
    CREATE POLICY scraped_pages_org_read ON website_scraped_pages
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scraped_docs_org_read') THEN
    CREATE POLICY scraped_docs_org_read ON website_scraped_documents
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'req_assessments_org_read') THEN
    CREATE POLICY req_assessments_org_read ON website_requirement_assessments
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Service role can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scan_sessions_service') THEN
    CREATE POLICY scan_sessions_service ON website_scan_sessions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scraped_pages_service') THEN
    CREATE POLICY scraped_pages_service ON website_scraped_pages
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scraped_docs_service') THEN
    CREATE POLICY scraped_docs_service ON website_scraped_documents
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'req_assessments_service') THEN
    CREATE POLICY req_assessments_service ON website_requirement_assessments
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Summary View ───────────────────────────────────────────────────────────
-- Materialised view for quick dashboard access
CREATE OR REPLACE VIEW website_scan_summary AS
SELECT
  s.id as session_id,
  s.organization_id,
  s.website_url,
  s.trust_url,
  s.school_type,
  s.school_phase,
  s.is_church_school,
  s.status,
  s.pages_found,
  s.documents_found,
  s.scrape_completed_at,
  s.assess_completed_at,
  COUNT(ra.id) as total_requirements,
  COUNT(ra.id) FILTER (WHERE ra.status = 'compliant') as compliant_count,
  COUNT(ra.id) FILTER (WHERE ra.status = 'partial') as partial_count,
  COUNT(ra.id) FILTER (WHERE ra.status = 'not_found') as not_found_count,
  COUNT(ra.id) FILTER (WHERE ra.status = 'outdated') as outdated_count,
  CASE WHEN COUNT(ra.id) > 0
    THEN ROUND(100.0 * COUNT(ra.id) FILTER (WHERE ra.status = 'compliant') / COUNT(ra.id))
    ELSE 0
  END as compliance_percentage,
  ROUND(AVG(ra.quality_score) FILTER (WHERE ra.quality_score > 0), 1) as avg_quality,
  ROUND(AVG(ra.clarity_score) FILTER (WHERE ra.clarity_score > 0), 1) as avg_clarity
FROM website_scan_sessions s
LEFT JOIN website_requirement_assessments ra ON ra.session_id = s.id
GROUP BY s.id;
