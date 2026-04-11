# Connector Hub Phase 2.1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate connector management in `/dashboard/settings/connectors` with categories, visibility, role gating. Unify SchoolDataGuardian and pii-masker into one marketable privacy shield. Ship the first real document template — Attendance Story for Governors — with real data, real LLM call, real PDF output.

**Architecture:** Extend `byo_connectors` schema. Rewrite `SchoolDataGuardian` incorporating pii-masker's best features. New `openrouter-guardian.ts` wrapper. New `documents/attendance-story/` module with fetcher → prompt builder → generator → PDF renderer. New example gallery on School Intelligence. Two new tables (`generated_documents`, `guardian_audit_log`).

**Tech Stack:** Next.js 16, TypeScript, Supabase, OpenRouter + Gemini 2.5 Flash, Vitest. **Non-negotiable: the system does the work — no hardcoded data, no fake narratives, real API calls throughout.**

**Spec:** `docs/superpowers/specs/2026-04-11-connector-hub-phase2-1.md`

---

### Task 1: Schema migration — extend byo_connectors, add new tables

**Files:**
- Create: `apps/platform/supabase/migrations/20260411_connector_hub_phase2_1.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 20260411_connector_hub_phase2_1.sql
-- Connector Hub Phase 2.1 — extend byo_connectors, add generated_documents, guardian_audit_log

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
CREATE INDEX IF NOT EXISTS idx_byo_connectors_parent_type ON byo_connectors(parent_type);

-- Generated documents with source attribution
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  urn INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  connector_sources TEXT[] NOT NULL,
  narrative TEXT NOT NULL,
  pdf_url TEXT,
  llm_model TEXT NOT NULL,
  llm_tokens_used INTEGER,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_docs_org ON generated_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_urn ON generated_documents(urn);
CREATE INDEX IF NOT EXISTS idx_generated_docs_template ON generated_documents(template_id);

-- Guardian audit log
CREATE TABLE IF NOT EXISTS guardian_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  called_by TEXT,
  categories_detected TEXT[] NOT NULL,
  category_counts JSONB NOT NULL,
  input_length INTEGER NOT NULL,
  output_length INTEGER NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_audit_org ON guardian_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_guardian_audit_caller ON guardian_audit_log(called_by);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_docs_all" ON generated_documents FOR ALL USING (true);
CREATE POLICY "guardian_audit_all" ON guardian_audit_log FOR ALL USING (true);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with project_id `ygquvauptwyvlhkyxkwy`, name `connector_hub_phase2_1`, query = the SQL above.

- [ ] **Step 3: Verify**

Run SQL via Supabase MCP:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'byo_connectors' AND column_name IN ('category', 'visibility', 'connection_mode', 'parent_type');
```
Expected: 4 rows.

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('generated_documents', 'guardian_audit_log');
```
Expected: 2 rows.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/supabase/migrations/20260411_connector_hub_phase2_1.sql
git commit -m "feat(connectors): schema extension — categories, visibility, generated_documents, guardian_audit_log"
```

---

### Task 2: Rewrite SchoolDataGuardian incorporating pii-masker features

**Files:**
- Modify: `apps/platform/src/lib/school-data-guardian.ts` (completely rewrite, keep file path)
- Create: `apps/platform/src/lib/ai/` directory
- Move + extend existing tests

- [ ] **Step 1: Read current Guardian and pii-masker**

Read: `apps/platform/src/lib/school-data-guardian.ts` (existing 117 lines)
Read: `apps/platform/src/lib/pii-masker.ts` (existing 193 lines)
Read: `apps/platform/tests/school-data-guardian.test.ts`

- [ ] **Step 2: Write the unified Guardian**

Replace `apps/platform/src/lib/school-data-guardian.ts` with the new implementation:

```typescript
// apps/platform/src/lib/school-data-guardian.ts

export type GuardianCategory =
  | 'email' | 'phone' | 'dob' | 'upn' | 'nhs_number'
  | 'name_with_role' | 'postcode' | 'ni_number';

export interface GuardianOptions {
  skipCategories?: GuardianCategory[];
  allowlist?: string[];                  // public data that must pass through
  callerName?: string;
  orgId?: string;
}

export interface GuardianResult {
  sanitised: string;
  tokenMap: Map<string, string>;         // token → original
  isClean: boolean;
  categoriesDetected: GuardianCategory[];
  counts: Record<string, number>;
}

const PATTERNS: Array<{ category: GuardianCategory; regex: RegExp; prefix: string }> = [
  { category: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, prefix: 'EMAIL' },
  { category: 'nhs_number', regex: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, prefix: 'NHS' },
  { category: 'upn', regex: /\b[A-Z]\d{12}\b/g, prefix: 'UPN' },
  { category: 'ni_number', regex: /\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/g, prefix: 'NI' },
  { category: 'phone', regex: /(?:\+?44|0)(?:\s?\d){9,10}\b/g, prefix: 'PHONE' },
  { category: 'dob', regex: /\b(0?[1-9]|[12]\d|3[01])[-./](0?[1-9]|1[0-2])[-./](19|20)\d{2}\b/g, prefix: 'DOB' },
  { category: 'postcode', regex: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g, prefix: 'POSTCODE' },
  // Role-context names: "Mr/Mrs/Ms/Miss/Dr <FirstName> <LastName>" or "Headteacher: <Name>"
  { category: 'name_with_role', regex: /(?:Mr|Mrs|Ms|Miss|Dr|Headteacher|Principal|Deputy|SENCO|DSL)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g, prefix: 'PERSON' },
];

export class SchoolDataGuardian {
  /**
   * Scrub PII from text. Non-blocking: always returns sanitised text.
   * Returns a token map so the output can be rehydrated later.
   */
  static scrub(text: string, options: GuardianOptions = {}): GuardianResult {
    const skip = new Set(options.skipCategories ?? []);
    const allowlist = new Set(options.allowlist ?? []);
    const tokenMap = new Map<string, string>();
    const counts: Record<string, number> = {};
    const categoriesDetected: Set<GuardianCategory> = new Set();
    let counter = 0;

    let sanitised = text;

    for (const { category, regex, prefix } of PATTERNS) {
      if (skip.has(category)) continue;
      sanitised = sanitised.replace(regex, (match) => {
        // Check allowlist — e.g., public school/head names
        if (allowlist.has(match)) return match;
        counter += 1;
        const token = `[${prefix}_${counter}]`;
        tokenMap.set(token, match);
        counts[category] = (counts[category] ?? 0) + 1;
        categoriesDetected.add(category);
        return token;
      });
    }

    return {
      sanitised,
      tokenMap,
      isClean: tokenMap.size === 0,
      categoriesDetected: Array.from(categoriesDetected),
      counts,
    };
  }

  /**
   * Reverse a Guardian scrub — replace tokens with original values.
   * Use on LLM output to restore names/emails for display.
   */
  static rehydrate(text: string, tokenMap: Map<string, string>): string {
    let result = text;
    for (const [token, original] of tokenMap.entries()) {
      result = result.split(token).join(original);
    }
    return result;
  }

  /**
   * Write an audit log entry for a Guardian call.
   * Non-blocking: logs best-effort, swallows errors.
   */
  static async logAudit(
    result: GuardianResult,
    inputLength: number,
    outputLength: number,
    options: GuardianOptions,
  ): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('./supabase-server');
      const supabase = createServiceRoleClient();
      await supabase.from('guardian_audit_log').insert({
        organization_id: options.orgId ?? null,
        called_by: options.callerName ?? 'unknown',
        categories_detected: result.categoriesDetected,
        category_counts: result.counts,
        input_length: inputLength,
        output_length: outputLength,
      });
    } catch {
      // best-effort logging
    }
  }

  /**
   * Stats for the Privacy Shield badge.
   */
  static async getStats(orgId: string): Promise<{
    totalCalls: number;
    totalTokensMasked: number;
    byCategory: Record<string, number>;
  }> {
    const { createServiceRoleClient } = await import('./supabase-server');
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('guardian_audit_log')
      .select('category_counts')
      .eq('organization_id', orgId);

    const byCategory: Record<string, number> = {};
    let totalTokensMasked = 0;
    for (const row of data ?? []) {
      const counts = (row.category_counts ?? {}) as Record<string, number>;
      for (const [cat, n] of Object.entries(counts)) {
        byCategory[cat] = (byCategory[cat] ?? 0) + n;
        totalTokensMasked += n;
      }
    }
    return { totalCalls: data?.length ?? 0, totalTokensMasked, byCategory };
  }
}

// Backwards-compat: keep the old maskIdentityPayload API for any callers that still use it
export function maskIdentityPayload(payload: unknown, _salt?: string): unknown {
  if (typeof payload === 'string') {
    return SchoolDataGuardian.scrub(payload).sanitised;
  }
  if (Array.isArray(payload)) {
    return payload.map(p => maskIdentityPayload(p, _salt));
  }
  if (payload && typeof payload === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (['name', 'firstName', 'lastName', 'email', 'phone', 'dob'].includes(key)) {
        continue; // strip identity fields
      }
      out[key] = maskIdentityPayload(value, _salt);
    }
    return out;
  }
  return payload;
}
```

