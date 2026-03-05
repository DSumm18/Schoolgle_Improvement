-- =====================================================
-- Unified Task System Database Schema
-- Phase 1.3: Unified Task System
-- =====================================================
-- This migration enhances the existing actions table and creates
-- supporting tables for a unified task management system that
-- combines general actions and estates compliance tasks.
-- =====================================================

-- =====================================================
-- 1. ENHANCE EXISTING ACTIONS TABLE
-- =====================================================

-- Add task classification columns
ALTER TABLE actions ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'general';
COMMENT ON COLUMN actions.task_type IS 'Task classification: general, estates, compliance, governance, siams, ofsted';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS team_id UUID;
COMMENT ON COLUMN actions.team_id IS 'Reference to teams table for group assignment';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS department TEXT;
COMMENT ON COLUMN actions.department IS 'Department classification: senior_leadership, teaching, admin, premises, governors';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,1);
COMMENT ON COLUMN actions.estimated_hours IS 'Estimated time to complete in hours';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,1);
COMMENT ON COLUMN actions.actual_hours IS 'Actual time spent in hours';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS template_id UUID;
COMMENT ON COLUMN actions.template_id IS 'Reference to task template if created from one';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS parent_task_id UUID;
COMMENT ON COLUMN actions.parent_task_id IS 'Parent task for subtasks';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN actions.checklist IS 'Array of checklist items: [{id, title, completed, completed_by, completed_at}]';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
COMMENT ON COLUMN actions.recurrence_rule IS 'Recurrence pattern: {frequency: weekly/daily/monthly, interval: 1, until: date}';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS recurrence_id UUID;
COMMENT ON COLUMN actions.recurrence_id IS 'Groups recurring tasks together';

-- Add approval workflow columns
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
COMMENT ON COLUMN actions.approval_status IS 'Approval status: draft, pending_approval, approved, rejected';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS approved_by TEXT; -- Firebase user ID (no FK since users table uses text IDs)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add completion tracking columns
ALTER TABLE actions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS completed_by TEXT; -- Firebase user ID (no FK since users table uses text IDs)

-- Add SIAMS framework columns (complementing existing category/subcategory)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS siams_strand_id TEXT;
COMMENT ON COLUMN actions.siams_strand_id IS 'SIAMS strand reference (vision, wisdom, character, community, dignity, worship, re)';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS siams_question_id TEXT;
COMMENT ON COLUMN actions.siams_question_id IS 'SIAMS question reference (e.g., vision-1, wisdom-2)';

-- =====================================================
-- 2. TEAMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Team Details
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,

    -- Classification
    department TEXT, -- senior_leadership, teaching, admin, premises, governors
    type TEXT DEFAULT 'department', -- department, committee, working_group, project_team

    -- Leadership
    leader_id TEXT, -- Firebase user ID (no FK since users table uses text IDs)
    deputy_leader_id TEXT, -- Firebase user ID (no FK since users table uses text IDs)

    -- Members (stored as JSON for flexibility)
    members JSONB DEFAULT '[]'::jsonb, -- [{userId, role, joined_at}]

    -- Permissions
    can_create_tasks BOOLEAN DEFAULT true,
    can_assign_tasks BOOLEAN DEFAULT true,
    can_approve_tasks BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE teams IS 'Teams and departments for task assignment and collaboration';

-- =====================================================
-- 3. TASK TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Template Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- ofsted, siams, estates, compliance, governance, general
    subcategory TEXT,

    -- Default Values
    default_priority TEXT DEFAULT 'medium',
    default_due_days INTEGER DEFAULT 14,
    estimated_hours DECIMAL(5,1),

    -- Template Content
    checklist_template JSONB DEFAULT '[]'::jsonb, -- [{title, required: true}]
    default_assignee_type TEXT, -- user, team, role
    default_assignee_id TEXT,

    -- Approval Workflow
    requires_approval BOOLEAN DEFAULT false,
    approval_workflow JSONB, -- [{role, order}]

    -- Organization
    is_public BOOLEAN DEFAULT false, -- Available to all orgs
    is_statutory BOOLEAN DEFAULT false, -- Statutory requirement template

    -- Creator
    created_by TEXT, -- Firebase user ID (no FK since users table uses text IDs)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_templates IS 'Reusable task templates for common activities';

-- =====================================================
-- 4. TASK COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL, -- References actions.id or estates_compliance_tasks.id
    task_source TEXT DEFAULT 'actions', -- 'actions' or 'estates_compliance_tasks'

    -- Comment Details
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment', -- comment, system, approval, status_change

    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb, -- [{name, url, size, type}]

    -- Thread support
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,

    -- User
    user_id TEXT, -- Firebase user ID (no FK since users table uses text IDs)

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_comments IS 'Comments and activity log for tasks';

