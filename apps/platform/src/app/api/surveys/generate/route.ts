import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import { NextRequest } from "next/server";
import { protectedRoute, aiRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = ROUTER_MODELS.DEFAULT;

interface GenerateRequest {
  prompt: string;
  organizationId: string;
  category?: string;
  questionCount?: number;
  isToolbox?: boolean;
}

export const POST = aiRoute(async (auth, request) => {
  const body: GenerateRequest = await request.json();
  const {
    prompt,
    organizationId,
    category,
    questionCount = 10,
    isToolbox,
  } = body;

  if (!prompt) {
    return apiError("prompt is required", 400);
  }

  if (!OPENROUTER_API_KEY) {
    return apiError("AI service not configured", 503);
  }

  const orgId = organizationId || auth.organizationId;

  const systemPrompt = `You are an expert UK school survey designer. Generate a survey based on the user's description.

RULES:
- Generate questions appropriate for UK schools (primary, secondary, or all-through)
- Use British English spelling and terminology
- Include a mix of question types for engagement
- Ensure questions are clear, unbiased, and age-appropriate
- Include safeguarding-aware phrasing where relevant
- Maximum ${questionCount} questions
- Group related questions into logical pages

Available question types: multiple_choice, checkbox, dropdown, short_text, long_text, rating, nps, likert_scale, opinion_scale, yes_no, ranking, slider, statement

Respond with valid JSON only, no markdown. Use this exact structure:
{
  "title": "Survey Title",
  "description": "Brief description",
  "category": "${category || "general"}",
  "settings": {
    "welcome_message": "Welcome message text",
    "thank_you_message": "Thank you message",
    "show_progress_bar": true,
    "allow_back_navigation": true,
    "time_estimate_minutes": 5
  },
  "pages": [
    {
      "title": "Page Title",
      "description": "Optional page description",
      "questions": [
        {
          "title": "Question text?",
          "description": "Optional help text",
          "question_type": "multiple_choice",
          "is_required": true,
          "choices": ["Option A", "Option B", "Option C"],
          "settings": {}
        }
      ]
    }
  ]
}

For rating/opinion_scale: include "settings": { "min": 1, "max": 5, "min_label": "Poor", "max_label": "Excellent" }
For likert_scale: include "choices" with the scale labels
For nps: no choices needed (0-10 automatic)
For slider: include "settings": { "min": 0, "max": 100, "step": 1 }
For statement: no choices, just informational text`;

  const aiResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    },
  );

  if (!aiResponse.ok) {
    console.error("AI API error:", await aiResponse.text());
    return apiError("AI generation failed", 502);
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;

  if (!content) {
    return apiError("No response from AI", 502);
  }

  // Parse AI response - handle potential markdown wrapping
  let surveyData;
  try {
    const jsonStr = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    surveyData = JSON.parse(jsonStr);
  } catch {
    console.error("Failed to parse AI response:", content);
    return apiError("Failed to parse AI response", 502);
  }

  // Create the survey in database
  const supabase = createServiceRoleClient();

  const slug =
    surveyData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 8);

  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      title: surveyData.title,
      description: surveyData.description || "",
      slug,
      organization_id: orgId,
      category: surveyData.category || category || "general",
      status: "draft",
      is_anonymous: true,
      is_toolbox: isToolbox || false,
      settings: surveyData.settings || {},
    })
    .select()
    .single();

  if (surveyError) throw surveyError;

  // Create pages and questions
  for (let pi = 0; pi < (surveyData.pages || []).length; pi++) {
    const page = surveyData.pages[pi];
    const { data: pageData, error: pageError } = await supabase
      .from("survey_pages")
      .insert({
        survey_id: survey.id,
        title: page.title || `Page ${pi + 1}`,
        description: page.description || null,
        sort_order: pi,
      })
      .select()
      .single();

    if (pageError) throw pageError;

    for (let qi = 0; qi < (page.questions || []).length; qi++) {
      const q = page.questions[qi];
      const { data: questionData, error: qError } = await supabase
        .from("survey_questions")
        .insert({
          survey_id: survey.id,
          page_id: pageData.id,
          title: q.title,
          description: q.description || null,
          question_type: q.question_type,
          is_required: q.is_required ?? true,
          sort_order: qi,
          settings: q.settings || {},
        })
        .select()
        .single();

      if (qError) throw qError;

      // Create choices if applicable
      if (q.choices?.length > 0) {
        const choiceInserts = q.choices.map((label: string, ci: number) => ({
          question_id: questionData.id,
          label,
          value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          sort_order: ci,
        }));

        const { error: choiceError } = await supabase
          .from("survey_choices")
          .insert(choiceInserts);

        if (choiceError) throw choiceError;
      }
    }
  }

  return apiSuccess({
    surveyId: survey.id,
    title: surveyData.title,
    pageCount: surveyData.pages?.length || 0,
    questionCount:
      surveyData.pages?.reduce(
        (acc: number, p: any) => acc + (p.questions?.length || 0),
        0,
      ) || 0,
  });
});
