-- Migration: Expected Income Tracker
-- Lets schools log income they know is coming but hasn't appeared in FMS yet.
-- Powers the "True Position" budget view with confidence-weighted income.

CREATE TABLE IF NOT EXISTS expected_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  financial_year TEXT NOT NULL,

  -- What
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'la_delegated', 'sen_top_up', 'pupil_premium', 'government_grant',
    'other_grant', 'lettings', 'insurance_claim', 'staff_recharge',
    'energy_recharge', 'catering', 'training_income', 'other'
  )),
  cfr_code TEXT NOT NULL,
  cost_centre TEXT,

  -- How much
  total_expected NUMERIC(12,2) NOT NULL,
  amount_received NUMERIC(12,2) DEFAULT 0,
  amount_outstanding NUMERIC(12,2) GENERATED ALWAYS AS (total_expected - amount_received) STORED,

  -- When
  frequency TEXT DEFAULT 'one_off' CHECK (frequency IN ('one_off', 'monthly', 'termly', 'quarterly', 'annual')),
  expected_dates JSONB DEFAULT '[]'::jsonb,

  -- Confidence
  confidence TEXT DEFAULT 'likely' CHECK (confidence IN ('confirmed', 'highly_likely', 'likely', 'uncertain')),
  confidence_reason TEXT,
  evidence_url TEXT,

  -- Source
  source TEXT,
  source_reference TEXT,

  -- Status
  status TEXT DEFAULT 'expected' CHECK (status IN ('expected', 'partially_received', 'received', 'overdue', 'written_off')),

  -- Staff recharge specifics
  staff_name TEXT,           -- e.g. "Mrs Smith" (for secondment display)
  staff_role TEXT,           -- e.g. "Deputy Head"
  monthly_recharge NUMERIC(12,2), -- monthly salary + on-costs
  recharge_destination TEXT, -- e.g. "Oakwood Academy"

  -- Tracking
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expected_income_org ON expected_income(organization_id);
CREATE INDEX IF NOT EXISTS idx_expected_income_year ON expected_income(organization_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_expected_income_status ON expected_income(organization_id, status);

ALTER TABLE expected_income ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expected_income' AND policyname = 'expected_income_select') THEN
    CREATE POLICY expected_income_select ON expected_income
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expected_income.organization_id AND organization_members.user_id = auth.uid()::text)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expected_income' AND policyname = 'expected_income_insert') THEN
    CREATE POLICY expected_income_insert ON expected_income
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expected_income.organization_id AND organization_members.user_id = auth.uid()::text)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expected_income' AND policyname = 'expected_income_update') THEN
    CREATE POLICY expected_income_update ON expected_income
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expected_income.organization_id AND organization_members.user_id = auth.uid()::text)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expected_income' AND policyname = 'expected_income_delete') THEN
    CREATE POLICY expected_income_delete ON expected_income
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expected_income.organization_id AND organization_members.user_id = auth.uid()::text AND organization_members.role IN ('admin', 'headteacher', 'slt'))
      );
  END IF;
END $$;

-- ============================================================================
-- Seed Aurora Primary expected income for 2025-26
-- ============================================================================

