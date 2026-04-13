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
  if (moderatorGrade === null) return 'pending';

  const grades = [teacherGrade, aiGrade, moderatorGrade].filter(Boolean) as string[];
  const unique = new Set(grades);

  if (unique.size === 1) return 'aligned';
  if (unique.size === grades.length && grades.length === 3) return 'disputed';
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
