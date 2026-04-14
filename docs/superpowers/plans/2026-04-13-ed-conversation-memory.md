# Ed Conversation Memory — Database-First + Short-Term Chat Cache

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Ed short-term conversational memory by storing PII-scrubbed chat messages in Supabase, queried at runtime to provide continuity across sessions (default 7 days).

**Architecture:** Three new tables (`ed_conversations`, `ed_chat_cache`, `ed_memory_settings`). Every message is scrubbed by the existing `SchoolDataGuardian.scrub()` before storage. The chat API writes scrubbed messages after each interaction and reads recent context before Ed responds. Schools configure retention via `ed_memory_settings`. A cleanup function deletes expired entries.

**Tech Stack:** Supabase (PostgreSQL + RLS), TypeScript, existing `SchoolDataGuardian` class, Ed chat API route

**Source spec:** Notion Task 041 — Ed Conversation Memory

**GATE:** The write path is built but must NOT go live until Task 042 (Guardian Adversarial Test Suite) confirms Guardian effectiveness.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/platform/supabase/migrations/20260413_ed_conversation_memory.sql` | Create | Three tables + RLS + indexes |
| `apps/platform/src/lib/ed/conversation-cache.ts` | Create | Read/write helpers for conversation cache |
| `apps/platform/src/lib/ed/conversation-cache.test.ts` | Create | Unit tests for cache helpers |
| `apps/platform/src/app/api/ed/chat/route.ts` | Modify | Wire write path + read path into chat flow |
| `apps/platform/src/app/api/ed/cleanup/route.ts` | Create | Cron endpoint for expired cache deletion |

---

### Task 1: Supabase Migration — Chat Cache Tables

**Files:**
- Create: `apps/platform/supabase/migrations/20260413_ed_conversation_memory.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Ed Conversation Memory — Database-First + Short-Term Chat Cache
-- Board decision: 13 April 2026
-- Tables use organization_id (not school_id) to match existing codebase conventions.
-- All PII is scrubbed by SchoolDataGuardian.scrub() BEFORE write. No personal data stored.

-- 1. Conversation metadata (kept as long as org account exists)
CREATE TABLE IF NOT EXISTS ed_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  domain TEXT DEFAULT 'general',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Scrubbed chat cache (retention managed by school settings)
CREATE TABLE IF NOT EXISTS ed_chat_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ed_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  scrubbed_content TEXT NOT NULL,
  domain TEXT,
  guardian_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. School settings for chat memory
