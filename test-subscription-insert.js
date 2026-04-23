/**
 * Test creating a subscription with minimal fields
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Testing Subscription Insert ===\n');

  const groveHouseId = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

  // Try with the actual required fields based on the error
  console.log('Attempting to create subscription with required fields...');

  const testSub = {
    organization_id: groveHouseId,
    product: 'bundle', // Required field
    status: 'trialing',
    current_period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    trial_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };

  console.log('Insert data:', JSON.stringify(testSub, null, 2));

  const { data: newSub, error: subError } = await supabase
    .from('subscriptions')
    .insert(testSub)
    .select()
    .maybeSingle();

  if (subError) {
    console.error('\n❌ Subscription insert failed:');
    console.error('Error:', subError.message);
    console.error('Details:', subError);
    console.error('\nHints:', subError.hints);
  } else {
    console.log('\n✅ SUCCESS - Subscription created:');
    console.log(JSON.stringify(newSub, null, 2));
  }
})();
