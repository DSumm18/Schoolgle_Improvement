# Independent Learning And Progression Review

Date: 6 September 2026. Reviewer: independent QA agent, separate from the implementation agent.

## Scope And Method

This review exercises a synthetic pupil's journey in a separate Chrome browser context against the local application. It does not access, reset or impersonate the user's existing game session. The test uses real visible controls and navigation, not injected completion flags, to earn the seven discoveries. The read-only diagnostic snapshot is used to verify evidence and gem totals.

Acceptance criteria: each chapter must require its learning stages before its reward; mistakes must not bypass those stages; a smaller-number scaffold must return to the original maths problem; progress, responses and support must persist accurately; replay must not duplicate gems; no later chapter may open before prerequisites. Export must preserve the recorded observations.

Runner: `node tests/independent-learning-qa.mjs`. Machine-readable evidence and screenshots: `test-results/independent-learning/`. The runner suppresses messages on the Vite development hot-reload WebSocket so an agent's concurrent source edits cannot reset the pupil midway through a task. Application modules and assets are served normally. Explicit reload tests still reload the application normally.

## What The Existing Seven Activities Actually Teach

| Activity | Required pupil actions before collection | What this can evidence | What it does not establish |
|---|---|---|---|
| Riverside garden | Open all three gates; choose why Nile-side farming was supported | Recognition of water and fertile silt supporting crops | General geographical understanding or an irrigation engineering skill |
| Harvest cargo | Share all 24 baskets equally among 3 boats; choose the correct explanation | A submitted equal-sharing representation, changes to quantities, connection to 24 ÷ 3 = 8 | Unaided calculation fluency, or the child's unobserved mental strategy |
| Scribe's message | Infer why a field is not ready; choose the relevant sentence | A supported inference and evidence selection from a short text | Reading fluency or decoding, particularly when read aloud |
| Timeline | Order pyramids, Tutankhamun and the 1922 excavation | Recognition of this particular historical sequence | Secure chronology across unfamiliar dates or the whole history curriculum |
| Shadow chamber | Predict; move the panel until its shadow fits; explain the observed pattern | Prediction, a model setting and an explanation connecting distance and shadow size | A practical experiment with physical materials, or a broad science attainment judgement |
| Archaeological dig | Uncover the replica; identify B2; explain recording context | A grid reference and recognition that location is evidence | Real excavation competency or a general coordinates assessment |
| Museum exhibition | Correct four labels/explanations | Recall of selected taught facts, distinguishing some false claims | Mastery after independent or delayed transfer |

These activities combine history, a specific mathematics objective, English inference and evidence, and a specific primary science investigation. They are a short cross-curricular expedition, not a complete Ancient Egypt unit or a whole-year maths scheme.

## Initial Findings Reported To The Builder

1. **Prerequisite integrity — fixed and independently checked:** `completeMission(freshState(), 6)` accepted a final-chapter completion without prerequisites, and saved completion arrays containing gaps were accepted. Normal UI controls were locked, but the state model was too permissive. The implementation agent added prerequisite validation and contiguous-prefix restoration. Independent checks now reject all six out-of-order completions, restore `[0,5]` as `[0]`, restore `[6]` as `[]`, and reject access to chapter 7 with only chapter 6 marked complete.
2. **Incomplete response detail — fixed and independently checked:** several events recorded only correctness. The irrigation answer, submitted timeline order, final museum explanation and return-check selected answer were not all present in exported observations. The final seven-mission run has zero response-detail gaps. Incorrect and corrected 18 ÷ 3 return responses are separately visible.
3. **Interpretation boundary:** retries and visible teaching mean a correct response is guided practice. Reports must preserve the initial incorrect attempt, access choices, hints, scaffold and retries instead of flattening them into a high percentage that implies attainment.
4. **Evidence trust boundary:** this is browser-local prototype data. Local-storage editing can never be ruled out by client-side checks alone. A school assessment service would require authenticated identities, authorised school associations and server-side event validation; export is not a secure school backend.

## Execution Status

The baseline whole-game run passed **18 checks**, recording **32 genuine UI attempts** including at least 15 deliberate mistakes. All seven tasks were earned, exported evidence matched every recorded observation, reload retained progress/evidence, replay did not duplicate gems, and no uncaught browser errors or failed HTTP responses occurred. It ran in a fresh 1440 × 900 Chrome context with reduced motion enabled.

Evidence: `test-results/independent-learning/report.json`, `practice-export.json`, `earned-progress.json`, `maths-model-and-reasoning.png`, `practice-record.png`.

An earlier run was interrupted by a development hot reload before the science task. A temporary test-harness attempt to suppress the Vite module itself caused a missing-export error and was discarded; the successful runner suppresses only development WebSocket messages. Neither issue is an application defect.

The expanded independent run passed **27 checks** covering the new Sphinx challenge and teacher features as well as repeating the entire seven-mission sequence. It used a second 1024 × 768 touch-enabled Chrome context restored from the same runner's genuinely earned two-chapter checkpoint.

