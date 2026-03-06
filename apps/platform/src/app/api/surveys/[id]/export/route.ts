import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

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

    // Fetch all responses with answers
    const { data: responses, error: respError } = await supabase
      .from("survey_responses")
      .select(
        `
        *,
        survey_answers (*)
      `,
      )
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: true });

    if (respError) throw respError;

    // Flatten questions
    const questions: any[] = [];
    const choiceMap = new Map<string, Map<string, string>>();

    for (const page of survey.survey_pages || []) {
      const sortedQuestions = (page.survey_questions || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      );
      for (const q of sortedQuestions) {
        questions.push(q);
        if (q.survey_choices?.length > 0) {
          const map = new Map<string, string>();
          for (const c of q.survey_choices) {
            map.set(c.id, c.label);
          }
          choiceMap.set(q.id, map);
        }
      }
    }

    // Build CSV
    const headers = [
      "Response ID",
      "Status",
      "Started At",
      "Completed At",
      "Time (seconds)",
      "Score",
      ...questions.map((q) => q.title),
    ];

    const rows = (responses || []).map((r: any) => {
      const answerMap = new Map<string, any>();
      for (const a of r.survey_answers || []) {
        answerMap.set(a.question_id, a);
      }

      return [
        r.id,
        r.status,
        r.started_at ? new Date(r.started_at).toISOString() : "",
        r.completed_at ? new Date(r.completed_at).toISOString() : "",
        r.time_taken_seconds ?? "",
        r.total_score ?? "",
        ...questions.map((q) => {
          const answer = answerMap.get(q.id);
          if (!answer) return "";

          if (answer.answer_text) return answer.answer_text;
          if (answer.answer_numeric !== null)
            return String(answer.answer_numeric);
          if (answer.answer_choices?.length > 0) {
            const choices = choiceMap.get(q.id);
            if (choices) {
              return answer.answer_choices
                .map((cId: string) => choices.get(cId) || cId)
                .join("; ");
            }
            return answer.answer_choices.join("; ");
          }
          if (answer.answer_date) return answer.answer_date;
          if (answer.answer_json) return JSON.stringify(answer.answer_json);
          return "";
        }),
      ];
    });

    // Escape CSV values
    function escapeCSV(val: string): string {
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const csv = [headers.map(escapeCSV).join(",")]
      .concat(rows.map((row: any[]) => row.map(escapeCSV).join(",")))
      .join("\n");

    const filename = `${survey.title.replace(/[^a-zA-Z0-9]/g, "_")}_export.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/[id]/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
