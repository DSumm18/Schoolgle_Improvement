# Connector Hub Phase 2.1 — Design Spec

**Date:** 11 April 2026
**Status:** APPROVED
**Scope:** Connector Hub consolidation + Guardian rewrite/wiring + first real document template (Attendance Story)

---

## Vision

Every connector (we-control, school-control, BYO) lives in ONE place: `/dashboard/settings/connectors`. Creation is role-gated. Every connector has a category, visibility scope, and audit trail. Every LLM call made on school data passes through `SchoolDataGuardian` — a marketable, always-on privacy shield. The first real document template ("Attendance Story for Governors") proves the value loop: real data → real LLM → real PDF, with all data traced back to the connectors that produced it. The more connectors a school has, the richer their reports.

**Non-negotiable rule (Integration Test Gate):** The system does the work. No hardcoded data, no pre-calculated "sample" narratives, no faking what the LLM produces. Code fetches real data → passes to real LLM → renders real output. Verified by actually running it and saving evidence.

---

## Design Decisions

### 1. Connector Hub Consolidation

- Single page: `/dashboard/settings/connectors`
- Unifies Google Drive connections (currently at `/dashboard/settings/data-connections`) with BYO + DfE + Live MIS
- Google Drive continues to store its connection in the existing `ofsted_drive_connections` table — we don't migrate data, we just SURFACE it in the unified hub
- Existing `/dashboard/settings/data-connections` page shows a deprecation banner linking to the new hub, then stays functional as a fallback for 30 days

### 2. Schema Extension (additive migration)

```sql
ALTER TABLE byo_connectors
  ADD COLUMN IF NOT EXISTS connection_mode TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (connection_mode IN ('live', 'cached', 'uploaded')),
  ADD COLUMN IF NOT EXISTS source_config JSONB,
  ADD COLUMN IF NOT EXISTS refresh_interval TEXT,
  ADD COLUMN IF NOT EXISTS last_fetch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'department', 'slt', 'global')),
  ADD COLUMN IF NOT EXISTS shared_with_roles TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shared_with_users TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_type TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_byo_connectors_category ON byo_connectors(category);
CREATE INDEX IF NOT EXISTS idx_byo_connectors_visibility ON byo_connectors(visibility);
```

### 3. Connector Categories

```typescript
type ConnectorCategory =
  | 'safeguarding' | 'send' | 'curriculum' | 'assessment'
  | 'attendance' | 'behaviour' | 'estates' | 'finance'
  | 'hr' | 'governance' | 'compliance' | 'intelligence' | 'custom';
```

Mapped to existing module IDs so School Intelligence can filter by module later.

### 4. Visibility Model

- **private** — only the creator sees it (default)
- **department** — users in roles listed in `shared_with_roles[]` see it
- **slt** — visible to SLT, headteacher, admin
- **global** — visible to everyone in the organisation

Query filter at the API layer:
```sql
WHERE organization_id = $org
  AND (
    visibility = 'global'
    OR (visibility = 'slt' AND $user_role IN ('slt', 'headteacher', 'admin'))
    OR (visibility = 'department' AND $user_role = ANY(shared_with_roles))
    OR $user_id = ANY(shared_with_users)
    OR created_by = $user_id
  )
```

### 5. Role Gating on Creation

Only `admin`, `headteacher`, `slt` can create BYO connectors. Teachers can USE any connector shared with them but the "+ Add Connector" button is hidden for lower roles. Enforced in the POST endpoint with a 403 if the role is insufficient.

### 6. Connection Modes

- **live** — stores credentials/URL, fetches on demand, no data persisted. Google Drive is already this. First target for live BYO: Google Sheets via existing Drive OAuth (stub in 2.1, real fetch in 2.2)
- **cached** — fetches periodically, stores last snapshot only. Defer implementation to Phase 2.2
- **uploaded** — stores rows permanently. This is the current Phase 2 CSV upload behaviour

### 7. SchoolDataGuardian Rewrite + Wiring

The current state: Guardian is 117 lines of dead code, `pii-masker` is the real thing with 193 lines of features. We unify them into a single `SchoolDataGuardian` module that incorporates the best of both.

**Features in the rewritten Guardian:**
- Patterns from Guardian: email, phone, UK DOB, UPN, NHS number
- Patterns from pii-masker: role-context names (`Mrs X`, `Headteacher: X`), postcodes, NI numbers
- **Reversible masking** (from pii-masker): returns a token map so outputs can be rehydrated client-side
- **Non-blocking by default** — always sanitise and proceed, never fail the request
- **`skipCategories` option** for cases where the data is public (e.g., head teacher names from GIAS)
- **Allowlist for public data** — school names from GIAS, published head teacher names, URNs are allowed through by default
- **Audit logging** — every call records what categories were masked and the count
- **Stats API** — `SchoolDataGuardian.getStats(orgId)` returns running totals for the "Privacy Shield" badge

