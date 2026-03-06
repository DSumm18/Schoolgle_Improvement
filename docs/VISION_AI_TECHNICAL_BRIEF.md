# Schoolgle Vision AI -- Technical Brief

**Prepared for:** David Summerscales, Schoolgle Ltd
**Date:** March 2026
**Author:** Claude Code (Codebase Audit & Architecture)
**Version:** 2.0 -- Updated with Ed-first architecture, Room Check Register, tamper-proof evidence, insurance positioning, per-pupil pricing

---

## Executive Summary

Schoolgle Vision AI turns a phone camera into an intelligent compliance sensor. A 60-second room spin -- shared to Ed the chatbot -- simultaneously updates estates compliance, asset management, COSHH register, safeguarding checks, helpdesk, and teaching & learning assessments. No forms, no checklists, no logins to separate systems.

The core commercial value is **litigation-proof premises evidence**. Unlike tick-box checklists, timestamped visual evidence with AI assessment, device GPS, and tamper-proof locking is defensible against personal injury claims, HSE investigations, and Ofsted scrutiny.

**Pricing model:** Per-pupil (matching RPA/Zurich convention). ~£2-3/pupil/year.
**AI cost per school:** ~£8-25/month. **Margin: 85-95%.**
**Ship Sentinel MVP: ~2 weeks.**

---

## 1. Current State Audit

### What Already Exists

#### A. Vision & Image Processing

| Asset                | Location                                             | Capability                                                                                                                     |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Screen Analyzer**  | `src/lib/vision/screen-analyzer.ts`                  | Gemini 3 Flash via Google API. Accepts base64 image, returns structured JSON. Direct Gemini API call pattern (not OpenRouter). |
| **Vision Fallback**  | `packages/form-skill/src/vision-fallback.ts`         | Claude 3.5 Sonnet via OpenRouter. Screenshot-to-structured-data pipeline.                                                      |
| **PhotoCapture**     | `src/components/estates-compliance/PhotoCapture.tsx` | Full camera component: `getUserMedia()`, front/back switching, canvas capture, gallery upload, caption metadata. Mobile-ready. |
| **VoiceObservation** | `src/components/VoiceObservation.tsx`                | MediaRecorder API, audio capture, transcription endpoint.                                                                      |

**Key finding:** The PhotoCapture component is production-quality and directly reusable. The screen-analyzer pattern (base64 -> Gemini API -> structured JSON) is exactly what the Vision AI service needs.

#### B. COSHH & Estates Compliance

| Asset                         | Location                                          | Status                                                                                                                                             |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **COSHH Checks**              | `src/lib/estates-compliance/coshh-checks.ts`      | 13 statutory checks defined. Already references photo evidence, inventory management, SDS accessibility, storage security, chemical compatibility. |
| **Estates Compliance Module** | `src/app/(dashboard)/estates-compliance/`         | 10+ pages: assets, contractors, tasks, evidence, helpdesk, daily-checks, diary, inspections, reports.                                              |
| **Asset Register**            | `estates_assets` table                            | Hierarchical: building > floor > room > equipment. Types include fire extinguisher, emergency light, vehicle.                                      |
| **Evidence System**           | `estates_evidence` table                          | File storage with AI verification, expiry tracking, cloud integration.                                                                             |
| **Daily Checklists**          | `src/lib/estates-compliance/daily-checks.ts`      | Opening/closing checks. Tap-through pass/fail with photo requirements.                                                                             |
| **Findings Engine**           | `src/lib/estates-compliance/findings-database.ts` | AI classification: STATUTORY vs GOOD PRACTICE vs CONTRACTOR SUGGESTION. 50+ regulatory requirements database.                                      |
| **18 Compliance Domains**     | `src/lib/estates-compliance/`                     | Fire safety, legionella, asbestos, electrical, gas, COSHH, food safety, transport, safeguarding, seasonal, etc.                                    |

**Key finding:** The estates module is mature. COSHH checks already define the compliance requirements that Sentinel will automate. The asset register, evidence system, and findings engine are ready to consume Vision AI output.

#### C. AI Model Routing

| Router                      | Location                                  | Pattern                                                                                                                  |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ed-agents ModelRouter**   | `packages/ed-agents/src/models/router.ts` | Task + subscription tier + credit-aware selection. 20+ models via OpenRouter. Has `buildVisionMessage()` for multimodal. |
| **ai-evidence-matcher**     | `src/lib/ai-evidence-matcher.ts`          | Document-type heuristics. DeepSeek primary, Mistral OCR, Qwen vision, Gemini fallback.                                   |
| **ed-backend model-router** | `packages/ed-backend/lib/model-router.ts` | Complexity-based. `vision_analysis` -> Qwen 2.5 VL, `ocr` -> Mistral Pixtral.                                            |
| **Automation models**       | `src/lib/automation/model-config.ts`      | Direct Gemini API (not OpenRouter).                                                                                      |
| **AIEngine**                | `packages/core-ai/ai-engine.ts`           | Provider-level fallback chain (Gemini -> OpenRouter).                                                                    |

**Key finding:** Multiple model routing implementations exist but share no common interface. The ed-agents `ModelRouter` is the most sophisticated and should be the foundation for Vision AI routing.

#### D. DealFind (Separate Supabase Project)

