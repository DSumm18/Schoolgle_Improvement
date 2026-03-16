import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo interventions for demo strategy
const DEMO_INTERVENTIONS = [
  {
    id: "demo-int-1",
    strategy_id: "demo-strategy-2025",
    name: "Metacognition & Self-Regulation CPD",
    description:
      "Whole-school CPD programme on metacognitive strategies. All teachers trained in explicit strategy instruction using EEF guidance report.",
    strand: "teaching",
    budgeted_cost: 8500,
    actual_cost: 7200,
    staff_lead: "Mrs K. Patel (Deputy Head)",
    target_pupils: "All PP pupils (42)",
    year_groups: "R-6",
    eef_strategy_id: "metacognition",
    eef_strategy_name: "Metacognition and Self-Regulation",
    eef_months_progress: 7,
    eef_evidence_strength: 5,
    impact_status: "above_expected",
    impact_notes:
      "Teacher confidence in metacognitive strategies increased from 45% to 89%. PP pupils showing +0.3 progress in reading vs non-PP.",
    start_date: "2025-09-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-int-2",
    strategy_id: "demo-strategy-2025",
    name: "Structured Feedback Programme",
    description:
      "Implementation of whole-class feedback model with individual follow-up. Pupils given dedicated improvement time weekly.",
    strand: "teaching",
    budgeted_cost: 3000,
    actual_cost: 2800,
    staff_lead: "Mr D. Chen (English Lead)",
    target_pupils: "All PP pupils",
    year_groups: "3-6",
    eef_strategy_id: "feedback",
    eef_strategy_name: "Feedback",
    eef_months_progress: 6,
    eef_evidence_strength: 5,
    impact_status: "expected",
    impact_notes:
      "Pupil survey shows 78% find feedback helpful (up from 52%). Writing progress for PP pupils improved by 2 points average.",
    start_date: "2025-09-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-int-3",
    strategy_id: "demo-strategy-2025",
    name: "Phonics Catch-Up (Y2-3)",
    description:
      "Daily 20-minute phonics intervention for PP pupils who did not pass the phonics screening check, delivered by trained TA using Little Wandle rapid catch-up.",
    strand: "teaching",
    budgeted_cost: 5500,
    actual_cost: 5500,
    staff_lead: "Mrs L. Green (Phonics Lead)",
    target_pupils: "8 PP pupils",
    year_groups: "2-3",
    eef_strategy_id: "phonics",
    eef_strategy_name: "Phonics",
    eef_months_progress: 5,
    eef_evidence_strength: 5,
    impact_status: "significant",
    impact_notes:
      "6 of 8 pupils now at expected standard. 2 making accelerated progress. Gap narrowed from 28% to 12%.",
    start_date: "2025-09-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-int-4",
    strategy_id: "demo-strategy-2025",
    name: "Small Group Maths Tuition",
    description:
      "3x weekly small group tuition (groups of 3-4) for PP pupils below expected standard in maths, delivered by qualified teacher.",
    strand: "targeted",
    budgeted_cost: 12000,
    actual_cost: 10500,
    staff_lead: "Miss R. Ahmed (Maths Lead)",
    target_pupils: "12 PP pupils",
    year_groups: "4-6",
    eef_strategy_id: "small-group-tuition",
    eef_strategy_name: "Small Group Tuition",
    eef_months_progress: 4,
    eef_evidence_strength: 4,
    impact_status: "expected",
    impact_notes:
      "9 of 12 pupils making expected or better progress. Average progress score improved from -1.2 to +0.4.",
    start_date: "2025-10-01",
    end_date: "2026-05-30",
    active: true,
    created_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "demo-int-5",
    strategy_id: "demo-strategy-2025",
    name: "1:1 Reading Tuition (Y1-2)",
    description:
      "Daily 15-minute 1:1 reading sessions with trained TA for lowest 20% PP readers in KS1.",
    strand: "targeted",
    budgeted_cost: 8000,
    actual_cost: 7800,
    staff_lead: "Mrs S. Williams (KS1 Lead)",
    target_pupils: "6 PP pupils",
    year_groups: "1-2",
    eef_strategy_id: "one-to-one-tuition",
    eef_strategy_name: "One to One Tuition",
    eef_months_progress: 5,
    eef_evidence_strength: 4,
    impact_status: "above_expected",
    impact_notes:
      "All 6 pupils made accelerated progress. 4 now reading at age-related expectations. Average reading age increased by 14 months in 6 months.",
    start_date: "2025-09-15",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-15T00:00:00Z",
  },
  {
    id: "demo-int-6",
    strategy_id: "demo-strategy-2025",
    name: "Oral Language Intervention (EYFS/KS1)",
    description:
      "Structured oral language programme targeting PP pupils with limited vocabulary on entry. NELI programme in Reception, talk boost in Y1.",
    strand: "targeted",
    budgeted_cost: 4500,
    actual_cost: 4200,
    staff_lead: "Mrs J. Harper (EYFS Lead)",
    target_pupils: "10 PP pupils",
    year_groups: "R-1",
    eef_strategy_id: "oral-language",
    eef_strategy_name: "Oral Language Interventions",
    eef_months_progress: 6,
    eef_evidence_strength: 5,
    impact_status: "not_yet_measured",
    impact_notes:
      "Mid-year assessment due March 2026. Initial observations positive.",
    start_date: "2025-10-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "demo-int-7",
    strategy_id: "demo-strategy-2025",
    name: "Attendance & Family Engagement",
    description:
      "Dedicated attendance officer monitoring PP attendance weekly. Family liaison worker supporting hard-to-reach families. Breakfast club free for PP.",
    strand: "wider",
    budgeted_cost: 9500,
    actual_cost: 9000,
    staff_lead: "Mr T. Blake (Attendance Lead)",
    target_pupils: "All PP pupils",
    year_groups: "R-6",
    eef_strategy_id: "parental-engagement",
    eef_strategy_name: "Parental Engagement",
    eef_months_progress: 4,
    eef_evidence_strength: 4,
    impact_status: "below_expected",
    impact_notes:
      "PP attendance improved from 91.2% to 93.1% but still below 95% target. Persistent absence reduced from 18% to 14% for PP. Breakfast club uptake strong (85%).",
    start_date: "2025-09-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-int-8",
    strategy_id: "demo-strategy-2025",
    name: "Enrichment & Cultural Capital",
    description:
      "Subsidised trips, music tuition, and after-school clubs for PP pupils. Ensure all PP pupils access at least 3 enrichment activities per term.",
    strand: "wider",
    budgeted_cost: 5700,
    actual_cost: 4200,
    staff_lead: "Miss H. Okonkwo (PP Champion)",
    target_pupils: "All PP pupils",
    year_groups: "R-6",
    eef_strategy_id: "arts-participation",
    eef_strategy_name: "Arts Participation",
    eef_months_progress: 3,
    eef_evidence_strength: 3,
    impact_status: "expected",
    impact_notes:
      "95% of PP pupils participated in at least 2 enrichment activities this term. Music tuition uptake: 12 PP pupils (up from 3). Residential trip: 100% PP attendance.",
    start_date: "2025-09-01",
    end_date: "2026-07-18",
    active: true,
    created_at: "2025-09-01T00:00:00Z",
  },
];

