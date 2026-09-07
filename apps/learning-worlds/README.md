# Schoolgle Learning Worlds — Nile Quest, Gunpowder Plot & Great Fire

## Schoolgle website build

This curated release supports the nested static path `/worlds/play/`. Run `npm ci --workspaces=false`, `npm test`, then `npm run build:hosted` with Node 20.19+ or 22.12+. The root website pipeline may equivalently run `vite build --mode hosted --base /worlds/play/` and copy `dist` to the platform’s generated static directory. Do not commit generated output.

Hosted builds use browser speech synthesis and omit prepared narration WAV files; their redistribution terms have not been cleared. Local development/builds retain the original optional WAV narration. The HTML base and asset helper support both `/` locally and `/worlds/play/` when hosted, including explicit `index.html` and query-based game/example/Alex routes. See [HOSTED-RELEASE-QA.md](HOSTED-RELEASE-QA.md).

## Investigate, change your mind, keep your discoveries — 7 September 2026

The full-game critique now has a first implemented response. Great Fire discovery 2 replaces its fixed clue checklist and preset street comparison with an interactive paper-street investigation. Predict before the answer is revealed; place a gap; watch original and changed routes; explain the comparison; reflect on the prediction; then solve a six-house layout whose starting marker has moved. A gap behind the new start does not help. It is a bounded illustration, explicitly not a real-fire simulator or guarantee. The historical connection to dry conditions, wind and close buildings appears after the investigation, before later recall.

Each prediction, tested plan, outcome, explanation, reflection, retry and support request is recorded. Skipping the animation reveals the same model result; it does not skip the learning steps. The final discovery requires both explanations and a successful new plan. Fire content version is now `1666.2`; older saved completions and event versions are retained. The unfinished model lives in memory and restarts if its chapter is revisited or the page reloads; recorded events survive.

All three games now have a selectable **discovery exhibition** showing actual saved choices, models or calculations. Children can inspect a discovery, follow the connected story, revisit a location or start return recall. Plot's final reward presents the exhibition; Nile's completed journal becomes its exhibition; Fire's final reward reveals its London exhibition. Fire return recall uses fresh examples about conditions, diary evidence and rebuilding plans. Adult reporting/export remains available separately. Symbols are original illustrations; the game does not claim children authored the supplied answers or found authentic museum objects.

Read-aloud sits beside each Fire investigation step. Step changes bring instructions below the sticky header, and redundant introductory text is removed from that activity. Tap, keyboard, instant-result and reduced-motion paths remain available. Leaving an animation or changing motion mode cancels it safely.

Validation: **33 unit tests**, the **62-module production build**, **49 complete-journey checks** and **10 targeted browser checks** passed. See [investigation upgrade QA](INVESTIGATION-UPGRADE-QA.md), [fresh full-game critique](FULL-GAME-EXPERIENCE-REVIEW.md) and actual artifacts under `test-results/investigation-upgrade/`. An early exhibition assertion compared changing FPS as if it were saved learning data; the assertion was corrected and the affected check rerun. The existing shared-bundle size advisory remains. Browser checks use fictional learners; pupil engagement, independent understanding and physical school-device performance still need observation. This pass improves one deeper investigation and the three endings; it does not convert every task into open-world play.

## Fresh player critique

[Player experience critique](PLAYER-EXPERIENCE-CRITIQUE.md) records a subsequent live in-app review of entry, costume, role matching and the letter. It found and fixed wrong-answer guidance appearing below the viewport: the hint now appears beside the selected letter line. The wider priorities are deeper prediction/action/explanation tasks, easier access to narration, and closer connection between the scene and learning. These are recommendations; the existing prototype should not be described as a validated adaptive tutor.

## Enter the scene and handle the evidence — 7 September 2026

