# Nested Schoolgle playtest release — 7 September 2026

The release app was copied from the working Learning Worlds prototype. It includes application source, public original game assets and fictional Alex example records, tests, authoring scripts, final Blender source files and relevant review documents. Generated outputs, node_modules, test-results, Blender backup files and credentials were excluded from the curated source copy.

## Build contract

- `npm ci --workspaces=false` (Node 20.19+ / 22.12+).
- `npm test`: **33 passed**.
- `npm run build:hosted`, equivalent to `vite build --mode hosted --base /worlds/play/`: **passed**.
- Root website pipeline copies generated `dist` to its static mount. No dist is committed.
- Normal development and ordinary `vite build` retain the root base `/` and prepared local audio. Hosted mode sets the browser-speech flag and removes only generated WAV files from the output.

## Assets, routing and narration

`src/asset-paths.js` supplies the configured Vite base for models, portraits, audio and example JSON fetch/download links. `index.html` sets its HTML base to the configured `index.html`, so query-only game, example and Alex links work even if the entry URL omitted its trailing slash. Home links explicitly target `./index.html`. CSS font URLs and JavaScript chunks use Vite’s built base.

Hosted narration uses browser speech synthesis. Prepared desktop-voice WAV redistribution terms remain unresolved; those WAV files are absent from hosted output and no hosted playback requests them. Browser voice availability depends on the device. Written instructions remain visible.

Three.js MIT and DM Sans / Fraunces SIL Open Font License texts accompany the distribution under `licenses/`. Public PNG images are explicitly allowed by the app gitignore despite the monorepo screenshot exclusion. Final Blender files remain authoring source, outside public output.

## Browser artifact checks

`node tests/nested-artifact-smoke.mjs` exercises the real compiled bundle through a test-only static route. **All checks passed**, with no missing assets, browser exceptions or requests escaping `/worlds/play/`:

1. A no-trailing-slash entry produces explicit nested index links and preserves fictional Alex mode.
2. All three game renderers start; Nile models, sphinx and portraits load.
3. All three completed Alex example pages fetch and download their nested JSON.
4. Hosted read-aloud invokes browser speech and makes no WAV request; generated output contains zero WAV files.

This artifact check is separate from the independent `tests/worlds-hosting-qa.mjs` website test, which verifies the actual platform route, headers, interactions and save isolation after the root pipeline mounts the build. Historical review documents refer to earlier local prototypes, not proof of a public deployment.

Teacher sharing copy now distinguishes local previews from hosted playtests. There remains no connected pupil account, staff authentication or cloud school dashboard. Sharing a link does not share a browser’s saved responses.
