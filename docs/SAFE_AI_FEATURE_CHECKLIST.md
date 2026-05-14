# Safe AI Feature Checklist

Complete this checklist before any new AI-powered Schoolgle feature is released.

## Feature Summary

- [ ] Feature name:
- [ ] Owning module:
- [ ] Product owner:
- [ ] Developer:
- [ ] Release target:
- [ ] Model registry entry added or updated:

## Data Use

- [ ] What data is used?
- [ ] Is pupil data involved?
- [ ] Is staff data involved?
- [ ] Is safeguarding, SEND, HR, admissions, exclusions, assessment or health data involved?
- [ ] Is the data necessary for the feature to work?
- [ ] Has unnecessary personal or sensitive data been removed before AI processing?
- [ ] Is connect-and-reference safer than upload-and-copy for this workflow?
- [ ] Are raw prompts and completions kept out of production logs unless explicitly required?

## Output Safety

- [ ] Is the output advisory only?
- [ ] Is there a clear human approval or review step?
- [ ] Can the user edit, reject or override the AI output?
- [ ] Are sources, evidence links, reasons or assumptions shown where possible?
- [ ] Is there a safe fallback if AI fails or returns low-confidence output?
- [ ] Could the output be seen as profiling, ranking or scoring pupils or staff?
- [ ] Could the output affect SEND, safeguarding, admissions, exclusions, HR, assessment outcomes or compliance status?

## Permissions and Audit

- [ ] Are permissions enforced server-side, not only in the UI?
- [ ] Does the route use `protectedRoute` or `aiRoute` where appropriate?
- [ ] Does the organisation id come from the authenticated session?
- [ ] Are audit logs created for generated findings, tasks, drafts, approvals and overrides?
- [ ] Do audit logs avoid unnecessary sensitive prompt or response text?
- [ ] Are approval status, approver and timestamp captured where needed?

## Transparency

- [ ] Is the user told AI is being used?
- [ ] Is the output labelled "draft", "suggested", "advisory" or "needs review" where relevant?
- [ ] Does the UI avoid implying AI makes final decisions?
- [ ] Is a reusable notice used where the workflow handles sensitive data or compliance advice?
- [ ] Are limitations explained in plain UK English?

## Wording Gate

- [ ] The wording avoids "decision", "judgement", "grade" and "prediction" unless clearly human-led.
- [ ] The wording avoids "Ofsted will", "guaranteed", "certified compliant" and "inspection outcome".
- [ ] The wording avoids legal or compliance certainty unless backed by a human-approved source.
- [ ] The wording clearly says safeguarding, SEND, HR and compliance decisions remain with authorised school staff.

## Provider and Prompt Gate

- [ ] The provider family is approved: OpenAI, Anthropic, Google, Meta Llama, Mistral or Microsoft.
- [ ] The model is listed in `apps/platform/src/lib/ai/model-registry.ts`.
- [ ] The prompt tells the model not to invent evidence, sources, dates, legislation, grades or outcomes.
- [ ] The prompt includes domain boundaries for safeguarding, SEND, HR, assessment and compliance where relevant.
- [ ] The feature has been tested with missing, ambiguous and sensitive input.

## Sign-Off

- [ ] Engineering review complete.
- [ ] Product review complete.
- [ ] Data protection review complete where sensitive data is involved.
- [ ] Safeguarding/SEND/HR domain review complete where relevant.
- [ ] Manual test evidence recorded.
