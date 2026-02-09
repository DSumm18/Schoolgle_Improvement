-- =====================================================
-- Actions Hub Foundation
-- Phase 1: Enhanced Actions + Staff Directory
-- =====================================================
-- This migration creates the foundation for the Actions Hub and Staff Directory
-- Features: Dual status (user/AI), cost tracking, EEF implementation tracking,
-- evidence uploads, staff management with CSV import

-- =====================================================
-- 1. STAFF DIRECTORY TABLE
-- =====================================================

-- Staff Directory with extended profile information
CREATE TABLE IF NOT EXISTS staff_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Profile
    salutation TEXT CHECK (salutation IN ('Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Miss', NULL)),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT GENERATED ALWAYS AS (
        CASE
            WHEN salutation IS NOT NULL THEN salutation || ' ' || first_name || ' ' || last_name
            ELSE first_name || ' ' || last_name
        END
    ) STORED,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,

    -- Employment
    employee_id TEXT, -- School's internal staff ID
    job_title TEXT NOT NULL,
    role_category TEXT NOT NULL CHECK (role_category IN (
        'headteacher',
        'deputy_headteacher',
        'assistant_headteacher',
        'subject_lead',
        'phase_lead',
        'class_teacher',
        'sendco',
        'business_manager',
        'site_manager',
        'governor',
        'teaching_assistant',
        'support_staff',
        'other'
    )),

    -- Access & Permissions
    is_super_user BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Import metadata
    import_source TEXT DEFAULT 'manual', -- 'csv_import', 'manual', 'sync'
    imported_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, employee_id)
);

-- Module access (from subscription)
CREATE TABLE IF NOT EXISTS staff_module_access (
    staff_id UUID REFERENCES staff_directory(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN (
        'ofsted_readiness',
        'siams_readiness',
        'teaching_learning',
        'estates_compliance',
        'hr',
        'finance',
        'governance',
        'safeguarding',
        'send'
    )),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by TEXT REFERENCES users(id),
    PRIMARY KEY (staff_id, module)
);

-- =====================================================
-- 2. ENHANCED ACTIONS TABLE
-- =====================================================

-- Add new columns to existing actions table
ALTER TABLE actions
    ADD COLUMN IF NOT EXISTS user_status TEXT CHECK (user_status IN (
        'draft',
        'assigned',
        'in_progress',
        'pending_review',
        'complete',
        'cancelled'
    )) DEFAULT 'draft',

    ADD COLUMN IF NOT EXISTS ai_status TEXT CHECK (ai_status IN (
        'not_met',
        'partially_met',
        'met',
        'not_assessed'
    )) DEFAULT 'not_assessed',

    ADD COLUMN IF NOT EXISTS ai_rationale TEXT,

    ADD COLUMN IF NOT EXISTS implementation_date DATE, -- When EEF strategy was implemented

    ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2) DEFAULT 0,

    ADD COLUMN IF NOT EXISTS funding_source TEXT,
    ADD COLUMN IF NOT EXISTS financial_year TEXT, -- Format: "2024-25"

    ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0,

    ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb, -- Array of {timestamp, author, content}

    ADD COLUMN IF NOT EXISTS assigned_date DATE, -- When action was assigned to staff
    ADD COLUMN IF NOT EXISTS last_chased DATE, -- When staff was last reminded
    ADD COLUMN IF NOT EXISTS chase_count INTEGER DEFAULT 0;

-- =====================================================
-- 3. ACTION EVIDENCE TABLE
-- =====================================================

-- Evidence linked to actions (lesson obs, work scrutiny, etc.)
CREATE TABLE IF NOT EXISTS action_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Evidence details
    evidence_type TEXT NOT NULL CHECK (evidence_type IN (
        'lesson_observation',
        'work_scrutiny',
        'pupil_voice',
        'planning_review',
        'monitoring_visit',
        'document',
        'photo',
        'other'
    )),
    title TEXT NOT NULL,
    description TEXT,

    -- File or document reference
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    file_url TEXT,
    file_name TEXT,

    -- Created by
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Approval workflow (if evidence needs sign-off)
    approved_by TEXT REFERENCES users(id),
    approved_at TIMESTAMPTZ
);

-- =====================================================
-- 4. ACTION STATUS HISTORY
-- =====================================================

-- Track all status changes for audit trail
CREATE TABLE IF NOT EXISTS action_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Status change
    from_status TEXT,
    to_status TEXT NOT NULL,
    status_type TEXT NOT NULL CHECK (status_type IN ('user', 'ai')),

    -- Who/what triggered the change
    changed_by TEXT REFERENCES users(id),
    changed_by_type TEXT NOT NULL CHECK (changed_by_type IN ('user', 'ai_scan', 'system')),

    -- AI-specific details (if AI triggered the change)
    ai_confidence DECIMAL(3,2), -- 0-1
    ai_rationale TEXT,

    -- Evidence for the change
    notes TEXT,

    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INTERVENTION TRACKING (for EEF strategies)
-- =====================================================

