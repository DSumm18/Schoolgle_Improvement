# Movement and style consistency review

7 September 2026 — bounded independent review for the future-world foundation.

**The three games support a coherent, calm, stylised 3D direction. They do not yet share equivalent character gameplay.** Nile has a controllable explorer; Plot is a location-based investigation with a turnable costume companion; Fire currently offers an explorer portrait rather than an in-world controllable character. Keep these distinctions explicit when defining the shared foundation.

## Review evidence

This review reused the 22 passing atmosphere/tablet checks and their visually inspected desktop, narrow and expanded views. A new short Nile play used a fresh isolated Alex browser: start, walk, accelerate to run, turn right, release controls and settle. No learning questions or reward paths were replayed. Durable evidence includes [movement samples](test-results/movement-style/nile-samples.json), [walk frame](test-results/movement-style/walk-3.png), [run frame](test-results/movement-style/run.png), [turn frame](test-results/movement-style/turn.png) and [settled frame](test-results/movement-style/settled.png); these PNGs were opened and visually inspected. A short WebM recording is saved in `test-results/movement-style/video/`. The user's browser and pupil records were not accessed.

| Element | Independent judgement |
|---|---|
| Nile explorer | Idle, walk and run are recognisably different. Sampled walking approached 3.1 world units/second; running approached 6.4. Turning changed body direction smoothly. Post-release samples reached zero speed and stayed at exactly the same position. Feet and contact shadows looked grounded in the inspected walk/turn/idle frames; no sustained hover, sudden jump or continuing slide was seen. This is a toy-like gait, not motion-capture realism. |
| Nile birds, palms and boats | Distant birds glide with intermittent wing movement; heading follows the orbit. Slow foliage movement and modest boat bob/roll suit a quiet illustrated river. Keep silhouettes distant: these are economical shapes, not close-up animal rigs. Clouds provide slow background motion without taking over the task. |
| Plot boat and lanterns | A moored boat's small vertical bob and roll are plausible at this scale. Lantern changes are slow and shallow, not flashing. Moon and small stars establish the night setting. Narrow and expanded framing were reviewed; the earlier companion/map overlap was fixed and all chapter buttons plus costume dragging were retested. |
| Fire smoke and river | Smoke rises, expands, drifts and fades softly. The nine staggered puff cycles have zero opacity at their wrap boundary, so the reset is designed to happen invisibly. Existing short visual observations showed no abrupt visible pop; this review did not run a separate full 40-second cycle recording. Boats bob gently; clouds and gulls remain background detail. Smoke is subtle against the atmospheric haze, not a dramatic emergency simulation. |
| Reduced motion | Previously verified pixel-identical stationary canvases across all three worlds. Movement caused deliberately by a player or camera control should remain available; autonomous atmosphere should stay frozen. |

## Concrete issue found and corrected

The previous Nile crocodile patrol reversed along its Z axis while its yaw changed by only approximately ±0.15 radians. With its snout pointing along positive Z, it travelled backwards during half of its patrol. This was established from the animation code; the short user-control observation did not span its full roughly 79-second loop.

With the parent's authorisation, this QA agent made a small correction in `src/world.js`: a narrow elliptical patrol, with the body heading along the path tangent. The route stays within X −22 to −19 and Z −14 to 4. Its zero-time pose remains X −19, Z −5, facing +Z, and the existing `ambient=0` reduced-motion mechanism remains in use.

Two targeted unit tests passed: 721 points around the complete path were checked against an independently calculated numerical travel derivative, and position/orientation continuity was checked across the loop boundary. The targeted four-scenario Nile atmosphere browser suite was rerun because the renderer changed: reduced-motion screenshots stayed exactly identical, controls/layout and reload passed, and 225 gems plus all captured learning evidence remained unchanged. This is mathematical route/heading verification plus browser integration evidence, not a claim to have visually watched an entire 79-second patrol. Tests: `tests/crocodile-patrol.test.mjs`; browser evidence: `test-results/atmosphere-2026/nile-report.json`.

## Foundation decisions

- Adopt grounded, readable, deliberately simplified movement as the common quality target. Do not describe the present assets as photorealistic or physically simulated.
- Reuse the hierarchy: player action first, responsive camera second, slow atmospheric motion last. Avoid fast flashes, violent camera movement and scenery that blocks controls.
- Keep a shared character identity and proportions across worlds. Decide explicitly whether each world provides free movement, a companion or a portrait; Fire's present portrait-only experience is a visible consistency gap if a universal 3D-avatar promise is intended.
- Prefer subtle staggered loops. Creatures must face their travel direction; looping particles should wrap while transparent; moored boats should not appear to sail without propulsion.
- Preserve the expanded scene option and space around navigation. Tablet review must include the longest label and the final chapter, not just the first button.
- The present player review covers flat ground. It does not establish reliable foot placement on future stairs, slopes or uneven terrain. No anatomical gait analysis or physical-tablet frame-rate benchmark was performed.

No new blocking player-movement issue was found. The sole app-source change by this QA agent was the authorised crocodile patrol correction. The resulting style is believable as a child-friendly illustrated world, with the corrected creature motion and differing avatar interaction modes called out explicitly rather than hidden behind a blanket consistency claim.

Final validation after the correction: **`npm test` passed 27 tests; `npm run build` passed.** Vite reported a chunk-size advisory for a roughly 630kB minified shared chunk; there was no build error. This is not a measured device-performance result.
