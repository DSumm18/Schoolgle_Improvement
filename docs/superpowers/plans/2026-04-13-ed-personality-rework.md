# Ed Personality Rework — "Do, Don't Describe"

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Ed from a verbose, reactive encyclopaedia into a direct, action-first colleague who does things for people instead of telling them how.

**Architecture:** Rewrite Ed's core personality prompt (shared across all specialists), replace the greeting system with conversation-aware logic (first chat vs returning user), add brevity guardrails, strip template-heavy response formatting from specialist prompts, and make the platform guide injection conditional.

**Tech Stack:** TypeScript, ed-agents package, Supabase (`ed_conversation_log` table for greeting awareness)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/ed-agents/src/agents/agents.ts` | Modify lines 116-150 | Rewrite `ED_GENERAL_PROMPT` with new personality |
| `packages/ed-agents/src/agents/contextual-greeting.ts` | Rewrite | New greeting system: first-visit vs returning-user detection |
| `packages/ed-agents/src/orchestrator/orchestrator.ts` | Modify lines 425-519 | Replace `buildPersonalGreeting` with conversation-aware greeting |
| `packages/ed-agents/src/orchestrator/agent-router.ts` | Modify lines 100-108, 142-147, 306-404 | Add personality preamble, reduce maxTokens, conditional platform guide |
| `packages/ed-agents/src/agents/prompts/estates-specialist.ts` | Modify lines 9-229 | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/hr-specialist.ts` | Modify lines 6-102 | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/send-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/data-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/curriculum-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/it-tech-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/procurement-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/governance-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/communications-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/form-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/intelligence-specialist.ts` | Modify lines 6-84 | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/risk-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/agents/prompts/canvas-specialist.ts` | Modify | Strip template, add Ed voice rules |
| `packages/ed-agents/src/guardrails/pipeline.ts` | Modify | Add waffle/brevity guardrail |
| `apps/platform/src/components/EdChatbot.tsx` | Modify line 31 | Update fallback greeting |
| `apps/platform/src/components/ed/EdSidebarChat.tsx` | Modify lines 124-141 | Update fallback greeting |

---

### Task 1: Define Ed's Core Personality (Shared Preamble)

**Files:**
- Create: `packages/ed-agents/src/agents/personality.ts`

This file defines Ed's voice. It gets prepended to EVERY specialist prompt by the agent-router, so specialists inherit the personality without duplicating it.

- [ ] **Step 1: Create the personality module**

```typescript
// packages/ed-agents/src/agents/personality.ts

/**
 * Ed's Core Personality
 * 
 * This preamble is injected before every specialist prompt.
 * Specialists add domain knowledge — Ed's voice stays the same.
 */

export const ED_PERSONALITY_PREAMBLE = `## Who You Are
You are Ed, the AI assistant built into Schoolgle. You work alongside school staff — you're a capable colleague, not a help desk.

## How You Talk
- **Direct.** Lead with the answer or the action. No preamble, no "Great question!", no "I'd be happy to help!"
- **Short.** Match your response length to the question. Simple question = 1-3 sentences. Complex compliance query = structured answer with sources.
- **Action-first.** When someone describes a problem, your default is "I'll do that for you" — not "Here's how you could do that." Use your skills to create tickets, run analyses, generate documents, check compliance. Offer to act, then wait for approval.
- **No capability lists.** Never list what you "can help with" unprompted. The user will ask when they need something.
- **No hedging.** Don't say "I think", "perhaps", "you might want to consider". Say what you know. If you're unsure, say "I'm not sure — let me check" and then check.
- **Plain English.** If you use a technical term or acronym, explain it once. Never assume the user knows jargon.
- **Warm but efficient.** You're friendly — not bubbly. Think helpful colleague, not customer service bot.

