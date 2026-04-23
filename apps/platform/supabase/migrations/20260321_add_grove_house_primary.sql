-- Add Grove House Primary School as a test organization
-- This gives us 3 schools total for testing onboarding

INSERT INTO public.organizations (
  id,
  name,
  urn,
  local_authority,
  school_type,
  phase,
  age_range,
  religion,
  pupil_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'Grove House Primary School',
  '100000', -- Test URN (not real)
  'Test Local Authority',
  'Community School',
  'Primary',
  '4-11',
  'None',
  210,
  now()
) ON CONFLICT DO NOTHING;

-- Log for verification
DO $$
BEGIN
  RAISE NOTICE 'Grove House Primary School added successfully';
END $$;