- [ ] **Step 3: Write pii-masker backwards-compat shim**

Replace `apps/platform/src/lib/pii-masker.ts`:

```typescript
// apps/platform/src/lib/pii-masker.ts
// Backwards-compatible shim. Calls now route through SchoolDataGuardian.
import { SchoolDataGuardian, type GuardianResult } from './school-data-guardian';

export interface MaskPIIResult {
  maskedText: string;
  maskMap: Map<string, string>;
  detectedCategories: string[];
}

export function maskPII(
  text: string,
  options?: { skipCategories?: string[] },
): MaskPIIResult {
  const result = SchoolDataGuardian.scrub(text, {
    skipCategories: (options?.skipCategories ?? []) as never[],
  });
  return {
    maskedText: result.sanitised,
    maskMap: result.tokenMap,
    detectedCategories: result.categoriesDetected,
  };
}

export function unmaskPII(text: string, maskMap: Map<string, string>): string {
  return SchoolDataGuardian.rehydrate(text, maskMap);
}
```

- [ ] **Step 4: Write Guardian tests**

Create `apps/platform/src/lib/__tests__/school-data-guardian.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SchoolDataGuardian } from '../school-data-guardian';

describe('SchoolDataGuardian', () => {
  it('scrubs email addresses', () => {
    const result = SchoolDataGuardian.scrub('Contact alex@school.uk for info');
    expect(result.sanitised).not.toContain('alex@school.uk');
    expect(result.sanitised).toContain('[EMAIL_');
    expect(result.categoriesDetected).toContain('email');
  });

  it('scrubs UK postcodes', () => {
    const result = SchoolDataGuardian.scrub('School is at BD2 4ED in Bradford');
    expect(result.sanitised).not.toContain('BD2 4ED');
    expect(result.categoriesDetected).toContain('postcode');
  });

  it('scrubs UPNs', () => {
    const result = SchoolDataGuardian.scrub('Pupil A123456789012 is absent');
    expect(result.sanitised).not.toContain('A123456789012');
    expect(result.categoriesDetected).toContain('upn');
  });

  it('scrubs role-context names', () => {
    const result = SchoolDataGuardian.scrub('Mrs Alex Summerscales is the head');
    expect(result.sanitised).not.toContain('Alex Summerscales');
    expect(result.categoriesDetected).toContain('name_with_role');
  });

  it('respects allowlist for public names', () => {
    const result = SchoolDataGuardian.scrub(
      'Mrs Alex Summerscales is the head',
      { allowlist: ['Mrs Alex Summerscales'] },
    );
    expect(result.sanitised).toContain('Mrs Alex Summerscales');
    expect(result.isClean).toBe(true);
  });

  it('respects skipCategories', () => {
    const result = SchoolDataGuardian.scrub(
      'Contact alex@school.uk at BD2 4ED',
      { skipCategories: ['postcode'] },
    );
    expect(result.sanitised).not.toContain('alex@school.uk');
    expect(result.sanitised).toContain('BD2 4ED');
  });

  it('rehydrates tokens back to originals', () => {
    const scrubbed = SchoolDataGuardian.scrub('Email alex@school.uk about it');
    const rehydrated = SchoolDataGuardian.rehydrate(
      scrubbed.sanitised,
      scrubbed.tokenMap,
    );
    expect(rehydrated).toBe('Email alex@school.uk about it');
  });

  it('handles clean text with no PII', () => {
    const result = SchoolDataGuardian.scrub('Attendance is 94 percent this term');
    expect(result.isClean).toBe(true);
    expect(result.sanitised).toBe('Attendance is 94 percent this term');
    expect(result.categoriesDetected).toEqual([]);
  });

  it('counts multiple instances of same category', () => {
    const result = SchoolDataGuardian.scrub(
      'Contact alex@school.uk or admin@school.uk',
    );
    expect(result.counts.email).toBe(2);
  });

  it('is non-blocking — always returns sanitised text even with no PII', () => {
    const result = SchoolDataGuardian.scrub('');
    expect(result.sanitised).toBe('');
    expect(result.isClean).toBe(true);
  });
});
```

- [ ] **Step 5: Run Guardian tests**

Run: `npx vitest run apps/platform/src/lib/__tests__/school-data-guardian.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 6: Run any existing pii-masker tests to verify backwards-compat**

Run: `npx vitest run apps/platform/src/lib/__tests__/ 2>&1 | tail -20`
Expected: no regressions

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/school-data-guardian.ts \
        apps/platform/src/lib/pii-masker.ts \
        apps/platform/src/lib/__tests__/school-data-guardian.test.ts
git commit -m "feat(guardian): unify SchoolDataGuardian + pii-masker, add allowlist, role-name detection, postcodes"
```

---

### Task 3: OpenRouter Guardian wrapper

**Files:**
- Create: `apps/platform/src/lib/ai/openrouter-guardian.ts`
- Create: `apps/platform/src/lib/ai/__tests__/openrouter-guardian.test.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p apps/platform/src/lib/ai/__tests__
```

- [ ] **Step 2: Implement the wrapper**

