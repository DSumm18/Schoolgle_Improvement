# Nile Quest — development team and release review

## Visible stones and control demonstration — 7 September 2026

David observed that counters should exist visibly before sharing and that the old rectangles did not look like trays. Replaced the count-only source with 15 persistent stone elements, moved between a shared pile and three raised wooden trays. Add/return controls show words and symbols, maintain the whole total, announce moves and animate the same stone between containers. Reduced motion places it immediately. A separate three-stone demonstration highlights the controls and shows adding/returning; it never changes the child's partial work or creates assessed attempts/gems. Viewing it persists as control-guidance context.

Independent bounded QA passed ten functional and two final layout checks: identity/conservation, actual animation, rapid input/exhaustion, partial-model isolation, mid-demo cleanup, support persistence, required bonus phases/one-time reward, keyboard/touch/reduced motion, 1024px/320px layout and no runtime/request errors. Sixteen unit tests/build passed. The lead also operated the actual in-app preview. Initial inspection found the banner pushed trays below the fold; compacted the model view, scrolled directly to controls and kept Close visible. User's two discoveries and 60 gems remain intact. Evidence: `tests/stone-sharing-qa.mjs`, `test-results/stone-sharing/` and the independent QA report. Child comprehension remains to be observed.

## Learning evidence, teacher studio and bonus — 6 September 2026

David requested an independent whole-game test, a clearer account of the actual education and school offering, richer response evidence, extra-gem practice and another visual review. An independent QA agent completed all seven core activities through real UI, with deliberately wrong answers across the stages. An education agent audited current England curriculum/EEF publications and upcoming reforms; a visual agent improved the scene composition. The lead integrated the learning, reporting and workflow changes.

**Changed:** new Sphinx equal-sharing challenge after cargo (15÷3 model, typed answer and explanation, +15 gems once); all-prerequisite state guards and contiguous saved completion; actual garden/timeline/museum/return responses; per-attempt content version with honest legacy migration; detailed actual evidence, print/export and next teaching probes; Teach together mode/lesson plan; fictional school-dashboard preview and explicit access/sharing boundary. Visual improvements include tiled court, painted ceiling, awnings, textiles, sand and connecting paths. No school accounts or public hosting were introduced.

**Verified:** 16 unit tests and build passed. Independent UI QA passed 27 checks, including all seven core missions, 32 deliberate-response attempts, new response capture, one-time bonus, wrong typed answers, reload/replay, keyboard and 1024×768 touch, teacher actual/demo separation, JSON and print generation. No page exceptions, failed HTTP responses or missing core response details in the final integrated journey. The first print review exposed wasteful background and an orphaned final sentence; print styles were corrected and a targeted follow-up is recorded in [independent QA](INDEPENDENT-LEARNING-QA.md). The art agent's atmosphere/navigation/visual checks passed; rendering cost and screenshot evidence are in [environment review](ENVIRONMENT-ART-REVIEW.md).

**Limits:** browser-local data is untrusted guided practice, not authenticated pupil evidence or mastery. The new challenge is still a panel-based activity, not an immersive in-world simulation. Current coverage is selected England objectives, not an entire Egypt unit or the whole UK curriculum. Physical tablet performance, child enjoyment/access and transfer of learning need a supervised pilot. Large bundle and draw-call cost remain. [Education audit](EDUCATION-AUDIT-2026.md) separates current EEF/DfE evidence from future reform plans and unbuilt school services.

## Egyptian atmosphere follow-up — 6 September 2026

David found the existing world insufficiently Egyptian and lacking excitement/mystery. Added an original Blender sphinx, carved obelisks, painted temple columns, a decorated reward door, village friezes, a warmer sky, long shadows and a rocky horizon. Revised the invitation and scripted guide lines to emphasise discovery. The new brighter daylight preference persists; reduced motion freezes the atmosphere. Decorative motifs and the stylised map remain explicitly fictional/Egyptian-inspired rather than a translated inscription or historical reconstruction.

