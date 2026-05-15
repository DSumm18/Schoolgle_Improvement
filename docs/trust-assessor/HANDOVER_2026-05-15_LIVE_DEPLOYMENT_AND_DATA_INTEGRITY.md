# Trust Assessor handover — live deployment and data integrity

Last updated: 15 May 2026  
Status: Trust Assessor changes are live on production.

## What was deployed

- Production deployment completed to `https://www.schoolgle.co.uk` and `https://schoolgle.co.uk`.
- Git commit deployed: `c84c0cf5 Prepare trust assessor demo deployment`.
- Vercel production deployment: `dpl_Gxjp8WSHDZ1wfocFg1MqL2aERNxG`.
- The PAYMAT / Pennine Academies Yorkshire Trust Assessor view is live and demo-ready enough for the immediate meeting, with the caveat that the next pass should focus on data confidence and explanation rather than adding new panels.

## Access-control change

Alex Summerscales must only see PAYMAT/Pennine Academies Yorkshire and its schools.

The following accounts were checked and aligned:

- `a.summerscales@ghps.paymat.org`
- `alexandresummerscales@gmail.com`

Both accounts were set to:

- PAYMAT — Pennine Academies Yorkshire
- Clayton Village Primary School
- Crossley Hall Primary School
- Farnham Primary School
- Grove House Primary School
- Hollingwood Primary School
- Laycock Primary School
- Lidget Green Primary School

Stale non-PAYMAT memberships were removed from the Alex accounts. David/admin accounts still have broader access for development and demos.

## Critical data-integrity correction

Do not cap, suppress, sample, or otherwise limit pupil records or evidence records in a way that changes headline counts, calculations, charts, or analysis.

The user’s concern is valid: **the data is the data**. If a school has 473 pupils, 420 pupils with one evidence source, 409 pupils in a validated profile layer, or 374 pupils in a school-submitted capture, the product must explain why those counts differ. It must not quietly make them line up by filtering or limiting rows.

### Why limits appeared during development

Some earlier prototype logic used display-oriented caps/limits to keep the UI readable and fast while building the demo. That is acceptable only for UI pagination or virtualised rendering, not for product totals or analysis. A cap intended to stop a browser table becoming unwieldy can accidentally make the product look like it is hiding data or making figures up.

### Rule from this point forward

- Calculations must use the full validated source dataset.
- Counts must be labelled by source and scope.
- UI may paginate, virtualise, or collapse long lists, but it must say something like “showing 50 of 473 pupils” and keep totals based on all 473.
- Never drop EYFS, Y1-Y6, pupil journeys, or historic CTF records unless the user has explicitly selected a filter.
- Never use a display limit as an analytical limit.
- If source counts differ, show the difference as a data lineage issue, not as a problem to hide.

## Source-count language to use

Different numbers can all be correct if they refer to different layers:

- **DfE census roll** — published external roll for a census year.
- **School-submitted capture pupils** — sum of cohort sizes in the selected trust spreadsheet or locked Schoolgle capture.
- **Pupil profile records** — current pseudonymised pupil register/profile rows available in Schoolgle.
- **Core evidence pupils** — pupils with usable assessment evidence in the selected pupil-level source.
- **Evidence points** — assessment events or historic records, not pupils.

Do not present these as interchangeable.

## Trust Assessor product stance

Trust Assessor should be a factual data confidence product:

1. Show the published DfE rear-view layer.
2. Show the current school/trust submitted assessment layer.
3. Show the per-pupil MIS/CTF layer where available.
4. Explain differences between layers.
5. Convert validated concerns into Ofsted Readiness evidence/actions only when the underlying source supports the claim.

The app should challenge data and prompt questions, not invent judgements. It should say:

> “This source shows…”

Not:

> “The school is definitely…”

## PAYMAT / Grove House specific note

Grove House has the richer pupil layer, including pseudonymised pupil records and evidence events. That makes it the best demo school for:

- pupil journey over time;
- FSM/SEND/EAL disaggregation where flags exist;
- “what explains the headline?” analysis;
- bridge into Ofsted Readiness.

However, Grove House must still be presented safely:

- pupil aliases only;
- no raw names or MIS identifiers;
- no pretending a demo-safe layer is the live named register;
- no overclaiming if a field is absent from the source.

## PAYMAT / Hollingwood specific note

Hollingwood has school-level trust spreadsheet/capture data and DfE census context. It does not currently have the same per-pupil layer as Grove House.

Therefore:

- DfE EAL is context only.
- Do not claim Hollingwood EAL attainment gaps without pupil-level EAL assessment data or an EAL/non-EAL split in the submitted assessment capture.
- FSM6/non-FSM6 gaps can be shown because the PAYMAT spreadsheet contains those sections.

## Ofsted Readiness bridge

Trust Assessor should feed Ofsted Readiness only with source-labelled findings:

- attainment concern;
- subgroup gap;
- data quality warning;
- evidence question;
- suggested action;
- source and date.

Ofsted Readiness should then own:

- evidence collection;
- action assignment;
- task progress;
- leadership narrative;
- reassessment and audit trail.

Do not use Trust Assessor as advertising for Ofsted Readiness unless the bridge is factual and the target workflow works.

## Next-chat starting prompt

Use this in a fresh chat:

> Continue Schoolgle Trust Assessor / Ofsted Readiness work. First read `AGENTS.md`, `CLAUDE.md`, `docs/TRUST_ASSESSOR_DATA_DICTIONARY.md`, `docs/TRUST_ASSESSOR_KNOWLEDGE_BASE.md`, and `docs/trust-assessor/HANDOVER_2026-05-15_LIVE_DEPLOYMENT_AND_DATA_INTEGRITY.md`. The live deployment is working. Do not add demo-only UI. Focus on data confidence: no artificial caps, no hidden filters, no hard-coded school-specific values, and every metric must show source, date, scope, and calculation. If counts differ, explain the source/scope difference rather than forcing them to match. Then continue with Ofsted Readiness integration using source-labelled Trust Assessor findings.
