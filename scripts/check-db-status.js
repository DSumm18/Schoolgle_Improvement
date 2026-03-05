const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ygquvauptwyvlhkyxkwy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA'
);

(async () => {
  console.log('Schoolgle Database Status Check\n');
  console.log('================================\n');

  // Get user info
  console.log('1. USER DATA for admin@schoolgle.co.uk:');
  console.log('--------------------------------------');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@schoolgle.co.uk');

  if (!usersError && users && users.length > 0) {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((u, i) => {
      console.log(`   [User ${i + 1}]`);
      console.log('   Auth ID:', u.auth_id || 'NULL');
      console.log('   Display Name:', u.display_name || 'NULL');
      console.log('   Created At:', u.created_at);
      console.log('');
    });
  } else {
    console.log('   No users found or error:', usersError?.message);
    console.log('');
  }

  // Try to query completions table
  console.log('2. COMPLETIONS TABLE STATUS:');
  console.log('----------------------------');
  const { data: completions, error: compError } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .order('created_at', { ascending: false })
    .limit(10);

  if (compError) {
    console.log('   ❌ ERROR:', compError.message);
    console.log('   ⚠️  This means the table "estates_statutory_completions" does NOT exist!');
    console.log('   ⚠️  The table needs to be created in Supabase.\n');
  } else {
    console.log(`   ✅ Found ${completions.length} completion(s):\n`);
    completions.forEach((c, i) => {
      console.log(`   [${i + 1}] Check: ${c.check_id}`);
      console.log('       Domain:', c.compliance_domain);
      console.log('       Status:', c.status);
      console.log('       Completed By:', c.completed_by);
      console.log('       Created At:', c.created_at);
      console.log('');
    });
  }

  // Summary
  console.log('================================');
  console.log('SUMMARY:');
  console.log('================================');
  if (compError) {
    console.log('❌ The estates_statutory_completions table is MISSING!');
    console.log('❌ This is why completions are not being saved.');
    console.log('');
    console.log('ACTION REQUIRED:');
    console.log('1. Go to Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration to create the table');
  } else {
    console.log('✅ Database is working correctly');
  }
})();