- Empty bonus model and incorrect typed answer cannot advance or reward; refreshing an unfinished bonus retains attempts without awarding gems.
- Bonus completion requires a correct equal-sharing model, typed calculation and explanation. It adds 15 gems once, leaves completed core chapters at `[0,1]`, and does not unlock later core activities.
- Replay and reload retain 75 gems after two chapters and the bonus; no reward farming.
- Teacher views expose `15 ÷ 3 = 6` and `15 ÷ 3 = 5` with their different results and support. Export preserves the same actual evidence. Visiting the fictional school dashboard does not alter or contaminate it.
- The return check exposes the wrong and corrected `18 ÷ 3` responses separately.
- Teach together enables guided travel, survives reload and can be changed back.
- Keyboard activation, Enter submission and the tablet bonus layout operate; no horizontal dialog overflow was found at 1024 × 768. This is emulation, not physical tablet or assistive-technology certification.
- New bonus evidence includes its content version; earlier observations survive with an explicit legacy-unversioned marker rather than acquiring a false new-content identity.

The print action opened all evidence sections and produced a seven-page PDF. Text extraction and first/last-page visual inspection confirmed both calculations and the final bonus statement were retained. A print-polish issue was reported: a gold final page with one orphaned sentence and very narrow margins. **This is fixed and independently rechecked:** the final PDF uses a white background, clear page margins and a complete final section containing next teaching steps and the Sphinx summary. The 8,729 extracted characters include both the incorrect and corrected calculations; the final sentence is visible and not clipped.

After the print correction, a **10-check targeted final pass** repeated bonus, return-response, teacher/export, print and mode checks against the latest application, and additionally verified the teacher lesson-launch button preserves the earned two-chapter progress while starting guided mode. This is a targeted regression run, not 10 additional independent learning outcomes. No browser exceptions or failed requests occurred.

Targeted rerun command (PowerShell): `$env:NILE_QA_FEATURES_ONLY='1'; node tests/independent-learning-qa.mjs`. It uses the genuine earned checkpoints from the preceding whole-game run and writes `features-report.json`; it does not overwrite the 27-check full-run report.

Additional artifacts: `bonus-teacher-export.json`, `tablet-teacher-evidence.png`, `tablet-bonus.png`, `teacher-review.pdf`, `print-first-page.png`, `print-last-page.png`.

## Usability Observation

The maths model is legible and offers meaningful manipulation, but the teaching panels cover and blur almost all of the world. Much of the experience still resembles a worksheet opened inside a 3D map. The new build → typed calculation → explain bonus increases the variety of response, but visual polish alone does not establish the immersive educational game David wants. Pupil testing should look specifically at reading burden, independence, motivation and explanation of the method.

## Required Human Evaluation

Browser checks cannot establish that children find the world exciting, that pupils with particular access needs can use it comfortably, or that learning transfers into class. A teacher/pupil pilot should observe independent navigation, spontaneous explanation of the maths method, response to incorrect answers, and a short unfamiliar problem on a later day. These outcomes should guide the next iteration; gem totals should not substitute for them.

## 7 September 2026 — Visible Stones And Controls Demonstration

Independent bounded regression: **10 functional checks passed**, followed by **2 targeted layout checks** after the builder compacted the initial panel. Runner: `node tests/stone-sharing-qa.mjs`. The layout-only rerun uses `$env:STONE_QA_LAYOUT_ONLY='1'` with the same runner. Both restore the preceding independent suite's genuinely earned two-chapter checkpoint in isolated browser contexts.

Verified 15 unique persistent stone elements, initially all visible in a shared pile. A stone changes container and animates from pile to tray and back without a decorative duplicate. Eight rapid add/remove reversals, filling one tray with all 15 stones, and returning them all preserved the total after every action. Empty/full controls prevented overdraw.

The separate three-stone demonstration preserved a partial pupil model `[2,1,0]`, existing attempts and gems. It showed addition and return, restored focus to Show me how, and left no demonstration or delayed pupil mutation after closing midway through replay and waiting six seconds. Watching it did not create a correct assessed attempt; the next submitted pupil attempt carried the visual-demonstration support flag, including after reload.

Completing the physical-stone model still required the typed calculation and explanation before the one-time 15-gem reward. Replay and reload left 75 gems and the two core discoveries intact. Touch, keyboard Space, and reduced-motion controls operated; reduced-motion boards had no travel animations. All three tray controls worked at 1024px and 320px without horizontal dialog overflow. These are browser emulations, not physical-device certification.

The latest full-viewport 1024 × 768 screenshots were visually inspected. The pupil view shows the 15-stone pile, all three recognisable wooden trays, their add/remove controls and Check my model together. The demonstration shows its three-stone pile, all three trays and the return control together. The close control is visible in both. No browser exceptions or failed HTTP requests occurred in the functional run.

Evidence: `test-results/stone-sharing/report.json`, `layout-report.json`, `initial-board.png`, `board-320.png`, `tablet-initial-viewport.png`, `tablet-demo-viewport.png`.
