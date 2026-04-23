-- Check if admin@schoolgle.co.uk is a member of Grove House Primary School
SELECT u.id, u.email, u.display_name
FROM users u
WHERE u.email = 'admin@schoolgle.co.uk';

-- If user exists, check their org memberships
SELECT om.*, o.name as org_name
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id IN (
  SELECT id FROM users WHERE email = 'admin@schoolgle.co.uk'
);
