# Completed Alex example viewer — independent QA

7 September 2026. `node tests/example-record-qa.mjs` passed **15 targeted checks**, five for each game. Tests used isolated Chrome storage, not the user's browser. No browser exceptions or failed requests occurred.

- All recorded actions rendered from the real tested exports. Nile showed its wrong farmland explanation, `[5,5,5]` model and incorrect typed `15 ÷ 3 = 6`. Plot displayed the full nested recall prompt and selected answer without `[object Object]`. Fire displayed the wrong timber material and recall context.
- Correction and recall filters matched the exact original fixture counts.
- Each download was byte-for-byte identical to its `public/examples/*-alex.json` fixture.
- All three normal-game storage keys remained byte-for-byte unchanged.
- All three 320px views fitted horizontally. The Nile correction cards were also visually inspected: question, selected answer, model, equation and support were readable.
- “Play as Alex yourself” opened the correct game's `demo=1` route. Its grown-up view linked back to that game's completed example.

Evidence: [machine-readable report](test-results/examples/report.json), [Nile correction cards](test-results/examples/nile-corrections.png), [Plot correction cards](test-results/examples/plot-corrections.png), [Fire correction cards](test-results/examples/fire-corrections.png). Downloads are retained beside them.

These are fixed examples of actual automated test interactions, explicitly labelled fictional. The viewer does not make them real pupil records or evidence of learning gains. No app source was changed by this tester.

The final Fire 768px split and expanded scene screenshots were also inspected after the camera refinement; the enlarged city is accepted for the prototype. See [FIRE-QA.md](FIRE-QA.md) for the images and limits. No full journey was repeated for this art-only adjustment.
