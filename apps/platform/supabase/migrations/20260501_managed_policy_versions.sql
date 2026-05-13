-- Managed Policy Manager metadata on existing compliance version tables.
-- The compliance module already stores policy items, versions and approvals;
-- this migration adds the Schoolgle-managed policy metadata needed for source
-- checks, semantic versions and publication/approval workflow.

ALTER TABLE public.compliance_versions
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_compliance_items_policy_requirement
    ON public.compliance_items ((metadata->>'policyRequirementId'))
    WHERE type = 'policy';

CREATE INDEX IF NOT EXISTS idx_compliance_versions_semantic_version
    ON public.compliance_versions ((metadata->>'semanticVersion'));

COMMENT ON COLUMN public.compliance_versions.metadata IS
    'Policy Manager version metadata including semanticVersion, approvalStatus, sourceChecks, assumptions and publishing state.';
