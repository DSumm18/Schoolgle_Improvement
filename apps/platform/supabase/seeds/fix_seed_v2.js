const fs = require('fs');

let content = fs.readFileSync('003_estates_compliance_seed.sql', 'utf8');

console.log('Fixing seed file...\n');

// The file has been corrupted. Let's fix it step by step.

// PROBLEM 1: compliance_domains has format: ["domain"\] and should be {"domain"}
// PROBLEM 2: specifications JSONB columns have wrong format

// Fix strategy:
// 1. Process each line individually
// 2. Identify which column we're in based on patterns
// 3. Apply appropriate fixes

const lines = content.split('\n');
const fixedLines = lines.map(line => {
  // Skip empty lines and comments
  if (!line.trim() || line.trim().startsWith('--')) {
    return line;
  }

  // Pattern 1: compliance_domains columns
  // These look like: '["domain1", "domain2"\],
  // Should be: '{"domain1", "domain2"},

  // Match: '["...."\] or '["...."\} (with space or comma after)
  if (line.includes("'[")) {
    // This is a compliance_domains column
    // Replace '[" with '{
    let newLine = line.replace(/'\[/g, '{"');
    // Replace "\] or "\} with "}
    // Actually, the backslash is before the bracket
    newLine = newLine.replace(/"\\],/g, '"},');
    newLine = newLine.replace(/"\\] /g, '"} ');
    newLine = newLine.replace(/"\\]$/g, '"}');

    // Also handle case where closing bracket is at end before comma without space
    newLine = newLine.replace(/"\\],$/g, '"},');

    return newLine;
  }

  // Pattern 2: specifications JSONB columns
  // These have ::jsonb at the end
  // They might have wrong closing brackets

  if (line.includes('::jsonb')) {
    // Fix the closing: "]::jsonb should be "}]::jsonb
    let newLine = line;

    // Pattern: "..."]::jsonb should be "..."}]::jsonb
    // Look for value followed by "]::jsonb
    newLine = newLine.replace(/(\w+)"]::jsonb/g, '$1"}]::jsonb');
    newLine = newLine.replace(/"(\d+)"]::jsonb/g, '"$1"}]::jsonb');
    newLine = newLine.replace(/true"]::jsonb/g, 'true"}]::jsonb');
    newLine = newLine.replace(/"ground"]::jsonb/g, '"ground"}]::jsonb');
    newLine = newLine.replace(/"first"]::jsonb/g, '"first"}]::jsonb');
    newLine = newLine.replace(/"basement"]::jsonb/g, '"basement"}]::jsonb');
    newLine = newLine.replace(/"roof"]::jsonb/g, '"roof"}]::jsonb');

    // More generic: last "value"]::jsonb pattern
    const match = newLine.match(/"([^"]+)"]::jsonb/);
    if (match) {
      newLine = newLine.replace(/"\\"[^"]+\\"]::jsonb/, match[1] + '"}]::jsonb');
    }

    return newLine;
  }

  return line;
});

content = fixedLines.join('\n');

// Now do more targeted fixes for the specifications columns

console.log('Applying targeted fixes...');

// Fix specifications columns more carefully
// Pattern: '[{"key": "value"]::jsonb should be '[{"key": "value"}]::jsonb

// Use a more comprehensive regex
content = content.replace(
  /(\\"\\w+\\": \\"[^"]*\\")"]::jsonb/g,
  '$1"}]::jsonb'
);

content = content.replace(
  /(\\"\\w+\\": \\d+)"]::jsonb/g,
  '$1"}]::jsonb'
);

content = content.replace(
  /(\\"\\w+\\": true)"]::jsonb/g,
  '$1"}]::jsonb'
);

fs.writeFileSync('003_estates_compliance_seed.sql', content, 'utf8');

console.log('Done! Let me verify a few lines...\n');

// Verify
const verifyLines = content.split('\n');
console.log('Line 151:', verifyLines[150].substring(0, 100));
console.log('Line 152:', verifyLines[151].substring(0, 100));
console.log('Line 155:', verifyLines[154].substring(0, 100));
