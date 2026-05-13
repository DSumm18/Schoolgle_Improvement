import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const csv = readFileSync('./five-year-ofsted-inspection-data_state-funded-schools.csv', 'utf-8');
const records = parse(csv, { columns: true, from_line: 4 });

// Check first 3 records
console.log('First 3 records:');
for (let i = 0; i < 3; i++) {
  const r = records[i];
  console.log(`Record ${i}:`);
  console.log('  Keys:', Object.keys(r));
  console.log('  URN:', r.URN, typeof r.URN);
  console.log('  Name:', r.Name);
  break;
}

// Also check Bradford
console.log('\nSearching for URN 101494 (number)...');
const peelParkNum = records.find(r => r.URN === 101494);
console.log('Found by number:', peelParkNum ? peelParkNum.Name : 'No');

console.log('\nSearching for URN "101494" (string)...');
const peelParkStr = records.find(r => r.URN === '101494');
console.log('Found by string:', peelParkStr ? peelParkStr.Name : 'No');
