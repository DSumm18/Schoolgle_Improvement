import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const SUPABASE_URL = process.env.DFE_SUPABASE_URL;
const SERVICE_KEY = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Querying dfe_data schema directly via REST API...\n');

// SQL to get all tables in dfe_data schema
const sql = `
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

async function queryDatabase() {
  try {
    // Try using Supabase's query endpoint with SQL
    // Note: Supabase REST API doesn't support raw SQL, but we can try the management API
    
    // Alternative: Use pg_rest or direct PostgreSQL connection
    // For now, let's create a SQL file that can be run in Supabase SQL Editor
    
    console.log('📝 Since Supabase REST API doesn\'t support raw SQL queries,');
    console.log('   I\'ll create a SQL query you can run in Supabase SQL Editor.\n');
    
    const sqlFile = `
-- Query to find all tables in dfe_data schema
-- Run this in Supabase SQL Editor

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count,
    (SELECT COUNT(*)::bigint 
     FROM dfe_data." || quote_ident(t.table_name) || ") as row_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;
`;

    // Actually, let's try a simpler approach - query information_schema via REST
    // But first, let's check if we can access the database metadata
    
    // Try to query a known table directly with schema prefix
    console.log('🧪 Testing direct access to dfe_data.schools...\n');
    
    const testResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/schools?select=urn,name&limit=1`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Can access schools table via REST API');
      if (testData && testData.length > 0) {
        console.log(`   Sample: ${testData[0].name} (URN: ${testData[0].urn})`);
      } else {
        console.log('   ⚠️  Table exists but is empty or view has no data');
      }
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Cannot access:', errorText);
    }

    // Create SQL file for manual execution
    const fs = await import('fs');
    const sqlContent = `-- Find all tables in dfe_data schema
-- Run this in Supabase SQL Editor

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- Then for each table found, check row count:
-- SELECT COUNT(*) FROM dfe_data.schools;
-- SELECT COUNT(*) FROM dfe_data.area_demographics;
-- etc.
`;

    fs.writeFileSync(join(__dirname, '..', 'FIND_ALL_TABLES.sql'), sqlContent);
    console.log('\n✅ Created FIND_ALL_TABLES.sql');
    console.log('   Run this in Supabase SQL Editor to see all tables\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

queryDatabase();

