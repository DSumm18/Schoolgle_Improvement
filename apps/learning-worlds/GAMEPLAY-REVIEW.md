# Gameplay and Technical Art Review

Date: 6 September 2026. Specialist AI gameplay/technical-art pass, coordinated by the parent project manager; no affiliation with a commercial games studio.

## Scope and acceptance criteria

Improve reliable exploration in the existing prototype without changing its learning activities or accounts. A guided route must reach each discovery from every other discovery, avoid building footprints, support manual interruption, and recover from an invalid saved position. Tight spaces must retain a useful view of the explorer. Existing Blender assets and the public `NileWorld` API must remain usable.

## Changes

- Replaced the hard-coded eastward pyramid detour with a shortest-path search across a visibility graph of expanded obstacle corners. It plans against every house and pyramid, in either direction.
- Replaced undersized circular collision footprints with the actual rectangular building/pyramid bases plus player clearance. The old pyramid circle allowed movement through its ground-level corners.
- Added teal ground breadcrumbs to make the planned route visible against sand. They disappear when travel stops or a panel pauses play and introduce no flashing/pulsing effect.
- Keyboard movement and touch-stick input immediately return control to the player during guided travel. The existing stop button still works through `guideTarget = null`.
- Clamp and recover saved positions using an in-bounds exit from building footprints. Testing found a failure at the southeast boundary: choosing the nearest pyramid exit put the explorer beyond the map and trapped the route planner. Recovery now chooses an available exit inside the map.
- Stop walking/running animations while paused, while preserving a deliberate discovery celebration.
- Guard the camera against building volumes. Very tight spaces use a temporary overhead view so that neither a wall nor an extreme close-up of the avatar fills the screen.
- Batch repeated pyramid layers by material to reduce rendering work. An isolated local Chrome scene reported 884 draw calls, about 105 fewer than before this pass; this is an observation, not a school-device performance benchmark.
- Use uncapped elapsed frame time for FPS telemetry. The 50 ms simulation cap remains for stable movement but no longer imposes a false 20 FPS floor on reporting.

## Verification evidence

Run `node tests/navigation.mjs` with the Vite server on port 4173. An isolated Playwright/Chrome page imports the actual Vite-served `NileWorld`, loads all five GLBs, and instantiates the real scene. The harness does not add a mutation hook to the shipped application. It writes `test-results/navigation-report.json`.

| Check | Result |
| --- | --- |
| All 49 ordered mission pairs, including same-location travel | Routes found; each segment sampled every 0.08 world units stayed clear of expanded collision footprints |
| 70 difficult start/target combinations | Passed after boundary-recovery fix; starts included building centres, a pyramid centre, map corners and narrow gaps |
| Real-time guided travel from the timeline past the pyramid to the excavation | Arrived, within the destination interaction area |
| Keyboard takeover during guided travel | Navigation stopped and manual movement resumed |
| Pausing during movement | Avatar entered Idle |
| FPS telemetry after a simulated one-second frame gap | Uses real elapsed time, not capped simulation time |
| Tight-gap camera screenshots | Explorer and navigable space visible using overhead fallback |
| Browser exceptions during isolated checks | None |
| JavaScript syntax check | `node --check src/world.js` passed |

The independent QA agent separately owns full lesson playthroughs and real UI route/revisit tests. Those results are distinct from the geometric checks above.

Local screenshots: `test-results/gameplay-art-route.png` and `test-results/gameplay-art-camera.png`, refreshed by the retained harness against the final changes. These are isolated-world QA captures without the pupil interface.

## Integration

Existing constructor, `start`, `guide`, `setSettings`, `setCompleted`, `celebrate`, `getPosition` and `guideTarget` usage are preserved. `guide(id)` additionally returns a boolean. A new read-only `getNavigationStatus()` returns `{status, waypoints, target}` for diagnostics. The application can expose this in its existing read-only snapshot if useful; it is not required for the player UI.

## Remaining limits

This remains a stylised prototype, not a certified or production game. Collision covers houses and pyramids, not every decorative pot, reed, NPC or temple prop. The compressed map is not a reconstruction of the historical geography. Camera obstacle volumes are conservative boxes, including pyramids, so the overhead view can activate earlier than a detailed mesh collision would require. Physically testing low-end school computers, tablets, touch ergonomics and motion sensitivity remains necessary. User testing should establish whether the tighter-space camera transition is comfortable before a pupil pilot.
