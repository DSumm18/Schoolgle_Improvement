# Schoolgle School Improvement Assessor

Supporting document for Rochdale Council presentation — Tuesday 19 May 2026

## One-line proposition

Schoolgle gives Rochdale Council an out-of-the-box way to understand school performance, pupil progress and inspection readiness by combining public DfE data, school assessment data, pupil-level evidence and AI-supported school improvement workflows in one place.

## The problem this solves

Local authorities, trusts and schools often have the data, but it is spread across DfE downloads, MIS exports, CTF files, spreadsheets, assessment trackers, external tests, SEFs, policies and Ofsted evidence folders.

That creates five recurring problems:

1. Leaders spend too much time producing reports instead of acting on them.
2. Published data is rear-view and does not explain current school performance.
3. Schools submit headline assessment data without enough pupil-level evidence behind it.
4. Attainment gaps are hard to interpret because context is separated from outcomes.
5. Ofsted readiness work is often disconnected from the data signals that should drive it.

Schoolgle’s answer is not another spreadsheet. It is a connected assessment and improvement spine.

## Product story for Rochdale

The product can be presented as three connected layers:

```text
Assessment Creator / Pupil Evidence
        ↓
Trust Assessor / LA School Improvement Assessor
        ↓
Ofsted Readiness
```

For Rochdale Council, “Trust Assessor” can be positioned as the same engine running in local authority mode: one LA-level view across schools, with drill-down into each school, phase, cohort and evidence trail.

## The data layers

### 1. Public DfE baseline

Schoolgle can set up schools quickly from URNs and public data. This creates an immediate baseline before the school uploads anything.

This layer includes:

- school identity, phase, type, local authority and academy status;
- published KS2 outcomes where available;
- attendance and persistent absence;
- census context including FSM, SEND and EAL;
- LA and national comparator figures by year;
- public-data warnings and “look here first” triage signals.

This is the rear-view external picture. It is useful for challenge, but it should not be treated as current school performance.

### 2. CTF / MIS pupil-level layer

This is the powerful layer.

When a school uploads or connects pupil-level data, Schoolgle can analyse the actual cohort, not just a headline percentage.

This enables:

- pupil journey tracking from Reception to Year 6;
- progress and attainment by year group, class and subject;
- FSM, SEND, EHCP, EAL, gender and other group analysis where supplied;
- cohort-level evidence for why outcomes may look the way they do;
- “defend your numbers” analysis for Ofsted conversations;
- privacy-safe reporting using pseudonymised pupil identifiers.

This is where the product moves from “what happened?” to “which pupils, which groups, and why?”

### 3. School-submitted assessment capture

Schools or trusts can also upload termly assessment spreadsheets or enter current assessment snapshots directly.

This gives leaders the “where are we now?” layer:

- latest teacher assessment by year group and subject;
- current combined Reading, Writing and Maths;
- FSM6 and non-FSM comparison where supplied;
- SEND and EHCP context;
- current school self-view against the historic DfE baseline.

These values are useful, but they must be labelled as school-submitted until moderated or backed by pupil-level evidence.

### 4. Assessment Creator / mini assessments

The next layer is the differentiator.

Instead of relying only on external tests or manually produced trackers, Schoolgle can support schools to create small assessment tasks across the year.

The intended flow is:

1. The teacher selects the class, subject, curriculum area and focus.
2. Schoolgle creates a short assessment or task aligned to the school’s curriculum.
3. Pupils complete the task.
4. AI supports marking, moderation and misconception analysis.
5. The teacher approves, edits or rejects the AI suggestion.
6. The approved result becomes a source-labelled pupil assessment event.
7. Trust Assessor and Ofsted Readiness can use that evidence.

The key principle is:

> AI proposes. Teachers approve. Schoolgle stores the evidence trail.

This can reduce reliance on generic test packages because the school can create curriculum-aligned checks when they need them, while retaining teacher control and moderation.

### 5. Trust Assessor / LA Assessor

Trust Assessor becomes the council or trust-facing view of school improvement intelligence.

It brings together:

- the DfE public picture;
- the school’s current assessment capture;
- pupil-level CTF/MIS analysis where available;
- assessment creator evidence where available;
- data quality warnings;
- school-by-school heatmaps;
- phase or cohort comparisons;
- narrative prompts for school improvement conversations;
- questions to ask leaders before or during a school visit.

The important design point is that every value must be explicit, labelled and validated. Combined RWM+ means pupils meeting expected+ in Reading, Writing and Maths together, not an average of three percentages.

### 6. Ofsted Readiness

Ofsted Readiness is where insight becomes action.

Trust Assessor can identify a concern such as:

- weak combined RWM+;
- a widening FSM/SEND/EAL gap;
- high persistent absence;
- inconsistent teacher judgements;
- missing or weak evidence for impact;
- a data-quality warning.

Ofsted Readiness then turns that into:

- evidence checks;
- findings;
- tasks and actions;
- named owners;
- policy or document links;
- follow-up verification;
- an audit trail showing what changed and why.

This is the loop Rochdale should care about:

```text
Data signal → leader question → evidence check → action → owner → follow-up → verified improvement
```

## Why this is different

Schoolgle is strongest when it does not simply report numbers. It explains and operationalises them.

