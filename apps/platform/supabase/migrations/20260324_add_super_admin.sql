-- Add admin@schoolgle.co.uk as super admin
INSERT INTO super_admins (user_id, email, access_level, added_by)
VALUES (
  'admin@schoolgle.co.uk',
  'admin@schoolgle.co.uk',
  'full',
  'system'
)
ON CONFLICT (user_id) DO NOTHING;

-- Also add by email in case user_id differs
INSERT INTO super_admins (user_id, email, access_level, added_by)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@schoolgle.co.uk' LIMIT 1),
  'admin@schoolgle.co.uk',
  'full',
  'system'
)
ON CONFLICT (user_id) DO NOTHING;
