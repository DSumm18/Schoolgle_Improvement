-- ═══════════════════════════════════════════════════════════════════════════
-- Ed Self-Improving Harness — Phase 1: Instrument & Measure
-- Migration: 20260404_ed_harness_phase1.sql
--
-- 7 tables for prompt versioning, feedback collection, eval framework:
--   ed_prompt_versions, ed_retrieval_configs, ed_feedback,
--   ed_prompt_scores, ed_eval_test_cases, ed_eval_runs, ed_eval_results
--
-- DO NOT APPLY — David reviews first.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Table 1: Prompt Versions ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_prompt_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('active', 'candidate', 'archived')),
  promoted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  promotion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID NOT NULL,
  UNIQUE(specialist_id, version, organization_id)
);

-- ─── Table 2: Retrieval Configs ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_retrieval_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  config_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('active', 'candidate', 'archived')),
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table 3: Feedback ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id TEXT NOT NULL,
  prompt_version_id UUID REFERENCES public.ed_prompt_versions(id),
  conversation_id TEXT,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  category TEXT CHECK (category IS NULL OR category IN (
    'wrong_info', 'misunderstood', 'too_complex', 'too_vague',
    'not_actionable', 'great_answer', 'other'
  )),
  category_detail TEXT,
  implicit_signals JSONB DEFAULT '{}',
  user_role TEXT,
  organization_id UUID NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table 4: Prompt Scores (aggregated) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_prompt_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_version_id UUID REFERENCES public.ed_prompt_versions(id),
  specialist_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_interactions INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,4),
  edit_rate DECIMAL(5,4),
  re_ask_rate DECIMAL(5,4),
  avg_rating DECIMAL(3,2),
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_version_id, period_start, period_end, organization_id)
);

-- ─── Table 5: Eval Test Cases ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_eval_test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id TEXT NOT NULL,
  suite_name TEXT NOT NULL,
  persona TEXT,
  input TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  rubric JSONB NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'adversarial')),
  is_safety_gate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table 6: Eval Runs ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_eval_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_version_id UUID REFERENCES public.ed_prompt_versions(id),
  specialist_id TEXT NOT NULL,
  model TEXT NOT NULL,
  judge_model TEXT NOT NULL,
  total_cases INTEGER NOT NULL,
  passed_cases INTEGER NOT NULL,
  failed_cases INTEGER NOT NULL,
  safety_gate_failures INTEGER DEFAULT 0,
  avg_score DECIMAL(5,4),
  scores_by_category JSONB,
  cost_usd DECIMAL(10,6),
  duration_ms INTEGER,
  triggered_by TEXT DEFAULT 'scheduled' CHECK (triggered_by IN ('scheduled', 'manual', 'promotion_check')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table 7: Eval Results ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_eval_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES public.ed_eval_runs(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES public.ed_eval_test_cases(id),
  specialist_id TEXT NOT NULL,
  response TEXT NOT NULL,
  judge_scores JSONB NOT NULL,
  judge_reasoning TEXT,
  overall_score DECIMAL(5,4) NOT NULL,
  passed BOOLEAN NOT NULL,
  safety_gate_passed BOOLEAN,
  model TEXT NOT NULL,
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ed_feedback_specialist ON public.ed_feedback(specialist_id);
CREATE INDEX IF NOT EXISTS idx_ed_feedback_created ON public.ed_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ed_feedback_org ON public.ed_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_ed_feedback_rating ON public.ed_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ed_prompt_versions_specialist ON public.ed_prompt_versions(specialist_id, status);
CREATE INDEX IF NOT EXISTS idx_ed_eval_runs_specialist ON public.ed_eval_runs(specialist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ed_eval_results_run ON public.ed_eval_results(run_id);
CREATE INDEX IF NOT EXISTS idx_ed_eval_results_passed ON public.ed_eval_results(passed);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ed_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_retrieval_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_prompt_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_eval_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_eval_results ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY ed_pv_service ON public.ed_prompt_versions FOR ALL TO service_role USING (true);
CREATE POLICY ed_rc_service ON public.ed_retrieval_configs FOR ALL TO service_role USING (true);
CREATE POLICY ed_fb_service ON public.ed_feedback FOR ALL TO service_role USING (true);
CREATE POLICY ed_ps_service ON public.ed_prompt_scores FOR ALL TO service_role USING (true);
CREATE POLICY ed_etc_service ON public.ed_eval_test_cases FOR ALL TO service_role USING (true);
CREATE POLICY ed_er_service ON public.ed_eval_runs FOR ALL TO service_role USING (true);
CREATE POLICY ed_eres_service ON public.ed_eval_results FOR ALL TO service_role USING (true);

-- Authenticated read on reference data
CREATE POLICY ed_pv_auth_read ON public.ed_prompt_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY ed_etc_auth_read ON public.ed_eval_test_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY ed_er_auth_read ON public.ed_eval_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY ed_eres_auth_read ON public.ed_eval_results FOR SELECT TO authenticated USING (true);
CREATE POLICY ed_ps_auth_read ON public.ed_prompt_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY ed_rc_auth_read ON public.ed_retrieval_configs FOR SELECT TO authenticated USING (true);

-- Feedback: users insert own, read org's
CREATE POLICY ed_fb_insert ON public.ed_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY ed_fb_read ON public.ed_feedback FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial Specialist Registry
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.ed_prompt_versions (specialist_id, version, content, model, status, organization_id) VALUES
  ('ed',      1, '[PLACEHOLDER] Initial system prompt for Ed (router). To be replaced with full prompt from Notion spec.', 'gemini-2.0-flash', 'active', '00000000-0000-0000-0000-000000000000'),
  ('gerald',  1, '[PLACEHOLDER] Initial system prompt for Gerald (governance). To be replaced with full prompt from Notion spec.', 'gemini-2.0-flash', 'active', '00000000-0000-0000-0000-000000000000'),
  ('felix',   1, '[PLACEHOLDER] Initial system prompt for Felix (finance). To be replaced with full prompt from Notion spec.', 'claude-sonnet-4-20250514', 'active', '00000000-0000-0000-0000-000000000000'),
  ('terry',   1, '[PLACEHOLDER] Initial system prompt for Terry (estates). To be replaced with full prompt from Notion spec.', 'gemini-2.0-flash', 'active', '00000000-0000-0000-0000-000000000000'),
  ('connie',  1, '[PLACEHOLDER] Initial system prompt for Connie (safeguarding — safety critical). To be replaced with full prompt from Notion spec.', 'claude-sonnet-4-20250514', 'active', '00000000-0000-0000-0000-000000000000'),
  ('millie',  1, '[PLACEHOLDER] Initial system prompt for Millie (T&L). To be replaced with full prompt from Notion spec.', 'claude-sonnet-4-20250514', 'active', '00000000-0000-0000-0000-000000000000'),
  ('harriet', 1, '[PLACEHOLDER] Initial system prompt for Harriet (HR). To be replaced with full prompt from Notion spec.', 'gemini-2.0-flash', 'active', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (specialist_id, version, organization_id) DO NOTHING;