Verified after integration: 12 unit tests, the complete seven-mission/18-check browser journey, six new atmosphere checks, and seven navigation groups including 49 mission pairs and 70 difficult starts. All passed; no page exceptions or failed assets in the full journey, and no shader/rendering console errors in the atmosphere test. The new setting works on a 1024×768 touch layout and survives reload. Build passed with the existing large-chunk advisory. Screenshots and detailed limits: [Atmosphere review](ATMOSPHERE-REVIEW.md). The lead also inspected the existing in-app preview, which retains Maya and the Continue entry. Physical school devices and child engagement remain unvalidated.

## Live pupil-view playthrough and entry repair — 6 September 2026

At David's explicit request, the lead used the actual in-app preview to move the explorer from the cargo landing to the Nile garden, open each gate, answer the farming question and collect River keeper plus 30 gems. These were actual UI actions, not injected completion state. The completion remains in that browser's demonstration progress.

Observed: the world offered the locked cargo activity while the garden mission remained incomplete; the player had to discover a small bottom entry to a separate puzzle window; that button overlapped other controls. The game described gates without clearly connecting the character journey to their on-screen buttons. The gates worked when clicked, but the entry flow was confusing.

Fixed: the prominent mission-card button changes from Guide me there to Open the gate puzzle at arrival (Start this activity for later missions). It directly opens the current activity. Locked stations no longer expose an active interaction button or respond to E. Activity entry waits until guided movement ends. Bottom entry is separated from the controls, redundant travelling toasts are removed, and the garden narration now explicitly mentions the three numbered puzzle buttons.

Verified: three new real-browser journeys reproduce the wrong-station starting point using a synthetic save, exercise actual keyboard movement and guided travel, enter through the prominent mission button and earn the garden reward at 831×746, 1024×768 touch and 844×390 touch. Full regression: all seven missions and 18 checks passed, without uncaught page errors or failed/external requests. Eleven unit tests and build passed. The final arrival-visibility refinement was verified by the targeted journeys. Evidence and screenshots: `test-results/mission-entry/`. This does not claim that operating a 2D puzzle is equivalent to manipulating a 3D gate; more immersive in-world interaction remains a product-design opportunity.

## First-activity clarity follow-up — 6 September 2026

David's own playtest found that “Open a connected channel…” did not explain either how to start the activity or what to press. Automated controls checks had passed, but this direct feedback demonstrated an instruction-design failure.

The first mission now directs the player to Guide me there, then Open garden activity. The activity explicitly says to tap/click gates 1, 2 and 3; shows numbered Open/Closed buttons, a next-gate prompt and partial water flow; offers prepared read-aloud instructions and a button that focuses the next gate. After water arrives, gates stay open and focus moves to the labelled second step. Wrong answers give local feedback, and completion explicitly directs the player to Collect your discovery.

Verified: real Chrome first-mission journeys at 831×746, 1024×768 touch and 320×740 touch, including keyboard Enter/Space, gate reopening, instructions audio, wrong-answer recovery and the 30-gem reward. No page errors or failed requests. Eleven unit tests, six existing interface checks and the production build passed. Evidence: `test-results/garden-instructions/`. The large-bundle advisory remains. These checks demonstrate the mechanics and layouts; David/child feedback must establish whether the instructions are now clear enough.


Latest review: 6 September 2026. The third iteration's [character and controls review](CONTROLS-AND-CHARACTER-REVIEW.md) supersedes the current-state totals below: 11 unit tests, 22 controls checks, 10 movement checks, 8 character-workflow checks, six asset validations, the 18-check playthrough, 6 interface and 4 resilience checks, plus navigation. It adds selectable explorers and skin tones, revised player gait, first-use controls, independent tablet pointers and camera/run controls. All passed for the local prototype. Physical devices and child usability remain unvalidated.

The remainder records the earlier second-iteration team review and its evidence.

## Team and accountability

David authorised a parallel specialist-agent development team. These are AI specialist roles, not employees of or endorsements by external studios. The process uses explicit ownership, specialist review, independent verification and an integrated release decision.

| Role | Responsibility | Owned implementation |
| --- | --- | --- |
| Project manager / integration lead | Requirements, priorities, integration, user experience and release evidence | Main interface, styling, reports and handoff |
| Gameplay and technical-art lead | Movement, navigation, world presentation and animated assets | 3D world and asset pipeline |
| Learning-design and game-systems lead | Teaching sequence, methods, feedback and evidence integrity | Activities, content and learning state |
| Independent QA / accessibility lead | Reproduce failures, challenge assumptions and verify fixes | Separate QA suite and findings |

