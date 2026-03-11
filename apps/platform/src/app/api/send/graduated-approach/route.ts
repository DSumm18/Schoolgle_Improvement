import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo graduated approach cycles
const DEMO_CYCLES = [
  {
    id: "demo-ga-1",
    pupil_id: "demo-1",
    cycle_number: 1,
    term: "Autumn 2025",
    current_stage: "review",
    assess_date: "2025-09-20",
    assess_notes:
      "Below age-related expectations in phonics. Phase 3 not secure.",
    plan_date: "2025-10-01",
    plan_notes:
      "Daily 1:1 phonics intervention (15 mins). Target: secure Phase 3 by end of term.",
    plan_targets: "Secure Phase 3 phonics by December 2025",
    do_date: "2025-10-01",
    do_notes:
      "Intervention started 1st Oct. Pupil engaged well. Attendance 95%.",
    review_date: "2025-12-15",
    review_notes:
      "Phase 3 now secure. Some Phase 4 emerging. Move to group intervention.",
    review_outcome: "targets_met",
    created_at: "2025-09-20T00:00:00Z",
  },
  {
    id: "demo-ga-2",
    pupil_id: "demo-1",
    cycle_number: 2,
    term: "Spring 2026",
    current_stage: "plan",
    assess_date: "2026-01-10",
    assess_notes:
      "Phase 4 partially secure. Blending improving but segmenting still weak.",
    plan_date: "2026-01-15",
    plan_notes:
      "Small group phonics intervention 3x weekly. Focus on segmenting for writing.",
    plan_targets: "Secure Phase 4 phonics. Apply in independent writing.",
    do_date: null,
    do_notes: null,
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "demo-ga-3",
    pupil_id: "demo-5",
    cycle_number: 1,
    term: "Spring 2025",
    current_stage: "review",
    assess_date: "2025-01-15",
    assess_notes:
      "Working 2 years below in maths. Number bonds to 10 not secure.",
    plan_date: "2025-01-20",
    plan_notes:
      "Numicon intervention 4x weekly. Concrete-pictorial-abstract approach.",
    plan_targets: "Secure number bonds to 10. Begin number bonds to 20.",
    do_date: "2025-01-22",
    do_notes: "Good engagement. Using Numicon at home too. Parent supportive.",
    review_date: "2025-03-28",
    review_notes:
      "Number bonds to 10 now secure. Beginning to 20. Good progress.",
    review_outcome: "targets_met",
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "demo-ga-4",
    pupil_id: "demo-5",
    cycle_number: 2,
    term: "Summer 2025",
    current_stage: "review",
    assess_date: "2025-04-20",
    assess_notes:
      "Number bonds to 20 still developing. Place value understanding weak.",
    plan_date: "2025-04-25",
    plan_notes: "Continue Numicon. Add place value intervention using Dienes.",
    plan_targets: "Secure number bonds to 20. Understand tens and ones to 100.",
    do_date: "2025-04-28",
    do_notes: "Intervention running well. Some absence impacting continuity.",
    review_date: "2025-07-15",
    review_notes:
      "Number bonds to 20 mostly secure. Place value improved but still below ARE.",
    review_outcome: "partial_progress",
    created_at: "2025-04-20T00:00:00Z",
  },
  {
    id: "demo-ga-5",
    pupil_id: "demo-5",
    cycle_number: 3,
    term: "Autumn 2025",
    current_stage: "do",
    assess_date: "2025-09-12",
    assess_notes:
      "Regression over summer. Number bonds to 20 needs reinforcing. Multiplication not started.",
    plan_date: "2025-09-18",
    plan_notes:
      "Daily maths intervention. Consolidate number bonds. Begin times tables with visual aids.",
    plan_targets:
      "Fluent recall of number bonds to 20. Learn 2, 5, 10 times tables.",
    do_date: "2025-09-20",
    do_notes:
      "Intervention in progress. Number bonds recovering quickly. Times tables using songs/videos.",
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2025-09-12T00:00:00Z",
  },
  {
    id: "demo-ga-6",
    pupil_id: "demo-6",
    cycle_number: 1,
    term: "Autumn 2025",
    current_stage: "do",
    assess_date: "2025-10-01",
    assess_notes:
      "Frequent emotional outbursts. Difficulty with transitions. Struggling with peer relationships.",
    plan_date: "2025-10-05",
    plan_notes:
      "Nurture group 3 mornings. ELSA sessions weekly. Visual timetable. Now/next board.",
    plan_targets:
      "Reduce emotional outbursts to <3 per week. Successful transitions with visual support.",
    do_date: "2025-10-08",
    do_notes:
      "Nurture group started. Good initial engagement. Visual timetable helping.",
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "demo-ga-7",
    pupil_id: "demo-8",
    cycle_number: 1,
    term: "Spring 2025",
    current_stage: "review",
    assess_date: "2025-01-10",
    assess_notes:
      "Rigid thinking patterns. Sensory needs impacting learning. Social communication difficulties.",
    plan_date: "2025-01-15",
    plan_notes:
      "Social skills group weekly. Sensory breaks built into timetable. Visual support for all tasks.",
    plan_targets:
      "Engage in structured social interaction. Use sensory regulation strategies independently.",
    do_date: "2025-01-20",
    do_notes:
      "Good response to visual supports. Sensory breaks reducing anxiety.",
    review_date: "2025-03-28",
    review_notes:
      "Some improvement in social skills group but EHCP level support likely needed.",
    review_outcome: "partial_progress",
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "demo-ga-8",
    pupil_id: "demo-8",
    cycle_number: 2,
    term: "Autumn 2025",
    current_stage: "assess",
    assess_date: "2025-11-20",
    assess_notes:
      "Despite SEN K support, needs remain significant. EHCP assessment requested to secure additional funding.",
    plan_date: null,
    plan_notes: null,
    plan_targets: null,
    do_date: null,
    do_notes: null,
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2025-11-20T00:00:00Z",
  },
  {
    id: "demo-ga-9",
    pupil_id: "demo-9",
    cycle_number: 1,
    term: "Autumn 2025",
    current_stage: "do",
    assess_date: "2025-09-10",
    assess_notes:
      "Dyslexia screening positive. Reading age 2 years below. Writing illegible at speed.",
    plan_date: "2025-09-15",
    plan_notes:
      "Toe by Toe programme daily. Coloured overlays. Extra time in assessments. Laptop for extended writing.",
    plan_targets:
      "Improve reading age by 6 months. Legible writing or proficient laptop use.",
    do_date: "2025-09-18",
    do_notes:
      "Toe by Toe started. Pupil prefers laptop. Reading showing early improvement.",
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2025-09-10T00:00:00Z",
  },
  {
    id: "demo-ga-10",
    pupil_id: "demo-12",
    cycle_number: 1,
    term: "Autumn 2025",
    current_stage: "do",
    assess_date: "2025-09-10",
    assess_notes:
      "Low self-esteem. Withdrawal from peers. Reluctance to attempt tasks.",
    plan_date: "2025-09-15",
    plan_notes:
      "ELSA sessions weekly. Growth mindset classroom approach. Buddy system.",
    plan_targets:
      "Increased confidence attempting tasks. At least one friendship maintained.",
    do_date: "2025-09-20",
    do_notes:
      "ELSA going well. Pupil opening up about worries. Buddy system positive.",
    review_date: null,
    review_notes: null,
    review_outcome: null,
    created_at: "2025-09-10T00:00:00Z",
  },
  {
    id: "demo-ga-11",
    pupil_id: "demo-13",
    cycle_number: 1,
    term: "Autumn 2025",
    current_stage: "review",
    assess_date: "2025-09-05",
    assess_notes:
      "Working significantly below in reading and maths. Slow processing speed.",
    plan_date: "2025-09-10",
    plan_notes:
      "Pre-teaching vocabulary. Scaffolded tasks. Small group catch-up sessions.",
    plan_targets:
      "Close gap by 3 months in reading. Secure basic number facts.",
    do_date: "2025-09-12",
    do_notes:
      "Pre-teaching helping with confidence. Still needs significant scaffolding.",
    review_date: "2025-12-18",
    review_notes:
      "Reading age improved by 4 months. Maths progress slower. Continue current approach.",
    review_outcome: "partial_progress",
    created_at: "2025-09-05T00:00:00Z",
  },
];

