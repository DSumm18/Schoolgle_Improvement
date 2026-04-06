-- ═══════════════════════════════════════════════════════════════════════════
-- DealFind — Procurement Threshold Intelligence
-- Migration: 20260405_dealfind_threshold_intelligence.sql
--
-- Tracks cumulative spend per supplier per organisation/trust.
-- Alerts when approaching procurement thresholds.
-- Supports MAT aggregation per Procurement Act 2023 Schedule 3 para 4.
--
-- DO NOT APPLY — David reviews first.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Spend Tracker ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dealfind_spend_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_domain TEXT,                  -- e.g. 'ypo.co.uk', 'amazon.co.uk'
  category TEXT,                         -- e.g. 'stationery', 'cleaning', 'IT equipment'
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  financial_year TEXT NOT NULL DEFAULT '2025-26',
  recorded_by UUID,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'deal_finder', 'import')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_df_spend_org ON public.dealfind_spend_tracker(organization_id);
CREATE INDEX IF NOT EXISTS idx_df_spend_supplier ON public.dealfind_spend_tracker(supplier_name);
CREATE INDEX IF NOT EXISTS idx_df_spend_year ON public.dealfind_spend_tracker(financial_year);
CREATE INDEX IF NOT EXISTS idx_df_spend_category ON public.dealfind_spend_tracker(category);

-- ─── Threshold Definitions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dealfind_procurement_thresholds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  threshold_gbp DECIMAL(12,2) NOT NULL,
  requirement TEXT NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'mat_only', 'la_maintained_only')),
  legislation TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed UK procurement thresholds
INSERT INTO public.dealfind_procurement_thresholds (name, threshold_gbp, requirement, legislation, display_order) VALUES
  ('Three Quotes', 10000.00, 'Obtain minimum three written quotations', 'Good practice / most school financial regulations', 1),
  ('Formal Tender', 40000.00, 'Formal competitive tender process required', 'Most MAT/LA financial regulations', 2),
  ('Procurement Act', 207720.00, 'Full Procurement Act 2023 compliance — open tender, standstill period, contract notices', 'Procurement Act 2023 (goods/services threshold)', 3)
ON CONFLICT DO NOTHING;

-- ─── Supplier Alerts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dealfind_supplier_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  threshold_id UUID REFERENCES public.dealfind_procurement_thresholds(id),
  current_spend DECIMAL(12,2) NOT NULL,
  threshold_amount DECIMAL(12,2) NOT NULL,
  proximity_pct DECIMAL(5,2) NOT NULL,   -- How close (0-100%)
  alert_level TEXT NOT NULL CHECK (alert_level IN ('green', 'amber', 'red')),
  financial_year TEXT NOT NULL,
  dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_df_alerts_org ON public.dealfind_supplier_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_df_alerts_level ON public.dealfind_supplier_alerts(alert_level);

-- ─── RLS ────────────────────────────────────────────────────────────────

ALTER TABLE public.dealfind_spend_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealfind_procurement_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealfind_supplier_alerts ENABLE ROW LEVEL SECURITY;

-- Thresholds: readable by all (reference data)
CREATE POLICY df_thresh_read ON public.dealfind_procurement_thresholds FOR SELECT USING (true);
CREATE POLICY df_thresh_service ON public.dealfind_procurement_thresholds FOR ALL TO service_role USING (true);

-- Spend tracker: org-scoped
CREATE POLICY df_spend_read ON public.dealfind_spend_tracker FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY df_spend_insert ON public.dealfind_spend_tracker FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY df_spend_service ON public.dealfind_spend_tracker FOR ALL TO service_role USING (true);

-- Alerts: org-scoped
CREATE POLICY df_alerts_read ON public.dealfind_supplier_alerts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY df_alerts_service ON public.dealfind_supplier_alerts FOR ALL TO service_role USING (true);

-- ─── View: Supplier spend summary per org per year ──────────────────────

CREATE OR REPLACE VIEW public.dealfind_supplier_spend_summary AS
SELECT
  organization_id,
  supplier_name,
  financial_year,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spend,
  MIN(purchase_date) as first_purchase,
  MAX(purchase_date) as last_purchase
FROM public.dealfind_spend_tracker
GROUP BY organization_id, supplier_name, financial_year;
