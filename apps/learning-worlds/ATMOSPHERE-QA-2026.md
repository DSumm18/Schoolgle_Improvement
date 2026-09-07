# Sky and atmosphere — independent QA

7 September 2026. **All three games passed 12 targeted atmosphere scenarios.** A further 10 targeted Plot tablet checks passed after fixing a control overlap found during visual review. No full learning journey was repeated for these visual changes.

## Executed checks

`node tests/atmosphere-2026-qa.mjs nile`, `... plot`, `... fire` used isolated Playwright Chrome contexts loaded with the actual earned Alex test records. The user’s browser session and normal saves were not accessed.

| Game | Normal motion: visibly changed pixels across 900ms | Reduced motion | Earned gems preserved |
|---|---:|---|---:|
| Nile Quest | 4.50% | Pixel-identical PNGs | 225 |
| Gunpowder Plot | 0.26% | Pixel-identical PNGs | 100 |
| Great Fire | 1.11% | Pixel-identical PNGs | 100 |

The pixel comparison counts locations whose summed RGB change exceeds 15; figures describe the whole rendered canvas, not isolated cloud motion or an animation-quality score. Reduced-motion acceptance used exact PNG byte equality after settling. Normal and reduced modes were selected using the actual in-game settings.

All games also passed:

- Desktop 1440×900, tablet 1024×768 and portrait tablet 768×1024 layout checks, without horizontal page overflow.
- In-game settings and journal/expanded-scene controls remained usable.
- Exact completed discoveries, captured responses, recall records, bonuses and gem totals stayed unchanged while testing the visual controls.
- Reload preserved reduced-motion preference and all earned learning records.
- No browser exceptions, console errors or failed requests.

Reports: [Nile](test-results/atmosphere-2026/nile-report.json), [Plot](test-results/atmosphere-2026/plot-report.json), [Fire](test-results/atmosphere-2026/fire-report.json).

## Visual review and correction

Nile's warm evening and brighter daylight styles were inspected through the actual map, camera and lighting controls. High cloud wisps and distant birds add movement without changing task controls. The earned fixture begins beside a palm, so the default screenshots are partly obscured by nearby scenery; additional pyramid-area lighting views are retained. [Desktop](test-results/atmosphere-2026/nile-desktop.png) · [daylight](test-results/atmosphere-2026/nile-open-sky-day.png) · [evening](test-results/atmosphere-2026/nile-open-sky-evening.png).

Plot's textured moon, small stars and layered sky make the Westminster setting visibly richer. Normal movement remains gentle. During review, the companion canvas was found to intercept the final chapter button in the expanded 768px view. The parent moved the preview above the map. `node tests/plot-tablet-controls-qa.mjs` then verified **all five chapter buttons in both default and expanded views at 768, 818 and 1024px**, plus visible preview rotation by dragging at every size. Responses, completed chapters and 100 gems remained unchanged. [Corrected expanded tablet screenshot](test-results/atmosphere-2026/plot-expanded-768-final.png) · [control regression report](test-results/atmosphere-2026/plot-controls-report.json).

Fire was additionally inspected in chapter 1 night, chapter 2 smoke/haze and chapter 4 rebuilding. The palettes and rebuilding state remain distinguishable; clouds blend into the distant scene without the previous abrupt edge. The moon was repositioned after an initial label overlap; the [final night screenshot](test-results/atmosphere-2026/fire-stage1-final.png) shows it clear of the cathedral label. Smoke is intentionally subtle against the clouds, rather than a dramatic plume. [Evidence-stage haze](test-results/atmosphere-2026/fire-stage2.png) · [rebuilding](test-results/atmosphere-2026/fire-stage4.png).

## Limits

These are browser regression and visual acceptance checks of the prototype. They do not measure frame-rate performance on physical school tablets or establish pupil engagement or learning gains. Pixel changes prove visible rendering changes but do not attribute every changed pixel to a particular atmospheric object. The skies are artistic reconstructions, not historical weather or lunar-phase evidence. Existing tested learning exports remain intact; no fictional pupil outcomes were fabricated for this review.