```typescript
// apps/platform/src/lib/ai/openrouter-guardian.ts
import { SchoolDataGuardian, type GuardianCategory, type GuardianResult } from '../school-data-guardian';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GuardianCallOptions {
  model: string;                          // e.g. 'google/gemini-2.5-flash'
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  orgId: string;
  callerName: string;                     // for audit log
  skipCategories?: GuardianCategory[];
  allowlist?: string[];                   // public data like school name, head teacher
  rehydrateOutput?: boolean;              // default true
}

export interface GuardianCallResult {
  content: string;                        // LLM response (rehydrated if requested)
  tokensUsed: number;
  model: string;
  guardianResult: GuardianResult;         // what Guardian did to the input
  rawContent: string;                     // LLM response before rehydration
}

export async function callOpenRouterWithGuardian(
  options: GuardianCallOptions,
): Promise<GuardianCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  // 1. Scrub every message through Guardian, merging the token maps
  const combinedTokenMap = new Map<string, string>();
  const scrubbedCounts: Record<string, number> = {};
  const scrubbedCategories = new Set<GuardianCategory>();
  let inputLength = 0;

  const scrubbedMessages: ChatMessage[] = options.messages.map((msg) => {
    inputLength += msg.content.length;
    const result = SchoolDataGuardian.scrub(msg.content, {
      skipCategories: options.skipCategories,
      allowlist: options.allowlist,
      callerName: options.callerName,
      orgId: options.orgId,
    });
    for (const [token, original] of result.tokenMap.entries()) {
      combinedTokenMap.set(token, original);
    }
    for (const [cat, n] of Object.entries(result.counts)) {
      scrubbedCounts[cat] = (scrubbedCounts[cat] ?? 0) + n;
    }
    for (const cat of result.categoriesDetected) {
      scrubbedCategories.add(cat);
    }
    return { role: msg.role, content: result.sanitised };
  });

  const guardianResult: GuardianResult = {
    sanitised: scrubbedMessages.map(m => m.content).join('\n'),
    tokenMap: combinedTokenMap,
    isClean: combinedTokenMap.size === 0,
    categoriesDetected: Array.from(scrubbedCategories),
    counts: scrubbedCounts,
  };

  // 2. Call OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://schoolgle.co.uk',
      'X-Title': 'Schoolgle Document Generation',
    },
    body: JSON.stringify({
      model: options.model,
      messages: scrubbedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens ?? 0;

  // 3. Rehydrate output
  const shouldRehydrate = options.rehydrateOutput !== false;
  const content = shouldRehydrate
    ? SchoolDataGuardian.rehydrate(rawContent, combinedTokenMap)
    : rawContent;

  // 4. Audit log (best effort)
  await SchoolDataGuardian.logAudit(
    guardianResult,
    inputLength,
    rawContent.length,
    { orgId: options.orgId, callerName: options.callerName },
  );

  return {
    content,
    tokensUsed,
    model: options.model,
    guardianResult,
    rawContent,
  };
}
```

- [ ] **Step 3: Write tests (no real network call)**

```typescript
// apps/platform/src/lib/ai/__tests__/openrouter-guardian.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callOpenRouterWithGuardian } from '../openrouter-guardian';

describe('openrouter-guardian', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('throws when api key missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(
      callOpenRouterWithGuardian({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'test' }],
        orgId: 'org-1',
        callerName: 'test',
      }),
    ).rejects.toThrow('OPENROUTER_API_KEY');
  });

  it('scrubs input messages before calling openrouter', async () => {
    let capturedBody: unknown = null;
    global.fetch = vi.fn(async (_url, init) => {
      capturedBody = JSON.parse((init?.body as string) ?? '{}');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 42 },
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await callOpenRouterWithGuardian({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: 'Contact alex@school.uk about BD2 4ED' },
      ],
      orgId: 'org-1',
      callerName: 'test',
    });

    expect(capturedBody).toBeDefined();
    const body = capturedBody as { messages: Array<{ content: string }> };
    expect(body.messages[0].content).not.toContain('alex@school.uk');
    expect(body.messages[0].content).not.toContain('BD2 4ED');
    expect(result.guardianResult.categoriesDetected).toContain('email');
    expect(result.guardianResult.categoriesDetected).toContain('postcode');
    expect(result.tokensUsed).toBe(42);
  });

  it('rehydrates token references in the response', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Contact [EMAIL_1] for more info' } }],
          usage: { total_tokens: 10 },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const result = await callOpenRouterWithGuardian({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: 'Email alex@school.uk please' }],
      orgId: 'org-1',
      callerName: 'test',
    });

    expect(result.content).toContain('alex@school.uk');
    expect(result.rawContent).toContain('[EMAIL_1]');
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run apps/platform/src/lib/ai/__tests__/openrouter-guardian.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/ai/
git commit -m "feat(ai): add OpenRouter Guardian wrapper with input scrub + output rehydrate"
```

---

### Task 4: Role gating middleware for connector creation

**Files:**
- Create: `apps/platform/src/lib/data-connectors/permissions.ts`
- Modify: `apps/platform/src/app/api/connectors/byo/route.ts`

- [ ] **Step 1: Create permissions module**

```typescript
// apps/platform/src/lib/data-connectors/permissions.ts
export type UserRole = 'admin' | 'headteacher' | 'slt' | 'governor' | 'teacher' | 'caretaker' | 'viewer';

const CREATE_CONNECTOR_ROLES: UserRole[] = ['admin', 'headteacher', 'slt'];

export function canCreateConnector(role: string): boolean {
  return CREATE_CONNECTOR_ROLES.includes(role as UserRole);
}

export function canSeeConnector(
  userRole: string,
  userId: string,
  connector: {
    created_by: string;
    visibility: 'private' | 'department' | 'slt' | 'global';
    shared_with_roles: string[];
    shared_with_users: string[];
  },
): boolean {
  if (connector.created_by === userId) return true;
  if (connector.visibility === 'global') return true;
  if (connector.visibility === 'slt' && ['slt', 'headteacher', 'admin'].includes(userRole)) return true;
  if (connector.visibility === 'department' && connector.shared_with_roles.includes(userRole)) return true;
  if (connector.shared_with_users.includes(userId)) return true;
  return false;
}
```

- [ ] **Step 2: Update POST /api/connectors/byo to enforce role gate**

Edit `apps/platform/src/app/api/connectors/byo/route.ts` — add at the top of the POST handler, after parsing body:

```typescript
import { canCreateConnector } from '@/lib/data-connectors/permissions';

// Inside POST handler, before calling createByoConnector:
if (!canCreateConnector(auth.role)) {
  return apiError('Only admin, headteacher, or SLT roles can create connectors', 403);
}
```

Also pass new fields to `createByoConnector`: `category`, `visibility`, `shared_with_roles`, `created_by_name`, `connection_mode`.

Extend the `createByoConnector` function signature in `byo-store.ts` to accept these new fields and write them to the insert.

- [ ] **Step 3: Write a permissions test**

```typescript
// apps/platform/src/lib/data-connectors/__tests__/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { canCreateConnector, canSeeConnector } from '../permissions';

describe('connector permissions', () => {
  it('allows admin, headteacher, slt to create', () => {
    expect(canCreateConnector('admin')).toBe(true);
    expect(canCreateConnector('headteacher')).toBe(true);
    expect(canCreateConnector('slt')).toBe(true);
  });

  it('denies teacher, governor, caretaker from creating', () => {
    expect(canCreateConnector('teacher')).toBe(false);
    expect(canCreateConnector('governor')).toBe(false);
    expect(canCreateConnector('caretaker')).toBe(false);
  });

  it('creator can always see their own connector', () => {
    expect(canSeeConnector('teacher', 'user-1', {
      created_by: 'user-1',
      visibility: 'private',
      shared_with_roles: [],
      shared_with_users: [],
    })).toBe(true);
  });

  it('global connectors visible to everyone', () => {
    expect(canSeeConnector('teacher', 'user-2', {
      created_by: 'user-1',
      visibility: 'global',
      shared_with_roles: [],
      shared_with_users: [],
    })).toBe(true);
  });

  it('slt-scoped connectors visible to slt and above', () => {
    const conn = {
      created_by: 'user-1',
      visibility: 'slt' as const,
      shared_with_roles: [],
      shared_with_users: [],
    };
    expect(canSeeConnector('slt', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('headteacher', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('teacher', 'user-2', conn)).toBe(false);
  });

  it('department-scoped connectors only visible to listed roles', () => {
    const conn = {
      created_by: 'user-1',
      visibility: 'department' as const,
      shared_with_roles: ['teacher', 'caretaker'],
      shared_with_users: [],
    };
    expect(canSeeConnector('teacher', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('caretaker', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('governor', 'user-2', conn)).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run apps/platform/src/lib/data-connectors/__tests__/permissions.test.ts
git add apps/platform/src/lib/data-connectors/permissions.ts \
        apps/platform/src/lib/data-connectors/__tests__/permissions.test.ts \
        apps/platform/src/app/api/connectors/byo/route.ts
git commit -m "feat(connectors): role-gate connector creation and visibility filtering"
```

