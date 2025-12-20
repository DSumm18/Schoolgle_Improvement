# Plan: Ship the real Ed orb in the Chrome extension (MV3)

## Objective
Replace the placeholder CSS orb in the Chrome extension with the real `@schoolgle/ed-widget` (3D orb + voice + Gemini), gated by auth/subscription, with graceful fallbacks.

## Steps
1) Bundle the real widget for MV3
   - Use the existing `packages/ed-widget` build.
   - Produce an IIFE bundle consumable by the content script (MV3 disallows ES modules).
   - Inject into a shadow DOM container to isolate styles.

2) Auth + subscription gating
   - Reuse `/api/auth/verify` and `/api/subscription/check`.
   - Initialize Ed only when user is authenticated and has an active/trial subscription.
   - Pass tool context via `setToolContext` (already in Ed core).

3) Voice and permissions
   - Request mic permission only on explicit user action (click).
   - Ensure autoplay rules are respected: start audio only after interaction.

4) Performance & fallback
   - Lazy-load the widget bundle; defer heavy init until user opens Ed.
   - Detect WebGL; if unavailable or failure, fall back to the CSS orb with a notice.

5) Build pipeline updates
   - Extend extension build (esbuild) to include the widget bundle and assets (textures/shaders).
   - Keep content script non-module; inject the IIFE runtime.

6) Testing
   - Chrome MV3 manual test: auth flow, subscription gating, tool context, mic prompt, voice reply.
   - Verify no console errors, acceptable load time, and fallback behavior.

## Exit criteria
- Real Ed orb renders in extension, with voice enabled after user interaction.
- Auth + subscription enforced; no access without valid trial/active plan.
- WebGL failure shows CSS fallback, not a blank state.
- Build remains MV3-compliant and load performance is acceptable.

