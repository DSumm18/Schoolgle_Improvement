# The Midnight Letter: complete experience review

7 September 2026. Independent QA; current running build.

**Verdict: a functioning, attractive guided history investigation; it does not yet meet David’s ambition for an exceptional primary-school role-playing game.** The gap is mainly the experience children perform, not broken controls or missing completion gates. This is a reasonable prototype for a supervised pilot, with substantial gameplay development still needed before presenting it as a finished flagship adventure.

## What I actually tested

A fresh fictional Alex completed the entire adventure through real browser controls: opening, character/outfit, all five tasks, deliberate wrong answers and corrections, final reward, casebook export, reload and replay. **All 15 journey checks passed**, with no browser exceptions or failed requests. Normal saved progress remained byte-for-byte unchanged.

I then replayed that independently earned session to capture the full visual sequence, including the ending, and submitted three optional return questions with one deliberate error followed by correction. All four return responses, feedback support and elapsed-time context were saved; gems stayed at 100. No attempts or completions were injected. The replay screenshots deliberately show “Discovery revisited” and already-earned gems; they are not first-completion screenshots.

Evidence: `test-results/full-experience/plot/report.json`, fresh `casebook.json`, `experience-review.json`, `casebook-with-return-review.json`, and 16 numbered screenshots. I read every task implementation in `src/plot.js` and opened representative screenshots from the opening, people, search, assembled timeline, remembrance, ending and return check. This was automated control plus direct visual/source review, **not a pupil study or measurement of enjoyment, independent understanding or delayed retention**. No application source was changed.

## The actual learning journey

| Step | What the child does | Assessment value and limitation |
|---|---|---|
| People | Reads an explanation and matches three people to roles | Distinguishes James I, Catesby and Fawkes; the same explanation supplies the answers immediately above |
| Letter | Opens the folded letter, selects its warning line, judges uncertainty | Strongest connection between a historical object and English comprehension; the text is honestly labelled an adaptation |
| Search | Taps three illustrated clue cards, then selects an inference | Requires all clues and rejects collective blame; no spatial search, manipulation or investigative choice |
| Timeline | Places three dated event cards and selects a “because” explanation | Meaningful sequence and cause practice with Undo; dates and answer choices provide considerable support |
| Remembrance and ending | Classifies the rhyme, recalls the warning, selects an accurate caption | Connects commemoration to evidence; selected answers do not establish that a child can explain the story independently |

## Strengths worth keeping

The visual identity is coherent: old Westminster architecture, moonlit scene, period outfit choices and parchment support the historical setting. Instructions are explicit and the untimed buttons make the route approachable. History is more than isolated dates: the tasks distinguish roles, causes, evidence, uncertainty and remembrance. The script explicitly separates the small group from all Catholics, differentiates the Great Fire, and distinguishes the Lords from the Commons in the grown-up context. Actual mistakes, corrections and access support remain inspectable; the casebook clearly states that this episode does not assess maths or prove mastery.

## Three major shortcomings

1. **The world offers too little agency.** The child chooses a station and completes a panel. The dressed explorer remains a separate display; there is no playable walk through the palace, encounter, room investigation or visible consequence of using evidence. Even “shine your lantern” means tapping three already-labelled cards. Next: build one complete in-world investigation, with accessible tap-to-travel and equivalent buttons, where examining and connecting clues visibly changes the scene without changing historical events.

2. **The learning loop becomes repetitive and can reward recognition.** Much of play is read → select a supplied answer → retry with a direct hint. The people passage repeats for all three matches. Some wrong options are obviously unrelated. Next: vary the action and test transfer—for example, build an evidence caption from collected objects, then justify it against a new source. Keep recorded support distinct from an independent first attempt; do not infer comprehension merely from reaching the correct button.

3. **The ending and return invitation lack a memorable payoff.** Each chapter gives the same 20-gem reward pattern. The ending says the child created a display, but shows a text card rather than that display assembled from their work. Gems have no demonstrated use. The separate return questions live inside Grown-ups, and lead to another record dialog. Next: reveal a child-owned casebook exhibition in the scene, replay the evidence chain, and offer a clear child-facing return mission. Keep technical assessment caveats in the adult view and honest, simpler encouragement for children.

The next pass should improve one complete beginning-to-ending gameplay loop and then observe real pupils using it. More scenery alone will not resolve these three gaps.
