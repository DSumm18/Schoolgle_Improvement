# Inspection Narrative - Pilot Readiness Features

## Overview

Pilot readiness features added to `generate_inspection_narrative` tool for production deployment.

## 1. Grounding Metadata

**Purpose**: Track what data was used to generate the narrative (transparency and auditability).

**Added to Response**:
```typescript
grounding_metadata: {
  expectations_count: number;      // Framework expectations analyzed
  requirements_count: number;       // Evidence requirements identified
  gaps_count: number;              // Priority gaps found
  actions_count: number;            // Actions linked
  evidence_count: number;           // Evidence items referenced
  sources_used: string[];          // Deduped list of guidance sources
}
```

**Location**: `InspectionNarrativeResult.grounding_metadata`

**Not included in narrative text** - metadata only, for transparency.

## 2. Deterministic Thresholds

**Purpose**: Prevent LLM calls when data quality is insufficient (cost control + quality assurance).

**Environment Variables**:
- `INSPECTION_NARRATIVE_MIN_GAPS` (default: `1`)
  - Minimum number of priority gaps required
- `INSPECTION_NARRATIVE_MIN_CONFIDENCE` (default: `0.5`)
  - Minimum average confidence score required (0-1 scale)

**Behavior**:
- If thresholds not met → Return `InsufficientDataResult` with `outcome: 'threshold_blocked'`
- **No LLM call** (saves cost)
- Includes threshold details in response

**Example Response**:
```json
{
  "outcome": "threshold_blocked",
  "threshold_details": {
    "min_gaps_required": 3,
    "min_confidence_required": 0.7,
    "actual_gaps": 1,
    "actual_confidence": 0.5
  },
  "message": "Data does not meet minimum thresholds for narrative generation."
}
```

## 3. Pilot Export Helpers

**Purpose**: Export narratives in common formats for pilot testing.

**Functions**:
- `exportNarrativeAsMarkdown(result: InspectionNarrativeResult): string`
- `exportNarrativeAsPlainText(result: InspectionNarrativeResult): string`

**Usage**:
```typescript
import { 
  handleGenerateInspectionNarrative,
  exportNarrativeAsMarkdown,
  exportNarrativeAsPlainText 
} from './inspection-narrative.js';

const result = await handleGenerateInspectionNarrative(args, context);

if ('outcome' in result && result.outcome !== 'success') {
  // Handle insufficient data
} else {
  const markdown = exportNarrativeAsMarkdown(result);
  const plainText = exportNarrativeAsPlainText(result);
  
  // Save to file, send via API, etc.
}
```

**Formats**:
- **Markdown**: Headers, sections, lists, formatting
- **Plain Text**: Simple text with section separators

**Note**: Word/PDF export not yet implemented (future work).

## 4. Enhanced Telemetry

**Added Fields** (in `result.telemetry`):
```typescript
telemetry: {
  used_llm: boolean;
  model?: string;
  token_usage?: {...};
  duration_ms: number;
  grounding_counts: GroundingMetadata;  // NEW
  threshold_blocked: boolean;             // NEW
}
```

**Note**: `grounding_counts` and `threshold_blocked` are in the result object for now. The `TelemetryLog` interface doesn't yet support these fields, so they're not logged to Supabase separately (but are available in the tool response).

## Configuration

### Environment Variables

```bash
# Minimum thresholds (optional, defaults shown)
INSPECTION_NARRATIVE_MIN_GAPS=1
INSPECTION_NARRATIVE_MIN_CONFIDENCE=0.5
```

### Recommended Settings for Pilot

**Conservative (high quality)**:
```bash
INSPECTION_NARRATIVE_MIN_GAPS=3
INSPECTION_NARRATIVE_MIN_CONFIDENCE=0.7
```

**Permissive (more narratives generated)**:
```bash
INSPECTION_NARRATIVE_MIN_GAPS=1
INSPECTION_NARRATIVE_MIN_CONFIDENCE=0.3
```

## Example Usage

```typescript
// Generate narrative
const result = await handleGenerateInspectionNarrative({
  school_id: 'org-123',
  framework: 'ofsted',
  mode: 'inspection_narrative'
}, context);

// Check if successful
if ('outcome' in result) {
  if (result.outcome === 'threshold_blocked') {
    console.log('Threshold blocked:', result.threshold_details);
  }
  // Handle insufficient data
} else {
  // Success - export
  console.log('Grounding metadata:', result.grounding_metadata);
  console.log('Threshold blocked:', result.telemetry.threshold_blocked);
  
  const markdown = exportNarrativeAsMarkdown(result);
  fs.writeFileSync('narrative.md', markdown);
}
```

## Testing

Test cases should verify:
1. Grounding metadata is accurate (counts match input data)
2. Thresholds block LLM calls when data is insufficient
3. Export functions produce valid markdown/plain text
4. Telemetry includes `threshold_blocked: true` when blocked

## Future Work

- [ ] Add Word/PDF export
- [ ] Extend `TelemetryLog` interface to support `grounding_counts` and `threshold_blocked`
- [ ] Add threshold configuration per organization
- [ ] Add export to SEF template format

