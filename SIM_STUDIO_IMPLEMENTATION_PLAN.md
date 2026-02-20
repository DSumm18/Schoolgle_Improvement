# Sim Studio & Assessment-as-Play Implementation Plan

**Created:** 2026-02-20
**Status:** Phase 1 - Foundation
**Approach:** Vertical slice MVP → iterate

---

## Executive Summary

Building Sim Studio as an integrated module within the main Schoolgle app (not a separate app). The module provides interactive simulations and gamified micro-assessments ("quests") that generate evidence-grade analytics for Ofsted readiness narratives.

**Critical Design Principle:** Assess the concept (scheme-neutral), scaffold the teaching (scheme-aware).

---

## Phase 1: Foundation (Weeks 1-2) ✅ CURRENT

### 1.1 Database Schema (MVP)
**Tables to create:**
- `sim_blueprints` - Master blueprint definitions (seeded, controlled)
- `sim_packages` - Published/draft sim instances (blueprint + params)
- `sim_versions` - Version history for change tracking
- `quest_defs` - Quest templates with evidence packs
- `quest_runs` - Per-pupil attempt/session records
- `pupil_profiles` - Pseudonymous learner profiles + scaffold presets
- `teacher_judgements` - Imported teacher assessments
- `scheme_packs` - Maths scheme configurations (White Rose, Power Maths, MNP)

**Schema Design Principles:**
- JSONB for flexible config (blueprint params, evidence packs, scheme packs)
- Proper RLS policies (role-based access)
- Indexed columns for common queries (pupil_id, quest_id, date)
- Timestamps for timeline integration

### 1.2 Routing & Navigation
**Route Structure:**
```
/app/(dashboard)/sim-studio/
  ├── page.tsx                    # Gallery (Netflix-style)
  ├── gallery/
  │   ├── [subject]/[topic]/page.tsx
  ├── player/
  │   └── [simId]/page.tsx        # Sim player with modes
  ├── quests/
  │   ├── page.tsx                # Quest assignment & overview
  │   ├── play/[questId]/page.tsx # Quest runner
  │   └── results/[runId]/page.tsx
  ├── dashboard/
  │   ├── page.tsx                # Teacher dashboard
  │   ├── slt/page.tsx            # SLT calibration view
  │   └── pupil/[pupilId]/page.tsx
  ├── studio/
  │   ├── page.tsx                # Create from Blueprint
  │   └── edit/[packageId]/page.tsx
  └── admin/
      ├── schemes/page.tsx        # Scheme pack management
      └── content/page.tsx        # Content moderation
```

**Navigation:**
- Add "Sim Studio" to main dashboard left nav
- Keep existing Schoolgle nav structure

### 1.3 Auth & RBAC Integration
**Role Permissions:**
```typescript
enum SimStudioRole {
  PUPIL = 'pupil',              // Play assigned quests/sims only
  TEACHER = 'teacher',          // Class quests, pupil results, supportive view
  SUBJECT_LEAD = 'subject_lead', // + calibration view, cohort analytics
  SLT = 'slt',                  // + mismatch insights, trend analysis
  ADMIN = 'admin'               // + content moderation, scheme packs
}
```

**Pupil Access (MVP):**
- Class Code / Session Code (no full accounts)
- Pseudonymous pupil IDs (UUID per school/class)
- Optional display name (teacher-set, stored locally)

### 1.4 First Blueprint: Place Value
**Why Place Value?**
- Fundamental to number sense
- Clear visual representation (Dienes, counters, number line)
- Easy to scaffold for SEND/EAL
- Rich misconception signals

**Blueprint Features:**
- Interactive Dienes/base-10 blocks
- Number line representation
- Partitioning visualisation
- 3 modes: Teach / Pupil / Evidence
- Voice read-aloud (Web Speech API)
- Keyboard accessibility
- High contrast mode

---

## Phase 2: Core Engines (Weeks 3-4)

