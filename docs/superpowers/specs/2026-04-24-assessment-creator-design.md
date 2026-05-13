# Assessment Creator Design

## Product Position

Assessment Creator is a Schoolgle-native assessment workflow for class teachers. It helps teachers create accurate, curriculum-aligned checks for understanding, while preserving teacher professional judgement.

The product is not positioned as "AI marks pupils" or "AI replaces teacher assessment". The product promise is:

> Schoolgle does the leg work. Teachers make the professional decisions.

Assessment Creator sits upstream of Trust Assessor and Ofsted Readiness:

```text
School curriculum
  -> Assessment Creator
  -> Assessment Evidence Passport
  -> Trust Assessor validation
  -> Ofsted Readiness evidence and actions
```

The first version should be Schoolgle-native and paper-first. Google Classroom and Microsoft Teams are optional delivery rails later, not the foundation of the product.

Paper-first is not a compromise. It is the practical primary-school delivery path. Many primary schools do not have enough devices for whole-class digital assessment, and teachers already understand paper test administration. The MVP must therefore support printed assessment packs, QR-coded pupil papers, scan intake, AI-assisted marking proposals, and teacher approval.

## Core Principles

1. **Teacher controlled**
   Teachers approve the assessment blueprint before any paper or digital check is issued. They can edit, reject, request changes, or lock the final version.

2. **Curriculum aligned**
   Assessment generation starts from what the school says it has taught. National curriculum and statutory assessment expectations are supporting signals, not the sole driver.

3. **Low-pressure by design**
   The product supports low-stakes checks, retrieval practice, diagnostic questions, unit checks, and statutory readiness. It should avoid making every activity feel like a high-stakes test.

4. **Evidence backed**
   Pupil judgements are linked to question-level evidence, curriculum objectives, misconception tags, and teacher review notes.

5. **Professionally safe AI**
   AI drafts and analyses inside Schoolgle's controlled environment. Schools avoid copying pupil or assessment data into general-purpose chat tools.

6. **Inspection useful, not inspection-driven**
   The workflow creates normal business evidence that Ofsted Readiness can reuse. It must not create paperwork just for inspection.

7. **Paper-first, digital-ready**
   Printed papers are mandatory for MVP. Digital pupil completion is a later enhancement once the paper round-trip is reliable.

## Research And Inspection Basis

Assessment Creator should cite and operationalise these public principles:

- EEF feedback guidance: effective feedback depends on careful formative assessment, timely feedback, and planning how pupils will use it.
- EEF feedback toolkit: feedback can have high impact, but method matters and workload must be considered.
- EEF metacognition guidance: pupils benefit when they plan, monitor, and evaluate their learning.
- DfE workload guidance: assessment, marking, planning, and data processes should not create unnecessary workload.
- Ofsted state-funded schools inspection toolkit from November 2025: inspectors consider achievement, curriculum and teaching, inclusion, and how leaders use internal assessment information to make decisions. Ofsted says schools do not need to produce inspection-specific documents and inspectors will not review internal tracking data itself, though they may discuss how leaders use it.

References:

- https://educationendowmentfoundation.org.uk/tools/guidance-reports/feedback/
- https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback
- https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
- https://www.gov.uk/guidance/reducing-workload-in-your-school
- https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information

## User Roles

### Class Teacher

Primary user for phase 1.

Responsibilities:

- Select class, subject, year group, term, and purpose.
- Confirm what has been taught.
- Review the assessment blueprint.
- Approve, edit, or reject generated assessment material.
- Review pupil outcomes and confirm professional judgements.
- Choose next teaching actions.

### Subject Leader Or Phase Leader

Phase 2 user.

Responsibilities:

- Review coverage across classes and year groups.
- Check moderation consistency.
- Spot over-assessment, gaps, and excessive pupil pressure.
- Approve shared assessment templates.

### Trust Or School Leader

Phase 3 user.

Responsibilities:

- View confidence in submitted assessment data.
- Compare cohorts and schools.
- Understand whether teacher judgements are supported by evidence.
- Use findings in Trust Assessor and Ofsted Readiness.

## Assessment Modes

### Quick Check

A short, low-stakes check for a lesson or recent sequence of lessons.

Purpose:

- Check understanding.
- Surface misconceptions.
- Inform the next lesson.

Expected length: 5 to 10 minutes.

### Unit Check

A more complete assessment at the end of a unit or half-term block.

Purpose:

- Validate coverage.
- Support teacher judgements.
- Produce evidence for class-level planning and moderation.

Expected length: 20 to 45 minutes.

### Retention Check

A prior-learning and retrieval check.

Purpose:

- Identify forgotten knowledge.
- Surface quick-win gaps.
- Check whether pupils still know content taught earlier in the year or in prior year groups.

This addresses the common issue where pupils lose marks on content they once knew but have not revisited.

### Statutory Readiness Check

A SATs-style or statutory-assessment-aligned check.

Purpose:

- Prepare pupils for format and expectations.
- Identify areas likely to affect statutory outcomes.
- Avoid overuse by clearly signalling pupil pressure and workload.

The UI must label this as higher pressure than a Quick Check or Retention Check.

Statutory Readiness should not be part of Pilot 1. It is commercially attractive but pedagogically higher risk because it can pull the product towards high-pressure testing. Pilot 1 should prove Quick Check, Unit Check, and Retention Check first.

## Generation Logic

The initial weighting should be configurable but default to:

- 60 percent: school taught curriculum
- 25 percent: national curriculum expectations for year group and term
- 10 percent: prior learning and retrieval
- 5 percent: statutory assessment readiness

This differs slightly from the earlier 60/30/10 model because retained prior knowledge deserves a named weighting. Schools can adjust the blend at assessment setup.

Every generated blueprint must show:

- Which objectives are being checked.
- Which content was recently taught.
- Which content is retrieval from earlier learning.
- Which questions are statutory-style.
- Estimated pupil pressure.
- Estimated teacher workload.
- Suggested feedback approach.
- Any coverage concerns.

## Commercial Model

The target price is **GBP 1,000 per school per year**.

This price is defended by positioning Assessment Creator as a maintained assessment service, not a static bank of papers. The annual licence includes:

- Assessment generation workflow.
- School-approved paper creation.
- Paper scan intake and AI-assisted marking proposals.
- Teacher review and approval.
- Assessment Evidence Passports.
- Trust Assessor confidence integration.
- Ofsted Readiness evidence mapping.
- Framework monitoring and question bank refreshes.
- Product updates and fair-use AI processing.

### Fair-Use Guardrails

The GBP 1,000 licence should include reasonable annual usage for a primary school:

- Core subjects first: reading and maths in Pilot 1.
- Normal termly assessment cycles.
- A defined scan-processing allowance.
- Additional scan volume or human QA sold as add-ons if required.

The commercial model should avoid unlimited-cost exposure from high-volume vision processing.

### MAT Pricing

Suggested MAT pricing:

- 1 to 4 schools: GBP 1,000 per school per year.
- 5 to 14 schools: GBP 800 per school per year.
- 15+ schools: GBP 700 per school per year.
- Premium trust analytics, human QA, or bespoke curriculum onboarding can be priced separately.

### Pricing Defence

The pitch is not "cheaper tests". It is:

> A maintained, teacher-controlled assessment evidence system that creates the evidence Trust Assessor and Ofsted Readiness need.

The price is justified by workload saved, better confidence in teacher assessment, reduced moderation burden, safer AI use, and improved evidence quality.

## Competitive Landscape

