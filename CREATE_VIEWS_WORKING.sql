-- Create views for dfe_data tables
-- Run INSPECT_DFE_SCHEMA.sql first to see what tables exist
-- Then run this to create views

-- Schools view (confirmed this table exists)
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;

-- Test the view
SELECT COUNT(*) as school_count FROM public.schools;

-- If other tables exist (check INSPECT_DFE_SCHEMA.sql results), add views for them:
-- Example:
-- CREATE OR REPLACE VIEW public.area_demographics AS 
-- SELECT * FROM dfe_data.area_demographics;
-- GRANT SELECT ON public.area_demographics TO service_role;
-- GRANT SELECT ON public.area_demographics TO anon;

