const fs = require('fs');

const content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');
const lines = content.split('\n');
const line151 = lines[150];

console.log('Line 151 content:');
console.log(JSON.stringify(line151));
console.log('');
console.log('Contains [ ?', line151.includes('['));
console.log('Contains {[ ?', line151.includes('{['));
console.log('');
console.log('First 100 chars:', line151.substring(0, 100));

// Let's also check a few lines around it
console.log('\nLines 150-152:');
for (let i = 149; i < 152; i++) {
  console.log(`Line ${i+1}:`, lines[i].substring(0, 80));
}
