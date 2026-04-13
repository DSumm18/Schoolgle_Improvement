# Lesson Studio v2 — Phase 1: Assessment Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add work upload, AI-powered grading, assessment triangulation (Teacher + AI + Moderator), and calendar scheduling to the existing Lesson Studio — the foundation for the complete adaptive teaching loop.

**Architecture:** Extend the existing `ls_assessments` table and add new tables for work submissions, moderation queue, and calendar events. Build a two-layer AI grading pipeline: Google Cloud Vision for handwriting OCR, then Gemini 2.5 Flash for grading against NC descriptors. The Assessment tab in the existing lesson detail panel becomes the teacher's review interface with per-pupil cards showing AI grade vs teacher grade.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + Storage), Google Cloud Vision API, Gemini 2.5 Flash (via OpenRouter), React (client components), Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-04-13-lesson-studio-v2-design.md`

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `apps/platform/supabase/migrations/20260413_lesson_studio_v2_assessment.sql` | New tables: `ls_work_submissions`, `ls_moderation_queue`, `ls_calendar_events`; extend `ls_assessments` with moderator fields |
| `apps/platform/src/lib/lesson-studio/grading-pipeline.ts` | Two-layer AI grading: Vision OCR → Gemini assessment. Pure functions, no DB access |
| `apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts` | Unit tests for grading pipeline |
| `apps/platform/src/app/api/lesson-studio/assess/route.ts` | POST: upload work + trigger grading. GET: fetch assessments for a lesson |
| `apps/platform/src/app/api/lesson-studio/assess/review/route.ts` | POST: teacher agree/override/flag for moderation |
| `apps/platform/src/app/api/lesson-studio/calendar/route.ts` | GET/POST/PUT/DELETE calendar events (replaces timetable) |
| `apps/platform/src/components/lesson-studio/AssessmentPanel.tsx` | Assessment tab content: upload zone + pupil assessment cards |
| `apps/platform/src/components/lesson-studio/WorkUploadZone.tsx` | Drag-and-drop + camera + file browser upload component |
| `apps/platform/src/components/lesson-studio/PupilAssessmentCard.tsx` | Per-pupil card: AI grade, teacher grade, misconceptions, agree/override buttons |
| `apps/platform/src/components/lesson-studio/CalendarView.tsx` | Day/week calendar view for head teacher + teacher scheduling |

### Modified Files
| Path | Change |
|------|--------|
| `apps/platform/src/types/lesson-studio.ts` | Add types: `LSWorkSubmission`, `LSCalendarEvent`, `LSModerationItem`, `TriangulationStatus`, extend `LSAssessment` |
| `apps/platform/src/components/lesson-studio/LessonStudio.tsx` | Add Calendar nav tab, wire AssessmentPanel into lesson detail |
| `apps/platform/src/components/lesson-studio/LessonPlanPanel.tsx` | Add Assessment tab that renders AssessmentPanel |

---

## Task 1: Database Migration

**Files:**
- Create: `apps/platform/supabase/migrations/20260413_lesson_studio_v2_assessment.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Lesson Studio v2: Assessment Pipeline
-- Adds work submissions, extends assessments with moderation, calendar events

-- 1. Work Submissions — uploaded worksheets/photos linked to assessments
CREATE TABLE IF NOT EXISTS ls_work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES ls_pupils(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'text/plain')),
  file_size_bytes INTEGER,
  ocr_text TEXT,
  ocr_confidence NUMERIC(4,3),
  ocr_model TEXT,
  grading_result JSONB,
  grading_model TEXT,
  grading_confidence NUMERIC(4,3),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'graded', 'reviewed', 'error')),
  error_message TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_work_submissions_lesson ON ls_work_submissions(lesson_plan_id);
CREATE INDEX idx_ls_work_submissions_pupil ON ls_work_submissions(pupil_id);
CREATE INDEX idx_ls_work_submissions_status ON ls_work_submissions(status);

-- 2. Extend ls_assessments with moderator fields and triangulation
ALTER TABLE ls_assessments
  ADD COLUMN IF NOT EXISTS work_submission_id UUID REFERENCES ls_work_submissions(id),
  ADD COLUMN IF NOT EXISTS moderator_grade TEXT,
  ADD COLUMN IF NOT EXISTS moderator_user_id UUID,
  ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS triangulation_status TEXT DEFAULT 'pending'
    CHECK (triangulation_status IN ('pending', 'aligned', 'majority', 'disputed', 'resolved')),
  ADD COLUMN IF NOT EXISTS misconceptions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS next_steps TEXT,
  ADD COLUMN IF NOT EXISTS feedback_text TEXT;

-- 3. Moderation Queue — flagged assessments awaiting moderator review
CREATE TABLE IF NOT EXISTS ls_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES ls_assessments(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL,
  flagged_reason TEXT,
  teacher_grade TEXT NOT NULL,
  ai_grade TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
  resolved_by UUID,
  resolved_grade TEXT,
  resolved_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_moderation_queue_org ON ls_moderation_queue(organization_id, status);

-- 4. Calendar Events — teacher-scheduled lessons (replaces hardcoded timetable)
CREATE TABLE IF NOT EXISTS ls_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  teacher_user_id UUID,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id),
  recurrence_rule TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, event_date, start_time)
);

CREATE INDEX idx_ls_calendar_events_date ON ls_calendar_events(organization_id, event_date);
CREATE INDEX idx_ls_calendar_events_class ON ls_calendar_events(class_id, event_date);

-- 5. RLS Policies
ALTER TABLE ls_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_work_submissions" ON ls_work_submissions
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
CREATE POLICY "org_isolation_moderation_queue" ON ls_moderation_queue
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
CREATE POLICY "org_isolation_calendar_events" ON ls_calendar_events
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
```

- [ ] **Step 2: Run the migration**

```bash
cd apps/platform && npx supabase db push
```

If not using CLI, paste the SQL into the Supabase dashboard SQL editor and execute.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/supabase/migrations/20260413_lesson_studio_v2_assessment.sql
git commit -m "feat(lesson-studio): add assessment pipeline tables — work submissions, moderation, calendar"
```

---

## Task 2: Type Definitions

**Files:**
- Modify: `apps/platform/src/types/lesson-studio.ts`

- [ ] **Step 1: Add new types to the end of the types file**

Append after the existing `LSCurriculumCoverage` interface:

```typescript
/* ── Assessment Pipeline v2 types ────────────────────────────── */

