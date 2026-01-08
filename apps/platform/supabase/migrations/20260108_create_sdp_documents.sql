-- Create SDP Documents Table
CREATE TABLE IF NOT EXISTS sdp_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    priorities JSONB DEFAULT '[]'::jsonb, -- Array of { id, title, rationale, lead, budget, milestones, successCriteria }
    total_budget NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_sdp_organization ON sdp_documents(organization_id);

-- RLS
ALTER TABLE sdp_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's SDPs"
    ON sdp_documents FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create SDPs for their organization"
    ON sdp_documents FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's SDPs"
    ON sdp_documents FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
