-- RLS Audit Fix Migration
-- Enables Row Level Security on tables that were missed in prior migrations
-- All tables with organization_id or user-scoped data must have RLS enabled
-- Wrapped in DO blocks so it's safe to run even if parent migrations haven't been applied yet

-- ─── ed_form_knowledge tables ────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_form_mistakes') THEN
    ALTER TABLE ed_form_mistakes ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_form_mistakes' AND policyname = 'service_ed_form_mistakes') THEN
      CREATE POLICY "service_ed_form_mistakes" ON ed_form_mistakes FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_wording_improvements') THEN
    ALTER TABLE ed_wording_improvements ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_wording_improvements' AND policyname = 'service_ed_wording_improvements') THEN
      CREATE POLICY "service_ed_wording_improvements" ON ed_wording_improvements FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

-- ─── ed_rpa_skills tables ────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_rpa_skill_versions') THEN
    ALTER TABLE ed_rpa_skill_versions ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_skill_versions' AND policyname = 'org_rpa_skill_versions') THEN
      CREATE POLICY "org_rpa_skill_versions" ON ed_rpa_skill_versions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ed_rpa_skills s
            WHERE s.id = ed_rpa_skill_versions.skill_id
            AND s.organization_id IN (
              SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_skill_versions' AND policyname = 'service_rpa_skill_versions') THEN
      CREATE POLICY "service_rpa_skill_versions" ON ed_rpa_skill_versions FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_rpa_runs') THEN
    ALTER TABLE ed_rpa_runs ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_runs' AND policyname = 'org_rpa_runs') THEN
      CREATE POLICY "org_rpa_runs" ON ed_rpa_runs
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_runs' AND policyname = 'service_rpa_runs') THEN
      CREATE POLICY "service_rpa_runs" ON ed_rpa_runs FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_rpa_run_approvals') THEN
    ALTER TABLE ed_rpa_run_approvals ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_run_approvals' AND policyname = 'org_rpa_run_approvals') THEN
      CREATE POLICY "org_rpa_run_approvals" ON ed_rpa_run_approvals
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ed_rpa_runs r
            WHERE r.id = ed_rpa_run_approvals.run_id
            AND r.organization_id IN (
              SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_run_approvals' AND policyname = 'service_rpa_run_approvals') THEN
      CREATE POLICY "service_rpa_run_approvals" ON ed_rpa_run_approvals FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_rpa_skill_subscriptions') THEN
    ALTER TABLE ed_rpa_skill_subscriptions ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_skill_subscriptions' AND policyname = 'user_rpa_subscriptions') THEN
      CREATE POLICY "user_rpa_subscriptions" ON ed_rpa_skill_subscriptions FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_skill_subscriptions' AND policyname = 'user_rpa_subscriptions_manage') THEN
      CREATE POLICY "user_rpa_subscriptions_manage" ON ed_rpa_skill_subscriptions FOR ALL USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_skill_subscriptions' AND policyname = 'service_rpa_subscriptions') THEN
      CREATE POLICY "service_rpa_subscriptions" ON ed_rpa_skill_subscriptions FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_rpa_audit_log') THEN
    ALTER TABLE ed_rpa_audit_log ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_audit_log' AND policyname = 'org_rpa_audit_log') THEN
      CREATE POLICY "org_rpa_audit_log" ON ed_rpa_audit_log
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_rpa_audit_log' AND policyname = 'service_rpa_audit_log') THEN
      CREATE POLICY "service_rpa_audit_log" ON ed_rpa_audit_log FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

-- ─── ed_form_learning tables ─────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_field_annotations') THEN
    ALTER TABLE ed_field_annotations ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_field_annotations' AND policyname = 'org_field_annotations') THEN
      CREATE POLICY "org_field_annotations" ON ed_field_annotations
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ed_learned_forms f
            WHERE f.id = ed_field_annotations.form_id
            AND f.organization_id IN (
              SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_field_annotations' AND policyname = 'service_field_annotations') THEN
      CREATE POLICY "service_field_annotations" ON ed_field_annotations FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_learning_sessions') THEN
    ALTER TABLE ed_learning_sessions ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_learning_sessions' AND policyname = 'user_learning_sessions') THEN
      CREATE POLICY "user_learning_sessions" ON ed_learning_sessions FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_learning_sessions' AND policyname = 'service_learning_sessions') THEN
      CREATE POLICY "service_learning_sessions" ON ed_learning_sessions FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ed_field_value_patterns') THEN
    ALTER TABLE ed_field_value_patterns ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ed_field_value_patterns' AND policyname = 'service_field_value_patterns') THEN
      CREATE POLICY "service_field_value_patterns" ON ed_field_value_patterns FOR ALL TO service_role USING (true);
    END IF;
  END IF;
END $$;
