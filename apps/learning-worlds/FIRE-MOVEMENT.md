# Great Fire explorer movement

## Why this changed

Live play exposed a gap in the earlier QA: controls moved the explorer, but only within tiny station rectangles. The oversized avatar and obscuring controls made that technically passing behaviour feel stuck. Task completion tests did not establish meaningful exploration.

## Player behaviour

- Select Explore London. Hold the arrow buttons, arrow keys or WASD to walk. Drag the scene to turn the following camera.
- Both character models are normalized to 1.5 world units, with feet grounded on the street and sloping jetty entrance.
- Connected streets and the river jetty join all five discoveries. Buildings, tables, the river and map edges remain obstacles; this is a bounded interpreted London map.
- Approach an object and select Inspect discovery or press E. Clicking a distant discovery or Walk to discovery follows a safe route. Stop walking or manual input takes over without teleporting.
- Future places can be explored and heard, while assessed activities retain their sequence. Walking alone awards no gems and creates no assessed response.
- Release controls, leave movement focus, open a dialog, blur the window or hide the page to stop. Reduced motion keeps translation with a static pose and immediate camera positioning.
- The compact controls retain 44px targets. Discovery names and contextual instructions remain available at narrow screen widths.

## Verification

The 45 state/navigation tests cover measured real GLB height, grounded feet, all 25 guided station pairs, obstacle clearance, ramp height, stopping and manual takeover. Browser QA uses the actual published static folder, not a development-only build. It exercises meaningful manual travel, guided walking and interruption, proximity inspection, locked-place return, wrong/correct learning responses, evidence persistence and narrow touch layouts.

`tests/fire-exploration-qa.mjs` is the connected-exploration regression suite; `tests/fire-movement-qa.mjs` forwards to the stronger connected-exploration suite. Evidence is saved under test-results. Production checks follow GitHub/Vercel publication.

Desktop browser and emulated touch testing do not replace physical tablet or child usability sessions. Physical gamepad support is not included. Nile and Gunpowder Plot movement are unchanged.
