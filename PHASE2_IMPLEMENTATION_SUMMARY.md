# Phase 2 Implementation: Precision Teaching & Interventions

## Summary

Successfully implemented Phase 2 - Precision Teaching & Interventions system with privacy-first architecture. This moves from school-level data to cohort-level tracking without storing PII (Personally Identifiable Information).

## Files Created

### 1. `supabase/migrations/20240201_precision_teaching.sql`

**Tables Created:**

1. **`students`** - Anonymous student records
   - Uses `upn_hash` (SHA-256 hash) instead of UPN/Name
   - Stores `year_group` and `characteristics` (jsonb array: ['pp', 'send', 'eal', etc.])
   - RLS enabled for tenant isolation

2. **`cohorts`** - Dynamic groups
   - `name` (e.g., "Year 5 High Prior Attainers")
   - `filter_rules` (jsonb) for flexible querying
   - RLS enabled

3. **`research_strategies`** - EEF Vault
   - Evidence-based strategies from Education Endowment Foundation
   - Fields: `impact_months`, `evidence_strength`, `evidence_tier`, `category`, `tags`
   - Public read access (all authenticated users)
   - Pre-seeded with example EEF strategies

4. **`school_interventions`** - The Timeline
   - Links `cohort_id` to `strategy_id`
   - Tracks `start_date`, `status`, `frequency`, `duration_minutes`
   - RLS enabled

5. **`pulse_checks`** - Micro-Assessments
   - Linked to `intervention_id`
   - Stores aggregated results in `results_summary` (jsonb)
   - No individual pupil data
   - RLS enabled (via join through interventions)

**Helper Functions:**

- `get_cohort_students(cohort_id)` - Returns students matching cohort filter rules
- `calculate_cohort_impact(cohort_id)` - Calculates impact metrics and trends

**Tool Registration:**
- Registered 3 MCP tools in `tool_definitions` table (module: 'core')

---

### 2. `packages/mcp-server/src/tools/interventions.ts`

**Tools Implemented:**

#### 1. `search_research_strategies`
- **Purpose**: Searches EEF research strategies database
- **Input**: `topic` (required), `category`, `minEvidenceStrength`, `minImpactMonths`, `limit`
- **Output**: Array of research strategies with evidence ratings
- **Use Case**: AI suggests evidence-based interventions to school leaders

#### 2. `create_intervention`
- **Purpose**: Creates new intervention on timeline
- **Input**: `cohortId`, `strategyId`, `startDate` (required), plus optional fields
- **Output**: Created intervention with cohort and strategy details
- **Use Case**: Log interventions for tracking and impact analysis

#### 3. `analyze_cohort_impact`
- **Purpose**: Complex analysis of cohort impact over time
- **Input**: `cohortId` (required), `includeInterventions`, `includePulseChecks`
- **Output**: 
  - Total interventions, active/completed counts
  - Average score trend over time
  - Participation trend
  - Overall impact assessment with recommendations
- **Use Case**: Evaluate intervention effectiveness and provide recommendations

**Security Features:**
- All tools inject `organization_id` from `AuthContext` (never from user input)
- RLS enforces tenant isolation at database level
- Access validation before querying

---

### 3. `packages/mcp-server/src/index.ts` (Updated)

**Changes:**
- Added imports for intervention tool handlers
- Registered 3 new tools in `getToolInputSchema()` function
- Added handler cases in tool routing switch statement

---

## Privacy-First Design

### Key Principles:

1. **No PII Storage**:
   - Students identified by `upn_hash` (SHA-256 hash of UPN)
   - No names, UPNs, or other identifiable data stored

2. **Aggregated Data Only**:
   - `pulse_checks` stores aggregated results (`avg_score`, `participation_rate`)
   - No individual pupil scores or responses

3. **Cohort-Based Tracking**:
   - Interventions target cohorts (groups), not individuals
   - Filter rules allow dynamic cohort creation without storing membership

