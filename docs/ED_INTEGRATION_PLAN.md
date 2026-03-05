# ED CHATBOT - INTEGRATION PLAN
## "Wiring Up the Agent Framework to Ed"

---

## Current State Analysis

### What Ed Currently Has

```
/api/ed/chat (route.ts)
├── Simple prompt builder
├── Basic "Ed" persona (warm, supportive)
├── Quick answers for common tools
├── Browser automation capability
├── Gemini 1.5 Flash / OpenRouter models
└── Language detection (bilingual support)
```

### What's Missing

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT ED                               │
├─────────────────────────────────────────────────────────────┤
│  ❌ No specialist routing                                   │
│  ❌ No qualified personas (IOSH, CIPD, etc.)               │
│  ❌ No knowledge base with freshness                      │
│  ❌ No skills library (SOPs, emails, etc.)                 │
│  ❌ No guardrails layer                                    │
│  ❌ No perspective synthesis                               │
│  ❌ No source citation with dates                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                              │
│  "What temperature should legionella water be?"                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ED ORCHESTRATOR (NEW)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 1. Classify intent (Which specialist?)                            ││
│  │ 2. Check knowledge base (Is there a current answer?)               ││
│  │ 3. Route to specialist OR use cached answer                        ││
│  │ 4. Apply guardrails before returning                              ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────────┴──────────────────┐
                    │                                  │
                    ▼                                  ▼
        ┌───────────────────────┐        ┌───────────────────────┐
        │   KNOWLEDGE BASE       │        │   SPECIALIST ROUTER    │
        │   (PostgreSQL)          │        │   (Agent Framework)   │
        └───────────────────────┘        └───────────────────────┘
                    │                                  │
                    │                                  ▼
                    │                    ┌───────────────────────┐
                    │                    │  ESTATES | HR | SEND   │
                    │                    │  (Qualified personas)  │
                    │                    └───────────────────────┘
                    │                                  │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GUARDRAILS LAYER (NEW)                           │
│  1. Safety check       → Is advice safe?                               │
│  2. Compliance check   → Any statutory issues?                         │
│  3. Confidence check   → Is knowledge current?                         │
│  4. Tone check         → On-brand, empathetic?                          │
│  5. Permission check   → User has access?                              │
│  6. Source requirement → Cite sources with dates                        │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RESPONSE TO USER                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: Create Agent Prompts Package

```
packages/
├── ed-agents/                    # NEW PACKAGE
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── agents/
│   │   │   ├── estates-specialist.ts
│   │   │   ├── hr-specialist.ts
│   │   │   ├── send-specialist.ts
│   │   │   ├── data-specialist.ts
│   │   │   ├── curriculum-specialist.ts
│   │   │   ├── procurement-specialist.ts
│   │   │   ├── governance-specialist.ts
│   │   │   └── communications-specialist.ts
│   │   │
│   │   ├── orchestrator/
│   │   │   ├── intent-classifier.ts
│   │   │   ├── agent-router.ts
│   │   │   └── response-synthesizer.ts
│   │   │
│   │   ├── skills/
│   │   │   ├── write-sop.ts
│   │   │   ├── write-email.ts
│   │   │   ├── write-letter.ts
│   │   │   ├── create-checklist.ts
│   │   │   └── risk-assessment.ts
│   │   │
│   │   ├── guardrails/
│   │   │   ├── safety-check.ts
│   │   │   ├── compliance-check.ts
│   │   │   ├── confidence-check.ts
│   │   │   ├── tone-check.ts
│   │   │   ├── permission-check.ts
│   │   │   └── source-formatter.ts
│   │   │
│   │   └── index.ts
│   │
│   └── README.md
```

### Phase 2: Create Knowledge Base