Great Fire now has an **animated 3D Leo or Maya inside London**, using the original explorer models. Choose the explorer and skin tone from the welcome screen or Controls & explorer. The visitor makes a short arrival beside each selected discovery, turns smoothly, idles and celebrates a newly earned discovery. Reduced motion places the explorer immediately and uses still feedback. This remains map-based investigation with a present-day visitor, not free walking or a new 1666 wardrobe.

The rebuilding activity now assembles a recognisable cutaway house. Three wall panels start in a visible supply; **Place a wall** adds one to the model, and **Take the last wall back** reverses the action. Counts show both locations. Changing material returns all walls; the material rule, explanation and final recall are still required. The larger scene title becomes compact after beginning, leaving more space for the world and explorer.

Plot's warning letter now sits as a folded packet on an illustrated writing surface. Open the wax seal to unfold the parchment, then select the warning and judge the uncertainty about its author. The words, assessed responses and rewards remain unchanged; the seal is a decorative reconstruction, not a facsimile. See [letter review](PLOT-LETTER-REVIEW.md) and [combined enhancement QA](ENHANCEMENT-QA.md).

The original Nile world and all three recently enhanced skies remain the family foundation. Current evidence and accessibility boundaries are in the [world style guide](WORLD-STYLE-GUIDE.md). No real pupil data or public hosting is involved.

Validation: 15 Fire and 15 Plot full-journey checks passed, followed by 6 Fire and 4 Plot targeted interaction/animation checks plus the fresh 320px explorer chooser. All 27 unit tests and the 58-module production build passed. The existing shared-chunk size advisory remains. These are local browser tests, not measured learning gains or performance on physical school tablets.

## Shared foundation for the next adventures

The [world style guide](WORLD-STYLE-GUIDE.md) records the three-world visual identity, believable animation rules, clear child-facing actions, historical boundaries, learning evidence and acceptance checks for future games. [Movement review](MOVEMENT-STYLE-REVIEW.md) distinguishes observed motion quality from functional checks and documents the current differences between Nile free walking, Plot's costumed companion and Fire's portrait-based investigation.

## Living skies and world atmosphere — 7 September 2026

Each adventure now has an original animated sky appropriate to its setting. Nile uses warm layered wisps, a soft solar glow and shaped birds alternating between flapping and gliding; its day/evening and lighter graphics settings remain available. Plot uses a textured moon, halo, stable stars, independently drifting clouds and subtle lantern/boat movement. Fire changes its illustrated sky by story chapter, with daytime gulls, a night moon/stars, drifting cloud layers, rising/fading distant smoke and a soft veil joining the finite city to the skyline.

These are artistic interpretations, not an astronomical or exact-weather reconstruction of historic dates. All atmospheric motion obeys reduced motion. Effects use original procedural shaders, geometry and small textures; no media downloads, new services or runtime asset dependencies are needed. Fire's sky is an illustrated background with a distance veil; the terrain and landmark labels remain the navigable 3D scene.

The targeted browser check is `node tests/atmosphere-2026-qa.mjs` (optional `nile`, `plot` or `fire` argument). It compares visible normal motion against exact stationary reduced-motion pixels, exercises existing controls on desktop/tablets, and checks saved learning/rewards and reload behaviour. Reports and screenshots: `test-results/atmosphere-2026/`; [independent review](ATMOSPHERE-QA-2026.md). All 12 atmosphere checks passed. QA also found a Plot preview blocking the last map destination in expanded tablet view; repositioning it passed 10 targeted destination/rotation checks at 768, 818 and 1024 widths. This is atmosphere and usability verification, not a pupil-engagement study or a guarantee of performance on school tablets.

## Teacher outcomes, fictional pupil evidence and Great Fire — 7 September 2026

The library now offers three independent adventures. Open `?game=fire` for **The Great Fire of London: The River of Stories**. It has five gated discoveries: locate the bakery/date, inspect conditions and compare a paper street model, compare diary/material evidence, assemble a chronology and explain people's responses, and build a wall model under rebuilding rules. Three final recall questions must be completed before the final reward; a separate return check is available afterwards. Twenty gems per chapter are awarded once. This is history with purposeful English comprehension, not a maths assessment. The player is a present-day visitor, now represented by an animated 3D explorer as described above; there is no new 1666 costume system or free-walking controller.

