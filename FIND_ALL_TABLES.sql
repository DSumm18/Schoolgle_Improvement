-- Find all tables in dfe_data schema
-- Run this in Supabase SQL Editor

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- Then for each table found, check row count:
-- SELECT COUNT(*) FROM dfe_data.schools;
-- SELECT COUNT(*) FROM dfe_data.area_demographics;
-- etc.
