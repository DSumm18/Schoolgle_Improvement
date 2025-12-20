# Phase 2 Schema Refinement: Individual Scores in Pulse Checks

## Issue Identified

The original `pulse_checks` design stored only aggregated results, which prevented tracking progress of specific cohorts (e.g., closing the gap for disadvantaged pupils).

## Solution

Refined the schema to store **individual anonymous scores** while maintaining privacy compliance.

---

## Schema Changes

### Updated `pulse_checks.results` Structure

**Before** (aggregated only):
```json
{
  "avg_score": 85,
  "participation_rate": 90,
  "cohort_size": 12
}
```

**After** (individual scores + summary):
```json
{
  "summary": {
    "average": 75.5,
    "participation": 100,
    "cohort_size": 12,
    "score_distribution": {"0-50": 1, "51-70": 2, "71-85": 5, "86-100": 4},
    "improvement_from_baseline": 12.5
  },
  "individual_scores": [
    {"student_id": "uuid-1", "score": 80, "characteristics": ["pp"]},
    {"student_id": "uuid-2", "score": 45, "characteristics": ["send", "pp"]},
    {"student_id": "uuid-3", "score": 92, "characteristics": ["high_prior"]}
  ]
}
```

### Key Privacy Features

1. **Anonymous IDs**: `student_id` references `students.id` (which links to `upn_hash`, not PII)
2. **No Names**: No pupil names or UPNs stored
3. **Characteristics Optional**: Can include characteristics (e.g., `['pp', 'send']`) for cohort-specific analysis
4. **GDPR Compliant**: Maintains privacy while enabling granular tracking

---

## Tool Updates

### `analyze_cohort_impact` Enhancements

**New Capabilities:**

1. **Individual Score Analysis**
   - Calculates trends from individual scores (more accurate than summary averages)
   - Tracks students across multiple pulse checks
   - Calculates average improvement for students present in both first and last checks

2. **Cohort-Specific Analysis**
   - **PP Pupils**: Tracks disadvantaged pupils separately
     - Calculates average score change
     - Identifies trend (improving/declining/stable)
     - Reports student count
   - **SEND Pupils**: Similar analysis for SEND pupils
   - Extensible to other characteristics

3. **Enhanced Recommendations**
   - Includes cohort-specific insights
   - Example: "Notably, disadvantaged pupils (PP) showed strong improvement (+8.5 points)"
   - Alerts when specific cohorts are not making progress

### Example Output

```typescript
{
  overallImpact: {
    avgScoreChange: 7.2,  // Calculated from individual scores
    recommendation: "Strong positive impact observed. Notably, disadvantaged pupils (PP) showed strong improvement (+8.5 points)."
  },
  cohortSpecificAnalysis: {
    ppPupils: {
      avgScoreChange: 8.5,
      studentCount: 6,
      trend: "improving"
    },
    sendPupils: {
      avgScoreChange: 4.2,
      studentCount: 3,
      trend: "improving"
    }
  }
}
```

---

## Database Function Updates

### `calculate_cohort_impact()` Function

Updated to use new `results` structure:
- Accesses `results->'summary'->>'average'` instead of `results_summary->>'avg_score'`
- Counts individual scores: `jsonb_array_length(results->'individual_scores')`

---

## Benefits

1. **Granular Tracking**: Track individual student progress over time (by anonymous ID)
2. **Cohort Analysis**: Calculate trends for specific subgroups (PP, SEND, etc.)
3. **Gap Closing**: Identify if disadvantaged pupils are closing the gap
4. **Privacy Maintained**: No PII stored, only anonymous UUIDs
5. **Backward Compatible**: Summary data still available for quick overview

---

## Migration Notes

The migration file has been updated:
- `pulse_checks.results` column renamed from `results_summary` to `results`
- Structure documented with comprehensive JSON schema
- Helper function `calculate_cohort_impact()` updated

**Existing Data**: If you have existing `pulse_checks` with old structure, you'll need to migrate:
- Move `results_summary` data to `results.summary`
- Add `results.individual_scores` array (can be empty initially)

---

## Usage Example

### Creating a Pulse Check with Individual Scores

```typescript
{
  intervention_id: "uuid",
  date: "2025-02-15",
  topic: "Phonics Phase 3",
  results: {
    summary: {
      average: 75.5,
      participation: 100,
      cohort_size: 12
    },
    individual_scores: [
      { student_id: "student-uuid-1", score: 80, characteristics: ["pp"] },
      { student_id: "student-uuid-2", score: 45, characteristics: ["send", "pp"] },
      { student_id: "student-uuid-3", score: 92, characteristics: ["high_prior"] }
    ]
  }
}
```

### Analyzing Impact

The `analyze_cohort_impact` tool will:
1. Extract individual scores from all pulse checks
2. Match students across checks (by `student_id`)
3. Calculate improvement for each student
4. Group by characteristics (PP, SEND, etc.)
5. Provide cohort-specific insights

---

**Refinement Complete** ✅

The schema now supports granular cohort-level analysis while maintaining strict privacy compliance.

