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

async function checkSchema() {
  console.log('🔍 Checking DfE database schema...\n');

  try {
    // Check if schools table exists and get columns
    const { data: columns, error } = await dfeClient.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'dfe_data' 
          AND table_name = 'schools'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Try alternative method
      console.log('Trying alternative query method...\n');
      const { data: altData, error: altError } = await dfeClient
        .from('schools')
        .select('*')
        .limit(1);

      if (altError) {
        console.error('❌ Error accessing schools table:', altError);
        return;
      }

      if (altData && altData.length > 0) {
        console.log('✅ Schools table accessible');
        console.log('📋 Sample columns from first record:');
        console.log(Object.keys(altData[0]).join(', '));
        
        // Check for religious fields
        const sample = altData[0];
        const religiousFields = Object.keys(sample).filter(key => 
          key.toLowerCase().includes('religious') ||
          key.toLowerCase().includes('faith') ||
          key.toLowerCase().includes('denomination') ||
          key.toLowerCase().includes('ethos')
        );

        if (religiousFields.length > 0) {
          console.log('\n✅ Found religious/faith fields:');
          religiousFields.forEach(field => {
            console.log(`   - ${field}: ${sample[field]}`);
          });
        } else {
          console.log('\n⚠️  No religious/faith fields found in sample data');
          console.log('   Will need to ask users about faith designation');
        }
      }
    } else if (columns) {
      console.log('📋 Schools table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      const religiousCols = columns.filter(col => 
        col.column_name.toLowerCase().includes('religious') ||
        col.column_name.toLowerCase().includes('faith') ||
        col.column_name.toLowerCase().includes('denomination') ||
        col.column_name.toLowerCase().includes('ethos')
      );

      if (religiousCols.length > 0) {
        console.log('\n✅ Found religious/faith columns:');
        religiousCols.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('\n⚠️  No religious/faith columns found');
        console.log('   Will need to ask users about faith designation');
      }
    }

    // Test lookup
    console.log('\n🧪 Testing URN lookup (URN: 100000)...');
    const { data: testSchool, error: testError } = await dfeClient
      .from('schools')
      .select('*')
      .eq('urn', 100000)
      .single();

    if (testError) {
      console.log('⚠️  Test lookup failed:', testError.message);
    } else if (testSchool) {
      console.log('✅ Test lookup successful');
      console.log(`   School: ${testSchool.name}`);
      console.log(`   Type: ${testSchool.type_name || 'N/A'}`);
      console.log(`   Phase: ${testSchool.phase_name || 'N/A'}`);
    }

    // Count records
    const { count, error: countError } = await dfeClient
      .from('schools')
      .select('*', { count: 'exact', head: true });

    if (!countError && count) {
      console.log(`\n📊 Total schools in database: ${count.toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();

