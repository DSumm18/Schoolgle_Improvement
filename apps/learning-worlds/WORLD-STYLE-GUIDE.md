# Schoolgle Learning Worlds — Shared World Standard

7 September 2026. Implementation baseline and acceptance criteria for the next adventure.

David's direction is to settle Nile Quest, the Gunpowder Plot and the Great Fire of London as a coherent family before expanding the library. Reuse the successful controls, visual language and evidence approach; give each new subject its own story and meaningful actions.

## The family resemblance

Use warm, illustrated 3D forms, readable silhouettes, tactile objects, restrained camera movement and the existing DM Sans/Fraunces typography. Architecture, costume, materials and landmarks must identify the place and period. A generic building with a historical label is insufficient. The target is believable movement within stylised art, not photorealism.

| World | Established atmosphere | Player interaction today | Learning emphasis |
|---|---|---|---|
| Nile Quest | Warm sandstone, green riverbanks, decorated gateways, layered cloud wisps, birds and soft sunlight; daylight/evening options | Free-walking Leo/Maya, physical models and seven discoveries, optional Sphinx challenge | History, equal sharing/division, English inference and shadow investigation |
| Gunpowder Plot | Recognisable old Westminster, blue moonlight, warm lanterns, textured moon, stable stars and drifting clouds | Five investigations reached by map/camera travel; original 1605-inspired 3D wardrobe and companion | Roles, warning-letter evidence, chronology, causes and remembrance |
| Great Fire | Timber city and old London landmarks, river, chapter-specific daylight/night/haze/rebuilding skies, gulls and distant smoke | Five map-based investigations; animated present-day Leo/Maya beside the selected station, short arrival and celebration; cutaway rebuilding model | Where/when, spread conditions, source comparison, chronology, people's responses and rebuilding |

These interaction differences are real: Plot and Fire do not yet have Nile's free walking. Fire now shares the original animated explorer assets, with local station arrivals, but does not have Plot's period wardrobe. Decide whether a future story benefits from walking or direct investigation before building it.

## Motion that makes sense

- Start, turn and stop characters smoothly. Match footfall speed to actual displacement, including collision; never keep running feet on a stationary body. Retain ground contact and clear walk/run differences.
- Birds glide between wing strokes and face their flight path. Swimming creatures face their route and turn continuously. Moored boats bob gently around their mooring rather than sliding through banks.
- Clouds drift slowly. Smoke rises, moves with the scene's wind direction and fades before a loop resets. Avoid abrupt pops, continuous blinking and effects that compete with an instruction.
- Keep motion independent of frame rate. Check the complete route or animation loop, including wrap points; a single screenshot cannot prove continuity.
- Reduced motion freezes ambient sky, water, animals, decorative rewards and idle effects. Preserve essential action feedback through immediate state changes. Necessary walking feedback remains available while a player moves.
- Pause movement and clear held input when opening an activity or losing focus. Camera travel, costume transitions and celebrations must respect reduced motion.

## Child-facing actions and controls

Every task should answer: **What am I trying to do? What can I touch? What happens next?** Use a short instruction beside the active objects. Offer an optional visual demonstration when the interaction is unfamiliar; demonstration state must not alter the child's attempt.

Prefer visible objects and explicit actions: move a stone from a pile into a tray, open a letter, compare evidence, order events or assemble a wall. Show the total and the changing parts where conservation matters. Offer undo/take-back and feedback that explains the next useful step. Do not require dragging, rapid tapping or a timed response as the only way to show understanding.

Maintain large touch targets, visible keyboard focus, persistent help and a simple return to the library. Test narrow panels as well as full-screen tablets: overlays, companions and sky landmarks must not cover destination buttons or instructions. Convey status through words/shapes as well as colour; narration must have matching readable content. Accessibility beyond these existing controls still needs assistive-technology and pupil testing.

## A story that teaches

Build each discovery around an intended learning outcome, something the child learns or observes, a purposeful action, a response or explanation, and useful feedback. Revisit important knowledge after intervening activity and offer a later return check in a new context.

