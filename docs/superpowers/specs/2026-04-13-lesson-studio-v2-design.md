# Lesson Studio v2 — Design Specification

**Date:** 13 April 2026
**Author:** David Summerscales + Claude (brainstorming session)
**Status:** Approved for planning
**Module:** Teaching & Learning (Uranus planet)
**Priority:** HIGH — flagship differentiation product

---

## 1. Vision

Lesson Studio v2 is a **closed-loop adaptive teaching system** that connects lesson planning → delivery → assessment → intervention in one continuous cycle, personalised for every pupil. It is the only tool on the market that knows each pupil's SEND profile, EHCP provisions, attainment history, and misconceptions — and uses that knowledge to generate differentiated lessons, grade uploaded work, and recommend research-backed interventions.

**The pitch:** "Keep your scheme of work. Keep your professional judgement. We'll take all of that and make every lesson interactive, differentiated, assessed, and tracked — personalised for every child in your class. You validate. You're in control."

---

## 2. Competitive Landscape

### What exists (and their gaps)

| Tool | Strength | Critical Gap |
|------|----------|-------------|
| **MagicSchool AI** (3M users) | 80+ tools, IEP generator | Generic — doesn't know pupils, no MIS, no UK curriculum, no work grading |
| **TeachMate AI** (400K users, UK) | 150+ tools, 23 SEND tools, DfE-compliant | Every tool standalone. No pupil profiles, no MIS, no work upload, no adaptive loop |
| **Diffit** | Brilliant reading-level adaptation | Text-only differentiation, no assessment, no pupil tracking, no UK context |
| **Planit Teachers** (UK) | UK curriculum-aligned, 250K+ resources | No SEND differentiation, no pupil data, no adaptive difficulty |
| **Gradescope / ExamAI** | Best-in-class handwriting OCR + grading | Grading only — no lesson planning, no differentiation, no pupil context |

### What nobody does

- Knows individual pupils (MIS-connected, SEND profiles, EHCP provisions)
- Per-pupil adaptive difficulty based on assessment performance
- Upload & AI-grade student work against NC expected standards
- Assessment → next lesson feedback loop (misconceptions become retrieval starters)
- Progress tracking per pupil per NC objective
- EEF research-backed intervention recommendations
- Auto-generated Ofsted evidence narrative

**Schoolgle Lesson Studio v2 does all of these.**

---

## 3. Core Architecture: The Adaptive Loop

```
Plan → Teach → Assess → Adapt → Plan (continuous)
         ↓           ↓
    Pupil Knowledge Graph (always updated)
         ↓
    When gaps found → Intervention Engine
         ↓
    EEF research → Session logging → Impact tracking
         ↓
    Ofsted narrative auto-generated
```

### 3.1 Plan (AI-Generated, Pupil-Aware Lessons)

- Teacher types, speaks, or uploads intent (text, voice, PDF)
- AI pulls each pupil's current attainment level from the knowledge graph
- Generates 4 differentiation tiers: Deeper / Core / Scaffold / Guided
- Per-pupil SEND adaptations (visual schedules, word banks, chunked instructions, bilingual support)
- Adaptive stretch: pushes each child slightly above current level (Zone of Proximal Development)
- Spaced retrieval starters from previous lesson misconceptions
- NC objective mapping with coverage tracking
- Aligned to school's scheme of work (White Rose, Hamilton Trust, Twinkl, Oak National, or school's own)

**Inclusive design principle:** ONE lesson, ONE carpet conversation where every child participates equally. FOUR versions of the practice activities. Nobody feels singled out. Same topic, same vocabulary, different challenge level.

### 3.2 Teach (Delivery Mode)

- Full-screen presentation slides built from plan
- Interactive whiteboard-ready (touch, drag, reveal hotspots)
- Live timer with phase transitions
- Per-group worksheet printing (colour-coded by tier)
- Animated visualisations powered by Framer Motion (e.g., animated heart diagram with flowing blood, interactive fraction walls)
- SEND variant rendering (high contrast, simplified, extended)
- Teacher can adjust difficulty mid-lesson
- Quick-capture behaviour points

### 3.3 Assess (AI-Powered Work Analysis)

**Work upload methods:**
- Photo upload (phone camera — snap worksheets)
- Batch scan (classroom scanner)
- Drag & drop files
- Typed/digital submissions