| Asset                   | Location                                       | Status                                                                |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **Database**            | Supabase project `eoddcijijjrmksnwsodq`        | Live with 21 migrations applied                                       |
| **Suppliers table**     | `public.suppliers`                             | 22 UK school suppliers seeded                                         |
| **Products table**      | `public.products`                              | ~40 scraped products with SKU, brand, barcode, fingerprint            |
| **Prices table**        | `public.prices`                                | Per-supplier pricing with stock, delivery costs, bulk discounts       |
| **Categories**          | `public.categories` + `public.deal_categories` | 14 categories                                                         |
| **Product Matching**    | `find_similar_products()`                      | 5-strategy: SKU > barcode > fingerprint > fuzzy name > brand+category |
| **Firecrawl Extractor** | `server/extractors/firecrawl.ts`               | Scrape product pages -> structured JSON via Firecrawl v4 SDK          |

**Key finding:** DealFind has a working product/supplier database but lives in a separate Supabase project. Must migrate into main Schoolgle Supabase for Sentinel integration.

#### E. What Does NOT Exist

- No Sentinel / chemical scanner code
- No room check register or visual evidence logging
- No lone worker monitoring
- No video clip analysis
- No building walkthrough inspection AI
- No affiliate/commission tracking
- No consumption/reorder intelligence
- No offline/queue sync mechanism
- No GDPR face-detection/blurring pipeline
- No tamper-proof evidence chain

---

## 2. Product Architecture: Ed-First Room Intelligence

### The Core Concept

A single action -- phone camera spin of a room, shared to Ed -- updates **every relevant module simultaneously**. The person recording doesn't need to know what they're looking for. Ed knows.

```
Phone camera -> Ed (chatbot) -> Vision Service -> Multi-module dispatcher
                                                    |-- Estates compliance
                                                    |-- Asset register
                                                    |-- Helpdesk (auto-creates ticket)
                                                    |-- COSHH register
                                                    |-- Teaching & Learning
                                                    |-- Safeguarding
                                                    |-- Room Check Register (audit trail)
```

### What One Room Spin Produces

| What Ed checks                                                     | Module updated                 | Who cares        |
| ------------------------------------------------------------------ | ------------------------------ | ---------------- |
| Fire exits clear, not blocked?                                     | Estates Compliance             | Site manager     |
| Damage -- cracked windows, broken furniture, water stains?         | Helpdesk (auto-creates ticket) | Site manager     |
| Assets in place -- projector, extinguisher, first aid kit?         | Asset Register                 | Business manager |
| COSHH -- chemicals visible in science/DT room?                     | COSHH Register                 | H&S lead         |
| Classroom setup -- tables arranged for learning, displays current? | Teaching & Learning            | SLT              |
| Safeguarding -- sight lines clear, no hidden areas?                | Safeguarding checks            | DSL              |
| Trip hazards, trailing cables, wet floors?                         | H&S log                        | Anyone           |

### User Journeys

**Caretaker (term time, 6:30am):**
Opens Ed on phone. "Morning Ed, starting rounds." Walks to each room, does a quick spin or takes a photo, says "Room 4 done." Ed logs it, checks it, moves to next room. Caretaker finishes in 20 minutes. Head teacher sees all-green board by 7am.

**Teacher (ad hoc):**
"Ed, the ceiling in Room 12 is leaking." Takes a photo. Ed creates a helpdesk ticket, logs the evidence, flags it as urgent to the site manager. No form, no email chain.

**Caretaker (summer holidays):**
"Ed, I've finished painting Room 6. Here's the video." Ed logs it as holiday progress, head sees the update at home. Next day: "Ed, the contractor says he's done the skirting in Room 4." Caretaker does a spin. Ed compares against the snagging list: "Two items still outstanding -- the door frame hasn't been filled and the socket plate is missing. I've updated the snagging report."

**Head teacher (any time):**
Opens room check dashboard. Sees which rooms are done, which are missed, trend over the term. Before Ofsted: "Show me the last 30 days of morning checks" -- instant evidence of premises management.

### Service Location

**Next.js API routes + shared service layer:**

```
apps/platform/src/
  lib/
    vision/
      service.ts              # Core VisionService class
      dispatcher.ts           # Routes findings to multiple modules
      contexts/
        room-assessment.ts    # Universal room scan (the default)
        coshh.ts              # COSHH-specific chemical scanning
        snagging.ts           # Contractor before/after comparison
        lone-worker.ts        # Lone worker safety context
      models.ts               # Vision-specific model routing
      types.ts                # Shared types
      privacy.ts              # Face blur, retention policies
      evidence.ts             # Tamper-proof evidence chain
      offline-queue.ts        # IndexedDB queue for offline capture
  app/api/
    vision/
      analyze/route.ts        # POST: Submit image/video for analysis
      stream/route.ts         # POST: SSE stream for real-time feedback
      queue/route.ts          # POST: Offline sync endpoint
    room-checks/
      route.ts                # GET: Room check status dashboard data
      [assetId]/route.ts      # GET/POST: Individual room check CRUD
      schedule/route.ts       # GET/PUT: Room check schedule config
      export/route.ts         # GET: Evidence export for claims
```

### Core Service Interface

