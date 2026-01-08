-- Create SEF Documents Table
CREATE TABLE IF NOT EXISTS sef_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    overall_grade TEXT,
    sections JSONB DEFAULT '[]'::jsonb, -- Array of { id, title, grade, narrative, strengths, afd, evidence, actions, impact, nextSteps }
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for organization and academic year
CREATE INDEX IF NOT EXISTS idx_sef_organization ON sef_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sef_academic_year ON sef_documents(academic_year);

-- Enable RLS
ALTER TABLE sef_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their organization's SEFs"
    ON sef_documents FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create SEFs for their organization"
    ON sef_documents FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's SEFs"
    ON sef_documents FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