-- Track when interventions are implemented for Gantt overlay
CREATE TABLE IF NOT EXISTS intervention_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_id UUID REFERENCES actions(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'started',
        'paused',
        'resumed',
        'modified',
        'completed',
        'reviewed',
        'finding_identified' -- Issue found during review
    )),

    title TEXT NOT NULL,
    description TEXT,
    impact_note TEXT, -- Free text for explaining impact/outcome

    -- For issues found during review
    issue_category TEXT, -- e.g., 'implementation_quality', 'resource_gap', 'training_needed'
    resolution_action_id UUID REFERENCES actions(id) ON DELETE SET NULL, -- Action created to resolve

    -- Metadata
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- For Gantt display
    display_date DATE NOT NULL, -- Date to show on timeline
    marker_color TEXT DEFAULT 'blue' CHECK (marker_color IN ('blue', 'green', 'amber', 'red', 'purple', 'gray'))
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Staff directory indexes
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff_directory(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_directory(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_directory(role_category);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_directory(is_active);

-- Action enhancement indexes
CREATE INDEX IF NOT EXISTS idx_actions_user_status ON actions(user_status);
CREATE INDEX IF NOT EXISTS idx_actions_ai_status ON actions(ai_status);
CREATE INDEX IF NOT EXISTS idx_actions_assigned_date ON actions(assigned_date);
CREATE INDEX IF NOT EXISTS idx_actions_fin_year ON actions(financial_year);

-- Evidence indexes
CREATE INDEX IF NOT EXISTS idx_action_evidence_action ON action_evidence(action_id);
CREATE INDEX IF NOT EXISTS idx_action_evidence_org ON action_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_evidence_type ON action_evidence(evidence_type);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_action_status_history_action ON action_status_history(action_id);
CREATE INDEX IF NOT EXISTS idx_action_status_history_org ON action_status_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_status_history_date ON action_status_history(changed_at);

-- Intervention events indexes
CREATE INDEX IF NOT EXISTS idx_intervention_org ON intervention_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_intervention_action ON intervention_events(action_id);
CREATE INDEX IF NOT EXISTS idx_intervention_date ON intervention_events(display_date);

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE staff_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_events ENABLE ROW LEVEL SECURITY;

-- Staff directory policies
CREATE POLICY "Org can view own staff" ON staff_directory
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own staff" ON staff_directory
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can update own staff" ON staff_directory
    FOR UPDATE USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can delete own staff" ON staff_directory
    FOR DELETE USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Staff module access policies
CREATE POLICY "Org can view own staff access" ON staff_module_access
    FOR SELECT USING (
        staff_id IN (SELECT id FROM staff_directory WHERE organization_id IN (SELECT id FROM organizations WHERE id = staff_directory.organization_id))
    );

CREATE POLICY "Org can manage own staff access" ON staff_module_access
    FOR ALL USING (
        staff_id IN (SELECT id FROM staff_directory WHERE organization_id IN (SELECT id FROM organizations WHERE id = staff_directory.organization_id))
    );

-- Action evidence policies
CREATE POLICY "Org can view own action evidence" ON action_evidence
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Status history policies
CREATE POLICY "Org can view own action history" ON action_status_history
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Intervention events policies
CREATE POLICY "Org can view own interventions" ON intervention_events
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Get all staff for an organization with their module access
CREATE OR REPLACE FUNCTION get_org_staff(org_id UUID)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    email TEXT,
    job_title TEXT,
    role_category TEXT,
    phone TEXT,
    is_active BOOLEAN,
    accessible_modules TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.display_name,
        s.email,
        s.job_title,
        s.role_category,
        s.phone,
        s.is_active,
        COALESCE(
            ARRAY_AGG(sm.module ORDER BY sm.module) FILTER (WHERE sm.module IS NOT NULL),
            ARRAY[]::TEXT[]
        ) as accessible_modules
    FROM staff_directory s
    LEFT JOIN staff_module_access sm ON sm.staff_id = s.id
    WHERE s.organization_id = org_id
    GROUP BY s.id, s.display_name, s.email, s.job_title, s.role_category, s.phone, s.is_active
    ORDER BY s.last_name, s.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get action summary with dual status
CREATE OR REPLACE FUNCTION get_action_summary(org_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    framework_type TEXT,
    category_name TEXT,
    user_status TEXT,
    ai_status TEXT,
    priority TEXT,
    owner_name TEXT,
    due_date DATE,
    evidence_count INTEGER,
    estimated_cost DECIMAL,
    actual_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.framework_type,
        COALESCE(a.category_id, 'General') as category_name,
        a.user_status,
        a.ai_status,
        a.priority,
        a.owner_name,
        a.due_date,
        a.evidence_count,
        a.estimated_cost,
        a.actual_cost
    FROM actions a
    WHERE a.organization_id = org_id
      AND a.status NOT IN ('cancelled')
    ORDER BY
        CASE a.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        a.due_date NULLS LAST,
        a.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_org_staff TO authenticated;
GRANT EXECUTE ON FUNCTION get_action_summary TO authenticated;

-- =====================================================
-- 9. UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_directory_updated_at
    BEFORE UPDATE ON staff_directory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SAMPLE DATA FOR TESTING (optional)
-- =====================================================

-- Insert sample staff for testing (only if test org exists)
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    SELECT id INTO test_org_id FROM organizations WHERE name LIKE '%Test%' LIMIT 1;

    IF test_org_id IS NOT NULL THEN
    INSERT INTO staff_directory (organization_id, salutation, first_name, last_name, email, job_title, role_category)
    VALUES
        (test_org_id, 'Mr', 'John', 'Smith', 'john.smith@testschool.com', 'Headteacher', 'headteacher'),
        (test_org_id, 'Mrs', 'Sarah', 'Jones', 'sarah.jones@testschool.com', 'Deputy Headteacher', 'deputy_headteacher'),
        (test_org_id, 'Ms', 'Emily', 'Brown', 'emily.brown@testschool.com', ' SENDCO', 'sendco'),
        (test_org_id, NULL, 'David', 'Wilson', 'david.wilson@testschool.com', 'Class Teacher', 'class_teacher');

    RAISE NOTICE 'Sample staff data inserted for org: %', test_org_id;
    END IF;
END $$;
