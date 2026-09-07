# The Midnight Letter — Independent QA

Date: 7 September 2026. Reviewer: independent QA agent, separate from the builder.

## Result

**20 full-journey checks passed**, plus **4 final targeted checks** for the latest illustrated layout, corrected Nile home navigation, blocked storage and unavailable WebGL. The existing **18-check Nile browser regression also passed** after its routing/readiness updates. No uncaught browser exceptions or failed HTTP requests occurred in the passing runs.

Tests used isolated Chrome contexts and synthetic play. The user's existing browser and progress were not reset. The Plot test started with a checkpoint genuinely earned by the prior independent Nile suite, then confirmed that playing Plot left its Nile local-storage value unchanged.

## What Was Tested

| Chapter | Required stages verified | Deliberate challenge |
|---|---|---|
| People | Match James I, Catesby and Fawkes to their distinct roles | Wrong role cards do not unlock the next chapter |
| Warning | Open the seal, select the relevant warning line, recognise uncertainty about authorship | Wrong evidence and unwarranted certainty cannot complete; reload restarts the unfinished activity but retains attempts |
| Search | Inspect three distinct clues, then explain why the discovery mattered | Repeated inspection cannot count twice; two clues are insufficient; a collective-blame answer is corrected |
| Story | Submit the correct chronological sequence, then explain the causal connection | Wrong order rejected; Undo permits editing; wrong causal explanation cannot complete |
| Remembrance | Distinguish a remembrance rhyme from eyewitness evidence, recall the warning and choose an accurate account | Each wrong response stays on its required stage |

All five chapters were completed through visible controls, earning 100 gems. Reload retained completion and evidence; replay did not add gems. A 36-action casebook retained the submitted choices, sequence, observations and support. Its downloaded JSON matched the actual recorded attempts.

The episode explicitly says it does **not assess maths**. Its history and reading activities sample selected ideas; this review does not certify full curriculum coverage, reading attainment or learning transfer. Its concluding recall question is part of the same session, not evidence of delayed retention.

## Issues Found And Resolved

- Read-aloud previously lacked an access/support record. It now creates a neutral observation and support context for subsequent responses.
- Undo, unfinished card placement, opening a source and inspecting clues were being scored like answers. They now have an observation kind and `correct: null`; teacher reporting distinguishes these from assessed responses.
- Saved attempt fields previously lacked robust projection. Malformed help, invalid dates/chapters and non-contiguous completion were tested after hardening. Arbitrary response text is escaped in the casebook; an HTML-shaped test value remained text and created no element or script effect.
- Scene signage originally disagreed with chapter names. The final screenshot shows People, Warning, Search, Story and Remember consistently.
- The Nile brand had an existing click handler that defeated its new world-library link. The final targeted check confirms it now reaches the selector.
- Dynamic imports exposed a race in the old Nile test: waiting for a missing loading element could finish before the module mounted. Readiness now waits for the Nile API before waiting for asset loading. Two later test attempts were interrupted by development hot reloads during concurrent implementation; the final unchanged-build run passed.

## Devices, Navigation And Failure Paths

- Desktop Chrome at 1440px; touch-enabled 320px with larger text; 1024px tablet layout.
- Keyboard Enter/Space and touch completed letter/search actions. No horizontal page or report-dialog overflow was found in those cases.
- Final desktop and tablet screenshots were visually inspected. The latest original portrait illustrations and the labelled 3D scene render. A screenshot immediately after viewport resizing caught the canvas between resize and repaint; allowing the renderer to settle produced the correct tablet image.
- Root selector opens either adventure. The legacy `?view=teachers` route still opens Nile.
- Browser Back restored an interactive rendered Plot world with a live WebGL context. **Actual BFCache restoration was not proven:** this Chrome automation context reported `pageshow.persisted=false`.
- Blocking storage writes showed an explicit save warning while role-matching remained usable.
- Disabling WebGL displayed the declared fallback while the same investigation task remained usable. This intentional path produced a handled renderer warning, not an uncaught page exception.

## Reproduction And Evidence

- `node tests/plot-qa.mjs` — full new-game journey, state isolation, input, evidence and corrupt-save checks.
- `$env:PLOT_QA_SMOKE_ONLY='1'; node tests/plot-qa.mjs` — final navigation/layout and storage/WebGL failure checks.
- `node tests/browser.mjs` — existing Nile journey at `?game=nile`.
- `test-results/plot/report.json`, `smoke-report.json`, `casebook.json`, `earned-plot.json`.
- `test-results/plot/final-people-desktop.png`, `final-tablet1024.png`, `mobile320-large.png`, `after-history-back.png`.
- `test-results/browser-report.json` — final passing Nile regression.

## Remaining Evaluation

Physical tablets, screen readers, real child engagement and independent learning transfer need pupil/teacher testing. The 3D view is a location map and the learning uses adjacent task controls; it is not a free-walking historical simulation. The game contains local prototype evidence, not authenticated school assessment records. Same-session corrections, action counts and gems must not be presented as mastery.
