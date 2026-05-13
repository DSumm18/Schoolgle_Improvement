/**
 * Bradford Primary Maintained Schools WITH Ofsted Ratings
 *
 * Fixed version with proper CSV parsing
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';

// Load env
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ofsted rating codes
const RATING_MAP = {
  '1': 'Outstanding',
  '2': 'Good',
  '3': 'Requires Improvement',
  '4': 'Inadequate',
  '9': 'Not yet inspected',
  'Not judged': 'Not judged (new framework)'
};

// Column names from CSV (from row 3)
const COLUMNS = [
  'URN', 'Name', 'PublishDate', 'PublicationType', 'Remit', 'AsAtDate', 'PublishedDate',
  'Region', 'LAArea', 'Constituency', 'Postcode', 'ProviderType', 'ProvisionType',
  'Phase', 'DeprivationBand', 'OverallEffectiveness', 'CategoryOfConcern',
  'Leadership', 'QualityOfEducation', 'PersonalDevelopment', 'Behaviour',
  'Safeguarding', 'EarlyYears', 'SixthForm', 'URNMatch'
];

/**
 * Parse Ofsted CSV with manual column names
 */
function loadOfstedData() {
  const csvPath = resolve(process.cwd(), './five-year-ofsted-inspection-data_state-funded-schools.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse with manual column names, skip 3 header rows
  const records = parse(csvContent, {
    columns: COLUMNS,
    from_line: 4,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} Ofsted inspection records`);

  // Create lookup: URN -> latest rating
  const ofstedByUrn = new Map();
  const ofstedByName = new Map();
  const bradfordRecords = [];

  // Parse UK date (DD/MM/YYYY) to ISO (YYYY-MM-DD) for proper comparison
  function parseUKDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }

  for (const row of records) {
    const urn = parseInt(row.URN);
    if (!urn || isNaN(urn)) continue;

    const ratingCode = row.OverallEffectiveness?.trim();
    const rating = RATING_MAP[ratingCode] || ratingCode || null;
    const publishedDate = row.PublishedDate?.trim() || null;
    const publishedDateISO = parseUKDate(publishedDate);
    const asAtDate = row.AsAtDate?.trim() || null;
    const la = row.LAArea?.trim() || '';

    const record = {
      urn,
      name: row.Name?.trim() || '',
      rating,
      ratingCode,
      publishedDate,
      publishedDateISO,
      asAtDate,
      la
    };

    // Keep the latest record per URN (by publishedDateISO - actual inspection date)
    const existing = ofstedByUrn.get(urn);
    if (!existing || (publishedDateISO && existing.publishedDateISO && publishedDateISO > existing.publishedDateISO)) {
      ofstedByUrn.set(urn, record);
    }

    // Track Bradford schools
    if (la.toLowerCase().includes('brad')) {
      bradfordRecords.push(record);
    }

    // Store by normalized name for fallback matching
    const normalizedName = row.Name?.toLowerCase()
      .replace(/[''']/g, "")
      .replace(/[.-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedName) {
      ofstedByName.set(normalizedName, record);
    }
  }

  console.log(`Found ${ofstedByUrn.size} unique schools with Ofsted data`);
  console.log(`Found ${bradfordRecords.length} Bradford schools in Ofsted data`);

  return { ofstedByUrn, ofstedByName };
}

async function queryBradfordSchoolsWithOfsted() {
  console.log('🔍 Querying Bradford primary maintained schools WITH Ofsted ratings...\n');

  // Load Ofsted data
  const { ofstedByUrn, ofstedByName } = loadOfstedData();

  // Get ALL Bradford primary schools (including academies) to check for academized schools
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

  // Separate maintained and academy schools
  const academySchools = schools.filter(s => {
    const typeGroup = s.type_group_name || '';
    return typeGroup === 'Academies';
  });

  const maintainedSchools = schools.filter(s => {
    const typeGroup = s.type_group_name || '';
    return typeGroup === 'Local authority maintained schools';
  });

  // Create set of academy school names for exclusion (exact match)
  const academyNames = new Set(academySchools.map(s => s.name.toLowerCase()));

  // Filter out maintained schools that have an academy counterpart with the same name
  const trulyMaintained = maintainedSchools.filter(s => {
    return !academyNames.has(s.name.toLowerCase());
  });

  console.log(`✅ Filtered to ${trulyMaintained.length} maintained primary schools (excluding academized).\n`);

  // Combine with Ofsted data
  const results = [];
  let withOfstedRating = 0;

  for (const school of trulyMaintained) {
    // Try URN match first
    let ofsted = ofstedByUrn.get(school.urn);

    // Fallback: try name matching
    if (!ofsted) {
      const normalizedName = school.name.toLowerCase()
        .replace(/[''']/g, "")
        .replace(/[.-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      ofsted = ofstedByName.get(normalizedName);
    }

    const address = [school.street, school.locality, school.town, school.county]
      .filter(Boolean)
      .join(', ');

    const headteacher = [school.head_title, school.head_first_name, school.head_last_name]
      .filter(Boolean)
      .join(' ');

    const result = {
      school_name: school.name,
      urn: school.urn,
      type: school.type_name,
      headteacher: headteacher || null,
      telephone: school.telephone || null,
      email: school.email || null,
      address: address || null,
      postcode: school.postcode || null,
      website: school.website || null,
      number_of_pupils: school.number_of_pupils || null,
      percentage_fsm: school.percentage_fsm || null,
      ofsted_rating: ofsted?.rating || null,
      ofsted_rating_code: ofsted?.ratingCode || null,
      ofsted_date: ofsted?.publishedDate || null,
      ofsted_as_at: ofsted?.asAtDate || null
    };

    if (result.ofsted_rating) withOfstedRating++;
    results.push(result);
  }

  // Print results
  console.log('='.repeat(110));
  console.log('BRADFORD PRIMARY MAINTAINED SCHOOLS WITH OFSTED RATINGS');
  console.log('='.repeat(110));
  console.log();

  for (const r of results) {
    const ratingStr = r.ofsted_rating ? `⭐ ${r.ofsted_rating}` : '⭐ Not found';
    const dateStr = r.ofsted_date ? `(${r.ofsted_date})` : '';

    console.log(`📚 ${r.school_name}`);
    console.log(`   URN: ${r.urn} | Type: ${r.type}`);
    console.log(`   👤 Headteacher: ${r.headteacher || 'N/A'}`);
    console.log(`   📞 Tel: ${r.telephone || 'N/A'}`);
    console.log(`   📍 ${r.address}`);
    console.log(`   📮 ${r.postcode}`);
    console.log(`   ${ratingStr} ${dateStr}`);
    console.log(`   👥 Pupils: ${r.number_of_pupils || 'N/A'} | FSM: ${r.percentage_fsm ? r.percentage_fsm + '%' : 'N/A'}`);
    console.log('');
  }

  // Summary
  console.log('='.repeat(110));
  console.log('SUMMARY');
  console.log('='.repeat(110));
  console.log(`Total maintained primary schools: ${results.length}`);
  console.log(`With Ofsted rating: ${withOfstedRating} (${(withOfstedRating/results.length*100).toFixed(1)}%)`);
  console.log('='.repeat(110));

  // Rating breakdown
  const ratingCounts = {};
  for (const r of results) {
    if (r.ofsted_rating) {
      ratingCounts[r.ofsted_rating] = (ratingCounts[r.ofsted_rating] || 0) + 1;
    }
  }
  console.log('\nOfsted Rating Breakdown:');
  for (const [rating, count] of Object.entries(ratingCounts)) {
    console.log(`  ${rating}: ${count} schools`);
  }

  // Save results
  const jsonPath = './tmp/bradford-primary-schools-with-ofsted.json';
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 JSON saved to: ${jsonPath}`);

  // Save CSV
  const csvPath = './tmp/bradford-primary-schools-with-ofsted.csv';
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

  return results;
}

queryBradfordSchoolsWithOfsted()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    console.error(err.stack);
    process.exit(1);
  });
