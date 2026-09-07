# Period Wardrobe And Palace — Independent QA

Date: 7 September 2026. Reviewer: independent QA agent.

**Result: seven wardrobe checks passed, three final targeted checks passed, and the existing 20-check Plot journey passed with its entry helper updated for the wardrobe step.** No uncaught browser exceptions or failed HTTP requests occurred in the wardrobe run. Tests used isolated Chrome contexts; the user's browser was not reset.

## Verified Behaviour

- Fresh start opens the modern-clothes dressing mirror. Opening it produces no learning evidence, chapter completion or gems. Choosing an outfit enables entry; reading clothing facts is optional.
- Leo and Maya can each wear either outfit. The actual 3D canvas changes between the doublet/breeches and bodice/petticoat silhouettes. All four combinations were captured and inspected.
- Clothing selections and fact inspection are neutral observations with `correct: null`, not attainment judgements. The factual panel explicitly labels the costumes as simplified designs rather than exact surviving children's clothes.
- Outfit, explorer and skin tone survive reload. The dressed 3D explorer remains visible during investigation. Nile's stored progress remains unchanged.
- Reduced-motion mode produces a still preview; keyboard arrow rotation still works. Normal-motion changing completes. Closing the mirror removes its canvas and restores one companion preview.
- A genuine legacy five-chapter, 100-gem checkpoint retained every completion and prior attempt. Wardrobe choices did not award more gems or require the history tasks to be repeated.
- Touch and keyboard Space select outfits at 1024px and 320px; the wardrobe dialog has no horizontal overflow. A WebGL-unavailable test retained outfit selection and entry into the first history task via the stated fallback.
- With a partially answered people task, Look around expanded the palace view. Dragging the view, pressing Escape and using the return button left the draft, evidence, chapter and gems unchanged.
- After the companion pointer-events fix, dragging the compact explorer visibly changed its 3D viewing angle without changing learning state. Before/after canvas images differed as expected.
- The final grown-up casebook explicitly distinguishes St Stephen's Chapel/Commons from the plot's House of Lords target, calls clothing exploration unassessed, and exposes the National Trust and Met reference links. This checks the displayed explanation and link presence, not an independent museum-source audit.
- The five-chapter journey still enforces all required learning steps, retains incorrect responses/support, preserves separate game saves and prevents duplicate rewards.

## Visual Review

The revised architecture reads more clearly as a large historical palace complex: Westminster Hall has a long steep roof and Gothic frontage, and St Stephen's Chapel is separately labelled. The expanded view makes the architectural work much easier to see than the former generic castle behind small houses.

Both outfits visibly replace the modern explorer silhouette. Collar, fitted upper garment, breeches or long skirt, stockings and cloak are legible in the preview. The sticky wardrobe footer keeps the next action visible in the inspected tablet screenshot. The companion remains visibly costumed in the palace view.

These remain stylised game models, not photorealistic people or a certified architectural reconstruction. A minor optional art refinement: the large brown hair loops around the linen coif can resemble beads at small sizes. Nothing in this QA establishes that pupils have understood the clothing facts simply because they changed outfits.

## Evidence And Reproduction

- `node tests/plot-wardrobe-qa.mjs` — seven wardrobe checks.
- `$env:PLOT_LOOK_QA_ONLY='1'; node tests/plot-wardrobe-qa.mjs` — targeted palace-view preservation check.
- `node tests/plot-qa.mjs` — existing full journey, using real wardrobe selection when required.
- `test-results/plot-wardrobe/report.json` and `look-report.json`.
- Four outfit PNGs named `explorer-doublet.png`, `explorer-petticoat.png`, `explorer-girl-doublet.png`, `explorer-girl-petticoat.png`.
- `tablet-wardrobe.png`, `mobile320.png`, `palace-look-around.png`.

Physical devices, screen-reader use, pupil engagement and learning transfer remain human evaluation tasks. Broad historical accuracy should be checked against the project's cited reference material; this report verifies interaction, preservation and the visible implementation.