-- =====================================================
-- 5. TASK TIME ENTRIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL, -- References actions.id or estates_compliance_tasks.id
    task_source TEXT DEFAULT 'actions', -- 'actions' or 'estates_compliance_tasks'

    -- Time Entry
    user_id TEXT, -- Firebase user ID (no FK since users table uses text IDs)
    minutes INTEGER NOT NULL,

    -- Details
    description TEXT,
    date DATE NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_time_entries IS 'Time tracking for tasks';

-- =====================================================
-- 6. TASK SUBTASKS TABLE (optional - can use parent_task_id in actions)
-- =====================================================

-- For more complex subtask requirements, a separate table can be used
CREATE TABLE IF NOT EXISTS task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_task_id UUID NOT NULL, -- References actions.id

    -- Subtask Details
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
    completed_at TIMESTAMPTZ,
    completed_by TEXT, -- Firebase user ID (no FK since users table uses text IDs)

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_subtasks IS 'Subtasks for breaking down complex tasks';

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Actions table new columns indexes
CREATE INDEX IF NOT EXISTS idx_actions_task_type ON actions(task_type);
CREATE INDEX IF NOT EXISTS idx_actions_team_id ON actions(team_id);
CREATE INDEX IF NOT EXISTS idx_actions_department ON actions(department);
CREATE INDEX IF NOT EXISTS idx_actions_parent_task_id ON actions(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_actions_template_id ON actions(template_id);
CREATE INDEX IF NOT EXISTS idx_actions_recurrence_id ON actions(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_actions_approval_status ON actions(approval_status);
CREATE INDEX IF NOT EXISTS idx_actions_completed_by ON actions(completed_by);
CREATE INDEX IF NOT EXISTS idx_actions_siams_strand ON actions(siams_strand_id) WHERE siams_strand_id IS NOT NULL;

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_deputy ON teams(deputy_leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(type);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);

-- Task templates indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_org ON task_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_public ON task_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_task_templates_statutory ON task_templates(is_statutory) WHERE is_statutory = true;

-- Task comments indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_org ON task_comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id, task_source);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_type ON task_comments(comment_type);

-- Task time entries indexes
CREATE INDEX IF NOT EXISTS idx_task_time_entries_org ON task_time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task ON task_time_entries(task_id, task_source);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_date ON task_time_entries(date);

-- Task subtasks indexes
CREATE INDEX IF NOT EXISTS idx_task_subtasks_org ON task_subtasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent ON task_subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_status ON task_subtasks(status);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

-- Teams RLS policies
CREATE POLICY "Org can access own teams" ON teams
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own teams" ON teams
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Public templates can be read by anyone
CREATE POLICY "Public templates readable by all" ON task_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Org can access own task_templates" ON task_templates
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id) OR is_public = true);

CREATE POLICY "Org can insert own task_templates" ON task_templates
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id) OR is_public = true);

-- Task comments RLS policies
CREATE POLICY "Org can access own task_comments" ON task_comments
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own task_comments" ON task_comments
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Task time entries RLS policies
CREATE POLICY "Org can access own task_time_entries" ON task_time_entries
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own task_time_entries" ON task_time_entries
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- Task subtasks RLS policies
CREATE POLICY "Org can access own task_subtasks" ON task_subtasks
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own task_subtasks" ON task_subtasks
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- =====================================================
-- 9. UNIFIED TASKS VIEW
-- =====================================================

-- Create a unified view combining actions and estates compliance tasks
CREATE OR REPLACE VIEW unified_tasks AS
SELECT
    a.id,
    a.organization_id,
    'actions' as source_table,
    a.task_type,
    a.title,
    a.description,
    a.category_id as category,
    a.subcategory_id as subcategory,
    a.module,
    a.priority,
    a.status,
    a.progress,
    a.due_date,
    a.start_date,
    a.owner_name as owner,
    a.assignee_id,
    a.team_id,
    a.department,
    a.estimated_hours,
    a.actual_hours,
    a.parent_task_id,
    a.dependencies,
    a.checklist,
    a.linked_evidence,
    a.notes,
    a.approval_status,
    a.approved_by,
    a.approved_at,
    a.completed_at,
    a.completed_by,
    a.template_id,
    a.recurrence_rule,
    a.recurrence_id,
    a.siams_strand_id,
    a.siams_question_id,
    a.created_at,
    a.updated_at
