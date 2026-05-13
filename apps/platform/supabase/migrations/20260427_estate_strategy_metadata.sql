-- Estate strategy metadata used by the risk-led estates workflow.
-- Keeps strategic_plan_items compatible with the finance-facing strategy UI
-- and lets estates findings carry their source evidence into budget planning.

ALTER TABLE strategic_plan_items
  ADD COLUMN IF NOT EXISTS is_statutory BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_module TEXT,
  ADD COLUMN IF NOT EXISTS source_entity_id TEXT,
  ADD COLUMN IF NOT EXISTS consequence_if_unfunded TEXT;

CREATE INDEX IF NOT EXISTS idx_strategic_plan_items_source
  ON strategic_plan_items(organization_id, source_module, source_entity_id)
  WHERE source_module IS NOT NULL;

COMMENT ON COLUMN strategic_plan_items.is_statutory IS
  'Flags items that must be prioritised because they arise from a statutory duty.';

COMMENT ON COLUMN strategic_plan_items.risk_score IS
  'Risk score used for prioritisation. May be derived from risk_register or an estates finding triage.';

COMMENT ON COLUMN strategic_plan_items.source_module IS
  'Originating module for traceability, e.g. estates, finance, teaching-learning.';

COMMENT ON COLUMN strategic_plan_items.source_entity_id IS
  'Originating record identifier from the source module.';

COMMENT ON COLUMN strategic_plan_items.consequence_if_unfunded IS
  'Finance/trustee-facing explanation of what happens if the item is not funded.';
