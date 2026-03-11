/**
 * Attendance Interventions API
 *
 * GET  /api/attendance/interventions — list active interventions
 * POST /api/attendance/interventions — create a new intervention
 * PUT  /api/attendance/interventions — update intervention status
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type InterventionTrigger =
  | "95_percent"
  | "92_percent"
  | "90_percent"
  | "85_percent"
  | "custom";
type InterventionType =
  | "letter"
  | "meeting"
  | "pa_letter"
  | "ewo_referral"
  | "parenting_contract"
  | "fixed_penalty"
  | "custom";
type InterventionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "escalated"
  | "cancelled";

function generateDemoInterventions() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "demo-int-1",
      pupil_id: "p5",
      pupil_name: "Esme Fletcher",
      year_group: 1,
      attendance_rate: 86.9,
      trigger: "90_percent" as InterventionTrigger,
      type: "pa_letter" as InterventionType,
      status: "in_progress" as InterventionStatus,
      description:
        "Persistent absence letter sent to parents. Follow-up meeting scheduled.",
      assigned_to: "Mrs Johnson (Attendance Lead)",
      due_date: inOneWeek.toISOString().split("T")[0],
      created_at: twoWeeksAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      notes: "Parent acknowledged receipt. Meeting booked for next Tuesday.",
    },
    {
      id: "demo-int-2",
      pupil_id: "p9",
      pupil_name: "Thea Jackson",
      year_group: 2,
      attendance_rate: 89.2,
      trigger: "90_percent" as InterventionTrigger,
      type: "meeting" as InterventionType,
      status: "pending" as InterventionStatus,
      description: "Attendance dropped below 90%. Parental meeting required.",
      assigned_to: "Mr Williams (Deputy Head)",
      due_date: inOneWeek.toISOString().split("T")[0],
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      notes: null,
    },
    {
      id: "demo-int-3",
      pupil_id: "p14",
      pupil_name: "Sebastian O'Brien",
      year_group: 3,
      attendance_rate: 88.5,
      trigger: "90_percent" as InterventionTrigger,
      type: "pa_letter" as InterventionType,
      status: "in_progress" as InterventionStatus,
      description:
        "PA threshold crossed. First letter sent, awaiting response.",
      assigned_to: "Mrs Johnson (Attendance Lead)",
      due_date: now.toISOString().split("T")[0],
      created_at: twoWeeksAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      notes: "No response to first letter. Second letter to be sent.",
    },
    {
      id: "demo-int-4",
      pupil_id: "p15",
      pupil_name: "Willow Parker",
      year_group: 3,
      attendance_rate: 46.2,
      trigger: "85_percent" as InterventionTrigger,
      type: "ewo_referral" as InterventionType,
      status: "in_progress" as InterventionStatus,
      description:
        "Severe absence — EWO referral submitted. Multi-agency support requested.",
      assigned_to: "Ms Davies (Headteacher)",
      due_date: inTwoWeeks.toISOString().split("T")[0],
      created_at: twoWeeksAgo.toISOString(),
      updated_at: now.toISOString(),
      notes:
        "EWO visit scheduled. Social services aware. Family support plan in development.",
    },
    {
      id: "demo-int-5",
      pupil_id: "p19",
      pupil_name: "Penelope Taylor",
      year_group: 4,
      attendance_rate: 88.1,
      trigger: "90_percent" as InterventionTrigger,
      type: "letter" as InterventionType,
      status: "completed" as InterventionStatus,
      description:
        "First concern letter sent. Attendance improved following contact.",
      assigned_to: "Mrs Johnson (Attendance Lead)",
      due_date: oneWeekAgo.toISOString().split("T")[0],
      created_at: twoWeeksAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      notes:
        "Attendance improved to 91% after intervention. Monitoring continues.",
    },
    {
      id: "demo-int-6",
      pupil_id: "p23",
      pupil_name: "Annabelle Xu",
      year_group: 5,
      attendance_rate: 89.6,
      trigger: "90_percent" as InterventionTrigger,
      type: "meeting" as InterventionType,
      status: "pending" as InterventionStatus,
      description: "Attendance concern — parent meeting to be arranged.",
      assigned_to: "Mr Williams (Deputy Head)",
      due_date: inTwoWeeks.toISOString().split("T")[0],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      notes: null,
    },
    {
      id: "demo-int-7",
      pupil_id: "p29",
      pupil_name: "Eloise Frost",
      year_group: 6,
      attendance_rate: 86.2,
      trigger: "85_percent" as InterventionTrigger,
      type: "ewo_referral" as InterventionType,
      status: "pending" as InterventionStatus,
      description:
        "Below 85% — EWO referral being prepared. Year 6 SATs concern.",
      assigned_to: "Ms Davies (Headteacher)",
      due_date: inOneWeek.toISOString().split("T")[0],
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      notes: "Critical — SATs in May. Must improve urgently.",
    },
  ];
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const pupilId = searchParams.get("pupil_id");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("attendance_interventions")
    .select("*")
    .eq("organization_id", organizationId);

  if (status) {
    query = query.eq("status", status);
  }
  if (pupilId) {
    query = query.eq("pupil_id", pupilId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[Attendance Interventions GET] Error:", error);
  }

  if (!data || data.length === 0) {
    return apiSuccess({
      interventions: generateDemoInterventions(),
      is_demo: true,
    });
  }

  return apiSuccess({ interventions: data, is_demo: false });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const body = await request.json();

  const {
    pupil_id,
    pupil_name,
    year_group,
    attendance_rate,
    trigger,
    type,
    description,
    assigned_to,
    due_date,
  } = body;

  if (!pupil_id || !type || !description) {
    return apiError(
      "Missing required fields: pupil_id, type, description",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const record = {
    organization_id: organizationId,
    pupil_id,
    pupil_name: pupil_name || "",
    year_group: year_group || null,
    attendance_rate: attendance_rate || null,
    trigger: trigger || "custom",
    type,
    status: "pending",
    description,
    assigned_to: assigned_to || null,
    due_date: due_date || null,
    created_by: userId,
    notes: null,
  };

  const { data, error } = await supabase
    .from("attendance_interventions")
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("[Attendance Interventions POST] Error:", error);
    return apiError("Failed to create intervention", 500);
  }

  return apiSuccess(data, 201);
});

export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const body = await request.json();
  const { id, status, notes } = body;

  if (!id) {
    return apiError("Missing required field: id", 400);
  }

  const supabase = createServiceRoleClient();

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("attendance_interventions")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[Attendance Interventions PUT] Error:", error);
    return apiError("Failed to update intervention", 500);
  }

  return apiSuccess(data);
});