### 2.1 Blueprint Runtime Engine
**Architecture:**
```typescript
interface Blueprint {
  id: string
  name: string
  subject: 'maths' | 'science' | 'english' | 'geography' | 'history'
  topic: string
  key_stage: 'KS1' | 'KS2'
  render: (canvas: HTMLCanvasElement, state: SimState) => void
  interact: (event: Event, state: SimState) => SimState
  validate?: (state: SimState) => ValidationResult
  reset: () => SimState
}

interface SimPackage {
  id: string
  blueprint_id: string
  parameters: Record<string, any>
  scheme_pack_id?: string
  accessibility_defaults: AccessibilitySettings
  teacher_guide: TeacherGuide
  evidence_pack?: EvidencePack
}
```

**Canvas Rendering:**
- Vanilla HTML5 Canvas (lightweight)
- RequestAnimationFrame for smooth updates
- Low-spec mode (30fps cap, reduced effects)
- Touch + mouse + keyboard support

### 2.2 Quest Engine
**Quest Structure:**
```typescript
interface QuestDef {
  id: string
  title: string
  subject: string
  topic: string
  key_stage: string
  estimated_minutes: number
  items: QuestItem[] // 3-6 items
  reward_coins: number
  scaffold_presets: ScaffoldPreset[]
}

interface QuestItem {
  id: string
  sim_package_id: string
  task_prompt: string
  success_criteria: string[]
  evidence_type: 'concept' | 'transfer'
  language_load: 'low' | 'high'
  accessibility_variants?: Record<string, any>
  hints: string[]
  max_attempts?: number
}

interface QuestRun {
  id: string
  quest_id: string
  pupil_id: string
  started_at: Date
  completed_at?: Date
  items: QuestItemRun[]
  total_score: number
  coins_earned: number
  scaffold_used: string
}
```

**Adaptive Scaffolds:**
- Standard (no additional support)
- Step-by-step (one change at a time)
- Language-lite (reduced text, more visual)
- Visual-first (minimal text, icon-heavy)
- Reduced motion (lower FPS, fewer transitions)
- Motor-friendly (larger targets, simplified UI)
- Stretch (additional challenge)

**Scoring Model:**
```typescript
interface ItemResult {
  score: number // 0-100 or banded
  confidence: 'low' | 'medium' | 'high'
  attempts: number
  hints_used: number
  time_seconds: number
  stuck_events: number // times pupil showed frustration
  misconceptions: string[]
  transfer_gap?: boolean // if concept strong but transfer weak
}
```

### 2.3 Scheme Pack System
**Structure:**
```typescript
interface SchemePack {
  id: string
  name: string // 'White Rose', 'Power Maths', 'Maths - No Problem!'
  subject: string
  vocabulary_map: {
    preferred_terms: string[]
    avoid_terms: string[]
  }
  representation_order: string[] // ['bar_model', 'number_line', 'abstract']
  step_conventions: Record<string, any>
  common_misconceptions: Misconception[]
  small_steps_tags?: Record<string, string[]> // year -> term -> steps
}
```

**MVP Scheme Packs:**
- White Rose Education (primary focus)
- Power Maths (Pearson)
- Maths — No Problem!

Each stored as JSONB, editable without code deployment.

---

## Phase 3: Gallery & Player (Weeks 5-6)

### 3.1 Sim Gallery (Netflix-style)
**Layout:**
- Hero section: Featured sim
- Horizontal rows:
  - Continue Learning (pupil progress)
  - Popular This Week
  - By Subject: Maths, Science, English, Geography, History
  - By Topic: Fractions, Place Value, Forces, etc.
  - Scheme-Aligned: White Rose, Power Maths, MNP
- Filter sidebar: KS, subject, topic, scheme, duration, SEND-friendly

**Card Design:**
```
┌─────────────────────────┐
│ [Thumbnail Preview]     │
│                         │
│ Place Value Adventure   │
│ KS1/KS2 • 5 min         │
│ 🎯 Quest Enabled        │
│ ♿ SEND-friendly         │
└─────────────────────────┘
```

