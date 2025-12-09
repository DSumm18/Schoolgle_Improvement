import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', 'apps', 'platform', '.env.local') });

const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY
);

const sqlScript = `
-- Create views in public schema pointing to dfe_data tables

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
GRANT SELECT ON public.school_area_links TO anon;
`;

console.log('🔧 Creating views in public schema...\n');

try {
  // Execute SQL via REST API
  const response = await fetch(
    `${process.env.DFE_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlScript })
    }
  );

  if (response.ok) {
    console.log('✅ Views created successfully!\n');
  } else {
    // Try alternative: Use Supabase SQL Editor API or direct SQL execution
    console.log('⚠️  RPC method not available, trying alternative...\n');
    
    // Alternative: Execute via Supabase Management API
    const altResponse = await fetch(
      `${process.env.DFE_SUPABASE_URL}/rest/v1/`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!altResponse.ok) {
      console.log('❌ Could not execute SQL automatically.');
      console.log('\n📝 Please run the SQL manually in Supabase SQL Editor:');
      console.log('   1. Go to: https://ygquvauptwyvlhkyxkwy.supabase.co');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the SQL from: supabase/create-dfe-views.sql');
      console.log('   4. Run the SQL\n');
      
      console.log('SQL to run:');
      console.log('─'.repeat(60));
      console.log(sqlScript);
      console.log('─'.repeat(60));
    }
  }

  // Test if views were created
  console.log('🧪 Testing if views are accessible...\n');
  
  const { data: testData, error: testError } = await dfeClient
    .from('schools')
    .select('urn, name')
    .limit(1);

  if (testError) {
    console.log('⚠️  Views not yet accessible:', testError.message);
    console.log('\n💡 You may need to:');
    console.log('   1. Run the SQL manually in Supabase SQL Editor');
    console.log('   2. Or wait a moment and try again\n');
  } else {
    console.log('✅ Views are accessible!');
    console.log(`   Sample school: ${testData[0]?.name} (URN: ${testData[0]?.urn})\n`);
    
    // Count schools
    const { count } = await dfeClient
      .from('schools')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total schools accessible: ${count?.toLocaleString() || 'unknown'}`);
    console.log('\n✨ Setup complete! DfE data is now accessible.');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Please run the SQL manually:');
  console.log('   File: supabase/create-dfe-views.sql');
  console.log('   Location: Supabase SQL Editor');
}

