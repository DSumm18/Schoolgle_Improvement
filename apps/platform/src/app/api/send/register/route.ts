import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

// Demo data for when no real data exists
const DEMO_REGISTER = [
  {
    id: "demo-1",
    pupil_code: "PUP-2024-001",
    first_name: "Pupil",
    last_name: "A",
    year_group: 3,
    sen_status: "K",
    primary_need: "SPLD",
    secondary_need: "SEMH",
    date_identified: "2024-09-15",
    ehcp_status: null,
    class_name: "3B",
    key_worker: "Mrs Thompson",
    notes: "Phonics intervention in place",
    created_at: "2024-09-15T00:00:00Z",
    updated_at: "2024-09-15T00:00:00Z",
  },
  {
    id: "demo-2",
    pupil_code: "PUP-2024-002",
    first_name: "Pupil",
    last_name: "B",
    year_group: 5,
    sen_status: "E",
    primary_need: "ASD",
    secondary_need: "SLCN",
    date_identified: "2023-01-10",
    ehcp_status: "finalised",
    class_name: "5A",
    key_worker: "Mr Davies",
    notes: "EHCP finalised June 2023. Annual review due Feb 2026",
    created_at: "2023-01-10T00:00:00Z",
    updated_at: "2025-11-20T00:00:00Z",
  },
  {
    id: "demo-3",
    pupil_code: "PUP-2024-003",
    first_name: "Pupil",
    last_name: "C",
    year_group: 1,
    sen_status: "K",
    primary_need: "SLCN",
    secondary_need: null,
    date_identified: "2025-09-20",
    ehcp_status: null,
    class_name: "1A",
    key_worker: "Miss Patel",
    notes: "SALT referral made Oct 2025",
    created_at: "2025-09-20T00:00:00Z",
    updated_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "demo-4",
    pupil_code: "PUP-2024-004",
    first_name: "Pupil",
    last_name: "D",
    year_group: 6,
    sen_status: "E",
    primary_need: "SEMH",
    secondary_need: "MLD",
    date_identified: "2022-03-01",
    ehcp_status: "finalised",
    class_name: "6B",
    key_worker: "Mrs Johnson",
    notes: "Transition plan to secondary in place",
    created_at: "2022-03-01T00:00:00Z",
    updated_at: "2025-12-10T00:00:00Z",
  },
  {
    id: "demo-5",
    pupil_code: "PUP-2024-005",
    first_name: "Pupil",
    last_name: "E",
    year_group: 4,
    sen_status: "K",
    primary_need: "MLD",
    secondary_need: null,
    date_identified: "2025-01-15",
    ehcp_status: null,
    class_name: "4A",
    key_worker: "Mr Wilson",
    notes: "Maths intervention group 3x weekly",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-09-12T00:00:00Z",
  },
  {
    id: "demo-6",
    pupil_code: "PUP-2024-006",
    first_name: "Pupil",
    last_name: "F",
    year_group: 2,
    sen_status: "K",
    primary_need: "SEMH",
    secondary_need: null,
    date_identified: "2025-10-01",
    ehcp_status: null,
    class_name: "2B",
    key_worker: "Mrs Thompson",
    notes: "Nurture group placement. CAMHS referral pending",
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "demo-7",
    pupil_code: "PUP-2024-007",
    first_name: "Pupil",
    last_name: "G",
    year_group: 3,
    sen_status: "E",
    primary_need: "PD",
    secondary_need: "MLD",
    date_identified: "2021-09-01",
    ehcp_status: "finalised",
    class_name: "3A",
    key_worker: "Miss Patel",
    notes: "1:1 TA support 15hrs. OT programme in place",
    created_at: "2021-09-01T00:00:00Z",
    updated_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-8",
    pupil_code: "PUP-2024-008",
    first_name: "Pupil",
    last_name: "H",
    year_group: 5,
    sen_status: "K",
    primary_need: "ASD",
    secondary_need: null,
    date_identified: "2024-11-20",
    ehcp_status: "requested",
    class_name: "5B",
    key_worker: "Mr Davies",
    notes: "EHCP needs assessment requested Nov 2025",
    created_at: "2024-11-20T00:00:00Z",
    updated_at: "2025-11-25T00:00:00Z",
  },
  {
    id: "demo-9",
    pupil_code: "PUP-2024-009",
    first_name: "Pupil",
    last_name: "I",
    year_group: 6,
    sen_status: "K",
    primary_need: "SPLD",
    secondary_need: "SEMH",
    date_identified: "2024-03-10",
    ehcp_status: null,
    class_name: "6A",
    key_worker: "Mrs Johnson",
    notes: "Dyslexia screened positive. Coloured overlays + extra time",
    created_at: "2024-03-10T00:00:00Z",
    updated_at: "2025-06-15T00:00:00Z",
  },
  {
    id: "demo-10",
    pupil_code: "PUP-2024-010",
    first_name: "Pupil",
    last_name: "J",
    year_group: 1,
    sen_status: "monitoring",
    primary_need: "SLCN",
    secondary_need: null,
    date_identified: "2025-11-01",
    ehcp_status: null,
    class_name: "1B",
    key_worker: "Miss Patel",
    notes: "Monitoring - may move to SEN K next term",
    created_at: "2025-11-01T00:00:00Z",
    updated_at: "2025-11-01T00:00:00Z",
  },
  {
    id: "demo-11",
    pupil_code: "PUP-2024-011",
    first_name: "Pupil",
    last_name: "K",
    year_group: 4,
    sen_status: "E",
    primary_need: "HI",
    secondary_need: "SLCN",
    date_identified: "2020-09-01",
    ehcp_status: "finalised",
    class_name: "4B",
    key_worker: "Mr Wilson",
    notes:
      "Bilateral hearing aids. FM system in classroom. ToD visits fortnightly",
    created_at: "2020-09-01T00:00:00Z",
    updated_at: "2025-10-20T00:00:00Z",
  },
  {
    id: "demo-12",
    pupil_code: "PUP-2024-012",
    first_name: "Pupil",
    last_name: "L",
    year_group: 2,
    sen_status: "K",
    primary_need: "SEMH",
    secondary_need: null,
    date_identified: "2025-09-10",
    ehcp_status: null,
    class_name: "2A",
    key_worker: "Mrs Thompson",
    notes: "Emotional literacy support. ELSA sessions weekly",
    created_at: "2025-09-10T00:00:00Z",
    updated_at: "2025-09-10T00:00:00Z",
  },
  {
    id: "demo-13",
    pupil_code: "PUP-2024-013",
    first_name: "Pupil",
    last_name: "M",
    year_group: 3,
    sen_status: "K",
    primary_need: "MLD",
    secondary_need: "SPLD",
    date_identified: "2024-06-01",
    ehcp_status: null,
    class_name: "3B",
    key_worker: "Miss Patel",
    notes: "Pre-teaching maths and literacy. Progress improving",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2025-07-10T00:00:00Z",
  },
  {
    id: "demo-14",
    pupil_code: "PUP-2024-014",
    first_name: "Pupil",
    last_name: "N",
    year_group: 5,
    sen_status: "E",
    primary_need: "SLD",
    secondary_need: "PD",
    date_identified: "2019-09-01",
    ehcp_status: "finalised",
    class_name: "5A",
    key_worker: "Mr Davies",
    notes: "Full-time 1:1 TA. Specialist curriculum. Annual review March 2026",
    created_at: "2019-09-01T00:00:00Z",
    updated_at: "2025-11-15T00:00:00Z",
  },
  {
    id: "demo-15",
    pupil_code: "PUP-2024-015",
    first_name: "Pupil",
    last_name: "O",
    year_group: 4,
    sen_status: "monitoring",
    primary_need: "NSA",
    secondary_need: null,
    date_identified: "2025-12-01",
    ehcp_status: null,
    class_name: "4A",
    key_worker: "Mr Wilson",
    notes: "Teacher concern raised. Initial assessments being completed",
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
  },
];