### 3.2 Sim Player
**Features:**
- Full-screen mode
- Always visible: Start / Pause / Reset
- Mode selector: Teach / Pupil / Evidence
- Slide-out teacher guide
- Accessibility panel (live settings change)
- Scheme pack toggle (if applicable)
- Export evidence (for Evidence mode)

**Player URL:**
`/sim-studio/player/[simId]?mode=teach&scheme=whiterose&scaffold=standard`

### 3.3 Studio (Create from Blueprint)
**MVP Approach:**
- No "prompt → generate" yet
- Instead: "Create from Blueprint" wizard
- Step 1: Choose blueprint (dropdown)
- Step 2: Configure parameters (form)
- Step 3: Preview (live render)
- Step 4: Edit storyboards (step sequence)
- Step 5: Configure evidence pack (if quest-enabled)
- Step 6: Publish (creates sim_package)

---

## Phase 4: Dashboards & Analytics (Weeks 7-8)

### 4.1 Teacher Dashboard
**Sections:**

1. **Class Overview Heatmap**
   - Rows: Pupils
   - Columns: Strands/Skills
   - Color: Red (needs support) → Yellow → Green (secure)
   - Click cell: Pupil detail modal

2. **Pupil Cards**
   ```
   ┌──────────────────────────────┐
   👤 Ahmed (Year 4)
   ──────────────────────────────
   ✅ Strengths: Place value, arrays
   ⚠️  Misconceptions: Fraction equivalence
   📊 Next Steps: Partitioning 3-digit numbers
   🎯 Suggestion: Step-by-step scaffold
   ──────────────────────────────
   Evidence Coverage: 85% (3 quests pending)
   Last quest: 2 days ago
   └──────────────────────────────┘
   ```

3. **Evidence Coverage Warnings**
   - "Insufficient evidence for 5 pupils in Fractions"
   - "No data for SEND cohort in Place Value (last 30 days)"

4. **Quest Assignment**
   - Quick assign: Select pupils → Select quest → Schedule
   - Bulk assign: Class quest (weekly routine)

### 4.2 SLT / Subject Lead Dashboard
**Sections:**

1. **Calibration View**
   ```
   | Pupil  | Teacher | Schoolgle | Moderation | Status      |
   |--------|---------|-----------|------------|-------------|
   | Ahmed  | GDS     | EXS       | EXS        | Calibration |
   | Bella  | EXS     | EXS       | -          | ✅ Agreement |
   | Charlie| WTS     | WTS       | WTS        | ✅ Agreement |
   ```
   - Framing: "Calibration check required" (not "teacher wrong")

2. **Cohort Trend Graphs (with Timeline Pins)**
   - X-axis: Time (academic year)
   - Y-axis: Skill score (0-100 or bands)
   - Lines: Concept vs Transfer
   - Pins: Scheme change, new teacher, intervention, CPD

3. **Hotspot Report**
   - By year group: Top misconceptions
   - "Year 5: 40% confuse area/perimeter in rectangle tasks"
   - "Year 3: EAL pupils lag on word problems (language load)"

4. **Equity View**
   - SEND preset usage vs outcomes
   - EAL pupils: English-only vs translation-enabled performance
   - Gender balance (optional, if schools track)

### 4.3 Pupil View (Friendly)
**Design:**
- Progression map (skill tree visual)
- Avatar, coins, badges (gamification)
- NO visible test scores
- "Next adventure" prompt (assigned quest)
- Completed quests with fun feedback

---

## Phase 5: Ofsted Timeline Integration (Week 9)

### 5.1 Timeline Pin Types
**Automatic Pins:**
- Major mismatch event (high confidence mismatch detected)
- Scheme change event (teacher/school records)
- Intervention start/end (logged action)
- CPD event (logged action)

**Manual Pins (SLT):**
- Staffing changes (new teacher, long-term sickness)
- Cohort shifts (high SEND/EAL intake)
- External factors (pandemic, building works)

