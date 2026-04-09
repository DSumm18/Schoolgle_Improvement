# Findings Classification System Architecture

## Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐      ┌──────────────────────────────────────┐   │
│  │ Demo Page            │      │ Contractor Report Analyzer            │   │
│  │ - Educational content │      │ - Drag & drop upload                 │   │
│  │ - Example findings   │      │ - Domain selection                    │   │
│  │ - Classification     │      │ - Processing indicator                │   │
│  │   explanation        │      │ - Statistics summary                  │   │
│  └──────────────────────┘      └──────────────────────────────────────┘   │
│                                         │                                    │
│                                         ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Findings List Component                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐   │   │
│  │  │   🔴    │  │   🟡    │  │   🔵    │  │   Filter Tabs       │   │   │
│  │  │Statutory│  │Practice │  │Suggest  │  │ - All (8)           │   │   │
│  │  │  (2)    │  │  (3)    │  │  (3)    │  │ - Statutory (2)     │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  │ - Good Practice (3)  │   │   │
│  │                                        │ - Suggestions (3)     │   │   │
│  │  ┌─────────────────────────────────┐   └─────────────────────┘   │   │
│  │  │ Finding Card                    │                            │   │
│  │  │ - Badge (color-coded)           │                            │   │
│  │  │ - Description                   │                            │   │
│  │  │ - Source (clickable link)       │                            │   │
│  │  │ - Severity indicator            │                            │   │
│  │  │ - Confidence score              │                            │   │
│  │  │ - Expand for details ▼          │                            │   │
│  │  └─────────────────────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                         │                                    │
│                                         ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Decision Support Modal                           │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ "What does this mean?"                                         │ │   │
│  │  │ • Statutory: Legal requirement - prosecution possible          │ │   │
│  │  │ • Good Practice: Recommended by guidance - not legal           │ │   │
│  │  │ • Suggestion: Optional - contractor recommendation             │ │   │
│  │  │                                                                 │ │   │
│  │  │ "Your Options:"                                                │ │   │
│  │  │ ✓ Approve & Add to Action Plan                                 │ │   │
│  │  │ ◔ Add to Wishlist (Defer)                                      │ │   │
│  │  │ ✕ Decline (Not Required)                                       │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐ │
│  │ POST /extract-text           │    │ POST /analyze-findings           │ │
│  │                              │    │                                  │ │
│  │ Input: File (PDF/DOCX/XLSX)  │    │ Input: {                        │ │
│  │                              │    │   text: string,                 │ │
│  │ Process:                     │    │   domain?: FindingDomain        │ │
│  │ - Detect file type           │    │ }                               │ │
│  │ - Parse PDF/DOCX/XLSX        │    │                                  │ │
│  │ - Extract text               │    │ Process:                        │ │
│  │                              │    │ - AI extraction (Gemini)       │ │
│  │ Output: {                    │    │ - Classification engine         │ │
│  │   text: string,              │    │ - Confidence scoring            │ │
│  │   fileName: string,          │    │ - Source lookup                 │ │
│  │   textLength: number         │    │                                  │ │
│  │ }                             │    │ Output: {                       │ │
│  └──────────────────────────────┘    │   findings: Finding[],          │ │
│                                       │   domain: string,               │ │
│                                       │   processingTime: number        │ │
│                                       │ }                               │ │
│                                       └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLASSIFICATION ENGINE LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    classifyFinding()                                   │ │
│  │                                                                       │ │
│  │   Input: description: string, domain?: FindingDomain                 │ │
│  │                                                                       │ │
│  │   Process:                                                            │ │
│  │   1. Filter requirements by domain (if specified)                    │ │
│  │   2. Score each requirement:                                         │ │
│  │      - Keyword matches (+1 each)                                     │ │
│  │      - Source reference match (+2)                                   │ │
│  │   3. Sort by score descending                                        │ │
│  │   4. Apply confidence thresholds:                                    │ │
│  │      - score >= 2: High confidence → return classification          │ │
│  │      - score >= 1: Medium confidence → default to good_practice      │ │
│  │      - score < 1: Low confidence → default to contractor_suggestion │ │
│  │                                                                       │ │
│  │   Output: FindingMatch {                                             │ │
│  │     classification: statutory | good_practice | contractor_suggest  │ │
│  │     source?: string                                                 │ │
│  │     sourceUrl?: string                                              │ │
│  │     confidence: 0-1                                                 │ │
│  │     explanation: string                                             │ │
│  │     severity: critical | high | medium | low                        │ │
│  │   }                                                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                REGULATORY DATABASE (50+ requirements)                  │ │
│  │                                                                       │ │
│  │  LEGIONELLA                   FIRE                          ASBESTOS  │ │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────┐ │
│  │  │ L8 para 157         │    │ RRO 2005 Art 9      │    │ CAR 2012  │ │
│  │  │ Cold water < 20°C   │    │ Fire risk assess    │    │ Register  │ │
│  │  │ [STATUTORY]         │    │ [STATUTORY]         │    │ [STATUTORY]│ │
│  │  └─────────────────────┘    └─────────────────────┘    └──────────┘ │ │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────┐ │
│  │  │ HSG274              │    │ BS5839              │    │          │ │
│  │  │ Sentinel outlets    │    │ Detector cleaning   │    │          │ │
│  │  │ [GOOD PRACTICE]     │    │ [GOOD PRACTICE]     │    │          │ │
│  │  └─────────────────────┘    └─────────────────────┘    └──────────┘ │ │
│  │                                                                       │ │
│  │  ELECTRICAL        GAS          LIFTS        PLAYGROUND               │ │
│  │  ┌────────────┐   ┌──────────┐ ┌──────────┐ ┌──────────────┐       │ │
│  │  │EAWR 1989   │   │GFSP 1995 │ │LOLER 1998│ │PUWER 1998    │       │ │
│  │  │EICR 5 year │   │Gas check │ │6-month   │ │Annual inspect│       │ │
│  │  │[STATUTORY] │   │[STATUTORY]│ │[STATUTORY]│ │[STATUTORY]   │       │ │
│  │  └────────────┘   └──────────┘ └──────────┘ └──────────────┘       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              REGULATORY SOURCES (20+ sources)                          │ │
│  │                                                                       │ │
│  │  Type: legislation | acop | guidance | british_standard               │ │
│  │                                                                       │ │
│  │  Key Sources:                                                        │ │
│  │  - HSE L8 (ACoP = statutory)                                         │ │
│  │  - HSE HSG274 (guidance = good practice)                             │ │
│  │  - RRO 2005 (legislation = statutory)                                │ │
│  │  - CAR 2012 (legislation = statutory)                                │ │
│  │  - BS5839, BS5306 (british_standard = good practice)                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI LAYER (OpenRouter/Gemini)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  System Prompt:                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  | "You are an expert UK estates compliance analyst..."                  │ │
│  |                                                                       │ │
│  | CRITICAL: Distinguish between three tiers:                            │ │
│  | 1. STATUTORY REQUIRED: Legal requirements from ACoP/legislation      │ │
│  | 2. GOOD PRACTICE: Recommendations from HSE guidance/BS standards     │ │
│  | 3. CONTRACTOR SUGGESTION: Optional improvements                      │ │
│  │                                                                       │ │
│  | Be conservative. If uncertain, classify as good_practice."           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Model: google/gemini-2.5-flash (cost-effective, high accuracy)          │
│  Temperature: 0.3 (consistent results)                                     │
│  Response Format: JSON structured                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTRACTOR LAYER (Reused)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  parsePDF()      - PDF text extraction using pdf.js                        │
│  parseDocx()     - DOCX extraction using mammoth                           │
│  parseExcel()    - XLSX extraction using xlsx                              │
│  parseImage()    - OCR using OpenAI Vision API                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

