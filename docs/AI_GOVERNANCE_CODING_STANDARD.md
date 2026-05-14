# AI Governance Coding Standard

Last reviewed: 2026-05-14

This standard applies to every Schoolgle feature that uses AI, automation, scoring, evidence matching, extraction, summarisation, recommendation, routing or generated content.

## Core Principle

Schoolgle is human-led. AI may assist, explain, summarise, connect evidence, draft content and suggest next steps. AI must not make final decisions about pupils, staff, safeguarding, SEND, employment, admissions, exclusions, assessment outcomes, inspection grades or compliance status.

## Human-In-The-Loop Rules

- Every AI output that could affect a person, compliance position, school record, task priority, report, submission or published communication must be reviewable by an authorised human.
- AI-generated actions must be saved as drafts, recommendations or proposed findings until a user approves them.
- Users must be able to edit, reject, override or annotate AI outputs.
- Approval actions must record who approved the output, when, what changed and the source evidence used.
- AI must never silently send, submit, move, delete, approve, reject, admit, exclude, discipline, grade, certify or close a matter.

## Prohibited Autonomous Decisions

AI must not autonomously:

- Decide safeguarding risk, close a safeguarding concern or replace DSL judgement.
- Decide SEND eligibility, need, provision, EHCP wording, funding banding or placement.
- Decide admissions, exclusions, behaviour sanctions or attendance interventions.
- Decide HR, sickness, disciplinary, performance, recruitment or pay outcomes.
- Decide pupil assessment outcomes, final marks, grades or teacher assessment levels.
- Decide inspection grades, predict Ofsted/SIAMS outcomes or claim inspection certainty.
- Decide legal, statutory or compliance status as final or certified.
- Decide whether a school should publish, withhold or amend statutory information.

## Role-Based Access

- API routes that read or write school data must use `protectedRoute` or `aiRoute`.
- The authenticated organisation id must come from the session, not the request body, unless a route is explicitly designed for cross-organisation admin use.
- Sensitive areas require at least:
  - Safeguarding, HR, admissions, exclusions, SEND decisions and governance papers: `slt` or `admin`.
  - Staff directory, actions, evidence and routine compliance: `teacher` or above, subject to module rules.
  - Platform administration and billing: `admin`.
- Service-role Supabase clients may only be used after session and organisation checks have passed.
- AI prompts must not include data outside the user's current organisation or role permissions.

## Data Minimisation

- Prefer connect-and-reference over upload-and-copy when the original file should remain in Google Drive, OneDrive or SharePoint.
- Send only the minimum text, fields and context needed for the AI task.
- Remove pupil names, staff names, dates of birth, contact details, addresses, medical details and safeguarding narrative unless strictly necessary and approved for that workflow.
- Use pseudonymised pupil ids for assessment and intelligence analysis.
- Do not store raw AI prompts or completions containing sensitive personal data unless there is a documented retention need and access control.
- Avoid logging request bodies, prompt content, generated content or provider responses in production logs.

## Prompt Safety

All production AI prompts must:

- State that outputs are advisory only and require human review where relevant.
- Tell the model not to invent sources, legislation, dates, data, inspection outcomes or compliance status.
- Tell the model to flag uncertainty and missing evidence.
- Require source references, evidence ids or reasons where the output depends on source material.
- Avoid instructing the model to act as the final decision-maker.
- Avoid persona wording that overstates authority, such as "you are the inspector deciding the grade".
- Include domain-specific boundaries for safeguarding, SEND, HR, admissions, exclusions and assessment workflows.

## Model and Provider Handling

- School/customer data may only be sent to approved provider families: OpenAI, Anthropic, Google, Meta Llama, Mistral and Microsoft.
- Add every new AI feature to `apps/platform/src/lib/ai/model-registry.ts`.
- Keep model selection behind approved policy helpers where practical.
- Use the cheapest approved model that can reliably complete the task.
- Use premium models only where quality, safety or source-grounded synthesis justifies the cost.
- AI failure must not result in fabricated output. Return a safe error or ask the user to retry.

## Audit Logging

AI workflows that create or change records must log:

- Organisation id, actor user id, route or feature id and timestamp.
- Input record ids or source references, not full sensitive prompt text.
- Model id, prompt/rule-pack version and output type.
- Approval status, approver id and approval timestamp where relevant.
- Any user edits, rejected suggestions or overridden AI recommendations.

## Safeguarding, SEND and HR Boundaries

- Safeguarding: AI may help capture notes, summarise policy guidance and remind staff of escalation steps. It must direct urgent concerns to the DSL and emergency services where appropriate.
- SEND: AI may explain process, draft editable wording and organise evidence. It must not decide need, eligibility, provision, placement, funding or review outcomes.
- HR: AI may draft templates and summarise policy. It must not decide disciplinary action, capability outcomes, sickness action, pay, recruitment or dismissal.
- Assessment: AI may suggest feedback and identify misconceptions. It must not set final pupil grades or replace teacher assessment.

## Explainability

- Show sources, evidence links, reasons or assumptions wherever possible.
- Distinguish "evidence found", "evidence missing", "AI suggestion" and "human-approved status".
- Report confidence carefully. Low confidence must trigger review wording, not stronger claims.
- Never present AI output as legal advice, compliance certification or inspection prediction.

## UI Wording

Use:

- "AI-assisted"
- "Suggested"
- "Draft"
- "Needs human review"
- "Evidence indicates"
- "Preparation note"
- "Advisory only"

Avoid unless clearly human-led:

- "Decision"
- "Judgement"
- "Grade"
- "Prediction"
- "Certified compliant"
- "Guaranteed"
- "Automatically approved"
- "Ofsted will"
- "Inspection outcome"

## Error Handling and Fallbacks

- If AI fails, keep the user in control and preserve their input.
- Do not silently substitute a different provider family outside the approved list.
- Do not invent missing evidence, dates, policies, statutory sources or calculations.
- Provide a manual workflow or source checklist when AI output cannot be produced safely.

## Red Flag Checks Before Release

Before releasing any AI feature, complete `docs/SAFE_AI_FEATURE_CHECKLIST.md` and confirm:

- The output is advisory, editable and auditable.
- Permissions are enforced server-side.
- Sensitive data is minimised before AI processing.
- Users are told AI is being used.
- Sources or reasons are shown where possible.
- Safeguarding, SEND, HR, admissions, exclusions and assessment boundaries are explicit.
- No wording implies Schoolgle predicts Ofsted outcomes or makes final decisions.
