import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Testing DfE database connection...\n');

try {
  // Use SQL query to access dfe_data schema
  console.log('📊 Test 1: Counting schools using SQL...');
  const { data: countData, error: countError } = await dfeClient.rpc('exec_sql', {
    query: 'SELECT COUNT(*) as count FROM dfe_data.schools'
  });

  if (countError) {
    // Try direct query to public schema (if views exist)
    console.log('⚠️  SQL RPC not available, trying direct query...');
    const { count, error: directError } = await dfeClient
      .from('schools')
      .select('*', { count: 'exact', head: true });

    if (directError) {
      console.error('❌ Error:', directError.message);
      console.log('\n💡 Note: You may need to create views in public schema');
      console.log('   Or use SQL queries directly via Supabase SQL Editor');
    } else {
      console.log(`✅ Found ${count?.toLocaleString()} schools (via public view)\n`);
    }
  } else {
    console.log(`✅ Found ${countData?.[0]?.count?.toLocaleString() || 'unknown'} schools\n`);
  }

  // Test 2: Get sample schools using SQL
  console.log('📊 Test 2: Fetching sample schools using SQL...');
  const { data: schoolsData, error: schoolsError } = await dfeClient.rpc('exec_sql', {
    query: `SELECT urn, name, type_name, phase_name, la_name FROM dfe_data.schools WHERE status_name = 'Open' LIMIT 5`
  });

  if (schoolsError) {
    // Try direct query
    const { data: directSchools, error: directError } = await dfeClient
      .from('schools')
      .select('urn, name, type_name, phase_name, la_name')
      .limit(5);

    if (directError) {
      console.error('❌ Error:', directError.message);
    } else {
      console.log('✅ Sample schools (via public view):');
      directSchools.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name}`);
        console.log(`      URN: ${s.urn} | Type: ${s.type_name || 'N/A'} | Phase: ${s.phase_name || 'N/A'}`);
      });
    }
  } else {
    console.log('✅ Sample schools (via SQL):');
    (schoolsData || []).forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name}`);
      console.log(`      URN: ${s.urn} | Type: ${s.type_name || 'N/A'} | Phase: ${s.phase_name || 'N/A'}`);
    });
  }
  console.log('');

  // Test 3: Check schema access
  console.log('📊 Test 3: Checking schema access...');
  console.log('💡 To access dfe_data schema, you have two options:');
  console.log('   1. Create views in public schema pointing to dfe_data tables');
  console.log('   2. Use SQL queries via Supabase SQL Editor or RPC functions');
  console.log('   3. Use REST API with schema prefix');
  console.log('');

  console.log('✅ Connection test complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Check if public.schools view exists (points to dfe_data.schools)');
  console.log('   2. If not, create views or use SQL queries');
  console.log('   3. Test the /api/school/lookup endpoint');

} catch (error) {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}

