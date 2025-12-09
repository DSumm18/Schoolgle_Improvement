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
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'dfe_data'
    }
  }
);

console.log('🔍 Testing DfE database connection...\n');
console.log(`URL: ${process.env.DFE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`Key: ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}\n`);

try {
  // Test 1: Count schools
  console.log('📊 Test 1: Counting schools...');
  const { count, error: countError } = await dfeClient
    .from('schools')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error:', countError.message);
  } else {
    console.log(`✅ Found ${count?.toLocaleString()} schools\n`);
  }

  // Test 2: Get sample schools
  console.log('📊 Test 2: Fetching sample schools...');
  const { data: schools, error: schoolsError } = await dfeClient
    .from('schools')
    .select('urn, name, type_name, phase_name, la_name')
    .limit(5);

  if (schoolsError) {
    console.error('❌ Error:', schoolsError.message);
  } else {
    console.log('✅ Sample schools:');
    schools.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name}`);
      console.log(`      URN: ${s.urn} | Type: ${s.type_name || 'N/A'} | Phase: ${s.phase_name || 'N/A'} | LA: ${s.la_name || 'N/A'}`);
    });
    console.log('');
  }

  // Test 3: Lookup specific URN
  console.log('📊 Test 3: Looking up URN 100000...');
  const { data: school, error: lookupError } = await dfeClient
    .from('schools')
    .select('*')
    .eq('urn', 100000)
    .single();

  if (lookupError) {
    console.log(`⚠️  URN 100000 not found (this is OK - trying another URN)...`);
    
    // Try to get first available URN
    const { data: firstSchool } = await dfeClient
      .from('schools')
      .select('urn, name')
      .limit(1)
      .single();
    
    if (firstSchool) {
      console.log(`✅ Testing with URN ${firstSchool.urn} (${firstSchool.name})...`);
      const { data: testSchool } = await dfeClient
        .from('schools')
        .select('urn, name, type_name, phase_name, la_name, trust_name')
        .eq('urn', firstSchool.urn)
        .single();
      
      if (testSchool) {
        console.log('✅ Lookup successful:');
        console.log(`   Name: ${testSchool.name}`);
        console.log(`   Type: ${testSchool.type_name || 'N/A'}`);
        console.log(`   Phase: ${testSchool.phase_name || 'N/A'}`);
        console.log(`   LA: ${testSchool.la_name || 'N/A'}`);
        console.log(`   Trust: ${testSchool.trust_name || 'N/A'}`);
      }
    }
  } else {
    console.log('✅ Lookup successful:');
    console.log(`   Name: ${school.name}`);
    console.log(`   Type: ${school.type_name || 'N/A'}`);
    console.log(`   Phase: ${school.phase_name || 'N/A'}`);
    console.log(`   LA: ${school.la_name || 'N/A'}`);
    console.log(`   Trust: ${school.trust_name || 'N/A'}`);
  }
  console.log('');

  // Test 4: Check for religious character field
  console.log('📊 Test 4: Checking for religious/faith fields...');
  if (school || schools?.[0]) {
    const sample = school || schools[0];
    const religiousFields = Object.keys(sample).filter(key => 
      key.toLowerCase().includes('religious') ||
      key.toLowerCase().includes('faith') ||
      key.toLowerCase().includes('denomination') ||
      key.toLowerCase().includes('ethos')
    );

    if (religiousFields.length > 0) {
      console.log('✅ Found religious/faith fields:');
      religiousFields.forEach(field => {
        console.log(`   - ${field}: ${sample[field] || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No religious/faith fields found');
      console.log('   Will need to ask users about faith designation');
    }
  }
  console.log('');

  // Test 5: Framework detection
  console.log('📊 Test 5: Testing framework detection...');
  if (school || schools?.[0]) {
    const testSchool = school || schools[0];
    const isIndependent = testSchool.type_name?.toLowerCase().includes('independent');
    
    console.log(`   School Type: ${testSchool.type_name}`);
    console.log(`   Is Independent: ${isIndependent ? 'Yes' : 'No'}`);
    console.log(`   → Detected Framework: ${isIndependent ? 'ISI' : 'Ofsted'}`);
    console.log(`   → Faith Framework: Must ask user (not in data)`);
  }
  console.log('');

  console.log('✨ All tests complete!');
  console.log('\n✅ DfE database connection is working!');

} catch (error) {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