**Wiring:**
- New module `apps/platform/src/lib/ai/openrouter-guardian.ts` — a wrapper around OpenRouter that calls the Guardian on the prompt before dispatch and rehydrates the response after
- All new AI calls in this phase (the Attendance Story) use `openrouter-guardian` rather than raw `fetch`
- `pii-masker` becomes a thin re-export from `SchoolDataGuardian` with backwards-compatible signatures, so existing callers keep working

**Explicit non-goal:** We are NOT refactoring the 17 existing raw-fetch routes in this phase. That's a separate hygiene task. We just make sure no NEW code bypasses the Guardian, and document the 17 existing bypasses in the honest audit report.

### 8. Document Generation: Attendance Story for Governors

- Trigger: click "Generate" on the Attendance Story card on the School Intelligence page OR on the Ofsted Readiness page
- Input: `urn` (the school)
- Data fetched (real, live queries):
  - `dfe_attendance` rows for this URN across all available years
  - `census` rows for context (roll size, FSM %, EAL %)
  - `school_contextual_factors` rows if any exist
  - `schools` row for school name, head teacher, LA
- Narrative generation: prompt assembled with the fetched data, sent via `openrouter-guardian` to `google/gemini-2.5-flash` (confirmed available — list at build time)
- PDF rendering: reuses the existing `governor-pdf` infrastructure from the estates merge, themed for the attendance story
- Attribution footer: "Based on: DfE Attendance (X rows), DfE Census (Y rows), Contextual Factors (Z events). Add [Live Attendance] for current term view. Add [Live Assessments] to link attendance to attainment."
- Stored in a new `generated_documents` table with source connector attribution

### 9. Example Gallery on School Intelligence

- Scrolling strip at the bottom of `/dashboard/school-intelligence` showing template cards
- 2.1 ships with ONE real card: "Attendance Story for Governors" + THREE stubs: "SEF Section", "Governor Finance Report", "Ofsted Question Answer"
- Each card shows: required connectors (with status), "Try it" button
- Real card runs end-to-end; stubs show "Coming in 2.2" overlay

### 10. Deep Link From School Intelligence

- Any "select data source" control in School Intelligence has a "+ Create Connector" button that opens the hub with a return URL
- Returns to School Intelligence with the newly-created connector pre-selected

### 11. Honest Guardian Audit Report

New deliverable: `docs/architecture/school-data-guardian-audit.md`
Captures:
- What the Guardian was before 2.1 (dead code)
- What `pii-masker` was doing instead
- The unification rationale
- The list of 17 routes that still bypass the Guardian (to be fixed in a later phase)
- Gaps still present (what the unified Guardian doesn't yet detect)
- Recommendations for Phase 3+

This becomes the "evaluation" David asked for — not a dry architectural doc, but an honest audit of our actual privacy control plane.

---

## Technical Architecture

### Files

```
apps/platform/src/lib/ai/
  school-data-guardian.ts          — Unified Guardian (rewritten from existing)
  openrouter-guardian.ts           — OpenRouter wrapper with Guardian on input + output
  __tests__/
    school-data-guardian.test.ts   — Extended test coverage
    openrouter-guardian.test.ts    — Mock OpenRouter tests

apps/platform/src/lib/data-connectors/
  categories.ts                    — ConnectorCategory type + metadata
  visibility.ts                    — Visibility filter logic

apps/platform/src/lib/documents/
  attendance-story/
    types.ts                       — AttendanceStoryInput, AttendanceStoryOutput
    fetcher.ts                     — Real Supabase queries for attendance + census + factors
    prompt-builder.ts              — Assembles the Gemini prompt from real data
    story-generator.ts             — Calls openrouter-guardian with prompt, returns narrative
    pdf-renderer.ts                — Renders narrative + source attribution into PDF
    index.ts                       — Main generateAttendanceStory function
  __tests__/
    attendance-story-integration.test.ts  — Real data → real LLM → real PDF test

apps/platform/src/app/api/documents/
  attendance-story/route.ts        — POST endpoint to generate

apps/platform/src/app/(dashboard)/dashboard/school-intelligence/
  page.tsx                         — Landing with example gallery (refactor if exists)
  components/
    ExampleGalleryStrip.tsx        — Scrolling template strip
    DocumentTemplateCard.tsx       — Card with required connectors + Try it

apps/platform/src/app/(dashboard)/dashboard/settings/connectors/
  page.tsx                         — Add category/visibility filters
  components/
    VisibilityFilterChips.tsx      — Filter chips
    ConnectorDetailDrawer.tsx      — Slide-in detail view
    ParentTypeGroupedView.tsx      — Nested instances under parent type

apps/platform/supabase/migrations/
  20260411_connector_hub_phase2_1.sql
    — ALTER byo_connectors (add columns)
    — CREATE TABLE generated_documents
    — CREATE TABLE guardian_audit_log

docs/architecture/
  school-data-guardian-audit.md    — The honest audit report
```

### New Supabase Tables

```sql
-- Generated documents with source attribution
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  urn INTEGER NOT NULL,
  template_id TEXT NOT NULL,           -- 'attendance-story', etc.
  title TEXT NOT NULL,
  connector_sources TEXT[] NOT NULL,   -- ['dfe-attendance', 'dfe-census', etc.]
  narrative TEXT NOT NULL,              -- the LLM-generated narrative
  pdf_url TEXT,                         -- Supabase storage URL for the PDF
  llm_model TEXT NOT NULL,              -- e.g. 'google/gemini-2.5-flash'
  llm_tokens_used INTEGER,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian audit log (what was scrubbed)
CREATE TABLE guardian_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  called_by TEXT,                       -- function name e.g. 'attendance-story-generator'
  categories_detected TEXT[] NOT NULL,  -- ['email', 'phone', 'postcode']
  category_counts JSONB NOT NULL,       -- {"email": 2, "phone": 1}
  input_length INTEGER NOT NULL,
  output_length INTEGER NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API

- `GET /api/connectors/registry?category=&visibility=&view=table|layers` — extended with filters
- `POST /api/connectors/byo` — role-gated (admin/slt/head), writes new fields
- `POST /api/documents/attendance-story` — body: `{ urn }` — returns `{ documentId, pdfUrl, narrative, sourceConnectors }`
- `GET /api/guardian/stats?orgId=` — returns running totals for the Privacy Shield badge

### Guardian API (rewritten)

```typescript
interface GuardianOptions {
  skipCategories?: GuardianCategory[];
  allowlist?: string[];                  // specific strings to let through (e.g. "Grove House Primary")
  callerName?: string;                   // for audit log
  orgId?: string;                        // for audit log
}

interface GuardianResult {
  sanitised: string;                     // the scrubbed text
  tokenMap: Map<string, string>;         // token → original (for rehydration)
  isClean: boolean;                      // true if nothing was scrubbed
  categoriesDetected: GuardianCategory[];
  counts: Record<GuardianCategory, number>;
}

class SchoolDataGuardian {
  static scrub(text: string, options?: GuardianOptions): GuardianResult;
  static rehydrate(text: string, tokenMap: Map<string, string>): string;
  static logAudit(result: GuardianResult, options: GuardianOptions): Promise<void>;
  static async getStats(orgId: string): Promise<GuardianStats>;
}

type GuardianCategory =
  | 'email' | 'phone' | 'dob' | 'upn' | 'nhs_number'
  | 'name_with_role' | 'postcode' | 'ni_number' | 'address';
```

### OpenRouter Guardian Wrapper

```typescript
interface GuardianCallOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  orgId: string;
  callerName: string;
  rehydrateOutput?: boolean;             // default true
}

