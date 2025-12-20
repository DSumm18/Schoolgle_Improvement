# Migration Impact Assessment: Phase 3 Hierarchy (MATs & LAs)

**Date**: 2025-02-02  
**Assessor**: Database Administrator & Risk Assessor  
**Subject**: Pre-Migration Impact Analysis for Parent/Child Organization Hierarchy  
**Risk Level**: **MEDIUM** - Requires careful backfilling and RLS policy updates

---

## Executive Summary

This assessment evaluates the impact of adding a parent/child hierarchy to the `organizations` table to support Multi-Academy Trusts (MATs) and Local Authorities (LAs). The migration will introduce `organization_type` and `parent_organization_id` columns while maintaining backward compatibility with existing data and RLS policies.

**Key Findings**:
- ✅ **Low Risk**: Existing data structure supports safe migration
- ⚠️ **Medium Risk**: RLS policies require recursive logic for Trust users
- ✅ **Low Risk**: Existing school users will NOT lose access (backward compatible)
- ⚠️ **Medium Risk**: Need to preserve `local_authority` column during transition

---

## Task 1: Data Audit

### Current Organizations Table Structure

**Schema** (from `supabase_schema.sql`):
```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  urn text,                    -- Unique Reference Number (DfE)
  school_type text,            -- 'primary', 'secondary', 'special', 'nursery', 'all-through'
  is_church_school boolean default false,
  diocese text,
  local_authority text,        -- ⚠️ CRITICAL: Must NOT delete during migration
  address jsonb,
  settings jsonb default '{}',
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

### Audit Queries Required

**Run these queries in Supabase SQL Editor to assess current state:**

#### 1. Total Row Count
```sql
SELECT COUNT(*) as total_organizations
FROM organizations;
```

**Expected Impact**: 
- If count = 0: **No risk** - Fresh database, safe to migrate
- If count > 0: **Medium risk** - Need backfilling strategy

#### 2. URN Data Population
```sql
SELECT 
  COUNT(*) as total,
  COUNT(urn) as with_urn,
  COUNT(*) - COUNT(urn) as without_urn,
  ROUND(COUNT(urn)::numeric / COUNT(*)::numeric * 100, 2) as urn_population_percent
FROM organizations;
```

**Expected Impact**:
- High URN population (>80%): Good for MAT/LA identification
- Low URN population (<50%): May need manual mapping

#### 3. Duplicate URN Check
```sql
SELECT urn, COUNT(*) as count
FROM organizations
WHERE urn IS NOT NULL
GROUP BY urn
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**Expected Impact**:
- If duplicates found: **HIGH RISK** - Need deduplication strategy
- If no duplicates: **LOW RISK** - Safe to proceed

#### 4. Local Authority Data Population
```sql
SELECT 
  COUNT(*) as total,
  COUNT(local_authority) as with_la,
  COUNT(DISTINCT local_authority) as unique_las,
  local_authority,
  COUNT(*) as orgs_per_la
FROM organizations
WHERE local_authority IS NOT NULL
GROUP BY local_authority
ORDER BY orgs_per_la DESC
LIMIT 10;
```

**Expected Impact**:
- High LA population: Can use for initial MAT/LA grouping
- Low LA population: May need external data source

#### 5. Actions Table Dependency Check
```sql
SELECT 
  COUNT(*) as total_actions,
  COUNT(DISTINCT organization_id) as unique_orgs_with_actions,
  MIN(created_at) as oldest_action,
  MAX(created_at) as newest_action
FROM actions;
```

**Expected Impact**:
- High action count: **CRITICAL** - Must ensure RLS policies maintain access
- Low action count: Lower risk, but still critical

---

## Task 2: Safe Migration Strategy

### Proposed Schema Changes

**New Columns to Add**:
```sql
-- Add organization_type (defaults to 'school' for existing rows)
organization_type text check (organization_type in ('school', 'mat', 'la')) 
  DEFAULT 'school' NOT NULL;

-- Add parent_organization_id (NULL initially for all existing rows)
parent_organization_id uuid references organizations(id) on delete restrict;
```

### Migration Plan (Step-by-Step)

#### Phase 1: Add New Columns (Non-Breaking)

**Step 1.1**: Add `organization_type` column
- ✅ **Safe**: Defaults to 'school' for all existing rows
- ✅ **No Data Loss**: Existing rows automatically backfilled
- ✅ **No Breaking Changes**: All existing queries continue to work

**Step 1.2**: Add `parent_organization_id` column
- ✅ **Safe**: NULL for all existing rows (no foreign key violations)
- ✅ **No Data Loss**: Existing relationships preserved
- ⚠️ **Index Required**: Add index for performance on parent lookups

