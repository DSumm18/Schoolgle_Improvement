-- Add yourself as super admin
-- Replace 'YOUR_USER_ID_HERE' with your actual Supabase auth user ID
-- You can find it in: Supabase Dashboard > Authentication > Users

-- Example (replace with your actual user ID):
-- INSERT INTO super_admins (user_id, access_level, can_impersonate, can_manage_subscriptions, can_view_financials)
-- VALUES ('your-user-id-here', 'owner', true, true, true)
-- ON CONFLICT (user_id) DO NOTHING;

-- To find your user ID:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find your user email
-- 3. Copy the UUID from the "User UID" column
-- 4. Replace 'YOUR_USER_ID_HERE' above and run

