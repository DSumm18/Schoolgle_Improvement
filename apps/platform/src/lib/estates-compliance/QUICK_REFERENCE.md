# Findings Classification System - Quick Reference Guide

## Import the Components

```typescript
// Display findings with classification
import { FindingsList } from '@/components/estates-compliance/FindingsList';

// Upload and analyze contractor reports
import { ContractorReportAnalyzer } from '@/components/estates-compliance/ContractorReportAnalyzer';

// Classification functions
import {
  classifyFinding,
  getRequirementsByDomain,
  getRequirementsByClassification,
  searchRequirements,
  formatClassification,
  getClassificationColor,
  getClassificationBadgeClasses,
  type Finding,
  type FindingClassification,
  type FindingDomain
} from '@/lib/estates-compliance/findings-database';
```

## Basic Usage

### Classify a Single Finding

```typescript
const result = classifyFinding(
  'Cold water temperature exceeds 20°C limit',
  'legionella'
);

console.log(result.classification); // 'statutory'
console.log(result.source); // 'HSE L8 para 157'
console.log(result.confidence); // 0.95
console.log(result.severity); // 'high'
console.log(result.explanation); // 'Statutory requirement from HSE L8 ACoP...'
```

### Display Findings

```typescript
const findings: Finding[] = [
  {
    id: '1',
    severity: 'high',
    description: 'Cold water temperature exceeds 20°C',
    action_required: 'Investigate and remediate',
    classification: 'statutory',
    source: 'HSE L8 para 157',
    source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
    confidence: 0.95,
    explanation: 'Statutory requirement from ACoP'
  }
];

<FindingsList
  findings={findings}
  onApprove={(id) => console.log('Approved:', id)}
  onDecline={(id) => console.log('Declined:', id)}
  onDefer={(id, date) => console.log('Deferred:', id, 'until:', date)}
/>
```

### Upload and Analyze Report

```typescript
<ContractorReportAnalyzer
  onFindingsExtracted={(findings) => {
    console.log('Extracted:', findings.length, 'findings');
  }}
  onExportToActionPlan={(findings) => {
    // Send to backend to create tasks/budget items
    fetch('/api/estates-compliance/create-tasks', {
      method: 'POST',
      body: JSON.stringify({ findings })
    });
  }}
  organizationId="org-123"
/>
```

## API Endpoints

### Extract Text from File

```typescript
// POST /api/estates-compliance/extract-text
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/estates-compliance/extract-text', {
  method: 'POST',
  body: formData
});

const { text, fileName, textLength } = await response.json();
```

### Analyze Findings from Text

```typescript
// POST /api/estates-compliance/analyze-findings
const response = await fetch('/api/estates-compliance/analyze-findings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Contractor report text...',
    domain: 'legionella' // optional
  })
});

const { findings, processingTime } = await response.json();
```

## Classification Colors

Use these colors in your UI:

```typescript
const colors = {
  statutory: 'red',      // 🔴 Legal requirement
  good_practice: 'amber', // 🟡 Recommended
  contractor_suggestion: 'blue' // 🔵 Optional
};

// Tailwind classes for badges
const badgeClasses = {
  statutory: 'bg-red-100 text-red-800 border-red-200',
  good_practice: 'bg-amber-100 text-amber-800 border-amber-200',
  contractor_suggestion: 'bg-blue-100 text-blue-800 border-blue-200'
};
```

## Helper Functions

### Get Requirements by Domain

```typescript
const legionellaReqs = getRequirementsByDomain('legionella');
const fireReqs = getRequirementsByDomain('fire');
```

### Get Requirements by Classification

```typescript
const statutoryReqs = getRequirementsByClassification('statutory');
const goodPracticeReqs = getRequirementsByClassification('good_practice');
```

### Search Requirements

```typescript
const tempResults = searchRequirements('temperature');
const hseResults = searchRequirements('HSE L8');
```

### Format for Display

```typescript
formatClassification('statutory'); // 'Statutory Required'
formatClassification('good_practice'); // 'Good Practice'
formatClassification('contractor_suggestion'); // 'Contractor Suggestion'

getClassificationColor('statutory'); // 'red'
getClassificationBadgeClasses('statutory'); // Tailwind badge classes
```

## Supported Domains

