import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { validateClassBuilderSubmission } from "@/lib/class-builder";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("survey_code", code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  let pupilQuery = supabase
    .from("pupils")
    .select("id, first_name, last_name, year_group, current_class, class_name")
    .eq("organization_id", session.organization_id)
    .eq("year_group", session.year_group)
    .eq("is_active", true)
    .order("last_name")
    .order("first_name");

  if (session.current_class) {
    pupilQuery = pupilQuery.or(
      `current_class.eq.${session.current_class},class_name.eq.${session.current_class}`,
    );
  }

  const { data: pupils, error: pupilsError } = await pupilQuery;
  if (pupilsError) throw pupilsError;

  const { data: responses, error: responsesError } = await supabase
    .from("class_builder_responses")
    .select("pupil_id")
    .eq("session_id", session.id);

  if (responsesError) throw responsesError;

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      status: session.status,
      year_group: session.year_group,
      current_class: session.current_class,
      closes_at: session.closes_at,
    },
    pupils: (pupils ?? []).map((pupil: any) => ({
      id: pupil.id,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      year_group: pupil.year_group,
      current_class: pupil.current_class ?? pupil.class_name ?? null,
    })),
    submittedPupilIds: (responses ?? []).map((response) => response.pupil_id),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const pupilId = body.pupilId;

  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("survey_code", code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  let pupilQuery = supabase
    .from("pupils")
    .select("id")
    .eq("organization_id", session.organization_id)
    .eq("year_group", session.year_group)
    .eq("is_active", true);

  if (session.current_class) {
    pupilQuery = pupilQuery.or(
      `current_class.eq.${session.current_class},class_name.eq.${session.current_class}`,
    );
  }

  const { data: pupils, error: pupilsError } = await pupilQuery;
  if (pupilsError) throw pupilsError;

  const choices = [
    ...normaliseChoiceIds(body.friendshipIds).map((id, index) => ({
      chooser_pupil_id: pupilId,
      chosen_pupil_id: id,
      choice_type: "friendship" as const,
      rank: index + 1,
    })),
    ...normaliseChoiceIds(body.workWellIds).map((id, index) => ({
      chooser_pupil_id: pupilId,
      chosen_pupil_id: id,
      choice_type: "work_well" as const,
      rank: index + 1,
    })),
  ];

  const validation = validateClassBuilderSubmission({
    session: { id: session.id, status: session.status },
    pupilId,
    cohortPupilIds: (pupils ?? []).map((pupil) => pupil.id),
    choices,
  });

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  await supabase
    .from("class_builder_responses")
    .delete()
    .eq("session_id", session.id)
    .eq("pupil_id", pupilId);

  const { data: response, error: responseError } = await supabase
    .from("class_builder_responses")
    .insert({ session_id: session.id, pupil_id: pupilId })
    .select()
    .single();

  if (responseError) throw responseError;

  if (choices.length > 0) {
    const { error: choicesError } = await supabase
      .from("class_builder_choices")
      .insert(
        choices.map((choice) => ({
          response_id: response.id,
          ...choice,
        })),
      );

    if (choicesError) throw choicesError;
  }

  return NextResponse.json({ ok: true, responseId: response.id }, { status: 201 });
}

function normaliseChoiceIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
    : [];
}