```typescript
// lib/vision/types.ts

type VisionContextType =
  | "room-assessment" // Universal room scan (default)
  | "coshh-scan" // Chemical-specific deep scan
  | "snagging" // Contractor work comparison
  | "lone-worker"; // Safety monitoring

interface VisionRequest {
  contextType: VisionContextType;
  organizationId: string;
  mediaType: "image" | "video-clip";
  media: string; // Base64 data or storage URL
  mimeType: string;
  metadata: {
    assetId: string; // Room/space from estates_assets
    capturedAt: string; // Device timestamp (ISO)
    deviceGps?: { lat: number; lng: number };
    deviceId?: string; // Device fingerprint
    checkType?:
      | "am_open"
      | "pm_close"
      | "holiday_progress"
      | "contractor_snagging"
      | "ad_hoc";
  };
}

interface VisionResult {
  contextType: VisionContextType;
  confidence: number;
  items: VisionItem[];
  compliance: ComplianceAssessment;
  actions: SuggestedAction[];
  dispatches: ModuleDispatch[]; // What was sent to which module
  summary: string; // Ed's plain-English summary
}

interface ModuleDispatch {
  module:
    | "estates"
    | "helpdesk"
    | "asset_register"
    | "coshh"
    | "teaching_learning"
    | "safeguarding"
    | "h_and_s";
  action: "updated" | "ticket_created" | "flag_raised" | "no_issues";
  detail: string;
  referenceId?: string; // Created ticket/action ID
}
```

---

## 3. Room Check Register -- Auditable Evidence

### The Insurance & Liability Case

This is the killer value proposition. A tick box on a checklist proves someone clicked a button. A timestamped visual evidence chain proves:

