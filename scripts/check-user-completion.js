const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserCompletion() {
  console.log('🔍 Checking for recent completions...\n');

  // First, get ALL users with this email
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@schoolgle.co.uk');

  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message);
    return;
  }

  console.log(`✅ Found ${users.length} user(s) with email admin@schoolgle.co.uk:\n`);
  users.forEach((u, i) => {
    console.log(`   [${i + 1}] Auth ID: ${u.auth_id || 'NULL'}`);
    console.log('       Display Name:', u.display_name);
    console.log('       Created At:', u.created_at);
    console.log('');
  });

  // Filter out null auth_ids
  const authIds = users.map(u => u.auth_id).filter(id => id !== null);
  console.log(`   Valid Auth IDs to check: ${authIds.length}\n`);

  // Check for recent completions (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  console.log('🔍 Checking for completions in the last 24 hours...\n');

  const { data: recentCompletions, error: recentError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false });

  if (recentError) {
    console.log('❌ Error fetching recent completions:', recentError.message);
    return;
  }

  console.log(`✅ Found ${recentCompletions.length} recent completion(s):\n`);

  if (recentCompletions.length === 0) {
    console.log('   ❌ No completions in the last 24 hours.');
    console.log('   This means your recent click was NOT saved to the database!\n');
  } else {
    recentCompletions.forEach((c, i) => {
      const isThisUser = authIds.includes(c.completed_by);
      console.log(`   [${i + 1}] ${c.check_id}`);
      console.log('       Domain:', c.compliance_domain);
      console.log('       Status:', c.status);
      console.log('       Completed At:', c.completed_at);
      console.log('       Completed By:', c.completed_by, isThisUser ? '✅ YOU' : '❌ NOT YOU');
      console.log('       Created At:', c.created_at);
      console.log('');
    });
  }

  // Check ALL completions by these users (only if we have valid auth_ids)
  if (authIds.length > 0) {
    console.log('🔍 Checking for ALL completions by these users...\n');

    const { data: userCompletions, error: userCompError } = await supabase
      .from('estates_statutory_completions')
      .select('*')
      .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
      .in('completed_by', authIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (userCompError) {
      console.log('❌ Error fetching user completions:', userCompError.message);
    } else {
      console.log(`✅ Found ${userCompletions.length} completion(s) by you:\n`);

      if (userCompletions.length === 0) {
        console.log('   ❌ No completions found by you in the database!');
        console.log('   This confirms the completion was NOT saved.\n');
      } else {
        userCompletions.forEach((c, i) => {
          console.log(`   [${i + 1}] ${c.check_id}`);
          console.log('       Domain:', c.compliance_domain);
          console.log('       Status:', c.status);
          console.log('       Completed At:', c.completed_at);
          console.log('       RAG Status:', c.rag_status);
          console.log('       Created At:', c.created_at);
          console.log('');
        });
      }
    }
  } else {
    console.log('❌ No valid Auth IDs found - cannot check for user completions\n');
  }

  // Check specifically for weekly flushing
  console.log('🔍 Checking specifically for Weekly Flushing completions...\n');

  const { data: flushCompletions, error: flushError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .or('check_id.eq.leg_weekly_flush,check_id.eq.legionella_weekly_flushing')
    .order('created_at', { ascending: false });

  if (flushError) {
    console.log('❌ Error:', flushError.message);
  } else {
    console.log(`✅ Found ${flushCompletions.length} Weekly Flushing completion(s):\n`);
    if (flushCompletions.length === 0) {
      console.log('   ❌ No Weekly Flushing completions found.\n');
    } else {
      flushCompletions.forEach((c, i) => {
        const isThisUser = authIds.includes(c.completed_by);
        console.log(`   [${i + 1}] Check ID: ${c.check_id}`);
        console.log('       Status:', c.status);
        console.log('       Completed At:', c.completed_at);
        console.log('       Completed By:', c.completed_by, isThisUser ? '✅ YOU' : '❌ NOT YOU');
        console.log('       Created At:', c.created_at);
        console.log('');
      });
    }
  }
}

checkUserCompletion().catch(console.error);
