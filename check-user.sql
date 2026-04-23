-- Check if this user exists and what their actual IDs are
SELECT id, email, display_name FROM users WHERE email = 'admin@schoolgle.co.uk';

-- Check what organizations this user belongs to
SELECT om.*, o.name as org_name
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = (SELECT id FROM users WHERE email = 'admin@schoolgle.co.uk' LIMIT 1);
