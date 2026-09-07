# Live gameplay and narration release review — 7 September 2026

## Existing public gameplay baseline

Completed all main tasks using fictional browser-local pupils on the actual production website before adding narration. This was software QA, not an assessment of a real child's learning.

| Game | Evidence |
| --- | --- |
| Nile | 18 full journey groups; 22 control groups; all seven discoveries, 210 gems; wrong answers, scaffolded maths, irrigation gates, reading inference, chronology, shadows, excavation and final/return recall. Further stone/bonus/export checks passed. |
| Gunpowder Plot | 19 full journey and seven return checks; all five discoveries, 100 gems; wardrobe, evidence interactions, uncertainty, chronology and remembrance; wrong/correct answers and once-only rewards persisted. |
| Great Fire | 13 full journey groups; five discoveries, 100 gems; street modelling, prediction/comparison/transfer, history, final/return recall. Exported 59 interactions including 13 incorrect responses. |

Teacher views, fictional-data isolation, download contents, refresh persistence and no duplicate rewards were exercised. Failed stale test selectors and a narration-spy reload issue were corrected in the test harness; earlier failure evidence was retained in ignored local reports. No remaining gameplay blocker was identified. Movement is free exploration in Nile, bounded station movement in Fire and a map-led investigation in Plot.

## Narration and branding release

- 95 prerecorded, original synthetic guide clips: Nile19, Plot32, Fire44. Approximate total32minutes57seconds and31.6MB; clips are requested individually.
- All95 received automatic transcript review. Corrected names, an ending repetition and singular-house wording; rechecked replacements.
- All95 current recordings were fetched, fully decoded and started through real browser audio with advancing time and finite duration. This does not mean a human listened to every recording end to end.
- Four actual UI narration samples across three games passed with real MP3 playback, no device-speech fallback, Pause/Resume and modal cancellation.
- Ten deterministic browser player checks reproduced and fixed double fallback and pause/rejection races, and cover stale requests, focus, page/modal closure and autoplay blocking.
- 41 unit/state/catalog tests passed. Hosted build passed. Existing build chunk-size warning remains.
- The original approved Schoolgle dark horizontal logo replaces the invented brand symbol in the Worlds landing, selector, all three game headers and example records.15 isolated header checks at320/768/1440 passed. Logo artwork is unchanged.

## Practical limits

Physical iPads/school computers and assistive technologies have not been certified by emulated browser tests. Child excitement, independent navigation, delayed learning and transfer beyond the game need supervised pupil/teacher observation. Some Fire mobile tasks sit below the scene; several London chapters remain reading-led. These are priorities for the school pilot, not evidence of measured attainment gains.

Publication and final direct-live checks are recorded in the release PR and Obsidian project note. Full screenshots, scripts' output, JSON exports and audio hashes are retained under the app's ignored test-results directory.
