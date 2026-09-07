# Immersion enhancement — independent QA

7 September 2026. Tested the running application in isolated Chrome contexts using the fictional Alex routes. No user browser session was opened or changed. The frozen public example records were preserved.

## Result

**30 full-journey checks and 11 targeted enhancement checks passed.** Both adventures remain playable from a fresh start through all five discoveries, earn 100 gems once, capture actual responses and corrections, and support later recall. No browser exceptions or failed requests were recorded in these runs. The lead agent separately reports **27 unit tests passing and a successful production build** (58 modules; existing approximately 630 kB chunk advisory).

| Run | Checks | Evidence |
|---|---:|---|
| Fresh Alex Great Fire journey | 15 | `test-results/enhancement/fire/report.json`, `alex-casebook.json` |
| Fresh Alex Gunpowder journey | 15 | `test-results/enhancement/plot/report.json`, `casebook.json` |
| New Plot parchment | 4 | `test-results/enhancement/details/plot-report.json` |
| Fire workshop and animated visitor | 6 | `test-results/enhancement/details/fire-report.json` |
| Fresh Fire welcome at 320 px | 1 | `test-results/enhancement/details/fire-welcome-report.json` |

The full journeys deliberately submitted wrong answers, then corrected them through the UI. They checked prerequisite gates, feedback, completion, replay, reload, return recall, downloadable Alex metadata and preservation of the normal save alongside demo play. Fire also exercised malformed saved help, blocked storage and unavailable WebGL. The new visual changes do not create additional assessed objectives or bonus gems.

## Direct checks of the enhancements

- **Fire workshop:** three panels remain accounted for across the supply and model. Placement, Undo and changing material update both the visible model and current in-memory draft (the associated observations are saved). Two walls cannot pass the check; all three brick/stone walls can. Normal mode drops each new wall into place; reduced motion places it immediately. The same controls were tapped successfully at 768 and 320 px without horizontal page overflow.
- **Fire visitor:** rapid Leo/Maya changes finished with the actual rendered Maya model, not merely the setting. Changing skin colour changed rendered canvas pixels while motion was stopped. Arrival samples show Walk changing to Idle and a gradual turn; the earlier abrupt arrival rotation was fixed by the visual agent. Reduced motion produced identical canvas images over time and deliberate chapter changes placed the visitor at the correct station. Selected character, skin, preferences and 100 earned gems survived reload.
- **Fire welcome:** a fresh 320 px visitor can open “Choose my explorer”, select Maya and a skin colour, then begin chapter one with zero gems and no fabricated completions.
- **Plot letter:** Enter opens the sealed packet; the animated decorative folds clear the three evidence controls. Wrong evidence still receives correction. Space selects the evidence line and reaches the original source judgement. At 320 px with larger text, touch controls remain usable and reduced motion reveals the letter instantly. Preferences and 100 earned gems survived reload.

An initial test assumed the parchment animation would have finished after exactly 950 ms. This was brittle under headless rendering. The test now waits for its actual completed CSS state, bounded to five seconds; the application did not require a change.

## Visual judgement and limits

The rebuilt workshop is a recognisable open-front room with three numbered walls, windows, a floor and clear supply/model counts. It communicates assembling a model more effectively than empty answer slots. The parchment has a convincing folded-paper presentation; its three evidence choices remain legible and its caption explicitly identifies the text as a modern adaptation. These are useful, tangible improvements to the interaction.

The Fire explorer is visible in the world and uses the same friendly character style as the other adventures. This remains a stylised school prototype, not photorealistic historical reconstruction. Fire moves the visitor a short distance into each selected station; it does not provide free walking around London. Plot's letter changes presentation, not the depth of the history assessment. The completed model represents a building rule rather than a realistic construction simulation.

Screenshots were opened and inspected, including `details/fire-workshop-complete.png`, `fire-workshop320.png`, `fire-visitor768.png`, `plot-opened.png`, `plot-letter320.png` and `fire-fresh320.png`. The 320 px workshop element capture includes the sticky header over the upper edge; the actual model, counts and task controls were reached by scrolling and tapping. The narrow Plot sheet also requires ordinary vertical scrolling to read all three lines.

The lead agent fixed the observed overlap between Plot landmark labels and its caption. The four parchment checks passed again. Final normal and expanded 1024 px images (`details/plot-label-normal1024.png` and `plot-label-expanded1024.png`) were opened and inspected: labels disappear where they would obscure the normal caption and remain readable in the expanded scene. Escape restored the evidence controls with progress unchanged. Movement conclusions combine rendered-image comparisons, animation CSS state and sampled explorer telemetry (`details/fire-arrival.json`); they are not a frame-by-frame gait or anatomical animation audit. No real pupils, school devices or teacher panel were used in this pass, so child comprehension, classroom impact and low-end tablet performance still need a supervised pilot.

## Repeatable commands

```powershell
$env:FIRE_QA_DIR='test-results/enhancement/fire'
node tests/fire-qa.mjs
$env:FICTIONAL_QA_DIR='test-results/enhancement'
node tests/fictional-pupil-qa.mjs plot
node tests/immersion-enhancement-qa.mjs plot
node tests/immersion-enhancement-qa.mjs fire
node tests/fire-welcome-enhancement-qa.mjs
```

The full journeys ran after the task logic landed. Final targeted checks ran after the visitor turn fix, title/layout refinements and welcome chooser were complete. Historical QA reports retain their original results.
