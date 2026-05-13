-- =====================================================
-- Bradford Primary Maintained Schools Query
-- =====================================================
-- Returns contact details and Ofsted info for
-- primary schools in Bradford that are NOT academies
--
-- Bradford LA code: 387
-- =====================================================

SELECT
    s.urn,
    s.name AS school_name,
    s.type_name,
    s.phase_name,
    sp.headteacher_name,
    s.telephone,
    s.email,
    COALESCE(
        CONCAT_WS(', ', s.address_line1, s.address_line2, s.address_line3, s.town),
        'No address'
    ) AS address,
    s.postcode,
    sp.latest_ofsted_rating,
    sp.latest_ofsted_date
FROM dfe_data.schools s
LEFT JOIN dfe_data.school_profiles sp ON sp.urn = s.urn
WHERE s.la_code = '387'  -- Bradford
  AND s.phase_name = 'Primary'
  AND (
    -- Exclude academies, free schools, and other independent types
    LOWER(s.type_name) NOT LIKE '%academy%'
    AND LOWER(s.type_name) NOT LIKE '%free school%'
    AND LOWER(s.type_name) NOT LIKE '%studio school%'
    AND LOWER(s.type_name) NOT LIKE '%university technical%'
  )
ORDER BY s.name;

-- =====================================================
-- If the above doesn't work, try this diagnostic query
-- to see what columns actually exist:
-- =====================================================

-- Check schools table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'schools'
ORDER BY ordinal_position;

-- Check school_profiles table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'school_profiles'
ORDER BY ordinal_position;

-- Sample data from schools
SELECT * FROM dfe_data.schools LIMIT 3;

-- Sample data from school_profiles
SELECT * FROM dfe_data.school_profiles LIMIT 3;

-- Check LA codes to find Bradford
SELECT DISTINCT la_code, la_name
FROM dfe_data.schools
WHERE la_name ILIKE '%brad%'
ORDER BY la_code;

-- Count schools by LA to verify Bradford
SELECT la_code, la_name, COUNT(*) as school_count
FROM dfe_data.schools
GROUP BY la_code, la_name
ORDER BY school_count DESC
LIMIT 20;

-- =====================================================
-- Alternative: Use public schema views (if dfe_data not accessible)
-- =====================================================

-- Try querying via the public.schools view instead
-- SELECT * FROM public.schools WHERE la_code = '387' LIMIT 5;