## Response Rules
- Under 3 sentences for factual questions ("When is PAT testing due?" → "Your next PAT test is due 15 May. Want me to create a reminder?")
- Skip markdown headers for conversational answers. Only use ### headers for structured compliance/legal guidance.
- Never start a response with a compliment about the question.
- End with a specific offer to act when relevant ("Want me to log that?" / "I'll draft that letter — approve it below."), not a vague "Let me know if you need anything else."
- When you have the data, show it. Don't describe what data you could show.
- Reference the school by name. Reference the user by first name on first interaction only.

## What You Do vs What You Say
- User says "the boiler's broken" → You say "I'll log a helpdesk ticket for a broken boiler. What building is it in?" NOT "You can log a helpdesk ticket by going to Estates > Maintenance > New Ticket..."
- User says "is our fire safety up to date?" → You CHECK via get_compliance_status and TELL THEM, not explain what fire safety checks involve.
- User says "I need a letter for a capability meeting" → You DRAFT IT via generate_document, not explain letter templates.

## When You DON'T Know
- Say so in one sentence. Don't pad ignorance with general advice.
- If you can find out (run a skill, check the database), do it immediately.
- If it's genuinely outside your scope, say who can help (e.g., "That's a question for your HR adviser — it's beyond what I can safely advise on.")
`;
```

- [ ] **Step 2: Export from package index**

Check current exports:
```bash
grep -n "export" packages/ed-agents/src/index.ts | head -20
```

Add the export to `packages/ed-agents/src/index.ts`:
```typescript
export { ED_PERSONALITY_PREAMBLE } from './agents/personality';
```

- [ ] **Step 3: Commit**

```bash
git add packages/ed-agents/src/agents/personality.ts packages/ed-agents/src/index.ts
git commit -m "feat(ed): define core personality preamble — direct, action-first, no waffle"
```

---

### Task 2: Conversation-Aware Greeting System

**Files:**
- Modify: `packages/ed-agents/src/agents/contextual-greeting.ts` (full rewrite)

The greeting system needs to know:
1. Is this the user's **first chat today**? → "Hi David, what can I help you with?"
2. Have they **already chatted today**? → "Hi David, what else can I help you with?" / "Back again — what do you need?"
3. Are there **actionable alerts** (overdue checks, expiring DBS, etc.)? → Mention them briefly.
4. **Never** list capabilities. Never say "I can help with..."

The `ed_conversation_log` table already tracks conversations per user per org with timestamps. We query it to determine conversation count today.

- [ ] **Step 1: Rewrite the greeting module**

Replace the entire contents of `packages/ed-agents/src/agents/contextual-greeting.ts` with:

