-- Create views ONLY for tables that exist
-- Run CHECK_TABLES.sql first to see which tables are available
-- Then uncomment the views for tables that exist

-- Schools view (should exist based on your data import)
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

-- Grant permissions for schools
GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;

-- Uncomment these if the tables exist (check with CHECK_TABLES.sql first):

-- Area demographics view (if table exists)
-- CREATE OR REPLACE VIEW public.area_demographics AS 
-- SELECT * FROM dfe_data.area_demographics;
-- GRANT SELECT ON public.area_demographics TO service_role;
-- GRANT SELECT ON public.area_demographics TO anon;

-- Local authority finance view (if table exists)
-- CREATE OR REPLACE VIEW public.local_authority_finance AS 
-- SELECT * FROM dfe_data.local_authority_finance;
-- GRANT SELECT ON public.local_authority_finance TO service_role;
-- GRANT SELECT ON public.local_authority_finance TO anon;

-- School area links view (if table exists)
-- CREATE OR REPLACE VIEW public.school_area_links AS 
-- SELECT * FROM dfe_data.school_area_links;
-- GRANT SELECT ON public.school_area_links TO service_role;
-- GRANT SELECT ON public.school_area_links TO anon;

