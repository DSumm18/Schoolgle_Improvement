-- Run this in Supabase SQL Editor to check which tables exist in dfe_data schema

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