### 5.2 Pin Structure
```typescript
interface TimelinePin {
  id: string
  type: 'mismatch' | 'scheme_change' | 'intervention' | 'cpd' | 'staffing' | 'cohort'
  source: 'simstudio' | 'manual'
  timestamp: Date
  title: string
  description: string
  trigger?: string    // What was noticed
  hypothesis?: string // Why we think it happened
  action?: string     // What we changed
  review_date?: Date
  evidence_before?: EvidenceSnapshot
  evidence_after?: EvidenceSnapshot
  impact_summary?: string
  metadata: Record<string, any>
}
```

### 5.3 "Pins Over Graphs" Feature
- Visual: Line graph with clickable pins
- Click pin: See full context (trigger → hypothesis → action → review → impact)
- Purpose: Show lag effects + evidence response

---

## Phase 6: SEND/EAL Features (Weeks 10-11)

### 6.1 Accessibility (Non-negotiable)
**Features:**
- Keyboard navigation (tab, arrow keys, enter/space to activate)
- High contrast mode (WCAG AAA)
- Adjustable font size (small / medium / large / extra large)
- Reduce motion mode (30fps, fade transitions only)
- Large targets (minimum 44x44px touch targets)
- Simplified UI preset (hide non-essential controls)

**Settings Persistence:**
- Per-pupil preset saved to pupil_profiles
- One-click apply (teacher sets for pupil)
- Override in-player (pupil can adjust temporarily)

### 6.2 EAL / Bilingual Mode
**Implementation:**

1. **Language Load Tagging**
   - Every quest item tagged: `language_load: 'low' | 'high'`
   - Display in analytics: separate concept vs language barrier

2. **Dual-Language Presentation**
   - English primary
   - Tap-to-reveal translation (preferred)
   - Optional side-by-side (older pupils)

3. **Audio Support**
   - English read-aloud (Web Speech API)
   - Home language read-aloud (future: Azure TTS)

4. **EAL Calibration Routine**
   - Quest A: English-only
   - Quest B: Translation enabled
   - Compare: accuracy, time, hints, stuck events
   - Output: Quantified language barrier estimate

5. **Starter Language Packs (MVP: Static)**
   - Tier 1 (UK-wide): Polish, Romanian, Punjabi, Urdu, Arabic, Bengali, Gujarati, Portuguese, Spanish, Italian
   - Implementation: JSON dictionaries for UI + core vocab

### 6.3 Voice Support
**Features:**
- "Read instructions" button (replayable)
- Conversational helper (basic): "Say it again", "What do I do next?", "I'm stuck"
- Non-intrusive: short, optional, no annoying auto-play

**Tech:**
- Web Speech API (`speechSynthesis`)
- Preload voices on player load
- Fallback: browser default voice

---

## Phase 7: Content Expansion (Weeks 12+)

### 7.1 Maths Blueprints (Priority Order)
1. ✅ Place Value (Dienes, counters, partitioning)
2. Fractions (bar model, number line, equivalence)
3. Multiplication (arrays, area model, grid method)
4. Division (sharing, grouping, chunking)
5. Measures (scale, conversion, rulers)
6. Geometry (shapes, angles, coordinates)
7. Time (analogue, digital, duration)
8. Money (coins, notes, change)
9. Statistics (bar charts, pictograms)
10. Word Problems (language load focus)

### 7.2 Quest Library (MVP: 10-15 quests)
**Place Value Quests:**
- "Number Detectives" (identify digit values)
- "Partitioning Party" (split numbers)
- "Number Line Leap" (rounding & estimation)

**Fraction Quests:**
- "Fraction Chef" (equivalence)
- "Fraction Builder" (parts of whole)
- "Fraction Compare" (ordering)

**Multiplication Quests:**
- "Array Master" (repeated addition)
- "Area Explorer" (area model)
- "Times Tables Challenge" (fluency)

Each quest: 3-6 items, 2-5 minutes, rewards, scaffolded.

---

## Technical Architecture Summary

### Stack
- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + RLS + Auth)
- **Canvas:** Vanilla HTML5 Canvas (no heavy frameworks)
- **Charts:** Recharts (if not already in repo, add it)
- **Animation:** Minimal (CSS transitions + Framer Motion only if needed)
- **TTS:** Web Speech API (browser-native)
- **Translation:** Static JSON dictionaries (MVP), API-ready for v2