| Competitor | What they do well | Limitation | Schoolgle difference |
|---|---|---|---|
| NFER | Trusted standardised assessments and national benchmarking | Less flexible to a school's taught curriculum and does not create Schoolgle evidence passports | Curriculum-aware, teacher-controlled, evidence-linked, feeds Trust Assessor and Ofsted Readiness |
| Testbase | Large bank of test questions and past-paper style practice | Question bank is not an end-to-end assessment judgement system | Generates aligned blueprints, captures evidence, validates judgements |
| Rising Stars | Commercial assessment packs and resources | Static pack model, limited live intelligence loop | Maintained service with framework monitoring, scan marking, and trust confidence scoring |
| PiXL | Intervention and school improvement resources | More programme/community-led than automated assessment evidence engine | Schoolgle links assessment creation, marking evidence, Trust Assessor, and Ofsted Readiness |
| ChatGPT/general AI | Flexible drafting | Unsafe data risk, no school approval workflow, no evidence trail, no curriculum governance | Safe embedded AI with teacher approval, PII controls, and audit trail |

Sales answer to "How is this different from NFER?":

> NFER gives trusted assessments. Schoolgle gives schools a controlled system for creating curriculum-aligned assessments, capturing evidence, checking whether teacher judgements are supported, and turning that into trust and inspection readiness intelligence.

## Feasibility Pilots Before Phase 1

Three feasibility pilots must happen before full Phase 1 build. They are small, fast tests designed to kill risky assumptions early.

### Pilot A: Handwriting And Scan Accuracy

Question:

Can Schoolgle reliably read primary pupil handwritten answers from scanned paper assessments?

Test:

- Use 30 completed paper assessments from Grove or Hollingwood if available.
- Include mixed handwriting quality, crossed-out answers, blank responses, diagrams, and working-out.
- Test image capture from copier scan, phone photo, and batch PDF.
- Measure extraction accuracy by question type.

Pass target:

- 95 percent pupil-paper matching accuracy using QR codes.
- 90 percent answer extraction accuracy for short answers and multiple choice.
- Clear fallback path for handwriting that cannot be read.

### Pilot B: Mark Scheme Authoring Cost

Question:

Can Schoolgle produce structured mark schemes with misconception tags at an affordable authoring cost?

Test:

- Author 3 maths assessments and 3 reading assessments.
- Each question must include objective mapping, correct answer rules, partial-credit rules, common misconception tags, and feedback prompts.
- Measure consultant time and AI-assisted authoring time.

Pass target:

- Mark scheme authoring can be completed under a commercially viable time-per-paper threshold.
- Misconception tags are consistent enough to power useful class analysis.

### Pilot C: QR Scanning Round Trip

Question:

Can printed papers be matched back to class, pupil, assessment, and question responses without manual faff?

Test:

- Generate QR-coded papers for a class.
- Print, complete, scan as a batch PDF, upload, split pages, match pupils, and present marking proposals.

Pass target:

- Teacher can upload one batch scan and reach review screen in under 3 minutes.
- At least 95 percent of pages auto-match correctly.
- Manual correction UI is simple enough for non-technical teachers.

## Teacher Workflow

1. Teacher opens Assessment Creator from Teaching & Learning.
2. Teacher chooses class, subject, year group, term, and assessment mode.
3. Teacher selects or confirms taught curriculum coverage.
4. Schoolgle proposes an assessment blueprint.
5. Teacher reviews the blueprint and edits the blend, coverage, duration, and pressure level.
6. Schoolgle generates the assessment, mark scheme, coverage map, and teacher notes.
7. Teacher reviews the generated material.
8. Teacher approves, requests changes, flags concerns, or rejects.
9. Once approved, the assessment is locked as a school-approved version.
10. Teacher prints the paper pack or exports a PDF pack. Pupil-facing QR activation uses the existing Class Builder Pupil Pass, not a new assessment-specific pupil QR.
11. Pupils complete the paper assessment in class.
12. Teacher scans completed papers as a batch PDF or photographs them.
13. Schoolgle matches pages to assessment, class, and pseudonymised pupil IDs.
14. AI proposes marks, highlights uncertainty, and annotates responses digitally.
15. Teacher reviews proposed marking, accepts or edits marks, and confirms professional judgements.
16. Teacher selects next teaching actions.
17. Schoolgle creates or updates the Assessment Evidence Passport.