/**
 * GET /api/send/graduated-approach
 * List graduated approach cycles. Filter by pupil_id, current_stage
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const pupilId = url.searchParams.get("pupil_id");
  const stage = url.searchParams.get("stage");

  let query = supabase
    .from("send_graduated_approach")
    .select(
      "*, send_register(pupil_code, first_name, last_name, year_group, primary_need)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (pupilId) query = query.eq("pupil_id", pupilId);
  if (stage) query = query.eq("current_stage", stage);

  const { data, error } = await query;

  if (error) {
    console.error("[SEND Graduated Approach GET]", error);
  }

  if (!data || data.length === 0) {
    let filtered = [...DEMO_CYCLES];
    if (pupilId) filtered = filtered.filter((c) => c.pupil_id === pupilId);
    if (stage) filtered = filtered.filter((c) => c.current_stage === stage);
    return apiSuccess({ data: filtered, demo: true });
  }

  return apiSuccess({ data, demo: false });
});

/**
 * POST /api/send/graduated-approach
 * Create a new graduated approach cycle
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { pupil_id, cycle_number, term, assess_notes, plan_targets } = body;

  if (!pupil_id || !term) {
    return apiError("pupil_id and term are required", 400);
  }

  // Auto-calculate cycle number if not provided
  let cycleNum = cycle_number;
  if (!cycleNum) {
    const { data: existing } = await supabase
      .from("send_graduated_approach")
      .select("cycle_number")
      .eq("pupil_id", pupil_id)
      .eq("organization_id", organizationId)
      .order("cycle_number", { ascending: false })
      .limit(1);

    cycleNum =
      existing && existing.length > 0 ? existing[0].cycle_number + 1 : 1;
  }

  const { data, error } = await supabase
    .from("send_graduated_approach")
    .insert({
      organization_id: organizationId,
      pupil_id,
      cycle_number: cycleNum,
      term,
      current_stage: "assess",
      assess_date: new Date().toISOString().split("T")[0],
      assess_notes: assess_notes || null,
      plan_targets: plan_targets || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[SEND Graduated Approach POST]", error);
    return apiError("Failed to create cycle", 500);
  }

  return apiSuccess(data, 201);
});