```sql
-- Add to Supabase migrations
CREATE TABLE ed_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,  -- 'estates', 'hr', 'send', etc.
  topic TEXT NOT NULL,
  question TEXT,
  answer TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,  -- 'HSE', 'DfE', 'ACAS', etc.
  confidence TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  next_review_due TIMESTAMPTZ,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', question || ' ' || answer)) STORED
);

-- Indexes for fast lookup
CREATE INDEX idx_ed_knowledge_domain ON ed_knowledge_base(domain);
CREATE INDEX idx_ed_knowledge_topic ON ed_knowledge_base(topic);
CREATE INDEX idx_ed_knowledge_confidence ON ed_knowledge_base(confidence);
CREATE INDEX idx_ed_knowledge_tsv ON ed_knowledge_base USING GIN(tsv);
CREATE INDEX idx_ed_knowledge_next_review ON ed_knowledge_base(next_review_due);

-- RLS
ALTER TABLE ed_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active knowledge" ON ed_knowledge_base
  FOR SELECT USING (confidence IN ('HIGH', 'MEDIUM'));
```

### Phase 3: Update Ed Chat API

```typescript
// apps/platform/src/app/api/ed/chat/route.ts

import { EdOrchestrator } from '@schoolgle/ed-agents';
import { getSupabaseServer } from '@schoolgle/shared';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, context } = body;

  // Initialize orchestrator
  const orchestrator = new EdOrchestrator({
    supabase: getSupabaseServer(),
    userId: context.userId,
    orgId: context.orgId,
  });

  // Process through agents
  const response = await orchestrator.processQuestion(question, {
    app: context.app || 'schoolgle-platform',
    page: context.page,
    userRole: context.userRole,
    screenshot: context.screenshot,
  });

  return NextResponse.json(response);
}
```

### Phase 4: Implement Orchestrator

```typescript
// packages/ed-agents/src/orchestrator/index.ts

export class EdOrchestrator {
  async processQuestion(
    question: string,
    context: AppContext
  ): Promise<EdResponse> {

    // 1. Check knowledge base first
    const cached = await this.checkKnowledgeBase(question, context);
    if (cached && cached.confidence === 'HIGH') {
      return this.formatResponse(cached);
    }

    // 2. Classify intent and route to specialist
    const specialist = await this.routeToSpecialist(question, context);

    // 3. Get specialist response
    const specialistResponse = await specialist.respond(question, context);

    // 4. Apply skills if needed (e.g., write SOP)
    if (this.requiresSkill(specialistResponse)) {
      const skilledResponse = await this.applySkill(specialistResponse);
      specialistResponse = skilledResponse;
    }

    // 5. Apply guardrails
    const guarded = await this.applyGuardrails(specialistResponse, context);

    // 6. Format and return
    return this.formatResponse(guarded);
  }
}
```

### Phase 5: Add Technical Skills (Browser Automation)

```typescript
// packages/ed-agents/src/skills/browser-automation.ts

export class BrowserAutomationSkill {
  /**
   * Execute browser actions for user
   * Uses the existing /api/ed/automate endpoint
   */

  async executeActions(
    actions: BrowserAction[],
    context: AppContext
  ): Promise<SkillResult> {

    // Call existing automation API
    const response = await fetch(`${context.baseUrl}/api/ed/automate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: context.url,
        actions: actions,
        sessionId: context.sessionId,
      }),
    });

    return response.json();
  }

  /**
   * Common browser automation patterns
   */

  async fillForm(formId: string, data: Record<string, any>) {
    return this.executeActions([
      { type: 'fill', selector: `#${formId}`, data }
    ]);
  }

  async clickElement(selector: string) {
    return this.executeActions([
      { type: 'click', selector }
    ]);
  }

  async navigateTo(url: string) {
    return this.executeActions([
      { type: 'navigate', url }
    ]);
  }

  async takeScreenshot(fullPage = false) {
    return this.executeActions([
      { type: 'screenshot', fullPage }
    ]);
  }
}
```

---

## File-by-File Implementation Plan

| Step | File | Action |
|------|------|--------|
| 1 | `packages/ed-agents/package.json` | Create new package |
| 2 | `packages/ed-agents/src/agents/` | Copy agent prompts from MY_EMPIRE |
| 3 | `packages/ed-agents/src/skills/` | Implement skills library |
| 4 | `packages/ed-agents/src/guardrails/` | Implement guardrails |
| 5 | `packages/ed-agents/src/orchestrator/` | Create routing logic |
| 6 | `packages/ed-agents/src/knowledge-base/` | Database queries |
| 7 | Supabase migration | Create ed_knowledge_base table |
| 8 | `apps/platform/src/app/api/ed/chat/route.ts` | Wire in orchestrator |
| 9 | Tests | E2E tests for each specialist |
| 10 | Documentation | Update CLAUDE.md |

---

## Key Integration Points

### 1. Intent Classifier

```typescript
// packages/ed-agents/src/orchestrator/intent-classifier.ts