export async function callOpenRouterWithGuardian(
  options: GuardianCallOptions,
): Promise<{ content: string; tokensUsed: number; guardianResult: GuardianResult }> {
  // 1. Scrub each message through Guardian
  // 2. Call OpenRouter with scrubbed messages
  // 3. Rehydrate output using tokenMap (optional)
  // 4. Log audit entry
  // 5. Return content + metadata
}
```

---

## Validation

- Run all existing tests + new tests — nothing regresses
- End-to-end test: `generateAttendanceStory(148201)` run against real Supabase data, real Gemini call via OpenRouter+Guardian, real PDF output
- Evidence saved to `/tmp/attendance-story-grove-house-<timestamp>.json` (prompt, response, guardian result, pdf url)
- Sandra test: would a school business manager find this useful? Judgement call documented in the test output

---

## Out of Scope

- Refactoring the 17 existing raw-fetch routes to use the Guardian (separate hygiene phase)
- Live Google Sheets row fetching (stub in 2.1, real in 2.2)
- Cached connection mode (2.2)
- Full document template engine / recipe runner (2.2)
- More document templates beyond Attendance Story (2.2+)
- School Intelligence drag-drop report builder (Phase 3)
- Cross-connector join query engine (Phase 2.3 or 3)
- Approval workflow for visibility upgrades (simple toggle only)
- Department-level visibility mapped to a `departments` table (use shared_with_roles for now)

---

## Success Criteria

1. ✅ `/dashboard/settings/connectors` page shows all connector types grouped by layer AND filterable by category/visibility
2. ✅ Google Drive connection still works (existing storage preserved, just surfaced in the hub)
3. ✅ Creating a BYO connector is role-gated (teacher gets 403, head/slt/admin succeed)
4. ✅ Private BYO connectors are only visible to their creator
5. ✅ Global BYO connectors are visible to everyone in the organisation
6. ✅ `SchoolDataGuardian.scrub()` passes all tests including the old Guardian + pii-masker test cases
7. ✅ `pii-masker` still works as a backwards-compatible re-export
8. ✅ Attendance Story generates a real PDF from real Grove House data via real OpenRouter+Gemini call
9. ✅ PDF shows "Based on DfE Attendance, DfE Census" attribution
10. ✅ PDF shows "Add [Live Attendance]" nudge for missing connectors
11. ✅ Evidence JSON saved to `/tmp/` with prompt + response + guardian result
12. ✅ Guardian audit log records the attendance story generation
13. ✅ Build passes with zero new errors
14. ✅ Honest audit report at `docs/architecture/school-data-guardian-audit.md` is committed
