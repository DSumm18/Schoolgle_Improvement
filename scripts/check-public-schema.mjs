import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    process.env[key] = value.trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPublicSchema() {
  console.log('Checking public schema for schools view...\n');

  // Try public.schools view
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .ilike('la_name', '%brad%')
    .eq('phase_name', 'Primary')
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    
    // Try to list tables/views in public
    const { data: tables } = await supabase
      .rpc('get_tables_in_schema', { schema_name: 'public' });
    console.log('Tables in public schema:', tables);
  } else {
    console.log('Found schools via public view:', schools.length);
    console.log('Sample:', schools[0]);
  }
}

checkPublicSchema().catch(console.error);
