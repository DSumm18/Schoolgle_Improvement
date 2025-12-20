# Implementation: get_assessments Tool

## Summary

Successfully implemented the `get_assessments` MCP tool to retrieve Ofsted assessment data, completing the tool set required by the Ofsted Inspector Agent system prompt.

## Files Created/Modified

### 1. `packages/mcp-server/src/tools/assessments.ts` (NEW)
- **Purpose**: MCP tool handler for retrieving Ofsted assessments
- **Security**: `organization_id` is injected from `AuthContext`, never from user input
- **Features**:
  - Filters by subcategory, category, rating, evidence count, and quality score
  - Returns both school self-assessments and AI-generated assessments
  - Includes joined subcategory and category data
  - Strict Zod validation on all inputs

### 2. `packages/mcp-server/src/index.ts` (MODIFIED)
- **Changes**:
  - Added import for `handleGetAssessments`
  - Registered tool in `getToolInputSchema()` function
  - Added handler case in tool routing switch statement

### 3. `supabase/migrations/20240105_register_assessments_tool.sql` (NEW)
- **Purpose**: Registers `get_assessments` tool in `tool_definitions` table
- **Module**: `ofsted_inspector` (same as `get_evidence_matches`)
- **Risk Level**: `low`
- **Requires Approval**: `false`

## Tool Schema

### Input Parameters (Zod Validated)

```typescript
{
  subcategoryId?: string          // Optional filter by subcategory
  categoryId?: string             // Optional filter by category
  includeNotAssessed?: boolean    // Include "not_assessed" ratings (default: false)
  ratingFilter?: enum             // Filter by specific rating
  minEvidenceCount?: number       // Minimum evidence count (default: 0)
  minQualityScore?: number        // Minimum quality score 0-1 (optional)
}
```

### Output Structure

```typescript
{
  assessments: Array<{
    id: string
    subcategoryId: string
    subcategoryName: string
    categoryId: string
    categoryName: string
    schoolRating: 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed' | null
    schoolRationale: string | null
    aiRating: (same enum as schoolRating)
    aiRationale: string | null
    aiConfidence: number | null
    evidenceCount: number
    evidenceQualityScore: number | null
    assessedBy: string | null
    assessedAt: string | null
    createdAt: string
    updatedAt: string
  }>
  count: number
  organizationId: string
  filters: { ... }  // Echo of applied filters
}
```

## Security Features

1. **Tenant Isolation**: `organization_id` is injected from `AuthContext`, never from user input
2. **RLS Enforcement**: Database-level Row Level Security automatically filters by organization
3. **Access Validation**: Double-checks user membership before querying
4. **Zod Validation**: All inputs strictly validated before processing

## Entitlements

The tool is registered under the `ofsted_inspector` module, meaning:
- Organizations must have the "Ofsted Inspector" module enabled
- Tool availability is automatically filtered by `get_available_tools()` RPC function
- Core module tools remain available to all organizations

## Integration with System Prompt

This tool completes the "Tool Usage Protocol" defined in `PROMPTS/OFSTED_INSPECTOR_SYSTEM_PROMPT.md`:

1. ✅ **Step 1**: `get_evidence_matches` - Check what school claims
2. ✅ **Step 2**: `get_assessments` - Cross-reference with assessment data
3. ✅ **Step 3**: `get_financial_records` - Triangulate with financial data

## Next Steps

1. **Run Migration**: Execute `20240105_register_assessments_tool.sql` in Supabase SQL Editor
2. **Test Tool**: Verify tool appears in `ListTools` for organizations with `ofsted_inspector` module
3. **Assign Module**: Ensure test organizations have the module enabled:
   ```sql
   INSERT INTO organization_modules (organization_id, module_id, module_key, enabled)
   VALUES ('your-org-uuid', 'inspection_ready', 'ofsted_inspector', true);
   ```

## Database Schema Reference

The tool queries the `ofsted_assessments` table with joins to:
- `ofsted_subcategories` (for subcategory name and category_id)
- `ofsted_categories` (for category name)

All tables have RLS enabled and automatically filter by `organization_id` from JWT claims.

