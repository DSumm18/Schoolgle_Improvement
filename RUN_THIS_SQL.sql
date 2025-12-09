-- Create views in public schema pointing to dfe_data tables
-- This version only creates views for tables that exist

-- STEP 1: First, check which tables exist by running:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'dfe_data' ORDER BY table_name;

-- Schools view (confirmed exists - 34,750 records)
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;

-- Only uncomment views for tables that actually exist (check with query above):

-- If area_demographics table exists:
-- CREATE OR REPLACE VIEW public.area_demographics AS 
-- SELECT * FROM dfe_data.area_demographics;
-- GRANT SELECT ON public.area_demographics TO service_role;
-- GRANT SELECT ON public.area_demographics TO anon;

-- If local_authority_finance table exists:
-- CREATE OR REPLACE VIEW public.local_authority_finance AS 
-- SELECT * FROM dfe_data.local_authority_finance;
-- GRANT SELECT ON public.local_authority_finance TO service_role;
-- GRANT SELECT ON public.local_authority_finance TO anon;

-- If school_area_links table exists:
-- CREATE OR REPLACE VIEW public.school_area_links AS 
-- SELECT * FROM dfe_data.school_area_links;
-- GRANT SELECT ON public.school_area_links TO service_role;
-- GRANT SELECT ON public.school_area_links TO anon;