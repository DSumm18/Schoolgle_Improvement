# Great Fire explorer movement

David reported that the live London character did not respond to movement controls. A live browser reproduction confirmed it: the previous explorer only played automatic station-arrival animation. The previous chapter/task QA did not verify player walking.

## Player behaviour

- Click the London scene, then hold arrow keys or WASD. Large directional buttons support held mouse and touch input.
- Find my explorer focuses a closer view. Camera-relative input means right moves towards screen-right even after orbiting.
- Release, focus outside movement controls, open a dialog, blur the window or hide the page to stop. Story activities and native form controls retain their own keyboard behaviour.
- Walking is bounded to reviewed clear spaces at each discovery. Numbered story places remain the way to travel between discoveries. At a boundary the explorer idles and an explanatory prompt appears.
- Reduced motion retains manual translation with a static pose. No automatic camera easing or gait is needed to move.
- Walking does not award gems, complete tasks or record an assessed response. Existing practice records and lesson sequence are unchanged.

The explorer begins in the centre of each clear area; arrival motion stays inside it. Bounds allow room for the scaled model's feet around plinths, houses, rubble and the river jetty. This is local walking within the existing story scenes, not unrestricted travel through the whole city. Physical gamepad support is not included. Gunpowder Plot and Nile code are unchanged.

## Verification

38 state and movement tests pass, including five new movement tests for manual takeover, stopping, bounds, diagonal speed, reduced motion, settings resets and disposal. The real GLBs contain Idle, Walk, Run and Celebrate clips. Vite normal and hosted builds pass with the existing bundle-size advisory.

`tests/fire-movement-qa.mjs` verifies real position changes, keyboard release, focus/dialog isolation, held pointer capture, 320px touch end/cancellation, reduced motion and all five stations. It preserves the distinction between exploration and assessed history responses. Its optional completed-station run uses a prior genuinely played fictional Alex record. Supply `FIRE_QA_URL`, `FIRE_MOVEMENT_QA_DIR` and `FIRE_EARNED_STORAGE` for another environment.

Browser QA uses desktop Chrome and emulated touch, not a physical tablet or child usability study. Headless Chrome did not reproduce native window switching; the blur listener is explicitly tested using a dispatched blur event. Production routing and exact deployed movement are checked after GitHub/Vercel publication and recorded in the project memory.
