-- RLS Audit Fix Migration
-- Enables Row Level Security on tables that were missed in prior migrations
-- All tables with organization_id or user-scoped data must have RLS enabled

-- ─── ed_form_knowledge tables ────────────────────────────────────────

ALTER TABLE IF EXISTS ed_form_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_wording_improvements ENABLE ROW LEVEL SECURITY;

-- ed_form_mistakes: internal system table, service role only
CREATE POLICY "service_ed_form_mistakes" ON ed_form_mistakes
  FOR ALL TO service_role USING (true);

-- ed_wording_improvements: internal system table, service role only
CREATE POLICY "service_ed_wording_improvements" ON ed_wording_improvements
  FOR ALL TO service_role USING (true);

-- ─── ed_rpa_skills tables ────────────────────────────────────────────

ALTER TABLE IF EXISTS ed_rpa_skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_rpa_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_rpa_run_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_rpa_skill_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_rpa_audit_log ENABLE ROW LEVEL SECURITY;

-- skill_versions: org-scoped via join to ed_rpa_skills
CREATE POLICY "org_rpa_skill_versions" ON ed_rpa_skill_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ed_rpa_skills s
      WHERE s.id = ed_rpa_skill_versions.skill_id
      AND s.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "service_rpa_skill_versions" ON ed_rpa_skill_versions
  FOR ALL TO service_role USING (true);

-- runs: org-scoped
CREATE POLICY "org_rpa_runs" ON ed_rpa_runs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_rpa_runs" ON ed_rpa_runs
  FOR ALL TO service_role USING (true);

-- run_approvals: org-scoped via join to runs
CREATE POLICY "org_rpa_run_approvals" ON ed_rpa_run_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ed_rpa_runs r
      WHERE r.id = ed_rpa_run_approvals.run_id
      AND r.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "service_rpa_run_approvals" ON ed_rpa_run_approvals
  FOR ALL TO service_role USING (true);

-- subscriptions: user-scoped
CREATE POLICY "user_rpa_subscriptions" ON ed_rpa_skill_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_rpa_subscriptions_manage" ON ed_rpa_skill_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "service_rpa_subscriptions" ON ed_rpa_skill_subscriptions
  FOR ALL TO service_role USING (true);

-- audit_log: org-scoped
CREATE POLICY "org_rpa_audit_log" ON ed_rpa_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_rpa_audit_log" ON ed_rpa_audit_log
  FOR ALL TO service_role USING (true);

-- ─── ed_form_learning tables ─────────────────────────────────────────

ALTER TABLE IF EXISTS ed_field_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ed_field_value_patterns ENABLE ROW LEVEL SECURITY;

-- annotations: org-scoped via join to ed_learned_forms
CREATE POLICY "org_field_annotations" ON ed_field_annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ed_learned_forms f
      WHERE f.id = ed_field_annotations.form_id
      AND f.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "service_field_annotations" ON ed_field_annotations
  FOR ALL TO service_role USING (true);

-- learning_sessions: user-scoped
CREATE POLICY "user_learning_sessions" ON ed_learning_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "service_learning_sessions" ON ed_learning_sessions
  FOR ALL TO service_role USING (true);

-- value_patterns: internal system table, service role only
CREATE POLICY "service_field_value_patterns" ON ed_field_value_patterns
  FOR ALL TO service_role USING (true);