## Acceptance gates

| Gate | Required evidence | Review state |
| --- | --- | --- |
| Playable expedition | All seven missions complete through real browser interactions | Passed: all seven missions through real Chrome controls; 210 gems; replay cannot duplicate rewards |
| Safe mathematical feedback | Incomplete sharing never displays a false equation; support returns to the objective | Passed: equation remains unknown until all baskets are shared; partial-load regression tests and real activity checks |
| Learning before reward | Child demonstrates reasoning after manipulation, including shadow understanding | Passed: cargo and shadow explanation gates reject incorrect explanations, teach and permit another attempt |
| Reliable exploration | Guided routes reach every mission from every other mission; manual control cancels guidance | Passed: 42 distinct ordered UI routes; 49 geometry pairs plus 70 difficult starts; manual takeover |
| Evidence with context | Hints/scaffolds are retained and scores are not labelled mastery | Passed: cumulative support, phase/control observations, objective detail, typed save validation; access choices labelled |
| Accessible interaction | Keyboard, touch, focus, larger text, reduced motion and colour-independent controls | Passed: focus, six 320px larger-text mission layouts and three actual narrow-screen touch interactions; human assistive-technology testing still required |
| Technical resilience | Save corruption, blocked storage, failed assets, exports and error monitoring | Passed: blocked storage, invalid saves, missing assets, JSON export and actual touch movement |
| Integrated build | Unit tests, browser flow, independent QA and production bundle | Passed: 10 unit tests, 18 full-playthrough checks, 6 interface checks, 4 resilience checks; independent 57/57 plus 6/6 targeted checks |

## Release boundary

Passing these gates means a reviewable local prototype. It does not establish classroom efficacy, full curriculum coverage, accessibility for every child or readiness for real pupil accounts. Teacher review, child usability under appropriate arrangements, physical school-device testing and future service privacy work remain separate gates before school/public release.

## Findings and final evidence

Specialist findings: [Gameplay review](GAMEPLAY-REVIEW.md), [Learning review](LEARNING-REVIEW.md), [Independent QA review](QA-EXPERT-REVIEW.md). The integration lead read these findings and ran the integrated application against a fixed production build, independent of development hot reloads.

Concrete fixes include false equations during partial sharing; missing reasoning gates; approximate route/collision handling; malformed saved correctness; small-screen clipping; faint informational text; disappearing keyboard focus; overwritten support context; reset retaining the old location; and OS motion preferences overriding explicit choices. Character portraits and scripted teaching cards now connect the activities to the world, and help remains visible while the child works.

Machine-readable evidence is under `test-results/`: `browser-report.json`, `interface-report.json`, `resilience-report.json`, `navigation-report.json`, and the independent `expert/` reports. Full-flow screenshots/video are retained there. The root integrated playthrough used a fixed built snapshot on port 4174; independent routes used their own snapshot on port 4175. Development-reload interruptions were discarded and rerun, not classified as product successes or failures.

The production build passes. `npm audit` reports zero known vulnerabilities at this review. A large JavaScript chunk advisory remains (about 710 kB minified / 189 kB gzip for the app bundle); real device/network performance is still a pilot gate. Runtime frame-rate diagnostics now use uncapped elapsed time, so slow frames are not hidden by the simulation time cap.


## Integrated release decision

**PASS — local prototype quality gate.** All reported software defects in this pass are fixed and their relevant checks passed. Independent QA completed 57/57 checks on its frozen build, including all 42 ordered UI routes and six narrow-screen mission layouts. A final rebuilt-source pass completed 6/6 targeted keyboard, touch and typed-save checks. Both independent reports contain zero uncaught page errors. The root fixed-build full playthrough also reports no failed asset requests or external requests.

**Not yet assessed:** teacher/pupil learning outcomes, real Chromebook/iPad performance, complete assistive-technology access, and any future authenticated pupil service. These remain explicit next-stage gates; this software pass does not certify them.

The team completed this bounded iteration. [Play the latest local game](http://127.0.0.1:4173). [Teacher guide](TEACHER-GUIDE.md). No production deployment, school contact or live pupil-data changes were made.
