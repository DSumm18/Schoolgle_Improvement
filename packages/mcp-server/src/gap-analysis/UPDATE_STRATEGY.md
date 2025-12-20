# Gap Analysis Engine - Update Strategy

## How to Incorporate Inspection Learning Without Code Changes

### Overview

The gap analysis engine is designed to adapt to inspection learning and framework updates through **data changes only**. No code deployments required.

---

## Update Scenarios

### 1. Framework Changes (e.g., Ofsted Nov 2025 → Dec 2025)

**Scenario:** Ofsted publishes updated framework guidance.

**Steps:**

1. **Add new framework expectations:**
   ```sql
   INSERT INTO framework_expectations (
     framework, area_key, area_name, description,
     risk_weight, authority_level, version, effective_date,
     source, source_url
   ) VALUES (
     'ofsted', 'curriculum_intent', 'Curriculum Intent',
     'The design and ambition of the curriculum...',
     'high', 'guidance', '2.0', '2025-12-01',
     'ofsted', 'https://www.gov.uk/...'
   );
   ```

2. **Mark old version inactive:**
   ```sql
   UPDATE framework_expectations
   SET is_active = false, superseded_by = '<new_id>'
   WHERE framework = 'ofsted'
     AND area_key = 'curriculum_intent'
     AND version = '1.0';
   ```

3. **Result:** Gap analysis automatically uses new version (active, effective_date <= today)

**No code changes required.**

---

### 2. Inspection Learning (Post-Christmas Learning, Inspector Trends)

**Scenario:** "Inspectors are now focusing more on X" or "Evidence of Y is now expected."

**Steps:**

1. **Add new evidence requirement:**
   ```sql
   INSERT INTO evidence_requirements (
     framework_expectation_id, evidence_type,
     mandatory, recency_months, min_quantity,
     source, effective_date
   ) VALUES (
     '<expectation_id>', 'pupil_voice',
     false, 6, 1, -- Optional but recommended, within 6 months
     'inspection_learning', CURRENT_DATE
   );
   ```

2. **Or update existing requirement:**
   ```sql
   -- Mark old requirement inactive
   UPDATE evidence_requirements
   SET is_active = false, superseded_by = '<new_id>'
   WHERE id = '<old_requirement_id>';

   -- Add new requirement with updated recency
   INSERT INTO evidence_requirements (
     framework_expectation_id, evidence_type,
     mandatory, recency_months, min_quantity,
     source, effective_date
   ) VALUES (
     '<expectation_id>', 'lesson_plan',
     true, 3, 2, -- Now mandatory, within 3 months, minimum 2
     'inspection_learning', CURRENT_DATE
   );
   ```

3. **Result:** Next gap analysis run includes new requirements

**No code changes required.**

---

### 3. EEF/DfE Updates

**Scenario:** EEF publishes new research or DfE updates guidance.

**Steps:**

1. **Add evidence requirement linked to EEF strategy:**
   ```sql
   INSERT INTO evidence_requirements (
     framework_expectation_id, evidence_type,
     mandatory, recency_months, min_quantity,
     notes, source, source_url
   ) VALUES (
     '<expectation_id>', 'assessment_data',
     false, 12, 1,
     'EEF recommends regular assessment to track progress. Consider including data from termly assessments.',
     'eef', 'https://educationendowmentfoundation.org.uk/...'
   );
   ```

2. **Result:** Gap analysis includes EEF-backed requirements

**No code changes required.**

---

### 4. Framework Description Updates

**Scenario:** Need to update description text (e.g., clarify language, add context).

**Steps:**

1. **Add new version with updated description:**
   ```sql
   INSERT INTO framework_expectations (
     framework, area_key, area_name, description,
     risk_weight, authority_level, version, effective_date,
     source, source_url
   ) VALUES (
     'ofsted', 'curriculum_intent', 'Curriculum Intent',
     'Updated description with clearer language...',
     'high', 'guidance', '1.1', CURRENT_DATE, -- Minor version bump
     'ofsted', 'https://www.gov.uk/...'
   );
   ```

2. **Mark old version inactive:**
   ```sql
   UPDATE framework_expectations
   SET is_active = false, superseded_by = '<new_id>'
   WHERE id = '<old_id>';
   ```

3. **Result:** Gap analysis uses updated description

**No code changes required.**

---

## Update Workflow (Recommended)

### For Framework Updates:

