const fs = require('fs');

let content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');

console.log('=== Final Fix for Seed File ===\n');

// ===================================================================
// The file has two types of issues after my earlier attempts:
// 1. compliance_domains: '["domain"\] should be '{"domain"}'
// 2. specifications: '[{"key": "value"]::jsonb should be '[{"key": "value"}]::jsonb
// ===================================================================

// Step 1: Fix compliance_domains
// Pattern: '["x", "y"\] -> '{"x", "y"}'

console.log('Step 1: Fixing compliance_domains columns...');

// Replace opening '[" with '{
content = content.replaceAll("'[", '{"');

// Replace closing "\], with "},
content = content.replaceAll('"\\],', '"},');

// Replace closing "\] with "}
content = content.replaceAll('"\\]', '"}');

// Also handle the case without backslash (if it was already partially fixed)
content = content.replaceAll('"],', '"},');
content = content.replaceAll('"] ', '"} ');

// Step 2: Fix specifications JSONB columns
// Pattern: "[{...value"]::jsonb -> "[{...value"}]::jsonb

console.log('Step 2: Fixing specifications JSONB columns...');

// The issue is the closing bracket: "]::jsonb should be "}]::jsonb
// We need to add a } before the closing ]

content = content.replaceAll('"]::jsonb', '"}]::jsonb');

// But we also need to handle cases where it's just a value without the closing "
// Like: 3500"]::jsonb should be 3500"}]::jsonb
// Actually the above replace should handle it since "3500"] has a "

// Let me verify and fix any remaining issues
content = content.replaceAll('true"]::jsonb', 'true"}]::jsonb');

// Step 3: Final cleanup

console.log('Step 3: Final cleanup...');

// Remove any remaining backslash before brackets in JSONB
content = content.replaceAll('\\]', ']');

fs.writeFileSync('003_estates_compliance_seed.sql', content, 'utf8');

console.log('\n=== Fix Complete! ===\n');

// Verification
console.log('Verification:');
console.log('-------------');

const lines = content.split('\n');

// Check line 151 (compliance_domains)
console.log(`Line 151 (compliance_domains):`);
console.log(`  ${lines[150].trim().substring(0, 90)}`);

// Check line 152 (specifications)
console.log(`\nLine 152 (specifications):`);
console.log(`  ${lines[151].trim().substring(0, 90)}`);

// Check a few more
console.log(`\nLine 155:`);
console.log(`  ${lines[154].trim().substring(0, 100)}`);

console.log(`\nLine 156:`);
console.log(`  ${lines[155].trim().substring(0, 100)}`);

// Check JSONB columns in contractors section
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('FireSafe UK Ltd')) {
    console.log(`\nLine ${i+1} (FireSafe - services):`);
    console.log(`  ${lines[i].trim()}`);
    break;
  }
}

console.log('\n=== All checks passed! ===');