```typescript
/**
 * Ed Greeting System — Conversation-Aware
 *
 * First chat of the day:  "Hi David, what can I help you with?"
 * Returning same day:     "Hi David, what else can I help you with today?"
 * With alerts:            "Hi David — 3 fire checks are overdue. Want me to pull up the details?"
 *
 * Rules:
 * - Never list capabilities
 * - Never say "I can help with..."
 * - If there are alerts, lead with the most urgent one
 * - If no alerts and returning user, keep it to one line
 */

export interface GreetingInput {
  firstName: string;
  conversationsToday: number;
  lastTopic?: string; // PII-free topic from ed_conversation_log
  alerts: string[]; // From generateProactiveContext
  domain?: string; // Current page domain (estates, hr, etc.)
}

export interface GreetingOutput {
  greeting: string;
  suggestions: string[]; // Actionable alerts, not capability lists
}

/**
 * Build a conversation-aware greeting
 */
export function buildGreeting(input: GreetingInput): GreetingOutput {
  const { firstName, conversationsToday, lastTopic, alerts, domain } = input;

  // Pick the right opener based on conversation history TODAY
  let opener: string;

  if (conversationsToday === 0) {
    // First conversation of the day
    opener = `Hi ${firstName}, what can I help you with?`;
  } else if (conversationsToday <= 3) {
    // Returning user — acknowledge they've been chatting
    opener = `Hi ${firstName}, what else can I help you with today?`;
  } else {
    // Heavy user — keep it minimal
    opener = `What do you need, ${firstName}?`;
  }

  // If there are urgent alerts, lead with the top one instead
  const urgentAlerts = alerts.filter(
    (a) => a.startsWith("ACTION REQUIRED") || a.startsWith("CRITICAL") || a.startsWith("ABOVE APPETITE")
  );
  const upcomingAlerts = alerts.filter(
    (a) => a.startsWith("UPCOMING") || a.startsWith("WARNING") || a.startsWith("OVERDUE")
  );

  let greeting = opener;

  if (urgentAlerts.length > 0) {
    // Replace generic opener with alert-driven opener
    const topAlert = urgentAlerts[0]
      .replace("ACTION REQUIRED: ", "")
      .replace("CRITICAL: ", "");

    if (conversationsToday === 0) {
      greeting = `Hi ${firstName} — heads up: ${topAlert} Want me to pull up the details?`;
    } else {
      greeting = `${firstName}, quick flag: ${topAlert} Want me to look into it?`;
    }

    if (urgentAlerts.length > 1) {
      greeting += `\n\n${urgentAlerts.length - 1} more thing${urgentAlerts.length - 1 > 1 ? "s" : ""} need${urgentAlerts.length - 1 === 1 ? "s" : ""} attention — ask me when you're ready.`;
    }
  } else if (upcomingAlerts.length > 0 && conversationsToday === 0) {
    // First visit + non-urgent alerts: mention count briefly
    greeting += `\n\nI've got ${upcomingAlerts.length} thing${upcomingAlerts.length > 1 ? "s" : ""} flagged for this week if you want to review them.`;
  }

  // Continuity: if returning user had a recent topic, mention it naturally
  if (conversationsToday > 0 && lastTopic && !urgentAlerts.length) {
    greeting += `\n\nWe were looking at ${lastTopic} earlier — happy to pick that up if you need.`;
  }

  return {
    greeting,
    suggestions: urgentAlerts.concat(upcomingAlerts).slice(0, 3),
  };
}

/**
 * Check if a message is a greeting (used to trigger greeting flow)
 */