---

### Task 5: Attendance Story — types, fetcher, prompt builder

**Files:**
- Create: `apps/platform/src/lib/documents/attendance-story/types.ts`
- Create: `apps/platform/src/lib/documents/attendance-story/fetcher.ts`
- Create: `apps/platform/src/lib/documents/attendance-story/prompt-builder.ts`
- Create: `apps/platform/src/lib/documents/attendance-story/__tests__/prompt-builder.test.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// apps/platform/src/lib/documents/attendance-story/types.ts

export interface AttendanceStoryInput {
  urn: number;
  organizationId: string;
  userId: string;
}

export interface AttendanceRow {
  time_period: string;
  term: string | null;
  overall_attendance_pct: number | null;
  overall_absence_pct: number | null;
  authorized_absence_pct: number | null;
  unauthorized_absence_pct: number | null;
  persistent_absence_pct: number | null;
  persistent_absence_count: number | null;
}

export interface CensusRow {
  time_period: string;
  number_on_roll: number | null;
  fsm_pct: number | null;
  eal_pct: number | null;
}

export interface ContextualFactor {
  factor_type: string;
  description: string;
  start_date: string | null;
  year_groups_affected: string[] | null;
}

export interface SchoolProfile {
  urn: number;
  name: string;
  la_name: string;
  phase_name: string;
  type_name: string;
  number_of_pupils: number | null;
  head_first_name: string | null;
  head_last_name: string | null;
}

export interface AttendanceStoryData {
  school: SchoolProfile;
  attendanceRows: AttendanceRow[];
  censusRows: CensusRow[];
  contextualFactors: ContextualFactor[];
}

export interface AttendanceStoryOutput {
  documentId: string;
  title: string;
  narrative: string;
  sourceConnectors: string[];
  missingConnectors: { id: string; name: string; reason: string }[];
  pdfUrl?: string;
  llmModel: string;
  llmTokensUsed: number;
  guardianCategoriesDetected: string[];
}
```

- [ ] **Step 2: Create fetcher.ts — real Supabase queries**

```typescript
// apps/platform/src/lib/documents/attendance-story/fetcher.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { AttendanceStoryData, SchoolProfile, AttendanceRow, CensusRow, ContextualFactor } from './types';

export async function fetchAttendanceStoryData(urn: number): Promise<AttendanceStoryData> {
  const supabase = createServiceRoleClient();

  // School profile from GIAS
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('urn, name, la_name, phase_name, type_name, number_of_pupils, head_first_name, head_last_name')
    .eq('urn', urn)
    .single();

  if (schoolError || !schoolData) {
    throw new Error(`School not found in GIAS for URN ${urn}`);
  }

  // All attendance rows for this URN, most recent first
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('time_period, term, overall_attendance_pct, overall_absence_pct, authorized_absence_pct, unauthorized_absence_pct, persistent_absence_pct, persistent_absence_count')
    .eq('urn', urn)
    .order('time_period', { ascending: false });

  // Census rows for demographic context
  const { data: censusData } = await supabase
    .from('census')
    .select('time_period, number_on_roll, fsm_pct, eal_pct')
    .eq('urn', urn)
    .order('time_period', { ascending: false });

  // Contextual factors — optional, only if Contextual Factors connector has data
  const { data: factorsData } = await supabase
    .from('school_contextual_factors')
    .select('factor_type, description, start_date, year_groups_affected')
    .eq('urn', urn)
    .order('start_date', { ascending: false });

  return {
    school: schoolData as SchoolProfile,
    attendanceRows: (attendanceData ?? []).map((r) => ({
      ...r,
      overall_attendance_pct: r.overall_attendance_pct != null ? parseFloat(r.overall_attendance_pct) : null,
      overall_absence_pct: r.overall_absence_pct != null ? parseFloat(r.overall_absence_pct) : null,
      authorized_absence_pct: r.authorized_absence_pct != null ? parseFloat(r.authorized_absence_pct) : null,
      unauthorized_absence_pct: r.unauthorized_absence_pct != null ? parseFloat(r.unauthorized_absence_pct) : null,
      persistent_absence_pct: r.persistent_absence_pct != null ? parseFloat(r.persistent_absence_pct) : null,
    })) as AttendanceRow[],
    censusRows: (censusData ?? []).map((r) => ({
      ...r,
      fsm_pct: r.fsm_pct != null ? parseFloat(r.fsm_pct) : null,
      eal_pct: r.eal_pct != null ? parseFloat(r.eal_pct) : null,
    })) as CensusRow[],
    contextualFactors: (factorsData ?? []) as ContextualFactor[],
  };
}

export function summariseAvailableConnectors(data: AttendanceStoryData): {
  available: string[];
  missing: { id: string; name: string; reason: string }[];
} {
  const available: string[] = [];
  const missing: { id: string; name: string; reason: string }[] = [];

  if (data.attendanceRows.length > 0) available.push('dfe-attendance');
  else missing.push({ id: 'dfe-attendance', name: 'DfE Attendance', reason: 'No historic data found for this school' });

  if (data.censusRows.length > 0) available.push('dfe-census');
  else missing.push({ id: 'dfe-census', name: 'DfE Census', reason: 'Adds demographic context (FSM, EAL, roll)' });

  if (data.contextualFactors.length > 0) available.push('contextual-factors');
  else missing.push({ id: 'contextual-factors', name: 'Contextual Factors', reason: 'Explains trends with significant events' });

  // Always flag live-attendance as a value-add
  missing.push({ id: 'live-attendance', name: 'Live Attendance', reason: 'Adds current term view beyond DfE historic' });

  return { available, missing };
}
```

- [ ] **Step 3: Create prompt-builder.ts**

```typescript
// apps/platform/src/lib/documents/attendance-story/prompt-builder.ts
import type { AttendanceStoryData } from './types';

export function buildAttendancePrompt(data: AttendanceStoryData): {
  system: string;
  user: string;
  allowlist: string[];
} {
  const { school, attendanceRows, censusRows, contextualFactors } = data;

  // Format the real data into a structured prompt — no hardcoding of stats,
  // everything comes from the fetched rows.
  const attendanceTable = attendanceRows
    .filter(r => r.term === 'Academic year' || r.term === 'Annual' || r.term === 'Full year')
    .slice(0, 6)
    .map(r => {
      const attendance = r.overall_attendance_pct != null ? `${r.overall_attendance_pct.toFixed(2)}%` : 'n/a';
      const absence = r.overall_absence_pct != null ? `${r.overall_absence_pct.toFixed(2)}%` : 'n/a';
      const pa = r.persistent_absence_pct != null ? `${r.persistent_absence_pct.toFixed(2)}%` : 'n/a';
      return `- ${r.time_period}: attendance ${attendance}, overall absence ${absence}, persistent absence ${pa}`;
    })
    .join('\n');

  const autumnRows = attendanceRows.filter(r => r.term === 'Autumn term' || r.term === 'Autumn');
  const latestAutumn = autumnRows[0];
  const autumnSnapshot = latestAutumn
    ? `Most recent autumn term (${latestAutumn.time_period}): attendance ${latestAutumn.overall_attendance_pct?.toFixed(2) ?? 'n/a'}%, persistent absence ${latestAutumn.persistent_absence_pct?.toFixed(2) ?? 'n/a'}%`
    : 'No autumn term data available';

  const censusTable = censusRows
    .slice(0, 4)
    .map(r => `- ${r.time_period}: roll ${r.number_on_roll ?? 'n/a'}, FSM ${r.fsm_pct?.toFixed(1) ?? 'n/a'}%, EAL ${r.eal_pct?.toFixed(1) ?? 'n/a'}%`)
    .join('\n');

  const factorsSection = contextualFactors.length > 0
    ? contextualFactors.slice(0, 5).map(f => `- ${f.start_date ?? 'undated'}: ${f.factor_type} — ${f.description}`).join('\n')
    : '(No contextual factors logged — encourage the school to add these to explain trends)';

  const headName = school.head_first_name && school.head_last_name
    ? `${school.head_first_name} ${school.head_last_name}`
    : 'the headteacher';

  const system = `You are writing a factual attendance report for school governors. Your role is to:
