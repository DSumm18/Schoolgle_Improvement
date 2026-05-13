# Class Builder — Demo and Usage Guide

## Purpose

Class Builder helps a school collect pupil friendship and work-preference choices, then uses that information to support draft class groupings and seating plans for the next academic year.

The current product is deliberately focused on one job:

- create a Class Builder survey session for a year group or current class
- let pupils choose friends and pupils they work well with
- generate explainable draft classes
- review balance, trade-offs and inclusion factors
- adjust the seating plan manually before locking it

It is not yet a general-purpose survey builder. Wider surveys, lessons and assessments should sit in a future pupil QR launchpad model, described later in this guide.

## Current Demo Scenario

Use the Rawdon St Peter's demo data:

- School: Rawdon St Peter's
- Cohort: current Year 4
- Destination: draft Year 5 classes
- Demo session: Rawdon Year 4 Demo Class Builder
- Pupil survey link: `/class-builder/s/RSPY4DEMO`

The demo data already includes pupils, QR pupil-pass identities, submitted choices and draft generated classes.

## End-to-End Demo Script

### 1. Open Class Builder

Go to:

`/dashboard/toolbox/class-builder`

Explain:

> "This tool helps staff collect pupil preferences and use them as one evidence point when building next year's classes. It does not make the final decision for the school; it gives an explainable draft that staff can review and adjust."

### 2. Create a Session

In the left-hand create session panel:

1. Choose the survey scope.
2. Select the current year group.
3. Optionally choose a current class if the survey is class-specific.
4. Choose the number of draft classes, usually 2 or 3.
5. Create the session.

Recommended demo wording:

> "For Class Builder, the survey is cohort-aware. If we create a Year 4 survey, pupils only see the Year 4 pupil list. If we create a class survey, pupils only see that class."

### 3. Open the Pupil Survey

Use the staff dashboard buttons:

- Open pupil survey
- Copy pupil survey link

Explain:

> "In the current version, pupils can open the secure survey link. In the next product step, the same idea should connect to the pupil QR pass so pupils scan their own code and are taken to whatever the teacher has opened for that class at that time."

### 4. Pupil Completes Survey

The pupil survey asks the pupil to:

1. Select their own name.
2. Choose up to three friends.
3. Choose up to three pupils they work well with.
4. Submit.

Built-in safeguards:

- pupils cannot choose themselves
- duplicate choices are blocked
- pupils can only choose from the survey cohort
- no results are shown to pupils
- closed sessions cannot accept new responses

### 5. Staff Reviews Completion

Back on the staff dashboard, show:

- total pupils in scope
- submitted count
- waiting count
- target number of classes
- completion and choices table

Explain:

> "This is where staff can see who has submitted and reset an individual response if needed."

### 6. Generate Draft Groups

Click:

`Generate draft groups`

Explain:

> "The algorithm is deterministic and explainable. It prioritises mutual friendship links, treats work-well-with choices as positive but lower priority, balances class size, and checks gender, SEND/EHCP, EAL, pupil premium and current-class spread where those fields exist."

### 7. Review the Explanation

Show the draft groups and explanation cards:

- mutual friendships kept
- pupils with no selections
- pupils with high selection counts
- trade-offs
- class balance

Recommended wording:

> "This is decision support, not an AI black box. Staff can see why the draft has been produced and where professional judgement is still needed."

### 8. Review the Seating Planner

Scroll to the inclusive classroom seating planner.

Show:

- separate classroom canvas for each draft class
- whiteboard/front of room
- door and teacher-desk visual anchors
- draggable tables
- draggable pupil cards
- pupil need tags
- gender chips
- QR/pass icon
- table expand view

Explain:

> "The seating plan starts from the draft class groupings, but the teacher stays in control. They can move tables around to match their real classroom and then drag pupils between seats before locking the plan."

### 9. Expand a Table

Click a table or its expand control.

Show:

- full pupil names
- SEND/EHCP/EAL/PP tags
- friend choices
- work-well-with choices
- why the pupil was placed at that table

Explain:

> "The expanded view helps where pupils have similar names or where the teacher wants more detail before moving someone."

### 10. Open a Pupil Pass

Click a pupil card.

Show the pupil QR/pass panel.

Explain:

> "The pupil pass is the reusable identity layer. It can be printed as a card, sticker or register reference. Longer term, this QR code should let the pupil access the active lesson, survey or assessment opened by the teacher."

### 11. Lock the Seating Plan