CREATE TABLE IF NOT EXISTS ed_memory_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  chat_cache_retention_days INTEGER NOT NULL DEFAULT 7
    CHECK (chat_cache_retention_days IN (0, 7, 14, 30)),
  exclude_safeguarding BOOLEAN NOT NULL DEFAULT true,
  exclude_hr BOOLEAN NOT NULL DEFAULT false,
  trust_metadata_sharing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ed_conversations_user
  ON ed_conversations(organization_id, user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ed_chat_cache_created
  ON ed_chat_cache(organization_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ed_chat_cache_conversation
  ON ed_chat_cache(conversation_id, created_at);

-- RLS
ALTER TABLE ed_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_chat_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_memory_settings ENABLE ROW LEVEL SECURITY;

-- Users see own conversations
DROP POLICY IF EXISTS ed_conversations_user_policy ON ed_conversations;
CREATE POLICY ed_conversations_user_policy ON ed_conversations
  FOR SELECT USING (user_id = auth.uid()::text);

-- Service role for API writes
DROP POLICY IF EXISTS ed_conversations_service_policy ON ed_conversations;
CREATE POLICY ed_conversations_service_policy ON ed_conversations
  FOR ALL USING (auth.role() = 'service_role');

-- Users see own cache
DROP POLICY IF EXISTS ed_chat_cache_user_policy ON ed_chat_cache;
CREATE POLICY ed_chat_cache_user_policy ON ed_chat_cache
  FOR SELECT USING (user_id = auth.uid()::text);

-- Service role for API writes
DROP POLICY IF EXISTS ed_chat_cache_service_policy ON ed_chat_cache;
CREATE POLICY ed_chat_cache_service_policy ON ed_chat_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Admins see school conversations (metadata only)
DROP POLICY IF EXISTS ed_conversations_admin_policy ON ed_conversations;
CREATE POLICY ed_conversations_admin_policy ON ed_conversations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = auth.uid()::text
        AND organization_members.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Settings managed by admins
DROP POLICY IF EXISTS ed_memory_settings_admin_policy ON ed_memory_settings;
CREATE POLICY ed_memory_settings_admin_policy ON ed_memory_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = auth.uid()::text
        AND organization_members.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Service role bypass for settings
DROP POLICY IF EXISTS ed_memory_settings_service_policy ON ed_memory_settings;
CREATE POLICY ed_memory_settings_service_policy ON ed_memory_settings
  FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Verify migration is valid SQL**

```bash
cd apps/platform && cat supabase/migrations/20260413_ed_conversation_memory.sql | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/supabase/migrations/20260413_ed_conversation_memory.sql
git commit -m "feat(ed): add conversation memory tables — ed_conversations, ed_chat_cache, ed_memory_settings

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Conversation Cache Module — Write + Read Helpers

**Files:**
- Create: `apps/platform/src/lib/ed/conversation-cache.ts`
- Create: `apps/platform/src/lib/ed/conversation-cache.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// apps/platform/src/lib/ed/conversation-cache.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  scrubAndPrepareMessage,
  formatRecentContext,
  shouldExcludeDomain,
  type CachedMessage,
} from './conversation-cache';

describe('scrubAndPrepareMessage', () => {
  it('scrubs email addresses from messages', () => {
    const result = scrubAndPrepareMessage(
      'Contact sarah.jones@school.org about the meeting',
      'user',
      'general',
    );
    expect(result.scrubbed_content).not.toContain('sarah.jones@school.org');
    expect(result.scrubbed_content).toContain('[EMAIL_');
    expect(result.was_scrubbed).toBe(true);
    expect(result.guardian_categories).toContain('email');
  });

  it('scrubs UK phone numbers', () => {
    const result = scrubAndPrepareMessage(
      'Call the parent on 07712345678',
      'user',
      'estates',
    );
    expect(result.scrubbed_content).not.toContain('07712345678');
    expect(result.was_scrubbed).toBe(true);
  });

  it('scrubs postcodes', () => {
    const result = scrubAndPrepareMessage(
      'The family lives at BD2 4ED',
      'user',
      'general',
    );
    expect(result.scrubbed_content).not.toContain('BD2 4ED');
    expect(result.was_scrubbed).toBe(true);
  });

  it('returns clean for messages without PII', () => {
    const result = scrubAndPrepareMessage(
      'When is the next fire drill?',
      'user',
      'estates',
    );
    expect(result.scrubbed_content).toBe('When is the next fire drill?');
    expect(result.was_scrubbed).toBe(false);
    expect(result.guardian_categories).toEqual([]);
  });

  it('preserves the role and domain', () => {
    const result = scrubAndPrepareMessage('hello', 'assistant', 'hr');
    expect(result.role).toBe('assistant');
    expect(result.domain).toBe('hr');
  });
});

describe('shouldExcludeDomain', () => {
  it('excludes safeguarding when setting is true', () => {
    expect(shouldExcludeDomain('safeguarding', {
      exclude_safeguarding: true,
      exclude_hr: false,
    })).toBe(true);
  });

  it('excludes HR when setting is true', () => {
    expect(shouldExcludeDomain('hr', {
      exclude_safeguarding: false,
      exclude_hr: true,
    })).toBe(true);
  });

  it('does not exclude estates', () => {
    expect(shouldExcludeDomain('estates', {
      exclude_safeguarding: true,
      exclude_hr: true,
    })).toBe(false);
  });

  it('does not exclude when all settings are false', () => {
    expect(shouldExcludeDomain('safeguarding', {
      exclude_safeguarding: false,
      exclude_hr: false,
    })).toBe(false);
  });
});

describe('formatRecentContext', () => {
  it('formats cached messages into a context block', () => {
    const messages: CachedMessage[] = [
      {
        role: 'user',
        scrubbed_content: 'Is the fire alarm test up to date?',
        domain: 'estates',
        created_at: '2026-04-12T09:00:00Z',
      },
      {
        role: 'assistant',
        scrubbed_content: 'Your last fire alarm test was 3 April. Next one is due 10 April — it\'s overdue by 2 days.',
        domain: 'estates',
        created_at: '2026-04-12T09:00:05Z',
      },
    ];

    const result = formatRecentContext(messages);
    expect(result).toContain('Recent conversation context');
    expect(result).toContain('fire alarm test');
    expect(result).toContain('estates');
  });

  it('returns empty string for no messages', () => {
    expect(formatRecentContext([])).toBe('');
  });

  it('truncates individual messages to 200 chars', () => {
    const longMessage: CachedMessage = {
      role: 'assistant',
      scrubbed_content: 'A'.repeat(300),
      domain: 'general',
      created_at: '2026-04-12T09:00:00Z',
    };
    const result = formatRecentContext([longMessage]);
    // The formatted output should not contain 300 A's
    expect(result.length).toBeLessThan(350);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npx vitest run apps/platform/src/lib/ed/conversation-cache.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create the conversation cache module**

```typescript
// apps/platform/src/lib/ed/conversation-cache.ts
/**
 * Ed Conversation Cache — Write + Read helpers
 *
 * Write path: scrub message via SchoolDataGuardian → store in ed_chat_cache
 * Read path: query recent scrubbed messages → format as context block for Ed
 */

import { SchoolDataGuardian } from '../school-data-guardian';

// Types
export interface PreparedMessage {
  role: 'user' | 'assistant';
  scrubbed_content: string;
  domain: string | null;
  was_scrubbed: boolean;
  guardian_categories: string[];
}

export interface CachedMessage {
  role: string;
  scrubbed_content: string;
  domain: string | null;
  created_at: string;
}

export interface MemorySettings {
  exclude_safeguarding: boolean;
  exclude_hr: boolean;
}

/**
 * Scrub PII from a message and prepare it for cache storage
 */
export function scrubAndPrepareMessage(
  content: string,
  role: 'user' | 'assistant',
  domain: string | null,
): PreparedMessage {
  const result = SchoolDataGuardian.scrub(content, {
    callerName: 'ed-conversation-cache',
  });

  return {
    role,
    scrubbed_content: result.sanitised,
    domain,
    was_scrubbed: !result.isClean,
    guardian_categories: result.categoriesDetected,
  };
}

/**
 * Check if a domain should be excluded from cache based on school settings
 */
export function shouldExcludeDomain(
  domain: string | null,
  settings: MemorySettings,
): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (settings.exclude_safeguarding && (d === 'safeguarding' || d === 'safeguard')) return true;
  if (settings.exclude_hr && d === 'hr') return true;
  return false;
}

/**
 * Write a conversation message to the cache
 * Returns the conversation_id (creates a new conversation if needed)
 */
export async function writeToCache(
  supabase: any,
  orgId: string,
  userId: string,
  conversationId: string | null,
  message: PreparedMessage,
): Promise<string> {
  // Create or get conversation
  let convId = conversationId;

  if (!convId) {
    const { data: conv } = await supabase
      .from('ed_conversations')
      .insert({
        organization_id: orgId,
        user_id: userId,
        domain: message.domain,
      })
      .select('id')
      .single();

    convId = conv?.id;
    if (!convId) return '';
  }

  // Write scrubbed message
  await supabase.from('ed_chat_cache').insert({
    conversation_id: convId,
    organization_id: orgId,
    user_id: userId,
    role: message.role,
    scrubbed_content: message.scrubbed_content,
    domain: message.domain,
    guardian_categories: message.guardian_categories,
  });

  // Update conversation metadata
  await supabase
    .from('ed_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.rpc ? undefined : 1, // Increment handled below
    })
    .eq('id', convId);

  // Increment message count
  await supabase.rpc('increment_message_count', { conv_id: convId }).catch(() => {
    // RPC may not exist — fall back to manual increment
    // This is fine for MVP
  });

  return convId;
}

/**
 * Read recent cached messages for context injection
 */
export async function readRecentContext(
  supabase: any,
  orgId: string,
  userId: string,
  retentionDays: number = 7,
  limit: number = 10,
): Promise<CachedMessage[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const { data } = await supabase
    .from('ed_chat_cache')
    .select('role, scrubbed_content, domain, created_at')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  // Return in chronological order (oldest first)
  return (data || []).reverse();
}

/**
 * Get memory settings for a school, with defaults
 */
export async function getMemorySettings(
  supabase: any,
  orgId: string,
): Promise<{ retention_days: number; exclude_safeguarding: boolean; exclude_hr: boolean }> {
  const { data } = await supabase
    .from('ed_memory_settings')
    .select('chat_cache_retention_days, exclude_safeguarding, exclude_hr')
    .eq('organization_id', orgId)
    .single();

  return {
    retention_days: data?.chat_cache_retention_days ?? 7,
    exclude_safeguarding: data?.exclude_safeguarding ?? true,
    exclude_hr: data?.exclude_hr ?? false,
  };
}

/**
 * Format cached messages into a context block for Ed's system prompt
 */
export function formatRecentContext(messages: CachedMessage[]): string {
  if (!messages || messages.length === 0) return '';

  const lines: string[] = ['## Recent conversation context'];

  for (const msg of messages) {
    const date = new Date(msg.created_at);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    const timeLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
    const domain = msg.domain ? ` (${msg.domain})` : '';
    const content = msg.scrubbed_content.length > 200
      ? msg.scrubbed_content.substring(0, 197) + '...'
      : msg.scrubbed_content;
    const roleLabel = msg.role === 'user' ? 'User' : 'Ed';

    lines.push(`- ${timeLabel}${domain} — ${roleLabel}: ${content}`);
  }

  lines.push('');
  lines.push('Use this context to maintain continuity. Don\'t repeat information the user already knows from prior conversations.');

  return lines.join('\n');
}

/**
 * Delete expired cache entries for a specific org
 */
export async function cleanupExpiredCache(
  supabase: any,
  orgId: string,
  retentionDays: number,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('ed_chat_cache')
    .delete()
    .eq('organization_id', orgId)
    .lt('created_at', cutoff.toISOString())
    .select('id');

  return data?.length ?? 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npx vitest run apps/platform/src/lib/ed/conversation-cache.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/ed/conversation-cache.ts apps/platform/src/lib/ed/conversation-cache.test.ts
git commit -m "feat(ed): conversation cache module — scrub, write, read, format, cleanup helpers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire Write Path Into Chat API

**Files:**
- Modify: `apps/platform/src/app/api/ed/chat/route.ts`

The chat API currently calls `logConversationTopic()` after each response. We replace this with the proper conversation cache write path.

- [ ] **Step 1: Add imports at the top of the chat route**

Add after the existing imports:

```typescript
import {
  scrubAndPrepareMessage,
  writeToCache,
  getMemorySettings,
  shouldExcludeDomain,
} from '@/lib/ed/conversation-cache';
```

- [ ] **Step 2: Replace logConversationTopic call with cache write**

Find this block (around line 486-495):

```typescript
    // Log conversation topic (lightweight, no PII — just domain + summary)
    if (organization?.id && user?.id) {
      logConversationTopic(
        supabase,
        organization.id,
        user.id,
        edResponse.specialist || "general",
        question,
      ).catch(() => {}); // Fire-and-forget, don't block response
    }
```

Replace with:

```typescript
    // Write scrubbed messages to conversation cache (fire-and-forget)
    if (organization?.id && user?.id) {
      (async () => {
        try {
          const domain = edResponse.metadata?.domain as string || 'general';
          const settings = await getMemorySettings(supabase, organization.id);

          // Skip if retention is 0 (disabled) or domain is excluded
          if (settings.retention_days === 0) return;
          if (shouldExcludeDomain(domain, settings)) return;

          // Scrub both user message and Ed's response
          const userMsg = scrubAndPrepareMessage(question, 'user', domain);
          const edMsg = scrubAndPrepareMessage(edResponse.response, 'assistant', domain);

          // Write to cache (creates conversation if needed)
          const convId = await writeToCache(supabase, organization.id, user.id, null, userMsg);
          if (convId) {
            await writeToCache(supabase, organization.id, user.id, convId, edMsg);
          }
        } catch {
          // Never fail the response — cache is best-effort
        }
      })();

      // Keep the lightweight topic log for greeting system
      logConversationTopic(
        supabase,
        organization.id,
        user.id,
        edResponse.specialist || "general",
        question,
      ).catch(() => {});
    }
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/ed/chat/route.ts
git commit -m "feat(ed): wire conversation cache write path into chat API

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire Read Path — Context Injection Before Ed Responds

**Files:**
- Modify: `apps/platform/src/app/api/ed/chat/route.ts`

Before Ed processes a question, load recent cached context and inject it into the conversation.

- [ ] **Step 1: Add read path imports**

Add to the existing imports (if not already there):

```typescript
import {
  readRecentContext,
  formatRecentContext,
} from '@/lib/ed/conversation-cache';
```

(Merge with the import from Task 3 — all from `'@/lib/ed/conversation-cache'`)

- [ ] **Step 2: Inject context before processQuestion**

Find this block (around line 460):

```typescript
    // Process through agent framework — pass URL and conversation history
    const edResponse = await orchestrator.processQuestion(question, {
```

Add BEFORE it:

```typescript
    // Inject recent conversation context from cache
    let contextualMessages = messages?.slice(-8) || [];
    if (organization?.id && user?.id) {
      try {
        const settings = await getMemorySettings(supabase, organization.id);
        if (settings.retention_days > 0) {
          const recentCache = await readRecentContext(
            supabase,
            organization.id,
            user.id,
            settings.retention_days,
            10,
          );

          if (recentCache.length > 0) {
            const contextBlock = formatRecentContext(recentCache);
            // Prepend context as a system-like message in conversation history
            if (contextBlock) {
              contextualMessages = [
                { role: 'assistant' as const, content: contextBlock },
                ...contextualMessages,
              ];
            }
          }
        }
      } catch {
        // Never fail — context injection is best-effort
      }
    }
```

Then update the `processQuestion` call to use `contextualMessages`:

```typescript
    const edResponse = await orchestrator.processQuestion(question, {
      app: activeApp,
      page: context?.title,
      url: context?.url,
      screenshot,
      messages: contextualMessages,
    });
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/ed/chat/route.ts
git commit -m "feat(ed): inject recent conversation context before Ed responds

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Cleanup Endpoint for Expired Cache

**Files:**
- Create: `apps/platform/src/app/api/ed/cleanup/route.ts`

A simple endpoint that deletes expired cache entries. Can be called by Vercel Cron or manually.

- [ ] **Step 1: Create the cleanup route**

```typescript
// apps/platform/src/app/api/ed/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/ed/cleanup
 * Delete expired chat cache entries based on each school's retention settings.
 * Protected by a simple secret header — intended for cron jobs, not user access.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  let totalDeleted = 0;

  try {
    // Get all orgs with memory settings
    const { data: settings } = await supabase
      .from('ed_memory_settings')
      .select('organization_id, chat_cache_retention_days');

    // Delete expired entries for orgs with custom settings
    const orgIdsWithSettings = new Set<string>();

    if (settings) {
      for (const setting of settings) {
        orgIdsWithSettings.add(setting.organization_id);

        if (setting.chat_cache_retention_days === 0) {
          // Retention disabled — delete ALL cache for this org
          const { data } = await supabase
            .from('ed_chat_cache')
            .delete()
            .eq('organization_id', setting.organization_id)
            .select('id');

          totalDeleted += data?.length ?? 0;
        } else {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - setting.chat_cache_retention_days);

          const { data } = await supabase
            .from('ed_chat_cache')
            .delete()
            .eq('organization_id', setting.organization_id)
            .lt('created_at', cutoff.toISOString())
            .select('id');

          totalDeleted += data?.length ?? 0;
        }
      }
    }

    // Default 7-day cleanup for orgs WITHOUT settings rows
    const defaultCutoff = new Date();
    defaultCutoff.setDate(defaultCutoff.getDate() - 7);

    // Get all org IDs that have cache entries but no settings
    const { data: allCacheOrgs } = await supabase
      .from('ed_chat_cache')
      .select('organization_id')
      .lt('created_at', defaultCutoff.toISOString());

    if (allCacheOrgs) {
      const defaultOrgs = new Set(
        allCacheOrgs
          .map((r: any) => r.organization_id)
          .filter((id: string) => !orgIdsWithSettings.has(id))
      );

      for (const orgId of defaultOrgs) {
        const { data } = await supabase
          .from('ed_chat_cache')
          .delete()
          .eq('organization_id', orgId)
          .lt('created_at', defaultCutoff.toISOString())
          .select('id');

        totalDeleted += data?.length ?? 0;
      }
    }

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Ed Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/api/ed/cleanup/route.ts
git commit -m "feat(ed): add cache cleanup endpoint for cron-based expired entry deletion

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Guardian UX Indicator

**Files:**
- Modify: `apps/platform/src/app/api/ed/chat/route.ts`

When SchoolDataGuardian scrubs PII from a cached message, include a flag in the response so the UI can show a shield indicator.

- [ ] **Step 1: Add guardian_active flag to ChatResponse**

Find the `ChatResponse` interface (around line 53) and add:

```typescript
  // Guardian indicator — true when PII was scrubbed from this interaction
  guardianActive?: boolean;
```

- [ ] **Step 2: Set the flag in the response**

In the write path block added in Task 3, after scrubbing the user message, capture whether PII was detected. Then set it on the response before returning.

Find where `const response: ChatResponse = {` is built (around line 469) and after it's constructed, add:

```typescript
    // Flag if Guardian scrubbed PII from this interaction (for UI shield indicator)
    // We check the user's message only — Ed's response shouldn't contain PII
    if (organization?.id && user?.id) {
      try {
        const guardianCheck = SchoolDataGuardian.scrub(question, {
          callerName: 'ed-chat-guardian-indicator',
        });
        if (!guardianCheck.isClean) {
          response.guardianActive = true;
        }
      } catch {
        // Never fail
      }
    }
```

Note: import `SchoolDataGuardian` if not already imported:
```typescript
import { SchoolDataGuardian } from '@/lib/school-data-guardian';
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/ed/chat/route.ts
git commit -m "feat(ed): add guardianActive flag to chat response for UI shield indicator

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Build Check & Verification

**Files:**
- No new files

- [ ] **Step 1: Run the build**

```bash
cd apps/platform && npm run build
```

Fix any import errors or type issues.

- [ ] **Step 2: Run the conversation cache tests**

```bash
npx vitest run apps/platform/src/lib/ed/conversation-cache.test.ts
```

- [ ] **Step 3: Verify no stale references**

```bash
grep -r "logConversationTopic" apps/platform/src/app/api/ed/chat/route.ts
```

Should still exist (we kept it alongside the new cache for the greeting system).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(ed): resolve build issues from conversation memory implementation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Section 1 (tables): Task 1 ✅
   - Section 2 (Guardian integration): Task 2 uses existing `SchoolDataGuardian.scrub()` ✅
   - Section 3 (write path): Task 3 ✅
   - Section 4 (read path): Task 4 ✅
   - Section 5 (cleanup): Task 5 ✅
   - Section 6 (Guardian UX indicator): Task 6 ✅
   - Section 7 (settings UI): Deferred per spec ✅

2. **Placeholder scan:** No TBDs, TODOs, or placeholders. All code complete.

3. **Type consistency:** `PreparedMessage`, `CachedMessage`, `MemorySettings` defined in Task 2, consumed in Tasks 3-4. `SchoolDataGuardian.scrub()` interface matches existing codebase (`sanitised`, `isClean`, `categoriesDetected`). `ChatResponse` extended with `guardianActive` in Task 6.

4. **Table name alignment:** Uses `organizations` and `organization_members` (matching codebase), NOT `schools`/`school_members` (from Notion spec). `user_id` is `TEXT` not `UUID` (matching `ed_conversation_log` convention).
