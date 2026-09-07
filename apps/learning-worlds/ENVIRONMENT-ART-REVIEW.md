# Environment art review — 6 September 2026

This pass addresses the impression that the monuments were separate objects on an empty sand plane. It gives the temple a defined paved court, a continuous lapis-and-gold approach, a geometric sun mosaic and a painted ceiling. The village gains striped cloth awnings and roof reeds; the scribe has woven textiles. Fine sand texture and soft-edged paths connect the places without adding navigation obstacles.

The new patterns are original decorations for the fictional story map. They are not a reconstruction, a translated inscription or additional historical teaching evidence.

## Evidence

- `npm run build` passed. The existing JavaScript chunk-size advisory remains.
- `node tests/atmosphere.mjs`: six checks passed, including persistent daylight choice, tablet layout, reduced-motion stability and moving door decoration. No browser/shader errors.
- `node tests/navigation.mjs`: all seven check groups passed, including 49 ordered mission pairs and 70 difficult starts, real animation-loop travel, manual interruption and tight-gap camera behaviour.
- `node tests/visual-environment.mjs`: four real-renderer views, exact reduced-motion image stability and low-quality daylight passed with no browser/shader errors. Tests use an isolated browser context and do not alter a pupil's saved game.

The screenshots were inspected. The temple now has a visible approach rather than a blank foreground; the village reads as a group of inhabited places. Existing palms can still obscure the view from some camera angles, which this bounded art pass does not redesign.

## Review images

- `test-results/visual-environment/temple-court.png`
- `test-results/visual-environment/village.png`
- `test-results/visual-environment/scribe.png`
- `test-results/visual-environment/sphinx.png`
- `test-results/visual-environment/sphinx-before.png`
- `test-results/visual-environment/low-quality-day.png`

## Rendering limits

At the same isolated sphinx camera, the renderer reported 886 draw calls / 535,796 triangles before this pass and 924 / 541,418 after it (including shadow work). That is about 4.3% more draw calls and 1.0% more triangles. These are renderer counts, not device performance measurements. The complete scene remains draw-call-heavy; real school tablets still need performance testing and further batching/level-of-detail work before release. This pass does not establish that children learn more or that the game meets a commercial visual-quality bar.