All three grown-up views now explain intended learning, selected England curriculum connections, what is actually recorded, and what a teacher can check in class. EEF guidance informs the design; neither endorsement nor evaluated attainment improvement is claimed. Plot has an optional three-question return check with actual responses, retry/read-aloud context, timestamps and elapsed time. A same-day check is not evidence of delayed retention.

**Try as a fictional pupil:** choose Grown-ups → **Play as Alex**. `?demo=1` uses separate per-game browser saves. All activities use the normal evidence/reward paths; no answers are fabricated or prefilled. Exports identify Alex as fictional. The demo reset clears only Alex's save for that game. Normal saves remain separate. No personal registration, school account or backend has been added.

**See a completed example immediately:** Grown-ups → **View a completed Alex example** opens `?game=nile|plot|fire&view=example`. These read-only examples are exact JSON exports from isolated automated playthroughs, including deliberate wrong answers and corrections. They are distinct from the existing fictional school-dashboard design fixtures. Filters show corrections or recall; downloads preserve the complete record. Opening an example never imports it into a user's save. Example provenance: [public/examples/README.md](public/examples/README.md).

Verification: [fictional pupil full journeys](FICTIONAL-PUPIL-QA.md), [teacher guide](TEACHER-GUIDE-QA.md), [Fire journey](FIRE-QA.md), [Fire historical/visual sources](FIRE-HISTORY.md). `npm test` includes 25 checks after adding demo isolation and Fire state/evidence validation. Existing Nile and Plot full journeys passed, followed by actual Alex journeys and the full Fire journey. Physical school devices, assistive technology and learning/engagement with children remain pilot work. This is still a local prototype, not a public school service.

Useful checks: `node tests/fictional-pupil-qa.mjs`, `node tests/fire-qa.mjs`, `node tests/example-record-qa.mjs`, `npm test`, `npm run build`.

## Choose an adventure — 7 September 2026

### Historic Westminster and the explorer's wardrobe

The Gunpowder Plot setting now centres on named, historically referenced **Westminster Hall** and **St Stephen's Chapel**, with masonry, Gothic tracery, buttresses, lead roofs and roof lanterns. **Look around the palace** expands the scene; the same button or Escape returns to the unfinished task. The interpretation compresses the site for play and does not show today's nineteenth-century Parliament. St Stephen's housed the Commons; the plot targeted the Lords elsewhere in the old palace. See [architecture sources and limits](PLOT-ARCHITECTURE.md).

On first entry choose **My 1605 outfit**, then **Put on** either the doublet/breeches/cloak outfit or the bodice/petticoat/cloak outfit. The modern explorer visibly changes clothes in a 3D mirror; **Enter 1605** continues. Both outfits are available to Leo and Maya, with three skin-tone options. **My outfit** remains available during play, and a compact live 3D explorer retains the chosen costume. The mirror and companion can be turned by dragging or keyboard arrows. Reduced motion suppresses the outfit-change animation.

**What are these clothes?** offers optional short descriptions of garments and layers. Choices and inspections are unassessed observations, carry no discovery gems and preserve existing chapter progress. Saved identity/outfit preferences are validated separately from evidence; older attempt version identifiers remain intact. The costumes are original early Stuart-inspired game interpretations, with the same stylised explorer identity, rather than exact historic replicas. [Clothing sources and model checks](PLOT-CLOTHING.md) and [independent wardrobe QA](PLOT-WARDROBE-QA.md) document the work. Run `node tests/plot-wardrobe-qa.mjs` for the new flow; the existing Plot suite now enters through the wardrobe when needed.

The root URL now opens an illustrated game library. **Nile Quest** is at `?game=nile`; **The Midnight Letter**, a new Gunpowder Plot history investigation, is at `?game=plot`. The Schoolgle logo returns to the library from either game. The existing Nile teacher link `?view=teachers` still works. Each world loads separately and has its own browser save; opening the London game never migrates or resets Nile evidence.

