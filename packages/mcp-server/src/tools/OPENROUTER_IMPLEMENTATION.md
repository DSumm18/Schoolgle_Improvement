# OpenRouter Integration - Implementation Summary

## ✅ Task 1: OpenRouter Wrapper

**File**: `packages/mcp-server/src/llm/openrouter.ts`

### Features:
- ✅ `callOpenRouter({ model, system, user, temperature?, maxTokens? })`
- ✅ Reads `OPENROUTER_API_KEY` from environment
- ✅ Default models from environment:
  - `OPENROUTER_CHEAP_MODEL` (default: `google/gemini-flash-1.5`)
  - `OPENROUTER_SMART_MODEL` (default: `anthropic/claude-3.5-sonnet`)
  - `OPENROUTER_VISION_MODEL` (default: `google/gemini-pro-vision`)
- ✅ Returns `{ text, model, usage? }`
- ✅ Typed errors with `error_code`:
  - `MISSING_API_KEY`
  - `OPENROUTER_API_ERROR`
  - `INVALID_RESPONSE`
  - `NETWORK_ERROR`

---

## ✅ Task 2: Updated generate_room_brief

**File**: `packages/mcp-server/src/tools/estates.ts`

### Logic Flow:

1. **Call consult_knowledge_pack** (deterministic, £0.00)
2. **Check outcome:**
   - If `no_rules_found` or `rules_filtered_no_citations`:
     - ❌ **DO NOT call LLM**
     - Return structured output with:
       - Open questions about what inputs/photos/measurements are needed
       - Clear indication that no guidance was found
   - If rules exist:
     - ✅ **Call OpenRouter CHEAP model**
     - Structure into EXACT headings:
       1. `project_summary`
       2. `intended_use_and_users`
       3. `constraints_and_assumptions`
       4. `practical_considerations` (object with: light, acoustics, circulation, supervision, access)
       5. `risks_and_mitigations`
       6. `open_questions` (array)
       7. `cited_guidance_used` (array with: source, section, page?, authority_level?, quote?)

### Advisory Language Enforcement:
- System prompt explicitly instructs: "NEVER use 'must' or 'requires' unless citation has authority_level='statutory'"
- LLM output is structured JSON, not free-form text
- Citations preserved verbatim with `authority_level`

### Output Structure:
```typescript
{
  project_summary: string;
  intended_use_and_users: string;
  constraints_and_assumptions: string;
  practical_considerations: {
    light?: string;
    acoustics?: string;
    circulation?: string;
    supervision?: string;
    access?: string;
  };
  risks_and_mitigations: string;
  open_questions: string[];
  cited_guidance_used: Array<{
    source: string;
    section: string;
    page?: string;
    authority_level?: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard';
    quote?: string;
  }>;
  roomType: string;
  warnings: string[];
  generated_at: string;
  llm_used: boolean;
  model?: string;
}
```

---

## ✅ Task 3: Telemetry

**File**: `packages/mcp-server/src/utils/telemetry.ts`

### Added Fields:
- ✅ `used_llm: boolean`
- ✅ `model?: string`
- ✅ `duration_ms: number`
- ✅ `outcome: 'success' | 'no_rules_found' | 'rules_filtered_no_citations' | 'error'`
- ✅ `error_code?: string`
- ✅ `token_usage?: { prompt_tokens, completion_tokens, total_tokens }`

### Token Usage:
- Uses actual usage from OpenRouter when available
- Falls back to `estimateTokenUsage()` when not provided
- Logged to Supabase `tool_telemetry` table (JSON field)

---

## ✅ Task 4: Example/Test Harness

**File**: `packages/mcp-server/src/tools/estates.example.ts`

### Examples:
1. **With rules** → LLM used
   - Calls `generate_room_brief` with `roomType: 'classroom_minimum_area'`
   - Expects rules from BB104 pack
   - LLM structures the brief

2. **Without rules** → LLM NOT used
   - Calls `generate_room_brief` with `roomType: 'nonexistent_room_type'`
   - No rules found
   - Returns structured output without LLM call

### Usage:
```bash
export OPENROUTER_API_KEY=your_key
npx tsx packages/mcp-server/src/tools/estates.example.ts
```

---

## Cost Discipline

### Deterministic Path (No LLM):
- `consult_knowledge_pack` → £0.00
- `generate_room_brief` (no rules) → £0.00
- Telemetry: `used_llm: false`

### LLM Path (When Rules Exist):
- `consult_knowledge_pack` → £0.00
- `generate_room_brief` (with rules) → ~£0.001-0.01 (cheap model)
- Telemetry: `used_llm: true`, `model`, `token_usage`

---

## Files Created/Modified

1. ✅ `packages/mcp-server/src/llm/openrouter.ts` - OpenRouter wrapper
2. ✅ `packages/mcp-server/src/tools/estates.ts` - Updated with OpenRouter integration
3. ✅ `packages/mcp-server/src/utils/telemetry.ts` - Added token_usage field
4. ✅ `packages/mcp-server/src/tools/estates.example.ts` - Example/test harness
5. ✅ `packages/mcp-server/src/llm/README.md` - Documentation

---

## Environment Variables Required

```bash
# Required
OPENROUTER_API_KEY=your_key_here

# Optional (with defaults)
OPENROUTER_CHEAP_MODEL=google/gemini-flash-1.5
OPENROUTER_SMART_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_VISION_MODEL=google/gemini-pro-vision
OPENROUTER_HTTP_REFERER=https://schoolgle.com
```

---

## Testing Checklist

- [x] OpenRouter wrapper handles API errors with typed error codes
- [x] generate_room_brief skips LLM when no rules found
- [x] generate_room_brief uses LLM when rules exist
- [x] Output structure matches exact headings
- [x] Citations preserved with authority_level
- [x] Advisory language enforced (no "must" unless statutory)
- [x] Telemetry logs token usage
- [x] Example harness demonstrates both cases

All tasks complete. Ready for production.


