# Smart Connectors — Product Specification

**Author:** David Summerscales / Jarvis  
**Date:** 10 April 2026  
**Status:** READY TO BUILD  
**Priority:** Flagship feature — the product differentiator

---

## What This Is

A single, unified data intelligence layer that auto-connects a school's identity (via DfE GIAS) to 3.7 million rows of national school statistics, then uses smart field-type filters to surface contextual insights, comparisons, and inspector-ready analysis — all wrapped in a stunning Napkin AI-style animated visualisation.

No other EdTech platform does this. Arbor shows your school. SIMS shows your school. The DfE website shows flat tables. Schoolgle shows what your data MEANS — in context, compared to similar schools, with insights already suggested.

---

## The Two Data Layers

### Layer 1: National Benchmark Data (DfE — "What happened")
Bulk downloaded into Supabase. Public data across ~34,000 schools.

| Table | Rows | Schools | Years | Key Fields |
|-------|------|---------|-------|------------|
| ks2_results | 2,049,263 | 17,011 | 2022-2024 | Expected/higher standard %, scaled scores, progress measures by subject + pupil group |
| attendance | 205,867 | 29,244 | 2013-2024 | Overall/authorised/unauthorised absence %, persistent absence |
| workforce | 207,590 | 33,591 | 2014-2024 | FTE teachers/TAs/support, vacancies, QTS %, pay |
| exclusions | 1,126,026 | 34,069 | 2010-2024 | Suspensions, permanent exclusions by term |
| ks4_results | 40,285 | 5,755 | 2024 | Attainment 8, Progress 8, EBacc, basics by pupil group |
| census | 146,600 | 27,338 | 2019-2024 | Roll, FSM %, EAL %, SEN %, mobility |

### Layer 2: School's Own Data (MIS via Google Drive — "Why it happened")
Pseudonymised pupil-level data uploaded by the school. Private, GDPR-safe.

- Pupil assessment CSVs (reading, writing, maths scores per pupil)
- Attendance registers
- Behaviour logs
- SEND register
- All pseudonymised with HMAC-SHA256 — server never sees pupil names

### The Magic
Smart Connectors join Layer 1 and Layer 2:
- "Your KS2 Reading dropped from 82% to 79%" (Layer 1)
- "That's because your disadvantaged cohort had 3 fewer pupils meeting expected" (Layer 2)
- "Compared to Bradford primaries with similar FSM %, you're still in the top quartile" (Layer 1)
- "An inspector would ask about the 4-point disadvantaged gap widening" (Both layers)

---

## Universal Smart Filter Architecture

Smart filters are **reusable field-type skills**, not module-specific features. Build once, use everywhere.

### Filter Types

#### 1. Postcode Filter (`smart-filter:postcode`)
- Input: Any postcode field in any dataset
- Capabilities:
  - Calculate distance between two postcodes (Haversine formula using lat/lng from GIAS)
  - "Schools within X miles" radius search
  - Travel time estimate (straight-line with 1.3x road factor)
  - Cluster detection ("5 schools within 0.5 miles — a school cluster")
- Uses: Intelligence (nearby schools comparison), Estates (contractor coverage), Finance (supplier proximity), HR (staff commute analysis)

#### 2. Date Filter (`smart-filter:date`)
- Input: Any date/year field
- Capabilities:
  - Year-on-year trend detection with direction arrow (improving/declining/stable)
  - "Since last Ofsted" — auto-calculates using GIAS inspection date
  - Rolling window (3-year trend, 5-year trend)
  - Seasonal pattern detection (attendance by term)
  - Key date awareness (census day, SATs week, Ofsted window)
- Uses: All modules — trends are universal

#### 3. Percentage Filter (`smart-filter:percentage`)
- Input: Any percentage field
- Capabilities:
  - Auto-benchmark against national average, LA average, similar-school average
  - Quartile ranking ("You're in the top 25% of Bradford primaries")
  - Outlier flagging ("This is 2 standard deviations from your peer group")
  - RAG rating (auto-assign Red/Amber/Green based on context)
  - Gap analysis ("Your disadvantaged gap is 12 points — national average is 8")
- Uses: KS2/KS4 results, attendance, FSM, SEN percentages

#### 4. Count Filter (`smart-filter:count`)
- Input: Any numeric count field
- Capabilities:
  - Rank position ("You have the 3rd highest exclusion count in Bradford")
  - Per-capita calculation ("4.2 exclusions per 100 pupils")
  - Distribution chart ("Where you sit on the bell curve")
  - Trend with volume ("Suspensions up 12% but pupil count also up 8% — rate is stable")
