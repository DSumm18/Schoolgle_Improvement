/**
 * Query DfE database for Bradford primary maintained schools
 *
 * Filters:
 * - Local Authority: Bradford (LA code 387)
 * - School type: Maintained (not academies)
 * - Phase: Primary
 *
 * Returns:
 * - School name, headteacher, contact details, address, Ofsted rating, inspection date
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const DFE_SUPABASE_URL = process.env.DFE_SUPABASE_URL;
const DFE_SUPABASE_SERVICE_ROLE_KEY = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;

if (!DFE_SUPABASE_URL || !DFE_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables: DFE_SUPABASE_URL and/or DFE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(DFE_SUPABASE_URL, DFE_SUPABASE_SERVICE_ROLE_KEY);

interface SchoolResult {
  urn: number;
  school_name: string;
  headteacher_name: string | null;
  telephone: string | null;
  email: string | null;
  address: string;
  postcode: string;
  ofsted_rating: string | null;
  ofsted_date: string | null;
  type_name: string;
  phase_name: string;
}

async function queryBradfordPrimarySchools() {
  console.log('Querying DfE database for Bradford primary maintained schools...\n');

  // First, let's check what columns exist in the schools table
  const { data: columnsData, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'schools', schema_name: 'dfe_data' })
    .select('*');

  if (columnsError) {
    console.log('Note: Could not check columns directly, proceeding with query...');
  }

  // Query for Bradford primary maintained schools
  // Bradford LA code is 387
  // We'll filter for primary phase and exclude academies
  const { data: schools, error } = await supabase
    .schema('dfe_data')
    .from('schools')
    .select(`
      urn,
      name,
      la_code,
      la_name,
      type_name,
      phase_name,
      address_line1,
      address_line2,
      address_line3,
      town,
      postcode,
      telephone,
      email
    `)
    .eq('la_code', '387') // Bradford
    .eq('phase_name', 'Primary')
    .order('name');

  if (error) {
    console.error('Error querying schools:', error);
    return;
  }

  if (!schools || schools.length === 0) {
    console.log('No schools found matching criteria.');
    return;
  }

  console.log(`Found ${schools.length} primary schools in Bradford (including academies).\n`);

  // Filter out academies (maintained schools only)
  const maintainedSchools = schools.filter(school => {
    const type = school.type_name?.toLowerCase() || '';
    // Exclude academies, free schools, studio schools
    return !type.includes('academy') &&
           !type.includes('free school') &&
           !type.includes('studio school') &&
           !type.includes('university technical');
  });

  console.log(`Found ${maintainedSchools.length} maintained primary schools in Bradford.\n`);

  // Now get headteacher and Ofsted data from school_profiles
  const urns = maintainedSchools.map(s => s.urn);

  const { data: profiles, error: profileError } = await supabase
    .schema('dfe_data')
    .from('school_profiles')
    .select('urn, headteacher_name, latest_ofsted_rating, latest_ofsted_date')
    .in('urn', urns);

  if (profileError) {
    console.error('Error querying school profiles:', profileError);
  }

  // Create a map of URN -> profile data
  const profileMap = new Map();
  if (profiles) {
    for (const profile of profiles) {
      profileMap.set(profile.urn, profile);
    }
  }

  // Combine the data
  const results: SchoolResult[] = maintainedSchools.map(school => {
    const profile = profileMap.get(school.urn);
    const addressParts = [
      school.address_line1,
      school.address_line2,
      school.address_line3,
      school.town
    ].filter(Boolean).join(', ');

    return {
      urn: school.urn,
      school_name: school.name,
      headteacher_name: profile?.headteacher_name || null,
      telephone: school.telephone || null,
      email: school.email || null,
      address: addressParts,
      postcode: school.postcode || '',
      ofsted_rating: profile?.latest_ofsted_rating || null,
      ofsted_date: profile?.latest_ofsted_date || null,
      type_name: school.type_name || '',
      phase_name: school.phase_name || ''
    };
  });

  // Display results as a table
  console.log('='.repeat(120));
  console.log('BRADFORD PRIMARY MAINTAINED SCHOOLS');
  console.log('='.repeat(120));
  console.log();

  for (const result of results) {
    console.log(`School: ${result.school_name} (URN: ${result.urn})`);
    console.log(`  Type: ${result.type_name}`);
    console.log(`  Headteacher: ${result.headteacher_name || 'Not available'}`);
    console.log(`  Telephone: ${result.telephone || 'Not available'}`);
    console.log(`  Email: ${result.email || 'Not available'}`);
    console.log(`  Address: ${result.address}`);
    console.log(`  Postcode: ${result.postcode}`);
    console.log(`  Ofsted Rating: ${result.ofsted_rating || 'Not available'}`);
    console.log(`  Ofsted Date: ${result.ofsted_date || 'Not available'}`);
    console.log();
  }

  // Summary stats
  const withContactInfo = results.filter(r => r.telephone || r.email).length;
  const withHeadteacher = results.filter(r => r.headteacher_name).length;
  const withOfsted = results.filter(r => r.ofsted_rating).length;

  console.log('='.repeat(120));
  console.log('SUMMARY');
  console.log('='.repeat(120));
  console.log(`Total schools: ${results.length}`);
  console.log(`With contact info: ${withContactInfo} (${((withContactInfo/results.length)*100).toFixed(1)}%)`);
  console.log(`With headteacher: ${withHeadteacher} (${((withHeadteacher/results.length)*100).toFixed(1)}%)`);
  console.log(`With Ofsted rating: ${withOfsted} (${((withOfsted/results.length)*100).toFixed(1)}%)`);

  return results;
}

// Run the query
queryBradfordPrimarySchools()
  .then(results => {
    console.log('\nQuery complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
