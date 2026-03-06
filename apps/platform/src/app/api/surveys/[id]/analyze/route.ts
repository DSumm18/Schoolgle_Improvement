import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectSafeguardingConcerns } from "@/lib/surveys/safeguarding-detector";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = "deepseek/deepseek-chat";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch survey with questions
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select(
        `
        *,
        survey_pages (
          *,
          survey_questions (
            *,
            survey_choices (*)
          )
        )
      `,
      )
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Fetch completed responses
    const { data: responses, error: respError } = await supabase
      .from("survey_responses")
      .select(`*, survey_answers (*)`)
      .eq("survey_id", surveyId)
      .eq("status", "completed");

    if (respError) throw respError;

    if (!responses || responses.length === 0) {
      return NextResponse.json({
        summary: "No completed responses yet.",
        responseCount: 0,
        themes: [],
        sentiment: null,
        safeguardingFlags: [],
        questionInsights: [],
      });
    }

    // Flatten questions
    const questions: any[] = [];
    const choiceMap = new Map<string, Map<string, string>>();
    for (const page of survey.survey_pages || []) {
      for (const q of (page.survey_questions || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      )) {
        questions.push(q);
        if (q.survey_choices?.length > 0) {
          const m = new Map<string, string>();
          for (const c of q.survey_choices) m.set(c.id, c.label);
          choiceMap.set(q.id, m);
        }
      }
    }

    // Build per-question summaries for AI
    const questionSummaries: any[] = [];
    const textAnswersForSafeguarding: Array<{
      questionId: string;
      questionTitle: string;
      answerText: string | null;
    }> = [];

    for (const q of questions) {
      const answers = responses
        .map((r: any) =>
          (r.survey_answers || []).find((a: any) => a.question_id === q.id),
        )
        .filter(Boolean);

      const summary: any = {
        questionId: q.id,
        title: q.title,
        type: q.question_type,
        responseCount: answers.length,
      };

      if (
        [
          "multiple_choice",
          "checkbox",
          "dropdown",
          "yes_no",
          "image_choice",
        ].includes(q.question_type)
      ) {
        const counts: Record<string, number> = {};
        for (const a of answers) {
          const choices =
            a.answer_choices || (a.answer_text ? [a.answer_text] : []);
          for (const c of choices) {
            const label = choiceMap.get(q.id)?.get(c) || c;
            counts[label] = (counts[label] || 0) + 1;
          }
        }
        summary.distribution = counts;
      } else if (
        ["rating", "nps", "opinion_scale", "likert_scale", "slider"].includes(
          q.question_type,
        )
      ) {
        const nums = answers
          .map((a: any) => a.answer_numeric ?? parseFloat(a.answer_text))
          .filter((n: number) => !isNaN(n));
        if (nums.length > 0) {
          summary.average =
            Math.round(
              (nums.reduce((a: number, b: number) => a + b, 0) / nums.length) *
                100,
            ) / 100;
          summary.min = Math.min(...nums);
          summary.max = Math.max(...nums);
          summary.median = nums.sort((a: number, b: number) => a - b)[
            Math.floor(nums.length / 2)
          ];
        }
      } else if (["short_text", "long_text"].includes(q.question_type)) {
        const texts = answers.map((a: any) => a.answer_text).filter(Boolean);
        summary.sampleResponses = texts.slice(0, 20);
        summary.totalTextResponses = texts.length;

        // Collect for safeguarding check
        for (const text of texts) {
          textAnswersForSafeguarding.push({
            questionId: q.id,
            questionTitle: q.title,
            answerText: text,
          });
        }
      }

      questionSummaries.push(summary);
    }

    // Safeguarding detection
    const safeguardingFlags = detectSafeguardingConcerns(
      textAnswersForSafeguarding,
    );

    // AI analysis if available
    let aiAnalysis = null;
    if (OPENROUTER_API_KEY && responses.length >= 3) {
      try {
        aiAnalysis = await generateAIAnalysis(
          survey.title,
          questionSummaries,
          responses.length,
        );
      } catch (err) {
        console.error("AI analysis failed:", err);
      }
    }

    // Calculate NPS if applicable
    const npsQuestions = questions.filter((q) => q.question_type === "nps");
    let npsScore = null;
    if (npsQuestions.length > 0) {
      const npsQ = npsQuestions[0];
      const npsAnswers = responses
        .map((r: any) =>
          (r.survey_answers || []).find((a: any) => a.question_id === npsQ.id),
        )
        .filter(Boolean)
        .map((a: any) => a.answer_numeric ?? parseFloat(a.answer_text))
        .filter((n: number) => !isNaN(n));

      if (npsAnswers.length > 0) {
        const promoters = npsAnswers.filter((n: number) => n >= 9).length;
        const detractors = npsAnswers.filter((n: number) => n <= 6).length;
        npsScore = Math.round(
          ((promoters - detractors) / npsAnswers.length) * 100,
        );
      }
    }

    // Completion rate
    const totalResponses = await supabase
      .from("survey_responses")
      .select("id", { count: "exact" })
      .eq("survey_id", surveyId);
    const completionRate = totalResponses.count
      ? Math.round((responses.length / totalResponses.count) * 100)
      : 0;

    // Average time
    const times = responses
      .map((r: any) => r.time_taken_seconds)
      .filter((t: number | null) => t != null);
    const avgTime =
      times.length > 0
        ? Math.round(
            times.reduce((a: number, b: number) => a + b, 0) / times.length,
          )
        : null;

    return NextResponse.json({
      responseCount: responses.length,
      completionRate,
      averageTimeSeconds: avgTime,
      npsScore,
      questionInsights: questionSummaries,
      safeguardingFlags,
      aiAnalysis,
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/[id]/analyze:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function generateAIAnalysis(
  surveyTitle: string,
  questionSummaries: any[],
  responseCount: number,
) {
  const systemPrompt = `You are a UK school data analyst. Analyse survey results and provide actionable insights for school leaders.

RULES:
- Use British English
- Focus on patterns, trends, and areas for improvement
- Reference Ofsted framework areas where relevant
- Be concise but thorough
- Highlight any concerning patterns
- Suggest 3-5 specific actions the school could take

Respond with valid JSON only:
{
  "summary": "2-3 sentence overall summary",
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "themes": [
    { "theme": "Theme name", "description": "Brief description", "frequency": "high|medium|low" }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "recommendedActions": [
    { "action": "What to do", "priority": "high|medium|low", "ofstedArea": "Optional Ofsted area" }
  ],
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"]
}`;

  const userMessage = `Survey: "${surveyTitle}"
Total responses: ${responseCount}

Question summaries:
${JSON.stringify(questionSummaries, null, 2)}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://schoolgle.co.uk",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error("AI API error");

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No AI content");

  const jsonStr = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(jsonStr);
}