Click:

`Lock seating plan`

Explain:

> "Locking saves both the pupil seating arrangement and the classroom table layout for this generated result. Staff can unlock and tweak again if they need to."

### 12. Export

Use:

`Export CSV`

Explain:

> "The export gives staff a simple copy of the survey choices and generated outputs so they can keep or share the evidence outside the app."

## What the School Needs Before Using It

The Class Builder app relies on the school foundation data being in place:

- pupils
- current classes
- year groups
- gender where available
- SEND/SEN status where available
- EHCP where available
- EAL and pupil premium where available
- pupil QR/pass details where available

This data is maintained in:

`/dashboard/settings/data-upload`

Recommended setup order:

1. Locations
2. Assets
3. Staff
4. Pupils
5. Classes

For a Class Builder-only demo, the critical data is pupils and classes. Locations, assets and staff support the wider platform foundation.

## Current Product Boundary

Class Builder currently has one survey type:

**Class Builder preference survey**

It is not yet a flexible form/survey designer.

That is the correct boundary for now because:

- Class Builder needs specific validation rules
- choices need to link directly into the grouping algorithm
- pupils should not see general survey results
- staff need explainable class-building outputs

## Future Product Direction: Pupil QR Launchpad

The bigger product idea should be treated as a separate layer:

**Pupil QR Launchpad**

Purpose:

> When a pupil scans their QR pass, Schoolgle checks what the teacher has currently opened for that class or pupil and sends them to the correct live activity.

Possible activity types:

- Class Builder survey
- general pupil survey
- lesson activity
- assessment
- personalised worksheet
- reading task
- inclusion-support task

The teacher controls what is live.

Example:

1. Teacher opens a Year 4 Class Builder survey.
2. Pupil scans their QR pass.
3. Schoolgle recognises the pupil.
4. Schoolgle checks the active activity for that class/year group.
5. Pupil sees only the survey or task currently open for them.

Later example:

1. Teacher opens a lesson activity.
2. Pupil scans QR code.
3. Schoolgle checks pupil profile and support needs.
4. Pupil sees the version of the task appropriate to them.

This creates the foundation for:

- pupil surveys
- lesson studio
- assessment delivery
- personalised learning tasks
- accessible resources
- scan-to-start workflows in class

## Suggested Future Apps

### Survey Builder

For general surveys not tied to class grouping.

Examples:

- pupil voice
- wellbeing survey
- subject feedback
- transition survey
- safeguarding check-in

### Lesson Studio

For teacher-created learning activities that can be opened to a class and accessed through pupil QR passes.

### Assessment Studio

For assessment tasks that can be assigned to a cohort, class, group or individual pupil, including accessible variants.

### Pupil QR Launchpad

The routing layer that decides what a scanned pupil QR code opens at that moment.

## Recommended Positioning for Rawdon Demo

Do say:

> "This is the Class Builder app. It already uses pupil identity and pupil preference data to produce explainable draft groupings and seating plans."

Do say:

> "The pupil QR pass is reusable. Today we are using it for identity and future access. The next step is a pupil launchpad where a scan opens whatever the teacher has made live."

Avoid saying:

> "This is a full survey platform."

Better phrasing:

> "This is the first app using the pupil QR identity model. Wider surveys and lessons would be the next product layer."

## Demo Checklist

Before showing the app:

- confirm the school is set to Rawdon St Peter's
- confirm Year 4 pupils exist
- confirm the demo Class Builder session exists
- confirm pupil responses are visible
- confirm generated draft groups are visible
- confirm seating planner loads
- confirm tables can be moved
- confirm pupils can be swapped
- confirm table expand works
- confirm pupil QR/pass panel opens
- confirm CSV export works

## Known Caveats

- The wider pupil QR launchpad is not built yet.
- Whole-school generic surveys are not Class Builder scope.
- The seating planner is an editable classroom canvas, not a full architectural floor-plan tool.
- The grouping algorithm supports professional judgement; it should not replace staff decisions.
- Imported pupil data must be accurate because the output depends on it.

## Short Demo Narrative

> "We start with the school foundation data: pupils and classes. Staff create a Class Builder session for a year group or class. Pupils complete a simple survey choosing friends and pupils they work well with. Staff can see who has submitted, generate draft classes, review the explanation, and then adjust the seating plan in a classroom view. The system keeps the process explainable: it shows what it kept together, who may be isolated, high-demand pupils and class balance. The teacher always makes the final decision."

