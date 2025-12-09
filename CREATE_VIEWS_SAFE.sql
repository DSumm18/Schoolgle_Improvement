-- STEP 2: Create views ONLY for tables that exist
-- After running RUN_THIS_FIRST.sql, check the results
-- Then run this SQL, uncommenting only the views for tables that exist

-- Schools view (most likely exists - 34,750 records)
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;

-- If area_demographics exists (check results from RUN_THIS_FIRST.sql):
-- CREATE OR REPLACE VIEW public.area_demographics AS 
-- SELECT * FROM dfe_data.area_demographics;
-- GRANT SELECT ON public.area_demographics TO service_role;
-- GRANT SELECT ON public.area_demographics TO anon;

-- If local_authority_finance exists:
-- CREATE OR REPLACE VIEW public.local_authority_finance AS 
-- SELECT * FROM dfe_data.local_authority_finance;
-- GRANT SELECT ON public.local_authority_finance TO service_role;
-- GRANT SELECT ON public.local_authority_finance TO anon;

-- If school_area_links exists:
-- CREATE OR REPLACE VIEW public.school_area_links AS 
-- SELECT * FROM dfe_data.school_area_links;
-- GRANT SELECT ON public.school_area_links TO service_role;
-- GRANT SELECT ON public.school_area_links TO anon;

