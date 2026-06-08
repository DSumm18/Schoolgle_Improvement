# Class Builder Operational Status — 2026-05-21

## Current Position

Class Builder is running to plan for Rawdon St Peter's C of E Primary School.

The live pupil survey links are active, pupils are submitting responses, and the database is correctly capturing both:

- the pupil who submitted the response
- each friendship and work-well-with choice made by that pupil

## Live Rawdon Survey Sessions

- Reception + Year 1: `FC37C6DA`
- Year 2 + Year 3: `FB933779`
- Year 4 + Year 5: `EC37943D`

All three sessions are open and scoped to the correct pupil cohorts.

## Database Check

Checked on 2026-05-21:

- `class_builder_responses` stores the submitting pupil via `pupil_id`.
- `class_builder_choices` stores the chooser via `chooser_pupil_id`.
- `chooser_pupil_id` matches the linked response `pupil_id`.
- No chooser/response mismatches were found.
- No submitted responses were missing choice rows at the point checked.

Latest observed counts at the time of checking:

- Reception + Year 1: 8 responses, 48 choices
- Year 2 + Year 3: 15 responses, 89 choices
- Year 4 + Year 5: 7 responses, 42 choices
- Total: 30 responses, 179 choices

## Operational Note

For this first live use, the recommended approach is teacher-led:

1. Staff open the correct cohort survey link.
2. Pupils complete the survey one after another on the same device.
3. Pupils select their name manually from the first-name-sorted list.
4. QR codes remain available for future pupil-access workflows, but are parked for this urgent survey exercise to reduce friction.

## Product Status

The pupil-facing survey has been polished and deployed:

- Rawdon branding and logo are shown.
- The manual name-selection flow is primary.
- QR scanning remains available as an optional backup.
- Pupils receive visual acknowledgement when choices are made.
- The success screen returns to the start ready for the next pupil.

Once Rawdon confirm all pupil responses are complete, the next operational step is to generate draft class groupings and review the results with Lynette and teaching staff.
