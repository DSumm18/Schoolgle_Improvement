-- Migration: 20260209_compliance_knowledge
-- Description: Creates tables for the expert compliance knowledge base with contractor context

-- Domains enum
DO $$ BEGIN
    CREATE TYPE compliance_domain AS ENUM (
        'estates',
        'fire',
        'water',
        'legionella',
        'asbestos',
        'electrical',
        'gas',
        'it',
        'hr',
        'send',
        'safeguarding'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Compliance Knowledge Base table
CREATE TABLE IF NOT EXISTS compliance_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain compliance_domain NOT NULL,
    topic TEXT NOT NULL,
    is_statutory BOOLEAN DEFAULT false,
    legislation_reference TEXT,
    content TEXT NOT NULL, -- Markdown content
    contractor_context TEXT, -- Specific "if contractor says X, the reality is Y" scenarios
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review_due TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_compliance_knowledge_domain ON compliance_knowledge(domain);
CREATE INDEX IF NOT EXISTS idx_compliance_knowledge_topic ON compliance_knowledge(topic);

-- Compliance Domains metadata table
CREATE TABLE IF NOT EXISTS compliance_domains (
    domain compliance_domain PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT,
    urgency_level TEXT DEFAULT 'medium', -- low, medium, high, critical
    primary_authority TEXT -- e.g. 'HSE', 'DfE'
);

-- RLS Policies
ALTER TABLE compliance_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_domains ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read knowledge
CREATE POLICY "Allow authenticated users to read compliance knowledge" 
ON compliance_knowledge FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to read compliance domains" 
ON compliance_domains FOR SELECT 
TO authenticated 
USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_compliance_knowledge_updated_at 
BEFORE UPDATE ON compliance_knowledge 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
