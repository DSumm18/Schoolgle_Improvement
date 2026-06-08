-- Estates asset contractor roles
--
-- Assets need to distinguish:
-- - who supplied/sold the asset, used for warranty routing
-- - who maintains/supports the asset, used for repairs, servicing and advice

ALTER TABLE public.estates_assets
ADD COLUMN IF NOT EXISTS maintained_by_contractor_id UUID
REFERENCES public.estates_contractors(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.estates_assets.maintained_by_contractor_id IS
'Primary contractor responsible for maintaining or supporting this asset. Separate from purchased_from_contractor_id, which is the supplier/warranty source.';

CREATE INDEX IF NOT EXISTS idx_estates_assets_maintained_by_contractor
  ON public.estates_assets(maintained_by_contractor_id);
