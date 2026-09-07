# Investigation and exhibition upgrade: independent QA

7 September 2026. **59 browser checks passed: 49 complete-journey checks plus 10 targeted checks.** The lead agent separately ran **33 passing unit tests** and a successful production build (62 modules; existing approximately 635.5 kB shared-chunk advisory).

## Evidence and scope

All journeys used isolated fictional Alex browser contexts and real UI actions. Independent QA used separate browser contexts. The lead agent also reviewed the live in-app preview using fictional Alex; normal saves were preserved. No answers or completions were injected, and frozen public examples were not overwritten. Outputs are under `test-results/investigation-upgrade/`.

| Run | Checks | Evidence |
|---|---:|---|
| Complete Nile, seven missions and return check | 19 | `nile/browser-report.json`, `nile/practice-record.json` |
| Complete Plot, five chapters | 15 | `plot/report.json`, `plot/casebook.json` |
| Complete Fire, five chapters including new investigation, final and return recall | 15 | `fire/report.json`, `fire/alex-casebook.json` |
| Fire interruption, animation, reduced motion, 320 px full investigation | 4 | `fire/lab-report.json` |
| Three exhibitions, saved evidence and child-facing return loops | 6 | `exhibition-report.json` |

Full journeys retained wrong answers and corrections, completion gates, export, reload and protection against duplicate rewards. Fire retained the existing source, chronology, rebuilding and recall tests; only the replaced street-comparison step and the changed ending destination were adapted. It also passed malformed storage, blocked storage and unavailable WebGL paths. No page errors or failed requests were recorded in the full journeys. The optional Nile Sphinx bonus was unchanged and was not repeated in this pass.

## What the new investigation proves

- “The same number” is saved as a neutral first prediction and does not prevent experimentation. The tested practice gap produced two reached houses against five in its control street.
- A wrong comparison explanation cannot advance. Correcting it still does not award the discovery: reflection, a changed-layout plan and a second explanation remain required.
- In the transfer layout, a gap behind the starting house leaves all four houses on the route reached. That outcome blocks the next explanation until the plan is changed. The helpful tested gap reaches two houses and leaves the last house outside the route.
- The export preserves the actual plans, three observed outcomes, wrong explanations, corrections and reflection. Model observations remain unassessed actions. Finishing requires an explicit final collection action.
- The route animates. Leaving mid-run prevents late records, task replacement and rewards. Switching motion settings cancels the active run safely. “Show result now” skips waiting, records that choice and preserves the correct outcome. Reduced motion gives the result immediately.
- At 320 px with larger text, touch and keyboard completed the entire new task without horizontal page overflow or duplicate gems. The final historical bridge was checked in the rendered UI: dry summer, strong wind and closely packed timber buildings are taught after the investigation and before later recall.

## Exhibition and visual review

All seven Nile objects and all five objects in each London adventure displayed saved responses. Fire's plan/explanation JSON is rendered as readable sentences; the raw export remains exact. Nile shows the recorded sharing equations. Plot shows the selected warning words and source label. Browsing objects changes no learning data. Each exhibition works at 320 px, accepts keyboard/touch selection, starts its return challenge and returns to the collection without awarding extra gems.

I opened and inspected the comparison, unsuccessful transfer, investigation summary and mobile summary images, plus the three `exhibition1024.png` images and Fire's `exhibition320.png`. The illustrated routes visibly differ according to the selected gap. The exhibition is a clearer reward because it brings together the pupil's actual choices, rather than only announcing a score.

An initial exhibition test compared the entire Nile snapshot, including changing FPS telemetry. It failed on FPS alone. The assertion now compares gems, completions, attempts, evidence and recall; the Nile rerun passed. The final report combines those two passing Nile checks with the four already-passing London checks. Reruns are not counted twice. The original false-positive output is retained as `exhibition-initial-fps-assertion.json` for traceability.

## Independent judgement

This is a substantive improvement in the Fire learning loop: predict, manipulate, observe, explain, reflect and apply to a different layout. The wrong plan produces a meaningful different outcome. All three endings now make saved work more visible and give children access to return practice.

It remains a simplified paper model within the reading panel, not a physical fire simulation or a free-roaming London investigation. The exhibit objects are illustrated symbols in a dialog, not a navigable museum. At narrow widths the comparisons and longer evidence entries require vertical scrolling. Most other tasks retain their existing answer-selection structure. These changes address specific weaknesses; they do not by themselves establish exceptional pupil engagement or learning impact. A supervised pupil pilot remains necessary to assess comprehension, enjoyment, transfer and performance on school devices.

Tests maintained: `tests/fire-qa.mjs`, `tests/fire-recall-visibility-qa.mjs`. New repeatable checks: `tests/fire-investigation-flow.mjs`, `tests/fire-investigation-qa.mjs`, `tests/discovery-exhibition-qa.mjs`. The final focused lab run included the settled historical summary and focus changes; full journeys were not needlessly repeated after those copy/layout refinements.
