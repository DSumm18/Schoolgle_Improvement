import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking which tables exist in dfe_data schema...\n');

// Query to get all tables in dfe_data schema
const checkTablesSQL = `
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'dfe_data'
ORDER BY table_name;
`;

try {
  // Use REST API to query information_schema
  const response = await fetch(
    `${process.env.DFE_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: checkTablesSQL })
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Tables found in dfe_data schema:');
    (data || []).forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
  } else {
    // Alternative: Try to query each table directly
    console.log('⚠️  Could not query schema directly. Testing tables individually...\n');
    
    const tablesToTest = [
      'schools',
      'area_demographics',
      'local_authority_finance',
      'school_area_links',
      'ks2_results',
      'ks1_results',
      'ks4_results',
      'workforce',
      'census',
      'attendance',
      'exclusions'
    ];

    const existingTables = [];

    for (const table of tablesToTest) {
      try {
        // Try to query the table via REST API with schema prefix
        const testResponse = await fetch(
          `${process.env.DFE_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
          {
            headers: {
              'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY}`,
              'Accept': 'application/vnd.pgjson.object+json'
            }
          }
        );

        if (testResponse.ok) {
          existingTables.push(table);
          console.log(`✅ ${table} - EXISTS`);
        } else {
          console.log(`❌ ${table} - NOT FOUND`);
        }
      } catch (error) {
        console.log(`❌ ${table} - ERROR: ${error.message}`);
      }
    }

    console.log('\n📋 Summary:');
    console.log(`   Existing tables: ${existingTables.join(', ')}`);
    console.log(`   Missing tables: ${tablesToTest.filter(t => !existingTables.includes(t)).join(', ')}`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

