# Gap Analysis Engine - Design

## Core Principles

### 1. Framework-Agnostic Taxonomy

**Problem:** Hardcoding "Ofsted expects..." or "SIAMS requires..." creates:
- Brittle updates (code changes for framework changes)
- Framework-specific assumptions that break when new frameworks emerge
- Judgemental language that sounds authoritative

**Solution:** Internal stable taxonomy that maps to frameworks, not frameworks themselves.

**Model:**
```
framework_expectations
├── framework: 'ofsted' | 'siams' | 'csi' | 'isi' | ...
├── area_key: 'curriculum_intent' | 'safeguarding_culture' | ...
├── description: Plain English, framework-neutral
└── authority_level: 'statutory' | 'guidance' | 'best_practice'
```

**Example:**
- `area_key: 'curriculum_intent'` maps to:
  - Ofsted: "Curriculum Intent" subcategory
  - SIAMS: "Wisdom, Knowledge and Skills" strand
  - Future framework: Whatever they call it

**Benefits:**
- Update framework descriptions without code changes
- Add new frameworks by adding rows (no schema changes)
- Stable `area_key` enables cross-framework analysis

### 2. Evidence Requirements as Data, Not Code

**Problem:** Hardcoding "You need 3 lesson plans, 2 book looks, 1 pupil voice" in code means:
- Updates require deployments
- Cannot adapt to inspection learning (e.g., "Inspectors now focus on X")
- Cannot personalize per school context

**Solution:** Evidence requirements stored as data with versioning.

**Model:**
```
evidence_requirements
├── framework_expectation_id → links to expectation
├── evidence_type: 'lesson_plan' | 'book_look' | 'pupil_voice' | 'policy' | ...
├── mandatory: boolean
├── recency_months: integer (e.g., 12 = must be within 12 months)
└── notes: Advisory guidance (not "must have")
```

**Update Strategy:**
- Post-inspection learning: Add new `evidence_requirements` row with `effective_date = today`
- Old requirements remain (for historical context) but marked `is_active = false`
- Schools see updated requirements immediately (no code deploy)

### 3. Advisory Language Enforcement

**Problem:** "You must have X" sounds authoritative and creates liability.

**Solution:** Language rules enforced at output time, not stored in data.

**Language Rules:**
- If `authority_level = 'statutory'`: "Statutory requirement: [description]"
- If `authority_level = 'guidance'`: "Guidance suggests: [description]"
- If `authority_level = 'best_practice'`: "Best practice indicates: [description]"

**Gap Status Language:**
- `status = 'missing'`: "No evidence found for [area]. Consider providing [evidence_type]."
- `status = 'outdated'`: "Evidence exists but is older than recommended. Consider updating [evidence_type]."
- `status = 'weak'`: "Evidence present but coverage is limited. Consider strengthening [evidence_type]."

**Never:**
- "You must..."
- "You are required to..."
- "Ofsted will fail you if..."

**Always:**
- "Consider..."
- "Guidance suggests..."
- "Evidence indicates..."

### 4. Update-Ready Architecture

**How Updates Work Without Code Changes:**

1. **Framework Changes (e.g., Ofsted Nov 2025 → Dec 2025):**
   - Add new `framework_expectations` rows with `version = '2'`, `effective_date = '2025-12-01'`
   - Mark old rows `is_active = false`
   - Gap analysis automatically uses latest active version

2. **Inspection Learning (e.g., "Inspectors now focus on X"):**
   - Add new `evidence_requirements` row with `source = 'inspection_learning'`, `effective_date = today`
   - Update `framework_expectations.description` if needed
   - Schools see updated expectations on next gap analysis run

3. **EEF/DfE Updates:**
   - Add new `evidence_requirements` with `source = 'eef'` or `source = 'dfe'`
   - Link to `framework_expectation_id`
   - Automatically included in gap analysis

**Versioning Strategy:**
- `version` field: Semantic versioning (e.g., '1.0', '1.1', '2.0')
- `effective_date`: When this version becomes active
- `review_by_date`: When this version should be reviewed
- `is_active`: Boolean flag (only active versions used in gap analysis)

