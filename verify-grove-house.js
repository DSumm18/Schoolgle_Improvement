/**
 * Final verification that Grove House Primary School is ready to use
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Grove House Primary School - Final Verification ===\n');

  const groveHouseId = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

  // 1. Check organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', groveHouseId)
    .single();

  if (!org) {
    console.error('❌ Organization not found');
    return;
  }

  console.log('✅ Organization:');
  console.log('  Name:', org.name);
  console.log('  URN:', org.urn);
  console.log('  Type:', org.school_type);
  console.log('  Address:', org.address?.town, org.address?.postcode);
  console.log('  Pupils:', org.settings?.pupil_count);

  // 2. Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', groveHouseId)
    .maybeSingle();

  if (!sub) {
    console.error('❌ No subscription found');
    return;
  }

  console.log('\n✅ Subscription:');
  console.log('  Product:', sub.product);
  console.log('  Status:', sub.status);
  console.log('  Trial Ends:', new Date(sub.trial_end).toLocaleDateString());
  console.log('  User Limit:', sub.user_limit);
  console.log('  Modules:', sub.enabled_modules?.join(', '));

  // 3. Check members
  const { data: members } = await supabase
    .from('organization_members')
    .select('role, users(email, display_name)')
    .eq('organization_id', groveHouseId);

  console.log('\n✅ Members:', members?.length || 0);

  if (members && members.length > 0) {
    members.forEach(m => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      console.log(`  - ${user?.display_name || user?.email || 'Unknown'} (${m.role})`);
    });
  } else {
    console.log('  (No members yet - super admin can impersonate without being a member)');
  }

  // 4. Test super admin impersonation
  console.log('\n=== Super Admin Impersonation Test ===\n');

  const { data: adminUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'admin@schoolgle.co.uk')
    .maybeSingle();

  if (adminUser) {
    const { data: isAdmin } = await supabase
      .from('super_admins')
      .select('access_level')
      .eq('user_id', adminUser.id)
      .maybeSingle();

    if (isAdmin) {
      console.log('✅ admin@schoolgle.co.uk is a super admin');
      console.log('✅ Can impersonate Grove House via "View as School" button');
      console.log('\n🎯 READY TO USE!');
    } else {
      console.log('⚠️  admin@schoolgle.co.uk is not a super admin');
    }
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Go to: http://localhost:3000/admin/super');
  console.log('3. Search for "Grove House" or URN "148201"');
  console.log('4. Click "View as School" button');
  console.log('5. Configure Google Drive connection');
  console.log('6. Upload census data, site plans, etc.');
  console.log('');
})();
