/**
 * Check the actual schema of the subscriptions table
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Checking Subscriptions Table Schema ===\n');

  // Try to query the table to see what columns exist
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying subscriptions:', error.message);
    console.error('This suggests the table might not exist or has RLS issues\n');
    return;
  }

  if (subscriptions && subscriptions.length > 0) {
    console.log('✅ Subscriptions table exists. Sample record:');
    console.log(JSON.stringify(subscriptions[0], null, 2));
  } else {
    console.log('✅ Subscriptions table exists but is empty');
  }

  // Check if there's a subscription for Grove House
  const groveHouseId = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';
  const { data: groveSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', groveHouseId)
    .maybeSingle();

  if (groveSub) {
    console.log('\n✅ Grove House has a subscription:');
    console.log('  Plan:', groveSub.plan_id || groveSub.plan || 'N/A');
    console.log('  Status:', groveSub.status);
    console.log('  Trial End:', groveSub.trial_end);
  } else {
    console.log('\n⚠️  Grove House does not have a subscription');
  }
})();