INSERT INTO expected_income (organization_id, financial_year, description, category, cfr_code, total_expected, amount_received, frequency, confidence, confidence_reason, source, source_reference, status, staff_name, staff_role, monthly_recharge, recharge_destination, expected_dates, notes)
VALUES
  -- Staff secondment recharge (DHT seconded to Oakwood Academy for 2 terms)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'DHT Secondment Recharge — Mrs J. Patterson to Oakwood Academy',
   'staff_recharge', 'I07', 42000, 14000, 'monthly', 'confirmed',
   'Formal secondment agreement signed July 2025. LA processes recharge monthly in arrears.',
   'Oakwood Academy via LA', 'LA/SEC/2025/0847', 'partially_received',
   'Mrs J. Patterson', 'Deputy Headteacher', 3500, 'Oakwood Academy',
   '[{"date":"2025-09-30","amount":3500,"status":"received"},{"date":"2025-10-31","amount":3500,"status":"received"},{"date":"2025-11-30","amount":3500,"status":"received"},{"date":"2025-12-31","amount":3500,"status":"received"},{"date":"2026-01-31","amount":3500,"status":"overdue"},{"date":"2026-02-28","amount":3500,"status":"pending"},{"date":"2026-03-31","amount":3500,"status":"pending"},{"date":"2026-04-30","amount":3500,"status":"pending"},{"date":"2026-05-31","amount":3500,"status":"pending"},{"date":"2026-06-30","amount":3500,"status":"pending"},{"date":"2026-07-31","amount":3500,"status":"pending"},{"date":"2026-08-31","amount":3500,"status":"pending"}]'::jsonb,
   'Sept-Aug secondment. LA typically 4-6 weeks behind. Jan payment overdue.'),

  -- Pupil Premium (quarterly)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'Pupil Premium Grant 2025-26',
   'pupil_premium', 'I05', 82000, 41000, 'quarterly', 'confirmed',
   'DfE allocation confirmed March 2025. 58 eligible pupils × £1,455 (primary rate).',
   'DfE via LA', 'PP/2025-26/AUR', 'partially_received',
   NULL, NULL, NULL, NULL,
   '[{"date":"2025-07-15","amount":20500,"status":"received"},{"date":"2025-10-15","amount":20500,"status":"received"},{"date":"2026-01-15","amount":20500,"status":"pending"},{"date":"2026-04-15","amount":20500,"status":"pending"}]'::jsonb,
   'Q1 and Q2 received. Q3 expected mid-Jan, usually 2-3 weeks late from LA.'),

  -- SEN Top-Up Funding
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'SEN Top-Up Funding — 6 EHCP pupils',
   'sen_top_up', 'I03', 45000, 22500, 'termly', 'highly_likely',
   'Panel decisions confirmed for all 6 pupils. Amounts agreed in EHCP reviews.',
   'LA SEN Team', 'SEN/TOP/2025-26', 'partially_received',
   NULL, NULL, NULL, NULL,
   '[{"date":"2025-09-01","amount":15000,"status":"received"},{"date":"2026-01-01","amount":15000,"status":"received"},{"date":"2026-04-01","amount":15000,"status":"pending"}]'::jsonb,
   'Autumn + Spring received. Summer term payment expected April. One pupil may transfer out (Y6 transition).'),

  -- PE & Sport Premium
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'PE & Sport Premium 2025-26',
   'government_grant', 'I06', 17350, 0, 'annual', 'confirmed',
   'DfE published rates: £16,000 + (£10 × 135 excess pupils). National allocation confirmed.',
   'DfE via LA', 'PE/2025-26', 'expected',
   NULL, NULL, NULL, NULL,
   '[{"date":"2025-10-31","amount":17350,"status":"overdue"}]'::jsonb,
   'Usually arrives October. Now overdue. Chase LA finance team.'),

  -- Lettings income (term-time Saturday football)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'Lettings — Saturday Football Club',
   'lettings', 'I08a', 12600, 5400, 'monthly', 'likely',
   'Signed letting agreement. £300/session × 42 weeks. Some cancellations expected.',
   'Riverside Youth FC', 'LET/2025/FC01', 'partially_received',
   NULL, NULL, NULL, NULL,
   '[{"date":"2025-09-30","amount":1200,"status":"received"},{"date":"2025-10-31","amount":1200,"status":"received"},{"date":"2025-11-30","amount":1200,"status":"received"},{"date":"2025-12-31","amount":900,"status":"received"},{"date":"2026-01-31","amount":900,"status":"received"},{"date":"2026-02-28","amount":1200,"status":"pending"},{"date":"2026-03-31","amount":1200,"status":"pending"},{"date":"2026-04-30","amount":1200,"status":"pending"},{"date":"2026-05-31","amount":1200,"status":"pending"},{"date":"2026-06-30","amount":1200,"status":"pending"}]'::jsonb,
   'Dec/Jan reduced due to weather cancellations. Letting agreement runs to July.'),

  -- Energy recharge (LA framework rebate)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'LA Energy Framework Rebate',
   'energy_recharge', 'I07', 3200, 0, 'annual', 'likely',
   'LA confirmed participation in LASER energy framework. Rebate based on consumption.',
   'LA Energy Team', 'EN/REB/2025-26', 'expected',
   NULL, NULL, NULL, NULL,
   '[{"date":"2026-03-31","amount":3200,"status":"pending"}]'::jsonb,
   'Annual rebate, usually processed March/April. Amount estimated from prior year.'),

  -- Insurance claim (roof storm damage)
  ('c64ed86b-9eab-49ee-9829-0706ff371083', '2025-26',
   'Insurance Claim — Roof Storm Damage (Nov 2025)',
   'insurance_claim', 'I10', 8500, 0, 'one_off', 'highly_likely',
   'Claim submitted 18 Nov 2025. Loss adjuster visited. Repair costs evidenced.',
   'Zurich Municipal Insurance', 'CLM/2025/4821', 'expected',
   NULL, NULL, NULL, NULL,
   '[{"date":"2026-02-28","amount":8500,"status":"pending"}]'::jsonb,
   'Claim approved by loss adjuster. Awaiting final payment. Typical turnaround 8-12 weeks.')

ON CONFLICT DO NOTHING;
