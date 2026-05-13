import { protectedRoute, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildClassBuilderCsv } from "@/lib/class-builder";
import { NextResponse } from "next/server";

function getSessionId(pathname: string) {
  return pathname.split("/class-builder/sessions/")[1]?.split("/")[0];
}

export const GET = protectedRoute(async (auth, request) => {
  const sessionId = getSessionId(request.nextUrl.pathname);
  if (!sessionId) return apiError("Session id is required", 400);

  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (sessionError) throw sessionError;

  const { data: responses, error: responseError } = await supabase
    .from("class_builder_responses")
    .select(
      `
      *,
      pupils!class_builder_responses_pupil_id_fkey(first_name,last_name,year_group,current_class,class_name),
      class_builder_choices(*)
    `,
    )
    .eq("session_id", sessionId);

  if (responseError) throw responseError;

  const { data: groups, error: groupError } = await supabase
    .from("generated_class_groups")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (groupError) throw groupError;

  const rows = [
    ...(responses ?? []).map((response: any) => {
      const choices = response.class_builder_choices ?? [];
      return {
        record_type: "response",
        session_title: session.title,
        pupil_id: response.pupil_id,
        pupil_name: `${response.pupils?.first_name ?? ""} ${response.pupils?.last_name ?? ""}`.trim(),
        submitted_at: response.submitted_at,
        friendship_1: choiceAt(choices, "friendship", 1),
        friendship_2: choiceAt(choices, "friendship", 2),
        friendship_3: choiceAt(choices, "friendship", 3),
        work_well_1: choiceAt(choices, "work_well", 1),
        work_well_2: choiceAt(choices, "work_well", 2),
        work_well_3: choiceAt(choices, "work_well", 3),
        generated_group: "",
        explanation: "",
      };
    }),
    ...(groups ?? []).map((group: any) => ({
      record_type: "generated_group",
      session_title: session.title,
      pupil_id: "",
      pupil_name: "",
      submitted_at: group.created_at,
      friendship_1: "",
      friendship_2: "",
      friendship_3: "",
      work_well_1: "",
      work_well_2: "",
      work_well_3: "",
      generated_group: group.name,
      explanation: JSON.stringify({
        pupil_ids: group.pupil_ids,
        summary: group.summary,
      }),
    })),
  ];

  return new NextResponse(buildClassBuilderCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="class-builder-${session.year_group}.csv"`,
    },
  });
});

function choiceAt(choices: any[], choiceType: string, rank: number) {
  return (
    choices.find(
      (choice) => choice.choice_type === choiceType && choice.rank === rank,
    )?.chosen_pupil_id ?? ""
  );
}