**AI assessment pipeline:**
1. **Layer 1: Google Cloud Vision API** — OCR for handwriting (98% accuracy, $1.50/1K pages)
2. **Layer 2: Gemini 2.5 Flash** — grades against NC expected standard descriptors (WTS / EXS / GDS), ~$0.002 per worksheet
3. Identifies specific misconceptions per pupil
4. Generates per-pupil written feedback (praise + next step)
5. Confidence score (0-1) on each grade

**Three-tier assessment triangulation:**
- **Teacher assessment** — the professional who knows the child, assigns grade with context
- **AI assessment** — consistent, objective, against NC descriptors
- **Internal moderator** — school's trained assessor, reviews flagged disagreements and samples for consistency

**Triangulation logic:**
- All 3 agree → auto-locked, high confidence
- 2 of 3 agree → majority accepted, flagged for record
- All 3 disagree → escalated for discussion, moderator has final call

**Critical principle:** AI never overrides the teacher. The school always has final say. We do the legwork — they validate.

**Per-pupil assessment card (teacher review UI):**
- Scanned worksheet thumbnail with AI annotations
- Teacher grade vs AI grade side by side
- Triangulation status
- Misconceptions found
- AI recommended next step
- Three actions: "Agree & Lock" / "Override" / "Send to Moderator"
- Bulk "Agree All" for aligned assessments (typically 80%+)

### 3.4 Adapt (Closes The Loop)

- Assessment results update the Pupil Knowledge Graph
- Misconceptions logged → appear as retrieval starters in next lesson
- If pupil exceeded expectations → nudge UP difficulty next time
- If pupil struggled → scaffold MORE with targeted support
- SEND adaptations refined based on what actually worked

**Adaptive difficulty engine (Zone of Proximal Development):**
- Mastery >85% → stretch to next tier
- Mastery 60-85% → consolidate at current level
- Mastery <60% → scaffold down + reteach
- SEND override: never drop below EHCP floor
- Teacher override: always final authority
- Spaced retrieval: resurface misconceptions after 1d, 3d, 7d, 14d

---

## 4. Calendar & Scheduling

Teachers schedule lessons into a proper calendar — the system does not guess timetables.

### 4.1 Head Teacher Calendar View

- **Whole-school calendar** showing all classes side by side for a given day
- Role toggle: filter by year group or view entire school
- Click any lesson cell to see full plan, resources, assessment
- Empty slots show "+ Add lesson" for teachers to fill
- Stats bar: today's lessons, pupils assessed this week, NC coverage, awaiting moderation, flagged pupils
- Permissions: head teacher can view all but not edit other teachers' plans

### 4.2 Teacher Calendar View

- Teacher sees their own class timetable
- Full day mapped (5 periods, all subjects)
- Drag to reschedule lessons
- Week view with prev/next navigation
- Status indicators: taught (green), planned (purple), draft (amber), empty (grey)

### 4.3 Class Overview

- Card per class showing: pupil count, SEND count, PP count, attainment distribution bar, NC coverage %, lessons planned this week
- Click into any class for full detail
- Accessible to head teacher (all classes) and teacher (own class)

---

## 5. Teacher Assessment Dashboard

### 5.1 Class Overview

- Headline cards: % at Expected+, % Greater Depth, % Below Expected, # prerequisite gaps found
- Full class table: every pupil with attainment per subject (Reading, Writing, Maths, Science), trend arrows, flags (SEND, PP, EAL, Gap, Inconsistency)
- Filter by: all / flagged / SEND / PP / subject
- Export CSV

### 5.2 Smart Alerts

Three alert types, auto-generated from data:

1. **Foundation gap (red):** "Jayden was assessed WTS in fractions but historic KS1 data shows he didn't secure place value to 1000 in Year 3. Without that, fraction comparison will remain unstable."
2. **Assessment inconsistency (amber):** "Leah's census says EXS in reading but last 3 lesson assessments show WTS. Either census data needs reviewing or there's been regression."
3. **Rapid progress (green):** "Blessing started at PKE in September, now consistently hitting WTS. Consider moving to Scaffold group."

### 5.3 Data Sources

The dashboard combines:
- **Census data** (historic assessments imported via Intelligence module)
- **SATs results** (KS1/KS2 scaled scores)
- **Teacher assessments** (from previous years, via MIS/census)
- **Lesson Studio assessments** (from the Assess phase — ongoing)
- **SEND profiles** (EHCP, needs, adaptations)

