const fs = require('fs');
const content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');
const lines = content.split('\n');

const line151 = lines[150];

console.log('Testing line 151:');
console.log('Content:', line151);
console.log('Trim starts with [:', line151.trim().startsWith('['));
console.log('Includes comma:', line151.includes(','));
console.log('Includes backslash quote:', line151.includes('\\"'));
console.log('Condition result:', line151.trim().startsWith('[') && (line151.includes(',') || line151.includes('\\"')));
