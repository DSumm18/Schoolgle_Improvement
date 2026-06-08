-- Estates asset/check linking
--
-- Statutory check identifiers are product slugs such as `leg_weekly_flush`,
-- not database UUIDs. The original asset extension used UUID[] which made it
-- impossible to link physical assets directly to product-defined checks.

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS linked_compliance_checks TEXT[] DEFAULT '{}';

ALTER TABLE public.estates_assets
ALTER COLUMN linked_compliance_checks TYPE TEXT[]
USING COALESCE(linked_compliance_checks::TEXT[], ARRAY[]::TEXT[]);

ALTER TABLE public.estates_assets
ALTER COLUMN linked_compliance_checks SET DEFAULT '{}';

COMMENT ON COLUMN public.estates_assets.linked_compliance_checks IS
'Product statutory check IDs linked to this physical asset, e.g. leg_weekly_flush or fire_extinguisher_service.';

CREATE INDEX IF NOT EXISTS idx_estates_assets_linked_compliance_checks
  ON public.estates_assets USING GIN (linked_compliance_checks);