```
1. User uploads "AquaTrust_Legionella_Report.pdf"
   ↓
2. Frontend sends to /api/extract-text
   ↓
3. Backend extracts text using parsePDF()
   Returns: "Monthly inspection completed. Finding: Cold water outlet #3
             temperature is 25°C, exceeding the 20°C limit..."
   ↓
4. Frontend sends text to /api/analyze-findings
   ↓
5. AI (Gemini) extracts findings:
   {
     "description": "Cold water outlet #3 temperature is 25°C, exceeding the 20°C limit",
     "severity": "high",
     "actionRequired": "Investigate cause and increase flushing",
     "rawText": "..."
   }
   ↓
6. Classification engine processes:
   - Keywords: "cold water", "temperature", "20°C", "exceeds"
   - Matches: leg_temp_cold_outlet (score: 5)
   - Classification: 'statutory'
   - Source: "HSE L8 para 157"
   - Confidence: 0.95
   ↓
7. Frontend displays:
   🔴 STATUTORY REQUIRED
   Cold water outlet #3 temperature is 25°C, exceeding the 20°C limit
   Source: HSE L8 para 157 ↗
   Confidence: 95%

   [▼ More] → Shows explanation, suggested action, decision buttons
```

## Key Design Decisions

1. **Conservative Default**: When uncertain, classify as "good_practice" not "statutory"
   - Rationale: False alarms damage trust, false compliance is dangerous

2. **ACoP = Statutory**: HSE L8 is correctly marked as statutory (ACoP has legal force)
   - Rationale: ACoP is quasi-legal, compliance is required by law

3. **Confidence Thresholds**:
   - ≥0.8: High confidence (auto-approve)
   - 0.5-0.8: Medium (review recommended)
   - <0.5: Low (manual review required)

4. **Source Linking**: Every finding links to exact source paragraph
   - Rationale: Transparency and verification

5. **Explanation Field**: Always explains WHY classification was made
   - Rationale: Educational, builds trust

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `findings-database.ts` | ~700 | Regulatory database, classification logic |
| `FindingsList.tsx` | ~450 | Display component with decision support |
| `ContractorReportAnalyzer.tsx` | ~350 | Upload and analysis component |
| `analyze-findings/route.ts` | ~200 | AI analysis API |
| `extract-text/route.ts` | ~100 | Text extraction API |
| `findings/page.tsx` | ~250 | Demo page |
| `findings-database.test.ts` | ~200 | Unit tests |

**Total**: ~2,250 lines of production code + documentation
