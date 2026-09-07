# Full Fire experience review

7 September 2026 · current local build · content version `1666.1`

**Verdict:** the complete journey works and offers a coherent, approachable history investigation. It does **not yet meet David’s ambition for an exceptional, immersive primary-school role-playing game**. The strongest parts are the setting, clear controls, historical framing and inspectable evidence. The main limitation is the learning interaction: much of it remains reading, prescribed inspection and choosing the supplied explanation.

This verdict combines a fresh automated full journey, screenshot review and inspection of every task in `src/fire.js`. It is not a child playtest, a new learning-impact study or proof that pupils will find it boring. The shortcomings below distinguish observed design from the experience we still need to test with children.

## What was completed and checked

Ran the unchanged `tests/fire-qa.mjs` with `FIRE_QA_DIR=test-results/full-experience/fire`. The isolated Alex browser context earned all five discoveries through the real UI; completion was not seeded. All **15 checks passed**, with no recorded browser exceptions or failed requests. See [machine-readable results](test-results/full-experience/fire/report.json).

The run deliberately tried wrong answers, incomplete/cancelled final recall, correction, separate return recall, read-aloud, keyboard and touch controls, reload, replay, smaller layouts, malformed saves, blocked storage and unavailable WebGL. Final recall required all three responses and explicit collection before reaching 100 gems. Return practice added no gems.

The [downloaded Alex casebook](test-results/full-experience/fire/alex-casebook.json) matched the captured state: **53 actual events**, comprising 25 unassessed observations, 18 task responses and 10 recall responses. Eleven were incorrect attempts. Alex was explicitly fictional, and the normal-save sentinel in that isolated context remained unchanged. These counts reflect the deliberate QA path, not a typical pupil session or attainment score.

Additional task screenshots came from revisiting the **UI-earned** QA save. In particular, the ending screenshot is a replay and correctly says “A story revisited”. No app source, public example or user browser save was edited.

## Beginning to ending

| Part | What the child actually does | Assessment of the experience |
|---|---|---|
| Entry | Chooses an explorer, reads/listens to the invitation and begins a fixed five-stop journey | Attractive period setting and a clear calm purpose. It promises investigation; the later mechanics offer limited control over it. [Entry](test-results/full-experience/fire/entry-desktop.png) |
| 1. City of timber | Finds the named bakery on a simplified map, then selects the date | Easy first action and place/date context. Both answers are already in the story paragraph; it is guided retrieval. |
| 2. Spread | Taps three conditions, views both preset street layouts, selects the causal explanation | Conceptually relevant, but the child cannot predict, place a gap or test a self-chosen comparison. The explanation precedes the activity. [Street comparison](test-results/full-experience/fire/review-street.png) |
| 3. Evidence | Opens a diary summary and glass description, selects supported claims | Strong distinction between kinds of evidence and their limits. The objects are mostly icons leading to text; there is little close observation or construction of an evidence-backed claim. [Witness desk](test-results/full-experience/fire/review-source.png) |
| 4. People moving | Sequences three event cards, then selects why boats and carts mattered | Undo makes revision straightforward. The child orders a supplied narrative rather than investigating an unfolding human story. [Timeline](test-results/full-experience/fire/review-timeline.png) |
| 5. Rebuilding | Chooses wall material, places three panels, checks the rule and selects its purpose | The cutaway model gives the clearest visible action/result. Its main decision is still the already-taught binary material rule; three placements do not add three meaningful decisions. [Workshop](test-results/full-experience/fire/review-rebuild.png) |
| Finish | Completes three story-hidden recall questions and collects the final discovery | Completion is correctly earned, but the payoff is the same generic discovery card and a link to the adult-style casebook. It does not assemble a child-authored account of the journey. [Replay ending](test-results/full-experience/fire/review-ending.png) |
| Return | Repeats the same three recall questions with elapsed context recorded | Better than counting completion alone, but identical questions with conspicuous distractors cannot establish transfer to a fresh problem. [Small-screen recall](test-results/full-experience/fire/recall320.png) |

## Three highest-impact gaps

1. **The child controls progression more than investigation.** Observed: locations unlock in order, all listed clues must be tapped, both layouts must be viewed and wall placement is a repeated button. The 3D scene changes with chapters, yet most learning decisions occur in a separate panel. Hypothesis to test: children expecting to explore and affect the world may experience a decorated lesson sequence. More scenery alone would not resolve this.

2. **Success gives weak evidence of an independently understood explanation.** Observed: teaching text stays visible during most activities; several distractors are plainly implausible; corrective feedback supplies the explanation; final and return recall use the same question array. The records honestly preserve support and mistakes, which is a strength. Hypothesis to test: a pupil may progress using recognition or elimination while being unable to explain the cause on a new example. Support also mostly asks the child to read another explanation rather than adapting the model to their particular error.

3. **The ending has little personal payoff.** Observed: the final action awards the same discovery treatment and opens the teacher casebook, rather than showing a pupil-built story, annotated evidence display or visible result of their decisions. The game records what the child did but does not turn it into an appealing keepsake for the child. Hypothesis to test: this may weaken pride, memory of the whole story and a reason to return. An adult reporting view cannot substitute for the child’s ending.

## Keep, then improve one complete slice

Keep the calm controls, selectable explorer, illustrated 1666 setting, distinctions between contemporary evidence and reconstruction, source uncertainty, reversible actions and honest practice records. Larger text and 320px layouts passed the tested checks; [the mobile screenshot](test-results/full-experience/fire/mobile320.png) also shows that much scrolling separates the setting from the task. Physical-device use and reading suitability still need pupil observation.

Prioritise **one paper-street investigation**: ask a prediction before the explanation, let the child place a gap in an otherwise identical model, observe a calm illustrative spread sequence, compare it with the baseline and revise an explanation. Keep the model’s limits explicit. Follow with one unfamiliar layout. Capture prediction, placement, observed result, revision and support; turn that small investigation into a child-readable casebook page.

Test that slice with primary pupils and a teacher before expanding it: can the child explain what changed and why on the unfamiliar layout, and do they choose to investigate another example? Those observations would address the learning-game ambition more directly than another visual-effects pass. No implementation was made during this review.