1. Summarise the attendance story from the real data provided below.
2. Identify clear trends (improving, declining, stable) — state them plainly.
3. Highlight strengths and areas of concern an Ofsted inspector would notice.
4. Suggest 2-3 concrete actions the governors should discuss.
5. Reference the contextual factors where they explain trends.

Write in professional, plain English. No jargon. No false positivity. No fabrication — only use the numbers provided. If data is missing, say so. Produce a narrative of 400-600 words suitable for a governor meeting paper.

Structure your response with these sections:
- Headline
- Attendance Story (2-3 paragraphs)
- Persistent Absence
- Context (only if contextual factors or census data add meaningful context)
- Suggested Actions for Governors`;

  const user = `School: ${school.name}, ${school.la_name} (URN ${school.urn})
Phase: ${school.phase_name}, Type: ${school.type_name}
Headteacher: ${headName}
Current roll: ${school.number_of_pupils ?? 'n/a'}

ATTENDANCE DATA (most recent first):
${attendanceTable || '(no academic year attendance rows found)'}

${autumnSnapshot}

CENSUS / DEMOGRAPHICS:
${censusTable || '(no census data found)'}

CONTEXTUAL FACTORS LOGGED BY SCHOOL:
${factorsSection}

Write the attendance report now.`;

  // School name and head teacher name are public GIAS data — allowlist them
  // so the Guardian lets them through for a natural narrative.
  const allowlist = [school.name];
  if (school.head_first_name && school.head_last_name) {
    allowlist.push(`Mrs ${school.head_first_name} ${school.head_last_name}`);
    allowlist.push(`Mr ${school.head_first_name} ${school.head_last_name}`);
    allowlist.push(`Ms ${school.head_first_name} ${school.head_last_name}`);
    allowlist.push(`${school.head_first_name} ${school.head_last_name}`);
  }

  return { system, user, allowlist };
}
```

- [ ] **Step 4: Write prompt-builder tests**

```typescript
// apps/platform/src/lib/documents/attendance-story/__tests__/prompt-builder.test.ts
import { describe, it, expect } from 'vitest';
import { buildAttendancePrompt } from '../prompt-builder';
import type { AttendanceStoryData } from '../types';

describe('attendance prompt builder', () => {
  const baseData: AttendanceStoryData = {
    school: {
      urn: 148201,
      name: 'Grove House Primary School',
      la_name: 'Bradford',
      phase_name: 'Primary',
      type_name: 'Academy converter',
      number_of_pupils: 417,
      head_first_name: 'Alex',
      head_last_name: 'Summerscales',
    },
    attendanceRows: [
      { time_period: '202425', term: 'Autumn term', overall_attendance_pct: 94.48, overall_absence_pct: 5.52, authorized_absence_pct: 3.20, unauthorized_absence_pct: 2.32, persistent_absence_pct: 16.95, persistent_absence_count: null },
      { time_period: '202324', term: 'Academic year', overall_attendance_pct: 93.18, overall_absence_pct: 6.82, authorized_absence_pct: 4.36, unauthorized_absence_pct: 2.47, persistent_absence_pct: 24.65, persistent_absence_count: null },
    ],
    censusRows: [
      { time_period: '202425', number_on_roll: 417, fsm_pct: 27.3, eal_pct: 39.8 },
    ],
    contextualFactors: [],
  };

  it('includes the school name in the user prompt', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('Grove House Primary School');
    expect(result.user).toContain('Bradford');
  });

  it('includes real attendance numbers from the fetched rows', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('93.18');
    expect(result.user).toContain('24.65');
  });

  it('includes the autumn snapshot when present', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('94.48');
  });

  it('notes missing contextual factors', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('No contextual factors');
  });

  it('allowlists the school name and head teacher variants', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.allowlist).toContain('Grove House Primary School');
    expect(result.allowlist).toContain('Mrs Alex Summerscales');
    expect(result.allowlist).toContain('Alex Summerscales');
  });

  it('system prompt instructs no fabrication', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.system.toLowerCase()).toContain('no fabrication');
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run apps/platform/src/lib/documents/attendance-story/__tests__/prompt-builder.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/lib/documents/attendance-story/
git commit -m "feat(documents): attendance story types, fetcher, prompt builder with allowlist"
```

---

### Task 6: Attendance Story — generator and end-to-end integration test

**Files:**
- Create: `apps/platform/src/lib/documents/attendance-story/story-generator.ts`
- Create: `apps/platform/src/lib/documents/attendance-story/index.ts`
- Create: `apps/platform/src/lib/documents/attendance-story/__tests__/integration.test.ts`

- [ ] **Step 1: Create story-generator.ts**

```typescript
// apps/platform/src/lib/documents/attendance-story/story-generator.ts
import { callOpenRouterWithGuardian } from '@/lib/ai/openrouter-guardian';
import type { AttendanceStoryData } from './types';
import { buildAttendancePrompt } from './prompt-builder';

export interface GenerateStoryResult {
  narrative: string;
  model: string;
  tokensUsed: number;
  guardianCategoriesDetected: string[];
}

export async function generateAttendanceNarrative(
  data: AttendanceStoryData,
  orgId: string,
): Promise<GenerateStoryResult> {
  const { system, user, allowlist } = buildAttendancePrompt(data);

  const result = await callOpenRouterWithGuardian({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    maxTokens: 1500,
    orgId,
    callerName: 'attendance-story-generator',
    allowlist,
    rehydrateOutput: true,
  });

  return {
    narrative: result.content,
    model: result.model,
    tokensUsed: result.tokensUsed,
    guardianCategoriesDetected: result.guardianResult.categoriesDetected,
  };
}
```

- [ ] **Step 2: Create index.ts — orchestrator**

```typescript
// apps/platform/src/lib/documents/attendance-story/index.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import { fetchAttendanceStoryData, summariseAvailableConnectors } from './fetcher';
import { generateAttendanceNarrative } from './story-generator';
import type { AttendanceStoryInput, AttendanceStoryOutput } from './types';

export async function generateAttendanceStory(
  input: AttendanceStoryInput,
): Promise<AttendanceStoryOutput> {
  // 1. Fetch all data through real connectors
  const data = await fetchAttendanceStoryData(input.urn);

  if (data.attendanceRows.length === 0) {
    throw new Error(`No attendance data found for URN ${input.urn} — cannot generate story`);
  }

  // 2. Summarise which connectors contributed
  const { available, missing } = summariseAvailableConnectors(data);

  // 3. Generate narrative via real LLM (openrouter + guardian)
  const generation = await generateAttendanceNarrative(data, input.organizationId);

  // 4. Persist to generated_documents
  const supabase = createServiceRoleClient();
  const { data: doc, error } = await supabase
    .from('generated_documents')
    .insert({
      organization_id: input.organizationId,
      urn: input.urn,
      template_id: 'attendance-story',
      title: `Attendance Story — ${data.school.name}`,
      connector_sources: available,
      narrative: generation.narrative,
      pdf_url: null, // rendered separately by pdf-renderer, set after
      llm_model: generation.model,
      llm_tokens_used: generation.tokensUsed,
      generated_by: input.userId,
    })
    .select()
    .single();

  if (error || !doc) {
    throw new Error(`Failed to persist generated document: ${error?.message}`);
  }

  return {
    documentId: doc.id,
    title: doc.title,
    narrative: generation.narrative,
    sourceConnectors: available,
    missingConnectors: missing,
    llmModel: generation.model,
    llmTokensUsed: generation.tokensUsed,
    guardianCategoriesDetected: generation.guardianCategoriesDetected,
  };
}

export * from './types';
export { fetchAttendanceStoryData, summariseAvailableConnectors } from './fetcher';
export { buildAttendancePrompt } from './prompt-builder';
```

