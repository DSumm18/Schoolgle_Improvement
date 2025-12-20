# High-Leverage Improvements Applied

## ✅ 1. Citation Filtering: Enhanced Messaging

### Added Fields:
- `missing_citations_count`: Number of rules excluded
- `missing_rule_ids`: Array of rule IDs that were filtered
- `missing_rule_topics`: Array of rule topics that were filtered
- `citation_filter_message`: Human-readable explanation

### Example Response:
```json
{
  "rules": [...],
  "missing_citations_count": 2,
  "missing_rule_ids": ["rule-1", "rule-2"],
  "missing_rule_topics": ["classroom_area", "storage"],
  "citation_filter_message": "2 rule(s) were excluded because they have no citations. Add citations to include them."
}
```

**Benefit**: Users now understand why rules are missing, not just that they're missing.

---

## ✅ 2. Statutory Labelling: Structured Authority Levels

### Added Fields:

**Citation Level:**
```typescript
citations: [{
  source: "Building Regulations Part M",
  authority_level: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard'
}]
```

**Rule Level:**
```typescript
{
  authority_level: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard'
}
```

### Usage:
- Ed can now phrase properly: "BB104 guidance suggests... (Building Regulations Part M is statutory)"
- No brittle string parsing of "(statutory)" markers
- Clear distinction between guidance and statutory requirements

**Benefit**: Proper authority handling without string parsing.

---

## ✅ 3. Applies_When: Separated Human Text from Machine Logic

### Schema Change:
```typescript
{
  applies_when_text: string,        // Human-readable: "room type is classroom AND age group is primary"
  applies_when_predicate?: { ... }  // Optional JSON for future structured matching
}
```

### Migration:
- All BB104 rules updated to use `applies_when_text`
- Supabase queries support both `applies_when_text` and legacy `applies_when` for backward compatibility
- Local filtering uses `applies_when_text`

### Future-Proof:
- Can add structured predicates later without breaking existing rules
- Machine-readable matching ready when needed
- No semantic drift from word substitution

**Benefit**: Ready for structured matching without breaking changes.

---

## ✅ 4. Telemetry: Outcome and Error Codes

### Added Fields:
```typescript
{
  outcome: 'success' | 'no_rules_found' | 'rules_filtered_no_citations' | 'error',
  error_code?: string  // e.g., 'NO_PACK_FOUND', 'INVALID_DOMAIN'
}
```

### Outcome Logic:

**consult_knowledge_pack:**
- `success`: Rules found and returned
- `no_rules_found`: No rules match query (and no citation filtering)
- `rules_filtered_no_citations`: Rules found but filtered due to missing citations
- `error`: Exception occurred (with `error_code`)

**generate_room_brief:**
- `success`: Brief generated successfully
- `no_rules_found`: No rules available for room type
- `error`: Exception occurred

### Error Codes:
- `NO_PACK_FOUND`: Domain has no knowledge pack
- (More codes can be added as needed)

### Dashboard Benefits:
- **Cost Analysis**: Filter by `outcome` to see success vs filtered rates
- **Reliability**: Track `error_code` frequency
- **Quality**: Monitor `rules_filtered_no_citations` to identify data quality issues
- **Tracing**: Use `request_id` + `session_id` to trace user journeys

**Benefit**: Actionable telemetry for cost and reliability dashboards.

---

## Files Modified

1. `packages/mcp-server/src/knowledge/schema.ts`
   - Added `authority_level` to `Citation` and `Rule`
   - Changed `applies_when` → `applies_when_text` + `applies_when_predicate?`
   - Added citation filtering metadata to `KnowledgeQueryResult`

2. `packages/mcp-server/src/tools/knowledge.ts`
   - Enhanced citation filtering with detailed metadata
   - Updated to use `applies_when_text`
   - Added outcome tracking and error codes

3. `packages/mcp-server/src/knowledge/packs/estates_bb104.ts`
   - Updated all rules to use `applies_when_text`
   - Added `authority_level` to rules and citations
   - Marked statutory sources (Building Regulations, Equality Act)

4. `packages/mcp-server/src/utils/telemetry.ts`
   - Added `outcome` and `error_code` fields
   - Updated Supabase schema mapping

5. `packages/mcp-server/src/tools/estates.ts`
   - Added outcome tracking

---

## Migration Notes

### Backward Compatibility:
- Supabase queries support both `applies_when` and `applies_when_text`
- Legacy rules will work but should be migrated to `applies_when_text`
- `authority_level` is optional (defaults inferred from citations if not set)

### Database Schema Updates Needed:
```sql
-- Add new columns to knowledge_rules
ALTER TABLE knowledge_rules 
  ADD COLUMN applies_when_text TEXT,
  ADD COLUMN applies_when_predicate JSONB,
  ADD COLUMN authority_level TEXT;

-- Migrate existing data
UPDATE knowledge_rules 
  SET applies_when_text = applies_when 
  WHERE applies_when_text IS NULL;

-- Add to tool_telemetry
ALTER TABLE tool_telemetry
  ADD COLUMN outcome TEXT NOT NULL DEFAULT 'success',
  ADD COLUMN error_code TEXT;
```

---

## Testing Checklist

- [x] Citation filtering returns detailed metadata
- [x] Authority levels set on rules and citations
- [x] `applies_when_text` used throughout
- [x] Telemetry includes outcome and error_code
- [x] Backward compatibility maintained
- [x] No linter errors

All improvements are backward-compatible and ready for production.