- **Who** checked (authenticated user)
- **When** exactly (device timestamp + server timestamp, can't be backdated)
- **Where** they were (GPS + room ID)
- **What they saw** (video/image of actual conditions)
- **What AI assessed** (structured findings with confidence scores)

**Example scenario:** A toilet cubicle door falls on a staff member's foot. She's off work for a month, then leaves, then files a personal injury claim 3 months later.

|                  | With tick box                    | With Schoolgle Vision                                                                  |
| ---------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Evidence quality | "Dave ticked the box"            | Timestamped video showing door intact at 06:42, AI log confirming "no issues detected" |
| Claim outcome    | Insurer settles. Premium impact. | Claim dismissed or settles fast with minimal payout.                                   |

### School Insurance Context

- **RPA (Risk Protection Arrangement):** Government-backed mutual pool for academies/MATs. ~£25-30/pupil flat rate. No individual risk discount.
- **Zurich Municipal:** Main commercial alternative for maintained schools.

You can't negotiate down RPA premiums with better evidence. But:

- **RPA and Zurich both investigate claims.** The quality of evidence determines whether they defend or settle.
- **For MATs:** Multiple claims across trust schools compound. A trust demonstrating systematic, evidenced premises management across all schools is in a fundamentally different position.
- **For individual schools:** The SBM has personal professional liability. When HSE investigates, they need to show systems were in place.

### Dashboard View

```
Room 4 (Year 2)     [green] AM 06:42 D.Smith    [green] PM 17:15 D.Smith
Room 5 (Year 3)     [green] AM 06:45 D.Smith    [red]   PM -- MISSED
Room 6 (Year 4)     [green] AM 07:02 Mrs Jones  [green] PM 17:18 D.Smith
Science Lab          [green] AM 06:50 D.Smith    [grey]  PM -- pending
Hall                 [amber] AM 06:55 D.Smith    --      2 issues flagged
```

Holiday mode:

```
Room 4 (Year 2)     [tool] Aug 12 09:30 D.Smith  "Painted, new carpet tiles laid"
Room 4 (Year 2)     [clip] Aug 14 11:00 D.Smith  "Contractor snagging -- skirting not finished"
Room 4 (Year 2)     [green] Aug 18 14:20 D.Smith "Snagging resolved, room ready"
```

### Schema

```sql
-- ============================================================================
-- ROOM CHECK SCHEDULE -- Which rooms need checking, when, by whom
-- ============================================================================

CREATE TABLE public.room_check_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  asset_id UUID NOT NULL REFERENCES public.estates_assets(id),

  -- What checks are expected
  am_check_required BOOLEAN DEFAULT true,
  pm_check_required BOOLEAN DEFAULT true,
  am_deadline TIME DEFAULT '08:00',
  pm_deadline TIME DEFAULT '18:00',

  -- Who is responsible (optional -- anyone can do it)
  default_checker_id UUID REFERENCES auth.users(id),

  -- Term time vs holidays
  check_mode TEXT DEFAULT 'term',       -- 'term', 'holiday', 'always', 'disabled'
  holiday_check_frequency TEXT,         -- 'daily', 'weekly', 'as_needed'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, asset_id)
);

-- ============================================================================
-- ROOM CHECKS -- Every individual check performed (tamper-proof evidence)
-- ============================================================================

CREATE TABLE public.room_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  asset_id UUID NOT NULL REFERENCES public.estates_assets(id),
  checked_by UUID NOT NULL REFERENCES auth.users(id),

  -- When and what type
  check_type TEXT NOT NULL,             -- 'am_open', 'pm_close', 'holiday_progress',
                                        -- 'contractor_snagging', 'ad_hoc'
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Media evidence
  media_type TEXT DEFAULT 'image',      -- 'image', 'video_clip'
  media_urls TEXT[],                    -- Supabase Storage paths
  media_retention_until DATE,           -- GDPR auto-delete date

  -- Evidence integrity (tamper-proof)
  media_hash TEXT,                      -- SHA-256 of original media (tamper detection)
  device_gps POINT,                     -- GPS coordinates at time of capture
  device_id TEXT,                       -- Device fingerprint
  capture_timestamp TIMESTAMP WITH TIME ZONE,  -- Device clock time
  server_received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Vision AI results
  vision_scan_id UUID REFERENCES public.vision_scan_sessions(id),
  ai_summary TEXT,                      -- Ed's plain-English summary
  items_detected INT DEFAULT 0,
  issues_found INT DEFAULT 0,
  compliance_score DECIMAL(3, 2),       -- 0.00 to 1.00

  -- Module dispatches (what was updated from this check)
  dispatched_to JSONB DEFAULT '[]',     -- [{"module":"estates","action_id":"..."}]

  -- Holiday/contractor use
  work_notes TEXT,
  contractor_name TEXT,
  is_snagging BOOLEAN DEFAULT false,

  -- Tamper-proof locking
  evidence_locked BOOLEAN DEFAULT false,
  evidence_locked_at TIMESTAMP WITH TIME ZONE,

  status TEXT DEFAULT 'complete',       -- 'complete', 'issues_flagged', 'snagging_open'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_room_checks_org_date ON public.room_checks(organization_id, checked_at DESC);
CREATE INDEX idx_room_checks_asset_date ON public.room_checks(asset_id, checked_at DESC);
CREATE INDEX idx_room_checks_type ON public.room_checks(check_type);

-- ============================================================================
-- TAMPER PREVENTION -- Evidence cannot be modified once locked
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_evidence_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.evidence_locked = true THEN
    RAISE EXCEPTION 'Cannot modify locked evidence record %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_room_checks_tamper_proof
  BEFORE UPDATE OR DELETE ON public.room_checks
  FOR EACH ROW EXECUTE FUNCTION prevent_evidence_tampering();

-- Auto-lock evidence after 24 hours (run via scheduled job)
CREATE OR REPLACE FUNCTION auto_lock_evidence()
RETURNS void AS $$
BEGIN
  UPDATE public.room_checks
  SET evidence_locked = true, evidence_locked_at = NOW()
  WHERE evidence_locked = false
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DAILY STATUS VIEW -- One row per room per day for dashboard
-- ============================================================================

CREATE VIEW public.room_check_daily_status AS
SELECT
  rs.organization_id,
  rs.asset_id,
  ea.name AS room_name,
  ea.building,
  ea.floor,
  CURRENT_DATE AS check_date,
  rs.am_check_required,
  rs.pm_check_required,
  rs.am_deadline,
  rs.pm_deadline,
  -- AM status
  am.id AS am_check_id,
  am.checked_by AS am_checked_by,
  am.checked_at AS am_checked_at,
  am.issues_found AS am_issues,
  am.ai_summary AS am_summary,
  am.compliance_score AS am_score,
  CASE
    WHEN am.id IS NOT NULL AND am.issues_found > 0 THEN 'issues'
    WHEN am.id IS NOT NULL THEN 'done'
    WHEN rs.am_check_required AND CURRENT_TIME > rs.am_deadline THEN 'missed'
    WHEN rs.am_check_required THEN 'pending'
    ELSE 'not_required'
  END AS am_status,
  -- PM status
  pm.id AS pm_check_id,
  pm.checked_by AS pm_checked_by,
  pm.checked_at AS pm_checked_at,
  pm.issues_found AS pm_issues,
  pm.ai_summary AS pm_summary,
  pm.compliance_score AS pm_score,
  CASE
    WHEN pm.id IS NOT NULL AND pm.issues_found > 0 THEN 'issues'
    WHEN pm.id IS NOT NULL THEN 'done'
    WHEN rs.pm_check_required AND CURRENT_TIME > rs.pm_deadline THEN 'missed'
    WHEN rs.pm_check_required THEN 'pending'
    ELSE 'not_required'
  END AS pm_status
FROM public.room_check_schedule rs
JOIN public.estates_assets ea ON ea.id = rs.asset_id
LEFT JOIN public.room_checks am ON am.asset_id = rs.asset_id
  AND am.check_type = 'am_open'
  AND am.checked_at::DATE = CURRENT_DATE
LEFT JOIN public.room_checks pm ON pm.asset_id = rs.asset_id
  AND pm.check_type = 'pm_close'
  AND pm.checked_at::DATE = CURRENT_DATE;
```

### Evidence Export for Claims

When a school needs to respond to a personal injury claim or HSE investigation:

```typescript
// GET /api/room-checks/export?assetId=xxx&from=2026-02-01&to=2026-04-30
// Returns PDF with:
// - All checks for that room in the date range
// - Timestamped images with AI assessments
// - Integrity statement (SHA-256 hashes verified, evidence locked)
// - Chain of custody: who checked, when, device GPS
// - Any issues flagged and actions taken
```

One click. Sent to the insurer. Case closed.

---

## 4. Model Routing Recommendation

### Cost-Optimised Approach

**Default mode: Photos, not video.** A room spin captures 8-12 photos (keyframes extracted from a short clip or taken individually). Each photo analysed by Gemini Flash. Video is available but not the default.

| Context                          | Primary Model               | Method                   | Fallback                        | Cost/call |
| -------------------------------- | --------------------------- | ------------------------ | ------------------------------- | --------- |
| **Room assessment** (default)    | `google/gemini-2.5-flash`   | 8-12 keyframes from spin | `qwen/qwen-2.5-vl-72b-instruct` | ~$0.03    |
| **COSHH scan** (chemical labels) | `google/gemini-2.5-flash`   | Single image, high OCR   | `qwen/qwen-2.5-vl-72b-instruct` | ~$0.003   |
| **Snagging** (before/after)      | `google/gemini-2.5-pro`     | Multi-image comparison   | `openai/gpt-4o`                 | ~$0.01    |
| **Lone worker** (person check)   | `google/gemini-2.5-flash`   | Periodic single frame    | On-device ML (future)           | ~$0.002   |
| **Report generation**            | `anthropic/claude-sonnet-4` | Structured JSON -> prose | `deepseek/deepseek-chat`        | ~$0.008   |

### Monthly Cost Per School

| School type            | Rooms     | AM + PM checks           | Monthly AI cost |
| ---------------------- | --------- | ------------------------ | --------------- |
| Primary (1-form entry) | ~12 rooms | 12 x 2 x 20 days x $0.03 | **~$14**        |
| Primary (2-form entry) | ~20 rooms | 20 x 2 x 20 x $0.03      | **~$24**        |
| Secondary              | ~40 rooms | 40 x 2 x 20 x $0.03      | **~$48**        |
| + 4 COSHH scans/month  |           | 4 x $0.003               | +$0.01          |
| + Monthly report       |           | 1 x $0.008               | +$0.01          |

**Worst case (large secondary): ~$50/month AI cost.**

### Routing Implementation

Extend `packages/ed-agents/src/models/router.ts`:

```typescript
// Add to TASK_MODEL_MAP:
'vision-room': ['google/gemini-2.5-flash', 'qwen/qwen-2.5-vl-72b-instruct'],
'vision-coshh': ['google/gemini-2.5-flash', 'qwen/qwen-2.5-vl-72b-instruct'],
'vision-snagging': ['google/gemini-2.5-pro', 'openai/gpt-4o'],
'vision-lone-worker': ['google/gemini-2.5-flash'],
'vision-report': ['anthropic/claude-sonnet-4', 'deepseek/deepseek-chat'],
```

**Use direct Gemini API** for all vision tasks (following screen-analyzer.ts pattern). Lower latency, native video support. OpenRouter only for report generation.

---

## 5. Commercial Model

### Pricing: Per-Pupil (Matching Insurance Convention)

Schools think in per-pupil costs. RPA is per-pupil. Zurich is per-pupil. Schoolgle Vision should be too.

| Tier                   | Price                    | Target                           | Revenue example                 |
| ---------------------- | ------------------------ | -------------------------------- | ------------------------------- |
| **Standalone school**  | £3/pupil/year (min £500) | Individual primaries/secondaries | 400-pupil primary = £1,200/year |
| **MAT (5-15 schools)** | £2.50/pupil/year         | Small-medium trusts              | 5,000 pupils = £12,500/year     |
| **MAT (15+ schools)**  | £2/pupil/year            | Large trusts                     | 15,000 pupils = £30,000/year    |

### Unit Economics

|                | Primary (400 pupils) | Secondary (1,200 pupils) | 10-school MAT (5,000 pupils) |
| -------------- | -------------------- | ------------------------ | ---------------------------- |
| Annual revenue | £1,200               | £3,600                   | £12,500                      |
| Annual AI cost | ~£170                | ~£580                    | ~£2,400                      |
| Gross margin   | **86%**              | **84%**                  | **81%**                      |

### Who Buys

| Buyer                       | Why they pay                                                                             | Evidence they need                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **School Business Manager** | Personal professional liability. HSE investigation = they need to prove systems existed. | Defensible evidence chain                          |
| **Trust COO/CFO**           | Claims across 10-20 schools compound. One bad claim = £50-100k+ legal fees.              | Consistent standard across all trust schools       |
| **Headteacher**             | Ofsted asks "how do you ensure premises safety?" Needs more than "Dave checks."          | Something they can show an inspector in 30 seconds |
| **Trust Board/Governors**   | Corporate directors' liability for H&S failures.                                         | Assurance that due diligence is happening          |

### The Pitch

> "When the claim comes -- and it will come -- do you want a tick box or a timestamped video showing the room was safe?"

Every SBM has had a near-miss or an actual claim. They know exactly what this solves.

---

## 6. DealFind Integration Spec

### Current DealFind Schema (Separate Supabase Project)

```
suppliers            -> id, name, website, logo_url, verified
products             -> id, name, description, sku, brand, barcode, fingerprint,
                        source_url, image_url, category_id, supplier_id
prices               -> id, product_id, supplier_id, price_gbp, rrp_gbp,
                        bulk_discount_threshold, bulk_discount_pct, in_stock,
                        delivery_cost_gbp, price_date, data_source
product_unit_details -> product_id, pack_quantity, pack_unit, unit_weight_g,
                        unit_volume_ml, unit_price_each, equivalence_group
categories           -> id, name, slug, description, parent_id, is_featured
supplier_url_patterns -> supplier_id, url_pattern, search_url_template
find_similar_products() -> 5-strategy matching function
```

### Integration: Migrate into Main Supabase

**Recommendation:** Migrate DealFind tables into `apps/platform/supabase/migrations/`. Single auth, single project, Sentinel can JOIN directly.

### New Tables for Sentinel + Procurement

```sql
-- COSHH Register (Vision AI output persistence)
CREATE TABLE public.coshh_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  product_id UUID REFERENCES public.products(id),

  -- Identification (from Vision AI)
  product_name TEXT NOT NULL,
  brand TEXT,
  manufacturer TEXT,
  barcode TEXT,

  -- Hazard Classification
  ghs_hazard_codes TEXT[],
  ghs_pictogram_codes TEXT[],
  signal_word TEXT,
  hazard_statements TEXT[],
  precautionary_statements TEXT[],

  -- Storage & Compliance
  storage_location_id UUID REFERENCES public.estates_assets(id),
  storage_conditions TEXT,
  incompatible_with TEXT[],
  max_storage_quantity TEXT,
  current_quantity TEXT,
  expiry_date DATE,

  -- Documentation
  sds_url TEXT,
  risk_assessment_url TEXT,
  coshh_assessment_date DATE,

  -- Procurement link
  last_purchase_date DATE,
  last_purchase_price DECIMAL(10, 2),
  last_supplier_id UUID REFERENCES public.suppliers(id),
  typical_reorder_interval_days INT,

  -- Vision AI metadata
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  last_scan_image_url TEXT,
  scan_confidence DECIMAL(3, 2),
  ai_flags TEXT[],

  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vision Scan Sessions
CREATE TABLE public.vision_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  context_type TEXT NOT NULL,

  location_id UUID REFERENCES public.estates_assets(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  items_detected INT DEFAULT 0,
  issues_flagged INT DEFAULT 0,
  compliance_score DECIMAL(3, 2),

  media_urls TEXT[],
  media_retention_until DATE,

  report_json JSONB,
  report_pdf_url TEXT,

  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consumption Tracking (for budget intelligence)
CREATE TABLE public.product_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  supplier_id UUID REFERENCES public.suppliers(id),

  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  purchase_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',

  budget_year TEXT,
  budget_category TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School Budget Periods (for year-end intelligence)
CREATE TABLE public.school_budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  financial_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budgets JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, financial_year)
);
```

---

## 7. Affiliate/Referral Tracking

### Schema

```sql
CREATE TABLE public.affiliate_programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  programme_type TEXT NOT NULL,
  commission_pct DECIMAL(5, 2),
  commission_fixed DECIMAL(10, 2),
  tracking_method TEXT,
  tracking_param TEXT,
  min_order_value DECIMAL(10, 2),
  payment_terms TEXT,
  contract_start DATE,
  contract_end DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tracked_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  affiliate_programme_id UUID REFERENCES public.affiliate_programmes(id),

  order_reference TEXT,
  order_date DATE NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL,
  items JSONB,

  commission_amount DECIMAL(10, 2),
  commission_status TEXT DEFAULT 'pending',
  commission_paid_date DATE,
  referral_source TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE VIEW public.commission_summary AS
SELECT
  ap.supplier_id,
  s.name AS supplier_name,
  ap.commission_pct,
  COUNT(tp.id) AS total_orders,
  SUM(tp.order_total) AS total_order_value,
  SUM(tp.commission_amount) AS total_commission,
  SUM(CASE WHEN tp.commission_status = 'paid' THEN tp.commission_amount ELSE 0 END) AS paid_commission,
  SUM(CASE WHEN tp.commission_status = 'pending' THEN tp.commission_amount ELSE 0 END) AS pending_commission
FROM public.affiliate_programmes ap
JOIN public.suppliers s ON s.id = ap.supplier_id
LEFT JOIN public.tracked_purchases tp ON tp.affiliate_programme_id = ap.id
GROUP BY ap.supplier_id, s.name, ap.commission_pct;
```

### Target Suppliers

| Category                    | Suppliers                                              | Affiliate potential                             |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| **Cleaning chemicals**      | Jangro, Selden, Evans Vanodine, Clover, Zenith Hygiene | HIGH -- trade distributor models, 8-15% margins |
| **Janitorial**              | Gompels, Alliance Online, Bunzl                        | HIGH -- repeat orders, standard trade terms     |
| **Science consumables**     | Philip Harris, Timstar, Breckland Scientific           | MEDIUM -- framework agreements                  |
| **Safety equipment**        | Arco, RS Components, Cromwell                          | MEDIUM -- trade account programmes              |
| **General school supplies** | YPO, ESPO, Hope Education                              | LOW -- buying consortia, not referral-based     |

**Start with:** Jangro, Gompels, Alliance Online.

---

## 8. GDPR & Privacy

1. **Retention policy:** Images/video retained until compliance report generated + 30 days. Auto-delete via scheduled job using `media_retention_until` field.

2. **Face detection:** Client-side blur using `face-api.js` (TensorFlow.js) before upload. Faces never reach the server. This works offline too.

3. **Data minimisation:** Vision AI receives images but does not store them. Only structured JSON results are persisted. Raw media goes to time-limited Supabase Storage with auto-expiry.

4. **Consent notice:** Walkthrough mode displays: "This area is being scanned for compliance purposes. No personal data is retained."

5. **Lone worker:** Explicit opt-in. Camera data only captured during active sessions. Video clips only transmitted on panic/alert.

6. **Tamper-proof evidence:** SHA-256 hash of original media, evidence auto-locked after 24 hours, append-only audit trail. Cannot be edited or deleted once locked.

---

## 9. Prioritised Build Order

### Phase 0: Shared Infrastructure (5-7 days)

| Task                                                       | Effort  | Dependencies       |
| ---------------------------------------------------------- | ------- | ------------------ |
| `lib/vision/service.ts` + `types.ts` core service          | 1 day   | None               |
| `lib/vision/models.ts` vision model routing                | 1 day   | None               |
| `lib/vision/dispatcher.ts` multi-module finding router     | 1 day   | None               |
| `lib/vision/evidence.ts` tamper-proof hashing + locking    | 0.5 day | None               |
| `lib/vision/privacy.ts` face detection + retention         | 1 day   | None               |
| `POST /api/vision/analyze` endpoint                        | 0.5 day | service.ts         |
| Room check tables migration (schedule, checks, daily view) | 0.5 day | None               |
| DealFind tables migration into main Supabase               | 1 day   | None               |
| COSHH register + vision scan sessions tables               | 0.5 day | DealFind migration |

### Phase 1: Room Check Register + Ed Integration (8-10 days)

| Task                                                                    | Effort   | Dependencies                |
| ----------------------------------------------------------------------- | -------- | --------------------------- |
| `lib/vision/contexts/room-assessment.ts` -- universal room scan prompts | 2 days   | Phase 0                     |
| Room check dashboard page (`/dashboard/estates-compliance/room-checks`) | 2 days   | Room check tables           |
| Ed chatbot integration: receive media, log check, dispatch findings     | 2 days   | Vision service + dispatcher |
| Room check schedule configuration UI                                    | 1 day    | Schedule table              |
| Missed check alerts (push notification or Ed message)                   | 0.5 day  | Schedule + checks           |
| Evidence export endpoint (`/api/room-checks/export`)                    | 1 day    | room_checks table           |
| `lib/vision/offline-queue.ts` IndexedDB + sync                          | 1.5 days | /api/vision/analyze         |

### Phase 2: Sentinel -- COSHH Scanner (6-8 days)

| Task                                                                         | Effort   | Dependencies          |
| ---------------------------------------------------------------------------- | -------- | --------------------- |
| `lib/vision/contexts/coshh.ts` -- chemical-specific prompts, GHS recognition | 2 days   | Phase 0               |
| Sentinel scan UI (`/dashboard/estates-compliance/sentinel`)                  | 1.5 days | PhotoCapture (exists) |
| COSHH register CRUD API                                                      | 1 day    | COSHH register table  |
| Auto-populate register from scan results                                     | 1 day    | Register API          |
| DealFind product matching from scan (barcode/name/brand)                     | 1 day    | DealFind tables       |
| Price comparison panel                                                       | 1 day    | Product matching      |

### Phase 3: Holiday Mode + Snagging (5-6 days)

| Task                                                                | Effort   | Dependencies     |
| ------------------------------------------------------------------- | -------- | ---------------- |
| Holiday check mode (progress tracking, work notes, contractor logs) | 1.5 days | Room checks      |
| `lib/vision/contexts/snagging.ts` -- before/after comparison        | 2 days   | Phase 0          |
| Snagging report generation + sign-off workflow                      | 1.5 days | Snagging context |

### Phase 4: Procurement Intelligence (5-7 days)

| Task                           | Effort   | Dependencies          |
| ------------------------------ | -------- | --------------------- |
| Consumption tracking API       | 1 day    | Phase 2               |
| Purchase history from DealFind | 1 day    | DealFind integration  |
| Budget period config UI        | 1 day    | school_budget_periods |
| Reorder prediction             | 1.5 days | Consumption data      |
| Year-end budget alerts         | 1.5 days | Budget periods        |

### Phase 5: Affiliate Tracking + Lone Worker (5-6 days)

| Task                                           | Effort   | Dependencies        |
| ---------------------------------------------- | -------- | ------------------- |
| Affiliate programme + purchase tracking tables | 0.5 day  | Phase 0             |
| Affiliate link generation + purchase webhook   | 1.5 days | Affiliate tables    |
| Commission dashboard                           | 1 day    | Commission view     |
| `lib/vision/contexts/lone-worker.ts`           | 1 day    | Phase 0             |
| Lone worker mode + panic button                | 1 day    | Lone worker context |

### Timeline

```
Week 1-2:   Phase 0 (infra) + Phase 1 (room checks + Ed) -- SHIP MVP
Week 2-3:   Phase 2 (Sentinel COSHH)
Week 3-4:   Phase 3 (holidays + snagging)
Week 5-6:   Phase 4 (procurement) + Phase 5 (affiliate + lone worker)
```

**Total: 35-44 days. Room check MVP ships in ~2 weeks.**

---

## 10. Blockers & Risks

| Risk                                         | Severity | Mitigation                                                                                                                                                                      |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DealFind in separate Supabase**            | HIGH     | Migrate tables first. Blocker for all Sentinel/procurement features.                                                                                                            |
| **Ed chatbot integration**                   | MEDIUM   | Ed needs a media upload path. If Ed doesn't currently accept images/video, this is the first thing to build.                                                                    |
| **Chemical label OCR in real conditions**    | MEDIUM   | Faded labels, poor lighting, cluttered shelves. Robust prompts + manual edit fallback. Test with real caretaker store photos.                                                   |
| **Offline capture in basements/plant rooms** | MEDIUM   | IndexedDB queue captures locally, syncs when online. Phase 0 deliverable.                                                                                                       |
| **Vercel 60s timeout for video**             | MEDIUM   | Default to photo keyframes. 1-min clips extract ~12 frames client-side before upload. No full video processing server-side.                                                     |
| **GDPR faces in footage**                    | HIGH     | Client-side face blur via face-api.js. Faces never reach server.                                                                                                                |
| **Evidence legal admissibility**             | MEDIUM   | SHA-256 hashing, GPS, device fingerprint, tamper-proof locking give strong defensibility. Not a legal guarantee -- consult with insurance advisors on specific claim scenarios. |
| **Per-pupil pricing vs per-school**          | LOW      | Start per-school for simplicity. Switch to per-pupil when selling to MATs. Both can coexist.                                                                                    |

---

## Appendix A: Context-Specific Vision Prompts

### Universal Room Assessment (Default)

```
You are an expert UK school premises inspector. Analyse this image/video of a school room.

Assess ALL of the following simultaneously:

FIRE SAFETY:
- Fire exits: clear, signed, accessible? Any obstructions?
- Fire doors: self-closers intact? Not wedged open?
- Fire extinguishers: present, in location, service date visible?
- Emergency lighting: visible?
- Fire action notices: displayed?

GENERAL SAFETY:
- Trip hazards: trailing cables, wet floors, damaged flooring?
- Broken/damaged furniture or fixtures?
- Water damage, damp, mould?
- Exposed wiring or damaged electrical fittings?
- Windows: intact, secure?

ASSET VERIFICATION:
- List all identifiable equipment/assets visible (projector, whiteboard, extinguisher, first aid kit, etc.)
- Note their apparent condition (good/fair/poor/damaged)

SAFEGUARDING:
- Sight lines clear? No hidden areas?
- Room layout appropriate?

CLASSROOM ENVIRONMENT (if applicable):
- Display boards: current, relevant?
- Furniture layout: appropriate for learning?
- General cleanliness and tidiness?

COSHH (if chemicals visible):
- Identify any chemical products visible
- Are they stored appropriately?
- Any hazard symbols visible?

For each issue found, assign: CRITICAL / HIGH / MEDIUM / LOW

Return structured JSON with sections for each assessment area.
```

### COSHH Chemical Scan

```
You are a COSHH compliance expert analysing a photo of a chemical storage area in a UK school.

Identify every visible product/container. For each one, extract:
- Product name (read the label)
- Brand/manufacturer
- GHS hazard pictograms visible (skull, flame, corrosive, exclamation, etc.)
- GHS hazard codes if readable (H-statements)
- Signal word (Danger/Warning) if visible
- Approximate container size
- Storage condition concerns
- Expiry date if visible
- Barcode/EAN if readable

Also assess overall compliance:
- Are incompatible chemicals separated?
- Is the storage area locked/secured?
- Are SDS sheets visible nearby?
- Any containers without labels?
- Any obvious spill risks?

Return structured JSON matching the VisionResult schema.
```

### Contractor Snagging

```
You are a UK school estates manager comparing contractor work against specifications.

You are provided with:
1. A "before" image showing the state prior to work
2. An "after" image showing current state post-contractor
3. (Optional) The job specification or scope of work

Assess:
- What work has been completed?
- What work appears incomplete or not started?
- What work has been done to a substandard quality?
- Are there any new issues introduced by the contractor?
- Does the work match the specification (if provided)?

For each item, categorise as: COMPLETE / INCOMPLETE / SUBSTANDARD / NOT_STARTED / NEW_ISSUE

Return a structured snagging report with evidence references.
```

---

## Appendix B: Evidence Export Template

When a school exports evidence for an insurance claim or HSE investigation, the PDF contains:

```
SCHOOLGLE PREMISES EVIDENCE REPORT
===================================
School: [Name] ([URN])
Room: [Room name, building, floor]
Period: [Date range]
Generated: [Timestamp]

EVIDENCE INTEGRITY STATEMENT
This report contains [N] premises checks with visual evidence.
All records are tamper-proof (SHA-256 verified, auto-locked after 24 hours).
GPS coordinates confirm the inspector was present at the location.
Device and server timestamps are independently recorded.

CHECK RECORDS
-------------
[For each check in the period:]

Date: 2026-03-03  Time: 06:42:15 GMT
Inspector: David Smith (authenticated user)
Check type: AM Opening Check
Device GPS: 51.5074, -0.1278 (within school boundary)
Device: iPhone 14 Pro (device ID: xxx)

[Embedded image/video still]

AI Assessment:
- Fire exit: CLEAR (confidence: 0.97)
- Fire extinguisher: PRESENT, service date Mar 2026 (confidence: 0.91)
- General condition: GOOD (confidence: 0.94)
- Issues: NONE

Evidence hash: SHA-256 abc123...
Evidence locked: 2026-03-04 06:42:15 GMT (auto-locked)

---
[Next check...]
```