The Midnight Letter is a complete first playable five-discovery episode: match historical roles, open and interpret an adapted warning letter, inspect three reconstructed clues and explain their significance, assemble a chronology and identify its cause, then distinguish remembrance from eyewitness evidence and complete a return check. It uses a stylised Three.js London map with numbered locations, original illustrated evidence cards, untimed click/tap/keyboard tasks and 20 gems per discovery, awarded once. Its current navigation is point-and-click investigation, not a free-walking character controller. The optional traditional rhyme is spoken using device speech, not a recorded song. Detailed historical review: [Gunpowder education specification](GUNPOWDER-EDUCATION.md).

**Grown-ups** opens the actual local casebook and JSON export. It records assessed answers and support separately from observations such as inspecting props, undoing a card or playing a rhyme; observations do not count as correct knowledge answers. It retains the latest 200 events, sanitises saved records and labels its limits. Completed discoveries persist; unfinished tasks restart on revisiting. No child identity, authentication, school roster or cloud school sharing is connected. The age 6–9 recommendation requires adult reading support and pupil/teacher validation.

Check the new episode with `node tests/plot-qa.mjs`; the original full Nile journey uses `npm run test:browser` and its explicit Nile route. Unit checks include isolated saves, prerequisite/reward invariants and malformed evidence recovery. [Independent Gunpowder QA](GUNPOWDER-QA.md) records the browser results and limitations. The preview remains local at `http://127.0.0.1:4173/`; it is not a public deployment.

## Original Nile expedition

Playable local 3D prototype, built 6 September 2026. An original seven-stop Ancient Egypt expedition, with six Blender character designs, skeletal animation, narrated learning activities, contextual feedback and a local practice record.

## Learning studio and Sphinx challenge

The Sphinx model shows all 15 physical counters in a shared pile. **+ Add 1** moves the same stone into a wooden tray; **− Take 1 back** returns it. A constant total and changing pile/tray counts show that stones are shared, not created. **Show me how** runs a separate three-stone add/return example, preserves the player's work and records control guidance as support on later attempts. Reduced motion uses immediate placement without a flight animation. No dragging is required.

Open **For grown-ups** on the welcome screen, or **Field journal → Teacher & family studio** during play. The direct local teacher route is `http://127.0.0.1:4173/?view=teachers`. It explains the four subjects, offers a guided lesson plan, shows this browser's actual responses/models/calculations and provides a clearly labelled fictional school-dashboard preview. **Print teacher review** and **Download this practice record** support adult review. No staff login, class roster or cloud pupil sharing is connected.

**Explore and practise** is the untimed pupil adventure. **Teach together** turns on automatic travel and supports the adult-led lesson plan while preserving the same required tasks. A shared-screen browser record is not evidence for every pupil in the room.

After completing the harvest boats, choose **Sphinx challenge · +15 gems** on the mission card or in the field journal. Build 15 counters into three equal groups, enter the division answer and explain why the model is fair. All three stages are required. It awards 15 gems once; the seven core discoveries still award 30 each, for 225 total if both are completed. Replays are practice, with support/context retained and no repeat gem awards. The typed answer is not supplied before first submission.

New core attempts also retain garden choices, submitted timeline order, cargo model/equation, museum explanation and return-check answers. New entries carry a content version; older ones remain explicitly unversioned/missing rather than acquiring invented responses. The local record retains the latest 200 activity attempts, up to 100 return answers per day across 60 recorded days. It cannot authenticate a pupil or prove independent mastery.

See [Education audit](EDUCATION-AUDIT-2026.md), [independent learning QA](INDEPENDENT-LEARNING-QA.md) and [environment art review](ENVIRONMENT-ART-REVIEW.md). The new world detail includes a tiled temple court, painted ceiling, village awnings and textured paths. `src/bonus.js`, `src/teacher-view.js` and `src/studio.css` own the new learning interface.

