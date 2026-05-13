# Policy Manager Product Loop

Policy Manager turns a school's messy policy folder into a managed, versioned and publishable policy suite.

## Source Of Truth

- Original school files remain in the connected Drive or SharePoint folder.
- Schoolgle stores policy metadata, extracted checks, source references, managed drafts, versions, approvals, publication status and audit history.
- Schoolgle-generated drafts must not overwrite the original source file unless the school explicitly exports or publishes an approved version.

## Workflow

1. **Connect evidence source** — connect the Schoolgle folder and place current policies in `Policies / Current Policies`.
2. **Match requirements** — map Drive files to the maintained primary policy checklist.
3. **Fill gaps** — if a required policy is missing, generate a source-backed maintained-primary starter draft from the Schoolgle baseline pack.
4. **Score quality** — compare each policy against its source-backed rule pack. Behaviour has the first richer advisory scoring pack; other packs generate drafts while their detailed scoring rules are expanded.
5. **Generate draft** — create a Schoolgle-managed draft, starting at `v1.0` for the first approved Schoolgle version.
6. **Review locally** — capture assumptions, local decisions, owner, approval route and any SOP links.
7. **Approve** — record approver, role, approval date, minute/reference and source checks.
8. **Publish** — generate HTML for in-app/website viewing, plus PDF or Word exports where needed.
9. **Monitor** — watch official sources for changes and create new draft versions when guidance or legislation changes.

## Out-Of-The-Box Starter Suite

- The maintained-primary starter catalogue currently covers all 20 expected policies in `apps/platform/src/lib/compliance/policies/policy-catalogue.ts`.
- Every starter pack must include official-source references, local adaptation questions, operating controls, SOP prompts and a clean Schoolgle HTML draft.
- Generated drafts are advisory and review-ready, not automatically approved, legally certified or silently written back to Drive.
- Existing school files are used as source evidence and matching context. A future enhancement pass should incorporate extracted school wording into redline-style improvements once source-text ingestion is connected to drafting.

## Versioning

- `v0 source` means the school has a connected original file, but Schoolgle is not yet the master managed version.
- `v1.0` means the first approved Schoolgle-managed policy.
- Minor wording or local detail updates use `v1.1`, `v1.2`, etc.
- Material legal, statutory, governance or policy approach changes use `v2.0`, `v3.0`, etc.
- Draft versions are not current until approved.

## AI Production Rule

Live scoring, drafting, source-backed explanations and change monitoring must run through Schoolgle's OpenRouter model stack. Codex/Claude can prototype product behaviour, but production must use explicit model registry entries, prompt/rule packs, evaluation tests and fallback behaviour that refuses to invent legislation, dates, sources or compliance findings.

## User Promise

The school should be able to click a policy row, see a clean HTML policy, understand what changed, approve it, publish it and keep an audit record without hunting through old Word documents.
