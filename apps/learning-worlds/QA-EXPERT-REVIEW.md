# Independent QA review — Nile Quest

Review date: 6 September 2026. Role: independent QA/accessibility agent in the Schoolgle development team. This is an internal prototype acceptance review, not external certification, studio accreditation or a school release approval.

## Scope and method

Test the child-facing result: a child can complete the seven-mission expedition, revisit locations without getting stuck, read and operate challenges on a narrow screen, and see an honest practice record. The risky assumptions were that a successful forward playthrough proved return navigation, that desktop layouts implied mobile usability, and that stored data could be trusted.

Tests use installed real Google Chrome through Playwright. Desktop viewport is 1440×900; narrow touch emulation is 320×568 with the larger-text setting. Progress is earned by using visible game controls. The saved browser state used for revisits comes from that real playthrough; no completion injection, teleport or direct state mutation is used to pass gameplay tests. Corrupt storage is deliberately injected only in the explicitly named resilience tests.

The initial live-development run was invalidated by Vite hot reloads during concurrent edits. Those failures are not classified as game defects. The repeatable run uses an isolated production build under `test-results/expert/dist` on localhost port 4175. Build output stays inside the QA-owned directory.

## Defects found and addressed

| Priority | Reproduction and observed impact | Resolution / evidence |
|---|---|---|
| P2 | At 320px with larger text, cargo dialog had scroll width 328px against client width 305px. Basket count and right boat edge were cropped. | Grid tracks now shrink properly; narrow boat controls stack at 44px. Retest: 305px/305px. Visually checked `fixed-mobile-1.png`. |
| P2 | Same configuration: timeline dialog 316px against 305px, with right edge clipped. | Narrow reorder controls stack. Retest: 305px/305px. Visually checked `fixed-mobile-3.png`. |
| P2 | Informative small text used foreground colours giving approximately 3.07–3.85:1 against the cream dialog. | Informative labels/instructions darkened. Decorative and disabled elements are separate from this finding. This is a targeted contrast improvement, not a complete contrast audit of every animated scene. |
| P2 | Stored evidence with `correct: "false"` was counted as correct and an object-valued support field displayed `[object Object]`. | Evidence loader now requires boolean correctness, valid mission/date, and bounded fields; malformed observations are rejected or normalised. |
| P2 | Keyboard activation of a museum answer removed the focused button and left focus on BODY, rather than the next question. | Challenge transitions now focus their new question headings; timeline reorder retains card focus. Root also addresses the equivalent return-check transition. Final targeted retest recorded separately below. |

The gameplay engineer separately found and replaced the old approximate route bypass and collision shapes. This review checks those fixes from the actual map UI rather than relying on the pathfinding algorithm's own test results.

## Acceptance evidence

The machine-readable results are `test-results/expert/report.json` (57 passed checks, zero failures and zero uncaught page errors) and `test-results/expert/targeted-report.json` (six passed checks after the final focus corrections, zero failures). Screenshots are in the same directory. The test entry point is `tests/expert-qa.mjs`.

The long navigation run used the frozen build before the final question-focus and FPS-telemetry changes. The final targeted run rebuilt current sources, then rechecked changed focus behaviour, true touch interactions and typed-save validation. No further source changes were made by this reviewer. The full build completed; Vite reported its existing large-chunk advisory (approximately 710KB JavaScript, 189KB gzip), not a build failure.

| Area | Acceptance condition | Evidence status |
|---|---|---|
| Playthrough | All seven missions, including new cargo and shadow explanation steps, finish through visible controls; total is 210 gems | Passed on isolated build |
| Keyboard/modal handling | Nested report restores journal focus; dialog pauses held movement; tab traversal stays modal; manual input cancels guidance | Passed on isolated build |
| Navigation | Every one of 42 ordered pairs of different mission destinations reaches its location and guided travel stops | 42/42 passed through map UI |
| Narrow layout | Six distinct mission interfaces remain within 320px larger-text dialog and enabled controls are reachable | 6/6 passed; cargo and timeline targeted screenshots visually checked |
| Save resilience | Malformed correctness cannot count as correct; saved position normalises to world bounds | Passed; final typed-correctness retest uses a valid timestamp so rejection is not merely date validation |
| Missing asset | Missing non-player GLB gives explicit load failure and recovery action | Passed with deliberately missing curator GLB |
| Visual review | Narrow cargo/timeline controls remain readable, all controls visible when scrolled; no right-edge clipping | Passed targeted screenshots |
| Question focus | Keyboard Enter advances museum and return challenge to a focused next-question heading | Both passed on final rebuilt source |
| Touch operation | Third boat load/unload, timeline reorder and alternative excavation brush work at 320px with larger text | Three real Chrome touch-emulation interaction checks passed |

## Running the checks

From this application directory:

```powershell
node node_modules/vite/bin/vite.js build --outDir test-results/expert/dist
node node_modules/vite/bin/vite.js preview --outDir test-results/expert/dist --host 127.0.0.1 --port 4175 --strictPort
# In another terminal:
$env:NILE_QA_URL='http://127.0.0.1:4175'
node tests/expert-qa.mjs
# After the full run has earned and saved its progress, targeted regression checks:
$env:NILE_QA_TARGETED='1'
node tests/expert-qa.mjs
```

The test defaults to the normal dev server at port 4173 when `NILE_QA_URL` is absent. Use a frozen build for a release candidate; a development hot reload can interrupt any browser playthrough.

Targeted mode reuses the browser state earned by the full run at the same origin. Clear `NILE_QA_TARGETED` before running the complete suite again. The QA-only 4175 preview and isolated agent-browser session were closed after verification; the normal user-facing server is managed by the project lead.

## Remaining acceptance boundaries

- Real school Chromebooks, older iPads/Safari and low-powered integrated graphics still need testing. Headless desktop Chrome and touch emulation do not prove device performance or touch ergonomics.
- Test with pupils and teachers, including screen-reader, magnification, switch-access and colour-vision needs. We have checked controls and selected focus/reflow behaviours; we have not established complete WCAG 2.2 conformance.
- A correct guided answer is evidence of an observed response in context. It does not establish independent mastery, long-term retention, a diagnosis, or a measured educational benefit.
- Local save corruption is recoverable. This prototype is not an authenticated school assessment record, and browser-local data is not tamper-proof.
- There is no live pupil database, school matching, messaging or public user account rollout in this reviewed build. Those require separate implementation and security/privacy acceptance.

Reference criteria used for the targeted accessibility review: [W3C minimum contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). The former requires at least 4.5:1 for normal text, subject to its defined exceptions. The latter informs checking text/interface reflow at 320 CSS pixels; a 3D scene's inherent spatial layout is not a substitute for readable task controls.