**Step 1.3**: Add constraints and indexes
- ✅ **Safe**: Constraints only apply to new data
- ✅ **Performance**: Index `parent_organization_id` for recursive queries

#### Phase 2: Preserve Existing Data

**CRITICAL RULE**: **DO NOT DELETE `local_authority` COLUMN**

**Rationale**:
1. May contain data not yet migrated to parent relationships
2. Used by existing queries/reports
3. Provides fallback if parent mapping fails
4. Can be deprecated later after full migration

**Strategy**:
- Keep `local_authority` column indefinitely (or mark as deprecated)
- Use it as reference during MAT/LA creation
- Gradually migrate data to parent relationships
- Remove only after full audit confirms no dependencies

#### Phase 3: Backfilling Strategy

**Option A: Manual Backfill (Recommended for Initial Phase)**
- Admin creates MAT/LA organizations manually
- Admin assigns schools to MATs/LAs via `parent_organization_id`
- Gradual migration, full control

**Option B: Automated Backfill (Future Enhancement)**
- Use `local_authority` to group schools
- Create LA organizations automatically
- Assign schools to LAs
- **Risk**: May create incorrect groupings - requires validation

**Option C: Hybrid Approach**
- Automatically create LA organizations from `local_authority` data
- Manually create MAT organizations (more complex)
- Admin reviews and adjusts assignments

### Migration Safety Checklist

- [ ] All existing rows have `organization_type = 'school'` (default)
- [ ] All existing rows have `parent_organization_id = NULL`
- [ ] `local_authority` column preserved (NOT deleted)
- [ ] Index created on `parent_organization_id`
- [ ] Check constraint on `organization_type` values
- [ ] Foreign key constraint on `parent_organization_id` (with `on delete restrict`)
- [ ] No breaking changes to existing RLS policies (initially)

---

## Task 3: RLS Simulation & Impact Analysis

### Current RLS Policy on Actions Table

**Current Policy** (from `20240101_security_core.sql`):
```sql
-- Generated via generic loop for 'actions' table
create policy "Users can view actions for their organizations"
  on actions
  for select
  using (is_organization_member(organization_id))
```

**Current Function**: `is_organization_member(org_id uuid)`
- Checks if `auth.uid()` is member of organization via `organization_members` table
- Uses JWT claims for `organization_id` verification
- Returns boolean

**Current Access Pattern**:
- User belongs to Organization A → Can see actions for Organization A only
- User belongs to Organization B → Can see actions for Organization B only
- **No cross-organization access**

### Proposed Recursive RLS Policy

**New Requirement**: Trust users (MAT/LA) should see child school data

**Proposed Policy Logic**:
```sql
-- Pseudo-code for new recursive policy
create policy "Users can view actions for their organizations and child organizations"
  on actions
  for select
  using (
    -- Direct membership (existing behavior)
    is_organization_member(organization_id)
    OR
    -- Trust user sees child school data (NEW)
    (
      -- User is member of a Trust (MAT/LA)
      exists (
        select 1
        from organization_members om
        join organizations o on o.id = om.organization_id
        where om.user_id = auth.uid()::text
          and o.organization_type IN ('mat', 'la')
          and actions.organization_id IN (
            -- Get all child organizations of this Trust
            select id from organizations
            where parent_organization_id = o.id
          )
      )
    )
  )
```

### Impact Analysis: Existing School Users

**Scenario 1: School User (No Hierarchy)**
- **Current**: User belongs to School A → Sees actions for School A
- **After Migration**: User belongs to School A → Sees actions for School A
- **Result**: ✅ **NO CHANGE** - Access maintained

**Scenario 2: School User (With Parent Trust)**
- **Current**: User belongs to School A → Sees actions for School A
- **After Migration**: 
  - School A has `parent_organization_id = Trust B`
  - User still belongs to School A → Sees actions for School A
  - **Trust users** can see School A's actions (NEW capability)
- **Result**: ✅ **NO LOSS** - School user access unchanged, Trust gains visibility

