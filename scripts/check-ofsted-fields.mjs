/**
 * Check what Ofsted data exists in the schools table
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOfstedFields() {
  console.log('=== CHECKING OFSTED FIELDS IN SCHOOLS TABLE ===\n');

  // 1. Get schools with non-null inspectorate_name
  const { data: withInspectorate, error } = await supabase
    .from('schools')
    .select('urn, name, inspectorate_name, date_of_last_inspection, next_inspection_date')
    .not('inspectorate_name', 'is', null)
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${withInspectorate.length} schools with inspectorate_name:\n`);

  // Group by inspectorate_name values
  const byInspectorate = {};
  for (const s of withInspectorate) {
    if (!byInspectorate[s.inspectorate_name]) {
      byInspectorate[s.inspectorate_name] = [];
    }
    byInspectorate[s.inspectorate_name].push(s);
  }

  console.log('--- Unique inspectorate_name values ---');
  for (const [name, schools] of Object.entries(byInspectorate)) {
    console.log(`\n"${name}" (${schools.length} schools):`);
    console.log('  Example:', schools[0].name, '| Last inspection:', schools[0].date_of_last_inspection);
  }

  // 2. Check Bradford schools specifically for Ofsted data
  console.log('\n\n=== BRADFORD SCHOOLS OFSTED DATA ===\n');

  const { data: bradfordWithOfsted } = await supabase
    .from('schools')
    .select('urn, name, inspectorate_name, date_of_last_inspection, next_inspection_date')
    .eq('la_name', 'Bradford')
    .eq('phase_name', 'Primary')
    .not('inspectorate_name', 'is', null)
    .order('name');

  console.log(`Bradford primary schools with inspectorate_name: ${bradfordWithOfsted?.length || 0}\n`);

  if (bradfordWithOfsted && bradfordWithOfsted.length > 0) {
    for (const s of bradfordWithOfsted.slice(0, 20)) {
      console.log(`${s.name}`);
      console.log(`  Inspectorate: ${s.inspectorate_name}`);
      console.log(`  Last inspection: ${s.date_of_last_inspection || 'N/A'}`);
      console.log(`  Next inspection: ${s.next_inspection_date || 'N/A'}`);
      console.log('');
    }
  }

  // 3. Count how many have actual data
  const { count: totalBradford } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('la_name', 'Bradford')
    .eq('phase_name', 'Primary');

  const { count: withInspectorateCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('la_name', 'Bradford')
    .eq('phase_name', 'Primary')
    .not('inspectorate_name', 'is', null);

  const { count: withInspectionDate } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('la_name', 'Bradford')
    .eq('phase_name', 'Primary')
    .not('date_of_last_inspection', 'is', null);

  console.log('\n=== SUMMARY FOR BRADFORD PRIMARY ===');
  console.log(`Total schools: ${totalBradford}`);
  console.log(`With inspectorate_name: ${withInspectorateCount}`);
  console.log(`With inspection date: ${withInspectionDate}`);
}

checkOfstedFields().catch(console.error);