### 5. Risk-Weighted Scoring

**Problem:** Not all gaps are equal. Missing safeguarding evidence is higher risk than missing a book look.

**Solution:** Risk-weighted scoring based on `risk_weight` field.

**Risk Levels:**
- `high`: Critical gaps (e.g., safeguarding, statutory requirements)
- `medium`: Important gaps (e.g., curriculum coverage)
- `low`: Nice-to-have gaps (e.g., enrichment evidence)

**Scoring Logic:**
```
gap_score = base_score * risk_multiplier

base_score:
  - missing: 100
  - outdated: 50
  - weak: 25
  - present: 0

risk_multiplier:
  - high: 3.0
  - medium: 1.5
  - low: 1.0
```

**Output:**
- Priority gaps sorted by `gap_score` descending
- Calm language: "High-priority gap: [area]. Consider addressing this first."

### 6. Evidence Assessment (No File Content)

**Constraint:** Cannot read file content (privacy, performance, cost).

**Solution:** Use existing document metadata only.

**Metadata Available:**
- `documents.name` (filename)
- `documents.folder_path` (folder structure)
- `documents.file_type` (PDF, DOCX, etc.)
- `documents.scanned_at` (when scanned)
- `evidence_matches.framework_type`, `category_id`, `subcategory_id` (AI-matched)
- `evidence_matches.confidence` (AI confidence score)

**Assessment Logic:**
1. **Presence:** Does `evidence_matches` have a match for this `framework_expectation_id`?
2. **Recency:** Is `documents.scanned_at` within `recency_months`?
3. **Coverage:** Does `evidence_matches.confidence` meet threshold (e.g., > 0.7)?
4. **Type Match:** Does `evidence_matches` indicate correct `evidence_type`?

**Limitations:**
- Cannot verify file content quality (only metadata)
- Confidence based on AI matching (may have false positives/negatives)
- Requires schools to scan documents first

**Mitigation:**
- `confidence_score` field indicates assessment reliability
- `notes` field explains assessment reasoning
- Schools can manually override via UI (future)

### 7. Framework-Agnostic Output

**Output Structure:**
```typescript
{
  framework: 'ofsted' | 'siams' | ...
  analyzed_at: ISO timestamp
  overall_readiness_score: 0-100
  areas_analyzed: number
  gaps_found: number
  priority_gaps: Array<{
    area_key: string
    area_name: string
    status: 'missing' | 'outdated' | 'weak'
    risk_weight: 'high' | 'medium' | 'low'
    gap_score: number
    required_evidence: Array<{
      evidence_type: string
      mandatory: boolean
      status: 'present' | 'missing' | 'outdated'
    }>
    advisory_notes: string[]
  }>
  areas_of_strength: Array<{
    area_key: string
    area_name: string
    evidence_count: number
    last_updated: ISO timestamp
  }>
  next_steps: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string (advisory language)
    area_key: string
  }>
}
```

**Language Rules:**
- All output uses advisory language
- No framework-specific jargon (uses `area_key` internally, `area_name` for display)
- Calm, factual tone (not judgemental)

---

## Summary

**Key Design Decisions:**

1. **Stable Internal Taxonomy:** `area_key` is framework-agnostic, maps to frameworks via data
2. **Data-Driven Requirements:** Evidence requirements stored as data, not code
3. **Versioning & Lifecycle:** `version`, `effective_date`, `review_by_date` enable updates without code
4. **Advisory Language:** Enforced at output time, not stored in data
5. **Risk-Weighted Scoring:** Prioritizes gaps by risk, not just presence
6. **Metadata-Only Assessment:** Uses existing document metadata, no file content reading
7. **Framework-Agnostic Output:** Uses `area_key` internally, `area_name` for display

**Update Strategy:**
- Framework changes: Add new rows, mark old inactive
- Inspection learning: Add new `evidence_requirements`, update descriptions
- No code changes required
- Schools see updates on next gap analysis run

**Scale Readiness:**
- Indexed queries (framework_expectation_id, organization_id)
- Batch processing (analyze multiple areas in one query)
- Cached results (evidence_gap_results table)
- RLS enforced (organization_id isolation)


