/**
 * Debug the all-pupils API
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllPupilsAPI() {
  console.log('=== Debugging all-pupils API ===\n');

  // Get Grove House org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%Grove House%');

  if (!orgs || orgs.length === 0) {
    console.log('❌ No Grove House organization found');
    return;
  }

  const org = orgs[0];
  const orgId = org.id;
  console.log(`✅ Organization: ${org.name} (ID: ${orgId})\n`);

  // Try to query ls_pupils directly
  console.log('--- Querying ls_pupils directly ---');
  const { data: pupils, error: pupilsError } = await supabase
    .from('ls_pupils')
    .select('*')
    .eq('organization_id', orgId)
    .limit(5);

  if (pupilsError) {
    console.log(`❌ Error: ${pupilsError.message}`);
    console.log(`   Details:`, pupilsError);
  } else {
    console.log(`✅ Found ${pupils?.length || 0} pupils`);
    if (pupils && pupils.length > 0) {
      pupils.forEach(p => {
        console.log(`  • ${p.display_name_encrypted} (${p.year_group})`);
      });
    }
  }

  // Count total
  const { count } = await supabase
    .from('ls_pupils')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  console.log(`\nTotal count: ${count}`);
}

debugAllPupilsAPI().catch(console.error);
