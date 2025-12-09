-- STEP 1: Check which tables exist in dfe_data schema
-- Run this FIRST in Supabase SQL Editor

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

