# Exploration parity review — 8 September 2026

David requested the same deeper checks for Nile Quest and the Gunpowder Plot after the Fire game passed input tests but still felt stuck. Acceptance now includes useful travel, believable proportions and access to activities, not merely a changing position value.

## Changes

- Nile uses measured, grounded GLB bounds: children stand 1.5 units and adult guides 1.7, below the village's 1.9-unit doors. Walking, running, guidance and animation cadence are calibrated to the smaller characters. Its existing connected exploration remains intact.
- Plot's giant floating companion is replaced by a grounded, playable 1.5-unit character in the courtyard. The original period outfits, identities and skin choices remain available in My outfit; the mirror and courtyard share the same costume rig.
- Plot adds connected collision-aware routes, a following camera, held keyboard/touch movement, optional guided walking and nearby Inspect/E actions. Looking at a future place does not unlock its lesson or award gems. The existing numbered buttons remain shortcuts to unlocked activities.
- Both scenes preserve their existing questions, progression gates, narration scripts and fictional-user evidence. Movement is not assessed as learning.

## Verification entry points

Run `npm test` in this app for state, real-character measurement and navigation invariants. Build through the repository's `node scripts/build-worlds.mjs`; this validates the final website folder and all 95 approved MP3 files.

- `tests/plot-exploration-qa.mjs`: real keyboard travel, guided arrival and interruption, first-task wrong/correct responses, Inspect without teleporting, changing outfits, reduced-motion touch and focus cancellation. Set `PLOT_EXPLORATION_PUBLIC=1` and `PLOT_EXPLORATION_URL` for direct production; otherwise it intercepts the actual final publisher folder without a development server.
- `tests/plot-qa.mjs`, `tests/plot-wardrobe-qa.mjs` and `tests/fictional-plot-recall-qa.mjs`: complete history, wardrobe and return-practice regression.
- `tests/nile-exploration-qa.mjs`, `tests/controls-qa.mjs`, `tests/browser.mjs` and `tests/fictional-nile-bonus-qa.mjs`: travel, controls, the complete seven-discovery journey and maths/recall evidence.

Reports and screenshots live under `test-results`. Publisher interception and direct public runs are distinct evidence; a successful local build is not proof of a successful deployment.

## Limits

These are bounded, stylised reconstructions. They are not full open-world London or Egypt. Browser touch emulation and automated response checks do not establish physical tablet usability, enjoyment or independent learning. Teacher and pupil observation remain necessary. The London history games do not assess maths or independent writing; Nile includes maths activities.