When historic data conflicts with current lesson data, the system flags the inconsistency for investigation.

---

## 6. Pupil Detail View

Clicking "View" on any pupil shows their complete profile.

### 6.1 Pupil Header

- Name, class, teacher, current overall grade, trend
- Tags: SEND type, PP, EAL, EHCP, Foundation Gap
- Subject attainment grid (Reading, Writing, Maths, Science)

### 6.2 Skill Analysis (Prerequisite Chain)

The system builds a **prerequisite skill chain** for each curriculum area, showing:
- Which foundation skills are secure (green)
- Which have gaps (red) — these block progress on later skills
- Which are the current topic (amber)

Example for Jayden in Maths Fractions:
```
Y2: Recognise halves & quarters ✓ Secure
  ↓
Y3: Count in tenths ✓ Secure
  ↓
Y3: Place value to 1000 ✗ GAP ← root cause
  ↓ blocked
Y4: Equivalent fractions ✗ Unstable
  ↓ blocked
Y6: Compare & order fractions — current topic, struggling
```

The AI explains **why** the gap matters: "He can't reliably partition numbers, so equivalent fractions don't make intuitive sense. He's memorising rules without understanding why they work."

**Data sources:** KS1 SATs, census, teacher assessments from previous years, and Lesson Studio assessments. The system detects when census data (e.g., EXS) conflicts with consistent lesson data (e.g., WTS × 3) and flags it.

### 6.3 Assessment History

Timeline combining all assessment sources:
- Lesson Studio assessments (ongoing)
- Census data (annual)
- SATs results (KS1/KS2)
- Teacher assessments (historical)

Each entry shows: date, assessment name, grade, source, verified status. Flagged entries highlighted.

### 6.4 Work Samples

Gallery of scanned worksheets. Click to view full worksheet with AI annotations and teacher feedback.

---

## 7. Intervention Engine

When assessment reveals a pupil is falling behind, the system doesn't just flag it — it recommends specific interventions backed by EEF research and logs every action taken.

### 7.1 EEF Strategy Matching

The system already has 33 EEF strategies with impact ratings in the codebase (`apps/platform/src/lib/eef-toolkit.ts`). For each flagged pupil, it:
- Matches the gap type to the highest-impact EEF strategies
- Ranks by: impact (months of progress), evidence strength, and suitability for this specific situation
- Presents 3-4 options with rationale

Example for Jayden (place value gap, ADHD):
1. One-to-one tuition (+5 months, high evidence) — best match for specific prerequisite gap
2. Mastery learning (+5 months, moderate) — don't move on until place value is secure
3. Metacognition (+7 months, high) — teach self-monitoring
4. Peer tutoring (+5 months, high) — pair with GDS pupil for structured explanation

### 7.2 Intervention Plan

Teacher creates an intervention plan:
- **Target:** What the intervention aims to achieve
- **Format:** 1:1, small group, modified lessons, catch-up sessions
- **Frequency & duration:** e.g., 3× per week, 20 min, 2 weeks
- **Delivered by:** Teacher, TA, SENCO, external
- **Resources:** AI generates catch-up worksheets, games, parent guides
- **Success criteria:** How we'll know it worked
- **Lesson adaptations:** How main class lessons are modified during the intervention (e.g., bar models only, no number lines)

### 7.3 Session Logging

Every intervention session is logged with:
- Date and time
- Who delivered it
- Focus area
- Observations (what the pupil did, how they responded)
- Next session plan
- Status tags (concrete/pictorial/abstract stage, progressing/stuck)

This is the **evidence trail**. Timestamped, attributed, specific.

### 7.4 Impact Tracking

- Before/after grade comparison
- Progress bars for each prerequisite skill (mastery %)
- CPA progression tracking (Concrete → Pictorial → Abstract)
- AI assessment of whether the strategy is working
- If not improving after target period → suggest strategy change

### 7.5 Ofsted Narrative (Auto-Generated)

The system auto-generates a professional narrative for each pupil with an active intervention:

> "Jayden was identified through our assessment system as working below expected standard in fractions. Our AI-assisted diagnostic analysis traced the root cause to an insecure foundation in place value (Y3 curriculum area). We implemented a targeted 1:1 intervention based on the EEF Teaching & Learning Toolkit recommendation for one-to-one tuition (+5 months expected impact). After 2 of 6 sessions, Jayden has progressed from PKE to WTS in place value using concrete resources..."

