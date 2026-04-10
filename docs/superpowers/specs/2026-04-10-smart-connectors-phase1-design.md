# Smart Connectors Phase 1 — Design Spec

**Date:** 10 April 2026
**Status:** APPROVED
**Connector Settings:** `/dashboard/settings/connectors` (configure, validate, manage data sources)
**Data Consumption:** Ofsted Readiness + all modules consume verified data from connectors

---

## What We're Building

Phase 1 of Smart Connectors: the visual data intelligence layer that connects a school's identity (via DfE GIAS) to 3.7M rows of national statistics, cross-references and verifies every figure, and presents it in the Ofsted Readiness dashboard as clear, actionable intelligence with full source attribution.

## Design Decisions

### 1. Three-Layer Data Architecture

Every data point in Schoolgle traces through three layers:

- **Layer 1: DfE Published Stats** — The "official truth." KS2, attendance, workforce, exclusions, KS4, census. 3.7M rows across 6 tables. This is what governors, inspectors, and parents see on Compare School Performance.
- **Layer 2: School Census & MIS Data** — The granular working layer. Pupil-level data (pseudonymised) from census uploads, MIS exports, Google Drive documents. When aggregated, MUST reconcile against Layer 1.
- **Layer 3: Schoolgle Intelligence** — Our value-add. Comparisons, trends, gap analysis, inspector flags, EEF research links. Built on verified Layer 1+2 data. Nobody else does this.

### 2. Reconciliation Engine

Before any insight reaches the user, Schoolgle cross-checks calculated figures against DfE published headlines.

**Rules:**
- Headline figures (FSM %, attendance %, KS2 expected standard) must match DfE published figures within tolerance
- If they match: green verified badge
- If they differ within explainable range (e.g. different snapshot dates): amber badge with explanation
- If they differ unexpectedly: red flag, insight blocked until resolved
- School gets a task to verify discrepancies ("Confirm which census file was your final DfE submission")

**Example from real data:** GIAS says Grove House FSM is 28.9% (113/391). Census data says 27.3% (roll 417). 1.6pp difference due to different snapshot dates and denominators. Schoolgle flags this, explains likely cause, asks school to verify.

### 3. Source Attribution

Every data point, every insight card, every percentage shows:
- Coloured source dots tracing to which DfE datasets fed the calculation
- Source badges (DfE crest for government data, Schoolgle logo for our calculations)
- Verification badge showing reconciliation status
- Click-through to see the raw underlying data

### 4. Connection Map Landing View

Radial orbital layout (Option A from brainstorming):
- School at the centre with school logo/crest
- Data source nodes orbiting with real brand logos (DfE crest, Google Drive, Arbor, etc.)
- Animated yarn threads flowing between sources and school (Framer Motion)
- Hover on source → data summary tooltip
- Click source → zooms into dataset detail view
- Live connection status indicators (connected/pending/coming soon)

### 5. Similar Schools Comparison

Two comparison modes:
- **Proximity:** Schools within configurable radius (default 5 miles) using GIAS lat/lng via Haversine formula. Schools table has easting/northing — convert to lat/lng or use Haversine on grid refs.
- **Profile match:** Same phase + similar FSM (±5pp) + similar roll (±20%) + same LA. Configurable criteria.

### 6. Settings vs Apps Separation

**Settings → Connectors** (`/dashboard/settings/connectors`):
- This is where connectors live. Configure, validate, manage data sources.
- Connection map landing view with animated yarn threads and source logos.
- Reconciliation checks run here — flag discrepancies, ask school to verify.
- "This is YOUR data — we connect it, verify it, show you what it means."
- The connector does the work and calls out if something doesn't look right.

**Apps consume verified data:**
- Ofsted Readiness dashboard shows intelligence insights with source attribution
- Inspector flags auto-generate tasks in the Actions Hub
- Evidence cards link to source data for inspection prep
- SEF sections auto-populate with verified data points
- Every module (Estates, HR, Governance) can consume connector data

The school owns the data. Schoolgle is the intelligence layer on top.

---

## Technical Architecture

### New Files

```
apps/platform/src/lib/smart-connectors/
  types.ts                    — SmartFilter, DataSource, ReconciliationResult, ComparisonResult types
  reconciliation-engine.ts    — Cross-check Layer 2 aggregates against Layer 1 headlines
  similar-schools.ts          — Proximity search (Haversine) + profile matching queries
  comparison-service.ts       — Build comparison datasets (school vs national/LA/similar)
  source-attribution.ts       — Track which sources fed each calculation

apps/platform/src/app/api/intelligence/
  compare/route.ts            — GET: proximity + similar school comparisons
  reconcile/route.ts          — POST: run reconciliation checks for a school
  sources/route.ts            — GET: connection status for all data sources

apps/platform/src/app/(dashboard)/dashboard/settings/connectors/
  page.tsx                    — Connection map landing view (configure & validate data sources)
  [source]/page.tsx           — Individual source detail (e.g. /settings/connectors/ks2-results)

apps/platform/src/components/smart-connectors/
  ConnectionMap.tsx           — Radial orbital SVG with Framer Motion animations
  DataSourceNode.tsx          — Individual source node with logo, status, hover tooltip
  YarnThread.tsx              — Animated SVG path between nodes
  ReconciliationBanner.tsx    — Cross-check result display (match/discrepancy/error)
  SourceBadge.tsx             — Inline source attribution badge
  InsightCard.tsx             — Intelligence insight with source dots and verification
  ComparisonTable.tsx         — School vs benchmarks table
  SimilarSchoolsList.tsx      — Matched schools with comparison metrics
```

