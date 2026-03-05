/**
 * Simple Database Query Script
 * Uses Supabase client to query the database directly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function queryDatabase() {
  console.log('🔍 Querying Supabase database...\n');

  // 1. Check if estates_statutory_completions table exists
  console.log('1. Checking estates_statutory_completions table...');
  const { data: completions, error: completionsError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .limit(5);

  if (completionsError) {
    console.log('❌ Table not found or error:', completionsError.message);
  } else {
    console.log(`✅ Found ${completions.length} completions`);
    if (completions.length > 0) {
      console.log('Sample:', JSON.stringify(completions[0], null, 2));
    }
  }

  // 2. Query for user's Legionella completion
  console.log('\n2. Searching for Legionella completions for admin@schoolgle.co.uk...');

  // First get the user's auth_id (use .maybeSingle() instead of .single())
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@schoolgle.co.uk');

  if (usersError || !users || users.length === 0) {
    console.log('❌ User not found:', usersError?.message || 'Unknown error');
  } else {
    const user = users[0];
    console.log(`✅ User found: ${user.email} (auth_id: ${user.auth_id})`);

    // Get organization info
    const { data: orgs, error: orgError } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('auth_id', user.auth_id);

    if (orgError || !orgs || orgs.length === 0) {
      console.log('⚠️  Organization not found for user, using default Aurora Academy');
    } else {
      const org = orgs[0];
      console.log(`✅ Organization: ${org.organizations?.name || 'Unknown'} (ID: ${org.organization_id})`);
    }
  }

  // Query for Legionella completions for Aurora Academy
  const { data: legionellaCompletions, error: legionellaError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083') // Aurora Academy
    .eq('compliance_domain', 'legionella')
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(10);

  if (legionellaError) {
    console.log('❌ Error querying completions:', legionellaError.message);
  } else {
    console.log(`\n✅ Found ${legionellaCompletions.length} Legionella checks (all statuses):\n`);

    if (legionellaCompletions.length === 0) {
      console.log('⚠️  No Legionella checks found yet.');
    } else {
      legionellaCompletions.forEach((completion, index) => {
        console.log(`${index + 1}. Check ID: ${completion.check_id}`);
        console.log(`   Status: ${completion.status}`);
        console.log(`   Completed: ${completion.completed_at || 'Not yet completed'}`);
        console.log(`   Completed By: ${completion.completed_by || 'N/A'}`);
        console.log(`   Next Due: ${completion.next_due_date}`);
        console.log(`   RAG Status: ${completion.rag_status}`);
        console.log(`   Evidence: ${completion.evidence_ids?.length || 0} files`);
        console.log(`   Created: ${completion.created_at}`);
        console.log('');
      });
    }
  }

  // 2b. Also check for recent completions (last 24 hours)
  console.log('2b. Checking for completions in the last 24 hours...');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentCompletions, error: recentError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .gte('completed_at', yesterday)
    .order('completed_at', { ascending: false });

  if (recentError) {
    console.log('❌ Error querying recent completions:', recentError.message);
  } else if (recentCompletions && recentCompletions.length > 0) {
    console.log(`✅ Found ${recentCompletions.length} recent completions:\n`);
    recentCompletions.forEach((completion) => {
      console.log(`   - ${completion.compliance_domain}/${completion.check_id}`);
      console.log(`     Status: ${completion.status}, Completed: ${completion.completed_at}`);
    });
    console.log('');
  } else {
    console.log('ℹ️  No completions in the last 24 hours\n');
  }

  // 3. Check all estates compliance tables
  console.log('\n3. Checking all estates compliance tables...');

  const tables = [
    'estates_statutory_completions',
    'estates_assets',
    'estates_contractors',
    'estates_helpdesk_tickets',
    'estates_custom_checks'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${table}: ${error.message.substring(0, 50)}`);
    } else {
      console.log(`   ✅ ${table}: ${count || 0} records`);
    }
  }

  console.log('\n✅ Query complete!');
}

// Run the query
queryDatabase().catch(console.error);
