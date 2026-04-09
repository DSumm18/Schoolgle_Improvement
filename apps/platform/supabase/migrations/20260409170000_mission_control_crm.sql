-- ============================================================
-- Mission Control v2: Enterprise B2B CRM & Finance Engine
-- Support for multi-school/trust tracking, invoicing, and support.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mc_contracts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_type  text        NOT NULL DEFAULT 'annual' CHECK (contract_type IN ('annual', 'monthly_rolling', 'multi_year')),
  contract_status text       NOT NULL DEFAULT 'active' CHECK (contract_status IN ('draft', 'active', 'suspended', 'cancelled', 'expired')),
  start_date     date        NOT NULL DEFAULT CURRENT_DATE,
  end_date       date,
  active_modules text[]      DEFAULT '{}',
  annual_value   numeric(12, 2) DEFAULT 0.00,
  billing_cycle  text        NOT NULL DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  notes          text,
  signed_by      text,
  document_url   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mc_invoices (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    uuid        NOT NULL REFERENCES public.mc_contracts(id) ON DELETE CASCADE,
  organization_id uuid       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number text        NOT NULL UNIQUE,
  status         text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'overdue', 'paid', 'void')),
  issue_date     date        NOT NULL,
  due_date       date        NOT NULL,
  paid_date      date,
  amount         numeric(12, 2) NOT NULL,
  tax_amount     numeric(12, 2) DEFAULT 0.00,
  total_amount   numeric(12, 2) NOT NULL,
  payment_method text        DEFAULT 'bacs',
  document_url   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mc_communications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  log_type       text        NOT NULL DEFAULT 'note' CHECK (log_type IN ('note', 'email', 'call', 'meeting', 'support_ticket', 'opportunity')),
  direction      text        NOT NULL DEFAULT 'internal' CHECK (direction IN ('internal', 'inbound', 'outbound')),
  contact_name   text,
  contact_email  text,
  subject        text        NOT NULL,
  body           text        NOT NULL,
  status         text        DEFAULT 'closed' CHECK (status IN ('open', 'in_progress', 'waiting', 'closed', 'resolved')),
  logged_by_name text        NOT NULL,
  metadata       jsonb       DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_contracts_org ON public.mc_contracts (organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_contracts_status ON public.mc_contracts (contract_status);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_contract ON public.mc_invoices (contract_id);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_org ON public.mc_invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_status ON public.mc_invoices (status);
CREATE INDEX IF NOT EXISTS idx_mc_comms_org ON public.mc_communications (organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_comms_type ON public.mc_communications (log_type);

ALTER TABLE public.mc_contracts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_bypass_mc_contracts" ON public.mc_contracts;
CREATE POLICY "service_role_bypass_mc_contracts"
  ON public.mc_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_mc_invoices" ON public.mc_invoices;
CREATE POLICY "service_role_bypass_mc_invoices"
  ON public.mc_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_mc_communications" ON public.mc_communications;
CREATE POLICY "service_role_bypass_mc_communications"
  ON public.mc_communications FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "org_users_view_own_invoices" ON public.mc_invoices;
CREATE POLICY "org_users_view_own_invoices"
  ON public.mc_invoices FOR SELECT 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "org_users_view_own_contracts" ON public.mc_contracts;
CREATE POLICY "org_users_view_own_contracts"
  ON public.mc_contracts FOR SELECT 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );
