import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { DifferentiationGroup, SENDAdaptation, WorksheetQuestion } from "@/types/lesson-studio";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});

// ─── Grade mapping ────────────────────────────────────────────────────────

function percentageToGrade(percentage: number): string {
  if (percentage >= 81) return "GDS";
  if (percentage >= 61) return "EXS";
  return "WTS";
}

// ─── Strip enc: prefix ────────────────────────────────────────────────────

function resolveDisplayName(raw: string | null): string {
  if (!raw) return "Unknown";
  return raw.startsWith("enc:") ? raw.slice(4) : raw;
}

// ─── Build grading prompt ─────────────────────────────────────────────────

function buildGradingPrompt(
  questions: WorksheetQuestion[],
  answers: Array<{ questionIndex: number; answer: string }>,
  context: {
    subject: string;
    learningObjective: string;
    successCriteria: string[];
    groupKey: string;
    pupilName: string;
    yearGroup: string;
  },
): string {
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

  const qAndA = questions
    .map((q, i) => {
      const ans = answers.find((a) => a.questionIndex === i);
      return `Q${i + 1}: ${q.q} (marks: ${q.marks ?? 1})\nA${i + 1}: ${ans?.answer ?? "(no answer)"}`;
    })
    .join("\n\n");

  const criteria =
    context.successCriteria.length > 0
      ? context.successCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")
      : "Not specified";

  return `You are grading ${context.subject} work for a UK primary/secondary school pupil.

Pupil: ${context.pupilName} (Year ${context.yearGroup})
Group: ${context.groupKey}
Learning objective: ${context.learningObjective}
Success criteria:
${criteria}

Questions and pupil answers (total marks available: ${totalMarks}):
${qAndA}

Grade each answer carefully. Award marks fairly — partial marks are allowed. Then provide an overall assessment.

Return ONLY valid JSON in exactly this structure (no markdown, no explanation outside the JSON):
{
  "questionResults": [
    { "questionIndex": 0, "correct": true, "marksAwarded": 3, "marksAvailable": 3, "feedback": "Correct — full explanation given." },
    { "questionIndex": 1, "correct": false, "marksAwarded": 1, "marksAvailable": 2, "feedback": "Partially correct — missed one key point." }
  ],
  "totalScore": 4,
  "totalMarks": 5,
  "percentage": 80,
  "overallGrade": "EXS",
  "misconceptions": [
    { "description": "Brief description of any misconception", "severity": "minor" }
  ],
  "overallFeedback": "Encouraging, specific feedback about the pupil's work as a whole.",
  "nextSteps": "One or two specific things the pupil can do to improve."
}

Grade mapping for overallGrade: 0–60% = WTS, 61–80% = EXS, 81–100% = GDS.
misconceptions array can be empty [].
Be encouraging and age-appropriate in feedback.`;
}

