# Policy To SOP Operating Model

Schoolgle should treat policies and standard operating procedures as linked but different artefacts.

## Product Principle

- **Policy** explains what the school must or chooses to do.
- **SOP** explains exactly how this school does it in practice.
- **Ed** can interview leaders to localise SOPs, but only approved/current SOPs should become operational truth in Ed's knowledge base.
- **Show Me** should present SOPs as a visual journey: first this, then this, then evidence/action.

## Workflow

1. Policy Manager identifies a required policy or a policy content gap.
2. Schoolgle recommends SOPs that the policy should trigger.
3. Ed asks local setup questions: roles, timings, systems, thresholds, contacts and evidence locations.
4. Schoolgle creates a draft SOP with written steps, visual flow, task/evidence hooks and linked policy references.
5. Leaders approve the SOP and set review/ownership.
6. Approved SOPs become school-specific knowledge for Ed and can trigger recurring tasks.
7. Policy or staff/role changes flag linked SOPs for review.

## Starter Scope

The first built-in SOP library lives in `apps/platform/src/lib/sop-starter-library.ts` and includes practical operational starters such as:

- opening school;
- closing school;
- legionella monitoring;
- weekly fire safety check;
- pupil accident response;
- staff accident and RIDDOR triage;
- contractor site induction;
- suspected asbestos disturbance;
- safeguarding concern reporting;
- missing child response;
- behaviour incident response;
- bullying report response;
- attendance concern support;
- SEND graduated response review;
- trip charging and remissions approval;
- pay decision cycle;
- medicine administration;
- data breach triage;
- complaint intake;
- policy review and website publication.

## Guardrails

- Draft SOPs are advisory and must be checked locally.
- SOPs should store source references and evidence expectations.
- SOPs should link to policy requirement IDs so policy updates can trigger SOP reviews.
- SOPs should avoid hardcoded school names; school profile, staff connectors and approved local answers should populate local details.
- Ed must not answer operational questions from unapproved draft SOPs as if they are approved school practice.