## Pupil Experience

The pupil experience should be calm and focused.

Design requirements:

- No high-stakes language unless the teacher explicitly selects statutory readiness mode.
- Clear question layout with one task at a time where possible.
- Accessibility controls for font size, contrast, read-aloud support where appropriate, and reduced distraction.
- No public rankings or competitive framing.
- Completion feedback should focus on next learning steps, not labels.

For MVP, pupils do not need individual Schoolgle accounts. They complete paper assessments. Pupil digital delivery is Phase 3 or later after paper scanning and teacher review are proven.

## Paper-First Marking Pipeline

The scan-to-review loop is a core differentiator and belongs in MVP feasibility and Phase 1 planning.

### Printed Pack

Each generated paper includes:

- A reference to the assessment/paper pack.
- The existing Class Builder Pupil Pass as the pupil-facing QR identity and launch route.
- Optional small page-matching marker for scan processing, hidden from the teacher-facing workflow where possible.
- Page number and paper ID.
- Human-readable fallback code.
- Clear answer boxes where possible.

### Pupil Pass QR Integration

Class Builder owns the stable pupil QR/pass identity. Assessment Creator should not create a second pupil QR that competes with it.

The intended contract is:

- Pupil upload/import creates or updates the canonical `pupils` row.
- Each pupil has one reprintable Pupil Pass with a hashed/encrypted access token and child-friendly codename.
- When a teacher opens an assessment, Assessment Creator publishes an active pupil activity linked to the assessment/class.
- When a pupil scans their Pupil Pass, `/pupil/start` resolves the active activity and routes them to the correct Class Builder survey, assessment, or lesson activity.
- Completed paper scans may still use page-matching markers, but those are operational scan metadata, not a separate pupil-facing identity.

### Scan Intake

Accepted inputs:

- Batch PDF from copier.
- Phone photos.
- Single PDF per pupil.
- Manual upload of marks as CSV fallback.

The system should:

- Split pages.
- Detect QR codes.
- Match pages to assessment and pupil.
- Flag unmatched pages.
- Store original scans securely.

Manual or CSV mark upload exists only as a fallback for failed scans, legacy assessments, or schools not yet using the scan workflow. It is not the primary MVP path.

### Vision Marking

AI-assisted marking must follow a PROPOSE -> APPROVE model.

AI may:

- Read answers.
- Compare against structured mark scheme.
- Propose marks.
- Highlight uncertainty.
- Suggest misconception tags.
- Add a digital red-pen style annotation overlay.

AI must not:

- Finalise pupil marks.
- Update teacher judgements without approval.
- Hide uncertainty.
- Override a teacher edit.

Teacher review UI must show:

- Original scanned answer.
- Proposed mark.
- Reason for proposed mark.
- Confidence level.
- Misconception tag if relevant.
- One-click accept/edit controls.
- Class-level "accept high-confidence objective items" only where safe.

## Pupil PII And Privacy Architecture

Pupil PII must be treated as a non-negotiable safety boundary.

Rules:

- Pupil names should not be stored in Supabase assessment tables.
- Assessment responses and evidence passports use pseudonymised pupil IDs.
- Pseudonymisation should follow the existing Schoolgle pattern: HMAC-SHA256 using a school-local salt where possible.
- If names are needed in the UI, they should resolve at display time from an authorised school system or encrypted/local context, not from plain-text assessment evidence rows.
- Scanned papers should be stored in a secure school-controlled storage path with short-lived signed access URLs.
- AI processing should receive only the minimum needed content, preferably pseudonymised page IDs and cropped answer regions rather than full pupil-identifiable documents.
- Logs must not contain pupil names, raw scans, or full answer text unless explicitly required and protected.
- Teacher exports should respect school permissions and retention policies.