/**
 * GET /api/send/register
 * List SEN register entries. Filters: status, primary_need, year_group
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const primaryNeed = url.searchParams.get("primary_need");
  const yearGroup = url.searchParams.get("year_group");

  let query = supabase
    .from("send_register")
    .select("*")
    .eq("organization_id", organizationId)
    .order("year_group", { ascending: true })
    .order("last_name", { ascending: true });

  if (status) query = query.eq("sen_status", status);
  if (primaryNeed) query = query.eq("primary_need", primaryNeed);
  if (yearGroup) query = query.eq("year_group", parseInt(yearGroup));

  const { data, error } = await query;

  if (error) {
    console.error("[SEND Register GET]", error);
  }

  // Return demo data if no real data
  if (!data || data.length === 0) {
    // Try MIS data service first
    try {
      const { getMISDataServiceForOrg } =
        await import("@/lib/mis/data-service");
      const misService = await getMISDataServiceForOrg(organizationId);
      const misResult = (await misService.read(
        organizationId,
        "sen_register",
      )) as any;
      if (misResult.data.length > 0) {
        let mapped = misResult.data.map((r: any) => ({
          id: r.student_id,
          pupil_code: r.student_id,
          first_name: r.first_name,
          last_name: r.last_name,
          year_group: r.year_group,
          sen_status: r.sen_status,
          primary_need: r.sen_primary_need,
          secondary_need: r.sen_secondary_need || null,
          date_identified: r.date_identified,
          ehcp_status: r.ehcp ? "finalised" : null,
          class_name: r.registration_group,
          key_worker: r.key_worker || null,
          notes: r.provision_description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        if (status) mapped = mapped.filter((r: any) => r.sen_status === status);
        if (primaryNeed)
          mapped = mapped.filter((r: any) => r.primary_need === primaryNeed);
        if (yearGroup)
          mapped = mapped.filter(
            (r: any) => r.year_group === parseInt(yearGroup),
          );
        return apiSuccess({ data: mapped, source: "mis", demo: false });
      }
    } catch (e) {
      console.error("[SEND Register] MIS fallback error:", e);
    }

    // Last resort: demo data
    let filtered = [...DEMO_REGISTER];
    if (status) filtered = filtered.filter((r) => r.sen_status === status);
    if (primaryNeed)
      filtered = filtered.filter((r) => r.primary_need === primaryNeed);
    if (yearGroup)
      filtered = filtered.filter((r) => r.year_group === parseInt(yearGroup));
    return apiSuccess({ data: filtered, demo: true });
  }

  return apiSuccess({ data, demo: false });
});

/**
 * POST /api/send/register
 * Add a pupil to the SEN register
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    pupil_code,
    first_name,
    last_name,
    year_group,
    sen_status,
    primary_need,
    secondary_need,
    date_identified,
    ehcp_status,
    class_name,
    key_worker,
    notes,
  } = body;

  if (!pupil_code || !sen_status || !primary_need) {
    return apiError(
      "pupil_code, sen_status, and primary_need are required",
      400,
    );
  }

  const { data, error } = await supabase
    .from("send_register")
    .insert({
      organization_id: organizationId,
      pupil_code,
      first_name: first_name || null,
      last_name: last_name || null,
      year_group: year_group || null,
      sen_status,
      primary_need,
      secondary_need: secondary_need || null,
      date_identified:
        date_identified || new Date().toISOString().split("T")[0],
      ehcp_status: ehcp_status || null,
      class_name: class_name || null,
      key_worker: key_worker || null,
      notes: notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[SEND Register POST]", error);
    return apiError("Failed to add pupil to register", 500);
  }

  return apiSuccess(data, 201);
});
