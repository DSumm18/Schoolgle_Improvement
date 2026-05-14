# AI Governance Audit Report

Audit date: 2026-05-14

## Scope Reviewed

This audit reviewed the current Schoolgle codebase with focus on AI governance, data protection, safeguarding, education compliance and safe product design. The review covered:

- Marketing and dashboard pages under `apps/platform/src/app`.
- API routes under `apps/platform/src/app/api`.
- AI model policy, model registry, OpenRouter wrappers and direct AI calls under `apps/platform/src/lib`.
- Ed agent routing, guardrails, specialist prompts, skills and communication handlers under `packages/ed-agents/src`.
- Evidence, Ofsted, SIAMS, School Intelligence, Trust Assessor, Lesson Studio, form helper, website compliance and estates AI workflows.
- Supabase service-role usage, protected route patterns, audit-log patterns and role-based access patterns.
- Existing product memory, connector model and AI model documentation.

This was a code-level governance audit, not a legal opinion, DPIA, penetration test or full line-by-line security review.

## Summary

Schoolgle already has strong foundations: approved-provider policy, model registry tests, auth wrappers, organisation scoping in many APIs, Ed prompt access rules, PII guardian checks, evidence event logs, approval routes and compliance audit logs.

The main residual risk is inconsistency. Some newer AI routes call providers directly, some prompts use strong inspection or grading language, and some high-risk workflows need clearer human-review labels and audit requirements. The product direction is sound, but the coding standard now needs to be enforced across all AI entry points.

## Risks Found

| Severity | Area | Risk | Evidence | Recommended fix |
| --- | --- | --- | --- | --- |
| High | Lesson Studio pupil work | AI currently performs "grading" of pupil work, includes pupil display name in the prompt and stores an AI suggested grade. This can be interpreted as automated assessment. | `apps/platform/src/app/api/lesson-studio/pupil-work/submit/route.ts` | Keep outputs advisory, remove pupil names from prompts, require teacher review before any grade is used, and rename future UI copy to "suggested feedback" or "teacher review". |
| High | Direct AI calls | Several routes instantiate `OpenAI` or call provider endpoints directly rather than consistently using central governance wrappers. This risks missing provider checks, prompt logging rules and standard disclaimers. | `apps/platform/src/app/api/ai/generative-canvas/route.ts`, `apps/platform/src/app/api/meetings/[id]/prepare/route.ts`, `apps/platform/src/app/api/surveys/[id]/analyze/route.ts`, `apps/platform/src/lib/intelligence-brain/skills.ts` | Move new and touched AI features to a governed AI client that enforces approved models, metadata, minimisation and audit events. |
| High | Inspection wording | Some marketing, docs and prompts imply predictive readiness or what Ofsted will see. This can look like predicting inspection outcomes. | `docs/BUSINESS_PLAN.md`, `docs/marketing/automation/notebooklm-source.md`, `apps/platform/src/app/api/mock-inspector/simulate/route.ts` | Use "readiness", "preparation", "evidence coverage" and "questions to prepare for". Avoid "predictive", "Ofsted will" and grade/outcome language. |
| Medium | School intelligence prompts | Some prompts ask AI to judge context or predict cohorts needing intervention. This may be seen as profiling or automated education decision support if not labelled carefully. | `apps/platform/src/lib/school-intelligence-engine.ts`, `packages/core-ai/src/engines/school-intelligence-engine.ts` | Keep cohort-level analysis, avoid individual decisions, require evidence and human review labels. |
| Medium | Safeguarding forms | Safeguarding helper can store child name and mark urgent. The flow correctly escalates to DSL, but needs strict role checks and audit review before release. | `packages/ed-agents/src/skills/handlers/form-skills.ts` | Ensure DSL/SLT permissions, audit event creation, minimal data retention and no AI-generated safeguarding judgement. |
| Medium | Communication skills | Some Ed skills can send or queue messages. Generated communications must remain draft or approved workflows unless the sender explicitly confirms. | `packages/ed-agents/src/skills/runner.ts`, `packages/ed-agents/src/communication/*` | Require explicit confirmation and audit logging for external communications. |
| Medium | Role consistency | Many API routes use `protectedRoute`, but minimum roles vary and some AI routes use raw handlers. | `apps/platform/src/app/api/**/route.ts` | Standardise route role requirements for high-risk modules and add checklist review before release. |
| Medium | Logging | Console logs exist in AI, connector and communication paths. Some logs include route context and may later include sensitive data if expanded. | `apps/platform/src/lib/cloud-service.ts`, `packages/ed-agents/src/*`, `apps/platform/src/app/api/*` | Avoid logging prompts, request bodies, personal data, tokens, provider responses or raw document extracts. |
| Low | Transparency UI | There are helpful trust/privacy pages, but reusable AI transparency notices were not available across modules. | `apps/platform/src/components/notices` | Add shared notices and use them in AI-assisted workflows. |
| Low | Documentation | AI model docs exist, but developer rules and release checklist were missing. | `docs/AI_MODELS.md` | Add governance coding standard and safe AI checklist. |

## Changes Made

- Created `docs/AI_GOVERNANCE_CODING_STANDARD.md`.
- Created `docs/SAFE_AI_FEATURE_CHECKLIST.md`.
- Created `docs/AI_GOVERNANCE_AUDIT_REPORT.md`.
- Added reusable AI notice components in `apps/platform/src/components/notices/AiGovernanceNotices.tsx`.
- Exported notice components from `apps/platform/src/components/notices/index.ts`.
- Added governance constants and copy validation helpers in `apps/platform/src/lib/ai-governance.ts`.
- Added tests for governance constants in `apps/platform/src/lib/ai-governance.test.ts`.
- Added a public AI governance page at `/ai-governance`.
- Hardened the mock inspector prompt so it must not predict grades or inspection outcomes.
- Reduced Lesson Studio pupil-work prompt exposure by not sending the pupil name to the AI prompt and marking returned output as advisory and requiring teacher review.

## Manual Review Needed

- Review all user-facing copy that mentions "predictive readiness", "Ofsted will", "grade", "judgement", "verdict", "certified", "compliant" or "decision".
- Decide whether Lesson Studio should keep the `ai_suggested_grade` schema field or migrate to a safer "suggested attainment band for teacher review" model.
- Confirm safeguarding helper release status, DSL permissions and retention requirements.
- Confirm whether generated communications can ever be sent by Ed without a second explicit user confirmation.
- Review every direct provider call and migrate active product flows to the governed AI client.
- Complete a DPIA and sub-processor review for every feature using sensitive pupil, staff, SEND, safeguarding, HR or assessment data.