Open implementation decision:

- Whether scan originals live in Google Drive, Supabase Storage, or another school-controlled evidence store. The design preference is school-controlled storage with Schoolgle storing metadata and signed references.

## Assessment Evidence Passport

This is the connecting data layer between Assessment Creator, Trust Assessor, and Ofsted Readiness.

Each passport stores:

- School, class, subject, year group, academic year, term.
- Assessment mode and purpose.
- Curriculum objectives assessed.
- Taught/retrieval/statutory weighting.
- Question-level tags.
- Pupil responses or marks.
- Misconception analysis.
- Teacher judgement before and after assessment, where available.
- Teacher approval and review notes.
- Next teaching actions.
- Evidence confidence score.
- Links to generated paper, mark scheme, and result summary.

The passport is the canonical evidence record. It should support pupil-level, class-level, cohort-level, and school-level analysis.

### Evidence Confidence Algorithm

The first scoring model should be transparent and deterministic.

Inputs:

- **Freshness**: how recent the evidence is.
- **Coverage**: proportion of relevant objectives assessed.
- **Depth**: mix of recall, fluency, reasoning, explanation, and application.
- **Question count**: enough questions per objective to support a judgement.
- **Marking confidence**: AI confidence plus teacher review completion.
- **Teacher override rate**: high override rates lower confidence until reviewed.
- **Response completeness**: missing, blank, or unreadable responses lower confidence.
- **Moderation status**: subject leader or peer review raises confidence.
- **Assessment mode**: Quick Checks support narrower claims than Unit Checks.

Draft thresholds:

- High confidence: recent evidence, broad coverage, sufficient question depth, teacher-reviewed marks, and low unresolved uncertainty.
- Medium confidence: evidence exists but is narrow, old, lightly sampled, or partially reviewed.
- Low confidence: limited, stale, incomplete, or weakly matched evidence.
- Mismatch: submitted school judgement materially differs from available evidence.

The UI must show why a confidence rating was assigned. Black-box confidence scores will damage trust.

## Misconception Tags As Product Moat

Structured misconception tagging is a core Schoolgle asset.

Each question should support:

- Objective tag.
- Skill tag.
- Expected answer.
- Partial-credit rules.
- Common wrong answer patterns.
- Misconception tag.
- Suggested teacher response.
- Retrieval recommendation.

Examples:

- `fractions_equivalence_confuses_numerator_denominator`
- `place_value_tenths_hundredths_reversal`
- `inference_answer_not_text_evidenced`
- `retrieval_previous_year_measure_conversion_gap`

Misconception tags power:

- Teacher next-step summaries.
- Class reteach recommendations.
- Trust Assessor evidence confidence.
- Ofsted Readiness evidence mapping.
- Future question selection.

## Trust Assessor Integration

Trust Assessor currently analyses submitted school assessment data and challenges whether the figures appear plausible. Assessment Creator strengthens the evidence base behind those figures.

New Trust Assessor capability:

- Compare submitted termly school data with Assessment Evidence Passports.
- Assign confidence to each class, cohort, subject, and school judgement.
- Identify unsupported or inflated judgements.
- Explain mismatch causes without accusatory language.
- Separate weak evidence from genuine contextual challenge.
- Surface retention gaps that may explain later statutory underperformance.

Confidence levels:

- **High confidence**: recent, balanced evidence supports teacher judgement.
- **Medium confidence**: evidence exists but has limited coverage, freshness, or question depth.
- **Low confidence**: judgement has little evidence, narrow evidence, stale evidence, or contradictory evidence.
- **Mismatch**: submitted judgement differs materially from assessment evidence.

Trust Assessor language must stay professional:

- Use "the evidence suggests" and "governors may want to explore".
- Avoid "the school inflated", "teacher failed", or personal blame.

## Ofsted Readiness Integration

Assessment Creator should feed Ofsted Readiness automatically.

