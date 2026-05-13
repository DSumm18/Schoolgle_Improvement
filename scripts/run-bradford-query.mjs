/**
 * Bradford Primary Maintained Schools Query
 *
 * Returns contact details and Ofsted info for
 * primary schools in Bradford that are NOT academies
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
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

async function queryBradfordSchools() {
  console.log('🔍 Querying DfE database for Bradford primary maintained schools...\n');

  // Get all schools in Bradford with Primary phase
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .eq('la_name', 'Bradford')
    .eq('phase_name', 'Primary')
    .order('name');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${schools.length} primary schools in Bradford (including academies).\n`);

  // Filter to maintained schools only (exclude academies)
  const maintainedSchools = schools.filter(s => {
    const typeGroup = (s.type_group_name || '').toLowerCase();
    const typeName = (s.type_name || '').toLowerCase();
    // Keep only local authority maintained schools
    return typeGroup.includes('local authority') ||
           typeName.includes('community') ||
           typeName.includes('voluntary controlled') ||
           typeName.includes('voluntary aided');
  });

  console.log(`✅ Filtered to ${maintainedSchools.length} maintained primary schools.\n`);

  // Format results
  const results = maintainedSchools.map(s => {
    // Build address
    const addressParts = [
      s.street,
      s.locality,
      s.town,
      s.county
    ].filter(Boolean);
    const address = addressParts.join(', ');

    // Build headteacher name
    const headteacher = [s.head_title, s.head_first_name, s.head_last_name]
      .filter(Boolean)
      .join(' ');

    return {
      school_name: s.name,
      urn: s.urn,
      type: s.type_name,
      headteacher: headteacher || null,
      telephone: s.telephone || null,
      email: s.email || null,
      address: address || null,
      postcode: s.postcode || null,
      website: s.website || null,
      number_of_pupils: s.number_of_pupils || null,
      percentage_fsm: s.percentage_fsm || null,
      ofsted_rating: s.inspectorate_name || null,
      ofsted_date: s.date_of_last_inspection || null,
      status: s.status_name || null
    };
  });

  // Print results
  console.log('='.repeat(110));
  console.log('BRADFORD PRIMARY MAINTAINED SCHOOLS');
  console.log('='.repeat(110));
  console.log();

  for (const r of results) {
    console.log(`📚 ${r.school_name}`);
    console.log(`   URN: ${r.urn} | Type: ${r.type} | Status: ${r.status}`);
    console.log(`   👤 Headteacher: ${r.headteacher || 'N/A'}`);
    console.log(`   📞 Tel: ${r.telephone || 'N/A'}`);
    console.log(`   📧 Email: ${r.email || 'N/A'}`);
    console.log(`   📍 ${r.address}`);
    console.log(`   📮 ${r.postcode}`);
    if (r.ofsted_rating) console.log(`   ⭐ Ofsted: ${r.ofsted_rating} (${r.ofsted_date || 'Date N/A'})`);
    console.log(`   👥 Pupils: ${r.number_of_pupils || 'N/A'} | FSM: ${r.percentage_fsm ? r.percentage_fsm + '%' : 'N/A'}`);
    console.log('');
  }

  // Summary
  const withHeadteacher = results.filter(r => r.headteacher).length;
  const withPhone = results.filter(r => r.telephone).length;
  const withEmail = results.filter(r => r.email).length;
  const withOfsted = results.filter(r => r.ofsted_rating).length;

  console.log('='.repeat(110));
  console.log('SUMMARY');
  console.log('='.repeat(110));
  console.log(`Total maintained primary schools: ${results.length}`);
  console.log(`With headteacher name: ${withHeadteacher} (${(withHeadteacher/results.length*100).toFixed(1)}%)`);
  console.log(`With telephone: ${withPhone} (${(withPhone/results.length*100).toFixed(1)}%)`);
  console.log(`With email: ${withEmail} (${(withEmail/results.length*100).toFixed(1)}%)`);
  console.log(`With Ofsted data: ${withOfsted} (${(withOfsted/results.length*100).toFixed(1)}%)`);
  console.log('='.repeat(110));

  // Save JSON
  const jsonPath = './tmp/bradford-primary-schools.json';
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 JSON saved to: ${jsonPath}`);

  // Save CSV
  const csvPath = './tmp/bradford-primary-schools.csv';
  const headers = ['School Name', 'URN', 'Type', 'Headteacher', 'Telephone', 'Email', 'Address', 'Postcode', 'Ofsted Rating', 'Ofsted Date', 'Website', 'Pupils', 'FSM %'];
  const csvRows = [
    headers.join(','),
    ...results.map(r => [
      `"${r.school_name}"`,
      r.urn,
      `"${r.type}"`,
      r.headteacher ? `"${r.headteacher}"` : '',
      r.telephone || '',
      r.email || '',
      r.address ? `"${r.address}"` : '',
      r.postcode || '',
      r.ofsted_rating || '',
      r.ofsted_date || '',
      r.website || '',
      r.number_of_pupils || '',
      r.percentage_fsm || ''
    ].join(','))
  ];
  writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`📊 CSV saved to: ${csvPath}`);

  // Create simple table format for copy-paste
  const tablePath = './tmp/bradford-primary-schools.txt';
  const tableRows = [
    '| School Name | Headteacher | Telephone | Email | Ofsted Rating |',
    '|-------------|-------------|-----------|-------|---------------|',
    ...results.map(r => `| ${r.school_name} | ${r.headteacher || 'N/A'} | ${r.telephone || 'N/A'} | ${r.email || 'N/A'} | ${r.ofsted_rating || 'N/A'} |`)
  ];
  writeFileSync(tablePath, tableRows.join('\n'));
  console.log(`📋 Table saved to: ${tablePath}`);

  return results;
}

queryBradfordSchools()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
