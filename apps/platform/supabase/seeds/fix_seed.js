const fs = require('fs');

const content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');

// 1. First, let's understand the damage
console.log('Analyzing current file state...');
console.log('Pattern counts:');

// Look for the various broken patterns
const patterns = {
  'Backslash before ] in arrays': (content.match(/"\\],/g) || []).length,
  'Backslash before ]::jsonb': (content.match(/\\]::jsonb/g) || []).length,
  'Missing quotes before ::jsonb': (content.match(/"]::jsonb/g) || []).length,
  'Proper ::jsonb with closing bracket': (content.match(/"}]::jsonb/g) || []).length,
};

for (const [name, count] of Object.entries(patterns)) {
  console.log(`  ${name}: ${count}`);
}

// 2. Fix the compliance_domains columns
// Current: ["domain1", "domain2"\]
// Should be: {"domain1", "domain2"}

console.log('\nFixing compliance_domains columns...');

// Step 1: Remove the backslash before closing bracket in compliance_domains
// These are arrays like ["fire", "electrical"\] that should be {"fire", "electrical"}
// They appear BEFORE the specifications column

// Match pattern: '["..."\] where the \] should be just } and the [ should be {
// But we need to be careful not to touch JSONB columns

// Strategy:
// 1. Find all '["..."\] patterns that are NOT followed by ::jsonb
// 2. Replace ' with {
// 3. Replace [\] with }

let fixed = content;

// First, fix the closing bracket in compliance_domains
// Pattern: "..."\],  (with comma and space after)
fixed = fixed.replace(/"\\"\\],/g, '"},');

// Pattern: "..."\] with space after (before next column)
fixed = fixed.replace(/"\\"\\] /g, '"} ');

// Pattern: "..."\] at end of line
fixed = fixed.replace(/"\\"\\]$/gm, '"}');

// Now fix the opening bracket in compliance_domains
// Pattern: '[" at the start of a compliance_domains value
// These appear after 'active', so we can look for that pattern
// But easier: just replace ALL '[' with '{' and then fix JSONB columns back

// Actually, let's be smarter. The compliance_domains arrays are standalone values
// They look like: '["fire", "electrical"\]
// We want: '{"fire", "electrical"}

// After fixing the closing bracket above, we now have: '["fire", "electrical"},
// So we just need to replace '[ with { at the start of these arrays

// Look for pattern: '[" and replace with '{
// Use String.raw to avoid escaping issues
const searchPattern = String.raw`'\["`;
fixed = fixed.replace(new RegExp(searchPattern, 'g'), '{"');

// 3. Fix the specifications JSONB columns
// They got corrupted and now look like: '{"key": "value"]::jsonb
// Should be: '[{"key": "value"}]::jsonb

console.log('Fixing specifications JSONB columns...');

// Pattern: '{" at the start of specifications (should be '[{)
// These appear after compliance_domains, so after '},
fixed = fixed.replace(/'}, ' '{"/g, '}, \'[{');

// Also fix cases where it's just }, (without space)
fixed = fixed.replace(/'}, '{"/g, '}, \'[{');

// Also fix single-line cases
fixed = fixed.replace(/'{"(floors|capacity|floor|location|type|age_range|surface|manufacturer|model|installed|catering|restricted|rating|last_serviced|test_interval|test_date|last_inspection|serviced)/g, '\'[{"$1');

// Now fix the closing of specifications
// Pattern: "]::jsonb should be "}]::jsonb
fixed = fixed.replace(/"\\"\\]::jsonb/g, '"}]::jsonb');

// Also fix cases where closing bracket is before ::jsonb but missing }
// Pattern: "value"]::jsonb should be "value"}]::jsonb
fixed = fixed.replace(/("\\"\\}|\\"\\w+)"]::jsonb/g, '$1"}]::jsonb');

fs.writeFileSync('003_estates_compliance_seed.sql', fixed, 'utf8');
console.log('\nFile updated successfully!');
console.log('\nVerifying fixes...');

// Verify a few lines
const lines = fixed.split('\n');
for (let i = 149; i < Math.min(175, lines.length); i++) {
  if (lines[i].includes('compliance_domains') || lines[i].includes('::jsonb')) {
    console.log(`Line ${i+1}: ${lines[i].substring(0, 120)}`);
  }
}
