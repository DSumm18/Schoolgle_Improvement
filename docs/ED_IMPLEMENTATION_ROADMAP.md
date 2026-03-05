# ED CHATBOT - IMPLEMENTATION ROADMAP
## "From Vision to Production: Building the Universal School AI Assistant"

---

## Executive Summary

**Ed** is a universal AI assistant for UK schools that helps staff complete real work across ALL school systems. This roadmap covers the complete path from current state to production deployment.

**Current State:** Simple chatbot at `/api/ed/chat` with basic persona and browser automation
**Target State:** Universal agent with specialist routing, multi-perspective responses, and full work completion

---

## Table of Contents

1. [Delivery Mechanism Decision](#1-delivery-mechanism-decision)
2. [Architecture Overview](#2-architecture-overview)
3. [DfE Data Integration](#3-dfe-data-integration)
4. [Multi-Perspective Response System](#4-multi-perspective-response-system)
5. [Work-Focus Guardrails](#5-work-focus-guardrails)
6. [Credit Optimization Strategy](#6-credit-optimization-strategy)
7. [Browser Automation Integration](#7-browser-automation-integration)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Delivery Mechanism Decision

### Options Analysis

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Chrome Extension** | - Works with any school system<br>- Can see and interact with any webpage<br>- Easy install<br>- Cross-platform<br>- No desktop software to maintain | - Limited to Chrome/Edge<br>- Extension store approval needed<br>- Some API restrictions | **START HERE** |
| **Desktop App (Electron/Tauri)** | - Full OS access<br>- Can work with desktop apps (SIMS desktop)<br>- No browser restrictions | - Cross-platform maintenance burden<br>- Larger download<br>- Update management | **Phase 2** |
| **Embedded in Platform** | - No installation<br>- Single codebase<br>- Easy updates | - Only works within Schoolgle<br>- Can't help with external systems | **Always available** |

### Recommendation: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ED DELIVERY STRATEGY                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 1 (MVP)                                                      │
│  ────────────                                                       │
│  • Chrome Extension for external systems (SIMS, Arbor, council sites)│
│  • Embedded in Schoolgle platform for Schoolgle apps               │
│  • Shared backend API                                               │
│                                                                     │
│  PHASE 2                                                             │
│  ────────                                                           │
│  • Desktop app for SIMS Desktop/PS Finance (if needed)             │
│  • Enhanced browser automation                                      │
│                                                                     │
│  ALWAYS                                                              │
│  ──────                                                             │
│  • Ed button in every Schoolgle app                                │
│  • Context-aware routing                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │  Chrome Extension│  │  Schoolgle Apps  │  │   Desktop App    │             │
│  │  (External systems│  │  (Embedded Ed)   │  │  (Phase 2)       │             │
│  │   - SIMS, Arbor) │  │                  │  │                  │             │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘             │
│           │                     │                     │                         │
│           └─────────────────────┴─────────────────────┘                         │
│                                 │                                               │
│                                 ▼                                               │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ED API GATEWAY                                    │
│                      /api/ed/chat | /api/ed/automate                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ED ORCHESTRATOR (NEW)                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Identify user & subscription (who, what they paid for)               │  │
│  │  2. Classify intent (work task vs general chat)                          │  │
│  │  3. Load DfE school context                                              │  │
│  │  4. Route to specialist OR return cached answer                         │  │
│  │  5. Generate multi-perspective responses (optimist, critic, neutral)     │  │
│  │  6. Apply guardrails (safety, compliance, tone, permissions)            │  │
│  │  7. Execute browser automation if needed                                 │  │
│  │  8. Format and return response with source citations                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│  KNOWLEDGE BASE   │  │  SPECIALIST AGENTS│  │   MODEL ROUTER    │
│  (PostgreSQL)     │  │  (Qualified       │  │  (Multi-model)    │
│                   │  │   personas)       │  │                   │
│  • Q&A cache      │  │  • Estates        │  │  • Vision models  │
│  • Confidence     │  │  • HR             │  │  • Fast chat      │
│  • Freshness      │  │  • SEND           │  │  • Reasoning      │
│  • Sources        │  │  • Data           │  │  • Action         │
│                   │  │  • + 5 more       │  │                   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESPONSE TO USER                                   │
│  • Clear, actionable advice                                                     │
│  • Source citations with dates                                                  │
│  • Confidence level                                                             │
│  • Multiple perspectives (when appropriate)                                     │
│  • Actions completed (via browser automation)                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DfE Data Integration

### What's Available

From `apps/platform/src/lib/supabase-dfe.ts` and `docs/USING_DFE_DATA.md`:

```
DfE Database Contents:
├── 34,750 schools
├── School details (URN, name, address, phone, email)
├── School type (academy, LA-maintained, independent)
├── Phase (primary, secondary, all-through)
├── Local authority codes
├── Trust information (for academies)
├── Ofsted data (rating, last inspection date)
├── Area demographics (IMD decile, deprivation scores)
└── LA finance data
```

### Integration Strategy

```typescript
// When user starts Ed session:

// 1. Get user's school from Supabase
const { data: userOrg } = await supabase
  .from('organizations')
  .select('school_urn')
  .eq('id', user.orgId)
  .single();

// 2. Load DfE context
const schoolContext = await lookupSchoolByURN(userOrg.school_urn);

// 3. Inject into all agent prompts
const enrichedPrompt = `
${BASE_PROMPT}

## School Context
You are helping ${schoolContext.name}, a ${schoolContext.phase_name} school
in ${schoolContext.address[3]}.

${schoolContext.trust_name ? `Part of ${schoolContext.trust_name} academy trust.` : ''}
${schoolContext.type_name === 'Local authority maintained' ? `LA-maintained school.` : ''}

Last Ofsted: ${schoolContext.ofsted_rating || 'Not rated'}
IMD Decile: ${schoolContext.imd_decile}/10 (deprivation level)

Use this context to provide relevant, tailored advice.
`;
```

### Use Cases for DfE Data

| Scenario | How DfE Data Helps |
|----------|-------------------|
| **Census questions** | Know school type → relevant census requirements |
| **Finance questions** | LA-maintained vs academy → different funding rules |
| **Governance** | Academy trust → trust governance structure |
| **Estates** | Phase → appropriate premises standards |
| **SEND** | LA context → local SEND services/formats |

---

## 4. Multi-Perspective Response System

### Concept

Every complex question gets THREE perspectives, then synthesized:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-PERSPECTIVE ENGINE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🟢 OPTIMIST   → "Here's what's possible, what could work well"    │
│  🔴 CRITIC      → "Here are the risks, what could go wrong"        │
│  🟡 NEUTRAL     → "Here's the balanced, factual assessment"        │
│                                                                     │
│  → SYNTHESIZED RESPONSE                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### When to Use Multi-Perspective

| Question Type | Use Multi-Perspective? | Reason |
|---------------|------------------------|--------|
| "What temperature should legionella water be?" | No | Factual answer, no ambiguity |
| "Should we switch from SIMS to Arbor?" | Yes | Major decision, multiple factors |
| "How do I report RIDDOR?" | No | Standard process |
| "Should we implement biometric attendance?" | Yes | Policy, privacy, cost considerations |

### Implementation

```typescript
// packages/ed-agents/src/perspectives/generator.ts

export async function generateMultiPerspectiveResponse(
  question: string,
  specialistResponse: string,
  context: AppContext
): Promise<EdResponse> {

  // Determine if multi-perspective is needed
  const needsMultiPerspective = await classifyComplexity(question);

  if (!needsMultiPerspective) {
    return formatSimpleResponse(specialistResponse);
  }

  // Generate three perspectives in parallel
  const [optimist, critic, neutral] = await Promise.all([
    generatePerspective(question, specialistResponse, 'optimist'),
    generatePerspective(question, specialistResponse, 'critic'),
    generatePerspective(question, specialistResponse, 'neutral'),
  ]);

  // Synthesize into balanced response
  const synthesized = await synthesize({
    question,
    optimist,
    critic,
    neutral,
    specialist: specialistResponse,
  });

  return synthesized;
}
```

---

## 5. Work-Focus Guardrails

### Problem: Preventing General Chat

Ed is for **work support**, not general conversation. We need guardrails to:

1. Detect when user is making general chat
2. Politely redirect to work tasks
3. Minimize credit usage on non-work queries

### Implementation Strategy

```typescript
// packages/ed-agents/src/guardrails/work-focus-check.ts

/**
 * Classifies whether a query is work-related or general chat
 */
export async function classifyWorkFocus(
  query: string,
  context: AppContext
): Promise<{ isWorkRelated: boolean; confidence: number }> {

  // Fast keyword-based classification (no LLM call)
  const workKeywords = [
    // Estates
    'legionella', 'fire', 'asbestos', 'riddor', 'risk assessment',
    // HR
    'sickness', 'absence', 'contract', 'policy', 'maternity',
    // Data
    'census', 'data return', 'clla', 'attendance',
    // General work
    'help with', 'how do i', 'what is the', 'report', 'form',
  ];

  const chatKeywords = [
    'tell me a joke', 'how are you', 'what do you think',
    'lets chat', 'conversation', 'just saying',
  ];

  const queryLower = query.toLowerCase();

  // Check for work keywords
  const hasWorkKeywords = workKeywords.some(kw => queryLower.includes(kw));

  // Check for chat keywords
  const hasChatKeywords = chatKeywords.some(kw => queryLower.includes(kw));

  if (hasChatKeywords && !hasWorkKeywords) {
    return { isWorkRelated: false, confidence: 0.9 };
  }

  if (hasWorkKeywords) {
    return { isWorkRelated: true, confidence: 0.8 };
  }

  // If unclear, use fast LLM classification
  const classification = await fastClassify(query);
  return classification;
}
```

### Redirect Response

```typescript
// When non-work query detected:

const WORK_FOCUS_REDIRECT = `
Hi! I'm Ed, and I'm here to help you get work done.

I can help with things like:
• School compliance (RIDDOR, fire safety, legionella)
• HR questions (sickness, policies, contracts)
• Data reporting (census, returns)
• Using school systems (SIMS, Arbor, etc.)

What work task can I help you with right now?
`;

// Fast response, minimal credit usage
return { response: WORK_FOCUS_REDIRECT, tokensUsed: 0 };
```

### User Context Awareness

```typescript
interface AppContext {
  userId: string;
  orgId: string;
  userRole: 'admin' | 'staff' | 'viewer';
  subscription: {
    plan: 'free' | 'schools' | 'trusts';
    features: string[];
    creditsRemaining: number;
  };
  activeApp?: string;  // 'estates-compliance', 'hr', etc.
  schoolData?: DFESchoolData;
}
```

**Every Ed response considers:**
- What has the user paid for? (feature flags)
- How many credits remaining? (downgrade model if low)
- What app are they in? (contextual routing)
- What is their role? (permission checks)

---

## 6. Credit Optimization Strategy

### Model Selection by Task

| Task | Model | Cost/1M tokens | When to Use |
|------|-------|----------------|-------------|
| **Intent classification** | `gpt-4o-mini` | ~$0.03 | Fast routing |
| **Work focus check** | `gpt-4o-mini` | ~$0.03 | Guardrail |
| **Simple factual Q&A** | `deepseek-chat` | ~$0.24 | Knowledge base queries |
| **Specialist response** | `claude-3.5-sonnet` | ~$3.00 | Complex domain queries |
| **Vision/UI analysis** | `claude-3.5-sonnet` | ~$3.00 | Screenshots, forms |
| **Perspective generation** | `deepseek-chat` | ~$0.24 | Optimist/critic/neutral |
| **Synthesis** | `claude-3.5-sonnet` | ~$3.00 | Final response |
| **Browser actions** | `gpt-4o-mini` | ~$0.03 | Action planning |

### Credit Management

```typescript
// packages/ed-agents/src/credit-manager.ts

export class CreditManager {
  async selectModelForTask(
    task: TaskType,
    context: AppContext
  ): Promise<ModelConfig> {

    const { plan, creditsRemaining } = context.subscription;

    // If low credits, use cheaper models
    if (creditsRemaining < 1000) {
      return this.getBudgetModel(task);
    }

    // Free plan gets cheaper models
    if (plan === 'free') {
      return this.getFreeModel(task);
    }

    // Full plan gets optimal models
    return this.getOptimalModel(task);
  }

  async trackCredits(usage: TokenUsage): Promise<void> {
    // Update user's credit balance
    // Warn if low
    // Block if depleted
  }
}
```

### Caching Strategy

```typescript
// Cache common questions in knowledge base

const cachedQuestions = [
  'what temperature should legionella water be',
  'how do i report riddor',
  'what is the school census deadline',
  // ... more common questions
];

// For cached questions: NO LLM call, just return stored answer
// Saves credits, instant response
```

---

## 7. Browser Automation Integration

### Current State

`apps/platform/src/app/api/ed/automate/route.ts` already exists with Puppeteer integration.

### Enhancement Strategy

```typescript
// packages/ed-agents/src/skills/browser-automation.ts

export class BrowserAutomationSkill {
  /**
   * Ed can complete tasks in ANY web-based system
   */

  async completeTask(
    description: string,
    targetSystem: string,
    context: AppContext
  ): Promise<TaskResult> {

    // 1. Analyze the current page (screenshot)
    const screenshot = await this.takeScreenshot();

    // 2. Use vision model to understand UI
    const uiUnderstanding = await this.analyzeUI(screenshot, description);

    // 3. Generate action plan
    const actions = uiUnderstanding.actions;

    // 4. Execute actions
    const result = await this.executeActions(actions);

    // 5. Verify completion
    const verified = await this.verifyCompletion();

    return {
      success: verified,
      actionsTaken: actions,
      screenshot: result.screenshot,
    };
  }
}
```

### Dynamic Skill Creation

```typescript
// Ed learns new workflows from user demonstrations

export class DynamicSkillLearner {
  async learnWorkflow(
    demonstration: UserDemonstration
  ): Promise<LearnedSkill> {

    // User shows Ed how to do something
    // Ed records the steps
    // Ed generalizes into a reusable skill

    const skill = {
      name: this.generateSkillName(demonstration),
      steps: demonstration.steps,
      system: demonstration.system,
      createdAt: new Date(),
    };

    // Save to user's custom skills
    await this.saveSkill(skill);

    return skill;
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic specialist routing with knowledge base

```
✅ Create packages/ed-agents/
✅ Implement intent classifier
✅ Create knowledge base table (ed_knowledge_base)
✅ Implement Orchestrator
✅ Wire up to existing /api/ed/chat
✅ Add DfE school context loading
```

**Deliverables:**
- `packages/ed-agents/` package
- Migration for `ed_knowledge_base` table
- Updated `/api/ed/chat` with specialist routing
- 10 cached Q&A per domain (estates, HR, SEND, data)

### Phase 2: Multi-Perspective & Guardrails (Week 3)

**Goal:** Multi-perspective responses with full guardrails

```
✅ Implement perspective generator (optimist, critic, neutral)
✅ Implement all 6 guardrails (safety, compliance, confidence, tone, permission, source)
✅ Add work-focus detection
✅ Add credit tracking
```

**Deliverables:**
- Multi-perspective response system
- Full guardrails pipeline
- Work-focus redirect system
- Credit management system

### Phase 3: Chrome Extension (Week 4-5)

**Goal:** Ed available on any website

```
✅ Build Chrome extension
✅ Inject Ed button into school systems (SIMS, Arbor, etc.)
✅ Screenshot capture for UI understanding
✅ Action execution via API
```

**Deliverables:**
- Chrome extension in Chrome Web Store
- Ed injectable into any webpage
- Screenshot-to-action pipeline

### Phase 4: Browser Automation (Week 6-7)

**Goal:** Ed completes tasks, not just answers questions

```
✅ Enhance /api/ed/automate
✅ Vision model for UI understanding
✅ Action execution engine
✅ Verification system
✅ Dynamic skill learning
```

**Deliverables:**
- Full browser automation system
- Ed can fill forms, click buttons, navigate sites
- Workflow recording & replay

### Phase 5: Specialist Expansion (Week 8+)

**Goal:** Full specialist team with all skills

```
✅ Complete all 9 specialist agents
✅ Implement all skills from SKILLS_LIBRARY
✅ Knowledge base expansion (50+ Q&A per domain)
✅ Automated knowledge refresh system
```

**Deliverables:**
- Full specialist team
- Complete skills library
- Comprehensive knowledge base
- Automated regulatory watch

---

## File Structure

```
packages/ed-agents/
├── package.json
├── tsconfig.json
├── src/
│   ├── agents/
│   │   ├── agents.ts                      # Agent registry
│   │   ├── prompts/
│   │   │   ├── estates-specialist.ts
│   │   │   ├── hr-specialist.ts
│   │   │   ├── send-specialist.ts
│   │   │   ├── data-specialist.ts
│   │   │   ├── curriculum-specialist.ts
│   │   │   ├── it-tech-specialist.ts
│   │   │   ├── procurement-specialist.ts
│   │   │   ├── governance-specialist.ts
│   │   │   └── communications-specialist.ts
│   │   └── index.ts
│   │
│   ├── orchestrator/
│   │   ├── index.ts                       # Main orchestrator
│   │   ├── intent-classifier.ts
│   │   ├── agent-router.ts
│   │   ├── context-loader.ts              # DfE data loader
│   │   └── response-synthesizer.ts
│   │
│   ├── perspectives/
│   │   ├── generator.ts
│   │   ├── optimist.ts
│   │   ├── critic.ts
│   │   ├── neutral.ts
│   │   └── synthesizer.ts
│   │
│   ├── guardrails/
│   │   ├── pipeline.ts
│   │   ├── safety-check.ts
│   │   ├── compliance-check.ts
│   │   ├── confidence-check.ts
│   │   ├── tone-check.ts
│   │   ├── permission-check.ts
│   │   ├── source-formatter.ts
│   │   └── work-focus-check.ts
│   │
│   ├── skills/
│   │   ├── browser-automation.ts
│   │   ├── dynamic-learning.ts
│   │   └── index.ts
│   │
│   ├── knowledge-base/
│   │   ├── query.ts
│   │   ├── cache.ts
│   │   └── refresh.ts
│   │
│   ├── models/
│   │   ├── router.ts                      # Model selection
│   │   ├── providers/
│   │   │   ├── openrouter.ts
│   │   │   ├── anthropic.ts
│   │   │   └── openai.ts
│   │   └── config.ts
│   │
│   ├── credit/
│   │   ├── manager.ts
│   │   └── tracker.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── index.ts
│
└── README.md
```

---

## Database Migrations

```sql
-- Migration: ed_knowledge_base
-- File: apps/platform/supabase/migrations/YYYYMMDD_ed_knowledge_base.sql

CREATE TABLE IF NOT EXISTS ed_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,  -- 'estates', 'hr', 'send', 'data', etc.
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

CREATE POLICY "Anyone can read active knowledge"
  ON ed_knowledge_base
  FOR SELECT
  USING (confidence IN ('HIGH', 'MEDIUM'));

-- Function for full-text search
CREATE OR REPLACE FUNCTION search_knowledge_base(
  search_query TEXT,
  domain_filter TEXT DEFAULT NULL,
  confidence_filter TEXT DEFAULT 'HIGH'
)
RETURNS TABLE (
  id UUID,
  domain TEXT,
  topic TEXT,
  question TEXT,
  answer TEXT,
  source_url TEXT,
  source_name TEXT,
  confidence TEXT,
  last_verified TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.domain,
    kb.topic,
    kb.question,
    kb.answer,
    kb.source_url,
    kb.source_name,
    kb.confidence,
    kb.last_verified,
    ts_rank(kb.tsv, plainto_tsquery('english', search_query)) as rank
  FROM ed_knowledge_base kb
  WHERE
    kb.tsv @@ plainto_tsquery('english', search_query)
    AND (domain_filter IS NULL OR kb.domain = domain_filter)
    AND kb.confidence = confidence_filter
  ORDER BY rank DESC
  LIMIT 10;
END;
$$;

COMMENT ON TABLE ed_knowledge_base IS 'Knowledge base for Ed chatbot - stores verified Q&A with freshness tracking';
```

---

## API Updates

### Updated /api/ed/chat Endpoint

```typescript
// apps/platform/src/app/api/ed/chat/route.ts

import { EdOrchestrator } from '@schoolgle/ed-agents';
import { getSupabaseServer } from '@schoolgle/shared';
import { lookupSchoolByURN } from '@schoolgle/platform/lib/supabase-dfe';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, context } = body;

  // Get user context
  const supabase = getSupabaseServer();
  const { data: user } = await supabase.auth.getUser();

  // Load organization and subscription
  const { data: org } = await supabase
    .from('organizations')
    .select('*, school_urn')
    .eq('id', context.orgId)
    .single();

  // Load DfE school context
  const schoolContext = org?.school_urn
    ? await lookupSchoolByURN(org.school_urn)
    : null;

  // Initialize orchestrator with full context
  const orchestrator = new EdOrchestrator({
    supabase,
    userId: user?.id,
    orgId: context.orgId,
    userRole: context.userRole,
    subscription: {
      plan: org?.subscription_plan || 'free',
      features: org?.features || [],
      creditsRemaining: org?.credits_remaining || 0,
    },
    schoolData: schoolContext,
    activeApp: context.app,
  });

  // Process through agents
  const response = await orchestrator.processQuestion(question, {
    app: context.app,
    page: context.page,
    screenshot: context.screenshot,
  });

  // Track credit usage
  await orchestrator.trackCredits(response.tokensUsed);

  return NextResponse.json(response);
}
```

---

## Chrome Extension Structure

```
packages/ed-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.tsx
│   └── popup.css
├── content/
│   ├── content.ts                    # Injected into webpages
│   ├── ed-button.ts                  # Floating Ed button
│   └── screenshot.ts                 # Capture page content
├── background/
│   └── background.ts                 # Service worker
├── shared/
│   ├── api.ts                        # Calls to Schoolgle API
│   └── types.ts
└── assets/
    └── icon.png
```

### Key Features

1. **Ed Button** - Floating button on any page
2. **Context Capture** - Screenshot + page URL + selected text
3. **API Communication** - Send to `/api/ed/chat`
4. **Action Execution** - Receive actions and execute on page
5. **Permission Management** - User grants access to specific sites

---

## Testing Strategy

### Unit Tests

```typescript
// packages/ed-agents/src/__tests__/intent-classifier.test.ts

describe('IntentClassifier', () => {
  it('should route legionella questions to estates', () => {
    const result = classifyIntent('What temperature for legionella?');
    expect(result.domain).toBe('estates');
    expect(result.specialist).toBe('estates-specialist');
  });

  it('should route sickness questions to hr', () => {
    const result = classifyIntent('How do I record staff sickness?');
    expect(result.domain).toBe('hr');
    expect(result.specialist).toBe('hr-specialist');
  });
});
```

### Integration Tests

```typescript
// apps/platform/src/app/api/ed/chat/__tests__/integration.test.ts

describe('Ed Chat API Integration', () => {
  it('should route question to correct specialist', async () => {
    const response = await fetch('/api/ed/chat', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What are the RIDDOR reporting requirements?',
        context: { orgId: 'test-org' },
      }),
    });

    const data = await response.json();
    expect(data.metadata.specialist).toBe('estates-specialist');
    expect(data.response).toContain('HSE');
  });
});
```

### E2E Tests

```typescript
// Playwright tests for browser automation

test('Ed can fill a RIDDOR form', async ({ page }) => {
  await page.goto('https://www.hse.gov.uk/riddor/report/');
  await page.click('[data-ed-button]');

  // Ask Ed to fill the form
  await page.fill('[data-ed-input]', 'Help me report a broken arm');
  await page.click('[data-ed-send]');

  // Verify form is filled
  await expect(page.locator('#accident-type')).toHaveValue('broken_arm');
});
```

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Response accuracy** | >95% | User feedback voting |
| **Work focus compliance** | >90% | % of work-related queries |
| **Credit efficiency** | <500 credits/session | Average per session |
| **Task completion rate** | >80% | Browser automation success |
| **Knowledge freshness** | 100% HIGH < 30 days old | Automated check |
| **Response time** | <3 seconds | p95 latency |

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| **Extension permissions** | All sites vs user-selected | Start with user-selected, expand |
| **Desktop app framework** | Electron vs Tauri | Tauri (smaller, Rust-based) |
| **Knowledge refresh** | Manual vs automated | Start manual, build automated |
| **Multi-perspective trigger** | Always vs complexity-based | Complexity-based (save credits) |

---

## Version

**Version:** 1.0
**Date:** 2025-01-24
**Status:** Ready for Implementation
**Next Step:** Phase 1 - Create ed-agents package

---

**This roadmap provides a complete path from current state to production Ed. Start with Phase 1 and iterate based on user feedback.**