1. **Review:** Identify what changed in framework
2. **Version:** Determine version number (major.minor.patch)
3. **Add:** Insert new rows with `effective_date = publication_date`
4. **Deactivate:** Mark old rows `is_active = false`, link via `superseded_by`
5. **Test:** Run gap analysis on test school to verify
6. **Monitor:** Check `review_by_date` to ensure timely updates

### For Inspection Learning:

1. **Source:** Document where learning came from (inspector feedback, Ofsted blog, consultant)
2. **Impact:** Determine which `framework_expectation_id` it affects
3. **Add:** Insert new `evidence_requirements` row with `source = 'inspection_learning'`
4. **Effective:** Set `effective_date = today` (immediate effect)
5. **Notify:** Schools see updated requirements on next gap analysis

---

## Versioning Strategy

### Semantic Versioning:

- **Major (X.0.0):** Framework overhaul (e.g., Ofsted Nov 2025 → Dec 2025)
- **Minor (X.Y.0):** New areas added or significant description changes
- **Patch (X.Y.Z):** Minor clarifications or typo fixes

### Lifecycle Management:

- `effective_date`: When version becomes active
- `review_by_date`: When version should be reviewed (e.g., 12 months)
- `is_active`: Boolean flag (only active versions used)
- `superseded_by`: Links to newer version (for audit trail)

---

## Data Migration Example

### Migrating from Ofsted 1.0 to 2.0:

```sql
-- Step 1: Add new framework expectations (v2.0)
INSERT INTO framework_expectations (...)
SELECT 
  framework, area_key, area_name,
  -- Updated descriptions
  CASE 
    WHEN area_key = 'curriculum_intent' THEN 'Updated description...'
    ELSE description
  END,
  risk_weight, authority_level,
  '2.0' as version,
  '2025-12-01' as effective_date,
  source, source_url
FROM framework_expectations
WHERE framework = 'ofsted' AND version = '1.0' AND is_active = true;

-- Step 2: Link old to new
UPDATE framework_expectations old
SET is_active = false, superseded_by = new.id
FROM framework_expectations new
WHERE old.framework = 'ofsted' 
  AND old.version = '1.0'
  AND new.framework = 'ofsted'
  AND new.version = '2.0'
  AND old.area_key = new.area_key;

-- Step 3: Migrate evidence requirements
INSERT INTO evidence_requirements (
  framework_expectation_id, evidence_type, mandatory, recency_months, ...
)
SELECT 
  new.id as framework_expectation_id,
  er.evidence_type, er.mandatory, er.recency_months, ...
FROM evidence_requirements er
JOIN framework_expectations old ON er.framework_expectation_id = old.id
JOIN framework_expectations new ON old.area_key = new.area_key
WHERE old.framework = 'ofsted' AND old.version = '1.0'
  AND new.framework = 'ofsted' AND new.version = '2.0'
  AND er.is_active = true;
```

---

## Rollback Strategy

If an update causes issues:

1. **Deactivate new version:**
   ```sql
   UPDATE framework_expectations
   SET is_active = false
   WHERE version = '2.0' AND framework = 'ofsted';
   ```

2. **Reactivate old version:**
   ```sql
   UPDATE framework_expectations
   SET is_active = true, superseded_by = NULL
   WHERE version = '1.0' AND framework = 'ofsted';
   ```

3. **Result:** Gap analysis reverts to previous version

**No code changes required.**

---

## Operational Notes

### Who Can Update:

- **Framework updates:** Product team / content team (with approval)
- **Inspection learning:** Product team / consultants (documented source)
- **EEF/DfE updates:** Product team (with source URL)

### Update Frequency:

- **Framework changes:** As published (quarterly/annual)
- **Inspection learning:** Monthly (as feedback emerges)
- **EEF/DfE updates:** Quarterly (as research published)

### Quality Assurance:

1. **Review:** All updates reviewed by product team
2. **Test:** Run gap analysis on test school before production
3. **Monitor:** Track `review_by_date` to ensure timely updates
4. **Document:** Source URL and section reference for all updates

---

## Summary

**Key Principle:** All updates are **data changes only**. No code deployments required.

**Benefits:**
- ✅ Fast updates (minutes, not days)
- ✅ No downtime
- ✅ Easy rollback
- ✅ Version history preserved
- ✅ Audit trail via `superseded_by` links

**Update Process:**
1. Add new rows (new version)
2. Mark old rows inactive
3. Link via `superseded_by`
4. Schools see updates on next gap analysis

**No code changes required.**