### Database

No new tables for Phase 1. All queries run against existing:
- `ks2_results` (2M rows)
- `attendance` (206K rows)
- `workforce` (208K rows)
- `exclusions` (1.1M rows)
- `ks4_results` (40K rows)
- `census` (147K rows)
- `schools` (GIAS — 34K rows with easting/northing)

### API Endpoints

**GET `/api/intelligence/compare`**
```
?urn=148201
&mode=proximity|similar|both
&radius=5        (miles, for proximity)
&fsm_tolerance=5 (pp, for similar)
&roll_tolerance=20 (%, for similar)
```
Returns: array of matched schools with their KS2/attendance/census data for comparison.

**POST `/api/intelligence/reconcile`**
```
{ urn: 148201 }
```
Returns: reconciliation results across all data sources — which figures match, which have discrepancies, suggested explanations.

**GET `/api/intelligence/sources`**
```
?urn=148201
```
Returns: connection status for each of the 6 DfE datasets + school's own data sources. Row counts, date ranges, latest data point.

### Proximity Calculation

Schools table has `easting` and `northing` (OS grid references). For Haversine we need lat/lng. Two options:
- **Option A:** Convert easting/northing to lat/lng in SQL using OSGB36 conversion
- **Option B:** Use simple Pythagorean distance on easting/northing (1 unit ≈ 1 metre) — good enough for proximity ranking within a few miles

Recommendation: Option B for Phase 1 — Pythagorean on grid refs is fast, accurate within our use case, and avoids complex coordinate conversion. Formula: `distance_metres = SQRT((e1-e2)^2 + (n1-n2)^2)`, convert to miles by dividing by 1609.34.

### Key Queries

**Similar schools:**
```sql
SELECT s.*, k.expected_standard_pct, k.subject, c.fsm_pct, c.number_on_roll
FROM schools s
JOIN ks2_results k ON s.urn = k.urn
JOIN census c ON s.urn = c.urn AND c.time_period = k.time_period
WHERE s.phase_name = 'Primary'
  AND s.la_code = '380'
  AND ABS(c.fsm_pct::numeric - 27.3) <= 5
  AND c.time_period = '202425'
  AND k.breakdown_topic = 'All pupils'
  AND k.subject = 'Reading, writing and maths'
ORDER BY ABS(c.fsm_pct::numeric - 27.3);
```

**Proximity schools:**
```sql
SELECT s.*, 
  SQRT(POWER(s.easting - 417106, 2) + POWER(s.northing - 435598, 2)) / 1609.34 AS distance_miles
FROM schools s
WHERE s.phase_name = 'Primary'
  AND s.status_name = 'Open'
  AND SQRT(POWER(s.easting - 417106, 2) + POWER(s.northing - 435598, 2)) / 1609.34 <= 5
ORDER BY distance_miles;
```

---

## UI Components Detail

### Connection Map (`ConnectionMap.tsx`)

- SVG-based radial layout with Framer Motion `motion.path` for yarn threads
- School node centre: school name + crest/logo
- 6 DfE source nodes at orbital positions, each with real DfE crest logo
- Additional nodes for school's own sources (Google Drive, MIS) at outer orbit
- `stroke-dasharray` animation on yarn threads with `stroke-dashoffset` keyframes
- `prefers-reduced-motion` respected — static layout with no animation
- Responsive: collapses to vertical stack on mobile

### Insight Cards

Each card shows:
- Category tag (STRENGTH / WATCH / INSPECTOR FLAG / POSITIVE / DATA QUALITY)
- Headline stat (bold, large)
- Plain English explanation (1-2 sentences)
- Source attribution dots (coloured by source: blue=DfE, green=school, purple=Schoolgle)
- Verification badge (verified/check/warning)

### Reconciliation Banner

Top of the connections page when discrepancies exist:
- Amber banner: "1 data point needs verification"
- Shows the specific discrepancy (e.g. FSM 28.9% vs 27.3%)
- Explains likely cause
- "Create verification task" button → pushes to Actions Hub

---

## Colour System

| Source | Colour | Usage |
|--------|--------|-------|
| DfE data | `#1d70b8` (GOV.UK blue) | Source badges, thread colour |
| School data | `#10b981` (emerald) | Census, MIS, uploads |
| Schoolgle intelligence | `#a78bfa` (purple) | Calculated insights |
| Verified | `#10b981` (emerald) | Match confirmed |
| Warning | `#f59e0b` (amber) | Discrepancy, needs check |
| Inspector flag | `#ef4444` (red) | Risk, Ofsted concern |
| Positive | `#10b981` (emerald) | Strength, good trend |

---

## Validation

Phase 1 is validated against Grove House Primary (URN 148201) with real data:
- KS2: 79% reading (vs 73.7% national = +5.3pp above)
- Attendance: 94.48% autumn (improving from 93.18%)
- Census: 417 roll, 27.3% FSM, 39.8% EAL
- Workforce: 19.2 FTE teachers, 24.9 FTE TAs
- Exclusions: 0 across all years
- Reconciliation found real FSM discrepancy (28.9% GIAS vs 27.3% census)

---

## Out of Scope (Future Phases)

- Census file validation flow ("Is this your final submission?") — Phase 2
- MIS spreadsheet templates mirroring API fields — Phase 2
- Live assessment anomaly detection / teacher moderation — Phase 3
- Lesson planning → assessment → evidence loop — Phase 4
- Dashboard builder (drag-and-drop widgets) — Phase 3
- Inspector Lens mode — Phase 2
- Ed AI conversation integration — Phase 2