## Egyptian atmosphere details

The world now includes an original Blender sphinx, carved obelisks, painted columned gateway, decorated reward door, village friezes and a warm evening sky with rocky horizons. **Settings → World lighting → Bright daylight** offers a brighter alternative and remembers the choice. Reduced motion keeps the new atmosphere still. The decorative motifs are original Egyptian-inspired artwork, not a translated ancient inscription.

`src/atmosphere.js` owns these additions. `scripts/create-sphinx.py` regenerates `assets/nile-sphinx.blend` and `public/models/sphinx.glb` with Blender. The sculpture adds approximately 559 kB, four material primitives and 21,100 triangles. See [Atmosphere review](ATMOSPHERE-REVIEW.md) for screenshots and tested limitations.

## Character and controls review

The current iteration adds Leo (boy explorer), Maya (girl explorer), three skin tones with matching portraits, saved choices and safe switching without losing discoveries. Choose **Your explorer** before starting, or **Settings → Choose your explorer** during play. Both characters use identical abilities, equipment and learning activities. Avatar choices describe a fictional appearance; no personal gender is requested.

First-use controls explain moving, looking and discovering, with prepared audio and a persistent **Controls** button. On a tablet, use the labelled **Move** pad with one thumb and swipe the world with the other finger. Lift to stop. **Run** toggles speed; **Look ahead** recentres the camera. Computer users can use arrows/WASD, Shift, mouse drag and E. H opens help; C resets the camera. **Guide me there** handles navigation automatically. Movement now accelerates and stops gently; small thumb drift does not move the character, and walking stops at walls rather than continuing to animate.

[Character and controls review](CONTROLS-AND-CHARACTER-REVIEW.md) contains observed before/after issues, screenshots, tests and remaining device/child-review limits.

## Earlier specialist-team quality pass

A project manager/integration lead, gameplay and technical-art lead, learning-design lead and independent QA/accessibility lead reviewed this iteration in parallel. See [Quality report](QUALITY-REPORT.md) for requirements, ownership, findings and verified release evidence.

## Play

Open **http://127.0.0.1:4173** while the local server is running. To start it again on this Windows computer, run `Start-NileQuest.ps1` from PowerShell. It launches a hidden local server and checks for an existing Nile Quest server first.

Alternatively, from this directory:

```powershell
npm ci --workspaces=false
npm run dev
```

Use WASD or arrow keys to move, Shift to run, drag the scene to look around, and E to explore a nearby discovery. The map and **Guide me there** provide automatic travel. At the current mission, the same prominent button changes to **Open the gate puzzle** or **Start this activity** and opens the puzzle. Gates are clicked inside the puzzle window; the explorer waits during activities. A touch joystick appears on touch devices. J opens the journal, M the map and Escape the comfort settings. All challenges are untimed.

The world is an intentionally compressed fictional map. The pyramids at Giza, Tutankhamun's tomb in the Valley of the Kings and a modern museum are different places and periods. The game labels this distinction. See [Teacher Guide](TEACHER-GUIDE.md) for curriculum mappings, sources and the limits of this prototype.

## Included

- River channels: connect water to a garden and explain water and fertile silt.
- Harvest boats: represent 24 ÷ 3 with equal sharing. A smaller six-basket rehearsal returns to the original task before awarding completion.
- Scribe's message: retrieve information, infer a need and select supporting text.
- Timeline: order the Giza pyramids, Tutankhamun and the 1922 excavation.
- Light chamber: predict and explore how object distance changes a shadow.
- Excavation: brush a replica, record a grid position and explain archaeological context.
- Museum: retrieve key ideas, distinguish claims and support an explanation.
- Seven journal entries, one-time discovery rewards, a three-question return check, reload persistence and downloadable practice evidence.
- Local prepared narration, visible text, keyboard alternatives to dragging/brushing, larger text, reduced background motion and lighter graphics.

## Code and assets

