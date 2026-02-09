/**
 * Check for weekly flushing completion
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkWeeklyFlushing() {
  console.log('🔍 Checking for Weekly Outlet Flushing (leg_weekly_flush) completion...\n');

  // Get all completions for this check
  const { data: completions, error } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
    .eq('check_id', 'leg_weekly_flush')
    .order('completed_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!completions || completions.length === 0) {
    console.log('❌ No Weekly Outlet Flushing completions found in database.');
    console.log('\nThis means:');
    console.log('1. The completion was not saved to the database');
    console.log('2. OR the check ID in the completion form does not match');
    console.log('\nLet me check what check IDs were used...');

    // Check all Legionella completions
    const { data: allLegionella } = await supabase
      .from('estates_statutory_completions')
      .select('check_id, status, completed_at')
      .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083')
      .eq('compliance_domain', 'legionella');

    console.log('\n📋 All Legionella check IDs in database:');
    allLegionella?.forEach(c => {
      console.log(`   - ${c.check_id} (${c.status}, ${c.completed_at})`);
    });

    return;
  }

  console.log(`✅ Found ${completions.length} Weekly Outlet Flushing completion(s):\n`);

  completions.forEach((completion, index) => {
    console.log(`${index + 1}. ID: ${completion.id}`);
    console.log(`   Status: ${completion.status}`);
    console.log(`   Completed At: ${completion.completed_at || 'Not completed'}`);
    console.log(`   Completed By: ${completion.completed_by}`);
    console.log(`   Next Due: ${completion.next_due_date}`);
    console.log(`   RAG Status: ${completion.rag_status}`);
    console.log(`   Notes: ${completion.completion_notes || 'None'}`);
    console.log(`   Created: ${completion.created_at}`);
    console.log('');
  });

  // Check if any completion was in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = completions.filter(c => c.completed_at && c.completed_at >= yesterday);

  if (recent.length > 0) {
    console.log(`✅ YES! Recent completion found (last 24 hours)`);
    recent.forEach(r => {
      console.log(`   - Completed at: ${r.completed_at}`);
      console.log(`   - By user: ${r.completed_by}`);
    });
  } else {
    console.log(`ℹ️  No completions in the last 24 hours`);
  }
}

checkWeeklyFlushing().catch(console.error);