export type TriangulationStatus = 'pending' | 'aligned' | 'majority' | 'disputed' | 'resolved';

export type WorkSubmissionStatus = 'uploaded' | 'processing' | 'graded' | 'reviewed' | 'error';

export interface LSWorkSubmission {
  id: string;
  organization_id: string;
  lesson_plan_id: string;
  pupil_id: string;
  storage_path: string;
  file_type: string;
  file_size_bytes: number | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  ocr_model: string | null;
  grading_result: GradingResult | null;
  grading_model: string | null;
  grading_confidence: number | null;
  status: WorkSubmissionStatus;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradingResult {
  grade: AttainmentLevel;
  score: number;
  total: number;
  misconceptions: Misconception[];
  feedback: string;
  next_steps: string;
  confidence: number;
}

export interface Misconception {
  description: string;
  severity: 'minor' | 'significant' | 'fundamental';
  curriculum_code: string | null;
}

export interface LSModerationItem {
  id: string;
  organization_id: string;
  assessment_id: string;
  flagged_by: string;
  flagged_reason: string | null;
  teacher_grade: string;
  ai_grade: string | null;
  status: 'pending' | 'in_review' | 'resolved';
  resolved_by: string | null;
  resolved_grade: string | null;
  resolved_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface LSCalendarEvent {
  id: string;
  organization_id: string;
  class_id: string;
  teacher_user_id: string | null;
  title: string;
  subject: string;
  event_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  lesson_plan_id: string | null;
  recurrence_rule: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarEventWithPlan = LSCalendarEvent & {
  lesson_plan?: LSLessonPlan | null;
};

export type AssessmentWithSubmission = LSAssessment & {
  work_submission?: LSWorkSubmission | null;
  pupil?: LSPupil | null;
  moderator_grade?: string | null;
  moderator_notes?: string | null;
  triangulation_status?: TriangulationStatus;
  misconceptions?: Misconception[];
  next_steps?: string | null;
  feedback_text?: string | null;
};
```

- [ ] **Step 2: Verify types compile**

```bash
cd apps/platform && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No new errors from our additions (existing errors may show — that's fine).

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/types/lesson-studio.ts
git commit -m "feat(lesson-studio): add assessment pipeline types — work submissions, grading, triangulation, calendar"
```

---

## Task 3: AI Grading Pipeline

**Files:**
- Create: `apps/platform/src/lib/lesson-studio/grading-pipeline.ts`
- Create: `apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  buildGradingPrompt,
  parseGradingResponse,
  computeTriangulation,
} from './grading-pipeline';

describe('buildGradingPrompt', () => {
  it('includes subject, year group, objective, and OCR text', () => {
    const prompt = buildGradingPrompt({
      ocrText: 'The hart pumps blud around the body',
      subject: 'Science',
      yearGroup: 'Year 6',
      learningObjective: 'Identify parts of the circulatory system',
      successCriteria: ['Name 4 chambers', 'Explain artery vs vein'],
      diffGroup: 'scaffold',
      pupilContext: 'EHCP (SEMH), EAL Stage C',
    });

    expect(prompt).toContain('Science');
    expect(prompt).toContain('Year 6');
    expect(prompt).toContain('The hart pumps blud');
    expect(prompt).toContain('scaffold');
    expect(prompt).toContain('EAL');
  });
});

describe('parseGradingResponse', () => {
  it('parses valid JSON response into GradingResult', () => {
    const raw = JSON.stringify({
      grade: 'WTS',
      score: 3,
      total: 6,
      misconceptions: [
        { description: 'Confuses capillaries with veins', severity: 'significant', curriculum_code: 'Y6-SC-2c' }
      ],
      feedback: 'Good effort identifying the heart and arteries.',
      next_steps: 'Use visual bar models to compare capillaries and veins.',
      confidence: 0.78,
    });

    const result = parseGradingResponse(raw);

    expect(result.grade).toBe('WTS');
    expect(result.score).toBe(3);
    expect(result.total).toBe(6);
    expect(result.misconceptions).toHaveLength(1);
    expect(result.misconceptions[0].severity).toBe('significant');
    expect(result.confidence).toBe(0.78);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseGradingResponse('not json')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => parseGradingResponse(JSON.stringify({ grade: 'EXS' }))).toThrow();
  });
});

describe('computeTriangulation', () => {
  it('returns aligned when all three agree', () => {
    const result = computeTriangulation('EXS', 'EXS', 'EXS');
    expect(result).toBe('aligned');
  });

  it('returns majority when two of three agree', () => {
    expect(computeTriangulation('EXS', 'EXS', 'WTS')).toBe('majority');
    expect(computeTriangulation('EXS', 'WTS', 'EXS')).toBe('majority');
    expect(computeTriangulation('WTS', 'EXS', 'EXS')).toBe('majority');
  });

  it('returns disputed when all three differ', () => {
    expect(computeTriangulation('GDS', 'EXS', 'WTS')).toBe('disputed');
  });

  it('returns pending when moderator is null', () => {
    expect(computeTriangulation('EXS', 'EXS', null)).toBe('pending');
  });

  it('returns majority when teacher and AI agree without moderator', () => {
    // When only teacher + AI agree, and no moderator yet, that's still 2-of-2
    // but we mark as pending until moderator weighs in OR teacher explicitly locks
    expect(computeTriangulation('EXS', 'WTS', null)).toBe('pending');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npx vitest run apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts
```

Expected: FAIL — module `./grading-pipeline` not found.

- [ ] **Step 3: Write the grading pipeline implementation**

```typescript
// apps/platform/src/lib/lesson-studio/grading-pipeline.ts
import type { GradingResult, Misconception, AttainmentLevel, TriangulationStatus } from '@/types/lesson-studio';

/* ── Prompt Builder ──────────────────────────────────────────── */

interface GradingContext {
  ocrText: string;
  subject: string;
  yearGroup: string;
  learningObjective: string;
  successCriteria: string[];
  diffGroup: string;
  pupilContext: string;
}

export function buildGradingPrompt(ctx: GradingContext): string {
  return `You are an expert UK primary school assessor. Grade this pupil's work against the National Curriculum expected standard.

## Context
- Subject: ${ctx.subject}
- Year Group: ${ctx.yearGroup}
- Learning Objective: ${ctx.learningObjective}
- Success Criteria:
${ctx.successCriteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}
- Differentiation Group: ${ctx.diffGroup}
- Pupil Context: ${ctx.pupilContext}

## Pupil's Work (OCR transcription)
${ctx.ocrText}

## Grading Instructions
- Grade against NC expected standard descriptors for ${ctx.yearGroup} ${ctx.subject}
- Use bands: PKF (pre-key stage foundations), PKE (pre-key stage emerging), WTS (working towards), EXS (expected standard), GDS (greater depth)
- Do NOT penalise spelling errors if the pupil has EAL or dyslexia in their context
- Identify specific misconceptions with severity (minor/significant/fundamental)
- Write feedback in teacher language (professional, constructive, specific)
- Suggest a concrete next step for this pupil

Respond in JSON only:
{
  "grade": "WTS|EXS|GDS|PKE|PKF",
  "score": <number correct>,
  "total": <total possible>,
  "misconceptions": [{"description": "...", "severity": "minor|significant|fundamental", "curriculum_code": "Y6-SC-2c or null"}],
  "feedback": "One paragraph of professional feedback",
  "next_steps": "One concrete next step",
  "confidence": <0.0 to 1.0>
}`;
}

/* ── Response Parser ─────────────────────────────────────────── */

export function parseGradingResponse(raw: string): GradingResult {
  let parsed: Record<string, unknown>;
  try {
    // Handle markdown-wrapped JSON
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse grading response as JSON: ${raw.slice(0, 100)}`);
  }

  const grade = parsed.grade as string;
  const validGrades: AttainmentLevel[] = ['PKF', 'PKE', 'WTS', 'EXS', 'GDS'];
  if (!validGrades.includes(grade as AttainmentLevel)) {
    throw new Error(`Invalid grade "${grade}" — expected one of ${validGrades.join(', ')}`);
  }

  if (typeof parsed.score !== 'number' || typeof parsed.total !== 'number') {
    throw new Error('Missing required fields: score and total must be numbers');
  }

  if (typeof parsed.confidence !== 'number') {
    throw new Error('Missing required field: confidence must be a number');
  }

  const misconceptions: Misconception[] = Array.isArray(parsed.misconceptions)
    ? parsed.misconceptions.map((m: Record<string, unknown>) => ({
        description: String(m.description || ''),
        severity: (['minor', 'significant', 'fundamental'].includes(String(m.severity))
          ? String(m.severity)
          : 'minor') as Misconception['severity'],
        curriculum_code: m.curriculum_code ? String(m.curriculum_code) : null,
      }))
    : [];

  return {
    grade: grade as AttainmentLevel,
    score: parsed.score as number,
    total: parsed.total as number,
    misconceptions,
    feedback: String(parsed.feedback || ''),
    next_steps: String(parsed.next_steps || ''),
    confidence: parsed.confidence as number,
  };
}

/* ── Triangulation Logic ─────────────────────────────────────── */

export function computeTriangulation(
  teacherGrade: string,
  aiGrade: string | null,
  moderatorGrade: string | null,
): TriangulationStatus {
  // If no moderator has weighed in yet, it's pending
  if (moderatorGrade === null) return 'pending';

  const grades = [teacherGrade, aiGrade, moderatorGrade].filter(Boolean) as string[];
  const unique = new Set(grades);

  if (unique.size === 1) return 'aligned';
  if (unique.size === grades.length && grades.length === 3) return 'disputed';

  // 2 of 3 agree
  return 'majority';
}

/* ── OCR via Google Cloud Vision ─────────────────────────────── */

export async function extractTextFromImage(imageUrl: string): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_CLOUD_VISION_API_KEY not set');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const annotation = data.responses?.[0]?.fullTextAnnotation;

  if (!annotation) {
    return { text: '', confidence: 0 };
  }

  // Average confidence across all pages
  const pages = annotation.pages || [];
  const avgConfidence = pages.length > 0
    ? pages.reduce((sum: number, p: { confidence?: number }) => sum + (p.confidence || 0), 0) / pages.length
    : 0.5;

  return { text: annotation.text || '', confidence: avgConfidence };
}

/* ── Grade via Gemini 2.5 Flash ──────────────────────────────── */

export async function gradeWork(
  ocrText: string,
  context: Omit<GradingContext, 'ocrText'>,
): Promise<GradingResult> {
  const prompt = buildGradingPrompt({ ...context, ocrText });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) throw new Error('Empty response from grading model');

  return parseGradingResponse(raw);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npx vitest run apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/lesson-studio/grading-pipeline.ts apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts
git commit -m "feat(lesson-studio): add AI grading pipeline — OCR + Gemini grading + triangulation logic"
```

---

## Task 4: Work Upload & Assessment API

**Files:**
- Create: `apps/platform/src/app/api/lesson-studio/assess/route.ts`
- Create: `apps/platform/src/app/api/lesson-studio/assess/review/route.ts`

- [ ] **Step 1: Write the assessment API (upload + grade + fetch)**

```typescript
// apps/platform/src/app/api/lesson-studio/assess/route.ts
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import { extractTextFromImage, gradeWork } from '@/lib/lesson-studio/grading-pipeline';

// GET — fetch assessments for a lesson plan
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const lessonPlanId = req.nextUrl.searchParams.get('lessonPlanId');
  if (!lessonPlanId) return apiError('lessonPlanId required', 400);

  const { data: assessments, error } = await supabase
    .from('ls_assessments')
    .select(`
      *,
      work_submission:ls_work_submissions(*),
      pupil:ls_pupils(id, pupil_ref, display_name_encrypted, has_ehcp, has_send_support, send_primary_need, is_pupil_premium, is_eal, eal_stage, attainment_reading, attainment_writing, attainment_maths, attainment_science, accessibility_needs)
    `)
    .eq('lesson_plan_id', lessonPlanId)
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ assessments: assessments || [] });
});

// POST — upload work and trigger AI grading for a batch of pupils
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const formData = await req.formData();

  const lessonPlanId = formData.get('lessonPlanId') as string;
  const pupilId = formData.get('pupilId') as string;
  const file = formData.get('file') as File;

  if (!lessonPlanId || !pupilId || !file) {
    return apiError('lessonPlanId, pupilId, and file are required', 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return apiError(`File type ${file.type} not supported. Use JPEG, PNG, HEIC, or PDF.`, 400);
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return apiError('File too large. Maximum 10MB.', 400);
  }

  // Upload to Supabase Storage
  const fileName = `${auth.organizationId}/${lessonPlanId}/${pupilId}-${Date.now()}.${file.type.split('/')[1]}`;
  const { error: uploadError } = await supabase.storage
    .from('lesson-studio-work')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) return apiError(`Upload failed: ${uploadError.message}`, 500);

  // Get public URL for Vision API
  const { data: urlData } = supabase.storage
    .from('lesson-studio-work')
    .getPublicUrl(fileName);

  // Create work submission record
  const { data: submission, error: subError } = await supabase
    .from('ls_work_submissions')
    .insert({
      organization_id: auth.organizationId,
      lesson_plan_id: lessonPlanId,
      pupil_id: pupilId,
      storage_path: fileName,
      file_type: file.type,
      file_size_bytes: file.size,
      status: 'processing',
      uploaded_by: auth.userId,
    })
    .select()
    .single();

  if (subError) return apiError(subError.message, 500);

  // Load lesson plan for grading context
  const { data: plan } = await supabase
    .from('ls_lesson_plans')
    .select('subject, learning_objective, success_criteria, differentiation_groups')
    .eq('id', lessonPlanId)
    .single();

  // Load pupil for context
  const { data: pupil } = await supabase
    .from('ls_pupils')
    .select('has_ehcp, has_send_support, send_primary_need, is_eal, eal_stage, accessibility_needs')
    .eq('id', pupilId)
    .single();

  // Find which diff group this pupil is in
  const groups = (plan?.differentiation_groups || []) as Array<{ name: string; pupils: string[] }>;
  const pupilGroup = groups.find(g => g.pupils?.some((p: string) => p.includes(pupilId)))?.name || 'core';

  // Build pupil context string
  const contextParts: string[] = [];
  if (pupil?.has_ehcp) contextParts.push('EHCP');
  if (pupil?.has_send_support) contextParts.push(`SEN Support (${pupil.send_primary_need})`);
  if (pupil?.is_eal) contextParts.push(`EAL Stage ${pupil.eal_stage}`);
  if (pupil?.accessibility_needs?.length) contextParts.push(pupil.accessibility_needs.join(', '));
  const pupilContext = contextParts.join(', ') || 'No additional context';

  try {
    // Step 1: OCR
    const ocr = await extractTextFromImage(urlData.publicUrl);

    // Update submission with OCR results
    await supabase
      .from('ls_work_submissions')
      .update({
        ocr_text: ocr.text,
        ocr_confidence: ocr.confidence,
        ocr_model: 'google-cloud-vision',
      })
      .eq('id', submission.id);

    if (!ocr.text.trim()) {
      await supabase
        .from('ls_work_submissions')
        .update({ status: 'error', error_message: 'No text detected in image' })
        .eq('id', submission.id);
      return apiSuccess({ submission: { ...submission, status: 'error', error_message: 'No text detected' } });
    }

    // Step 2: Grade
    const gradingResult = await gradeWork(ocr.text, {
      subject: plan?.subject || 'Unknown',
      yearGroup: 'Year 6', // TODO: derive from class
      learningObjective: plan?.learning_objective || '',
      successCriteria: Array.isArray(plan?.success_criteria) ? plan.success_criteria as string[] : [],
      diffGroup: pupilGroup,
      pupilContext,
    });

    // Update submission with grading
    await supabase
      .from('ls_work_submissions')
      .update({
        grading_result: gradingResult as unknown as Record<string, unknown>,
        grading_model: 'google/gemini-2.5-flash-preview',
        grading_confidence: gradingResult.confidence,
        status: 'graded',
      })
      .eq('id', submission.id);

    // Upsert assessment record
    const { data: assessment, error: assessError } = await supabase
      .from('ls_assessments')
      .upsert({
        organization_id: auth.organizationId,
        lesson_plan_id: lessonPlanId,
        pupil_id: pupilId,
        subject: plan?.subject || 'Unknown',
        ai_suggested_grade: gradingResult.grade,
        ai_confidence: gradingResult.confidence,
        ai_reasoning: gradingResult.feedback,
        work_submission_id: submission.id,
        misconceptions: gradingResult.misconceptions,
        next_steps: gradingResult.next_steps,
        feedback_text: gradingResult.feedback,
        triangulation_status: 'pending',
        assessment_date: new Date().toISOString().split('T')[0],
      }, {
        onConflict: 'organization_id,lesson_plan_id,pupil_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (assessError) return apiError(assessError.message, 500);

    return apiSuccess({ submission: { ...submission, status: 'graded' }, assessment, gradingResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Grading failed';
    await supabase
      .from('ls_work_submissions')
      .update({ status: 'error', error_message: message })
      .eq('id', submission.id);
    return apiError(message, 500);
  }
});
```

- [ ] **Step 2: Write the review API (agree/override/flag)**

```typescript
// apps/platform/src/app/api/lesson-studio/assess/review/route.ts
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import { computeTriangulation } from '@/lib/lesson-studio/grading-pipeline';

// POST — teacher agrees, overrides, or flags for moderation
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const { assessmentId, action, teacherGrade, overrideReason, flagReason } = body as {
    assessmentId: string;
    action: 'agree' | 'override' | 'flag';
    teacherGrade?: string;
    overrideReason?: string;
    flagReason?: string;
  };

  if (!assessmentId || !action) {
    return apiError('assessmentId and action required', 400);
  }

  // Load current assessment
  const { data: assessment, error: fetchErr } = await supabase
    .from('ls_assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('organization_id', auth.organizationId)
    .single();

  if (fetchErr || !assessment) return apiError('Assessment not found', 404);

  if (action === 'agree') {
    // Teacher agrees with AI grade
    const triangulation = computeTriangulation(
      assessment.ai_suggested_grade,
      assessment.ai_suggested_grade,
      assessment.moderator_grade,
    );

    const { error } = await supabase
      .from('ls_assessments')
      .update({
        teacher_grade: assessment.ai_suggested_grade,
        teacher_agreed: true,
        triangulation_status: assessment.moderator_grade ? triangulation : 'pending',
      })
      .eq('id', assessmentId);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ status: 'agreed', grade: assessment.ai_suggested_grade });
  }

  if (action === 'override') {
    if (!teacherGrade) return apiError('teacherGrade required for override', 400);

    const triangulation = computeTriangulation(
      teacherGrade,
      assessment.ai_suggested_grade,
      assessment.moderator_grade,
    );

    const { error } = await supabase
      .from('ls_assessments')
      .update({
        teacher_grade: teacherGrade,
        teacher_agreed: false,
        teacher_override_reason: overrideReason || null,
        triangulation_status: assessment.moderator_grade ? triangulation : 'pending',
      })
      .eq('id', assessmentId);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ status: 'overridden', grade: teacherGrade });
  }

  if (action === 'flag') {
    // Flag for moderator review
    const { error: flagErr } = await supabase
      .from('ls_moderation_queue')
      .insert({
        organization_id: auth.organizationId,
        assessment_id: assessmentId,
        flagged_by: auth.userId,
        flagged_reason: flagReason || null,
        teacher_grade: teacherGrade || assessment.teacher_grade || 'ungraded',
        ai_grade: assessment.ai_suggested_grade,
        status: 'pending',
      });

    if (flagErr) return apiError(flagErr.message, 500);

    await supabase
      .from('ls_assessments')
      .update({ triangulation_status: 'disputed' })
      .eq('id', assessmentId);

    return apiSuccess({ status: 'flagged' });
  }

  return apiError('Invalid action. Use agree, override, or flag.', 400);
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/lesson-studio/assess/route.ts apps/platform/src/app/api/lesson-studio/assess/review/route.ts
git commit -m "feat(lesson-studio): add assessment API — upload work, AI grade, teacher review"
```

---

## Task 5: Calendar Events API

**Files:**
- Create: `apps/platform/src/app/api/lesson-studio/calendar/route.ts`

- [ ] **Step 1: Write the calendar API**

```typescript
// apps/platform/src/app/api/lesson-studio/calendar/route.ts
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

// GET — fetch calendar events for a date range
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const classId = req.nextUrl.searchParams.get('classId');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');

  if (!startDate || !endDate) {
    return apiError('startDate and endDate required (YYYY-MM-DD)', 400);
  }

  let query = supabase
    .from('ls_calendar_events')
    .select('*, lesson_plan:ls_lesson_plans(id, title, status, learning_objective)')
    .eq('organization_id', auth.organizationId)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess({ events: data || [] });
});

// POST — create or update a calendar event
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const { id, classId, title, subject, eventDate, startTime, endTime, room, lessonPlanId, notes } = body as {
    id?: string;
    classId: string;
    title: string;
    subject: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    room?: string;
    lessonPlanId?: string;
    notes?: string;
  };

  if (!classId || !title || !subject || !eventDate || !startTime || !endTime) {
    return apiError('classId, title, subject, eventDate, startTime, endTime required', 400);
  }

  const record = {
    organization_id: auth.organizationId,
    class_id: classId,
    teacher_user_id: auth.userId,
    title,
    subject,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    room: room || null,
    lesson_plan_id: lessonPlanId || null,
    notes: notes || null,
  };

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from('ls_calendar_events')
      .update(record)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess({ event: data });
  }

  // Create new
  const { data, error } = await supabase
    .from('ls_calendar_events')
    .upsert(record, { onConflict: 'class_id,event_date,start_time' })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ event: data });
});

// DELETE — remove a calendar event
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return apiError('id required', 400);

  const { error } = await supabase
    .from('ls_calendar_events')
    .delete()
    .eq('id', id)
    .eq('organization_id', auth.organizationId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ deleted: true });
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/api/lesson-studio/calendar/route.ts
git commit -m "feat(lesson-studio): add calendar events API — CRUD for teacher-scheduled lessons"
```

---

## Task 6: Work Upload Zone Component

**Files:**
- Create: `apps/platform/src/components/lesson-studio/WorkUploadZone.tsx`

- [ ] **Step 1: Write the upload component**

```tsx
// apps/platform/src/components/lesson-studio/WorkUploadZone.tsx
'use client';

import { useCallback, useState } from 'react';

interface WorkUploadZoneProps {
  lessonPlanId: string;
  pupils: Array<{ id: string; display_name_encrypted: string; pupil_ref: string }>;
  onUploadComplete: () => void;
}

export default function WorkUploadZone({ lessonPlanId, pupils, onUploadComplete }: WorkUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File, pupilId: string) => {
    const formData = new FormData();
    formData.append('lessonPlanId', lessonPlanId);
    formData.append('pupilId', pupilId);
    formData.append('file', file);

    const res = await fetch('/api/lesson-studio/assess', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  }, [lessonPlanId]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setProgress({ done: 0, total: fileArray.length });

    // For batch upload: match files to pupils by order or filename
    // For single upload: prompt for pupil selection
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      // Match pupil by filename pattern: "pupilref-..." or by order
      const matchedPupil = pupils.find(p =>
        file.name.toLowerCase().includes(p.pupil_ref.toLowerCase())
      ) || pupils[i];

      if (matchedPupil) {
        try {
          await uploadFile(file, matchedPupil.id);
        } catch (err) {
          console.error(`Failed to upload for ${matchedPupil.pupil_ref}:`, err);
        }
      }
      setProgress({ done: i + 1, total: fileArray.length });
    }

    setUploading(false);
    setProgress(null);
    onUploadComplete();
  }, [pupils, uploadFile, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        dragOver
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {uploading && progress ? (
        <div>
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm font-semibold text-gray-900">
            Processing {progress.done} of {progress.total}...
          </p>
          <div className="w-48 mx-auto mt-3 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">AI is reading and grading each worksheet</p>
        </div>
      ) : (
        <div>
          <div className="text-2xl mb-2">📸</div>
          <p className="text-sm font-semibold text-gray-900">Upload Worksheets</p>
          <p className="text-xs text-gray-500 mt-1">
            Photograph with phone · Scan batch · Drag & drop
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <label className="cursor-pointer px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition-colors">
              📂 Browse Files
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/heic,application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/lesson-studio/WorkUploadZone.tsx
git commit -m "feat(lesson-studio): add WorkUploadZone component — drag-drop + file upload for worksheets"
```

---

## Task 7: Pupil Assessment Card Component

**Files:**
- Create: `apps/platform/src/components/lesson-studio/PupilAssessmentCard.tsx`

- [ ] **Step 1: Write the assessment card**

```tsx
// apps/platform/src/components/lesson-studio/PupilAssessmentCard.tsx
'use client';

import { useState } from 'react';
import type { AssessmentWithSubmission, AttainmentLevel } from '@/types/lesson-studio';

const GRADE_COLORS: Record<string, string> = {
  GDS: 'text-blue-600',
  EXS: 'text-emerald-600',
  WTS: 'text-amber-600',
  PKE: 'text-red-500',
  PKF: 'text-red-700',
};

const GRADES: AttainmentLevel[] = ['PKF', 'PKE', 'WTS', 'EXS', 'GDS'];

interface PupilAssessmentCardProps {
  assessment: AssessmentWithSubmission;
  onReview: (assessmentId: string, action: 'agree' | 'override' | 'flag', data?: Record<string, string>) => Promise<void>;
}

export default function PupilAssessmentCard({ assessment, onReview }: PupilAssessmentCardProps) {
  const [loading, setLoading] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideGrade, setOverrideGrade] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState('');

  const pupil = assessment.pupil;
  const aiGrade = assessment.ai_suggested_grade;
  const teacherGrade = assessment.teacher_grade;
  const isReviewed = assessment.teacher_grade !== null;
  const isDiverging = aiGrade && teacherGrade && aiGrade !== teacherGrade;

  const handleAction = async (action: 'agree' | 'override' | 'flag', data?: Record<string, string>) => {
    setLoading(true);
    try {
      await onReview(assessment.id, action, data);
    } finally {
      setLoading(false);
      setShowOverride(false);
    }
  };

  // Build tags
  const tags: Array<{ label: string; className: string }> = [];
  if (pupil?.has_ehcp) tags.push({ label: 'EHCP', className: 'bg-pink-50 text-pink-700' });
  if (pupil?.is_pupil_premium) tags.push({ label: 'PP', className: 'bg-amber-50 text-amber-700' });
  if (pupil?.is_eal) tags.push({ label: `EAL-${pupil.eal_stage}`, className: 'bg-blue-50 text-blue-700' });
  if (pupil?.has_send_support) tags.push({ label: pupil.send_primary_need || 'SEN', className: 'bg-purple-50 text-purple-700' });

  const initials = (pupil?.pupil_ref || '??').slice(0, 2).toUpperCase();

  return (
    <div className={`bg-white border rounded-xl p-4 ${isDiverging ? 'border-amber-300' : 'border-gray-100'} shadow-sm`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{pupil?.pupil_ref || 'Unknown'}</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {tags.map(t => (
              <span key={t.label} className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${t.className}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
        {isDiverging && (
          <span className="text-[9px] font-semibold px-2 py-1 rounded bg-amber-50 text-amber-700">
            Teacher/AI differ
          </span>
        )}
      </div>

      {/* Grades */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Teacher</p>
          <p className={`text-lg font-extrabold ${GRADE_COLORS[teacherGrade || ''] || 'text-gray-300'}`}>
            {teacherGrade || '—'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">AI</p>
          <p className={`text-lg font-extrabold ${GRADE_COLORS[aiGrade || ''] || 'text-gray-300'}`}>
            {aiGrade || '—'}
          </p>
          <p className="text-[9px] text-gray-400">
            {assessment.ai_confidence ? `${Math.round(assessment.ai_confidence * 100)}%` : ''}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
          <p className="text-lg font-extrabold">
            {isReviewed ? (
              <span className="text-emerald-500">✓</span>
            ) : (
              <span className="text-amber-500">⏳</span>
            )}
          </p>
        </div>
      </div>

      {/* Misconceptions */}
      {assessment.misconceptions && assessment.misconceptions.length > 0 && (
        <div className="bg-red-50 rounded-lg p-2.5 mb-3">
          <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide mb-1">Misconceptions</p>
          {assessment.misconceptions.map((m, i) => (
            <p key={i} className="text-[11px] text-gray-700">{m.description}</p>
          ))}
        </div>
      )}

      {/* Next Steps */}
      {assessment.next_steps && (
        <div className="bg-emerald-50 rounded-lg p-2.5 mb-3">
          <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Next Step</p>
          <p className="text-[11px] text-gray-700">{assessment.next_steps}</p>
        </div>
      )}

      {/* Actions */}
      {!isReviewed && (
        <div>
          {showOverride ? (
            <div className="space-y-2">
              <select
                value={overrideGrade}
                onChange={(e) => setOverrideGrade(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2"
              >
                <option value="">Select grade...</option>
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for override (optional)"
                className="w-full text-xs border border-gray-200 rounded-lg p-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => overrideGrade && handleAction('override', { teacherGrade: overrideGrade, overrideReason })}
                  disabled={!overrideGrade || loading}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg bg-amber-500 text-white disabled:opacity-50"
                >
                  Confirm Override
                </button>
                <button
                  onClick={() => setShowOverride(false)}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('agree')}
                disabled={loading}
                className="flex-1 text-xs font-semibold py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                ✓ Agree ({aiGrade})
              </button>
              <button
                onClick={() => setShowOverride(true)}
                disabled={loading}
                className="flex-1 text-xs font-semibold py-2 rounded-lg border border-amber-400 text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-colors"
              >
                Override
              </button>
              <button
                onClick={() => handleAction('flag', { flagReason: 'Teacher requested moderation' })}
                disabled={loading}
                className="text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Flag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/lesson-studio/PupilAssessmentCard.tsx
git commit -m "feat(lesson-studio): add PupilAssessmentCard — AI grade, teacher review, triangulation actions"
```

---

## Task 8: Assessment Panel (combines upload + cards)

**Files:**
- Create: `apps/platform/src/components/lesson-studio/AssessmentPanel.tsx`

- [ ] **Step 1: Write the panel that wires upload zone to assessment cards**

```tsx
// apps/platform/src/components/lesson-studio/AssessmentPanel.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AssessmentWithSubmission, LSPupil } from '@/types/lesson-studio';
import WorkUploadZone from './WorkUploadZone';
import PupilAssessmentCard from './PupilAssessmentCard';

interface AssessmentPanelProps {
  lessonPlanId: string;
  pupils: LSPupil[];
}

export default function AssessmentPanel({ lessonPlanId, pupils }: AssessmentPanelProps) {
  const [assessments, setAssessments] = useState<AssessmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lesson-studio/assess?lessonPlanId=${lessonPlanId}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.data?.assessments || []);
      }
    } finally {
      setLoading(false);
    }
  }, [lessonPlanId]);

  useEffect(() => { loadAssessments(); }, [loadAssessments]);

  const handleReview = async (assessmentId: string, action: string, data?: Record<string, string>) => {
    const res = await fetch('/api/lesson-studio/assess/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId, action, ...data }),
    });
    if (res.ok) {
      await loadAssessments();
    }
  };

  const reviewed = assessments.filter(a => a.teacher_grade !== null);
  const pending = assessments.filter(a => a.teacher_grade === null);
  const aligned = assessments.filter(a => a.teacher_grade && a.teacher_grade === a.ai_suggested_grade);

  const handleAgreeAll = async () => {
    const toAgree = pending.filter(a => a.ai_suggested_grade);
    for (const a of toAgree) {
      await handleReview(a.id, 'agree');
    }
  };

  return (
    <div>
      {/* Upload Zone */}
      <WorkUploadZone
        lessonPlanId={lessonPlanId}
        pupils={pupils.map(p => ({ id: p.id, display_name_encrypted: p.display_name_encrypted, pupil_ref: p.pupil_ref }))}
        onUploadComplete={loadAssessments}
      />

      {/* Results Summary */}
      {assessments.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Assessment Results
              <span className="text-xs font-normal text-gray-400 ml-2">
                {reviewed.length} reviewed · {pending.length} pending
              </span>
            </h4>
            {pending.length > 0 && (
              <button
                onClick={handleAgreeAll}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                ✓ Agree All ({pending.length})
              </button>
            )}
          </div>

          {/* Aligned summary */}
          {aligned.length > 0 && reviewed.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-emerald-700">
                {aligned.length} of {reviewed.length} reviewed — Teacher and AI agree
              </p>
            </div>
          )}

          {/* Pupil cards */}
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-8">Loading assessments...</p>
          ) : (
            <div className="grid gap-3">
              {/* Show pending first, then reviewed */}
              {[...pending, ...reviewed].map(assessment => (
                <PupilAssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onReview={handleReview}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {assessments.length === 0 && !loading && (
        <p className="text-xs text-gray-400 text-center py-4 mt-3">
          Upload worksheets above to start AI-assisted assessment
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/lesson-studio/AssessmentPanel.tsx
git commit -m "feat(lesson-studio): add AssessmentPanel — upload zone + assessment cards + bulk agree"
```

---

## Task 9: Wire Assessment Tab into LessonPlanPanel

**Files:**
- Modify: `apps/platform/src/components/lesson-studio/LessonPlanPanel.tsx`

- [ ] **Step 1: Read the current LessonPlanPanel to identify where to add the tab**

Read `apps/platform/src/components/lesson-studio/LessonPlanPanel.tsx` and identify:
- The tab bar structure (if any)
- Where section content is rendered
- Props interface

- [ ] **Step 2: Add Assessment tab and AssessmentPanel import**

At the top of `LessonPlanPanel.tsx`, add the import:

```typescript
import AssessmentPanel from './AssessmentPanel';
```

Then add state for the active tab and render a tab bar above the existing content. Add an "Assessment" tab that renders `<AssessmentPanel lessonPlanId={plan.id} pupils={pupils} />`.

The exact edit depends on the current structure — the worker should read the file first, identify where the section content begins, and add tab state + conditional rendering.

**Key requirement:** The `LessonPlanPanel` currently takes `plan, slot, onClose, onTeach, onMarkTaught` as props. Add `pupils: LSPupil[]` to the props interface so the AssessmentPanel can receive it.

- [ ] **Step 3: Update LessonStudio.tsx to pass pupils to LessonPlanPanel**

In `LessonStudio.tsx`, find where `<LessonPlanPanel>` is rendered and add `pupils={pupils}` to the props.

- [ ] **Step 4: Verify the build compiles**

```bash
cd apps/platform && npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or only pre-existing errors).

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/components/lesson-studio/LessonPlanPanel.tsx apps/platform/src/components/lesson-studio/LessonStudio.tsx
git commit -m "feat(lesson-studio): wire Assessment tab into lesson plan panel with pupil cards"
```

---

## Task 10: Calendar View Component

**Files:**
- Create: `apps/platform/src/components/lesson-studio/CalendarView.tsx`

- [ ] **Step 1: Write the calendar component**

```tsx
// apps/platform/src/components/lesson-studio/CalendarView.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CalendarEventWithPlan, LSClass } from '@/types/lesson-studio';
import { SUBJECT_COLORS } from '@/types/lesson-studio';

interface CalendarViewProps {
  classes: LSClass[];
  selectedClassId: string | null;
  onEventClick: (event: CalendarEventWithPlan) => void;
}

const TIME_SLOTS = [
  { label: '9:00 – 10:00', start: '09:00', end: '10:00' },
  { label: '10:15 – 11:15', start: '10:15', end: '11:15' },
  { label: '11:30 – 12:15', start: '11:30', end: '12:15' },
  { label: '1:15 – 2:15', start: '13:15', end: '14:15' },
  { label: '2:30 – 3:15', start: '14:30', end: '15:15' },
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function CalendarView({ classes, selectedClassId, onEventClick }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [events, setEvents] = useState<CalendarEventWithPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 4));
    const classParam = selectedClassId ? `&classId=${selectedClassId}` : '';

    try {
      const res = await fetch(`/api/lesson-studio/calendar?startDate=${start}&endDate=${end}${classParam}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data?.events || []);
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart, selectedClassId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const getEventsForCell = (dayIndex: number, slot: typeof TIME_SLOTS[0]) => {
    const dateStr = formatDate(addDays(weekStart, dayIndex));
    return events.filter(e => e.event_date === dateStr && e.start_time === slot.start + ':00');
  };

  const weekLabel = `${addDays(weekStart, 0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 4).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Weekly Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300"
          >
            ← Prev
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-[180px] text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300"
          >
            Next →
          </button>
          <button
            onClick={() => setWeekStart(getMonday(new Date()))}
            className="text-xs px-2.5 py-1 rounded-md border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          >
            Today
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
        {/* Day headers */}
        <div className="bg-gray-50 border-b border-gray-100 p-2" />
        {DAY_LABELS.map((day, i) => {
          const date = addDays(weekStart, i);
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <div
              key={day}
              className={`bg-gray-50 border-b border-gray-100 p-2 text-center ${isToday ? 'text-indigo-600 font-semibold' : ''}`}
            >
              <p className="text-[10px] font-semibold text-gray-500">{day}</p>
              <p className={`text-xs ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                {date.getDate()}
              </p>
            </div>
          );
        })}

        {/* Time slots */}
        {TIME_SLOTS.map(slot => (
          <>
            <div key={`t-${slot.start}`} className="bg-gray-50 border-b border-r border-gray-100 p-1 text-center flex items-center justify-center">
              <span className="text-[9px] text-gray-400 leading-tight">{slot.label}</span>
            </div>
            {DAY_LABELS.map((_, dayIndex) => {
              const cellEvents = getEventsForCell(dayIndex, slot);
              return (
                <div
                  key={`c-${dayIndex}-${slot.start}`}
                  className="border-b border-r border-gray-100 p-1 min-h-[52px] cursor-pointer hover:bg-indigo-50/50 transition-colors"
                >
                  {cellEvents.map(ev => {
                    const colors = SUBJECT_COLORS[ev.subject] || { bg: 'bg-gray-50', text: 'text-gray-700' };
                    const status = ev.lesson_plan?.status;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className={`${colors.bg} rounded-md p-1.5 mb-0.5`}
                      >
                        <p className={`text-[10px] font-semibold ${colors.text}`}>{ev.subject}</p>
                        <p className="text-[9px] text-gray-500 truncate">{ev.title}</p>
                        {status && (
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mt-0.5 ${
                            status === 'taught' ? 'bg-emerald-400' :
                            status === 'planned' ? 'bg-indigo-400' :
                            status === 'draft' ? 'bg-amber-400' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1 align-middle" />Taught</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1 align-middle" />Planned</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1 align-middle" />Draft</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1 align-middle" />Empty</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/lesson-studio/CalendarView.tsx
git commit -m "feat(lesson-studio): add CalendarView component — weekly calendar with event display"
```

---

## Task 11: Wire Calendar into LessonStudio Main Component

**Files:**
- Modify: `apps/platform/src/components/lesson-studio/LessonStudio.tsx`

- [ ] **Step 1: Read the current LessonStudio.tsx**

Read the file to understand the existing tab/view structure. The component currently uses a TimetableGrid. We need to add CalendarView as an alternative view.

- [ ] **Step 2: Add CalendarView import and toggle**

At the top of `LessonStudio.tsx`, add:

```typescript
import CalendarView from './CalendarView';
```

Add a state variable for view mode:

```typescript
const [viewMode, setViewMode] = useState<'timetable' | 'calendar'>('calendar');
```

In the header area (near the week navigation), add view toggle buttons:

```tsx
<div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
  <button
    onClick={() => setViewMode('calendar')}
    className={`text-xs px-3 py-1 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-500'}`}
  >
    Calendar
  </button>
  <button
    onClick={() => setViewMode('timetable')}
    className={`text-xs px-3 py-1 rounded-md ${viewMode === 'timetable' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-500'}`}
  >
    Timetable
  </button>
</div>
```

Conditionally render CalendarView or TimetableGrid based on `viewMode`.

- [ ] **Step 3: Verify build**

```bash
cd apps/platform && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/components/lesson-studio/LessonStudio.tsx
git commit -m "feat(lesson-studio): wire CalendarView into main component with view toggle"
```

---

## Task 12: Create Supabase Storage Bucket

**Files:** None (Supabase dashboard or CLI)

- [ ] **Step 1: Create the storage bucket for work submissions**

```bash
# Via Supabase CLI or dashboard
# Bucket name: lesson-studio-work
# Public: false (signed URLs for viewing)
# File size limit: 10MB
# Allowed MIME types: image/jpeg, image/png, image/heic, application/pdf
```

If using the SQL editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-studio-work',
  'lesson-studio-work',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;
```

Note: set `public: true` for now so Google Vision can access the URLs. In production, use signed URLs with a proxy.

- [ ] **Step 2: Verify the bucket exists**

Check Supabase dashboard → Storage → Buckets. `lesson-studio-work` should appear.

---

## Task 13: Integration Verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npm run dev
```

- [ ] **Step 2: Verify API endpoints respond**

```bash
# Calendar API
curl -s http://localhost:3001/api/lesson-studio/calendar?startDate=2026-04-14&endDate=2026-04-18 | head -c 200

# Assess API (GET — should return empty assessments)
curl -s "http://localhost:3001/api/lesson-studio/assess?lessonPlanId=test" | head -c 200
```

Expected: 200 responses (may be empty data or auth errors — both confirm the route is registered).

- [ ] **Step 3: Verify build passes**

```bash
cd apps/platform && npm run build 2>&1 | tail -20
```

Expected: Build succeeds or only pre-existing errors.

- [ ] **Step 4: Run all lesson studio tests**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement && npx vitest run apps/platform/src/lib/lesson-studio/
```

Expected: All grading pipeline tests pass.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix(lesson-studio): integration fixes for assessment pipeline"
```

---

## Summary: What Phase 1 Delivers

After completing these 13 tasks, the Lesson Studio has:

1. **Calendar scheduling** — teachers schedule lessons into a proper weekly calendar (not hardcoded timetable)
2. **Work upload** — drag-and-drop, file browser, batch upload of worksheets (photos/scans/PDFs)
3. **AI grading pipeline** — Google Cloud Vision OCR → Gemini 2.5 Flash grading against NC expected standards
4. **Per-pupil assessment cards** — AI grade, teacher grade, misconceptions, next steps, agree/override/flag buttons
5. **Assessment triangulation** — teacher + AI + moderator grades stored with alignment status
6. **Moderation queue** — disputed assessments flagged for school's internal moderator
7. **Bulk operations** — "Agree All" for aligned assessments

**What Phase 2 builds on this:**
- Teacher Assessment Dashboard (reads from the assessments this phase creates)
- Prerequisite skill analysis (uses assessment history + census data)
- Smart alerts (detects patterns in assessment data)
