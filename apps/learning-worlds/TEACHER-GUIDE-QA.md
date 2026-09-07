# Teacher guide and return-check review

Reviewed 7 September 2026. Scope: Nile Quest and The Midnight Letter. Fire implementation is outside this review.

## Shipped changes

- Both grown-up views now explain the intended learning, actual task, captured response and suggested classroom follow-up. Nile includes seven core tasks, the Sphinx bonus and separate return practice; Plot includes five chapters and an optional return check.
- The guide distinguishes a generated boat equation from an entered Sphinx answer, a selected explanation from spoken reasoning, and an exploration action from an assessed response. Nile records also display submitted model-action counts where retained.
- Existing Alex demo controls are integrated. Alex is fictional, but this mode records actual game interactions in a separate save. The Nile school-dashboard fixtures remain explicitly invented examples, separate from Alex’s activity record.
- Plot’s report shows response/action counts, learning focus, response text, correction/support and timestamps. Its JSON export includes the parent implementation’s fictional-learner metadata.
- After all five Plot discoveries, three optional return questions revisit Catesby/Fawkes roles, Monteagle’s warning and the limits of the remembrance rhyme. Feedback appears after submission. Each attempt saves question, answer, retry number, support, timestamp and elapsed time from the latest retained final explanation. A retained return entry preserves that anchor if older teaching actions leave the 200-action window. If the anchor is unavailable, that is stated. No gems or mastery score are added.
- Shared `researchRationale()` and `schoolAccessGuide()` can be reused by other adventures. No Fire file was edited.

## Verification evidence

Targeted headless Chrome checks used isolated browser contexts on the existing local development server. They did not change David’s browser saves.

| Check | Result |
|---|---|
| Fresh Plot: return check unavailable before completion | Passed |
| Real fresh Plot play: choose an outfit; submit an incorrect James I role, then correct it | Both responses and the correction support appeared in the casebook; no discovery awarded prematurely |
| Alex isolation during that actual play | Normal Plot save remained absent |
| Complete-state return branch | A clearly synthetic test setup supplied completion and a previous-day final timestamp; four subsequent answers were actual browser interactions |
| Return question behaviour | Submit disabled until a choice; feedback empty before submission; wrong then correct retained separately; retry support only attached to the later answer |
| Return export and reload | Four return submissions survived reload; JSON marked fictional learner, retained elapsed time; gems stayed at 100 |
| Teacher mappings | Nine Nile task cards and six Plot cards rendered; existing Nile report action still worked; one Alex banner per Nile panel |
| Record escaping | Hostile-looking objective text rendered as text, with no injected image; model-action counts were visible |
| Responsive display | Plot guide checked at 390×844 and 1024×768; no document horizontal overflow; mobile screenshot inspected |
| Runtime and syntax | No page errors in passing checks; all three changed JS modules passed `node --check` |
| Adjacent state regression | All five existing `tests/plot.test.mjs` tests passed |

One initial QA script attempted to enter the wardrobe without selecting an outfit and correctly met the disabled entry button. The script was corrected to perform the required choice, then passed. Development hot reload was isolated for the fresh-play check to avoid unrelated parallel edits interrupting the test.

The complete-state fixture tests the return branch, not the full journey. The independent game QA agent was separately asked to exercise the return check after a real five-chapter playthrough. This review does not establish learning effectiveness or accessibility for every assistive technology.

## Source and claim review

The app links directly to the published England [history](https://www.gov.uk/government/publications/national-curriculum-in-england-history-programmes-of-study/national-curriculum-in-england-history-programmes-of-study), [maths](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study), [English](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study) and [science](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study) programmes. The task mappings are our interpretation of selected objectives, not government certification. Gunpowder Plot is an optional topic choice; Egypt does not have a compulsory year-group placement.

Current primary EEF pages were rechecked: [metacognition, second edition, November 2025](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition), [digital technology, 2019](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/digital), and [teacher feedback, 2021](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback). The guide describes teaching applications and their limits. Neither game is EEF-endorsed or evaluated; automated feedback is an implementation choice rather than a demonstrated effect of this product.

The [DfE response to the curriculum review](https://www.gov.uk/government/publications/curriculum-and-assessment-review-final-report-government-response) sets out future plans. The guide distinguishes planned spring 2027 publication and September 2028 first teaching from the currently published programmes. Future objective compliance is not claimed.

The existing Plot narrative continues to distinguish Catesby from Fawkes, preserve uncertainty about the letter’s author, use the night of 4–5 November, and avoid collective religious blame. Reconstruction, adapted letter, later commemoration and unassessed costume exploration remain clearly labelled. Sources and the earlier detailed review are in `GUNPOWDER-EDUCATION.md` and `PLOT-CLOTHING.md`.

## Remaining boundaries

There is no connected school login, pupil roster, cloud assessment dashboard or secure family transfer. The £300 annual school offer remains a proposed pilot price. One device’s evidence cannot identify individual pupils in a shared-screen lesson. Selected answers and retries need a teacher’s independent new-task check, preferably with later follow-up, before any attainment or retention judgement.
