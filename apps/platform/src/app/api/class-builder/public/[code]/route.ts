import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  classBuilderYearStorageAliases,
  parseClassBuilderSessionYearGroups,
  validateClassBuilderSubmission,
} from "@/lib/class-builder";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const token = request.nextUrl.searchParams.get("t");
  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("survey_code", code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const cohortYearGroups = parseClassBuilderSessionYearGroups(session.year_group);
  const yearAliases = classBuilderYearStorageAliases(cohortYearGroups);

  let pupilQuery = supabase
    .from("pupils")
    .select("id, first_name, last_name, year_group, current_class, class_name")
    .eq("organization_id", session.organization_id)
    .in("year_group", yearAliases)
    .eq("is_active", true)
    .order("first_name")
    .order("last_name");

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

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", session.organization_id)
    .maybeSingle();

  let selectedPupilId: string | null = null;
  if (token) {
    const { hashPupilAccessToken } = await import("@/lib/pupil-pass");
    const { data: tokenPupil, error: tokenPupilError } = await supabase
      .from("pupils")
      .select("id,is_active,pass_revoked_at")
      .eq("organization_id", session.organization_id)
      .eq("pupil_access_token_hash", hashPupilAccessToken(token))
      .maybeSingle();

    if (tokenPupilError) throw tokenPupilError;
    if (!tokenPupil || tokenPupil.is_active === false || tokenPupil.pass_revoked_at) {
      return NextResponse.json(
        { error: "This pupil pass is not active. Ask your teacher for help." },
        { status: 403 },
      );
    }
    selectedPupilId = tokenPupil.id;
  }

  const mappedPupils = (pupils ?? []).map((pupil: {
    id: string;
    first_name: string;
    last_name: string;
    year_group: string;
    current_class: string | null;
    class_name: string | null;
  }) => ({
    id: pupil.id,
    first_name: pupil.first_name,
    last_name: pupil.last_name,
    year_group: pupil.year_group,
    current_class: pupil.current_class ?? pupil.class_name ?? null,
  }));

  if (selectedPupilId && !mappedPupils.some((pupil) => pupil.id === selectedPupilId)) {
    return NextResponse.json(
      { error: "This pupil pass is not part of this survey group." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      status: session.status,
      year_group: session.year_group,
      current_class: session.current_class,
      closes_at: session.closes_at,
      school_name: organization?.name ?? null,
      logo_url:
        (organization?.settings as { logo_url?: string | null } | null)?.logo_url ?? null,
      primary_color:
        (organization?.settings as { primary_color?: string | null } | null)?.primary_color ??
        null,
    },
    pupils: mappedPupils,
    submittedPupilIds: (responses ?? []).map((response) => response.pupil_id),
    selectedPupilId,
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
  const pupilToken = typeof body.pupilToken === "string" ? body.pupilToken : "";

  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("survey_code", code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const cohortYearGroups = parseClassBuilderSessionYearGroups(session.year_group);
  const yearAliases = classBuilderYearStorageAliases(cohortYearGroups);

  let pupilQuery = supabase
    .from("pupils")
    .select("id")
    .eq("organization_id", session.organization_id)
    .in("year_group", yearAliases)
    .eq("is_active", true);

  if (session.current_class) {
    pupilQuery = pupilQuery.or(
      `current_class.eq.${session.current_class},class_name.eq.${session.current_class}`,
    );
  }

  const { data: pupils, error: pupilsError } = await pupilQuery;
  if (pupilsError) throw pupilsError;

  if (pupilToken) {
    const { hashPupilAccessToken } = await import("@/lib/pupil-pass");
    const { data: tokenPupil, error: tokenPupilError } = await supabase
      .from("pupils")
      .select("id,is_active,pass_revoked_at")
      .eq("organization_id", session.organization_id)
      .eq("pupil_access_token_hash", hashPupilAccessToken(pupilToken))
      .maybeSingle();

    if (tokenPupilError) throw tokenPupilError;
    if (!tokenPupil || tokenPupil.id !== pupilId || tokenPupil.is_active === false || tokenPupil.pass_revoked_at) {
      return NextResponse.json(
        { errors: ["This pupil pass does not match the selected pupil."] },
        { status: 403 },
      );
    }
  }

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
