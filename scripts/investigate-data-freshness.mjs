/**
 * Investigate data freshness - why is headteacher data stale?
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env
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

async function investigateDataFreshness() {
  console.log('=== INVESTIGATING DATA FRESHNESS ===\n');

  // 1. Check when the schools table was last updated
  console.log('--- 1. Schools table freshness ---');
  const { data: schools } = await supabase
    .from('schools')
    .select('name, created_at, updated_at')
    .in('name', [
      'Crossley Hall Primary School',
      'Peel Park Primary School and Nursery',
      'Blakehill Primary School'
    ]);

  for (const s of schools) {
    console.log(`${s.name}:`);
    console.log(`  created_at: ${s.created_at}`);
    console.log(`  updated_at: ${s.updated_at}`);
  }

  // 2. Check Crossley Hall specifically
  console.log('\n--- 2. Crossley Hall Primary School details ---');
  const { data: crossley } = await supabase
    .from('schools')
    .select('*')
    .eq('name', 'Crossley Hall Primary School')
    .single();

  if (crossley) {
    console.log(`Name: ${crossley.name}`);
    console.log(`URN: ${crossley.urn}`);
    console.log(`Headteacher (from DB): ${crossley.head_title} ${crossley.head_first_name} ${crossley.head_last_name}`);
    console.log(`Telephone: ${crossley.telephone}`);
    console.log(`Record created: ${crossley.created_at}`);
    console.log(`Record updated: ${crossley.updated_at}`);
  }

  // 3. Check if school_profiles has fresher data
  console.log('\n--- 3. Checking school_profiles table ---');

  // First, check if the table exists and has data
  const { data: profileSample, error: profileError } = await supabase
    .schema('dfe_data')
    .from('school_profiles')
    .select('*')
    .limit(1);

  if (profileError) {
    console.log('school_profiles table not accessible:', profileError.message);
  } else {
    console.log('school_profiles table IS accessible');
    console.log('Sample columns:', Object.keys(profileSample[0] || {}).join(', '));
  }

  // 4. Check dfe-data-sources.ts for last update info
  console.log('\n--- 4. Data source freshness from dfe-data-sources.ts ---');
  const sourcesFile = readFileSync('apps/platform/src/data/dfe-data-sources.ts', 'utf-8');
  const schoolSourceMatch = sourcesFile.match(/id: "schools".*?lastIngested: "([^"]+)"/s);
  if (schoolSourceMatch) {
    console.log(`Schools data last ingested: ${schoolSourceMatch[1]}`);
  }

  // 5. Count how many schools have headteacher data
  console.log('\n--- 5. Headteacher data coverage ---');
  const { count: totalSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true });

  const { count: withHeadteacher } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .not('head_last_name', 'is', null);

  console.log(`Total schools: ${totalSchools}`);
  console.log(`With headteacher: ${withHeadteacher} (${((withHeadteacher/totalSchools)*100).toFixed(1)}%)`);

  // 6. Check if there's a newer GIAS export to re-import
  console.log('\n--- 6. Check for GIAS import scripts ---');
  const { execSync } = await import('child_process');
  try {
    const importScripts = execSync('find . -name "*gias*" -o -name "*import*school*" -o -name "*school*import*" 2>/dev/null | grep -E "\\.(sh|mjs|ts|js)$" | head -10', {
      cwd: process.cwd(),
      encoding: 'utf-8'
    });
    console.log('Import scripts found:\n', importScripts || 'None');
  } catch (e) {
    console.log('No import scripts found');
  }

  // 7. Check the actual source GIAS data for headteacher info
  console.log('\n--- 7. Checking what GIAS actually says ---');
  const { parse } = await import('csv-parse/sync');
  const csvContent = readFileSync('./five-year-ofsted-inspection-data_state-funded-schools.csv', 'utf-8');
  const COLUMNS = ['URN', 'Name', 'PublishDate', 'PublicationType', 'Remit', 'AsAtDate', 'PublishedDate', 'Region', 'LAArea', 'Constituency', 'Postcode', 'ProviderType', 'ProvisionType', 'Phase', 'DeprivationBand', 'OverallEffectiveness', 'CategoryOfConcern', 'Leadership', 'QualityOfEducation', 'PersonalDevelopment', 'Behaviour', 'Safeguarding', 'EarlyYears', 'SixthForm', 'URNMatch'];
  const records = parse(csvContent, { columns: COLUMNS, from_line: 4, skip_empty_lines: true, relax_column_count: true });

  // Note: Ofsted CSV doesn't have headteacher data - it's inspection outcomes only
  console.log('Note: The five-year Ofsted CSV contains inspection outcomes, not headteacher data');
  console.log('We need the GIAS establishments export for headteacher info');
}

investigateDataFreshness().catch(console.error);
