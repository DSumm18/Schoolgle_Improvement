# Lesson Studio: Intent Extraction + Visualisation Generation Pipeline

**Date:** 2026-04-05
**Task:** 013
**Status:** Approved (autonomous agent mode)

## Overview

Backend pipeline that takes raw lesson plan text (formal plans, brief notes, or voice transcriptions), extracts structured intent via AI, and generates accessible SVG/HTML visualisations with curriculum-tagged interactive elements and accessibility variants.

## Architecture

```
PDF/Text Input
     |
     v
ingest-pdf.ts ──> raw text
     |
     v
extract-intent.ts ──> LessonIntent JSON (via Claude on OpenRouter)
     |
     v
generate-visualisation.ts ──> Master SVG/HTML with ARIA labels + curriculum codes
     |
     v
generate-variants.ts ──> Adapted variants per pupil accessibility profile
```

## Module Specifications

### 1. extract-intent.ts

**Input:** Raw lesson plan text (string)
**Output:** `LessonIntent` object
**AI Model:** `anthropic/claude-sonnet-4` via OpenRouter (structured extraction needs precision)
**Pattern:** Uses existing `openrouter` client from `@/lib/ai-openrouter.ts`

```typescript
interface LessonIntent {
  subject: string;
  year_group: string;
  topic: string;
  learning_objectives: string[];
  key_vocabulary: { word: string; definition: string }[];
  concept_to_visualise: string;
  curriculum_codes: string[];
  suggested_interaction_points: InteractionPoint[];
}

interface InteractionPoint {
  id: string;
  label: string;
  type: 'reveal' | 'label' | 'sequence' | 'drag' | 'toggle';
  curriculum_code: string | null;
  description: string;
}
```

**Prompt strategy:** System prompt instructs Claude to handle formal plans, brief notes, AND voice transcription (tolerating speech-to-text errors, incomplete sentences). Returns JSON.

### 2. ingest-pdf.ts

**Input:** `Buffer` (PDF file bytes)
**Output:** `{ text: string; pageCount: number; hasStructuredLayout: boolean }`
**Library:** `pdfjs-dist` (already in deps, matches existing `extractors.ts` pattern)
**Approach:** Lazy-load pdfjs-dist, extract text per page, detect table-like structures via position analysis.

### 3. generate-visualisation.ts

**Input:** `LessonIntent`
**Output:** `{ svg: string; html: string; interactionManifest: InteractionManifest }`
**AI Model:** `anthropic/claude-sonnet-4` via OpenRouter (SVG generation needs strong reasoning)
**Approach:** Prompt Claude to generate a master SVG diagram for the concept, with ARIA labels on all elements and `data-curriculum-code` attributes on interactive elements.

### 4. generate-variants.ts

**Input:** Master SVG string + `AccessibilityProfile`
**Output:** Adapted SVG string with adjustments
**Approach:** Deterministic transforms (no AI call) — contrast boost, font scaling, label simplification, cognitive load reduction based on profile flags.

```typescript
interface AccessibilityProfile {
  needs: AccessibilityNeed[];
  contrast: 'normal' | 'high' | 'very-high';
  font_scale: number;  // 1.0 = default
  simplify_labels: boolean;
  reduce_cognitive_load: boolean;
  extend_content: boolean;
}
```

## Test Strategy

Reference lesson: Year 6 Science — The Circulatory System. Tests verify:
- Intent extraction from formal plan text, brief notes, and voice transcription
- PDF ingestion with multi-page documents
- SVG output contains ARIA labels and curriculum codes
- Variant generation applies contrast/font/simplification correctly

## Dependencies

- `openai` (existing) — OpenRouter client
- `pdfjs-dist` (existing) — PDF extraction
- No new dependencies required
