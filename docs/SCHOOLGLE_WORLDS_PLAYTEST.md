# Schoolgle Worlds website playtest

Schoolgle Worlds is an optional public section of the existing Schoolgle website.
The release adds a desktop/mobile navigation link and `/worlds`, with three free
prototype adventures. It does not connect pupil accounts or school databases.

## Entry points

- `/worlds` — introductory page, game choices, family/teacher information.
- `/worlds/play/index.html?game=nile&demo=1` — Nile Quest.
- `/worlds/play/index.html?game=plot&demo=1` — The Midnight Letter.
- `/worlds/play/index.html?game=fire&demo=1` — The Great Fire of London.
- Replace `demo=1` with `view=example` to inspect a completed fictional record.

The website's play links use the fictional learner Alex. Actual choices made
during the playtest populate a separate local browser save for each adventure.
These are practice observations, not verified pupil records or attainment scores.
The grown-up view can inspect and export responses and clear Alex's practice.
There is no server sync, pupil registration, school access or messaging in the games.
The website landing page retains the existing marketing-site layout; each game is
a separate static document, outside the platform's React/auth/widget tree.

## GitHub → Vercel

The existing root `vercel.json` installs the locked game dependencies alongside
the platform, then calls `node scripts/build-worlds.mjs` before the existing
platform build. That script runs Vite in hosted mode and copies its output into
`apps/platform/public/worlds/play`. Generated output is ignored by Git; source,
original assets and dependency locks are versioned instead.

Hosted mode uses `/worlds/play/` for runtime models, portraits, fonts, JSON and
JavaScript. Prepared Microsoft desktop-voice WAV files are excluded from the
hosted output; optional narration uses the reader's browser speech service, with
the written text retained. This does not guarantee a voice on every device.
Third-party software/font licences ship with the game assets.

Vercel builds a branch preview first. Test its URL before merging the release
branch to `main`, which is the existing production branch. Do not deploy the
unrelated unfinished changes in another Schoolgle checkout.

## Verification

```powershell
npm ci --prefix apps/learning-worlds
npm test --prefix apps/learning-worlds
node scripts/build-worlds.mjs
# Build/start the existing platform using its normal non-production local setup.
$env:WORLDS_BASE_URL = 'http://127.0.0.1:4180'
node apps/learning-worlds/tests/worlds-hosting-qa.mjs
```

Hosting QA checks public entry, nested assets, all three first discoveries with
wrong/correct responses, read-aloud invocation, teacher evidence, reload, fictional
save isolation, narrow layouts, completed-example JSON, downloads and return links.
It rejects game requests to platform APIs, platform React bundles, root asset paths
or third-party hosts. Reports/screenshots are local under `test-results/`.
Use the same test against the deployed HTTPS origin before calling the link ready.

Full-game and educational design evidence remains in `apps/learning-worlds/`.
The playtest is selected England curriculum coverage, not a complete teaching
scheme or an EEF-endorsed product. Physical devices, specialist assistive
technology, child usability and learning outcomes still require supervised review.
