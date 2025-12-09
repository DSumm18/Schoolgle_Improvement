-- Find where the school data actually is
-- This will check all tables in dfe_data and see which ones have data

-- 1. List all tables in dfe_data schema with their row counts
DO $$
DECLARE
    table_rec RECORD;
    row_count BIGINT;
    sql_text TEXT;
BEGIN
    RAISE NOTICE 'Checking tables in dfe_data schema...';
    RAISE NOTICE '';
    
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dfe_data'
        ORDER BY table_name
    LOOP
        BEGIN
            sql_text := format('SELECT COUNT(*) FROM dfe_data.%I', table_rec.table_name);
            EXECUTE sql_text INTO row_count;
            RAISE NOTICE 'Table: % | Rows: %', table_rec.table_name, row_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Table: % | Error: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Show all tables in dfe_data (for reference)
SELECT 
    'All tables in dfe_data:' as info,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- 3. Check if data might be in school_profiles or school_history
SELECT 
    'school_profiles row count:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.school_profiles;

SELECT 
    'school_history row count:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.school_history;

-- 4. Sample from school_profiles if it has data
SELECT 
    'Sample from school_profiles:' as check_type,
    *
FROM dfe_data.school_profiles
LIMIT 1;