FROM actions a
UNION ALL
SELECT
    ect.id,
    ect.organization_id,
    'estates_compliance_tasks' as source_table,
    'estates' as task_type,
    ect.title,
    ect.description,
    ect.domain_id as category,
    ect.check_type_id as subcategory,
    'estates_compliance' as module,
    ect.priority,
    ect.status,
    ect.progress,
    ect.due_date,
    ect.scheduled_date as start_date,
    ect.assigned_to_name as owner,
    ect.assigned_to_id as assignee_id,
    ect.team_id,
    'estates' as department,
    ect.estimated_hours,
    ect.actual_hours,
    NULL::uuid as parent_task_id,
    ect.dependencies,
    '[]'::jsonb as checklist,
    ect.evidence_ids as linked_evidence,
    ect.findings as notes,
    'approved' as approval_status,
    ect.approved_by,
    ect.approved_at,
    ect.completed_at,
    ect.completed_by,
    NULL::uuid as template_id,
    NULL::jsonb as recurrence_rule,
    NULL::uuid as recurrence_id,
    NULL::text as siams_strand_id,
    NULL::text as siams_question_id,
    ect.created_at,
    ect.updated_at
FROM estates_compliance_tasks ect;

COMMENT ON VIEW unified_tasks IS 'Unified view of all tasks from actions and estates_compliance_tasks tables';

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to get team workload
CREATE OR REPLACE FUNCTION get_team_workload(team_id_param UUID)
RETURNS TABLE (
    user_id TEXT,
    user_name TEXT,
    total_tasks INTEGER,
    pending_tasks INTEGER,
    overdue_tasks INTEGER,
    total_estimated_hours DECIMAL,
    total_actual_hours DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH team_members AS (
        SELECT jsonb_array_elements(members)->>'userId' as user_id
        FROM teams
        WHERE id = team_id_param
    ),
    member_names AS (
        SELECT
            tm.user_id::text,
            COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'Unknown') as user_name
        FROM team_members tm
        LEFT JOIN users u ON u.id = tm.user_id::text
    )
    SELECT
        mn.user_id,
        mn.user_name,
        COUNT(DISTINCT a.id) FILTER (WHERE a.assignee_id = mn.user_id) as total_tasks,
        COUNT(DISTINCT a.id) FILTER (
            WHERE a.assignee_id = mn.user_id
            AND a.status NOT IN ('completed', 'cancelled')
        ) as pending_tasks,
        COUNT(DISTINCT a.id) FILTER (
            WHERE a.assignee_id = mn.user_id
            AND a.status NOT IN ('completed', 'cancelled')
            AND a.due_date < CURRENT_DATE
        ) as overdue_tasks,
        COALESCE(SUM(a.estimated_hours) FILTER (WHERE a.assignee_id = mn.user_id), 0) as total_estimated_hours,
        COALESCE(SUM(a.actual_hours) FILTER (WHERE a.assignee_id = mn.user_id), 0) as total_actual_hours
    FROM member_names mn
    LEFT JOIN actions a ON a.assignee_id = mn.user_id
    GROUP BY mn.user_id, mn.user_name
    ORDER BY mn.user_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization task summary
CREATE OR REPLACE FUNCTION get_org_task_summary(org_id UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    by_status JSONB,
    by_priority JSONB,
    by_type JSONB,
    overdue_count BIGINT,
    due_this_week BIGINT,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH task_counts AS (
        SELECT
            COUNT(*) as total,
            jsonb_object_agg(status, count) FILTER (WHERE status IS NOT NULL) as by_status,
            jsonb_object_agg(priority, count) FILTER (WHERE priority IS NOT NULL) as by_priority,
            jsonb_object_agg(task_type, count) FILTER (WHERE task_type IS NOT NULL) as by_type,
            COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue,
            COUNT(*) FILTER (
                WHERE due_date >= CURRENT_DATE
                AND due_date < CURRENT_DATE + INTERVAL '7 days'
                AND status NOT IN ('completed', 'cancelled')
            ) as due_week,
            COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) as completion_rate
        FROM actions
        WHERE organization_id = org_id
    )
    SELECT
        tc.total as total_tasks,
        tc.by_status,
        tc.by_priority,
        tc.by_type,
        tc.overdue as overdue_count,
        tc.due_week as due_this_week,
        COALESCE(tc.completion_rate * 100, 0) as completion_rate
    FROM task_counts tc;
END;
$$ LANGUAGE plpgsql;