Use maths, reading, listening or science where the action naturally needs them. Nile's equal-sharing model makes division visible; the London episodes centre on history and comprehension. Do not add arithmetic or rhymes solely to claim more subject coverage. A short optional rhyme can support a suitable topic, but cannot replace evidence, explanation or retrieval.

Reward completed discoveries once. Never present gems, elapsed time, costume choice, reading support or a clicked prop as proof of independent mastery. Wrong answers should lead to explanation, scaffolding and another useful attempt rather than abandoning the difficulty.

## Evidence an adult can use

For every new assessed task, specify before implementation:

1. The exact prompt, selected/typed response and any submitted physical model, calculation, order or evidence choice.
2. Correctness or uncertainty, feedback, retries, guidance/read-aloud context and content version.
3. Whether the event is an observation, supported practice, explanation or recall; do not inflate observations into knowledge scores.
4. What the teacher can reasonably infer and which classroom follow-up would check understanding independently.

Keep ordinary play and fictional test pupils separate. Retain actual failed and corrected attempts in examples. Test save isolation, reload, export and one-time rewards. The current prototype saves locally in the browser; a school account, verified pupil link and secure shared backend are separate future work.

Teacher pages must name the intended outcomes, selected England curriculum links, source material and limitations. Explain how EEF guidance informs the design without claiming endorsement or demonstrated impact. Same-day recall is not delayed retention; automated Alex play is not a pupil study.

## Historical art and content

Use primary or authoritative sources for significant claims and recognisable period features. Separate known facts, uncertainty, adapted text and artistic interpretation. Keep modern Big Ben out of 1605 and the modern St Paul's dome out of 1666. Compressed maps, decorative motifs and atmospheric skies must not be presented as exact reconstructions, translations or dated weather/astronomy evidence.

Preserve original asset provenance and regeneration scripts where available. Reuse rendering and control systems; do not merely recolour a world and change its labels. See [Plot architecture](PLOT-ARCHITECTURE.md), [Plot clothing](PLOT-CLOTHING.md) and [Fire history](FIRE-HISTORY.md).

## Acceptance before adding an adventure to the library

- Independently play every required action and recall path, including mistakes, correction, support, locked destinations, revisits and interrupted activities. Check the final reward really requires the intended learning task.
- Review moving footage or sampled sequences, not just stills. Check routes, turns, collisions, animation loops and reduced motion. Inspect important landmarks at actual playing camera angles.
- Exercise keyboard, pointer and emulated touch at desktop and tablet sizes; check overlapping controls, panel scrolling, input release and focus. Record the separate need for physical iPad/Chromebook testing.
- Verify actual responses/models in the adult record and export. Confirm reload and ordinary/demo isolation, no duplicate gems, and no browser exceptions or failed asset requests.
- Run applicable automated checks and a production build after source changes. Keep evidence and remaining limitations alongside the implementation.
- Before claims about engagement, difficulty or learning gains, observe children and teachers using the game, including pupils with access needs. Ask pupils to explain the idea away from the game and revisit it later.

## Evidence for this baseline

[Movement and style review](MOVEMENT-STYLE-REVIEW.md), [atmosphere QA](ATMOSPHERE-QA-2026.md), [controls and characters](CONTROLS-AND-CHARACTER-REVIEW.md), [wardrobe QA](PLOT-WARDROBE-QA.md), [fictional pupil journeys](FICTIONAL-PUPIL-QA.md), [Fire QA](FIRE-QA.md), and [teacher guide QA](TEACHER-GUIDE-QA.md).

The subsequent [enhancement QA](ENHANCEMENT-QA.md) covers Fire's added 3D explorer/cutaway workshop and Plot's tactile letter. The earlier movement report's portrait-only Fire limitation is superseded by that implementation; its other testing boundaries still apply.

The completed functional and visual checks establish a reviewable local prototype. They do not establish photorealism, physical-device performance, full accessibility conformance or educational effectiveness. Treat those as explicit evaluation work, not as inferred results of a successful build.
