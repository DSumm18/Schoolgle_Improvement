/**
 * Check if user is in organization_members
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrgMembership() {
  console.log('=== Checking Grove House Organization Members ===\n');

  // Get Grove House org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%Grove House%');

  const org = orgs[0];
  const orgId = org.id;
  console.log(`Organization: ${org.name}\n`);

  // Check organization_members
  const { data: members } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', orgId);

  console.log(`Organization members: ${members?.length || 0}`);
  if (members && members.length > 0) {
    console.log('\nMembers:');
    members.forEach(m => {
      console.log(`  • ${m.role} - user_id: ${m.user_id}`);
    });
  }

  // Check all users in Grove House (via user_orgs if exists)
  console.log('\n--- Checking user_orgs ---');
  const { data: userOrgs, error: userOrgsError } = await supabase
    .from('user_orgs')
    .select('*')
    .eq('organization_id', orgId);

  if (userOrgsError) {
    console.log(`user_orgs table doesn't exist or error: ${userOrgsError.message}`);
  } else {
    console.log(`user_orgs: ${userOrgs?.length || 0} records`);
    if (userOrgs && userOrgs.length > 0) {
      userOrgs.forEach(uo => {
        console.log(`  • user_id: ${uo.user_id}`);
      });
    }
  }
}

checkOrgMembership().catch(console.error);