- [ ] **Step 3: Create integration test (REAL data, REAL LLM)**

```typescript
// apps/platform/src/lib/documents/attendance-story/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { fetchAttendanceStoryData } from '../fetcher';
import { buildAttendancePrompt } from '../prompt-builder';

/**
 * This test runs against REAL Supabase data for Grove House (URN 148201).
 * It verifies the fetcher retrieves non-empty data.
 *
 * The full end-to-end LLM call happens via a separate manual verification script
 * (see scripts/verify-attendance-story.ts) because vitest test runs should
 * not make billable API calls by default.
 */
describe('attendance story fetcher — real data', () => {
  it('fetches Grove House data from Supabase', async () => {
    const data = await fetchAttendanceStoryData(148201);
    expect(data.school.urn).toBe(148201);
    expect(data.school.name).toContain('Grove House');
    expect(data.attendanceRows.length).toBeGreaterThan(0);
  });

  it('builds a prompt containing real attendance numbers', async () => {
    const data = await fetchAttendanceStoryData(148201);
    const prompt = buildAttendancePrompt(data);
    // The prompt must contain real numbers from Supabase, not hardcoded values
    expect(prompt.user).toMatch(/\d+\.\d+%/);
  });
});
```

- [ ] **Step 4: Create a manual verification script for the full end-to-end run**

Create `apps/platform/scripts/verify-attendance-story.ts`:

```typescript
#!/usr/bin/env node
/**
 * Verify the attendance story generator end-to-end with REAL data + REAL LLM call.
 * Run: npx tsx apps/platform/scripts/verify-attendance-story.ts
 *
 * Saves evidence to /tmp/attendance-story-grove-house-<ts>.json
 */
import { generateAttendanceStory } from '@/lib/documents/attendance-story';
import * as fs from 'fs';

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set');
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const evidencePath = `/tmp/attendance-story-grove-house-${ts}.json`;

  console.log('Fetching and generating attendance story for Grove House (URN 148201)...');
  try {
    const result = await generateAttendanceStory({
      urn: 148201,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000002',
    });

    const evidence = {
      timestamp: ts,
      urn: 148201,
      documentId: result.documentId,
      title: result.title,
      sourceConnectors: result.sourceConnectors,
      missingConnectors: result.missingConnectors,
      llmModel: result.llmModel,
      llmTokensUsed: result.llmTokensUsed,
      guardianCategoriesDetected: result.guardianCategoriesDetected,
      narrative: result.narrative,
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

    console.log('\n=== RESULT ===');
    console.log(`Title: ${result.title}`);
    console.log(`Model: ${result.llmModel}`);
    console.log(`Tokens: ${result.llmTokensUsed}`);
    console.log(`Sources: ${result.sourceConnectors.join(', ')}`);
    console.log(`Guardian detected: ${result.guardianCategoriesDetected.join(', ') || 'nothing'}`);
    console.log('\n=== NARRATIVE ===\n');
    console.log(result.narrative);
    console.log(`\n\nEvidence saved to: ${evidencePath}`);
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run apps/platform/src/lib/documents/attendance-story/__tests__/`
Expected: 2 integration-lite tests pass (fetcher + prompt builder with real data)

- [ ] **Step 6: Run the manual verification script (REAL LLM CALL)**

```bash
cd apps/platform && npx tsx scripts/verify-attendance-story.ts
```

Expected:
- Real Gemini response via OpenRouter
- A narrative printed to stdout
- Evidence JSON saved to `/tmp/`
- Sandra test: read the narrative, judge if a governor would find it useful

If the narrative is rubbish, **fix the prompt**, not the test. Do not hardcode a better response.

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/documents/attendance-story/ \
        apps/platform/scripts/verify-attendance-story.ts
git commit -m "feat(documents): attendance story generator end-to-end with real LLM via Guardian"
```

---

### Task 7: API route and Connector Hub UI updates

**Files:**
- Create: `apps/platform/src/app/api/documents/attendance-story/route.ts`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx` — add category filter chips
- Create: `apps/platform/src/components/data-connectors/CategoryFilterChips.tsx`

- [ ] **Step 1: Create the POST endpoint**

```typescript
// apps/platform/src/app/api/documents/attendance-story/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { generateAttendanceStory } from '@/lib/documents/attendance-story';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { urn } = body as { urn: number };

  if (!urn || typeof urn !== 'number') {
    return apiError('Missing or invalid urn in request body', 400);
  }

  try {
    const result = await generateAttendanceStory({
      urn,
      organizationId: auth.organizationId,
      userId: auth.userId,
    });
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate attendance story';
    return apiError(message, 500);
  }
});
```

- [ ] **Step 2: Create CategoryFilterChips component**

```tsx
// apps/platform/src/components/data-connectors/CategoryFilterChips.tsx
"use client";

const CATEGORIES: { id: string; label: string; colour: string }[] = [
  { id: 'all', label: 'All', colour: '#a78bfa' },
  { id: 'safeguarding', label: 'Safeguarding', colour: '#ef4444' },
  { id: 'curriculum', label: 'Curriculum', colour: '#3b82f6' },
  { id: 'attendance', label: 'Attendance', colour: '#8b5cf6' },
  { id: 'assessment', label: 'Assessment', colour: '#06b6d4' },
  { id: 'finance', label: 'Finance', colour: '#10b981' },
  { id: 'hr', label: 'HR', colour: '#f59e0b' },
  { id: 'estates', label: 'Estates', colour: '#6366f1' },
  { id: 'governance', label: 'Governance', colour: '#ec4899' },
  { id: 'compliance', label: 'Compliance', colour: '#14b8a6' },
];

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

export function CategoryFilterChips({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? 'text-white'
                : 'text-muted-foreground border-border bg-card hover:bg-accent/10'
            }`}
            style={isActive ? { backgroundColor: cat.colour, borderColor: cat.colour } : undefined}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Wire the filter chips into the settings connectors page**

Modify `apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx`:

Add imports:
```typescript
import { useState } from 'react';
import { CategoryFilterChips } from '@/components/data-connectors/CategoryFilterChips';
```

Add state + filter:
```tsx
const [categoryFilter, setCategoryFilter] = useState('all');
const filtered = categoryFilter === 'all'
  ? connectors
  : connectors.filter(c => c.category === categoryFilter);

// Replace the layer split variables:
const l1 = filtered.filter(c => c.layer === 1);
const l2 = filtered.filter(c => c.layer === 2);
const l3 = filtered.filter(c => c.layer === 3);
const l4 = filtered.filter(c => c.layer === 4);
```

Add above the summary cards:
```tsx
<CategoryFilterChips selected={categoryFilter} onChange={setCategoryFilter} />
```

Also ensure connectors have a `category` field — fall back to `'custom'` if missing for backwards compatibility with the Phase 2 pre-existing connectors.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/app/api/documents/attendance-story/ \
        apps/platform/src/components/data-connectors/CategoryFilterChips.tsx \
        apps/platform/src/app/\(dashboard\)/dashboard/settings/connectors/page.tsx