// ─── POST /api/lesson-studio/pupil-work/submit ─────────────────────────────

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  let body: {
    lessonPlanId: string;
    pupilId: string;
    organizationId?: string;
    answers: Array<{ questionIndex: number; answer: string }>;
  };

  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { lessonPlanId, pupilId, answers } = body;
  const effectiveOrgId = body.organizationId ?? orgId;

  if (!lessonPlanId) return apiError("lessonPlanId required", 400);
  if (!pupilId) return apiError("pupilId required", 400);
  if (!Array.isArray(answers) || answers.length === 0) {
    return apiError("answers array required", 400);
  }

  // 1. Load lesson plan
  const { data: plan, error: planError } = await supabase
    .from("ls_lesson_plans")
    .select("*")
    .eq("id", lessonPlanId)
    .eq("organization_id", effectiveOrgId)
    .single();

  if (planError || !plan) return apiError("Lesson plan not found", 404);

  // 2. Load pupil
  const { data: pupil, error: pupilError } = await supabase
    .from("ls_pupils")
    .select("*")
    .eq("id", pupilId)
    .eq("organization_id", effectiveOrgId)
    .single();

  if (pupilError || !pupil) return apiError("Pupil not found", 404);

  const pupilName = resolveDisplayName(pupil.display_name_encrypted);
  const yearGroup = pupil.year_group ?? "Unknown";

  // 3. Determine differentiation group
  const groups = (plan.differentiation_groups ?? []) as DifferentiationGroup[];
  const matchedGroup = groups.find((g) => {
    const groupNames = (g.pupils ?? "")
      .split(",")
      .map((n: string) => n.trim().toLowerCase());
    return groupNames.some(
      (gn: string) =>
        gn === pupilName.toLowerCase() ||
        pupilName.toLowerCase().includes(gn),
    );
  });
  const groupKey: "deeper" | "core" | "scaffold" | "guided" = matchedGroup
    ? (matchedGroup.name.toLowerCase() as "deeper" | "core" | "scaffold" | "guided")
    : "core";

  // 4. Get questions for this group
  const worksheetQuestions = plan.generated_resources_json?.worksheetQuestions ?? {};
  const questions: WorksheetQuestion[] =
    worksheetQuestions[groupKey] ?? worksheetQuestions["core"] ?? [];

  if (questions.length === 0) {
    return apiError("No questions found for this pupil's group", 422);
  }

  // 5. Build AI grading prompt
  const prompt = buildGradingPrompt(questions, answers, {
    subject: plan.subject ?? "Unknown",
    learningObjective: plan.learning_objective ?? "",
    successCriteria: Array.isArray(plan.success_criteria)
      ? (plan.success_criteria as string[])
      : [],
    groupKey,
    pupilName,
    yearGroup,
  });

  // 6. Call AI to grade
  let gradingResult: {
    questionResults: Array<{
      questionIndex: number;
      correct: boolean;
      marksAwarded: number;
      marksAvailable: number;
      feedback: string;
    }>;
    totalScore: number;
    totalMarks: number;
    percentage: number;
    overallGrade: string;
    misconceptions: Array<{ description: string; severity: string }>;
    overallFeedback: string;
    nextSteps: string;
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    gradingResult = JSON.parse(cleaned);

    // Ensure percentage is correctly calculated
    if (
      typeof gradingResult.totalScore === "number" &&
      typeof gradingResult.totalMarks === "number" &&
      gradingResult.totalMarks > 0
    ) {
      gradingResult.percentage = Math.round(
        (gradingResult.totalScore / gradingResult.totalMarks) * 100,
      );
    }

    // Enforce grade mapping
    gradingResult.overallGrade = percentageToGrade(gradingResult.percentage);
  } catch (aiErr) {
    const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
    console.error("[pupil-work/submit] AI grading error:", msg);
    return apiError(`AI grading failed: ${msg}`, 500);
  }

  // 7. Save to ls_assessments (non-blocking — log error but still return result)
  try {
    const { error: assessError } = await supabase
      .from("ls_assessments")
      .upsert(
        {
          organization_id: effectiveOrgId,
          lesson_plan_id: lessonPlanId,
          pupil_id: pupilId,
          subject: plan.subject ?? "Unknown",
          nc_objective_codes: [],
          ai_suggested_grade: gradingResult.overallGrade,
          ai_confidence: gradingResult.percentage / 100,
          ai_reasoning: gradingResult.overallFeedback,
          misconceptions: gradingResult.misconceptions,
          next_steps: gradingResult.nextSteps,
          feedback_text: gradingResult.overallFeedback,
          raw_scores: {
            questionResults: gradingResult.questionResults,
            totalScore: gradingResult.totalScore,
            totalMarks: gradingResult.totalMarks,
          },
          triangulation_status: "pending",
          assessment_date: new Date().toISOString().split("T")[0],
          assessed_at: new Date().toISOString(),
        },
        { onConflict: "lesson_plan_id,pupil_id" },
      );

    if (assessError) {
      console.warn("[pupil-work/submit] Assessment upsert warning:", assessError.message);
    }
  } catch (dbErr) {
    // Non-fatal — log and continue
    console.warn("[pupil-work/submit] DB save skipped:", dbErr);
  }

  // 8. Return grading results to pupil
  return apiSuccess({
    success: true,
    score: gradingResult.totalScore,
    totalMarks: gradingResult.totalMarks,
    percentage: gradingResult.percentage,
    grade: gradingResult.overallGrade,
    feedback: gradingResult.overallFeedback,
    nextSteps: gradingResult.nextSteps,
    questionResults: gradingResult.questionResults,
  });
});
