# Learning Worlds — Fresh Player Critique

7 September 2026. David asked whether the advances had been played, seen and critically reassessed.

## Verdict and scope

The implementation is a functioning, increasingly coherent illustrated learning prototype. The current experience still relies heavily on reading panels and answer selection beside a decorative world. Its biggest opportunity is giving the child a meaningful idea to test, with visible consequences and an explanation afterwards. More atmosphere alone will not resolve that structure.

This is a fresh **in-app browser audit of Plot's entry, costume, first discovery and letter**, at the user's actual 818 × 717 pane. Screenshots below were captured, saved and inspected during this run. Normal Plot was observed only; actions used the separate fictional Alex route, reaching 20 gems and the letter's source-judgement stage. The normal route was restored at zero gems afterwards. Fire findings below are explicitly a separate source review, not a new Fire playthrough. The previous 30 full-journey and 11 targeted checks are historical regression evidence in [Enhancement QA](ENHANCEMENT-QA.md), not new results from this audit.

## Captured steps

### 1. Opening — clear identity, too much before the first action

The palace, moonlight and explorer establish a recognisable style. The opening combines the premise, detective selection and control instructions; the Continue button sits near the bottom of this pane. The 3D scene remains distant while the child reads. Risk: the promised mystery begins with setup and explanation rather than a discovery. Whether children disengage must be observed.

![1. Plot opening](test-results/player-critique/01-plot-entry.png)

### 2. Costume — convincing choice, another setup step

The 3D mirror and visible outfit change are strong. Enter 1605 remains accessible in the modal footer. The second outfit needs scrolling at this size; the introduction and wardrobe both offer character selection. Prefer one concise explorer choice and a quick transformation embedded in entering the story. This is a proposed improvement, not a broken control.

![2. Costume choice](test-results/player-critique/02-costume.png)

### 3. First learning task — works, but recognition dominates

Two paragraphs supply the roles before three successive matching questions. All three correct selections completed the first discovery and awarded 20 gems. The role facts remain visible. This is guided recognition, not sufficient evidence of independent recall. Robert Catesby and Guy Fawkes also have very similar flat illustrations, unlike the more distinctive 3D explorer. Read-aloud is after the choices in the page order and below the visible area here, which may make access harder for a struggling reader.

![3. First task](test-results/player-critique/03-first-task.png)

### 4. Letter — tactile presentation is effective; investigation can deepen

The seal opened into a readable, folded parchment and the instruction identifies the next action precisely. The child selects a relevant line from the source, an appropriate comprehension action. The world remains a separate map beside the paper. A next iteration could use this evidence to make a concrete investigative decision, then ask the child to justify it. Do not represent a fictional decision as changing the historical outcome.

![4. Opened letter](test-results/player-critique/04-opened-letter.png)

### 5. Wrong answer — a real visibility defect found

Selecting “I care about your safety” added corrective text to the accessibility tree below the paper and vocabulary note. It was not visible in the current viewport. A child could mistake this for an unresponsive choice or repeat guesses without seeing the support. A live status region alone does not make feedback visible to a sighted user.

![5. Before: the hint is below the viewport](test-results/player-critique/05-wrong-answer.png)

### 6. Correction — fixed and rechecked in the live interface

The existing hint now moves directly after the chosen wrong line. That answer references it using `aria-describedby`; nearest, immediate scrolling reveals it without an animated camera move or forcing keyboard focus away. Repeated mistakes move the same hint, rather than accumulating messages. Selecting the correct line still advanced to the original unknown-author question and did not award the second discovery prematurely.

![6. After: the hint appears beside the selected answer](test-results/player-critique/06-visible-hint-fixed.png)

Only this bounded defect was changed in this audit (`src/plot.js`). The subsequent 27 unit tests and 58-module production build passed, with the existing shared-chunk advisory. The live fix was rechecked at the actual in-app pane; a fresh full-game or physical-device suite was not repeated for it.

## Independent source critique of Plot and Fire

A second agent inspected the current learning code without operating the browser. These are implementation observations, with engagement consequences still hypotheses:

- **Procedural agency:** inspect all clues, view both layouts and place three walls. Many actions fulfil a prescribed list rather than test a pupil's own idea. The cutaway workshop is clearer than the earlier slots, but three identical placement clicks are not three separate reasoning steps.
- **Visible answers:** Fire's lesson stays above most questions; Plot supplies the roles and source limits immediately before matching. Several distractors are plainly implausible. Completion therefore needs careful interpretation as supported practice.
- **Limited adaptation:** most support repeats a prompt or supplies the explanation. The representation seldom changes in response to a particular misconception. Do not describe this as an adaptive tutor that identifies or resolves a child's difficulty.

Sources: `src/plot.js` people/letter/search stages; `src/fire.js` lesson rendering, spread comparison, help and rebuilding handlers. These statements do not depend on an EEF endorsement or claim a measured learning effect.

## Priority for the next development pass

1. **Build one deeper Fire paper-street investigation.** Ask for a prediction, let the child position a gap in a simplified street, compare the outcome with an otherwise identical layout, and explain what changed. Then use an unfamiliar layout without the prior explanation. Keep wind and model limitations explicit; this is not an exact fire simulation.
2. **Make the opening and help easier to use.** Start with one short scene/action, present teaching in small narrated chunks with matching visible words, and place read-aloud beside the material before a child must read it. Keep control demonstrations and immediate corrective support close to the object being used.
3. **Connect characters and actions to the world.** Use purposeful close-up scenes and character responses so the setting participates in the activity. Preserve untimed click/tap/keyboard routes. Give meaningful discoveries a visible story consequence instead of relying only on a generic gem panel.

For the first priority, record the initial prediction, chosen change, observation, revision, help used and response to the unfamiliar layout. A teacher should be able to see how the pupil's idea developed. The pupil-facing success criterion is explaining what changed and why; the adult evidence must not infer mastery from completion.

These are recommendations, not implemented new activities. Test the strongest small example with children and teachers before repeating it across three worlds or adding another adventure.

## Evidence limits

The fresh screenshots establish layout, visible content and the observed feedback defect. The live actions establish this sampled progression. They do not establish enjoyment, reading suitability for every age, accessibility conformance, long-term retention or performance on a school tablet. No new historical claims, external research, real pupil data or public deployment were added. The game remains stylised; no photorealism or commercial-readiness claim follows from the passing tests.
