/**
 * Test script to verify super admin impersonation flow
 * This simulates what happens when a super admin clicks "View as School"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Testing Super Admin Impersonation ===\n');

  // 1. Verify admin@schoolgle.co.uk is a super admin
  // First, get the user by email from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'admin@schoolgle.co.uk')
    .maybeSingle();

  if (userError || !userData) {
    console.error('❌ Failed to get admin user from users table');
    return;
  }

  console.log('✅ Found admin user:', userData.email);

  const { data: superAdminCheck } = await supabase
    .from('super_admins')
    .select('access_level')
    .eq('user_id', userData.id)
    .maybeSingle();

  if (!superAdminCheck) {
    console.error('❌ User is not a super admin');
    return;
  }

  console.log('✅ User is a super admin with access level:', superAdminCheck.access_level, '\n');

  // 2. Get Grove House Primary School details
  const groveHouseId = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

  const { data: groveHouse, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, urn, organization_type')
    .eq('id', groveHouseId)
    .single();

  if (orgError || !groveHouse) {
    console.error('❌ Grove House not found:', orgError?.message);
    return;
  }

  console.log('✅ Found Grove House Primary School:');
  console.log('   ID:', groveHouse.id);
  console.log('   Name:', groveHouse.name);
  console.log('   URN:', groveHouse.urn);
  console.log('   Type:', groveHouse.organization_type, '\n');

  // 3. Simulate what the profile API does when impersonateOrgId is provided
  console.log('=== Simulating Profile API Call with Impersonation ===\n');
  console.log('Request payload:');
  console.log({
    userId: userData.id,
    email: userData.email,
    displayName: 'Super Admin',
    impersonateOrgId: groveHouseId
  });
  console.log();

  // This is exactly what the profile API does:
  const impersonateOrgId = groveHouseId;
  const userId = userData.id;

  // Step 1: Check if super admin
  let isSuperAdmin = false;
  const { data: superAdminCheck2 } = await supabase
    .from('super_admins')
    .select('access_level')
    .eq('user_id', userId)
    .maybeSingle();

  isSuperAdmin = !!superAdminCheck2;
  console.log('✅ Super admin check:', isSuperAdmin);

  // Step 2: If impersonating (and super admin), fetch that org directly
  if (isSuperAdmin && impersonateOrgId) {
    console.log('✅ Impersonation active, fetching org directly:', impersonateOrgId);

    const { data: impersonatedOrg } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', impersonateOrgId)
      .single();

    if (impersonatedOrg) {
      console.log('\n✅ SUCCESS - Organization data returned:');
      console.log({
        user: {
          id: userId,
          email: userData.email,
          displayName: 'Super Admin'
        },
        organization: {
          id: impersonatedOrg.id,
          name: impersonatedOrg.name,
          role: 'admin', // Super admins get admin role when impersonating
          organization_type: impersonatedOrg.organization_type
        }
      });

      console.log('\n=== Expected Behavior ===');
      console.log('1. User clicks "View as School" for Grove House');
      console.log('2. sessionStorage.impersonateOrgId =', groveHouseId);
      console.log('3. Custom event dispatched');
      console.log('4. Auth context refetches organization');
      console.log('5. Profile API returns Grove House (not Aurora)');
      console.log('6. Dashboard shows Grove House data');
    } else {
      console.error('❌ Failed to fetch impersonated organization');
    }
  }

  console.log('\n=== Test Complete ===\n');
})();
