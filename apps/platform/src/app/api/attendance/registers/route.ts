/**
 * Attendance Registers API
 *
 * GET  /api/attendance/registers?date=YYYY-MM-DD&class_id=xxx&session=AM|PM
 * POST /api/attendance/registers — batch-save marks for a class
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// DfE statutory attendance codes
const VALID_CODES = [
  "/",
  "\\",
  "B",
  "C",
  "D",
  "E",
  "G",
  "H",
  "I",
  "J",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "#",
];

// Demo data for when no real data exists
function generateDemoRegisters(date: string, session: string) {
  const pupils = [
    { id: "demo-p1", name: "Oliver Thompson", year_group: 3 },
    { id: "demo-p2", name: "Amelia Patel", year_group: 3 },
    { id: "demo-p3", name: "George Wilson", year_group: 3 },
    { id: "demo-p4", name: "Isla Mohammed", year_group: 3 },
    { id: "demo-p5", name: "Harry Davies", year_group: 3 },
    { id: "demo-p6", name: "Olivia Brown", year_group: 3 },
    { id: "demo-p7", name: "Jack Taylor", year_group: 3 },
    { id: "demo-p8", name: "Emily Singh", year_group: 3 },
    { id: "demo-p9", name: "Charlie Evans", year_group: 3 },
    { id: "demo-p10", name: "Sophie Walker", year_group: 3 },
    { id: "demo-p11", name: "James Robinson", year_group: 3 },
    { id: "demo-p12", name: "Grace Hall", year_group: 3 },
    { id: "demo-p13", name: "Thomas Wright", year_group: 3 },
    { id: "demo-p14", name: "Mia Green", year_group: 3 },
    { id: "demo-p15", name: "William King", year_group: 3 },
    { id: "demo-p16", name: "Poppy Baker", year_group: 3 },
    { id: "demo-p17", name: "Oscar Adams", year_group: 3 },
    { id: "demo-p18", name: "Lily Nelson", year_group: 3 },
    { id: "demo-p19", name: "Henry Carter", year_group: 3 },
    { id: "demo-p20", name: "Ruby Mitchell", year_group: 3 },
    { id: "demo-p21", name: "Alfie Turner", year_group: 3 },
    { id: "demo-p22", name: "Jessica Phillips", year_group: 3 },
    { id: "demo-p23", name: "Noah Campbell", year_group: 3 },
    { id: "demo-p24", name: "Ava Roberts", year_group: 3 },
    { id: "demo-p25", name: "Leo Morris", year_group: 3 },
    { id: "demo-p26", name: "Freya Cook", year_group: 3 },
    { id: "demo-p27", name: "Ethan Morgan", year_group: 3 },
    { id: "demo-p28", name: "Daisy Bell", year_group: 3 },
    { id: "demo-p29", name: "Archie Murphy", year_group: 3 },
    { id: "demo-p30", name: "Florence Reed", year_group: 3 },
  ];

  // Generate realistic marks — most present, some absent
  const markCode = session === "AM" ? "/" : "\\";
  return pupils.map((p, i) => {
    let code = markCode;
    if (i === 7) code = "I"; // Illness
    if (i === 14) code = "C"; // Authorised leave
    if (i === 22) code = "L"; // Late
    if (i === 28) code = "U"; // Unauthorised
    return {
      id: `demo-reg-${i}`,
      pupil_id: p.id,
      pupil_name: p.name,
      date,
      session,
      code,
      minutes_late: code === "L" ? 12 : null,
      notes: code === "I" ? "Parent called - stomach bug" : null,
      recorded_by: "demo-teacher",
      created_at: new Date().toISOString(),
    };
  });
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const classId = searchParams.get("class_id");
  const session = searchParams.get("session") || "AM";

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("attendance_registers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("date", date)
    .eq("session", session);

  if (classId) {
    query = query.eq("class_id", classId);
  }

  const { data, error } = await query.order("pupil_name", { ascending: true });

  if (error) {
    console.error("[Attendance Registers GET] Error:", error);
    return apiError("Failed to fetch registers", 500);
  }

  // Return demo data if no real data exists
  if (!data || data.length === 0) {
    return apiSuccess({
      registers: generateDemoRegisters(date, session),
      is_demo: true,
    });
  }

  return apiSuccess({ registers: data, is_demo: false });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const body = await request.json();
  const { date, session, class_id, marks } = body;

  if (!date || !session || !marks || !Array.isArray(marks)) {
    return apiError("Missing required fields: date, session, marks", 400);
  }

  if (!["AM", "PM"].includes(session)) {
    return apiError("Session must be AM or PM", 400);
  }

  // Validate all codes
  for (const mark of marks) {
    if (!mark.pupil_id || !mark.code) {
      return apiError("Each mark must have pupil_id and code", 400);
    }
    if (!VALID_CODES.includes(mark.code)) {
      return apiError(`Invalid attendance code: ${mark.code}`, 400);
    }
  }

  const supabase = createServiceRoleClient();

  // Upsert marks (update if exists, insert if new)
  const records = marks.map((mark: any) => ({
    organization_id: organizationId,
    pupil_id: mark.pupil_id,
    pupil_name: mark.pupil_name || "",
    date,
    session,
    class_id: class_id || null,
    code: mark.code,
    minutes_late: mark.minutes_late || null,
    notes: mark.notes || null,
    recorded_by: userId,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("attendance_registers")
    .upsert(records, {
      onConflict: "organization_id,pupil_id,date,session",
    })
    .select();

  if (error) {
    console.error("[Attendance Registers POST] Error:", error);
    return apiError("Failed to save attendance marks", 500);
  }

  return apiSuccess({ saved: data?.length || 0, marks: data }, 201);
});
