-- PERFORMANCE INDEXES

-- Actions Table
CREATE INDEX IF NOT EXISTS idx_actions_org_status ON actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);

-- Evidence Matches Table
CREATE INDEX IF NOT EXISTS idx_evidence_matches_org ON evidence_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidence_matches_subcat ON evidence_matches(subcategory_id);

-- Ofsted Assessments Table
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_org ON ofsted_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_cat ON ofsted_assessments(category_id);

-- SEF Documents Table
CREATE INDEX IF NOT EXISTS idx_sef_documents_org ON sef_documents(organization_id);

-- SDP Documents Table
CREATE INDEX IF NOT EXISTS idx_sdp_documents_org ON sdp_documents(organization_id);

-- Organizations Table
CREATE INDEX IF NOT EXISTS idx_organizations_urn ON organizations(urn);
