import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const SUPABASE_URL = process.env.DFE_SUPABASE_URL;
const SERVICE_KEY = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Inspecting dfe_data schema via SQL execution...\n');

// Since Supabase REST API doesn't support raw SQL, we need to use the SQL Editor
// But let me try to use the Supabase Management API or create a helper function

async function inspectViaSQL() {
  // Create comprehensive SQL that will show everything
  const inspectionSQL = `
-- Complete dfe_data schema inspection
-- This will show all tables, their row counts, and sample data

-- 1. All tables in dfe_data schema
SELECT 
    'TABLE' as type,
    table_name as name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- 2. Row counts for each table (if accessible)
DO $$
DECLARE
    table_rec RECORD;
    row_count BIGINT;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dfe_data'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM dfe_data.%I', table_rec.table_name) INTO row_count;
        RAISE NOTICE 'Table: % | Rows: %', table_rec.table_name, row_count;
    END LOOP;
END $$;
`;

  // Save to file
  const fs = await import('fs');
  fs.writeFileSync(
    join(__dirname, '..', 'COMPLETE_INSPECTION.sql'),
    inspectionSQL
  );

  console.log('✅ Created COMPLETE_INSPECTION.sql');
  console.log('   This SQL will show all tables and their row counts\n');

  // Also try to query via REST API using table name variations
  console.log('🧪 Testing table access via REST API...\n');
  
  const tableVariations = [
    'schools',
    'Schools',
    'SCHOOLS'
  ];

  for (const table of tableVariations) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=urn,name&limit=1`,
        {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table} - Accessible`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${data[0].name} (URN: ${data[0].urn})`);
        }
        
        // Get count
        const countResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`,
          {
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Prefer': 'count=exact'
            }
          }
        );
        
        const countHeader = countResponse.headers.get('content-range');
        if (countHeader) {
          const match = countHeader.match(/\/(\d+)/);
          if (match) {
            console.log(`   Total rows: ${parseInt(match[1]).toLocaleString()}`);
          }
        }
        break; // Found it, stop searching
      }
    } catch (error) {
      // Continue to next variation
    }
  }

  console.log('\n📝 To see all tables, run COMPLETE_INSPECTION.sql in Supabase SQL Editor');
}

inspectViaSQL();