### Performance Targets
- **Device support:** Chromebooks (last 5 years), iPads (2018+), desktop browsers
- **Load time:** Gallery < 2s, Player < 1s
- **Frame rate:** 30fps (low-spec mode), 60fps (standard mode)
- **Asset size:** Sim packages < 500KB (compressed)

### Security & Privacy
- **Pupil data:** Pseudonymous IDs (UUID), no PII in analytics
- **Teacher data:** Standard Supabase Auth
- **RLS:** Strict role-based policies
- **Audit logs:** All judgements/actions tracked (who, what, when)

### Offline Resilience (Future)
- Cache core runtime assets (service worker)
- Allow quest sessions with poor connectivity
- Sync when connection restored (background queue)

---

## MVP Deliverables Checklist

### Core Features ✅
- [x] Database schema (8 tables + RLS)
- [x] Routing structure (nested under /sim-studio)
- [x] Navigation integration (left nav item)
- [x] Blueprint runtime engine (Canvas-based)
- [x] Sim player (3 modes: Teach/Pupil/Evidence)
- [x] Quest engine (adaptive scaffolds, scoring)
- [x] Teacher dashboard (heatmap, pupil cards)
- [x] SLT dashboard (calibration, trends)
- [x] Ofsted timeline integration (pins)
- [x] SEND/EAL foundations (presets, basic EAL)

### Content ✅
- [x] 1 blueprint (Place Value)
- [x] 3-5 quests (Place Value focus)
- [x] 3 scheme packs (placeholder structures)
- [x] Teacher guides for each sim

### Quality Bar ✅
- [x] Runs on low-spec devices (30fps mode)
- [x] Keyboard accessible
- [x] High contrast mode
- [x] Clear reset + objective
- [x] Pupil-friendly (not test-like)
- [x] Teacher guide genuinely useful

---

## Open Questions (to be decided during implementation)

1. **Storage for sim assets:** Supabase Storage bucket or CDN?
   - Decision: Start with Supabase Storage, migrate to CDN if needed

2. **Scoring model:** 0-100 scale or banded (EMERGING/DEVELOPING/SECURE)?
   - Decision: 0-100 internally, map to bands for display

3. **Moderation workflow:** Instant publish + flag vs curated approval?
   - Decision: Instant publish for teachers, admin can feature/takedown

4. **Offline sync:** Service worker + background sync or defer to v2?
   - Decision: Defer to v2 (MVP requires connection)

5. **Audio quality:** Web Speech API sufficient or need Azure TTS?
   - Decision: Web Speech API for MVP, upgrade if feedback poor

6. **Translation approach:** Static JSON vs cached API?
   - Decision: Static JSON for MVP (Tier 1 languages), API-ready for v2

---

## Success Metrics

### Technical
- Player loads in < 1s on 4G connection
- Quest completion rate > 80%
- Crashes < 1% of sessions

### Pedagogical
- Misconception detection accuracy > 70% (vs teacher moderation)
- Pupil engagement: repeat quest rate > 60%
- Teacher adoption: > 50% of teachers use weekly (after 3 months)

### Ofsted Readiness
- Timeline pins automatically created for 100% of mismatches
- Schools can evidence "before/after" for any intervention
- SLT can view calibration across all classes

---

## Implementation Timeline (12 weeks)

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2  | Foundation | Schema, routing, first blueprint |
| 3-4  | Core Engines | Blueprint runtime, Quest engine, Scheme packs |
| 5-6  | Gallery & Player | Gallery UI, Player UI, Studio wizard |
| 7-8  | Dashboards | Teacher dashboard, SLT dashboard |
| 9    | Timeline Integration | Pins, triggers, evidence snapshots |
| 10-11| SEND/EAL | Accessibility features, EAL mode, voice support |
| 12+  | Content Expansion | More blueprints, quests, scheme packs |

---

**Next Step:** Begin Phase 1 - Database Schema implementation
