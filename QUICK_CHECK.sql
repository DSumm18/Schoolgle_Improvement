-- Quick check: Does dfe_data.schools have data?
-- Run this first to see if the table itself has data

SELECT 
    'Direct count from dfe_data.schools table:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- If the above shows 0, the table is empty
-- If it shows > 0, then we have a permissions/access issue with the view

