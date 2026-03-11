import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo provisions
const DEMO_PROVISIONS = [
  {
    id: "demo-prov-1",
    pupil_id: "demo-1",
    provision_name: "1:1 Phonics (Toe by Toe)",
    provision_type: "intervention",
    area: "literacy",
    frequency: "Daily",
    duration_minutes: 15,
    sessions_per_week: 5,
    delivered_by: "Mrs Green (TA)",
    start_date: "2025-09-20",
    end_date: "2025-12-15",
    cost_per_week: 62.5,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Phase 3 now secure. Good progress.",
    created_at: "2025-09-20T00:00:00Z",
  },
  {
    id: "demo-prov-2",
    pupil_id: "demo-2",
    provision_name: "1:1 TA Support",
    provision_type: "adult_support",
    area: "general",
    frequency: "Daily",
    duration_minutes: 300,
    sessions_per_week: 5,
    delivered_by: "Mrs Khan (1:1 TA)",
    start_date: "2023-06-01",
    end_date: null,
    cost_per_week: 450.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Essential for curriculum access. EHCP funded.",
    created_at: "2023-06-01T00:00:00Z",
  },
  {
    id: "demo-prov-3",
    pupil_id: "demo-2",
    provision_name: "Social Skills Group",
    provision_type: "intervention",
    area: "social_communication",
    frequency: "Weekly",
    duration_minutes: 45,
    sessions_per_week: 1,
    delivered_by: "SENCO",
    start_date: "2025-09-10",
    end_date: null,
    cost_per_week: 25.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Improving peer interaction skills.",
    created_at: "2025-09-10T00:00:00Z",
  },
  {
    id: "demo-prov-4",
    pupil_id: "demo-3",
    provision_name: "SALT Programme (school-delivered)",
    provision_type: "therapy_programme",
    area: "speech_language",
    frequency: "3x weekly",
    duration_minutes: 20,
    sessions_per_week: 3,
    delivered_by: "Mrs Green (TA)",
    start_date: "2025-10-15",
    end_date: null,
    cost_per_week: 50.0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Following SALT recommendations. Vocabulary expanding.",
    created_at: "2025-10-15T00:00:00Z",
  },
  {
    id: "demo-prov-5",
    pupil_id: "demo-4",
    provision_name: "ELSA Sessions",
    provision_type: "intervention",
    area: "semh",
    frequency: "Weekly",
    duration_minutes: 45,
    sessions_per_week: 1,
    delivered_by: "Miss Roberts (ELSA)",
    start_date: "2025-09-10",
    end_date: null,
    cost_per_week: 25.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Emotional regulation improving. Using strategies learned.",
    created_at: "2025-09-10T00:00:00Z",
  },
  {
    id: "demo-prov-6",
    pupil_id: "demo-4",
    provision_name: "Transition Programme",
    provision_type: "intervention",
    area: "semh",
    frequency: "Fortnightly",
    duration_minutes: 60,
    sessions_per_week: 0.5,
    delivered_by: "SENCO + Secondary SENCO",
    start_date: "2026-01-10",
    end_date: "2026-07-20",
    cost_per_week: 15.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Secondary visits planned. Anxiety reducing.",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "demo-prov-7",
    pupil_id: "demo-5",
    provision_name: "Numicon Maths Intervention",
    provision_type: "intervention",
    area: "numeracy",
    frequency: "4x weekly",
    duration_minutes: 20,
    sessions_per_week: 4,
    delivered_by: "Mrs Green (TA)",
    start_date: "2025-01-22",
    end_date: null,
    cost_per_week: 66.0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Number bonds improving. Still below ARE.",
    created_at: "2025-01-22T00:00:00Z",
  },
  {
    id: "demo-prov-8",
    pupil_id: "demo-6",
    provision_name: "Nurture Group",
    provision_type: "intervention",
    area: "semh",
    frequency: "3 mornings/week",
    duration_minutes: 150,
    sessions_per_week: 3,
    delivered_by: "Mrs Taylor (Nurture Lead)",
    start_date: "2025-10-08",
    end_date: null,
    cost_per_week: 187.5,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Settling in well. Fewer emotional outbursts.",
    created_at: "2025-10-08T00:00:00Z",
  },
  {
    id: "demo-prov-9",
    pupil_id: "demo-6",
    provision_name: "ELSA Sessions",
    provision_type: "intervention",
    area: "semh",
    frequency: "Weekly",
    duration_minutes: 45,
    sessions_per_week: 1,
    delivered_by: "Miss Roberts (ELSA)",
    start_date: "2025-10-08",
    end_date: null,
    cost_per_week: 25.0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Building emotional vocabulary.",
    created_at: "2025-10-08T00:00:00Z",
  },
  {
    id: "demo-prov-10",
    pupil_id: "demo-7",
    provision_name: "1:1 TA Support",
    provision_type: "adult_support",
    area: "general",
    frequency: "Daily (15hrs)",
    duration_minutes: 180,
    sessions_per_week: 5,
    delivered_by: "Mr Ahmed (1:1 TA)",
    start_date: "2021-09-01",
    end_date: null,
    cost_per_week: 337.5,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Essential for mobility and curriculum access.",
    created_at: "2021-09-01T00:00:00Z",
  },
  {
    id: "demo-prov-11",
    pupil_id: "demo-7",
    provision_name: "OT Programme (school-delivered)",
    provision_type: "therapy_programme",
    area: "physical",
    frequency: "Daily",
    duration_minutes: 15,
    sessions_per_week: 5,
    delivered_by: "Mr Ahmed (1:1 TA)",
    start_date: "2025-09-01",
    end_date: null,
    cost_per_week: 0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "OT exercises integrated into daily routine.",
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-prov-12",
    pupil_id: "demo-8",
    provision_name: "Social Skills Group",
    provision_type: "intervention",
    area: "social_communication",
    frequency: "Weekly",
    duration_minutes: 45,
    sessions_per_week: 1,
    delivered_by: "SENCO",
    start_date: "2025-01-20",
    end_date: null,
    cost_per_week: 25.0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Some progress. EHCP assessment requested.",
    created_at: "2025-01-20T00:00:00Z",
  },
  {
    id: "demo-prov-13",
    pupil_id: "demo-8",
    provision_name: "Sensory Breaks",
    provision_type: "environmental",
    area: "sensory",
    frequency: "Daily",
    duration_minutes: 30,
    sessions_per_week: 5,
    delivered_by: "Class teacher + TA",
    start_date: "2025-01-20",
    end_date: null,
    cost_per_week: 0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Sensory diet reducing anxiety levels.",
    created_at: "2025-01-20T00:00:00Z",
  },
  {
    id: "demo-prov-14",
    pupil_id: "demo-9",
    provision_name: "Toe by Toe Reading Programme",
    provision_type: "intervention",
    area: "literacy",
    frequency: "Daily",
    duration_minutes: 15,
    sessions_per_week: 5,
    delivered_by: "Mrs Green (TA)",
    start_date: "2025-09-18",
    end_date: null,
    cost_per_week: 62.5,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Reading age improving. Decoding stronger.",
    created_at: "2025-09-18T00:00:00Z",
  },
  {
    id: "demo-prov-15",
    pupil_id: "demo-9",
    provision_name: "Laptop Access + Extra Time",
    provision_type: "environmental",
    area: "literacy",
    frequency: "All lessons",
    duration_minutes: 0,
    sessions_per_week: 5,
    delivered_by: "Class teacher",
    start_date: "2025-09-15",
    end_date: null,
    cost_per_week: 0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Writing output increased significantly with laptop.",
    created_at: "2025-09-15T00:00:00Z",
  },
  {
    id: "demo-prov-16",
    pupil_id: "demo-11",
    provision_name: "FM System + ToD Support",
    provision_type: "specialist_equipment",
    area: "hearing",
    frequency: "Daily + fortnightly",
    duration_minutes: 330,
    sessions_per_week: 5,
    delivered_by: "Class teacher + ToD",
    start_date: "2020-09-01",
    end_date: null,
    cost_per_week: 75.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "FM system essential. ToD monitoring audiological needs.",
    created_at: "2020-09-01T00:00:00Z",
  },
  {
    id: "demo-prov-17",
    pupil_id: "demo-12",
    provision_name: "ELSA Sessions",
    provision_type: "intervention",
    area: "semh",
    frequency: "Weekly",
    duration_minutes: 45,
    sessions_per_week: 1,
    delivered_by: "Miss Roberts (ELSA)",
    start_date: "2025-09-20",
    end_date: null,
    cost_per_week: 25.0,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Confidence building. Starting to take risks in learning.",
    created_at: "2025-09-20T00:00:00Z",
  },
  {
    id: "demo-prov-18",
    pupil_id: "demo-13",
    provision_name: "Pre-teaching (Vocab + Concepts)",
    provision_type: "intervention",
    area: "literacy",
    frequency: "Daily",
    duration_minutes: 15,
    sessions_per_week: 5,
    delivered_by: "Class TA",
    start_date: "2025-09-12",
    end_date: null,
    cost_per_week: 62.5,
    funding_source: "school_budget",
    is_active: true,
    impact_notes: "Confidence in lessons improved. Reading age up 4 months.",
    created_at: "2025-09-12T00:00:00Z",
  },
  {
    id: "demo-prov-19",
    pupil_id: "demo-14",
    provision_name: "Full-time 1:1 TA Support",
    provision_type: "adult_support",
    area: "general",
    frequency: "Full-time",
    duration_minutes: 390,
    sessions_per_week: 5,
    delivered_by: "Mrs Patel (1:1 TA)",
    start_date: "2019-09-01",
    end_date: null,
    cost_per_week: 585.0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Essential for all curriculum access and personal care.",
    created_at: "2019-09-01T00:00:00Z",
  },
  {
    id: "demo-prov-20",
    pupil_id: "demo-14",
    provision_name: "Specialist Curriculum Programme",
    provision_type: "curriculum_modification",
    area: "general",
    frequency: "Daily",
    duration_minutes: 390,
    sessions_per_week: 5,
    delivered_by: "SENCO + Mrs Patel",
    start_date: "2019-09-01",
    end_date: null,
    cost_per_week: 0,
    funding_source: "ehcp_funding",
    is_active: true,
    impact_notes: "Individualised curriculum with sensory learning approaches.",
    created_at: "2019-09-01T00:00:00Z",
  },
];

