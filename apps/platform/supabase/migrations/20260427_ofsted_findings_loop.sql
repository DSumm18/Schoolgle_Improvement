-- Ofsted Readiness persistent findings and task routing metadata
-- This is the audit layer between scans and headteacher-approved tasks.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.ofsted_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    source_key TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'website_scan',
        'drive_scan',
        'document_inspection',
        'manual_review',
        'rules_update'
    )),
    source_scan_id UUID,
    source_record_id TEXT,
    source_url TEXT,

    framework_type TEXT NOT NULL DEFAULT 'ofsted',
    category_id TEXT,
    subcategory_id TEXT,

    rule_key TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    rule_source TEXT[] DEFAULT '{}',

    title TEXT NOT NULL,
    summary TEXT,
    finding_type TEXT NOT NULL CHECK (finding_type IN (
        'missing',
        'outdated',
        'red_flag',
        'quality_gap',
        'improvement'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    action_level TEXT NOT NULL CHECK (action_level IN (
        'required_action',
        'recommended_action',
        'suggested_improvement',
        'information_only'
    )),
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN (
        'identified',
        'acknowledged',
        'assigned',
        'in_progress',
        'completed',
        'verification_required',
        'verified',
        'recurring',
        'dismissed'
    )),

    score INTEGER CHECK (score BETWEEN 0 AND 100),
    confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),

    evidence_url TEXT,
    evidence_quotes TEXT[] DEFAULT '{}',
    gaps TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    checklist JSONB DEFAULT '[]'::jsonb,

    recommended_task_title TEXT,
    recommended_task_description TEXT,

    assigned_task_id UUID,
    assigned_task_source TEXT CHECK (assigned_task_source IN ('actions', 'compliance_tasks')),
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    dismissed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMPTZ,
    dismissal_reason TEXT,

    verification_status TEXT DEFAULT 'not_requested' CHECK (verification_status IN (
        'not_requested',
        'pending',
        'passed',
        'failed'
    )),
    verified_at TIMESTAMPTZ,
    next_review_date DATE,

    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, source_key)
);

CREATE TABLE IF NOT EXISTS public.ofsted_finding_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES public.ofsted_findings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    previous_status TEXT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ofsted_findings_org ON public.ofsted_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_findings_status ON public.ofsted_findings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ofsted_findings_severity ON public.ofsted_findings(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_ofsted_findings_source ON public.ofsted_findings(organization_id, source_type);
CREATE INDEX IF NOT EXISTS idx_ofsted_findings_task ON public.ofsted_findings(assigned_task_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_finding_events_finding ON public.ofsted_finding_events(finding_id);

ALTER TABLE public.ofsted_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofsted_finding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization Ofsted findings"
    ON public.ofsted_findings FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "School leaders can manage own organization Ofsted findings"
    ON public.ofsted_findings FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_org_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'slt')
        )
    );

CREATE POLICY "Users can view own organization Ofsted finding events"
    ON public.ofsted_finding_events FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "School leaders can manage own organization Ofsted finding events"
    ON public.ofsted_finding_events FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_org_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'slt')
        )
    );

CREATE OR REPLACE FUNCTION update_ofsted_findings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ofsted_findings_updated_at ON public.ofsted_findings;
CREATE TRIGGER trigger_update_ofsted_findings_updated_at
    BEFORE UPDATE ON public.ofsted_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_ofsted_findings_updated_at();

ALTER TABLE public.actions
    ADD COLUMN IF NOT EXISTS route_path TEXT,
    ADD COLUMN IF NOT EXISTS source_record_id TEXT,
    ADD COLUMN IF NOT EXISTS source_table_name TEXT,
    ADD COLUMN IF NOT EXISTS created_from_finding_id UUID REFERENCES public.ofsted_findings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_actions_created_from_finding
    ON public.actions(created_from_finding_id);

COMMENT ON TABLE public.ofsted_findings IS 'Persistent Ofsted readiness findings created by scans, inspections, rule updates, and manual review.';
COMMENT ON TABLE public.ofsted_finding_events IS 'Audit trail for Ofsted finding lifecycle changes.';