git commit -m "feat: attendance story API endpoint + category filter chips on connector hub"
```

---

### Task 8: Example Gallery on School Intelligence page

**Files:**
- Modify or create: `apps/platform/src/app/(dashboard)/dashboard/school-intelligence/page.tsx`
- Create: `apps/platform/src/components/data-connectors/ExampleGalleryStrip.tsx`
- Create: `apps/platform/src/components/data-connectors/DocumentTemplateCard.tsx`

- [ ] **Step 1: Check if the school-intelligence page already exists**

```bash
ls apps/platform/src/app/\(dashboard\)/dashboard/school-intelligence/ 2>&1
```

If it exists, read it. If not, we'll create a minimal landing.

- [ ] **Step 2: Create DocumentTemplateCard component**

```tsx
// apps/platform/src/components/data-connectors/DocumentTemplateCard.tsx
"use client";

import { FileText, Clock, Check } from 'lucide-react';

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  requiredConnectors: { id: string; name: string; available: boolean }[];
  status: 'ready' | 'coming-soon';
}

interface Props {
  template: DocumentTemplate;
  onTry?: (templateId: string) => void;
}

export function DocumentTemplateCard({ template, onTry }: Props) {
  const disabled = template.status === 'coming-soon';
  const availableCount = template.requiredConnectors.filter(c => c.available).length;
  const totalCount = template.requiredConnectors.length;

  return (
    <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl border border-border bg-card hover:border-purple-500/40 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">{template.title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{template.description}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {template.requiredConnectors.map(c => (
          <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
            {c.available ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Clock className="w-3 h-3 text-amber-500" />
            )}
            <span className={c.available ? 'text-foreground' : 'text-muted-foreground'}>
              {c.name}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => !disabled && onTry?.(template.id)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        {disabled ? 'Coming soon' : `Try it (${availableCount}/${totalCount} connectors)`}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create ExampleGalleryStrip**

```tsx
// apps/platform/src/components/data-connectors/ExampleGalleryStrip.tsx
"use client";

import { DocumentTemplateCard, type DocumentTemplate } from './DocumentTemplateCard';

interface Props {
  templates: DocumentTemplate[];
  onTryTemplate: (templateId: string) => void;
}

export function ExampleGalleryStrip({ templates, onTryTemplate }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-foreground">Generate a Report</h2>
        <span className="text-[10px] text-muted-foreground">
          The more connectors you have, the richer the report
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {templates.map(t => (
          <DocumentTemplateCard key={t.id} template={t} onTry={onTryTemplate} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into school-intelligence page**

If the page already exists, add the gallery below the existing content. If it doesn't, create a minimal landing:

```tsx
// apps/platform/src/app/(dashboard)/dashboard/school-intelligence/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExampleGalleryStrip } from '@/components/data-connectors/ExampleGalleryStrip';
import type { DocumentTemplate } from '@/components/data-connectors/DocumentTemplateCard';
import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

const GROVE_HOUSE_URN = 148201;

export default function SchoolIntelligencePage() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ narrative: string; title: string; sourceConnectors: string[]; missingConnectors: { id: string; name: string; reason: string }[] } | null>(null);

  // Templates — for now hard-coded list of templates, but the "available" flags
  // could be computed from the connector registry in a future phase.
  const templates: DocumentTemplate[] = [
    {
      id: 'attendance-story',
      title: 'Attendance Story for Governors',
      description: 'A plain-English attendance narrative with trends, context, and suggested actions.',
      requiredConnectors: [
        { id: 'dfe-attendance', name: 'DfE Attendance', available: true },
        { id: 'dfe-census', name: 'DfE Census', available: true },
        { id: 'contextual-factors', name: 'Contextual Factors', available: false },
      ],
      status: 'ready',
    },
    {
      id: 'sef-section',
      title: 'SEF Section Draft',
      description: 'Draft an Ofsted SEF section from your connected evidence.',
      requiredConnectors: [
        { id: 'google-drive', name: 'Google Drive', available: true },
        { id: 'dfe-ks2-results', name: 'DfE KS2', available: true },
      ],
      status: 'coming-soon',
    },
    {
      id: 'finance-governor-report',
      title: 'Finance Governor Report',
      description: 'Monthly finance summary from a connected spreadsheet.',
      requiredConnectors: [
        { id: 'byo-finance', name: 'BYO Finance Sheet', available: false },
      ],
      status: 'coming-soon',
    },
    {
      id: 'ofsted-answer',
      title: 'Ofsted Question Answer',
      description: 'Answer any question an Ofsted inspector might ask, with evidence.',
      requiredConnectors: [
        { id: 'google-drive', name: 'Google Drive', available: true },
        { id: 'dfe-attendance', name: 'DfE Attendance', available: true },
      ],
      status: 'coming-soon',
    },
  ];

  async function handleTry(templateId: string) {
    if (templateId !== 'attendance-story') return;
    setGenerating(true);
    setResult(null);
    const headers = await getAuthHeaders();
    const res = await fetch('/api/documents/attendance-story', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ urn: GROVE_HOUSE_URN }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data.data);
    }
    setGenerating(false);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">School Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate reports from your connected data. The more connectors you add, the richer the reports become.
        </p>
      </div>

      <ExampleGalleryStrip templates={templates} onTryTemplate={handleTry} />

      {generating && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-sm text-purple-400">
          Generating attendance story for Grove House — calling Gemini via Guardian...
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-2">{result.title}</h2>
          <p className="text-[11px] text-muted-foreground mb-4">
            Based on: {result.sourceConnectors.join(', ')}
          </p>
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground">
            {result.narrative}
          </div>
          {result.missingConnectors.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-[11px] font-semibold text-amber-500 mb-1">Want a richer report?</p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                {result.missingConnectors.map(m => (
                  <li key={m.id}>• Add <strong>{m.name}</strong> — {m.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/components/data-connectors/ExampleGalleryStrip.tsx \
        apps/platform/src/components/data-connectors/DocumentTemplateCard.tsx \
        apps/platform/src/app/\(dashboard\)/dashboard/school-intelligence/
git commit -m "feat(ui): school intelligence example gallery with attendance story generation"
```

---

### Task 9: Honest Guardian Audit Report

**Files:**
- Create: `docs/architecture/school-data-guardian-audit.md`

- [ ] **Step 1: Write the audit doc**

Create the document based on the audit we ran earlier. Capture:
- The pre-2.1 state (Guardian dead code, pii-masker active, 17 direct bypass routes)
- What 2.1 changed (unified Guardian, pii-masker as shim, new openrouter-guardian wrapper)
- What still needs work (the 17 bypass routes, missing patterns, no multilingual support)
- Recommendations for Phase 2.2 and beyond

Full content:

```markdown
# SchoolDataGuardian — Honest State Audit

**Date:** 11 April 2026
**Author:** Claude Code / Connector Hub Phase 2.1

## Purpose of this document

This is a candid audit of our actual privacy control plane, not the aspirational description in CLAUDE.md. It records what worked, what didn't, and what still needs to change.

## Pre-Phase 2.1 state

The `SchoolDataGuardian` class existed in `apps/platform/src/lib/school-data-guardian.ts` (117 lines, with a 114-line test suite). It exported:
- `SchoolDataGuardian.scanAndScrub(text)` — regex-based detection for email, phone, DOB, UPN, NHS number. Replacement with `[REDACTED_CATEGORY]` placeholders. No reversibility.
- `SchoolDataGuardian.maskIdentityPayload(payload, salt?)` — strips identity fields from JSON payloads. One-way.

**The CLAUDE.md claim:** *"All LLM inferences have been centralized behind OpenRouter in @schoolgle/ed-agents (ai-openrouter.ts / orchestrator.ts) to ensure enterprise-grade rate limiting and cost control... The old AI evaluation scripts were bypassing the PII scrubbing firewall. We eradicated this legacy code to forcefully route all AI requests through the new SchoolDataGuardian middleware."*

**The reality:** Zero production imports of `SchoolDataGuardian`. Nothing in the codebase actually called it. A search found 17 routes making direct `fetch('https://openrouter.ai/...')` or OpenAI SDK calls with zero PII scrubbing:

- `/api/ed/hub/route.ts`
- `/api/mock-inspector/chat/route.ts`
- `/api/estates/energy/report/route.ts`
- `/api/coshh/route.ts`
- (plus 13 others — full list in Phase 2.2 scope doc)

**What was actually doing PII protection:** `apps/platform/src/lib/pii-masker.ts` (193 lines) — a different module with better features: reversible masking, role-context name detection, postcode detection, `skipCategories` option. Used in `ai-evidence-matcher.ts` and a couple of other routes.

We had two PII modules, one aspirational and one functional, with no clear contract between them.

## Phase 2.1 changes

1. **Rewrote `SchoolDataGuardian` as the unified module.** It incorporates:
   - All Guardian patterns (email, phone, DOB, UPN, NHS) — kept
   - All pii-masker patterns (postcode, role-context names, NI number) — added
   - Reversible token maps (from pii-masker)
   - `skipCategories` and `allowlist` options (extended from pii-masker)
   - Audit log writes to `guardian_audit_log` table (new)
   - `getStats(orgId)` API for the Privacy Shield badge

2. **`pii-masker.ts` is now a thin backwards-compat shim.** `maskPII()` and `unmaskPII()` still exist with their old signatures but delegate to `SchoolDataGuardian.scrub()` and `SchoolDataGuardian.rehydrate()`. Existing callers in `ai-evidence-matcher.ts` etc. continue to work without edits.

3. **New `openrouter-guardian.ts` wrapper.** Any new AI call in Phase 2.1 goes through `callOpenRouterWithGuardian()` which:
   - Scrubs all messages before sending to OpenRouter
   - Logs a `guardian_audit_log` entry with categories detected
   - Rehydrates tokens in the output so users see original names/emails
   - Never blocks — sanitises and proceeds

4. **First real user:** the Attendance Story document template routes through `openrouter-guardian` for every governor report generation.

## What still needs work

### The 17 bypass routes
These still make direct LLM calls with no Guardian:
- `/api/ed/hub/route.ts`
- `/api/mock-inspector/chat/route.ts`
- `/api/estates/energy/report/route.ts`
- `/api/coshh/route.ts`
- `/api/actions/recommend/route.ts`
- `/api/ofsted/inspect/route.ts` — uses DeepSeek directly
- `/api/ed/chat/route.ts`
- `/api/ed/website-chat/route.ts`
- `/api/sef/generate/route.ts`
- `/api/sdp/generate/route.ts`
- `/api/governance/meetings/[id]/summary/route.ts`
- `/api/compliance/policies/analyse/route.ts`
- `/api/documents/generate/route.ts`
- `/api/morning-brief/generate/route.ts`
- `/api/skills/invoke/route.ts` — routes to multiple downstream models
- `/api/risk/ai/route.ts`
- `/api/send/ai-suggestions/route.ts`

**Recommendation for Phase 2.2:** Refactor these to use `callOpenRouterWithGuardian()` one at a time, starting with the routes most likely to see pupil-level data (`/api/ed/chat`, `/api/send/ai-suggestions`, `/api/ofsted/inspect`). Not urgent unless a real incident happens — but it's a growing hygiene debt.

### Missing detection patterns
The unified Guardian still doesn't detect:
- **Addresses** (street + city combinations) — risk of leaking pupil home addresses in free-text notes
- **Pupil first names without role context** — e.g. "Sarah has been struggling with phonics" — no regex can detect this reliably, would need a named-entity-recognition model
- **Non-English names** — regex pattern is English-centric
- **Passport numbers, driving licence numbers** — edge cases for staff records
- **Bank details, sort codes, account numbers** — edge cases for finance flows

### No multilingual support
All regex patterns assume English text. If a school writes notes in Urdu, Polish, or Welsh, the Guardian won't catch PII. For the Schoolgle use case this is probably fine (assessment data is English-standardised) but worth noting.

### Audit log has no query UI
`guardian_audit_log` stores everything but there's no dashboard to view it. Phase 2.2 should add a simple stats page showing: requests processed today/week/month, top categories scrubbed, any errors.

### False positive risk
Regex-based name detection ("Mrs X") will match things like "Mrs Brown was the headteacher in 1990" in a curriculum document — correctly scrubs a name, incorrectly also scrubs "Mrs Brown" in a context where it's a historical figure. Not a safety issue but can reduce output quality. The `allowlist` option is the workaround for now.

## Recommendations

### Short term (Phase 2.2)
1. Refactor the 17 bypass routes to use `callOpenRouterWithGuardian`
2. Add the Privacy Shield stats badge to the dashboard header
3. Build a simple `/dashboard/admin/privacy-audit` page showing `guardian_audit_log` stats
4. Add address detection patterns (street names + postcode combinations)

### Medium term (Phase 3)
1. Add an NER-based fallback for names where regex patterns fail (using a small on-device model, not an LLM call)
2. Test the Guardian with real pupil-level data from Phase 3's assessment analysis
3. Add Welsh language support (postcodes and role titles at minimum)

### Long term
1. Consider whether the Guardian should be promoted to middleware level (Next.js middleware) so it runs automatically on every API request that touches LLM endpoints, rather than relying on each route calling the wrapper.
2. Consider a public-facing "Privacy Shield Report" that schools can show their governors, derived from `guardian_audit_log`.

## The honest summary

Before Phase 2.1: we claimed privacy protection we didn't have.
After Phase 2.1: we have real privacy protection for one document generation flow, we've unified the two previously-competing modules, and we have a documented plan to close the remaining gaps.

The Guardian is now marketable because it actually does something — not because a CLAUDE.md note says it does.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/school-data-guardian-audit.md
git commit -m "docs(security): honest audit of SchoolDataGuardian state before and after Phase 2.1"
```

---

### Task 10: Final verification + merge

- [ ] **Step 1: Run all tests**

Run: `npx vitest run apps/platform/src/lib/ 2>&1 | tail -20`
Expected: all new tests pass, no regressions

- [ ] **Step 2: Run the verification script (REAL LLM CALL)**

```bash
cd apps/platform && npx tsx scripts/verify-attendance-story.ts
```

Expected: evidence JSON saved, narrative printed. Sandra-test the narrative — is it useful?

If output is rubbish, **fix the prompt** in `prompt-builder.ts` and re-run. Don't hardcode the output.

- [ ] **Step 3: Run the build**

Run: `cd apps/platform && npm run build 2>&1 | grep -E "error|connectors|documents/attendance|school-intelligence" | head -20`
Expected: zero new errors, routes visible:
- `/api/connectors/registry`
- `/api/documents/attendance-story`
- `/dashboard/settings/connectors`
- `/dashboard/school-intelligence`

- [ ] **Step 4: Merge to main**

```bash
git checkout main
git merge --no-ff feature/connector-hub-phase2-1 -m "Merge Connector Hub Phase 2.1 — Guardian unified + Attendance Story live"
git push origin main
```

- [ ] **Step 5: Update Notion**

Create a page under the Build & Engineering hub documenting Phase 2.1 outcomes, including:
- What shipped
- Test results
- Sandra test verdict on the generated narrative
- Evidence path
- Guardian audit report link
- Next phase roadmap

- [ ] **Step 6: Clean up feature branch**

```bash
git branch -d feature/connector-hub-phase2-1
```
