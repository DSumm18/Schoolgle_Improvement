-- Living SEF/SDP Migration
-- Extends sef_documents with new Living SEF columns and creates sdp_priorities table

-- 1. Add new columns to sef_documents for Living SEF
ALTER TABLE sef_documents
  ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS safeguarding_met BOOLEAN,
  ADD COLUMN IF NOT EXISTS executive_summary TEXT,
  ADD COLUMN IF NOT EXISTS data_source_timestamps JSONB DEFAULT '{}'::jsonb;

-- Index on version for quick lookup of latest
CREATE INDEX IF NOT EXISTS idx_sef_version ON sef_documents(organization_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_sef_status ON sef_documents(organization_id, status);

-- 2. Create sdp_priorities table (normalised, linked to SEF sections)
CREATE TABLE IF NOT EXISTS sdp_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sef_document_id UUID REFERENCES sef_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Priority details
  priority_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  rationale TEXT,
  ofsted_category_id TEXT, -- Links to EIF 2025 category (e.g. 'inclusion', 'achievement')
  lead_person TEXT,
  budget NUMERIC DEFAULT 0,
  funding_source TEXT,

  -- Structured data
  success_criteria JSONB DEFAULT '[]'::jsonb, -- string[]
  milestones JSONB DEFAULT '[]'::jsonb,       -- { title, targetDate, status, evidenceRequired }[]
  linked_action_ids JSONB DEFAULT '[]'::jsonb, -- UUID[] linking to actions table
  eef_strategies JSONB DEFAULT '[]'::jsonb,    -- string[] of EEF toolkit strategy names
  cross_module_impact JSONB DEFAULT '[]'::jsonb, -- { module, impact, budgetImplication }[]

  -- Tracking
  review_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  academic_year TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'deferred', 'archived'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sdp_priorities_org ON sdp_priorities(organization_id);
CREATE INDEX IF NOT EXISTS idx_sdp_priorities_sef ON sdp_priorities(sef_document_id);
CREATE INDEX IF NOT EXISTS idx_sdp_priorities_status ON sdp_priorities(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sdp_priorities_category ON sdp_priorities(ofsted_category_id);

-- Enable RLS
ALTER TABLE sdp_priorities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's SDP priorities"
  ON sdp_priorities FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create SDP priorities for their organization"
  ON sdp_priorities FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their organization's SDP priorities"
  ON sdp_priorities FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their organization's SDP priorities"
  ON sdp_priorities FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- 3. Service role bypass policies (for API routes using service role client)
CREATE POLICY "Service role full access sef_documents"
  ON sef_documents FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sdp_priorities"
  ON sdp_priorities FOR ALL
  USING (auth.role() = 'service_role');
