# AI Model Configuration Guide

## Non-Negotiable Provider Policy

Schoolgle must only process school, pupil, staff, finance, estates, safeguarding, HR, governance or customer data with approved AI provider families:

- OpenAI
- Anthropic
- Google
- Meta Llama
- Mistral
- Microsoft

Do not add another provider family unless the product owner has explicitly approved the change after a documented GDPR, DPA, data-transfer and regional-processing review.

The runtime guardrail lives in `apps/platform/src/lib/ai/model-policy.ts`. The Ed agent package has the same policy in `packages/ed-agents/src/models/model-policy.ts`.

## Central Model Registry

The maintained source of truth is `apps/platform/src/lib/ai/model-registry.ts`.

Admins can view it in the product at `/dashboard/settings/ai-models`. The page shows the application or skill, primary model, fallback models, route, provider families, cost tier, quality tier, data classification, source files and review date.

When a new AI-powered feature is added, add a registry entry in the same change. The registry is covered by `apps/platform/src/lib/ai/model-registry.test.ts`, which checks that every listed primary and fallback model is from an approved provider family.

## Cost/Quality Selection Rule

Pick the cheapest approved model that can reliably do the job:

| Job Type | Default Model | Escalate To | Notes |
| --- | --- | --- | --- |
| Routing, classification, short summaries | `openai/gpt-4o-mini` | `google/gemini-2.0-flash-001` | Keep cheap and fast. |
| Document/evidence extraction | `google/gemini-2.0-flash-001` | `anthropic/claude-3.5-sonnet` | Escalate only for poor extraction or high-value synthesis. |
| OCR/scanned PDFs | `mistralai/mistral-ocr-latest` | `google/gemini-2.0-flash-001` | OCR-specific work only. |
| Vision/screenshots/site photos | `google/gemini-2.5-flash` or `google/gemini-2.0-flash-001` | `openai/gpt-4o` | Use direct Gemini first where available. |
| Final reports/trustee-ready synthesis | `anthropic/claude-3.5-sonnet` | `openai/gpt-4o` | Higher-cost models require user value justification. |

## Policy Manager Production Rule

Policy Manager policy scoring, enhanced draft generation, source-backed explanation and legislation/source-change monitoring must run through Schoolgle's OpenRouter integration, not through an interactive coding assistant session. Codex/Claude outputs can prototype the workflow, rule packs and UI, but the live product must have:

1. A model registry entry in `apps/platform/src/lib/ai/model-registry.ts` for each Policy Manager AI job.
2. A prompt/rule-pack definition that explicitly lists the policy type, approved sources, expected output schema and advisory-only limits.
3. Evaluation tests using known-good Schoolgle templates, weak/partial sample policies and missing-policy cases.
4. A cost/latency check before defaulting to a premium model.
5. A fallback path that never invents legislation, sources, review dates or compliance findings when the model is uncertain.

For policy generation specifically, the target behaviour is: generate an in-system Schoolgle draft with source references, assumptions and human approval status; export to HTML/PDF/Word only as publishing or handoff outputs.

## Current Core Models

Models configured in `apps/platform/src/lib/ai-evidence-matcher.ts`:

```ts
export const MODEL_CONFIG = {
  primary: {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    useFor: ["docx", "xlsx", "txt", "google-docs", "text-pdf"],
  },
  ocr: {
    id: "mistralai/mistral-ocr-latest",
    name: "Mistral OCR",
    useFor: ["scanned-pdf", "image", "jpg", "png", "jpeg"],
  },
  vision: {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    useFor: ["charts", "diagrams", "visual-reports"],
  },
  fallback: {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash Lite",
    useFor: ["retry", "json-parsing-failed"],
  },
  premium: {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    useFor: ["sef-generation", "final-synthesis"],
  },
};
```

## Required Checks Before Adding/Changing a Model

1. Confirm the model provider family is approved in `apps/platform/src/lib/ai/model-policy.ts`.
2. Confirm a DPA/privacy position exists for the provider route being used.
3. Confirm the model is the cheapest approved model that can do the job.
4. Add or update the entry in `apps/platform/src/lib/ai/model-registry.ts`.
5. Add or update tests so disallowed providers cannot re-enter source/docs.
6. Document the rationale and expected cost impact here.

## Enforcement

- `apps/platform/src/lib/ai-openrouter.ts` blocks non-approved model IDs before OpenRouter requests are sent.
- `packages/ed-agents/src/models/openrouter.ts` blocks non-approved Ed model IDs before Ed agent requests are sent.
- `apps/platform/src/lib/ai/model-policy-source-scan.test.ts` scans product source and docs for disallowed model identifiers.
- `apps/platform/src/lib/ai/model-registry.test.ts` keeps the admin model registry aligned with the approved-provider rule.