- Uses: Pupil counts, exclusions, staff numbers, absences

#### 5. Category Filter (`smart-filter:category`)
- Input: Any text/enum field (school type, phase, religious character, SEN provision type)
- Capabilities:
  - Group-by analysis ("Compare all Academy converters vs maintained schools")
  - Cross-tabulation ("FSM % by school type in Bradford")
  - Subset filtering ("Only show primaries with nursery provision")
  - "Schools like us" auto-matching (combine multiple categories)
- Uses: Every comparison view

#### 6. Currency Filter (`smart-filter:currency`)
- Input: Any monetary value
- Capabilities:
  - Per-pupil calculation
  - Benchmark against similar schools
  - Year-on-year real-terms comparison (inflation adjusted)
  - Variance flagging ("You spend 23% more per pupil on supply staff than similar schools")
- Uses: Finance module, workforce pay data, contract costs

### Smart Filter API Design
```typescript
interface SmartFilter {
  id: string;                    // 'smart-filter:postcode'
  fieldType: 'postcode' | 'date' | 'percentage' | 'count' | 'category' | 'currency';
  capabilities: string[];        // ['distance', 'radius', 'cluster']
  apply(field: string, dataset: string, params: FilterParams): FilterResult;
  suggest(field: string, dataset: string, context: SchoolContext): Suggestion[];
}

interface Suggestion {
  title: string;                 // "Compare with nearby schools"
  description: string;           // "5 primaries within 2 miles have similar FSM profiles"
  filterConfig: FilterParams;    // Pre-built filter to apply on click
  relevanceScore: number;        // 0-1, how interesting this insight is
  inspectorRelevance: boolean;   // Would Ofsted care about this?
}
```

---

## Smart Connector: DfE National Data

### Connection Flow
1. School signs up → enters URN (or we detect from Google domain)
2. GIAS lookup auto-populates school profile (27 fields)
3. System matches URN across all 6 DfE tables
4. Dashboard shows: "Connected to 6 national datasets — 3.7M comparison points"
5. Smart suggestions start appearing immediately

### Comparison Modes

#### Proximity Mode
- "Schools within 5 miles" (configurable radius)
- Uses lat/lng from GIAS for every school
- Map visualisation with school pins
- Filter by phase, type, size

#### Similar Schools Mode
- Match criteria (configurable):
  - Same phase (Primary/Secondary)
  - Similar FSM % (±5 points)
  - Similar pupil count (±20%)
  - Same school type (Academy/Maintained)
  - Same LA
- Shows: "12 schools match your profile — here's how you compare"

#### Specialist Mode
- Unique characteristics comparison:
  - "Other schools with VI resourced provision" (from GIAS)
  - "Schools that converted to academy in the same year"
  - "Schools with similar prior attainment profile" (from KS2 school info)
  - "Schools with matching EAL %" (from census)

#### Inspector Lens Mode
- Highlights what Ofsted would focus on:
  - Disadvantaged gap vs national
  - Attendance trend direction
  - Progress measures vs floor standard
  - Exclusion rates vs similar schools
  - Staff turnover vs stability threshold
- Pre-builds the data story an inspector would construct

---

## Visual Design — Napkin AI Style

### Design Principles
1. **Animated, alive** — nothing static. Data flows, connections pulse, insights slide in
2. **Progressive disclosure** — starts simple, reveals depth on interaction
3. **Logo-centric** — real brand logos (DfE, Google Drive, Arbor, SIMS) as connection nodes
4. **Yarn aesthetic** — data connections visualised as coloured threads weaving between sources
5. **One step ahead** — suggestions appear before user thinks to ask

### Key Views

#### 1. Connection Map (Landing View)
- Centre: School logo/name
- Surrounding: Data source nodes (DfE crest, Google Drive logo, etc.) with animated yarn threads connecting to the school
- Each thread pulses with the school's brand colour
- Hover on a source → shows data summary ("KS2: 79% expected in Reading, top quartile in Bradford")
- Click a source → zooms into that dataset's detail view
- Framer Motion spring animations throughout

