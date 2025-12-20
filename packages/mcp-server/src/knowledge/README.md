# Knowledge Pack Engine

Generic architecture for storing, retrieving, and reasoning over deterministic guidance.

## Architecture: "Brain vs Book"

### The Book (Knowledge Packs)
- **Deterministic**: Static guidance stored as rules
- **Versioned**: Lifecycle metadata (effective_date, review_by_date)
- **Cited**: Every rule has source citations
- **No Hallucination**: Retrieved directly, never generated

### The Librarian (Retrieval Tool)
- **Tool**: `consult_knowledge_pack`
- **Cost**: £0.00 (NO LLM calls)
- **Returns**: Rules + citations + confidence warnings

### The Brain (Skills)
- **Domain Tools**: e.g., `generate_room_brief`
- **Grounding**: Always call `consult_knowledge_pack` first
- **LLM Usage**: Only for structuring/drafting (cheap models: haiku/mini)
- **Never Invent**: Never restate guidance as hard requirements

---

## Adding a New Knowledge Pack

### Step 1: Create Pack File

Create `packages/mcp-server/src/knowledge/packs/{domain}_{source}.ts`:

```typescript
import type { KnowledgePack, Rule } from '../schema.js';

export const MY_PACK: KnowledgePack = {
  id: 'my-pack-v1',
  domain: 'hr', // or 'send', 'finance', 'compliance'
  title: 'My Guidance Document',
  version: '1.0',
  effective_date: '2024-01-01',
  review_by_date: '2025-12-31',
  confidence_level: 'high',
  source_url: 'https://example.com/guidance',
};

export const MY_RULES: Rule[] = [
  {
    id: 'rule-1',
    pack_id: 'my-pack-v1',
    topic: 'my_topic',
    applies_when: 'condition when this rule applies',
    content: 'Guidance suggests... (advisory language only)',
    citations: [
      {
        source: 'My Source',
        section: 'Section 3.2',
        page: '42',
      },
    ],
  },
];

export function getMyPack(): KnowledgePack {
  return MY_PACK;
}

export function getMyRules(): Rule[] {
  return MY_RULES;
}
```

### Step 2: Register in Librarian Tool

Update `packages/mcp-server/src/tools/knowledge.ts`:

```typescript
// Import
import { getMyPack, getMyRules } from '../knowledge/packs/my_pack.js';

// Register in LOCAL_PACKS
LOCAL_PACKS.set('my-pack-v1', getMyPack());
LOCAL_RULES.set('my-pack-v1', getMyRules());
```

### Step 3: (Optional) Create Domain Skill

Create `packages/mcp-server/src/tools/{domain}.ts`:

```typescript
// Example: generate_hr_brief
// 1. Call consult_knowledge_pack('hr', topic)
// 2. Use cheap LLM to structure output
// 3. Cite sources explicitly
```

---

## Lifecycle Controls

### How Outdated Guidance is Prevented

1. **Automatic Filtering**: `consult_knowledge_pack` checks:
   - `review_by_date < today` → Warning
   - `superseded_by` exists → Redirect to new version
   - `confidence_level === 'draft'` → Warning

2. **User Warnings**: Ed always shows:
   - "This guidance is from BB104 v1.0 (2020). Check for updates."
   - "Confidence level is 'draft' - verify before implementation."

3. **Audit Trail**: Every retrieval logs:
   - Which version was used
   - When it was accessed
   - Confidence level at time of access

### Setting Lifecycle Dates

```typescript
effective_date: '2024-01-01', // When guidance becomes valid
review_by_date: '2025-12-31', // When guidance should be reviewed
superseded_by: 'my-pack-v2',  // If this version is outdated
```

---

## How Ed Stays Non-Authoritative

### Language Rules

**✅ DO:**
- "BB104 guidance suggests..."
- "Guidance indicates..."
- "The document considers..."
- "It is recommended that..."

**❌ DON'T:**
- "BB104 requires..."
- "You must..."
- "It is mandatory..."
- (Unless explicitly statutory and cited)

### Citation Requirements

Every rule output must include:
- Source (e.g., "BB104")
- Section (e.g., "Section 3.2")
- Page (if available)
- Version/date

### Confidence Warnings

If `confidence_level !== 'high'`, Ed must warn:
- "Confidence level is 'medium' - cross-reference with official sources."
- "This guidance is marked as 'draft' - verify before implementation."

---

## Supabase Integration (Future)

### Tables Required

```sql
-- Knowledge Packs
CREATE TABLE knowledge_packs (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date DATE NOT NULL,
  review_by_date DATE NOT NULL,
  confidence_level TEXT NOT NULL,
  source_url TEXT,
  superseded_by TEXT,
  active BOOLEAN DEFAULT true
);

-- Knowledge Rules
CREATE TABLE knowledge_rules (
  id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES knowledge_packs(id),
  topic TEXT NOT NULL,
  applies_when TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Telemetry
CREATE TABLE tool_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  used_llm BOOLEAN NOT NULL,
  model TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  organization_id UUID,
  user_id UUID,
  duration_ms INTEGER
);
```

### Migration Path

1. Start with local TS packs (current)
2. Migrate to Supabase when ready
3. `consult_knowledge_pack` automatically uses Supabase if available
4. Falls back to local if Supabase unavailable

---

## Cost Discipline

### Deterministic Retrieval: £0.00
- `consult_knowledge_pack` → No LLM calls
- Direct database/TS file lookup
- Fast, cheap, accurate

### LLM Usage: Only When Needed
- Skills use cheap models (haiku/mini)
- Only for structuring/drafting
- Never for retrieval

### Telemetry
- Logs every tool call
- Tracks: tool_name, used_llm, model, duration
- Proves cost efficiency to investors

---

## Example Usage

### Ed Query:
"Generate a room brief for a primary school classroom with 30 pupils"

### Ed's Process:
1. Calls `consult_knowledge_pack('estates', 'classroom_minimum_area', 'primary school')`
   - Cost: £0.00
   - Returns: BB104 rules + citations

2. Calls `generate_room_brief('classroom_minimum_area', 'primary school, 30 pupils')`
   - Cost: ~£0.001 (cheap LLM for structuring)
   - Uses rules from step 1 as context
   - Output cites BB104 explicitly

### Ed's Response:
"Based on BB104 guidance (Section X, Page Y), a primary school classroom for 30 pupils should consider:
- Minimum area per pupil: approximately 2.0-2.5 m²
- [Additional requirements from rules]

⚠️ Warning: Some guidance values are marked as TBD - verify from official BB104 document.

Citations:
- BB104 Section X, Page Y
- [Additional citations]"

---

## Next Steps

1. **Verify BB104 Values**: Replace TBD placeholders with actual BB104 values
2. **Add More Packs**: SEND, KCSIE, HR, Finance, Compliance
3. **Supabase Migration**: Move packs to database for easier updates
4. **Structured applies_when**: Replace free text with structured conditions
5. **Cross-Domain Queries**: "BB104 + KCSIE for SEND spaces"

This is the engine. The product explosion comes later.


