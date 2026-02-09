const fs = require('fs');

let content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');

console.log('=== Fixing estates_assets section ===\n');

const lines = content.split('\n');
let inAssetsSection = false;
let inContractorsSection = false;
let fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Track which section we're in
  if (line.includes('-- B. ASSETS') || line.includes('-- A. CONTRACTORS')) {
    inAssetsSection = line.includes('-- B. ASSETS');
    inContractorsSection = line.includes('-- A. CONTRACTORS');
    fixedLines.push(line);
    continue;
  }

  // Skip if not in assets section
  if (!inAssetsSection || inContractorsSection) {
    fixedLines.push(line);
    continue;
  }

  // Fix compliance_domains columns in assets section
  // These are standalone values like: ["domain", ...]
  // They should be: '{"domain", ...}'

  let fixedLine = line;

  // Check if this line contains compliance_domains data
  // Pattern: starts with space followed by [ and contains domain names
  if (line.trim().startsWith('[') && (line.includes(',') || line.includes('\\"'))) {
    // This is a compliance_domains value
    // Simple approach: just replace [ with { and add single quotes

    let newLine = line.trim();
    // Replace leading [ with {
    if (newLine.startsWith('[')) {
      newLine = '{' + newLine.slice(1);
    }
    // Replace trailing ] or ], with },
    if (newLine.endsWith('],')) {
      newLine = newLine.slice(0, -2) + '},';
    } else if (newLine.endsWith(']')) {
      newLine = newLine.slice(0, -1) + '}';
    }
    // Wrap in single quotes
    fixedLine = ' \'' + newLine + '\' ';
  }

  // Fix specifications columns in assets section
  // Pattern: {"{... should be '[{...
  // Pattern: ..."}]::jsonb is correct
  // Pattern: ..."]::jsonb should be ..."}]::jsonb

  if (fixedLine.includes('::jsonb')) {
    // Fix double opening brace
    fixedLine = fixedLine.replace('{"{', '[{');

    // Fix missing closing brace before ]
    fixedLine = fixedLine.replace('"]::jsonb', '"}]::jsonb');
    fixedLine = fixedLine.replace('true"]::jsonb', 'true"}]::jsonb');
  }

  fixedLines.push(fixedLine);
}

content = fixedLines.join('\n');

fs.writeFileSync('003_estates_compliance_seed.sql', content, 'utf8');

console.log('Done!\n');

// Verify
console.log('Verification:');
const newLines = content.split('\n');
console.log(`Line 151: ${newLines[150].trim().substring(0, 100)}`);
console.log(`Line 152: ${newLines[151].trim().substring(0, 100)}`);
console.log(`Line 155: ${newLines[154].trim().substring(0, 100)}`);
console.log(`Line 156: ${newLines[155].trim().substring(0, 100)}`);
