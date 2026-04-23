-- Add admin@schoolgle.co.uk as a super admin
-- This allows access to all organizations without needing individual memberships

INSERT INTO super_admins (user_id, access_level, created_at, updated_at)
VALUES (
  'f1e52c47-64b7-4b63-8b2e-3803df700191',
  'full',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  access_level = 'full',
  updated_at = NOW();
