
-- Complete dfe_data schema inspection
-- This will show all tables, their row counts, and sample data

-- 1. All tables in dfe_data schema
SELECT 
    'TABLE' as type,
    table_name as name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- 2. Row counts for each table (if accessible)
DO $$
DECLARE
    table_rec RECORD;
    row_count BIGINT;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dfe_data'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM dfe_data.%I', table_rec.table_name) INTO row_count;
        RAISE NOTICE 'Table: % | Rows: %', table_rec.table_name, row_count;
    END LOOP;
END $$;