export function classifyIntent(question: string): IntentClassification {
  const lowerQ = question.toLowerCase();

  // Estates keywords
  if (lowerQ.match(/legionella|water.*temp|riddor|fire.*drill|asbestos/)) {
    return { domain: 'estates', specialist: 'estates-specialist' };
  }

  // HR keywords
  if (lowerQ.match(/sickness|absence|maternity|paternity|contract|policy/)) {
    return { domain: 'hr', specialist: 'hr-specialist' };
  }

  // SEND keywords
  if (lowerQ.match(/ehcp|send|special.*need|statement|education.*health/)) {
    return { domain: 'send', specialist: 'send-specialist' };
  }

  // Data keywords
  if (lowerQ.match(/census|data.*return|absence.*return|cla|post/)) {
    return { domain: 'data', specialist: 'data-specialist' };
  }

  // Default to general Ed
  return { domain: 'general', specialist: 'ed-general' };
}
```

### 2. Knowledge Base Query

```typescript
// packages/ed-agents/src/knowledge-base/query.ts

export async function queryKnowledgeBase(
  question: string,
  domain: string,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
): Promise<KnowledgeEntry | null> {

  const supabase = getSupabaseClient();

  // Full-text search with domain filter
  const { data, error } = await supabase
    .rpc('search_knowledge_base', {
      search_query: question,
      domain_filter: domain,
      confidence_filter: confidence,
    });

  return data?.[0] || null;
}
```

### 3. Guardrails Pipeline

```typescript
// packages/ed-agents/src/guardrails/pipeline.ts

export async function applyGuardrails(
  response: SpecialistResponse,
  context: AppContext
): Promise<GuardedResponse> {

  // Run all guardrails in parallel where possible
  const [
    safetyCheck,
    complianceCheck,
    confidenceCheck,
    toneCheck,
    permissionCheck
  ] = await Promise.all([
    safetyCheck(response),
    complianceCheck(response),
    confidenceCheck(response),
    toneCheck(response),
    permissionCheck(response, context),
  ]);

  // If any fail, handle appropriately
  if (!safetyCheck.passed) {
    return {
      response: formatWithWarning(response, SAFETY_WARNING),
      passed: false,
      reason: 'safety',
    };
  }

  if (complianceCheck.needsVerification) {
    return {
      response: addComplianceWarning(response),
      passed: true,
      warning: 'compliance',
    };
  }

  if (confidenceCheck.confidence === 'LOW') {
    return {
      response: addConfidenceWarning(response),
      passed: true,
      warning: 'confidence',
    };
  }

  // Ensure source citation
  const withSource = ensureSourceCitation(response);

  return {
    response: withSource,
    passed: true,
    metadata: {
      specialist: response.specialist,
      confidence: confidenceCheck.confidence,
      sources: response.sources,
    }
  };
}
```

---

## Summary: What Needs to Be Built

| Component | Effort | Priority |
|-----------|--------|----------|
| Agent prompts package | Medium | High |
| Knowledge base table | Low | High |
| Intent classifier | Low | High |
| Orchestrator | High | High |
| Guardrails | Medium | High |
| Skills implementation | Medium | Medium |
| Browser automation skills | Low | Medium |
| Testing | High | High |

---

## Quick Start: Minimal Viable Version

To get something working quickly:

1. **Week 1**: Create knowledge base table + migrate 10 key Q&A per domain
2. **Week 1**: Create Estates Specialist agent (highest priority domain)
3. **Week 2**: Implement intent classifier + routing
4. **Week 2**: Add basic guardrails (safety, confidence, sources)
5. **Week 3**: Expand to other specialists (HR, SEND, Data)
6. **Week 3+**: Add skills library incrementally

---

**Version:** 1.0
**Date:** 2025-01-24
**Status:** Ready for Implementation
