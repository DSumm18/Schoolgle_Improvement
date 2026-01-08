ALTER TABLE actions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rationale TEXT;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS linked_evidence JSONB DEFAULT '[]'::jsonb;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS assignee_id UUID;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;

-- Ensure priority includes 'critical' if it was constrained before
-- (Assuming it was a text column without a tight check constraint, or we can just update it)
-- If it's an ENUM, we would need to add 'critical' to it. 
-- For now, we assume it's a TEXT column based on the context report.

-- Add index for organization and framework for faster filtering
CREATE INDEX IF NOT EXISTS idx_actions_org_framework ON actions(organization_id, framework_type);
CREATE INDEX IF NOT EXISTS idx_actions_subcategory ON actions(subcategory_id);