Key differentiators:

- **Out-of-the-box setup** — a council or trust can see a useful public-data picture from URNs alone.
- **Pupil-level depth** — CTF/MIS data unlocks real cohort and group analysis.
- **Teacher-approved AI** — AI supports assessment and moderation, but teachers remain accountable for final judgements.
- **Source-labelled evidence** — every metric should say whether it came from DfE, a school spreadsheet, a MIS/CTF file, or teacher-approved assessment evidence.
- **Inspection-ready trail** — data concerns can become Ofsted Readiness findings, tasks and evidence trails.
- **Curriculum-aligned assessment** — schools can generate small checks based on their own curriculum rather than relying only on generic external test packages.
- **Time saving** — leaders can run reports whenever they need them instead of building them manually before reviews or inspections.

## What Rochdale could see in a demo

### 1. Council / trust overview

Show all schools in one place with:

- public DfE heatmap;
- schools to look at first;
- KS2, attendance, PA, FSM, SEND and EAL context;
- LA and national comparator values;
- data quality warnings.

Talk track:

> “This gives Rochdale an immediate view of where public data suggests challenge or context before asking schools for any further data.”

### 2. School drill-down

Open a school and show:

- historic DfE picture;
- current school-submitted assessment capture;
- year-group and subject profile;
- cohort and gap analysis;
- questions for a school improvement conversation.

Talk track:

> “This separates the external historic view from the school’s current self-view, so challenge is fair and evidence-led.”

### 3. Pupil-level example

Use the Grove House-style pupil layer as the example of what becomes possible when CTF/MIS data is available.

Show:

- pseudonymised pupil records;
- group gaps;
- pupil journey;
- source-labelled assessment timeline;
- context flags such as FSM, SEND, EAL and EHCP where supplied.

Talk track:

> “This is the step-change. We are no longer guessing why a headline outcome happened; we can analyse the cohort that produced it.”

### 4. Assessment Creator

Show the mini-assessment journey:

- create assessment;
- generate blueprint;
- produce paper/task;
- upload or capture pupil work;
- review AI-supported marking;
- create evidence passport.

Talk track:

> “This lets schools generate their own evidence-backed assessment points during the year, rather than waiting for statutory outcomes or manually writing assessment narratives.”

### 5. Ofsted Readiness bridge

Show how a data concern links into Ofsted Readiness:

- the data signal is identified;
- evidence is checked;
- a finding is created;
- a task is assigned;
- follow-up evidence verifies whether the action worked.

Talk track:

> “The value is not just identifying the issue. The value is making sure the issue is owned, evidenced, followed up and ready for inspection.”

## What data Rochdale or schools would provide

Minimum setup:

- school list and URNs;
- school grouping, phase and responsible officer where available.

Recommended setup:

- termly assessment spreadsheet or common LA/trust template;
- CTF/MIS pupil-level assessment export;
- pupil characteristics such as FSM, SEND, EHCP, EAL and gender where available;
- class/year group information;
- assessment dates and academic year/term labels.

Enhanced setup:

- curriculum maps or schemes of work;
- school-created assessment tasks;
- policy and evidence folders;
- SEF, SDP and school improvement documents;
- attendance, behaviour and intervention exports where available.

## Data security and governance position

The product should be described carefully:

- original school documents remain in the school’s approved Drive, SharePoint or MIS export process;
- Schoolgle stores metadata, source labels, extracted checks, findings, tasks and audit trails;
- pupil-level analysis should use pseudonymised identifiers server-side;
- values must be labelled by source and year;
- school-submitted data should not be blended with DfE data without making that explicit;
- AI-generated assessment or narrative is advisory until teacher or leader approved.

## Current product position

### Already in place

- Trust Assessor / LA Assessor product view.
- DfE public-data baseline and comparator logic.
- School-level drill-down with overview, DfE review, cohort/gaps, pupil data and evidence sections.
- PAYMAT-style school-submitted assessment capture.
- Grove House-style pupil-level CTF/MIS demonstration layer.
- Assessment Intelligence / Assessment Creator user journey.
- Evidence Passport concept.
- Ofsted Readiness intelligence brief and action-loop direction.
- Source-labelled assessment event utilities.

### Needs product hardening before full rollout

- Rename any legacy school-specific routes so the pupil-level layer is fully generic.
- Ensure Assessment Creator persists final teacher-approved events into the canonical assessment spine end to end.
- Make the Trust Assessor → Ofsted Readiness handoff create or link findings/tasks consistently.
- Finish the data dictionary and customer import guide for LA/trust onboarding.
- Add final demo-safe data labelling so example pupil-level data is clearly marked as demonstration data.

## Suggested closing message for Rochdale

Schoolgle gives Rochdale a way to move from static reporting to live school improvement intelligence.

The council can start with public data for every school, then add school assessment data, then add pupil-level CTF/MIS evidence, and finally use Assessment Creator to generate fresh, teacher-approved evidence during the year.

That creates one joined-up system:

- what the public data says;
- what the school says now;
- what the pupil-level evidence shows;
- what leaders should ask next;
- what actions are needed;
- whether those actions improved outcomes;
- whether the school is inspection-ready.

That is the product: not just dashboards, but an evidence-led school improvement operating system.

