/**
 * Add current user to Grove House organization_members
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addUserToOrg() {
  console.log('=== Adding User to Organization ===\n');

  // Get Grove House org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%Grove House%');

  const org = orgs[0];
  const orgId = org.id;

  console.log(`Organization: ${org.name} (ID: ${orgId})`);
  console.log(`Admin member user_id: f1e52c47-64b7-4b63-8b2e-3803df700191`);
  console.log(`\nAdding this user to organization_members...`);

  // Get all users to see what's available
  const { data: users } = await supabase
    .from('users')
    .select('id, email, created_at')
    .order('created_at')
    .limit(10);

  console.log('\nAvailable users:');
  if (users) {
    users.forEach(u => {
      console.log(`  • ${u.email} (${u.id})`);
    });
  }

  // Add the admin user (already there, so this would be upsert)
  // The issue is that we need to know YOUR user_id

  // Check if there are other users
  console.log(`\nYou need to match your user_id in your browser session.`);
  console.log(`Open browser console (F12) and run: localStorage.getItem('supabase.auth.token')`);
  console.log(`This will show your auth data including user_id.`);
}

addUserToOrg().catch(console.error);
