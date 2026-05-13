# AI Model Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Schoolgle's non-negotiable approved-provider AI model policy across the product.

**Architecture:** Add a central model policy and runtime guards around OpenRouter usage, then remove disallowed model IDs from product code and operational docs. Add a source scan test so future model drift is caught automatically.

**Tech Stack:** TypeScript, Vitest, Next.js platform app, Ed agents package, OpenRouter.

---

### Task 1: Add Policy Tests

**Files:**
- Create: `apps/platform/src/lib/ai/model-policy.test.ts`
- Create: `apps/platform/src/lib/ai/model-policy-source-scan.test.ts`

- [x] Write failing tests for approved provider families.
- [x] Write failing source/docs scan for disallowed model identifiers.
- [x] Run `npx vitest run src/lib/ai/model-policy.test.ts src/lib/ai/model-policy-source-scan.test.ts` and verify failure.

### Task 2: Add Runtime Policy

**Files:**
- Create: `apps/platform/src/lib/ai/model-policy.ts`
- Create: `packages/ed-agents/src/models/model-policy.ts`
- Modify: `apps/platform/src/lib/ai-openrouter.ts`
- Modify: `packages/ed-agents/src/models/openrouter.ts`

- [x] Add approved provider prefixes: OpenAI, Anthropic, Google, Meta Llama, Mistral, Microsoft.
- [x] Block non-approved model IDs before OpenRouter requests are sent.
- [x] Add lowest-cost approved model helper for routing decisions.

### Task 3: Remove Disallowed Defaults

**Files:**
- Modify: `apps/platform/src/lib/school-intelligence-engine.ts`
- Modify: `apps/platform/src/lib/morning-brief/script-generator.ts`
- Modify: `apps/platform/src/app/api/meetings/[id]/minutes/route.ts`
- Modify: `apps/platform/src/lib/skills/form-helper-handler.ts`
- Modify: `apps/platform/src/lib/vision/models.ts`
- Modify: `packages/ed-agents/src/models/openrouter.ts`
- Modify: `packages/ed-agents/src/models/router.ts`
- Modify: `packages/ed-agents/src/perspectives/generator.ts`

- [x] Replace disallowed text models with `openai/gpt-4o-mini` or `google/gemini-2.0-flash-001`.
- [x] Replace disallowed vision fallback with approved Google/OpenAI vision fallback.
- [x] Update Ed agent aliases and routing constraints.

### Task 4: Document the Product Rule

**Files:**
- Modify: `AGENTS.md`
- Replace: `docs/AI_MODELS.md`

- [x] Add the non-negotiable provider rule to agent instructions.
- [x] Document approved providers, cost/quality model selection, and change-control checks.

### Task 5: Verify

- [ ] Run model policy tests.
- [ ] Run focused lint on changed policy/model files.
- [ ] Report any unrelated repo-wide issues separately.
