-- Mission Control Phase 1 — Admin Gate + Approval Queue + Skill Registry

-- ============================================================
-- TABLE: mc_admin_users
-- Admin whitelist — only listed users can access Mission Control
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mc_admin_users (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL UNIQUE,
  role         text        NOT NULL DEFAULT 'admin'
                           CHECK (role IN ('super_admin', 'admin', 'viewer')),
  display_name text,
  added_by     text        NOT NULL DEFAULT 'system',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: mc_skill_executions
-- Log of every skill run across Mission Control
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mc_skill_executions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id       text        NOT NULL,
  skill_name     text        NOT NULL,
  department     text,
  execution_type text        NOT NULL
                             CHECK (execution_type IN ('manual', 'scheduled', 'triggered', 'api')),
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_params   jsonb       DEFAULT '{}',
  output_data    jsonb       DEFAULT '{}',
  error_message  text,
  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    integer,
  triggered_by   text        NOT NULL DEFAULT 'system',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: mc_approval_queue
-- Items pending human review before publish/action
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mc_approval_queue (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type      text        NOT NULL
                             CHECK (item_type IN ('social_post', 'content_publish', 'skill_output', 'email_draft', 'document', 'other')),
  title          text        NOT NULL,
  description    text,
  preview_data   jsonb       DEFAULT '{}',
  source_skill   text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  priority       text        NOT NULL DEFAULT 'normal'
                             CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  decided_by     text,
  decided_at     timestamptz,
  decision_notes text,
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: mc_audit_log
-- Immutable record of everything that happens in Mission Control
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mc_audit_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     text        NOT NULL,
  event_category text        NOT NULL DEFAULT 'system'
                             CHECK (event_category IN ('system', 'skill', 'approval', 'admin', 'security', 'error')),
  actor          text        NOT NULL DEFAULT 'system',
  description    text        NOT NULL,
  metadata       jsonb       DEFAULT '{}',
  ip_address     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: mc_scheduled_tasks
-- Cron-style scheduled jobs for Mission Control automation
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mc_scheduled_tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  description     text,
  skill_id        text,
  cron_expression text        NOT NULL,
  is_active       boolean     NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  next_run_at     timestamptz,
  last_status     text        CHECK (last_status IN ('success', 'failed', 'skipped')),
  run_count       integer     NOT NULL DEFAULT 0,
  config          jsonb       DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mc_skill_executions_status
  ON public.mc_skill_executions (status);

CREATE INDEX IF NOT EXISTS idx_mc_skill_executions_created_at
  ON public.mc_skill_executions (created_at);

CREATE INDEX IF NOT EXISTS idx_mc_approval_queue_status
  ON public.mc_approval_queue (status);

CREATE INDEX IF NOT EXISTS idx_mc_audit_log_event_category
  ON public.mc_audit_log (event_category);

CREATE INDEX IF NOT EXISTS idx_mc_audit_log_created_at
  ON public.mc_audit_log (created_at);

CREATE INDEX IF NOT EXISTS idx_mc_scheduled_tasks_is_active
  ON public.mc_scheduled_tasks (is_active);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables locked down — service role bypasses RLS,
-- meaning only server-side Mission Control code can read/write.
-- ============================================================
ALTER TABLE public.mc_admin_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_skill_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_approval_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_audit_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_scheduled_tasks  ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (Mission Control uses service_role client only)
CREATE POLICY "service_role_bypass_mc_admin_users"
  ON public.mc_admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_bypass_mc_skill_executions"
  ON public.mc_skill_executions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_bypass_mc_approval_queue"
  ON public.mc_approval_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_bypass_mc_audit_log"
  ON public.mc_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_bypass_mc_scheduled_tasks"
  ON public.mc_scheduled_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED: David Summerscales as super_admin
-- ============================================================
INSERT INTO public.mc_admin_users (email, role, display_name, added_by)
VALUES ('david@schoolgle.co.uk', 'super_admin', 'David Summerscales', 'system')
ON CONFLICT (email) DO NOTHING;
