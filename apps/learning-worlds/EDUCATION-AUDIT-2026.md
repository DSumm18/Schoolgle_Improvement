# Nile Quest: independent education and school-offer audit

Reviewed 6 September 2026. Scope: England, principally teacher-selected lower KS2 pupils; this is not a UK-wide curriculum certification. This audit records the baseline inspected before the current enhancement work. Recommendations below are not claims that those features have shipped. The integration lead should add a dated implementation note for changes made in response.

## Decision

Nile Quest is a cross-curricular practice adventure with genuine maths, English and science tasks inside an Egyptian setting. It is suitable for a supervised prototype pilot, subject to a teacher checking fit for their pupils. It is not yet a complete Ancient Egypt unit, an independent assessment of mastery or a production school reporting service.

The greatest educational improvement is to make the chain visible: **objective → child's actual model/response → support used → explanation → a later, different problem → teacher follow-up**. More gems should celebrate a new accomplishment, not disguise repeated guessing as attainment. Visual spectacle can invite exploration; it cannot supply evidence of learning by itself.

## What children actually do

This is an inspection of `src/content.js`, `src/challenges.js`, `src/learning.js`, `src/main.js` and `TEACHER-GUIDE.md`. Runtime completion is being tested separately by the independent gameplay agent; this document does not claim to have observed pupils or run the full browser journey.

| Discovery | Required learning interaction in the inspected implementation | Useful evidence | Limits / missing evidence |
|---|---|---|---|
| 1. River garden | Open all three numbered gates; choose why farming took place beside the Nile; collect | Correctness, objective and accumulated support | Opening instructed gates tests control use, not irrigation reasoning. Actual chosen explanation and gate sequence were not captured. |
| 2. Harvest cargo | Distribute all 24 baskets into three equal boats; check; choose an explanation linking three groups of eight to the whole; collect | Three boat values, load/unload counts, sharing-tool rounds, model and explanation attempts | No typed calculation. The equation is supplied by the game. Clicking the sharing tool eight times is observable action, not proof of a mental method. Optional 6÷3 rehearsal returns to 24÷3 before completion. |
| 3. Scribe | Read/listen to a fictional message; infer why the second field is not ready; select the sentence supporting the answer | Both selected responses, separate inference/evidence objectives, read-aloud context | A short, strongly cued comprehension sample. Does not assess decoding when heard, extended reading, writing, spelling or handwriting. |
| 4. Timeline | Order pyramids around 2500 BC, Tutankhamun around 1330 BC and discovery in AD 1922; collect | Correctness/retries | Submitted order was not stored. Only three anchors; no explanation of elapsed time or wider chronology. |
| 5. Light chamber | Predict; adjust a panel until its shadow matches; choose an explanation; collect | Prediction, distance setting, manipulation result and explanation separately | Incorrect predictions appropriately permit investigation. Matching can be achieved by trial and error. No measured comparison table or practical science evidence. |
| 6. Excavation | Brush replica, select centre square B2, explain why find position matters; collect | Grid answer and context explanation | A letter-number grid is not evidence of formal Cartesian coordinates. Guided brushing is an access option, not an academic error. |
| 7. Museum | Select three accurate labels and finish the archaeological-context explanation; collect | Label responses and retries | Final explanation choice was not stored. This is near-term retrieval from earlier teaching, not independent long-term retention. |
| Return check | After all seven discoveries, answer three new-context questions: farmland, 18÷3, recording an object | Date, question index, correctness and retry support | Selected answers were not stored; no minimum interval; only three fixed items, no calculation process and no extra gems at baseline. |

All seven core discoveries have a completion gate in the visible activity flow. The intended sequence requires the preceding discovery. Each grants 30 gems once. Replays are possible. `completeMission` itself only checks a valid, previously uncompleted ID; local browser state is not a tamper-proof school assessment record. Browser automation passing every gate would establish functional completion, not educational understanding.

## Curriculum fit: current requirements

**History:** England's KS2 programme requires an overview of the earliest civilisations and a depth study chosen from four options, including Ancient Egypt. It does not prescribe an Egypt lesson list or a particular primary year. The game contributes chronology, Nile farming and reasoning about archaeological context. It does not cover the overview of other early civilisations or sufficient society, achievements, change, varied sources and interpretations for a complete depth study. Tutankhamun and Carter are useful school choices, not individually named statutory requirements. [DfE history programme](https://www.gov.uk/government/publications/national-curriculum-in-england-history-programmes-of-study/national-curriculum-in-england-history-programmes-of-study).