#### 2. Insight Feed
- Right-side panel or card stream
- Smart suggestions animate in with gentle slide + fade
- Each card: icon, title, one-line insight, "Explore" button
- Priority-sorted by relevance score
- Inspector-relevant insights get a subtle shield icon
- Examples:
  - "Your attendance is 0.8% below the Bradford average — but improving faster than peers"
  - "3 similar schools improved KS2 maths by 5+ points — want to see their workforce profiles?"
  - "Your exclusion rate halved since 2022 — that's a positive Ofsted talking point"

#### 3. Comparison Dashboard Builder
- Drag-and-drop widget canvas
- Widget library: bar chart, line chart, scatter plot, map, league table, RAG summary
- Each widget auto-suggests the best smart filter for its data
- Live preview as you build
- Save + share dashboards
- Export to PDF for governors

#### 4. Deep Dive View
- Click any data point → full context panel slides in
- Shows: your value, national average, LA average, similar schools average, trend, rank
- "What this means" AI-generated plain English explanation
- "What to do about it" — links to relevant actions, EEF strategies, Ed conversations

### Animation Specifications
- **Page transitions**: Framer Motion `layout` animations, 300ms spring
- **Data loading**: Skeleton shimmer → staggered reveal (50ms per item)
- **Connection threads**: SVG path animation with `stroke-dashoffset`, 2s loop
- **Pulse on fresh data**: CSS `@keyframes pulse` with brand colour, `prefers-reduced-motion` respected
- **Insight cards**: `AnimatePresence` with slide-up + fade, exit slide-right
- **Charts**: Recharts with custom animated entry, 800ms ease-out
- **Numbers**: Count-up animation from 0 to value, 600ms

### Colour System
- Connection threads use the 7-planet module colours
- Mercury (#6B7280) for improvement data
- Saturn (#A78BFA) for intelligence data  
- Mars (#9F1239) for compliance flags
- Emerald (#10B981) for positive trends
- Amber (#F59E0B) for watch items
- Red (#EF4444) for inspector flags

---

## Technical Architecture

### Database
- Existing 6 DfE tables (3.7M rows) — no changes needed
- New table: `smart_dashboards` — saved dashboard configurations per school
- New table: `smart_suggestions` — cached insight suggestions per school (refreshed on data update)
- New table: `smart_filter_configs` — saved filter presets per school

### API Routes
- `GET /api/intelligence/compare` — proximity/similar school comparison
- `GET /api/intelligence/suggest` — smart suggestions for a school
- `POST /api/intelligence/dashboard` — save/load dashboard configs
- `GET /api/intelligence/filter/:type` — apply a smart filter to any dataset

### Ed Integration
- Ed can answer: "How do we compare to nearby schools on attendance?"
- Ed morning briefing surfaces top 3 daily insights from smart suggestions
- Ed can build dashboards via conversation: "Show me our KS2 trend vs Bradford average"

### Performance
- Pre-compute similar school groups nightly (cache in `smart_suggestions`)
- Proximity search uses PostGIS or Haversine SQL function on lat/lng
- Dashboard widgets lazy-load data on scroll
- Comparison queries use materialised views for common patterns

---

## Build Phases

### Phase 1: Foundation (1 week)
- Smart filter service architecture (`src/lib/smart-filters/`)
- Postcode distance calculator using GIAS lat/lng
- Similar schools matching query
- Basic comparison API (`/api/intelligence/compare`)
- Connection map landing view (animated, logo nodes, yarn threads)

### Phase 2: Intelligence Dashboard (1 week)
- Insight suggestion engine
- Smart suggestion cards with relevance scoring
- Deep dive panel for any data point
- Percentage + count filters with auto-benchmarking

### Phase 3: Dashboard Builder (1 week)
- Drag-and-drop widget canvas
- Chart widgets (bar, line, scatter, map)
- Save/share/export dashboards
- Inspector lens mode

### Phase 4: Universal Rollout (1 week)
- Wire smart filters into Estates, HR, Compliance, Finance
- Ed conversation integration
- Morning briefing integration
- Date + currency + category filters

---

## Success Metrics
- Sandra opens Intelligence → sees her school connected to 6 datasets in under 2 seconds
- First smart suggestion appears within 3 seconds of page load
- Sandra can build a governor-ready comparison dashboard in under 5 minutes
- Inspector lens mode highlights the same issues a real inspector would raise
- Zero training needed — the tool suggests what to look at

---

## Reference
- Napkin AI (napkin.ai) — visual style reference for animated connections
- DfE Explore Education Statistics — data source
- Schoolgle yarn/wool brand aesthetic — thread connections
- Framer Motion — animation library (already in codebase)
- Recharts — chart library (already in codebase)
