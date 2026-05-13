# Schoolgle Module Colour Source

Last checked: 29 April 2026

## Source Of Truth

Customer-facing module group names and colours come from:

`apps/platform/src/app/(dashboard)/layout.tsx` → `PLANET_GROUPS`

Individual product/app names still live in `apps/platform/src/lib/modules/registry.ts`, but marketing/navigation assets should use the customer-facing module groups unless the asset is specifically about a single product/app.

## Customer-Facing Module Group Colours

| Group ID | Customer-facing label | Hex | Contains |
| --- | --- | --- | --- |
| `mercury` | School Improvement | `#6b7280` | improvement |
| `venus` | Governance | `#f59e0b` | governance |
| `earth` | Business Operations | `#3b82f6` | finance, HR, estates, connectors |
| `mars` | Compliance & Safeguarding | `#9f1239` | compliance, safeguarding, risk |
| `jupiter` | Communications | `#f97316` | communications, calendar, surveys |
| `saturn` | Intelligence | `#a78bfa` | school intelligence, attendance, SEND, behaviour, canvas |
| `uranus` | Teaching & Learning | `#06b6d4` | teaching-learning |

## Working Rule

- Use these group colours when a design shows the main Schoolgle navigation/module families.
- Do not show Toolbox as a marketing module; treat it as a utility/tooling area unless a specific Toolbox asset is being designed.
- Use `apps/platform/src/lib/modules/registry.ts` only when a design names a specific product/app inside a group.
- Use the approved logo and seven-colour accent bar as decorative brand identity only.
- If Notion and the repo disagree on customer-facing group colours, treat `PLANET_GROUPS` as production truth and update Notion.
