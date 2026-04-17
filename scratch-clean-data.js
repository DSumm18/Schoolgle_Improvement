const fs = require('fs');

let file = fs.readFileSync('apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx', 'utf8');

// Replace the massive DEFAULT_DATA
file = file.replace(/const DEFAULT_DATA = \{[\s\S]*?^  \}\n\};/m, 'const DEFAULT_DATA = {};');

// Replace DEFAULT_SCHOOLS
file = file.replace(/const DEFAULT_SCHOOLS = \[.*?\];/, 'const DEFAULT_SCHOOLS = [];');
file = file.replace(/const DEFAULT_SCHOOL_NAMES = \{.*?\};/, 'const DEFAULT_SCHOOL_NAMES = {};');

// Find the start of the content rendering and insert an empty state if SCHOOLS.length === 0
const targetNav = `{YEAR_GROUPS.map(yg => (`;
// We will put the empty check right after the header! No, the tabs should be hidden too.
const renderPattern = `<div style={styles.nav}>`;
const emptyState = `
      {SCHOOLS.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#fdfdfd', border: '1px dashed #e2e8f0', borderRadius: '12px', marginTop: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>No Data Connected</h2>
          <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '400px', margin: '0 auto' }}>
            This dashboard is currently empty. Please use the Connector in the top right to import a Google Drive spreadsheet containing your Trust's template data.
          </p>
        </div>
      ) : (
      <>
      <div style={styles.nav}>
`;

file = file.replace(renderPattern, emptyState);

// Append the closing tags at the very bottom
// The file bottom is:
/*
      </div>
    </div>
  );
}
*/
const bottomPattern = `      </div>
    </div>
  );
}`;

const newBottom = `        </div>
      </>
      )}
    </div>
  );
}`;
file = file.replace(bottomPattern, newBottom);

// Also need to fix the first time `bottomPattern` appears ? 
// The bottom pattern is uniquely the end of the file. Wait, let me replace using regex for safety.
file = file.replace(/      <\/div>\n    <\/div>\n  \);\n\}$/, newBottom);

fs.writeFileSync('apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx', file);
console.log("Cleaned!");