**Maths:** The main calculation relates to Year 3 multiplication/division facts for the three-times table and representing/solving division problems; smaller-number sharing revisits earlier foundations. It samples one operation and one representation. It does not establish fluent recall, the full Year 3 multiplication/division programme, Year 4 tables, formal written methods, measurement or fractions. More demanding problems should deepen understanding before automatically advancing age labels. [DfE maths programme, Year 3 multiplication and division](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study).

**English:** The scribe activity practises lower-KS2 comprehension, inference and selecting evidence. Vocabulary and narrated explanations support access and discussion. Selected sentences are not pupil composition; listening cannot establish independent reading accuracy. Add an adult discussion prompt and a short pupil-authored museum label if writing becomes an explicit objective, assessed separately. [DfE English programme, Years 3–4 comprehension](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study).

**Science:** Opaque objects blocking light and patterns in changing shadow size map directly to Year 3 light. The simulation provides a prediction-and-observation opportunity, but covers only part of light and working scientifically. A real torch, opaque object and fixed screen, with observed measurements, should follow. Do not claim real investigation competence from moving a slider. [DfE science programme, Year 3 light](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study).

**Cross-curricular learning already has a basis:** the current framework asks teachers to develop mathematical fluency/reasoning through relevant subjects and language, reading, writing and vocabulary throughout teaching. David's proposal fits this direction. Give each task one main learning aim and one purposeful supporting aim; a setting or a subject badge alone does not teach a subject. [DfE national curriculum framework, sections 5 and 6](https://www.gov.uk/government/publications/national-curriculum-in-england-framework-for-key-stages-1-to-4/the-national-curriculum-in-england-framework-for-key-stages-1-to-4).

The original resources are not White Rose products. Any future scheme mapping needs the scheme edition, named block/small step, representation agreement and teacher review; permission is needed for reuse where applicable. Do not advertise White Rose approval or a partnership without it.

## EEF: what supports the design, and what does not