Mapped evidence areas:

- Curriculum and Teaching: evidence that assessment checks whether pupils learn intended curriculum content.
- Achievement: evidence that pupils know more, remember more, do more, and are prepared for the next stage.
- Inclusion: evidence that SEND, disadvantaged pupils, and pupils with barriers are assessed accurately and supported.
- Leadership and Governance: evidence that leaders understand assessment quality and act on gaps without creating workload.

Ofsted Readiness should create tasks such as:

- "Year 4 maths has assessment evidence, but no linked next-step teaching actions."
- "Year 5 reading outcomes are submitted, but evidence confidence is low because recent assessments do not cover inference."
- "SEND pupils show recurring misconception patterns, but no linked adaptation or graduated response evidence is attached."
- "Statutory readiness checks are frequent; review whether pressure and workload are proportionate."

The app should explicitly avoid creating inspection-only artefacts. It should surface normal workflow evidence already created by teachers.

## Framework Monitoring Service

Framework monitoring is a named recurring product capability and a core pricing justification.

The service should monitor:

- National curriculum updates.
- STA assessment framework updates.
- DfE guidance changes.
- Ofsted inspection toolkit changes.
- EEF guidance updates relevant to assessment, feedback, metacognition, SEND, and disadvantage.
- Common sector signals that may affect statutory readiness.

Process:

1. Schoolgle tracks official source changes termly, with urgent updates when major guidance changes.
2. Changes are reviewed by a human curriculum/assessment lead before affecting live generation.
3. Question bank mappings and statutory-readiness assumptions are refreshed.
4. Schools receive a concise notification explaining what changed and whether action is needed.
5. Existing locked papers remain locked, but future generated papers use the updated framework assumptions.

This supports the commercial message that Assessment Creator is a maintained service rather than a one-off content bundle.

## Optional Google And Microsoft Delivery Rails

Schoolgle-native delivery is phase 1.

Optional later integrations:

- Google Classroom roster sync.
- PDF, Google Doc, and Word export.
- Google Classroom assignment creation.
- Microsoft Teams roster sync through Microsoft Graph Education APIs.
- Teams assignment creation and submission status sync.

These integrations should never become the source of truth. They are convenience channels only. Assessment Evidence Passports remain in Schoolgle.

V1 integration scope should be deliberately narrow:

- PDF export.
- Word export.
- Google Classroom roster sync if demand is clear.

Microsoft Teams, Google Docs export, and full assignment/submission sync should be V2.

## UI Direction

The app should feel:

- Beautiful.
- Clean.
- Professional.
- Google-like in simplicity.
- Low-faff.
- Teacher-paced.

Design language:

- Calm white/neutral surfaces with restrained Schoolgle accent colour.
- One primary action per screen.
- Clear stepper workflow.
- No dense AI prompt boxes for teachers.
- Use controls such as toggles, sliders, segmented controls, and simple review cards.
- Show the blueprint before the generated paper.
- Show pressure and workload as simple visual indicators.
- Keep teacher approval buttons prominent.

Suggested primary screens:

1. **Assessment Home**
   Recent assessments, quick create, class list, evidence confidence highlights.

2. **Create Assessment**
   Class, subject, mode, duration, curriculum coverage, and blend controls.

3. **Blueprint Review**
   Objectives, retrieval mix, statutory readiness, pressure, workload, and coverage warnings.

4. **Generated Paper Review**
   Questions, mark scheme, teacher notes, edit/request change/approve.

5. **Pupil Delivery**
   Schoolgle-native pupil assessment screen.

6. **Results And Judgement**
   Question analysis, misconceptions, group patterns, teacher judgement confirmation.

7. **Evidence Passport**
   Summary record used by Trust Assessor and Ofsted Readiness.

## Data Model Draft

Tables or equivalent Supabase entities:

