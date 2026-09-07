# Nile Quest learning-design review

Reviewed and revised 6 September 2026 by the learning-design agent. This is an internal design and software review, not an independent evaluation of pupil outcomes. Read with [the teacher guide](TEACHER-GUIDE.md) and the integrated QA report.

## Release standard for this pass

A game action should apply a named idea. A reward should not bypass an unresolved explanation. Practice records should distinguish the response, the support and what the interface actually observed. Errors should prompt useful feedback and another attempt without penalties for speed or disability.

The first supervised audience remains teacher-selected Years 3–4 in England, with consolidation for older pupils. The seven chapters sample Ancient Egypt; they do not complete a whole history depth study or the UK-wide curriculum. No EEF endorsement, validated mastery judgement or White Rose scheme approval is implied.

## Defects corrected and learning improvements

| Finding | Change | Verification |
| --- | --- | --- |
| Loading one basket per boat displayed the false statement `24 ÷ 3 = 1` | Equation stays unknown until all 24 baskets form three equal shares | Unit test checks every partial equal load; real Chrome activity test passed |
| Boats primarily displayed numbers rather than manipulable units | Each loaded basket has a visible unit picture, with the quantity also named for assistive technology | Chrome checked three basket shapes after one sharing round |
| A correct cargo arrangement could earn the reward without relating the model to the calculation | Follow-up asks why three groups of eight account for the whole total; an incorrect explanation receives teaching and cannot finish | Chrome wrong-then-correct explanation flow passed |
| Completing the six-basket scaffold must not replace the original goal | Existing return to 24 preserved; scaffold and original task have separate objectives and reset action summaries | Unit and real Chrome scaffold-return checks passed |
| Shadow prediction could be entered after moving the control; an incorrect prediction could be rewarded without revisiting the idea | Control starts disabled; prediction unlocks investigation. Matching the outline then requires an explanation of the observed pattern | Chrome tested an incorrect prediction, manipulation, incorrect explanation and successful revision |
| Prediction, manipulation and explanation were combined as one evidence objective | Each shadow phase has a distinct objective and metadata; a wrong prediction is retained rather than silently changed | Chrome verified phase order and results `false, true, false, true` |
| Reading inference, supporting sentence and archaeology context were combined | These now have distinct objectives and response labels | Code review; integrated playthrough covers progression |
| Museum questions shared one broad objective | Each exhibition label now names its specific question in evidence | Code review; integrated playthrough covers progression |
| A corrupt save containing `correct: "false"` could be counted as correct | Saved evidence requires a boolean result, valid mission, nonempty objective and timestamp; arbitrary fields are discarded | Regression test passed; independent QA found the same defect |
| Replacing a museum question dropped keyboard focus onto the page body | New follow-up headings receive focus; timeline movement preserves focus on the moved card | Real Chrome Enter-key checks passed for museum, timeline and scribe |
| Rich observations could be mutated or misrepresented | Bounded whitelist records control actions, group quantities and response phase; saved copies are independent of later edits | Round-trip and mutation tests passed |

All ten learning unit tests pass. Three additional isolated real-Chrome activity and keyboard workflows passed, using the actual `buildChallenge` module and controls. These complement the separate complete-world playthrough; they do not replace pupil testing.

## What the records mean

Cargo evidence can now report how many individual loads, unloads and sharing rounds happened and the quantities in each boat at checking. These are observations of controls used. They do **not** establish that the child mentally used a particular calculation strategy or understood it independently. The sharing tool is recorded as support. The model explanation is another guided selection, with corrective feedback identified when required.

Science evidence separates an initial prediction, a successful control adjustment and an explanation. Predictions are hypotheses to investigate; a wrong initial prediction followed by evidence-based revision can be productive learning. A correct slider position alone is not a science attainment judgement. The model holds the lamp and screen fixed and varies the panel distance; follow with a physical investigation.

Reading evidence distinguishes the inference from its supporting sentence. Narration and read-aloud use must remain visible: success with listening does not establish independent decoding. Archaeology separates location recording from an explanation of context. Position is one source of evidence, not proof of exactly who owned an artefact or everything about its use.

Root integration accumulates support across a mission, records corrective feedback before later responses, and displays objective-level detail. Return-practice context is preserved through a reload as either a new-context question or explanation and retry. Browser storage is user-editable and these records are not suitable as trusted statutory evidence.

## Coverage, exclusions and next learning work

| Domain | Implemented sample | Still needed before a stronger coverage claim |
| --- | --- | --- |
| History | Nile farming; scribes; chronology; Tutankhamun's tomb; excavation team; archaeological context | Broader society and achievements; comparison with other early civilisations; multiple authentic sources and supported interpretations |
| Maths | Equal-sharing objects, groups and equation; smaller-number rehearsal; brief new-number return check | Other representations, strategy explanation in the child's own words and independent transfer tasks |
| English | Short original fiction, inference, selecting evidence, subject vocabulary and narration | Decoding assessment, sustained reading, composition, spelling, discussion with observed reasoning |
| Science | Prediction, opaque object, shadow-size pattern and explanation | Hands-on observations, measurements, recording repeated results and wider science coverage |
| Retrieval | Museum consolidation plus three later-accessible questions with feedback | Parallel item sets, meaningful recorded delays, distinguishing first response from coached retries, independent delayed checks |
| Adaptation | Explicit settings, smaller-number scaffold, alternative controls, feedback and return to the target | Teacher-reviewed skill graph and varied tasks; no diagnosis from hesitation, mouse movements or disability settings |

A good next pilot asks pupils to explain a different sharing problem with counters and predict a real torch investigation outside the game. Keep enjoyment, navigation difficulty, support required and retained knowledge as separate observations. Do not infer learning benefit from play time, gem totals or completion alone.

## Sources checked

- [DfE science programme](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study): Year 3 light includes blocked light and changing shadow size. Lower KS2 enquiry also involves explanations and using observations. Current published text checked 6 September 2026.
- [EEF Improving Primary Science](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/primary-science-ks1-ks2): supports the rationale for scientific vocabulary and working scientifically. This is guidance informing the design; it is not evidence that Nile Quest itself is effective.
- The existing teacher guide links DfE history, maths and English, British Museum, Ashmolean and Griffith Institute sources. No museum lesson packs or images were republished in this pass; no narration introductions or historical claims were changed.
