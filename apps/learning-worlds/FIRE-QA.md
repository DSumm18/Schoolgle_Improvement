# Great Fire — independent QA, 7 September 2026

**15 browser scenarios passed in a genuine full Alex demonstration journey.** No app source was changed by this tester. Playwright used new isolated Chrome contexts; the user's browser and saves were not accessed.

Run: `node tests/fire-qa.mjs`

## Completed journey

1. Wrong cathedral location and 1605 date were rejected before Pudding Lane and 2 September 1666 earned the first discovery.
2. All three spread clues and both paper-street layouts were required before the causal explanation.
3. Both evidence envelopes were opened. Claims about everyone's thoughts or the starter's identity were rejected; diary actions and heat-damage inferences were accepted.
4. Incorrect chronology was corrected with Undo. Correct chronology still required an explanation of boats and carts.
5. Three timber walls failed the rebuilding rule. Selecting brick reset the model; three new placements and a reason were required. Closing final recall at question one or three awarded nothing. Only all three recall answers and the final collection completed the adventure at **100 gems**.

Separate return recall preserved its wrong first answer, correction, optional reading support and elapsed-time context. It awarded no gems. Reload preserved the exact captured attempts, replay kept 100 gems, and Alex's normal-game key remained byte-for-byte unchanged.

The export contains **53 actions: 25 neutral observations, 18 other submitted responses and 10 recall submissions**, including interrupted checks and corrections. There are 11 incorrect submissions. Counts describe this scripted run, not a child's attainment or a percentage score.

## Evidence and resilience

- [Final Alex casebook JSON](test-results/fire/alex-casebook.json): exact questions, responses, correctness, timestamps, content version and support; explicit fictional Alex identity.
- [Machine-readable test report](test-results/fire/report.json): all 15 scenario results.
- [Desktop scene](test-results/fire/entry-desktop.png), [768px tablet](test-results/fire/tablet768.png), [320px recall](test-results/fire/recall320.png).
- [Earned isolated browser state](test-results/fire/alex-earned.json): only fictional test context, for reproducible review.

768px and 320px layouts had no horizontal page/dialog overflow; keyboard Enter, tablet taps, larger text and return controls worked. Malformed help and out-of-sequence save entries recovered; saved response strings could not inject HTML into the teacher view. Blocked local storage showed a warning while tasks remained usable. Unavailable WebGL showed a fallback while learning tasks remained usable. No browser exceptions or failed requests occurred.

## Historical and learning review

The central facts checked agree with [London Museum's Great Fire account](https://www.londonmuseum.org.uk/collections/london-stories/great-fire-of-london/): Farriner's bakery and uncertain precise ignition; September 1666; dry conditions, wind and close buildings; river escape and later rebuilding largely on old foundations. The [museum's surviving molten glass](https://www.londonmuseum.org.uk/collections/v/object-750120/great-fire-molten-glass-fragments/) supports the material-evidence activity. The game identifies the diary passage as a modern summary and the scene as an interpreted, compressed reconstruction.

Visual review: timber buildings, bridge houses and old St Paul's distinguish this from modern London. No modern dome or Big Ben was seen. The illustrated/model tasks are calm and legible. The initial 768px camera made the model unusually small; the final art adjustment was independently captured and visually inspected. The [final split view](test-results/fire/tablet768-final.png) now brings the bakery and foreground buildings closer. The [expanded Look around view](test-results/fire/tablet768-look-final.png) shows the wider city and landmarks. Some outer buildings are cropped in the split view, with the expanded view providing a practical overview. Neither view has horizontal page overflow; the earned 100 gems remained intact. Accepted for this prototype, with real-device/pupil evaluation still required.

This is history and supported English comprehension. Counting model walls is an activity control, not a maths assessment. Selected reasons do not capture an independent spoken explanation. The teacher view gives five curriculum connections and follow-up prompts. Same-session recall, including the immediate separate return check in this run, cannot demonstrate delayed retention. Real pupil engagement, assistive-technology access and independent later transfer still need supervised testing.

## Targeted recall visibility fix

`node tests/fire-recall-visibility-qa.mjs` passed three additional focused scenarios after the lesson-hiding fix. Both final and return recall set the underlying lesson **and its feedback** to `visibility:hidden`, while the recall question and its own corrective feedback remain visible. Escape restores the lesson. Reopening and completing each check works; revisited-practice context is captured and replay keeps 100 gems. Completion restores the appropriate lesson/casebook. No browser exceptions occurred. [Visibility report](test-results/fire/recall-visibility-report.json) · [visually inspected hidden-lesson screenshot](test-results/fire/final-recall-hidden.png).

The original Alex exports remain unchanged as historical captures of their actual earlier runs. The new visibility/support behaviour was tested in a separate cloned test context; no full journey was unnecessarily repeated.
