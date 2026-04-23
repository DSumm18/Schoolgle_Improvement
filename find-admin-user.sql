-- Find the actual user record for admin@schoolgle.co.uk
SELECT id, email, display_name, created_at
FROM users
WHERE email = 'admin@schoolgle.co.uk';

-- If found, add them to Grove House Primary School organization
-- Replace the user_id below with the actual id from the query above
INSERT INTO organization_members (user_id, organization_id, role, joined_at)
VALUES (
  (SELECT id FROM users WHERE email = 'admin@schoolgle.co.uk' LIMIT 1),
  'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3',
  'admin',
  NOW()
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'admin';