- `assessment_creator_assessments`
- `assessment_creator_blueprints`
- `assessment_creator_questions`
- `assessment_creator_question_bank`
- `assessment_creator_responses`
- `assessment_creator_teacher_reviews`
- `assessment_evidence_passports`
- `assessment_framework_updates`
- `assessment_scan_batches`
- `assessment_scan_pages`
- `assessment_marking_proposals`
- `assessment_misconception_tags`

Important fields:

- `organization_id`
- `school_id`
- `class_id`
- `subject`
- `year_group`
- `academic_year`
- `term`
- `mode`
- `status`
- `curriculum_source_id`
- `approved_by`
- `approved_at`
- `locked_at`
- `evidence_confidence`
- `pressure_rating`
- `workload_rating`

PII note:

- Tables should store pseudonymised pupil identifiers, not pupil names.
- Scan metadata should reference secure storage paths, not expose raw public URLs.

Statuses:

- `draft`
- `blueprint_review`
- `generated`
- `changes_requested`
- `approved`
- `locked`
- `delivered`
- `reviewed`
- `archived`

## AI Boundaries

AI may:

- Draft assessment blueprints.
- Draft questions.
- Map questions to objectives.
- Suggest mark schemes.
- Read scanned responses.
- Propose marks.
- Propose misconception tags.
- Annotate scanned answers for teacher review.
- Identify likely misconceptions.
- Summarise patterns.
- Suggest next teaching actions.

AI must not:

- Lock or approve assessments.
- Make final pupil judgements without teacher confirmation.
- Finalise AI marking without teacher approval.
- Override school curriculum decisions.
- Present statutory prediction as certainty.
- Label pupils in a fixed or harmful way.

Every AI output needs teacher review before it becomes evidence.

## Phase Plan

### Phase 0: Feasibility pilots

Run handwriting accuracy, mark scheme authoring cost, and QR scanning round-trip pilots before committing to the full MVP build.

Goal:

- Prove that paper-first scan-to-review is technically and commercially viable.

### Phase 1: Schoolgle-native teacher workflow

Build the Assessment Creator entry point, create workflow, blueprint review, generated review UI, print/PDF output, QR-coded papers, scan intake prototype, AI marking proposal prototype, teacher review UI, and mock-backed evidence passport.

Goal:

- Prove the workflow and positioning.
- Make it feel beautiful and teacher-friendly.
- Prove that the product is more than a paper generator.

### Phase 2: Question bank and generation service

Add structured question bank, AI generation service, curriculum objective tagging, pressure/workload ratings, and teacher approval locking.

Goal:

- Make generated assessments credible and auditable.

### Phase 3: Pupil delivery and results capture

Add richer result capture, marking support, misconception analysis, teacher judgement confirmation, and optional digital pupil completion.

Goal:

- Create robust evidence across paper and digital workflows.

### Phase 4: Trust Assessor integration

Connect Assessment Evidence Passports to Trust Assessor confidence scoring and mismatch analysis.

Goal:

- Validate submitted assessment data against evidence.

### Phase 5: Ofsted Readiness integration

Map evidence passports to inspection areas, create readiness evidence links, and generate tasks for missing or weak evidence.

Goal:

- Turn normal assessment practice into inspection-ready evidence without additional teacher workload.

### Phase 6: Optional delivery rails

Add optional integrations once the Schoolgle-native loop works.

Goal:

- Fit into schools' existing delivery habits without giving up Schoolgle as the source of truth.

V1 scope:

- PDF export.
- Word export.
- Google Classroom roster sync if needed.

V2 scope:

- Google Classroom assignment creation.
- Microsoft Teams roster sync.
- Teams assignment creation.
- Google Docs export.

## Commercial Scheme Test-Harness Boundary

Named commercial schemes must not be used as product positioning, content sources, or visible alignment labels unless Schoolgle has a formal licence that permits that specific use.

Rules:

