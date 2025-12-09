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

console.log('🔍 Inspecting dfe_data schema...\n');
console.log(`Connecting to: ${process.env.DFE_SUPABASE_URL}\n`);

async function inspectSchema() {
  try {
    // Method 1: Try to query information_schema via SQL
    // Use the REST API to execute raw SQL
    const sqlQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = 'dfe_data' 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'dfe_data'
      ORDER BY table_name;
    `;

    console.log('📊 Querying information_schema...\n');
    
    // Try using PostgREST query parameter
    const response = await fetch(
      `${process.env.DFE_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sqlQuery })
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Tables found in dfe_data schema:\n');
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(table => {
          console.log(`   📋 ${table.table_name} (${table.column_count} columns)`);
        });
        return data.map(t => t.table_name);
      } else {
        console.log('   No tables found or empty result');
      }
    } else {
      const errorText = await response.text();
      console.log('⚠️  RPC method not available, trying alternative...\n');
      console.log(`   Error: ${errorText}\n`);
      
      // Alternative: Try direct table access
      await testDirectAccess();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTrying alternative method...\n');
    await testDirectAccess();
  }
}

async function testDirectAccess() {
  console.log('🧪 Testing direct table access...\n');
  
  const tablesToTest = [
    'schools',
    'area_demographics', 
    'local_authority_finance',
    'school_area_links',
    'imd_deprivation',
    'la_finance',
    'deprivation',
    'demographics'
  ];

  const existingTables = [];

  for (const table of tablesToTest) {
    try {
      // Try to query via Supabase client (will work if views exist or table is in public)
      const { data, error } = await dfeClient
        .from(table)
        .select('*')
        .limit(1);

      if (!error && data !== null) {
        existingTables.push(table);
        console.log(`✅ ${table} - ACCESSIBLE`);
        
        // Get count
        const { count } = await dfeClient
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Records: ${count?.toLocaleString() || 'unknown'}`);
      } else {
        console.log(`❌ ${table} - ${error?.message || 'Not accessible'}`);
      }
    } catch (error) {
      console.log(`❌ ${table} - ${error.message}`);
    }
  }

  console.log('\n📋 Summary:');
  if (existingTables.length > 0) {
    console.log(`   ✅ Accessible tables: ${existingTables.join(', ')}`);
  } else {
    console.log('   ⚠️  No tables accessible via client (views may not exist yet)');
  }

  // Also try to get sample data from schools if accessible
  if (existingTables.includes('schools')) {
    console.log('\n📊 Sample school data:');
    const { data: sample } = await dfeClient
      .from('schools')
      .select('urn, name, type_name, phase_name, la_name')
      .limit(3);
    
    if (sample) {
      sample.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (URN: ${s.urn})`);
        console.log(`      Type: ${s.type_name || 'N/A'} | Phase: ${s.phase_name || 'N/A'} | LA: ${s.la_name || 'N/A'}`);
      });
    }
  }

  return existingTables;
}

// Run inspection
inspectSchema().then(() => {
  console.log('\n✨ Inspection complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. If tables are found, create views for them');
  console.log('   2. If no tables accessible, check table names in Supabase Dashboard');
  console.log('   3. Update RUN_THIS_SQL.sql with correct table names\n');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

