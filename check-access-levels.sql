-- Check what access_level values already exist in super_admins
SELECT DISTINCT access_level FROM super_admins;

-- Or check the constraint
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'super_admins_access_level_check';