-- Function to create task from template
CREATE OR REPLACE FUNCTION create_task_from_template(
    template_id_param UUID,
    org_id_param UUID,
    user_id_param TEXT,
    custom_due_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_task_id UUID;
    template_rec RECORD;
    due_date DATE;
BEGIN
    -- Get template
    SELECT * INTO template_rec
    FROM task_templates
    WHERE id = template_id_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Calculate due date
    due_date := COALESCE(
        custom_due_date,
        CURRENT_DATE + (template_rec.default_due_days || ' days')::INTERVAL
    )::DATE;

    -- Create task
    INSERT INTO actions (
        organization_id,
        user_id,
        title,
        description,
        category_id,
        subcategory_id,
        priority,
        due_date,
        task_type,
        template_id,
        estimated_hours,
        checklist,
        approval_status,
        created_at
    )
    VALUES (
        org_id_param,
        user_id_param,
        template_rec.name,
        template_rec.description,
        template_rec.category,
        template_rec.subcategory,
        template_rec.default_priority,
        due_date,
        'general',
        template_rec.id,
        template_rec.estimated_hours,
        template_rec.checklist_template,
        CASE WHEN template_rec.requires_approval THEN 'pending_approval' ELSE 'approved' END,
        NOW()
    )
    RETURNING id INTO new_task_id;

    RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update task progress automatically based on checklist
CREATE OR REPLACE FUNCTION update_task_progress_from_checklist()
RETURNS TRIGGER AS $$
DECLARE
    completed_count INTEGER;
    total_count INTEGER;
    new_progress INTEGER;
BEGIN
    -- Count checklist items
    SELECT
        COUNT(*) FILTER (WHERE (checklist->>'completed')::boolean = true),
        COUNT(*)
    INTO completed_count, total_count
    FROM jsonb_array_elements(NEW.checklist)
    WHERE jsonb_typeof(checklist) = 'object';

    -- Calculate progress
    IF total_count > 0 THEN
        new_progress := ROUND((completed_count::DECIMAL / total_count::DECIMAL) * 100);
    ELSE
        new_progress := 0;
    END IF;

    -- Only update if different to avoid recursion
    IF NEW.progress != new_progress THEN
        NEW.progress = new_progress;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS
-- =====================================================

-- Ensure the update function exists (defined in governance_portal.sql but recreated here for independence)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update progress when checklist changes
CREATE TRIGGER update_progress_from_checklist
    BEFORE INSERT OR UPDATE OF checklist
    ON actions
    FOR EACH ROW
    EXECUTE FUNCTION update_task_progress_from_checklist();

-- Update timestamps on new tables
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_subtasks_updated_at
    BEFORE UPDATE ON task_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. RECURRING TASK GENERATION FUNCTION
-- =====================================================

-- Function to generate next recurring task instance
CREATE OR REPLACE FUNCTION generate_recurring_task_instance(task_id UUID)
RETURNS UUID AS $$
DECLARE
    task_rec RECORD;
    rule JSONB;
    frequency TEXT;
    interval_val INTEGER;
    until_date DATE;
    next_due_date DATE;
    new_task_id UUID;
BEGIN
    -- Get the original task
    SELECT * INTO task_rec
    FROM actions
    WHERE id = task_id AND recurrence_rule IS NOT NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found or not a recurring task';
    END IF;

    rule := task_rec.recurrence_rule;
    frequency := rule->>'frequency';
    interval_val := COALESCE((rule->>'interval')::INTEGER, 1);
    until_date := (rule->>'until')::DATE;

    -- Check if we've reached the until date
    IF until_date IS NOT NULL AND task_rec.due_date >= until_date THEN
        RETURN NULL; -- Don't create more instances
    END IF;

    -- Calculate next due date
    CASE frequency
        WHEN 'daily' THEN
            next_due_date := task_rec.due_date + (interval_val || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            next_due_date := task_rec.due_date + (interval_val || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            next_due_date := task_rec.due_date + (interval_val || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            next_due_date := task_rec.due_date + (interval_val || ' years')::INTERVAL;
        ELSE
            RAISE EXCEPTION 'Invalid frequency: %', frequency;
    END CASE;

    -- Create new task instance
    INSERT INTO actions (
        organization_id,
        user_id,
        title,
        description,
        category_id,
        subcategory_id,
        module,
        priority,
        status,
        due_date,
        start_date,
        task_type,
        team_id,
        department,
        estimated_hours,
        template_id,
        parent_task_id,
        recurrence_id,
        recurrence_rule,
        checklist,
        approval_status,
        created_at
    )
    SELECT
        task_rec.organization_id,
        task_rec.user_id,
        task_rec.title,
        task_rec.description,
        task_rec.category_id,
        task_rec.subcategory_id,
        task_rec.module,
        task_rec.priority,
        'not_started',
        next_due_date,
        next_due_date - INTERVAL '7 days',
        task_rec.task_type,
        task_rec.team_id,
        task_rec.department,
        task_rec.estimated_hours,
        task_rec.template_id,
        task_rec.id as parent_task_id,
        task_rec.recurrence_id,
        task_rec.recurrence_rule,
        '[]'::jsonb, -- Reset checklist for new instance
        task_rec.approval_status,
        NOW()
    RETURNING id INTO new_task_id;

    RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;