- Do not ingest proprietary commercial scheme content into the product question bank.
- Do not market papers as aligned to a named commercial scheme unless a formal licence allows it.
- Do not reproduce proprietary questions, schemes, lesson sequences, wording, images, worksheets, or protected structures.
- It is acceptable to use neutral Schoolgle-authored sample curriculum structures internally to test whether the product handles common school curriculum patterns.
- The product should describe alignment to the school's taught curriculum, not to an unlicensed commercial scheme.

## Open Decisions

1. Which subjects/year groups should Pilot 1 support first?
2. Which schools can provide completed paper assessments for handwriting, scan, and marking feasibility tests?
3. What curriculum source format should be supported first: manual objectives, uploaded curriculum document, existing school scheme, or imported plan from Lesson Studio?
4. Should the first pilots use Grove and Hollingwood assessment data as validation examples?
5. What storage model should be used for original scans: Google Drive, Supabase Storage, or another school-controlled evidence store?

## Recommended Pilot 1 Scope

Pilot 1 should support:

- Primary only.
- Reading and maths first.
- Years 4, 5, and 6 first.
- Quick Check, Unit Check, and Retention Check.
- Statutory Readiness as a labelled preview, not the primary mode.
- Teacher-generated and teacher-approved assessments.
- Printed QR-coded paper packs.
- Batch scan upload.
- AI-assisted marking proposals.
- Teacher marking review and approval.
- CSV result capture as fallback only.
- Evidence Passport generation.
- Trust Assessor confidence prototype.

This gives the product a strong story without overbuilding.

## Success Criteria

The product is successful when:

- Teachers say it saves time without removing their control.
- Teachers trust the assessment blueprint before the generated paper.
- Leaders can see whether submitted judgements are evidence-backed.
- Trust Assessor can distinguish plausible, unsupported, and mismatched data.
- Ofsted Readiness can surface assessment evidence without asking teachers for extra paperwork.
- Schools understand why the product is safer and more useful than using a general AI chatbot.

### Quantitative Targets

Technical:

- 95 percent scan page matching accuracy in Pilot 1.
- 90 percent answer extraction accuracy for supported question types in Pilot 1.
- 95 percent QR round-trip success rate.
- 100 percent of AI marks require teacher approval before finalisation.

Teacher value:

- Teachers report at least 30 percent time saved compared with creating and marking equivalent checks manually.
- 80 percent of pilot teachers agree that they stayed in control of assessment decisions.
- Median batch upload to marking review screen under 3 minutes.

Commercial:

- 3 pilot schools complete at least one full assessment cycle.
- 2 pilot schools agree the product is worth the target GBP 1,000 annual licence if accuracy targets are met.
- At least one MAT leader confirms Trust Assessor confidence scoring would strengthen data conversations.

Impact:

- At least 70 percent of generated assessments lead to a recorded next teaching action.
- At least 80 percent of reviewed assessments produce usable misconception or retrieval-gap insight.
- Trust Assessor can assign a clear evidence confidence rating for pilot cohorts.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Handwriting recognition is unreliable | Product becomes a paper generator only | Run feasibility Pilot A before build; limit supported answer types first |
| Mark scheme authoring is too expensive | GBP 1,000 pricing becomes weak | Run Pilot B; build reusable misconception taxonomy |
| QR round trip is fiddly | Teacher adoption drops | Run Pilot C; design manual correction UI early |
| Pupil PII leakage | Regulatory and trust failure | Pseudonymised IDs, secure scan storage, signed URLs, no pupil names in assessment tables |
| Teachers feel replaced | Adoption and brand risk | Teacher approval gates, professional judgement language, AI never finalises |
| Product becomes inspection theatre | Ofsted and teacher workload risk | Normal workflow evidence only; no inspection-specific paperwork |
| Competitors copy paper generation | Moat weakens | Focus on scan marking, misconception tags, Evidence Passport, Trust Assessor, Ofsted Readiness |
| Vision AI costs exceed licence | Margin risk | Fair-use limits, scan allowances, fallback/manual review, add-on pricing |
