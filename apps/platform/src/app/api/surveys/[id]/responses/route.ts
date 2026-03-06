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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    // Get responses with answers
    const { data: responses, error } = await supabase
      .from("survey_responses")
      .select(
        `
        *,
        survey_answers (*)
      `,
      )
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      responses: responses ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/[id]/responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { sessionId, answers, respondentId, status } = body;

    // Hash IP for duplicate detection
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ipHash = Buffer.from(ip).toString("base64").slice(0, 16);

    // Check if continuing an existing session
    if (sessionId) {
      const { data: existing } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("session_id", sessionId)
        .eq("survey_id", surveyId)
        .single();

      if (existing) {
        // Update existing response
        const updates: Record<string, unknown> = {};
        if (status === "completed") {
          updates.status = "completed";
          updates.completed_at = new Date().toISOString();
          updates.time_taken_seconds = body.timeTakenSeconds || null;
          updates.total_score = body.totalScore || null;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("survey_responses")
            .update(updates)
            .eq("id", existing.id);
        }

        // Upsert answers
        if (answers && Array.isArray(answers)) {
          for (const answer of answers) {
            const { data: existingAnswer } = await supabase
              .from("survey_answers")
              .select("id")
              .eq("response_id", existing.id)
              .eq("question_id", answer.questionId)
              .single();

            const answerRow = {
              response_id: existing.id,
              question_id: answer.questionId,
              answer_text: answer.answerText ?? null,
              answer_choices: answer.answerChoices ?? null,
              answer_numeric: answer.answerNumeric ?? null,
              answer_date: answer.answerDate ?? null,
              answer_json: answer.answerJson ?? null,
              score: answer.score ?? null,
              answered_at: new Date().toISOString(),
            };

            if (existingAnswer) {
              await supabase
                .from("survey_answers")
                .update(answerRow)
                .eq("id", existingAnswer.id);
            } else {
              await supabase.from("survey_answers").insert(answerRow);
            }
          }
        }

        return NextResponse.json({ responseId: existing.id, sessionId });
      }
    }

    // Create new response
    const newSessionId = sessionId || `sess_${crypto.randomUUID()}`;

    const { data: response, error: respError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: surveyId,
        respondent_id: respondentId || null,
        session_id: newSessionId,
        status: status || "in_progress",
        started_at: new Date().toISOString(),
        completed_at: status === "completed" ? new Date().toISOString() : null,
        ip_hash: ipHash,
        user_agent: request.headers.get("user-agent") || null,
        metadata: body.metadata || {},
        total_score: body.totalScore || null,
        time_taken_seconds: body.timeTakenSeconds || null,
      })
      .select()
      .single();

    if (respError) throw respError;

    // Insert answers
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answerRows = answers.map((a: any) => ({
        response_id: response.id,
        question_id: a.questionId,
        answer_text: a.answerText ?? null,
        answer_choices: a.answerChoices ?? null,
        answer_numeric: a.answerNumeric ?? null,
        answer_date: a.answerDate ?? null,
        answer_json: a.answerJson ?? null,
        score: a.score ?? null,
        answered_at: new Date().toISOString(),
      }));

      const { error: ansError } = await supabase
        .from("survey_answers")
        .insert(answerRows);

      if (ansError) throw ansError;
    }

    return NextResponse.json(
      { responseId: response.id, sessionId: newSessionId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/surveys/[id]/responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
