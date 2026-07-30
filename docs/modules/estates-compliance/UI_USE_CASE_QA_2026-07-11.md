# Estates Compliance Physical UI QA — 11 July 2026

## Test environment

- Signed-in local UAT application using Grove House Primary School.
- Real UI clicks were used for buttons, forms, selectors and navigation.
- Database persistence was checked after the workflows.
- Synthetic records are labelled `UAT use case` and are not customer compliance claims.

## Use cases exercised

| Use case | UI actions exercised | Result |
| --- | --- | --- |
| Load full compliance library | Open Compliance Checks; wait for all cards; inspect console | Pass: 137-check library loaded without runtime errors |
| Contractor paperwork chase | Open Monthly Temperature Monitoring; click `Record contractor chase` | Failed initially, fixed, retested and persisted with chase count 1 |
| Contractor paperwork received | Click `Paperwork received` on the awaiting-documentation record | Pass: status changed to completed and receipt metadata persisted |
| Compliant Legionella visit | Select `Awaiting Docs`; enter outlet, 18.4°C cold and 52.1°C hot; enter notes; save | Pass: readings stored as pass, next due rolled to 11 August 2026, history retained |
| Failed Legionella visit | Enter 22.3°C cold and 44.8°C hot; enter failure notes; save | Pass: server forced failed status and automatically created linked ticket EST-09011 |
| Open linked helpdesk ticket | Click generated ticket from the compliance history | Failed initially, fixed, retested and ticket detail rendered |
| Ticket internal note | Enter note; select `Internal note`; click `Send` | Pass: note persisted and appeared in the activity timeline |
| Assign ticket to person | Open assignee selector; choose Claude Dev | Pass: assignment persisted and activity event appeared |
| Assign check to team | Create UAT Estates & Compliance Team; choose person and team on gate check | Pass: both values submitted and completion persisted |
| Resolve failed ticket | Click `Mark Resolved`; enter resolution; click `Confirm Resolution` | Pass: resolved status, resolution text, resolver/time and audit event rendered |
| Daily routines tab | Click `Daily Routines` | Pass for navigation; empty UAT configuration currently displays all complete |
| Create custom daily check | Choose Daily Gate Lock template; edit name; move through all wizard steps; create | Failed twice, fixed template UUID error, then passed |
| Find custom check | Return to Security domain after creation | Failed initially, fixed missing organisation context, then displayed as third check |
| Open custom check | Click custom gate check card | Failed initially, fixed missing organisation context, then form rendered |
| Complete custom daily gate check | Assign person/team; add notes; save | Pass: history created and next due rolled to tomorrow |
| Photo controls | Click `Add Photos`, then `Upload Photo` | Pass to native chooser: camera/upload controls and 10-photo limit render. Storage upload/retrieval was separately verified; final native file selection remains a release-gate browser check |

## Defects found and fixed

1. Documentation chase/receipt omitted `organizationId`.
2. Helpdesk ticket detail, comments and updates omitted `organizationId`.
3. Team API depended on non-existent PostgREST foreign-key relationship hints.
4. Custom template cloning attempted to put a string template ID into a UUID column.
5. Domain list did not pass organisation context when fetching custom checks.
6. Custom check detail did not pass organisation context and remained on the loading screen.
7. Custom-check errors hid the actual server reason; the UI now displays it.

## Evidence observed

- Compliance history retained the earlier completed record and the latest readings.
- Failed values were rendered individually as `Fail` with the relevant threshold.
- Ticket EST-09011 remained linked from the check and included the failed-reading narrative.
- Internal note, individual assignment and resolution generated timeline activity.
- Custom gate completion showed a next-due date of 12 July 2026.
- Rawdon now has an idempotently provisioned `Estates & Compliance Team` for group assignment.

## Release gates

- Build and deploy the Estates-only release; the live site does not yet include these UI/API fixes.
- Repeat the same workflow on the preview deployment.
- Complete one actual synthetic image selection/upload/reload on preview and confirm the image renders from private storage.
- Smoke-test the Rawdon organisation after production promotion without changing real compliance records.
