const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const groveHouseId = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

  // 1. Check if there's a subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', groveHouseId)
    .maybeSingle();

  console.log('Subscription status:', sub ? 'Found' : 'None - needs setup');

  // 2. Check members
  const { data: members } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', groveHouseId);

  console.log('Members:', members?.length || 0);

  // 3. Create a basic subscription so it can be used
  if (!sub) {
    console.log('Creating basic subscription...');
    const { data: newSub, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: groveHouseId,
        plan: 'core',
        status: 'trialing',
        trial_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'invoice',
        user_limit: 10,
        enabled_modules: [
          'ofsted-readiness',
          'estates-compliance',
          'hr-people',
          'governance',
          'actions-hub'
        ],
        auto_renew: false
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription error:', subError.message);
    } else {
      console.log('Subscription created - 90 day trial');
    }
  }

  // 4. Summary
  console.log('');
  console.log('GROVE HOUSE PRIMARY SCHOOL READY:');
  console.log('ID:', groveHouseId);
  console.log('Name: Grove House Primary School');
  console.log('URN: 148201');
  console.log('Phase: Primary');
  console.log('Type: Academy converter');
  console.log('Town: Bradford');
  console.log('Postcode: BD2 4ED');
  console.log('Pupils: 417');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('1. Go to http://localhost:3000/admin/super');
  console.log('2. Find Grove House Primary School');
  console.log('3. Click "View as School" button');
  console.log('4. Configure settings, connect Drive, upload data');
})();
