/**
 * Check ALL recent completions to see what was saved
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAllRecent() {
  console.log('🔍 Checking ALL recent completions...\n');

  // Get ALL completions for Aurora Academy, sorted by created date
  const { data: completions, error } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${completions.length} total completions\n`);

  console.log('All completions (newest first):');
  console.log('='.repeat(80));

  completions.forEach((c, index) => {
    const isRecent = c.created_at && new Date(c.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    const marker = isRecent ? '🆕' : '  ';
    console.log(`${marker} ${index + 1}. ${c.compliance_domain}/${c.check_id}`);
    console.log(`     Status: ${c.status}`);
    console.log(`     Created: ${c.created_at}`);
    console.log(`     Completed: ${c.completed_at || 'Not completed'}`);
    console.log(`     Completed By: ${c.completed_by}`);
    console.log('');
  });

  // Check for any with "weekly" or "flush" in the check ID
  console.log('\n🔍 Searching for any checks with "weekly" or "flush" in the ID...');
  const weeklyFlush = completions.filter(c =>
    c.check_id.toLowerCase().includes('weekly') ||
    c.check_id.toLowerCase().includes('flush')
  );

  if (weeklyFlush.length > 0) {
    console.log(`✅ Found ${weeklyFlush.length} matching checks:`);
    weeklyFlush.forEach(c => {
      console.log(`   - ${c.check_id} (${c.status}, ${c.completed_at})`);
    });
  } else {
    console.log('❌ No checks with "weekly" or "flush" found');
  }
}

checkAllRecent().catch(console.error);