With a full evidence trail: dates, session logs, strategy references, impact data.

**Export options:** PDF, clipboard, feed into SEF/SDP.

**This answers the Ofsted question automatically:** "What are you doing about pupils who are falling behind?" — with evidence, research backing, and impact data.

---

## 8. Curriculum Planning Cascade

Five levels flowing down, assessment data flowing back up:

### Level 1: School Curriculum Map (Head Teacher / Curriculum Lead)
- Every NC objective across every subject, every year group
- Progress bars per year group showing % of objectives covered
- Identifies gaps in coverage across the school

### Level 2: Year Group Long-Term Plan
- Full year mapped by term
- Imported from scheme of work (White Rose, Hamilton Trust, Oak National, Twinkl, or school's own)
- AI auto-maps NC objectives to each unit
- Progress tracking per term

### Level 3: Unit / Medium-Term Plan
- Progression within a unit (e.g., 6 lessons for "Animals inc. Humans")
- Shows lesson sequence from scheme, with NC codes per lesson
- Visual: green = taught & assessed, amber = planned, grey = upcoming

### Level 4: Weekly Plan
- The timetable grid — auto-populated from unit plans across subjects
- Teacher tweaks and fills gaps
- Each cell links to full lesson plan

### Level 5: Individual Lesson
- The AI-generated, pupil-aware, differentiated lesson plan

**Data flows both ways:**
- **Downward:** School curriculum → scheme → unit → week → lesson (what to teach)
- **Upward:** Lesson assessment → unit progress → term coverage → school dashboard (evidence of learning)

"Has Y6 covered SC-2a?" → "Yes, taught Wed 16 April, 71% at EXS+."

---

## 9. Scheme of Work Integration ("Superpower Their Stale Stuff")

Schools keep their existing schemes. We absorb them and generate 10x better resources.

### Input Methods
- **PDF upload:** Parse White Rose, Hamilton Trust, Twinkl PDFs (existing `pdf-scheme-connector.ts`)
- **Oak National API:** Direct connector (existing `oak-connector.ts`)
- **Manual paste:** Teacher pastes objectives/progression
- **School's own:** Upload custom scheme documents

### What We Parse
- Learning objectives per lesson
- Progression sequence (what order to teach)
- Key vocabulary
- NC code mappings
- Suggested activities

### What We Output (Same Objectives, 10x Better)
- Same progression order as their scheme
- Animated interactive visualisations (Framer Motion)
- Interactive diagrams (drag, reveal, sequence, label)
- Per-pupil differentiated worksheets (not generic 3-tier)
- SEND-adapted versions automatically generated
- NC codes auto-mapped and tracked
- Assessment built in

---

## 10. AI Model Stack

| Purpose | Model | Cost | Rationale |
|---------|-------|------|-----------|
| Lesson plan generation | Gemini 2.5 Flash (via OpenRouter) | $0.30/M input | Already in use, proven quality, fast |
| Intent extraction | Claude Sonnet 4 (via OpenRouter) | $3/M input | Better at parsing loose teacher input, handles voice transcription errors |
| Handwriting OCR | Google Cloud Vision API | $1.50/1K pages | 98% accuracy on handwriting, best in class |
| Work grading & feedback | Gemini 2.5 Flash (vision) | $0.30/M input | Multimodal, fast, cost-effective for batch grading |
| Visualisation generation | Claude Sonnet 4 (via OpenRouter) | $3/M input | Better at structured SVG generation with ARIA labels |
| Prerequisite analysis | Gemini 2.5 Flash | $0.30/M input | Pattern matching across assessment history |

**Estimated cost per lesson cycle:**
- Generate plan: ~$0.005
- Grade 28 worksheets: ~$0.06
- Generate feedback: ~$0.01
- Total: **~$0.08 per lesson** (~£0.06)

---

## 11. UI Design Principles

- **Light mode default** — white backgrounds, subtle greys, clean cards
- **Poppins font** throughout (Schoolgle brand)
- **Minimal colour** — accent (indigo), success (green), warning (amber), danger (red), blue for data
- **CSS variables** for light/dark mode toggle
- **Tabs that work** — all tab interfaces must be interactive, not static
- **Breathable spacing** — generous padding, no visual clutter
- **Subtle shadows** — `0 1px 3px rgba(0,0,0,0.06)` not dramatic drop shadows
- **Role-based views** — head teacher sees all classes, teacher sees own class
- **Mobile-responsive** — worksheets can be photographed and uploaded from phone

---

## 12. Database Impact

### New Tables Required
- `ls_interventions` — intervention plans per pupil
- `ls_intervention_sessions` — session log entries
- `ls_intervention_impact` — before/after tracking
- `ls_prerequisite_chains` — skill dependency graphs per subject/year
- `ls_pupil_mastery` — per-skill mastery percentages
- `ls_work_submissions` — uploaded worksheets/photos with OCR results
- `ls_assessment_triangulation` — teacher + AI + moderator grades per piece of work
- `ls_moderation_queue` — flagged assessments awaiting moderator review
- `ls_calendar_events` — teacher-scheduled lesson slots (replacing hardcoded timetable)

### Existing Tables to Extend
- `ls_lesson_plans` — add `intervention_ids`, `scheme_source`, `retrieval_questions`
- `ls_pupils` — add `prerequisite_gaps`, `intervention_active`
- `ls_assessments` — add `moderator_grade`, `triangulation_status`, `work_submission_id`

### Cross-Module Connections
- **Intelligence module:** census data, SATs results, cohort tracking → feeds into pupil knowledge graph
- **EEF toolkit:** `eef-toolkit.ts` strategies → feeds into intervention recommendations
- **Ofsted readiness:** auto-generated narratives → feeds into SEF/SDP
- **SEND Hub (future):** EHCP provisions → feeds into lesson adaptations

---

## 13. What Already Exists (v1 to Build On)

- 17 database tables for lesson studio
- 5 API routes (classes, pupils, timetable, plans, generate)
- 9 React components (timetable grid, lesson panel, teach mode, etc.)
- Intent extraction pipeline (extract-intent.ts)
- Visualisation generation (generate-visualisation.ts)
- Accessibility variant engine (generate-variants.ts)
- Oak National connector
- PDF scheme parser
- Curriculum frameworks seeded (NC2014, EYFS2024, NC2027)
- 15 test pupil profiles with full SEND/attainment data

**Key gaps in v1 (what v2 adds):**
- No work submission/upload
- No AI grading pipeline
- No assessment triangulation
- No adaptive difficulty engine
- No intervention system
- No EEF integration
- No prerequisite skill analysis
- No calendar scheduling (hardcoded timetable)
- No head teacher overview
- No teacher assessment dashboard
- No Ofsted narrative generation
- Teach mode doesn't capture responses
- Teacher input UI is placeholder (mocked generation)
- Visualisation pipeline not integrated into main flow

---

## 14. Success Criteria

1. Teacher can generate a fully differentiated lesson plan in under 30 seconds
2. 28 worksheets can be photographed, uploaded, and AI-graded in under 2 minutes
3. Teacher can review and verify all 28 grades in under 5 minutes
4. Prerequisite gaps are automatically detected from assessment history
5. EEF strategy recommendations appear automatically when gaps are found
6. Intervention sessions can be logged in under 1 minute each
7. Ofsted narrative is always up to date and exportable as PDF
8. Curriculum coverage is tracked automatically — no manual data entry
9. Head teacher can see every lesson across the school in one calendar view
10. The system works with any scheme of work (White Rose, Hamilton, Oak, custom)

---

## 15. Visual Mockups

Interactive HTML mockups from this brainstorming session are saved at:
`.superpowers/brainstorm/63908-1776081179/content/`

| File | Content |
|------|---------|
| `02-competitive-landscape-v2.html` | Competitor matrix with feature comparison |
| `06-clean-ui-v2.html` | Main UI: timetable, lesson detail (working tabs), curriculum view, classes view |
| `07-dashboard-calendar-gaps.html` | Head teacher calendar, teacher dashboard, pupil detail with prerequisite analysis |
| `08-intervention-eef.html` | Intervention plan, session logging, impact tracking, Ofsted narrative, EEF recommendations |

---

## 16. Next Steps

1. Write implementation plan (decompose into buildable phases)
2. Phase 1: Calendar + Assessment upload + AI grading pipeline
3. Phase 2: Teacher dashboard + prerequisite analysis
4. Phase 3: Intervention engine + EEF integration
5. Phase 4: Ofsted narrative generation + reporting
6. Phase 5: Scheme superpower engine + animated visualisations
