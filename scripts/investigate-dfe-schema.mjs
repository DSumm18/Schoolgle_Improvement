/**
 * Thorough investigation of DfE data schema
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

async function investigate() {
  console.log('=== THOROUGH DFE SCHEMA INVESTIGATION ===\n');

  // 1. Get ALL tables in public schema (including views)
  console.log('--- 1. ALL tables/views in public schema ---');
  const { data: publicTables, error: publicError } = await supabase
    .rpc('get_tables_in_schema', { schema_name: 'public' });

  if (!publicError && publicTables) {
    console.log('Found', publicTables.length, 'tables/views in public schema');
    const relevant = publicTables.filter(t =>
      t.table_name.includes('school') ||
      t.table_name.includes('ofsted') ||
      t.table_name.includes('dfe') ||
      t.table_name.includes('inspection') ||
      t.table_name.includes('gias')
    );
    console.log('Relevant tables:', relevant.map(t => t.table_name).join(', '));
  }

  // 2. Check for ofsted-related tables
  console.log('\n--- 2. Checking for Ofsted-related tables ---');
  const ofstedLikely = ['ofsted_inspections', 'ofsted_ratings', 'ofsted_data', 'inspections', 'school_inspections'];

  for (const tableName of ofstedLikely) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`✅ FOUND: ${tableName}`);
      console.log('   Sample:', data);
    }
  }

  // 3. Sample from schools to see ALL columns
  console.log('\n--- 3. ALL columns in schools table ---');
  const { data: schoolSample } = await supabase
    .from('schools')
    .select('*')
    .limit(1);

  if (schoolSample && schoolSample.length > 0) {
    console.log('Columns in schools table:');
    console.log(Object.keys(schoolSample[0]).join('\n'));
  }

  // 4. Check CSV data source references
  console.log('\n--- 4. Checking for CSV data files ---');
  const fs = (await import('fs'));
  const dataDir = resolve(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    const ofstedFiles = files.filter(f =>
      f.toLowerCase().includes('ofsted') ||
      f.toLowerCase().includes('inspection')
    );
    console.log('Ofsted/inspection CSV files in data/:', ofstedFiles);
  }

  // 5. Check migrations for any dfe_data schema creation
  console.log('\n--- 5. Checking for DFE schema references ---');
  const { execSync } = await import('child_process');
  try {
    const grepResult = execSync('grep -r "dfe_data" apps/platform/supabase/migrations/ --include="*.sql" | head -30', {
      cwd: process.cwd(),
      encoding: 'utf-8'
    });
    console.log(grepResult);
  } catch (e) {
    console.log('No dfe_data references found in migrations');
  }

  // 6. Look for any tables with 'inspection' or 'rating' in the name
  console.log('\n--- 6. Checking Supabase for inspection/rating tables ---');
  // Try direct SQL via REST
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (response.ok) {
    const schemaInfo = await response.json();
    console.log('Available schemas/tables via REST:', schemaInfo);
  }
}

investigate().catch(console.error);