const DEMO_STRATEGY_WITH_INTERVENTIONS = {
  id: "demo-strategy-2025",
  organization_id: "demo",
  academic_year: "2025-26",
  status: "published",
  total_pupils: 210,
  pp_eligible: 42,
  pp_funding: 56700,
  service_children: 3,
  lac_children: 2,
  post_lac_children: 1,
  fsm_ever6: 38,
  statement_summary:
    "Our pupil premium strategy focuses on high-quality teaching as the most effective lever for closing the disadvantage gap. We use the EEF tiered approach to allocate funding across teaching, targeted academic support, and wider strategies.",
  barriers_to_learning:
    "Lower literacy levels on entry; limited vocabulary; less access to enrichment activities; higher rates of absence; social and emotional challenges.",
  desired_outcomes:
    "Close the reading gap by 10%; improve maths attainment for PP pupils to be in line with national non-PP; reduce PP absence to below 5%; all PP pupils access enrichment.",
  strategy_aims_teaching:
    "Improve quality of teaching for all through investment in CPD, metacognition strategies, and structured feedback approaches aligned to EEF guidance.",
  strategy_aims_targeted:
    "Provide targeted small group and 1:1 tuition in reading and maths; deploy trained TAs to deliver evidence-based interventions.",
  strategy_aims_wider:
    "Improve attendance through family engagement; provide access to enrichment and cultural capital experiences; support social and emotional wellbeing.",
  review_date: "2026-07-18",
  year_1_status: "in_progress",
  year_2_status: "planned",
  year_3_status: "planned",
  publish_date: "2025-09-01",
  headteacher_name: "Mrs A. Thompson",
  governor_name: "Mr J. Roberts",
  created_at: "2025-09-01T00:00:00Z",
  updated_at: "2026-01-15T00:00:00Z",
  interventions: DEMO_INTERVENTIONS,
};

/**
 * GET /api/pupil-premium/strategies/[id]
 * Get a single strategy with its interventions
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("strategies") + 1];

  if (!id) {
    return apiError("Strategy ID is required", 400);
  }

  // Demo mode
  if (id === "demo-strategy-2025" || id === "demo") {
    return apiSuccess({
      strategy: DEMO_STRATEGY_WITH_INTERVENTIONS,
      demo: true,
    });
  }

  const { data: strategy, error } = await supabase
    .from("pupil_premium_strategies")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !strategy) {
    return apiSuccess({
      strategy: DEMO_STRATEGY_WITH_INTERVENTIONS,
      demo: true,
    });
  }

  // Fetch interventions for this strategy
  const { data: interventions } = await supabase
    .from("pupil_premium_interventions")
    .select("*")
    .eq("strategy_id", id)
    .order("strand", { ascending: true })
    .order("created_at", { ascending: true });

  return apiSuccess({
    strategy: { ...strategy, interventions: interventions || [] },
    demo: false,
  });
});

/**
 * PUT /api/pupil-premium/strategies/[id]
 * Update a strategy
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("strategies") + 1];
  const body = await request.json();

  if (!id) {
    return apiError("Strategy ID is required", 400);
  }

  // Remove fields that shouldn't be updated directly
  const {
    id: _id,
    organization_id: _org,
    created_at: _created,
    interventions: _interventions,
    ...updates
  } = body;

  const { data, error } = await supabase
    .from("pupil_premium_strategies")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[PP Strategy PUT] DB error:", error);
    return apiError("Failed to update strategy: " + error.message, 500);
  }

  return apiSuccess(data);
});
