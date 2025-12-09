import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const SUPABASE_URL = process.env.DFE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;

// SQL statements to execute (one at a time)
const sqlStatements = [
  `CREATE OR REPLACE VIEW public.schools AS SELECT * FROM dfe_data.schools;`,
  `CREATE OR REPLACE VIEW public.area_demographics AS SELECT * FROM dfe_data.area_demographics;`,
  `CREATE OR REPLACE VIEW public.local_authority_finance AS SELECT * FROM dfe_data.local_authority_finance;`,
  `CREATE OR REPLACE VIEW public.school_area_links AS SELECT * FROM dfe_data.school_area_links;`,
  `GRANT SELECT ON public.schools TO service_role, anon;`,
  `GRANT SELECT ON public.area_demographics TO service_role, anon;`,
  `GRANT SELECT ON public.local_authority_finance TO service_role, anon;`,
  `GRANT SELECT ON public.school_area_links TO service_role, anon;`
];

console.log('🔧 Creating views in public schema...\n');
console.log(`Connecting to: ${SUPABASE_URL}\n`);

async function executeSQL(sql) {
  // Try using Supabase Management API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/vnd.pgjson.object+json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

// Since we can't execute SQL directly via REST API easily,
// Let's provide clear instructions and the SQL to run
console.log('📝 SQL Execution Required\n');
console.log('Supabase REST API doesn\'t support direct SQL execution.');
console.log('Please run the SQL manually in Supabase SQL Editor:\n');
console.log('─'.repeat(70));
console.log('STEP 1: Go to Supabase Dashboard');
console.log(`   URL: ${SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/').split('.supabase.co')[0]}`);
console.log('\nSTEP 2: Navigate to SQL Editor (left sidebar)');
console.log('\nSTEP 3: Copy and paste this SQL:\n');

const fullSQL = `-- Create views in public schema pointing to dfe_data tables

-- Schools view
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

-- Area demographics view
CREATE OR REPLACE VIEW public.area_demographics AS 
SELECT * FROM dfe_data.area_demographics;

-- Local authority finance view
CREATE OR REPLACE VIEW public.local_authority_finance AS 
SELECT * FROM dfe_data.local_authority_finance;

-- School area links view
CREATE OR REPLACE VIEW public.school_area_links AS 
SELECT * FROM dfe_data.school_area_links;

-- Grant permissions
GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.area_demographics TO service_role;
GRANT SELECT ON public.area_demographics TO anon;
GRANT SELECT ON public.local_authority_finance TO service_role;
GRANT SELECT ON public.local_authority_finance TO anon;
GRANT SELECT ON public.school_area_links TO service_role;
GRANT SELECT ON public.school_area_links TO anon;`;

console.log(fullSQL);
console.log('\n' + '─'.repeat(70));
console.log('\nSTEP 4: Click "Run" to execute\n');

// Also save to a file for easy copy-paste
import { writeFileSync } from 'fs';
const outputPath = join(__dirname, '..', 'RUN_THIS_SQL.sql');
writeFileSync(outputPath, fullSQL);
console.log(`✅ SQL saved to: ${outputPath}`);
console.log('   You can copy this file and paste into Supabase SQL Editor\n');

console.log('💡 After running the SQL, test the connection with:');
console.log('   node scripts/test-dfe-connection-simple.mjs\n');