`src/world.js` owns the Three.js world and movement; `content.js` owns the reviewed story text; `challenges.js` owns activities; `learning.js` owns state and evidence; `main.js` owns the interface. No other Schoolgle app, platform dependency file, database or tenant record was changed.

Six editable Blender files are in `assets/`. The matching browser-ready GLBs are in `public/models/`: Leo (explorer), Maya (explorer-girl), farmer, scribe, archaeologist and curator. Each has Idle, Walk, Run and Celebrate animation clips. Original Blender-rendered portraits in `public/portraits/` support scripted character-led teaching cards; `scripts/render-portraits.py` regenerates them. The characters are original stylised prototypes, not likenesses of historic individuals. Geometry and rig generation are reproducible with `scripts/create-assets.py`:

```powershell
$env:NILE_CHARACTER = 'explorer' # or explorer-girl, farmer, scribe, archaeologist, curator
& 'C:\Users\dsumm\.codex\tools\nile-prototype\blender-4.5.13-windows-x64\blender.exe' --background --python scripts/create-assets.py
```

Blender 4.5.13 LTS was downloaded from the official Blender distribution. World props are original procedural geometry. Local font files ship through Fontsource (DM Sans and Fraunces, SIL Open Font License; package licence files retained). Three.js is MIT-licensed. No museum images, worksheets or White Rose lesson materials have been copied. Narration is locally generated using the installed Microsoft Hazel Desktop voice; run `scripts/create-narration.ps1` after changing mission introductions or src/controls-content.js. Review voice redistribution terms and replace with a commissioned/licensed performance before a public commercial release.

## Verification

```powershell
npm test
npm run test:browser # requires server on port 4173 and installed Chrome
node tests/resilience.mjs # blocked storage, asset failure, export, actual touch events
node tests/interface.mjs # focus, cumulative support, reset, comfort preferences
node tests/navigation.mjs # actual scene geometry and movement invariants
node tests/movement.mjs # acceleration, collision stop, deadzone, focus and camera
node tests/controls-qa.mjs # desktop and simultaneous tablet pointer controls
node tests/characters.mjs # selection, skin previews, saved progress and touch layouts
node tests/character-assets.mjs # six GLBs: finite tracks and continuous loop endpoints
node tests/expert-qa.mjs # independent UI routes, mobile and accessibility review
npm run build
npm audit
```

Set `NILE_TEST_URL` to a fixed preview URL to run the full browser, interface and resilience suites against a built snapshot without Vite live reloads. The navigation suite deliberately imports source modules from the dev server. Check the independent QA script for its snapshot server options.

`tests/browser.mjs` runs a real Chrome playthrough, exercises all seven tasks, wrong answers and maths scaffolding, rewards, persistence, return practice, keyboard movement and mobile layout. It saves screenshots, a video and `test-results/browser-report.json`. Browser emulation is not a substitute for physical Chromebook/iPad testing. Performance readings are local observations, not a school-device benchmark.

## Prototype boundaries

Progress belongs to this browser, not a verified pupil. Clearing site data resets it, and people sharing a browser share its record. Do not use it as a real class assessment database. There are no accounts, school roster uploads, school matching, parent messaging, subscriptions, multiplayer, free-text AI characters, advertising or analytics. Nothing is written to Supabase. The browser serves app assets from the local machine; prepared narration is local. Optional speech synthesis uses the browser/OS voice service and its availability varies.

Adaptation is explicit task scaffolding and contextual feedback. There is no disability detection, automated diagnosis, general adaptive tutor or validated mastery score. Colour-independent labels and keyboard options are included, but the entire 3D experience has not been validated for blind players, switch access or every SEND need.

Before school deployment: teacher and historian review, moderated child usability sessions with appropriate arrangements, assistive-technology and real-device QA, a curriculum/version/licensing review, and separate assessment of data protection and safeguarding for any proposed accounts or sharing. The next product milestone is a supervised pilot; efficacy, price and school demand are unvalidated.
