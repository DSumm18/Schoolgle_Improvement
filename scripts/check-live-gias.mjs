/**
 * Check live GIAS API for current headteacher data
 */

async function checkLiveGIAS() {
  const GIAS_API_BASE = 'https://get-information-schools.service.gov.uk';

  // Test schools with known stale data
  const testSchools = [
    { urn: '107217', name: 'Crossley Hall Primary School' },  // Shows Michael Thorpe (wrong)
    { urn: '101494', name: 'Peel Park Primary School and Nursery' },
    { urn: '107224', name: 'Blakehill Primary School' }
  ];

  console.log('=== CHECKING LIVE GIAS DATA ===\n');

  for (const school of testSchools) {
    console.log(`--- ${school.name} (URN: ${school.urn}) ---`);

    try {
      const response = await fetch(`${GIAS_API_BASE}/establishments/${school.urn}.json`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.log(`  Error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const est = data?.establishment;

      if (!est) {
        console.log(`  No establishment data found`);
        continue;
      }

      console.log(`  Current headteacher: ${est.headteacher?.name || est.headteacher?.title || 'Not listed'}`);
      console.log(`  Telephone: ${est.telephone || 'Not listed'}`);
      console.log(`  Email: ${est.email || 'Not listed'}`);
      console.log(`  Last changed: ${est.lastChangedDate || 'Unknown'}`);
      console.log(`  Type: ${est.typeOfEstablishment?.name || 'Unknown'}`);

    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    console.log('');
  }
}

checkLiveGIAS().catch(console.error);