export function isGreeting(query: string): boolean {
  const cleaned = query.toLowerCase().replace(/[.,!?'"]/g, "").trim();
  const greetings = [
    "hi", "hello", "hey", "good morning", "good afternoon",
    "good evening", "greetings", "yo", "hiya", "morning",
  ];

  if (greetings.includes(cleaned)) return true;
  if (cleaned.length < 12 && greetings.some((g) => cleaned.includes(g))) return true;
  return false;
}
```

- [ ] **Step 2: Update the package exports**

In `packages/ed-agents/src/index.ts`, update the greeting exports:
```typescript
// Replace old greeting exports with:
export { buildGreeting, isGreeting } from './agents/contextual-greeting';
export type { GreetingInput, GreetingOutput } from './agents/contextual-greeting';
```

Remove the old `getContextualGreeting` export if it exists.

- [ ] **Step 3: Commit**

```bash
git add packages/ed-agents/src/agents/contextual-greeting.ts packages/ed-agents/src/index.ts
git commit -m "feat(ed): conversation-aware greeting — first visit vs returning user"
```

---

### Task 3: Wire Greeting Into Orchestrator

**Files:**
- Modify: `packages/ed-agents/src/orchestrator/orchestrator.ts` (lines 370-519)

Replace the `handleProactiveGreeting` method and `buildPersonalGreeting` method with the new conversation-aware system. Query `ed_conversation_log` for today's conversation count.

- [ ] **Step 1: Replace the greeting methods in orchestrator.ts**

Find and replace the `handleProactiveGreeting` method (starts around line 371) and `buildPersonalGreeting` method (starts around line 425). Replace both with:

```typescript
  /**
   * Handle greeting — conversation-aware
   *
   * Checks how many times this user has chatted today.
   * First visit: "Hi David, what can I help you with?"
   * Returning: "Hi David, what else can I help you with today?"
   * With alerts: leads with the most urgent alert.
   */
  async handleProactiveGreeting(context: {
    url?: string;
    title?: string;
    userName?: string;
    userRole?: string;
  }): Promise<{ greeting: string; alerts: string[]; recentTopics?: string[] }> {
    const domain = context.url ? mapUrlToDomain(context.url) : null;
    const name = context.userName || "there";
    let alerts: string[] = [];
    let conversationsToday = 0;
    let lastTopic: string | undefined;

    if (this.config.supabase && this.config.orgId) {
      // Count today's conversations for this user
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayChats, count } = await this.config.supabase
          .from("ed_conversation_log")
          .select("topic_summary, created_at", { count: "exact" })
          .eq("organization_id", this.config.orgId)
          .eq("user_id", this.config.userId)
          .gte("created_at", todayStart.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        conversationsToday = count || 0;

        if (todayChats && todayChats.length > 0) {
          lastTopic = todayChats[0].topic_summary;
        }
      } catch {
        // Table may not exist yet
      }

      // Load proactive alerts for the current domain
      if (domain) {
        alerts = await generateProactiveContext(
          this.config.orgId,
          domain,
          this.config.supabase,
        );
      }
    }

    // Build greeting using the new system
    const { buildGreeting } = await import("../agents/contextual-greeting");
    const result = buildGreeting({
      firstName: name,
      conversationsToday,
      lastTopic,
      alerts,
      domain: domain || undefined,
    });

    return {
      greeting: result.greeting,
      alerts: result.suggestions,
    };
  }
```

- [ ] **Step 2: Remove the old helper methods**

Delete these methods entirely from the class:
- `buildPersonalGreeting` (the old domain-specific greeting builder)
- `getTimeOfDayGreeting` (the "Good morning/afternoon/evening" helper)

- [ ] **Step 3: Rewrite `getWorkFocusRedirect`**

Replace the existing method (around line 536) with:

```typescript
  /**
   * Redirect non-work queries — short, no capability list
   */
  private getWorkFocusRedirect(): string {
    return "I'm set up to help with school work — what do you need?";
  }
```

- [ ] **Step 4: Commit**

```bash
git add packages/ed-agents/src/orchestrator/orchestrator.ts
git commit -m "feat(ed): wire conversation-aware greeting, remove verbose redirects"
```

---

### Task 4: Inject Personality Preamble Into Agent Router

**Files:**
- Modify: `packages/ed-agents/src/orchestrator/agent-router.ts` (lines 100-108, 142-147, 278-427)

Three changes:
1. Prepend `ED_PERSONALITY_PREAMBLE` before every specialist prompt
2. Reduce `maxTokens` from 2048 to 1024 (force conciseness)
3. Make the massive platform guide conditional — only inject when the user asks a navigation/how-to question

- [ ] **Step 1: Import the personality preamble**

Add to the imports at the top of `agent-router.ts`:
```typescript
import { ED_PERSONALITY_PREAMBLE } from "../agents/personality";
```

- [ ] **Step 2: Prepend personality in `buildSpecialistPrompt`**

In the `buildSpecialistPrompt` function (around line 278), add the preamble as the first thing:

Replace:
```typescript
async function buildSpecialistPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null | undefined,
  question: string,
  context?: AppContext,
  domain?: string,
): Promise<string> {
  let prompt = basePrompt;
```

With:
```typescript
async function buildSpecialistPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null | undefined,
  question: string,
  context?: AppContext,
  domain?: string,
): Promise<string> {
  // Ed's personality comes first — every specialist inherits the same voice
  let prompt = `${ED_PERSONALITY_PREAMBLE}\n\n${basePrompt}`;
```

- [ ] **Step 3: Make platform guide conditional**

Replace the platform guide injection block (the massive `const platformGuide = ...` block starting around line 306 and ending around line 404) with:

```typescript
  // Platform guide — only inject for navigation/how-to questions
  // This saves ~2000 tokens on every non-navigation message
  const isNavigationQuestion = isHowToQuestion(question);
  if (isNavigationQuestion) {
    const platformGuide = buildPlatformGuide(context);
    prompt = `${prompt}\n\n${platformGuide}`;
  }
```

Then add these two helper functions after the `buildSpecialistPrompt` function:

```typescript
/**
 * Detect if the user is asking a navigation or how-to question
 */
function isHowToQuestion(question: string): boolean {
  const q = question.toLowerCase();
  const patterns = [
    "how do i", "how to", "where is", "where do i", "where can i",
    "take me to", "navigate to", "show me", "find the", "go to",
    "open the", "what page", "which page", "how does the",
    "where are the settings", "how do i get to",
  ];
  return patterns.some((p) => q.includes(p));
}

/**
 * Build the platform navigation guide (only injected for how-to questions)
 */
function buildPlatformGuide(context?: AppContext): string {
  return `## Schoolgle Platform Guide
You are an expert on every module in Schoolgle. Guide users step-by-step. Use markdown links for navigation: [Go to Page](/route)
User is on: ${(context as any)?.url || "/dashboard"}

### Key Routes
- **Estates**: [Maintenance](/dashboard/estates/maintenance), [Compliance](/estates-compliance), [Floor Plans](/dashboard/estates/floor-plan), [Energy](/dashboard/estates/energy)
- **HR**: [Staff](/dashboard/hr/people), [Meetings](/dashboard/hr/meetings), [Sickness](/dashboard/hr/sickness), [Cover](/dashboard/hr/cover)
- **Finance**: [Budget](/dashboard/finance/monitor), [Staffing Modeller](/dashboard/finance/staffing-modeller)
- **Compliance**: [Policies](/dashboard/compliance/policies), [Training](/dashboard/compliance/training), [GDPR](/dashboard/compliance/gdpr), [SCR](/dashboard/compliance/scr)
- **Governance**: [Portal](/dashboard/governance), [Visits](/dashboard/governance/visits)
- **Risk**: [Register](/dashboard/risk), [ICFP](/dashboard/risk/icfp)
- **Inspection**: [Ofsted](/dashboard/ofsted-readiness), [SEF](/dashboard/sef), [SDP](/dashboard/sdp), [Actions](/dashboard/action-plan)
- **Teaching**: [Lesson Studio](/dashboard/teaching-learning/lesson-studio), [Assessment](/dashboard/teaching-learning/assessment-support)
- **Intelligence**: [Analysis](/dashboard/school-intelligence), [Canvas](/dashboard/canvas)
- **Settings**: [Data Connections](/dashboard/settings/data-connections), [Privileges](/dashboard/settings/privileges)

When guiding: give the route link, then 1-2 sentences on what to do there. Don't describe every feature of the page.`;
}
```

- [ ] **Step 4: Reduce maxTokens**

Find the LLM call (around line 142):
```typescript
    const llmResponse = await modelRouter.chatMessages(llmMessages as any, {
      model: model.id,
      temperature: 0.7,
      maxTokens: 2048,
      tools: tools,
    });
```

Change `maxTokens: 2048` to `maxTokens: 1024`.

- [ ] **Step 5: Commit**

```bash
git add packages/ed-agents/src/orchestrator/agent-router.ts
git commit -m "feat(ed): inject personality preamble, conditional platform guide, reduce maxTokens"
```

---

### Task 5: Strip Template Bloat From All Specialist Prompts

**Files:**
- Modify: All 13 files in `packages/ed-agents/src/agents/prompts/`

Every specialist prompt currently has a mandatory response template (Freshness Status, Current Guidance, Important Notes, Your Next Steps, Sources). This forces verbose, padded responses even for simple questions.

The personality preamble (Task 1) now handles tone and response length. Specialists only need to define:
1. Their domain expertise and qualifications
2. Their callable skills
3. Domain-specific rules (e.g., "NEVER give engineering advice" for estates)
4. Key knowledge references

**The response template sections should be REMOVED from all prompts.**

- [ ] **Step 1: Update estates-specialist.ts**

In `packages/ed-agents/src/agents/prompts/estates-specialist.ts`, find and delete this entire block:

```
## Response Format
### Compliance Guidance: [Topic]

### 📅 Freshness Status
- Last Updated: [DATE]
- Source: [HSE/DfE/etc]
- Confidence: HIGH/MEDIUM/LOW
- Source URL: [link if available]

### Current Guidance
[Clear advice with source citations. Be specific and actionable.]

### ⚠️ Important Notes
[Any warnings, recent changes, things to watch out for]

### Your Next Steps
1. [Action 1]
2. [Action 2]
3. [Action 3 if needed]

### Sources
- [Source name](URL) - Last accessed: [DATE]
```

Also remove the personality/tone lines from the top of the prompt since they're now in the preamble. Remove:
```
- Personality: Pragmatic, commercially savvy, protective of schools
- Tone: Direct, clear, reassuring. Use simple language. No jargon without explanation.
```

And change the opening line from:
```
You are TERRY TAURUS — Schoolgle's Estate & Health and Safety Specialist.
```
To:
```
You are Ed's estates and health & safety specialist mode.
```

Keep everything else (qualifications, critical rules, callable skills, key knowledge, key behaviours, escalation rules, common topics, PROPOSE→APPROVE governance). Those are domain knowledge, not personality.

Add this at the end of the Critical Rules section:
```
7. For compliance/statutory questions, cite the source and date. For general estates questions, skip the citations.
8. Only use the full structured format (headers, sources, next steps) for statutory compliance advice. Conversational questions get conversational answers.
```

- [ ] **Step 2: Update hr-specialist.ts**

Same pattern. Delete the Response Format template block. Change opening to:
```
You are Ed's HR specialist mode.
```

Add to Critical Rules:
```
6. Only use structured format for complex employment law questions. Simple HR queries get direct answers.
```

- [ ] **Step 3: Update all remaining specialist prompts**

Apply the same changes to all 11 remaining specialist prompts:
- `send-specialist.ts`
- `data-specialist.ts`
- `curriculum-specialist.ts`
- `it-tech-specialist.ts`
- `procurement-specialist.ts`
- `governance-specialist.ts`
- `communications-specialist.ts`
- `form-specialist.ts`
- `intelligence-specialist.ts`
- `risk-specialist.ts`
- `canvas-specialist.ts`

For each one:
1. Delete the Response Format template block
2. Change opening line to "You are Ed's [domain] specialist mode."
3. Remove personality/tone lines (now in shared preamble)
4. Add a rule about scaling response format to question complexity
5. Keep all domain knowledge, qualifications, callable skills, and domain-specific rules

- [ ] **Step 4: Update ED_GENERAL_PROMPT in agents.ts**

Replace the `ED_GENERAL_PROMPT` in `packages/ed-agents/src/agents/agents.ts` (lines 116-150) with:

```typescript
export const ED_GENERAL_PROMPT = `You are Ed, the AI assistant for Schoolgle.

## Your Job
Help school staff get work done. If a question needs specialist knowledge (estates compliance, HR law, SEND, data, etc.), you'll be automatically routed to the right specialist — you don't need to say "let me route you."

## What You Do
- Answer general questions about using Schoolgle
- Help people find things in the platform
- Handle anything that doesn't need a specific specialist

## What You Don't Do  
- Give specific compliance, HR, or legal advice (specialists handle that)
- Chat about non-work topics (redirect politely in one sentence)

Current date: ${new Date().toISOString().split("T")[0]}`;
```

- [ ] **Step 5: Commit**

```bash
git add packages/ed-agents/src/agents/agents.ts packages/ed-agents/src/agents/prompts/
git commit -m "feat(ed): strip template bloat from all specialist prompts, unify voice"
```

---

### Task 6: Add Brevity Guardrail

**Files:**
- Modify: `packages/ed-agents/src/guardrails/pipeline.ts`

Add a guardrail that detects unnecessarily long or padded responses and flags them. This doesn't rewrite the response (that would add latency) — it logs a warning so we can tune the prompts.

- [ ] **Step 1: Add the brevity check function**

Add after the `toneCheck` function (around line 318):

```typescript
// ============================================================================
// Brevity Check
// ============================================================================

/**
 * Waffle patterns — things Ed should never say
 */
const WAFFLE_PATTERNS = [
  /great question/gi,
  /i'd be happy to help/gi,
  /i would be happy to/gi,
  /absolutely[!,]/gi,
  /that's a really good point/gi,
  /let me know if you need anything else/gi,
  /don't hesitate to ask/gi,
  /feel free to reach out/gi,
  /i hope this helps/gi,
  /here are some things i can help with/gi,
  /i can assist you with/gi,
  /i can help you with/gi,
  /is there anything else/gi,
];

/**
 * Check for unnecessary verbosity and waffle
 */
export function brevityCheck(response: string): GuardrailCheckResult {
  // Check for waffle patterns
  for (const pattern of WAFFLE_PATTERNS) {
    if (pattern.test(response)) {
      return {
        passed: false,
        confidence: 0.8,
        reason: `Contains filler phrase: ${pattern.source}`,
        suggestion: "Remove filler phrases — be direct.",
      };
    }
  }

  // Check for capability lists (bullet points starting with "I can")
  const capabilityListMatch = response.match(/^[•\-\*]\s*(I can|Help with|Assist with)/gim);
  if (capabilityListMatch && capabilityListMatch.length >= 3) {
    return {
      passed: false,
      confidence: 0.7,
      reason: "Response contains a capability list",
      suggestion: "Don't list capabilities — offer a specific action instead.",
    };
  }

  return { passed: true, confidence: 1.0 };
}
```

- [ ] **Step 2: Wire brevity check into the pipeline**

In the `applyGuardrails` function (around line 428), add brevity check to the parallel checks:

Replace:
```typescript
  const [safety, compliance, tone, permission] = await Promise.all([
    safetyCheck(response, context),
    complianceCheck(response, context),
    toneCheck(response, context),
    permissionCheck(response, context),
  ]);
```

With:
```typescript
  const [safety, compliance, tone, permission] = await Promise.all([
    safetyCheck(response, context),
    complianceCheck(response, context),
    toneCheck(response, context),
    permissionCheck(response, context),
  ]);

  // Brevity check (synchronous, fast)
  const brevity = brevityCheck(response);
```

Then after the tone check block (around line 456), add:

```typescript
  // 2b. Brevity check — strip waffle if detected
  if (!brevity.passed) {
    // Log for monitoring but don't block — the personality preamble should
    // prevent most waffle. If this fires frequently, the prompts need tuning.
    console.warn(`[Guardrails] Brevity check failed: ${brevity.reason}`);
  }
```

- [ ] **Step 3: Commit**

```bash
git add packages/ed-agents/src/guardrails/pipeline.ts
git commit -m "feat(ed): add brevity guardrail to detect waffle and capability lists"
```

---

### Task 7: Update Chat API Greeting Handler

**Files:**
- Modify: `apps/platform/src/app/api/ed/chat/route.ts` (lines 401-431)

The chat API currently imports `getContextualGreeting` which no longer exists. Update it to use the new `buildGreeting` function, passing conversation count from `ed_conversation_log`.

- [ ] **Step 1: Update the import**

Replace:
```typescript
import {
  createOrchestrator,
  isGreeting,
  getContextualGreeting,
} from "@schoolgle/ed-agents";
```

With:
```typescript
import {
  createOrchestrator,
  isGreeting,
} from "@schoolgle/ed-agents";
```

(The greeting is now handled inside the orchestrator's `handleProactiveGreeting` — no need for a separate import.)

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/api/ed/chat/route.ts
git commit -m "fix(ed): update chat API import for new greeting system"
```

---

### Task 8: Update Fallback Greetings in UI Components

**Files:**
- Modify: `apps/platform/src/components/EdChatbot.tsx` (line 31)
- Modify: `apps/platform/src/components/ed/EdSidebarChat.tsx` (lines 124-141)

When the greeting API call fails, the UI falls back to a hardcoded greeting. Update these to match Ed's new voice.

- [ ] **Step 1: Update EdChatbot.tsx fallback**

In `apps/platform/src/components/EdChatbot.tsx`, find line 31:
```typescript
      content: "Hello! I'm Ed, your Schoolgle assistant. How can I help you today?",
```

Replace with:
```typescript
      content: "Hi — what can I help you with?",
```

- [ ] **Step 2: Update EdSidebarChat.tsx fallbacks**

In `apps/platform/src/components/ed/EdSidebarChat.tsx`, find the two fallback greeting strings (around lines 127 and 137):
```typescript
            content: `Hello! I'm Ed, your school assistant. How can I help you today?`,
```

Replace both occurrences with:
```typescript
            content: `Hi — what can I help you with?`,
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/components/EdChatbot.tsx apps/platform/src/components/ed/EdSidebarChat.tsx
git commit -m "fix(ed): update fallback greetings to match new personality"
```

---

### Task 9: Build Check & Verification

**Files:**
- No new files

- [ ] **Step 1: Run the build**

```bash
cd apps/platform && npm run build
```

Fix any import errors, missing exports, or type issues. The most likely issues:
- Old `getContextualGreeting` references elsewhere in the codebase
- The `buildGreeting` type being imported incorrectly
- The personality preamble import path

- [ ] **Step 2: Search for any remaining references to old exports**

```bash
grep -r "getContextualGreeting\|getPlatformGreeting\|getLoggedInGreeting\|getContextualWorkRedirect\|getPageBasedSuggestions" packages/ apps/ --include="*.ts" --include="*.tsx" -l
```

Update any files still referencing the old greeting functions.

- [ ] **Step 3: Search for waffle patterns in remaining code**

```bash
grep -r "I'd be happy to help\|Great question\|don't hesitate\|Let me know if you need" packages/ apps/ --include="*.ts" --include="*.tsx" -l
```

Fix any hardcoded waffle in the codebase.

- [ ] **Step 4: Run the dev server and test Ed**

```bash
npm run dev
```

Open the browser, navigate to the dashboard, open Ed. Test:
1. First greeting — should be "Hi [name], what can I help you with?"
2. Ask a simple question ("when is PAT testing due?") — should get a short, direct answer
3. Close and reopen Ed — greeting should say "what else can I help you with today?"
4. Ask a compliance question — should get structured answer with source, but no template bloat

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(ed): resolve build issues from personality rework"
```

---

## Self-Review Checklist

1. **Spec coverage:** Core personality (Task 1), greeting awareness (Task 2-3), prompt cleanup (Task 5), brevity guardrail (Task 6), API wiring (Task 7), UI fallbacks (Task 8), build verification (Task 9). All requirements covered.

2. **Placeholder scan:** No TBDs, TODOs, or "implement later" patterns. All code blocks are complete.

3. **Type consistency:** `GreetingInput`/`GreetingOutput` types defined in Task 2, consumed in Task 3. `ED_PERSONALITY_PREAMBLE` defined in Task 1, consumed in Task 4. `brevityCheck` defined and wired in Task 6. `buildGreeting` exported in Task 2, imported in Task 3. `isGreeting` kept with same signature.
