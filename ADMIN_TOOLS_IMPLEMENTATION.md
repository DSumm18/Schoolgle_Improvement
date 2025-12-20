# Admin & Setup Tools Implementation

## Summary

Created two admin tools for bulk data import and cohort management with strict privacy-first UPN hashing.

## Files Created/Modified

### 1. `packages/mcp-server/src/tools/admin.ts` (NEW)

**Two Tools Implemented:**

#### Tool 1: `import_students_batch`

**Purpose**: Bulk import students with privacy-first UPN hashing.

**Input Schema**:
```typescript
{
  students: Array<{
    upn: string              // Will be hashed (SHA-256) before storage
    yearGroup: number        // 1-13
    characteristics: string[] // ['pp', 'send', 'eal', etc.]
  }>
}
```

**Features**:
- ✅ **Privacy-First**: UPNs hashed with SHA-256 before storage
- ✅ **Bulk Processing**: Handles up to 1000 students per batch
- ✅ **Batch Processing**: Processes in chunks of 100 (Supabase limits)
- ✅ **Upsert Logic**: Handles duplicates gracefully (updates if exists)
- ✅ **Role Check**: Requires admin or SLT role
- ✅ **Error Handling**: Returns detailed success/failure counts

**Output**:
```typescript
{
  success: boolean
  count: number        // Successfully imported
  failed: number       // Failed imports
  errors?: string[]     // Error messages
  message: string
}
```

**Security**:
- UPNs are hashed using SHA-256 (never stored in plain text)
- `organization_id` injected from `AuthContext`
- Role-based access control (admin/SLT only)

---

#### Tool 2: `create_cohort`

**Purpose**: Creates cohorts with filter criteria and immediately counts matching students.

**Input Schema**:
```typescript
{
  name: string                    // "Year 5 Pupil Premium"
  description?: string
  criteria: {
    yearGroup?: number            // Single year
    yearGroups?: number[]         // Multiple years [3, 4, 5, 6]
    minYear?: number              // Range: minimum
    maxYear?: number              // Range: maximum
    characteristics?: string[]    // ['pp', 'send', etc.]
    // Legacy support:
    year?: number                 // Alias for yearGroup
    is_pp?: boolean               // Legacy: adds 'pp' to characteristics
    is_send?: boolean             // Legacy: adds 'send' to characteristics
  }
}
```

**Features**:
- ✅ **Flexible Filtering**: Supports single year, multiple years, ranges, characteristics
- ✅ **Immediate Count**: Counts matching students before creating cohort
- ✅ **Legacy Support**: Backward compatible with old criteria format
- ✅ **Filter Rules**: Stores criteria as JSONB for dynamic querying

**Output**:
```typescript
{
  cohort: {
    id: string
    organizationId: string
    name: string
    description: string | null
    filterRules: Record<string, any>
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  matchingStudentCount: number
  message: string  // "Cohort created. Matches 14 students."
}
```

**Example Usage**:
```typescript
// Create Year 5 PP cohort
{
  name: "Year 5 Pupil Premium",
  criteria: {
    yearGroup: 5,
    characteristics: ["pp"]
  }
}
// Returns: "Cohort created. Matches 14 students."

// Create KS2 SEND cohort
{
  name: "KS2 SEND Pupils",
  criteria: {
    minYear: 3,
    maxYear: 6,
    characteristics: ["send"]
  }
}
```

---

### 2. `packages/mcp-server/src/index.ts` (MODIFIED)

**Changes**:
- Added imports for admin tool handlers
- Registered 2 new tools in `getToolInputSchema()` function
- Added handler cases in tool routing switch statement

---

### 3. `supabase/migrations/20240201_precision_teaching.sql` (MODIFIED)

**Changes**:
- Added tool registration for `import_students_batch` (risk: medium, requires admin/SLT)
- Added tool registration for `create_cohort` (risk: low)
- Both registered under `core` module

---

## Privacy-First Implementation

### UPN Hashing

**Process**:
1. Receive UPN from user input
2. Normalize: `trim()` and `toUpperCase()`
3. Hash: SHA-256
4. Store: Only the hash in `students.upn_hash`
5. Never store: Raw UPN is never persisted

**Code**:
```typescript
function hashUPN(upn: string): string {
  return createHash('sha256')
    .update(upn.trim().toUpperCase())
    .digest('hex');
}
```

**Security**:
- One-way hashing (cannot reverse to get UPN)
- Consistent hashing (same UPN = same hash)
- Unique constraint: `(organization_id, upn_hash)` prevents duplicates

---

## Usage Examples

### Example 1: Import Students

```typescript
{
  tool: "import_students_batch",
  inputs: {
    students: [
      { upn: "A123456789", yearGroup: 5, characteristics: ["pp", "send"] },
      { upn: "B987654321", yearGroup: 5, characteristics: ["pp"] },
      { upn: "C111222333", yearGroup: 6, characteristics: ["high_prior"] }
    ]
  }
}
```

**Result**:
```json
{
  "success": true,
  "count": 3,
  "failed": 0,
  "message": "Imported 3 students successfully."
}
```

### Example 2: Create Cohort

```typescript
{
  tool: "create_cohort",
  inputs: {
    name: "Year 5 Pupil Premium",
    description: "Disadvantaged pupils in Year 5",
    criteria: {
      yearGroup: 5,
      characteristics: ["pp"]
    }
  }
}
```

**Result**:
```json
{
  "cohort": {
    "id": "uuid",
    "name": "Year 5 Pupil Premium",
    "filterRules": {
      "year_group": 5,
      "characteristics": ["pp"]
    }
  },
  "matchingStudentCount": 14,
  "message": "Cohort \"Year 5 Pupil Premium\" created successfully. Matches 14 students."
}
```

---

## Security Features

1. **Role-Based Access**: `import_students_batch` requires admin or SLT role
2. **Privacy-First**: UPNs hashed before storage
3. **Tenant Isolation**: `organization_id` injected from context
4. **Input Validation**: Strict Zod schemas
5. **Error Handling**: Detailed error messages without exposing sensitive data

---

## Next Steps

1. **Run Updated Migration**: The migration file now includes tool registrations
   ```sql
   -- Re-run the tool registration section if you already ran the migration
   INSERT INTO tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) 
   VALUES (...)
   ON CONFLICT (tool_key) DO UPDATE SET ...;
   ```

2. **Test Import**: Try importing a small batch of students
3. **Test Cohort Creation**: Create a test cohort and verify student count
4. **Verify Tools**: Check tools appear in `ListTools` response

---

**Implementation Complete** ✅

The admin tools are ready for bulk data import and cohort management with strict privacy compliance.