**Scenario 3: Trust User (New Role)**
- **Current**: N/A (Trusts don't exist yet)
- **After Migration**: 
  - User belongs to Trust B (MAT/LA)
  - Trust B has child schools: School A, School C, School D
  - User can see actions for Trust B AND all child schools
- **Result**: ✅ **NEW CAPABILITY** - Trust users gain visibility (intended behavior)

### RLS Policy Migration Strategy

#### Phase 1: Additive (Safe)
1. Keep existing policies (backward compatible)
2. Add new recursive policies alongside existing ones
3. Test with Trust users
4. Verify school users still have access

#### Phase 2: Consolidation (After Validation)
1. Merge policies into single recursive policy
2. Remove redundant policies
3. Full regression testing

### Potential Issues & Mitigations

#### Issue 1: Performance Degradation
**Risk**: Recursive queries may be slower
**Mitigation**: 
- Add index on `parent_organization_id`
- Use materialized view for organization hierarchy (if needed)
- Cache organization tree in application layer

#### Issue 2: Policy Complexity
**Risk**: Complex recursive policies harder to debug
**Mitigation**:
- Create helper function: `user_can_access_organization(org_id uuid)`
- Function handles both direct membership and parent hierarchy
- Easier to test and maintain

#### Issue 3: Circular References
**Risk**: Accidental parent → child → parent loops
**Mitigation**:
- Add check constraint preventing self-reference
- Add recursive CTE limit (max depth = 2: Trust → School)
- Validation in application layer

---

## Risk Assessment Matrix

| Risk Area | Current Risk | After Migration | Mitigation |
|-----------|-------------|------------------|------------|
| **Data Loss** | None | Low | Default values, NULL parent_org_id |
| **Access Loss** | None | Low | Backward compatible policies |
| **Performance** | Good | Medium | Indexes, helper functions |
| **Complexity** | Low | Medium | Gradual rollout, testing |
| **Breaking Changes** | None | Low | Additive changes only |

---

## Recommended Migration Order

### Step 1: Pre-Migration Audit (Run Now)
```sql
-- Execute all audit queries from Task 1
-- Document findings
-- Identify any duplicate URNs or data quality issues
```

### Step 2: Schema Migration (Safe)
```sql
-- Add organization_type (defaults to 'school')
ALTER TABLE organizations 
ADD COLUMN organization_type text 
CHECK (organization_type IN ('school', 'mat', 'la')) 
DEFAULT 'school' NOT NULL;

-- Add parent_organization_id (NULL initially)
ALTER TABLE organizations 
ADD COLUMN parent_organization_id uuid 
REFERENCES organizations(id) ON DELETE RESTRICT;

-- Add index for performance
CREATE INDEX organizations_parent_idx 
ON organizations(parent_organization_id) 
WHERE parent_organization_id IS NOT NULL;

-- Add check to prevent self-reference
ALTER TABLE organizations 
ADD CONSTRAINT no_self_reference 
CHECK (id != parent_organization_id);
```

### Step 3: RLS Policy Update (Additive)
```sql
-- Create helper function for recursive access
CREATE OR REPLACE FUNCTION user_can_access_organization(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
-- Implementation handles both direct membership and parent hierarchy
$$;

-- Update actions policy (additive - keeps existing access)
CREATE POLICY "Users can view actions for their organizations and child organizations"
ON actions
FOR SELECT
USING (user_can_access_organization(organization_id));
```

### Step 4: Validation Testing
- [ ] Verify school users can still access their data
- [ ] Verify Trust users can access child school data
- [ ] Verify no orphaned data
- [ ] Performance testing with recursive queries

### Step 5: Data Migration (Gradual)
- Create MAT/LA organizations manually
- Assign schools to Trusts gradually
- Validate parent relationships
- Monitor for issues

---

## Critical Warnings

### ⚠️ DO NOT DELETE `local_authority` COLUMN
- **Reason**: May contain valuable data
- **Action**: Keep column, mark as deprecated in documentation
- **Timeline**: Remove only after full audit confirms no dependencies

### ⚠️ TEST RLS POLICIES THOROUGHLY
- **Reason**: Recursive policies are complex
- **Action**: Test with multiple user types (school, trust, multi-org)
- **Timeline**: Before production deployment

### ⚠️ MONITOR PERFORMANCE
- **Reason**: Recursive queries can be slow
- **Action**: Add indexes, use helper functions, monitor query times
- **Timeline**: Continuous monitoring post-migration

---

## Conclusion

**Overall Risk Assessment**: **MEDIUM**

**Safe to Proceed**: ✅ **YES**, with careful execution

**Key Safeguards**:
1. Default values prevent data loss
2. Backward compatible RLS policies
3. Additive changes only (no deletions)
4. Gradual rollout recommended

**Recommended Approach**:
1. Run audit queries first (Task 1)
2. Execute schema migration (Task 2)
3. Update RLS policies additively (Task 3)
4. Test thoroughly before production
5. Gradual data migration (manual initially)

**Next Steps**:
1. Execute audit queries in Supabase
2. Review findings
3. Proceed with migration if audit passes
4. Monitor closely during rollout

---

**End of Assessment**