/**
 * GET /api/send/provision-map
 * List provisions. Filter by pupil_id, type, active status
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const pupilId = url.searchParams.get("pupil_id");
  const type = url.searchParams.get("type");
  const active = url.searchParams.get("active");

  let query = supabase
    .from("send_provision_map")
    .select(
      "*, send_register(pupil_code, first_name, last_name, year_group, primary_need, sen_status)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (pupilId) query = query.eq("pupil_id", pupilId);
  if (type) query = query.eq("provision_type", type);
  if (active === "true") query = query.eq("is_active", true);
  if (active === "false") query = query.eq("is_active", false);

  const { data, error } = await query;

  if (error) {
    console.error("[SEND Provision Map GET]", error);
  }

  if (!data || data.length === 0) {
    let filtered = [...DEMO_PROVISIONS];
    if (pupilId) filtered = filtered.filter((p) => p.pupil_id === pupilId);
    if (type) filtered = filtered.filter((p) => p.provision_type === type);
    if (active === "true") filtered = filtered.filter((p) => p.is_active);
    if (active === "false") filtered = filtered.filter((p) => !p.is_active);
    return apiSuccess({ data: filtered, demo: true });
  }

  return apiSuccess({ data, demo: false });
});

/**
 * POST /api/send/provision-map
 * Create a new provision
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    pupil_id,
    provision_name,
    provision_type,
    area,
    frequency,
    duration_minutes,
    sessions_per_week,
    delivered_by,
    start_date,
    end_date,
    cost_per_week,
    funding_source,
    impact_notes,
  } = body;

  if (!pupil_id || !provision_name || !provision_type) {
    return apiError(
      "pupil_id, provision_name, and provision_type are required",
      400,
    );
  }

  const { data, error } = await supabase
    .from("send_provision_map")
    .insert({
      organization_id: organizationId,
      pupil_id,
      provision_name,
      provision_type,
      area: area || null,
      frequency: frequency || null,
      duration_minutes: duration_minutes || null,
      sessions_per_week: sessions_per_week || null,
      delivered_by: delivered_by || null,
      start_date: start_date || new Date().toISOString().split("T")[0],
      end_date: end_date || null,
      cost_per_week: cost_per_week || 0,
      funding_source: funding_source || "school_budget",
      is_active: true,
      impact_notes: impact_notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[SEND Provision Map POST]", error);
    return apiError("Failed to create provision", 500);
  }

  return apiSuccess(data, 201);
});