| Source checked | Design implication for this game | Claim boundary |
|---|---|---|
| [Using Digital Technology to Improve Learning, 2019](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/digital) | Choose technology for a clear teaching problem. Use manipulatives to make equal groups visible; show teachers interpretable attempts. | A 3D world is not automatically better teaching. |
| [EEF EdTech evidence review, July 2025](https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/edtech-interventions-for-disadvantaged-pupils), with [EEF's interpretation](https://educationendowmentfoundation.org.uk/news/effectiveness-of-edtech-reflections-from-new-review) | Plan teaching, feedback, adaptive support, inclusion and implementation together. Offer school access rather than depending on home devices. Evaluate different pupil groups. | The review discusses game-based learning but does not validate Nile Quest. EEF reports a smaller average effect for disadvantaged pupils within a more limited evidence base; free access alone does not establish equity. |
| [Metacognition and Self-Regulated Learning, second edition, November 2025](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition) | Explicitly model planning, checking and evaluating within the maths task. Ask “How will you share fairly?”, then “Are all used and all groups equal?”, then a reason. Fade help on a fresh example. | A generic reflection button is not the intervention. Toolkit effect sizes belong to the underlying research, not this product. |
| [Teacher Feedback to Improve Pupil Learning, 2021](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback) | Explain the misconception, provide an actionable next step and let the pupil use it. Preserve first and later attempts. | This concerns teacher-delivered feedback; transferring its principles to automated feedback is a design inference requiring evaluation. |

**Defensible wording:** “Designed around selected England curriculum objectives, with practice and feedback informed by EEF guidance.” Avoid “EEF approved”, “proven to close gaps”, months-of-progress promises or “mastered” based on game completion.

## Record understanding without pretending to read minds

The baseline saves anonymous practice in browser local storage under `schoolgle-nile-v1`. It keeps at most 200 main evidence events and a bounded return-check history. The practice view and JSON export are a local prototype record, not a school database. It is one save per browser profile; two children sharing that profile would share a record. Clearing the browser can erase it; another device does not automatically recover it.

Recommended event fields for the next reporting iteration:

| Field | Example / purpose |
|---|---|
| Stable objective and item/version | `maths.equal-sharing.3groups`, item `cargo-transfer-v1`; retain what was asked when content changes |
| Actual prompt and parameters | 18 baskets, 3 boats; distinguishes the original lesson from a transfer task |
| Phase and response | Model `[6,6,6]`; entered result `6`; explanation “3 groups of 6 use all 18” |
| Evidence provenance | Pupil selected/entered; tool-generated; teacher-observed; prevent confusing suggested answers with child work |
| Assistance before this attempt | Read-aloud/access settings separately from hint, worked example, smaller-number rehearsal and corrective retry |
| Outcome and timestamp | Correctness with rule version; first attempt and eventual success both visible |
| Session and interval | Guided lesson, same-session transfer or later-day check, with elapsed time rather than a vague “retained” badge |
| Next step | Teacher-reviewed suggestion tied to the observed gap, not a diagnosis |

Store the minimum event needed for a teaching purpose. Do not collect a stream of every mouse movement, infer SEND status from slow play or treat narration as lower attainment. A child's chosen method description is self-report; the basket actions are observation. A typed answer plus matching model plus explanation is stronger evidence than any one alone, but still calls for a different independent example and teacher judgement.

Before interpreting a record, distinguish **not attempted**, **model completed**, **correct with teaching support**, **correct on a new example**, and **teacher checked later**. A wrong prediction can be productive science. No comparative leaderboard or combined percentage should merge unlike history, maths, reading and navigation events.

## The extra-gem activity worth adding

**Integration addendum — later on 6 September 2026:** The lead implemented a 15÷3 Sphinx challenge after cargo, with a required equal-sharing model, typed quotient and selected explanation; it earns 15 gems once and leaves all seven core requirements intact. This is guided new-number practice, not independent mastery evidence. Core garden/timeline/museum and return-response capture gaps described in the baseline were repaired. New attempts carry a content version, older records stay unversioned, and bounded retention is disclosed. The teacher studio now includes actual attempt detail/export/print, a Teach together plan and mode, and a clearly labelled fictional school dashboard. Secure school accounts and publicly shareable hosting remain unimplemented. Final runtime evidence belongs in INDEPENDENT-LEARNING-QA.md; the recommendations below remain the original audit baseline.

Recommended small prototype: a **Sphinx maths challenge**, unlocked after the cargo discovery. It should feel like opening a secret seal, while requiring a recognisable mathematical accomplishment.

1. Present a fresh context and number, for example 18 parcels for three village stores. State the learning aim in plain language.
2. Ask for a plan: sharing one at a time or using a known three-times-table fact. Record this as a declared plan, not proven strategy.
3. Let the child construct equal groups and enter the quotient. Check both equal groups and using the whole total; do not fill the answer before submission.
4. Require an explanation connecting the groups, total and calculation. A second task can ask which incorrect model fails and why.
5. On difficulty, model six objects with a visible explanation, then return to the fresh target. Record the help; give another opportunity rather than discarding the original difficulty.
6. Award the bonus once for completing the full challenge, including supported completion. Offer practice replays without repeated gem farming. Never reward speed or refusing access support.

A later visit should use a parallel example rather than simply repeat the same choice positions. Gems should remain participation/accomplishment rewards; the teacher record carries the qualified evidence.

## What is coming, and how to prepare

The government's November 2025 response aims for the revised national curriculum to be published by **spring 2027**, with first teaching from **September 2028**. It commits to primary citizenship, stronger media/financial/climate literacy and a primary oracy framework. These are planned changes, not a basis for asserting that the present game meets unpublished objectives. [Government response, especially curriculum reform and implementation sections](https://assets.publishing.service.gov.uk/media/690b2a4a14b040dfe82922ea/Government_response_to_the_Curriculum_and_Assessment_Review.pdf).

The 2025 writing framework already offers practical primary guidance. Selecting a prepared answer does not meet a writing objective; a future museum-writing activity needs explicit teaching of sentences/composition and a teacher review route. [DfE writing framework](https://www.gov.uk/government/publications/the-writing-framework).

Product preparation is an architectural recommendation: version curriculum mappings independently from worlds; label current versus proposed mappings; retain the version used for each response; add teacher-led spoken explanation and evidence-source comparison; review official publications before each school release. Do not quietly relabel older evidence against new objectives. No automated recurring monitor has been created by this audit.

## How a school would use and buy it

**Education mode should mean a teaching workflow**, not an unexplained switch. The adventure teaches/practises selected objectives; a grown-up view explains those objectives, displays actual attempts and offers a next classroom task. A teacher-led mode could pause the world, demonstrate a method and later release a fresh attempt. Until implemented, label that as a proposed workflow.

At baseline, the entry is **For grown-ups** before play, and **Field notes → View practice record** during play. The record can be downloaded as JSON. There is no teacher authentication, class roster, separate parent access or paid backend. An enhanced local report is still not a secure school portal.

| Route | Useful offering | Access / sharing boundary |
|---|---|---|
| Free public demonstration | Anonymous gameplay and a clear teacher guide | Needs a deployed HTTPS address; `127.0.0.1` only reaches the visitor's own computer. Do not present the local URL as shareable with other schools. |
| Supervised pilot | A short teacher briefing, selected objectives, physical follow-up resources and a structured observation sheet | Start with test/anonymous records. Measure navigation, enjoyment and learning separately. |
| Proposed school subscription | Assignments, class overview by objective, pupil attempt details, support history, later checks, teacher observations and export | Requires authenticated authorised school roles, verified pupil links, server storage and tested tenant isolation; not yet shipped. |
| Proposed parent view | Child-specific practice summary and suggested conversation/activity | Verified adult-child relationship and explicit scope; no school-name lookup should expose child records. |

Suggested school proposition: **“An Egyptian adventure that gives children purposeful practice and gives teachers the actual responses needed to choose the next teaching step.”** The proposed £300 annual fixed price is a hypothesis to test for affordability, support cost and renewal value, not a validated business model. Be transparent about the paid reporting layer from the start, even when play is free. Do not charge on an implication of proven attainment uplift.

For a pilot, agree a few target objectives with two schools, observe children using their normal devices, use short baseline and post-play tasks outside the game, and return after about a week with parallel tasks. Record prompts and access support. Compare with teacher judgement and investigate discrepancies. A small pilot can improve usability and produce exploratory learning evidence; it cannot by itself demonstrate causal efficacy. Ask teachers separately whether the report changed what they taught and saved worthwhile time.

## Pupil linkage and data handling before real reporting

Prefer school-issued invitations linked to verified roster entries, with parent invitations sent through the school's established contact route. A typed school name, name/date-of-birth match or possession of a child's details is not sufficient authorisation. Keep a mistaken-link request pending, disclose no pupil history, and provide rejection/correction without deleting the child's work. Transfer between schools needs a deliberate authorised process.

URN identifies the school; UPN identifies a pupil in the relevant system. Neither is a password. A separate opaque application ID is preferable for routine game records; avoid collecting UPN or date of birth unless a justified integration requires it. [DfE school lookup](https://www.get-information-schools.service.gov.uk/Search), [DfE UPN guidance](https://www.gov.uk/government/publications/unique-pupil-numbers).

The ICO explains that the Children's Code may apply to edtech supplied through schools where the provider influences the purposes and nature of processing. School delivery is not a blanket exemption. Define actual controller/processor responsibilities, lawful basis, retention, deletion and access before enabling real records; do not assume parental consent is always the school's legal basis. [ICO edtech guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/the-children-s-code-and-education-technologies-edtech/), [DfE procuring EdTech guidance](https://www.gov.uk/guidance/data-protection-in-schools/procuring-educational-technology-edtech).

This is product design guidance, not a completed legal assessment. Parent messaging and open AI companions are separate features with additional requirements; neither is necessary to validate this learning game. Keep the current prepared, bounded character dialogue and no pupil-to-pupil communication while testing the educational proposition.

## Release evidence required for this iteration

- Independent browser journey through every core gate, including incorrect answers, the smaller-number scaffold, keyboard/tablet controls, reopen/reload and one-time rewards.
- Inspect exported data against actual selected answers and calculations; support must survive retries and return visits, and migrated records must not acquire invented responses.
- Bonus challenge requires all its stages; repeated play/reload cannot multiply rewards; mistakes do not permanently block learning.
- Teacher-facing claims name the sampled objectives and the evidence limits. No fake class roster, pupil identities or cloud sharing presented as real.
- A teacher/pupil pilot still needs to test comprehensibility, interest, subject accuracy and whether the learning transfers. Automated tests cannot substitute for it.

Baseline source fingerprints (SHA-256, 6 September 2026, 19:54 BST):

```text
src/content.js    63EE552C91EC6D5EACD72786B59C57135F106B0F6578B8428F28049B62875E14
src/challenges.js 4D2A1E919D10C5B2BF8C7CD618C426FBB5615A35B983A97A8A8076A4B6B5B594
src/learning.js   44ED36D1ACF3F27086DC53693F605267287BE445FDAA96AD8BA2B1806E35468A
src/main.js       980AD3B11E85DDE6CF4A38BEE42274C7BC7DE28402B763E5F3EA316931AFC646
```
