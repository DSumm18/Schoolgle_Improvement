-- Create views in public schema pointing to dfe_data tables
-- Run this in Supabase SQL Editor

-- Schools view
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

-- Area demographics view
CREATE OR REPLACE VIEW public.area_demographics AS 
SELECT * FROM dfe_data.area_demographics;

-- Local authority finance view
CREATE OR REPLACE VIEW public.local_authority_finance AS 
SELECT * FROM dfe_data.local_authority_finance;

-- School area links view
CREATE OR REPLACE VIEW public.school_area_links AS 
SELECT * FROM dfe_data.school_area_links;

-- Grant permissions
GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.area_demographics TO service_role;
GRANT SELECT ON public.area_demographics TO anon;
GRANT SELECT ON public.local_authority_finance TO service_role;
GRANT SELECT ON public.local_authority_finance TO anon;
GRANT SELECT ON public.school_area_links TO service_role;
GRANT SELECT ON public.school_area_links TO anon;

-- Add comments
COMMENT ON VIEW public.schools IS 'View of dfe_data.schools for easy access';
COMMENT ON VIEW public.area_demographics IS 'View of dfe_data.area_demographics for easy access';
COMMENT ON VIEW public.local_authority_finance IS 'View of dfe_data.local_authority_finance for easy access';
COMMENT ON VIEW public.school_area_links IS 'View of dfe_data.school_area_links for easy access';

