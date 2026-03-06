import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch full survey
    const { data: survey, error } = await supabase
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
        ),
        survey_logic_rules (*)
      `,
      )
      .eq("id", surveyId)
      .single();

    if (error || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Create new slug
    const slug =
      survey.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) +
      "-copy-" +
      Math.random().toString(36).slice(2, 8);

    // Create duplicate survey
    const { data: newSurvey, error: createError } = await supabase
      .from("surveys")
      .insert({
        title: `${survey.title} (Copy)`,
        description: survey.description,
        slug,
        organization_id: survey.organization_id,
        category: survey.category,
        status: "draft",
        is_anonymous: survey.is_anonymous,
        is_toolbox: survey.is_toolbox,
        settings: survey.settings,
        branding: survey.branding,
        scoring_config: survey.scoring_config,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Map old IDs to new IDs for logic rules
    const questionIdMap = new Map<string, string>();
    const pageIdMap = new Map<string, string>();

    // Duplicate pages, questions, and choices
    const sortedPages = (survey.survey_pages || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order,
    );

    for (const page of sortedPages) {
      const { data: newPage, error: pageError } = await supabase
        .from("survey_pages")
        .insert({
          survey_id: newSurvey.id,
          title: page.title,
          description: page.description,
          sort_order: page.sort_order,
        })
        .select()
        .single();

      if (pageError) throw pageError;
      pageIdMap.set(page.id, newPage.id);

      const sortedQuestions = (page.survey_questions || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      );

      for (const q of sortedQuestions) {
        const { data: newQ, error: qError } = await supabase
          .from("survey_questions")
          .insert({
            survey_id: newSurvey.id,
            page_id: newPage.id,
            title: q.title,
            description: q.description,
            question_type: q.question_type,
            is_required: q.is_required,
            sort_order: q.sort_order,
            settings: q.settings,
            score_weight: q.score_weight,
          })
          .select()
          .single();

        if (qError) throw qError;
        questionIdMap.set(q.id, newQ.id);

        // Duplicate choices
        if (q.survey_choices?.length > 0) {
          const choiceInserts = q.survey_choices
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((c: any) => ({
              question_id: newQ.id,
              label: c.label,
              value: c.value,
              sort_order: c.sort_order,
              score: c.score,
              image_url: c.image_url,
            }));

          const { error: choiceError } = await supabase
            .from("survey_choices")
            .insert(choiceInserts);

          if (choiceError) throw choiceError;
        }
      }
    }

    // Duplicate logic rules with remapped IDs
    if (survey.survey_logic_rules?.length > 0) {
      const logicInserts = survey.survey_logic_rules.map((rule: any) => ({
        survey_id: newSurvey.id,
        source_question_id:
          questionIdMap.get(rule.source_question_id) || rule.source_question_id,
        condition: rule.condition,
        condition_value: rule.condition_value,
        action: rule.action,
        target_question_id: rule.target_question_id
          ? questionIdMap.get(rule.target_question_id) ||
            rule.target_question_id
          : null,
        target_page_id: rule.target_page_id
          ? pageIdMap.get(rule.target_page_id) || rule.target_page_id
          : null,
      }));

      const { error: logicError } = await supabase
        .from("survey_logic_rules")
        .insert(logicInserts);

      if (logicError) {
        console.error("Failed to duplicate logic rules:", logicError);
        // Non-fatal - survey still created
      }
    }

    return NextResponse.json(
      {
        id: newSurvey.id,
        title: newSurvey.title,
        slug: newSurvey.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/surveys/[id]/duplicate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