```typescript
type FindingDomain =
  | 'legionella'      // Water system monitoring
  | 'fire'            // Fire safety
  | 'asbestos'        // Asbestos management
  | 'electrical'      // Electrical safety
  | 'gas'             // Gas safety
  | 'water'           // Drinking water quality
  | 'mechanical'      // Heating & ventilation
  | 'lifts'           // Lifts & LOLER
  | 'playground'      // Playground equipment
  | 'accessibility'   // Accessibility
  | 'security'        // Security systems
  | 'manual_handling' // Manual handling
  | 'working_at_height'; // Working at height
```

## Classification Rules

1. **Statutory Required** (`'statutory'`):
   - Primary legislation (RRO 2005, CAR 2012, etc.)
   - ACoP documents (HSE L8)
   - Has legal force, non-compliance = prosecution

2. **Good Practice** (`'good_practice'`):
   - HSE guidance (HSE HSG274)
   - British Standards (BS5839, BS5306)
   - Recommended but not legally required

3. **Contractor Suggestion** (`'contractor_suggestion'`):
   - Not found in regulations or guidance
   - Optional improvements
   - No legal consequence for declining

## Finding Structure

```typescript
interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  action_required: string;
  classification?: FindingClassification;
  source?: string;              // e.g., "HSE L8 para 157"
  source_url?: string;          // Link to legislation
  estimated_cost?: number;      // In GBP
  suggested_action?: string;
  confidence?: number;          // 0-1
  explanation?: string;         // Why classified this way
  rawText?: string;            // Original text from report
  status?: 'pending' | 'approved' | 'declined' | 'deferred';
  deferredUntil?: string;      // ISO date string
}
```

## Demo Page

Navigate to `/estates-compliance/findings` to see:
- Educational banners explaining the problem/solution
- Demo findings with real examples
- Upload functionality for contractor reports
- Decision support modals

## Environment Variables Required

```bash
# For AI analysis
OPENROUTER_API_KEY=sk-or-...  # or
OPENAI_API_KEY=sk-...
```

## Testing

```bash
# Run unit tests
npm test findings-database.test.ts

# View demo page
npm run dev
# Navigate to http://localhost:3000/estates-compliance/findings
```

## Common Patterns

### Check if Finding is Statutory

```typescript
if (finding.classification === 'statutory') {
  // Must do - legal requirement
  priority = 'critical';
} else if (finding.classification === 'good_practice') {
  // Should do - recommended
  priority = 'medium';
} else {
  // Nice to have - optional
  priority = 'low';
}
```

### Calculate Total Cost by Classification

```typescript
const statutoryCost = findings
  .filter(f => f.classification === 'statutory')
  .reduce((sum, f) => sum + (f.estimated_cost || 0), 0);

const goodPracticeCost = findings
  .filter(f => f.classification === 'good_practice')
  .reduce((sum, f) => sum + (f.estimated_cost || 0), 0);

const optionalCost = findings
  .filter(f => f.classification === 'contractor_suggestion')
  .reduce((sum, f) => sum + (f.estimated_cost || 0), 0);
```

### Filter for High-Confidence Statutory Findings

```typescript
const criticalStatutory = findings.filter(f =>
  f.classification === 'statutory' &&
  (f.confidence || 0) >= 0.8 &&
  ['critical', 'high'].includes(f.severity)
);
```

### Group Findings by Classification

```typescript
const grouped = findings.reduce((acc, finding) => {
  const key = finding.classification || 'unknown';
  if (!acc[key]) acc[key] = [];
  acc[key].push(finding);
  return acc;
}, {} as Record<FindingClassification, Finding[]>);

// Result:
// {
//   statutory: [finding1, finding2],
//   good_practice: [finding3, finding4],
//   contractor_suggestion: [finding5, finding6]
// }
```

## Troubleshooting

**Problem**: Classification confidence is low
**Solution**: The finding doesn't match known requirements. Review manually and consider adding to database.

**Problem**: Wrong classification
**Solution**: Check the source. ACoP (HSE L8) = statutory, Guidance (HSE HSG274) = good practice.

**Problem**: API returns error
**Solution**: Check OPENROUTER_API_KEY is set and has access to deepseek/deepseek-chat model.

## Further Reading

- `FINDINGS_CLASSIFICATION_README.md` - Full build summary
- `ARCHITECTURE.md` - System architecture diagrams
- `statutory-vs-good-practice.md` - Business requirements (in docs/)
