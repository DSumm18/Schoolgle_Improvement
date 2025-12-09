-- Run this FIRST to see what tables actually exist in dfe_data schema
-- Then use the results to create views only for existing tables

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

