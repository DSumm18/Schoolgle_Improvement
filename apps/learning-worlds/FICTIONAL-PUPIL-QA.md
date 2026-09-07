# Independent fictional pupil QA — 7 September 2026

**Nile Quest and The Midnight Letter passed complete browser journeys and actual Alex demonstration runs.** Tests used isolated Playwright Chrome contexts, never the user's browser session. Alex is a made-up label on real automated game interactions, not a simulated human learning outcome. No pupil data was supplied.

## Executed evidence

| Run | Passed | Outcome |
|---|---:|---|
| `node tests/browser.mjs` | 18 | All seven Nile discoveries, return check, corrections, 210 gems, reload/replay and mobile controls |
| `node tests/plot-qa.mjs` | 20 | All five Plot discoveries, incorrect answers, source inspection, final recall, 100 gems, export, reload/replay, mobile and malformed-save defence |
| `node tests/fictional-pupil-qa.mjs nile` | 19 | Full fresh Alex Nile journey and exact response export; normal earned save unchanged |
| `node tests/fictional-nile-bonus-qa.mjs` | 3 | Alex's Sphinx model, typed answer, explanation and replay; 225 gems total; teacher guide and final export |
| `node tests/fictional-pupil-qa.mjs plot` | 15 | Full fresh Alex Plot journey, exact response export and normal earned save unchanged |
| `node tests/fictional-plot-recall-qa.mjs` | 7 | New separate recall check, wrong/corrected answers, support, elapsed context, reload, export, prerequisite gate and 320px layout |

These are overlapping scenario assertions, not 82 distinct product capabilities. Baseline runs had no browser exceptions or failed requests. Alex targeted checks had no browser exceptions. Screenshots were inspected for the Nile world, historic palace entry and small-screen return dialog. Source files were not edited by this QA agent.

## What Alex actually did and what was captured

| Learning activity | Observed evidence |
|---|---|
| Nile farming | Incorrect desert explanation, followed by water and fertile-silt explanation with corrective support |
| 24 baskets / 3 boats | Empty model rejected; 6 ÷ 3 scaffold completed; original 24 ÷ 3 target restored and completed as `[8,8,8]`; groups explanation selected |
| Scribe reading | Inference and supporting sentence selected separately |
| Egyptian chronology | Submitted order distinguishes Giza pyramids, Tutankhamun and the 1922 discovery |
| Light investigation | Prediction, panel setting and shadow-size explanation recorded |
| Archaeological context | Brushing followed by B2 grid response and reason to record position |
| Museum | Submitted labels and explanation; Egyptian excavation workers recognised |
| Sphinx bonus | Empty model rejected; `[5,5,5]` physical groups; typed `15 ÷ 3 = 6` rejected then `5` accepted; incomplete-total explanation rejected then corrected |
| Nile return | Wrong farmland answer and supported correction; new-number `18 ÷ 3 = 6`; new object-context question |
| Plot investigation | Distinct people/roles, warning-line selection, unknown-writer judgement, three clue inspections, submitted event order and causal explanation |
| Plot remembrance | Rhyme distinguished from eyewitness evidence; warning recalled; accurate account selected without collective blame |
| Separate Plot return | First answer incorrectly blamed all Catholics; corrected roles answer retained with retry and read-aloud support; warning and rhyme source-limit questions completed |

Nile's final download contains **28 activity responses plus four return responses**. Plot's final download contains **44 actions: 28 submitted responses and 16 unassessed observations**, including four separate return submissions. These counts include corrections and replay; they are not attainment percentages.

The 24-basket equation is generated from the submitted model. The Sphinx number is genuinely typed. Multiple-choice explanations capture a selection, not independent spoken or written reasoning. Selecting a Plot return option without pressing Check does not create an assessed response. Opening sources, reading aloud, inspecting clothing and editing timeline cards remain unassessed observations. Gems are awarded once and are unchanged by return practice.

## Review of history, curriculum and game framing

The central content agrees with the primary references checked: Ancient Egypt is one England KS2 civilisation depth-study option; KS1 significant events are a broader curriculum category rather than a mandatory Gunpowder topic. [DfE history programme](https://www.gov.uk/government/publications/national-curriculum-in-england-history-programmes-of-study/national-curriculum-in-england-history-programmes-of-study).

Monteagle's warning was anonymous and received on 26 October 1605, matching the game's source uncertainty and chronology. [UK Parliament](https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/the-gunpowder-plot-of-1605/overview/the-plot-and-its-discovery/discovery-and-flight/).

Tutankhamun's tomb was in the Valley of the Kings; its November 1922 discovery involved Carter and Egyptian workers. The game preserves both the location distinction and team contribution. [British Museum](https://www.britishmuseum.org/visit/object-trails/tutankhamun-ancient-and-modern-perspectives).

Visual judgement: Nile is recognisably Egyptian through river agriculture, palms, pyramids and inscribed monuments; the palette and characters are stylised. Plot is recognisably an old Westminster setting with period clothing and Gothic buildings. Both explicitly identify compressed reconstructions and invented/adapted material. They are themed educational prototypes, not photorealistic historical reconstructions. No central historical-accuracy blocker was found in this bounded check.

Nile combines history with selected Year 3 division/light and Years 3–4 comprehension. Plot provides history and reading comprehension; it does not assess maths or science. The teacher mapping accurately names this limited coverage and classroom follow-ups. Neither is a complete curriculum unit or a UK-wide mapping. Same-session success and corrected retries do not demonstrate delayed retention or a learning gain. Actual primary pupil usability, assistive technology and independent later transfer still need supervised evaluation.

## Review the actual artifacts

- [Alex Nile final practice JSON](test-results/fictional-pupil/nile/practice-record.json)
- [Alex Plot final casebook JSON](test-results/fictional-pupil/plot/casebook.json)
- [Nile final record screenshot](test-results/fictional-pupil/nile/alex-final-record.png)
- [Plot return record screenshot](test-results/fictional-pupil/plot/alex-return-record.png)
- [Plot teacher task map](test-results/fictional-pupil/plot/teacher-task-map.png)
- [Plot return check at 320px](test-results/fictional-pupil/plot/return-mobile320.png)

Saved Playwright states in the same folders contain only these fictional local test contexts. They can reproduce the earned record; do not import them into a real pupil's browser. Downloads correctly identify Alex as fictional. Earned normal-game saves were seeded alongside Alex and verified byte-for-byte unchanged after play and reload.

The record is local browser practice. No real school login, roster, pupil identity verification or secure school transfer was tested or implemented by this QA task. Browser Back works, but the baseline run did not prove an actual `pageshow.persisted=true` BFCache restoration.

Great Fire of London subsequently passed 15 independent browser scenarios, including all five discoveries, physical wall model, interrupted final recall, separate return practice, 100 gems, actual Alex export and resilience paths. See [FIRE-QA.md](FIRE-QA.md) and [Alex Fire casebook](test-results/fire/alex-casebook.json). Fire contributes history and supported English comprehension; it does not assess maths.