4. **GDPR Compliant**:
   - RLS ensures data isolation
   - Audit logging via existing `tool_audit_logs` system
   - No PII in audit trails

---

## Database Schema Highlights

### Students Table
```sql
- id (uuid, PK)
- organization_id (uuid, FK)
- upn_hash (text, unique per org) -- SHA-256 hash
- year_group (integer, 1-13)
- characteristics (jsonb) -- ['pp', 'send', 'eal', 'high_prior', etc.]
```

### Cohorts Table
```sql
- id (uuid, PK)
- organization_id (uuid, FK)
- name (text) -- "Year 5 High Prior Attainers"
- filter_rules (jsonb) -- {"year_group": 5, "characteristics": ["high_prior"]}
```

### Research Strategies Table
```sql
- id (uuid, PK)
- title (text)
- impact_months (text) -- "+7 months"
- impact_months_numeric (decimal) -- For sorting
- evidence_strength (integer, 1-5)
- evidence_tier (integer, 1-3)
- category (text) -- 'literacy', 'numeracy', etc.
- tags (text[])
- url (text) -- EEF toolkit link
```

### School Interventions Table
```sql
- id (uuid, PK)
- organization_id (uuid, FK)
- cohort_id (uuid, FK)
- strategy_id (uuid, FK)
- start_date (date)
- status (text) -- 'planned', 'active', 'completed', etc.
- frequency (text) -- 'daily', 'weekly', etc.
- duration_minutes (integer)
```

### Pulse Checks Table
```sql
- id (uuid, PK)
- intervention_id (uuid, FK)
- date (date)
- topic (text)
- results_summary (jsonb) -- {"avg_score": 85, "participation_rate": 90, ...}
```

---

## Tool Usage Examples

### Example 1: Search for Phonics Strategies
```typescript
{
  tool: "search_research_strategies",
  inputs: {
    topic: "phonics",
    minEvidenceStrength: 4,
    minImpactMonths: 3,
    limit: 5
  }
}
```

**Returns**: Top 5 phonics strategies with strong evidence and +3 months impact

### Example 2: Create Intervention
```typescript
{
  tool: "create_intervention",
  inputs: {
    cohortId: "uuid-of-cohort",
    strategyId: "uuid-of-strategy",
    startDate: "2025-02-15",
    frequency: "daily",
    durationMinutes: 20,
    staffLead: "Mrs. Smith",
    intendedOutcomes: "Improve phonics decoding skills"
  }
}
```

**Returns**: Created intervention with cohort and strategy details

### Example 3: Analyze Impact
```typescript
{
  tool: "analyze_cohort_impact",
  inputs: {
    cohortId: "uuid-of-cohort",
    includeInterventions: true,
    includePulseChecks: true
  }
}
```

**Returns**: 
- Total interventions and status breakdown
- Average score trend over time
- Participation trend
- Overall impact assessment with recommendation

---

## Next Steps

1. **Run Migration**: Execute `20240201_precision_teaching.sql` in Supabase SQL Editor

2. **Seed More Strategies**: Add more EEF strategies to `research_strategies` table

3. **Create Cohorts**: Use frontend/admin interface to create cohorts with filter rules

4. **Test Tools**: Verify all 3 tools work correctly with test data

5. **Frontend Integration**: Build UI for:
   - Cohort creation and management
   - Intervention timeline view
   - Pulse check data entry
   - Impact analysis dashboard

---

## Security Notes

- All tables have RLS enabled
- `organization_id` is injected from `AuthContext`, never from user input
- Helper functions use `SECURITY DEFINER` with `set search_path = ''` to prevent injection
- Research strategies are public read (all authenticated users can search)
- Students, cohorts, interventions, and pulse checks are tenant-scoped

---

## Module Assignment

All 3 tools are registered under the `core` module, meaning they're available to all organizations. If you want to make this a premium feature, you could:

1. Create a new module: `precision_suite`
2. Update tool registrations to use `precision_suite` instead of `core`
3. Organizations would need to purchase the module to access these tools

---

**Implementation Complete** ✅

