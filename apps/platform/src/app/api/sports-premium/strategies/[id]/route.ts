/**
 * Sports Premium Strategy Detail API
 *
 * GET /api/sports-premium/strategies/[id] — Get strategy with spend items
 * PUT /api/sports-premium/strategies/[id] — Update strategy
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ────────────────────────────────────────────────────────

const DEMO_SPEND_ITEMS = [
  {
    id: "demo-spend-1",
    strategy_id: "demo-strategy-2025-26",
    indicator: 1,
    activity: "After-school multi-sports club (3 days/week)",
    description:
      "Partnership with Premier Education to deliver after-school clubs covering football, basketball, hockey, and athletics for Y1-Y6.",
    budgeted_cost: 4200,
    actual_cost: 3800,
    impact_notes:
      "Participation increased from 35% to 62% of pupils. Pupil voice surveys show 89% enjoyment rating. 14 previously inactive pupils now attending regularly.",
    sustainability:
      "Staff trained to deliver sessions independently from Year 2. Equipment purchased for long-term use.",
    evidence:
      "Attendance registers, pupil surveys, participation tracking spreadsheet",
    status: "in_progress",
  },
  {
    id: "demo-spend-2",
    strategy_id: "demo-strategy-2025-26",
    indicator: 1,
    activity: "Lunchtime active play equipment and training",
    description:
      "Purchase of playground equipment (trim trail additions, sports kits) and midday supervisor training in active play facilitation.",
    budgeted_cost: 1800,
    actual_cost: 1650,
    impact_notes:
      "Active minutes at lunchtime up 40%. Behaviour incidents during lunch reduced by 25%.",
    sustainability:
      "Equipment has 5-year warranty. Training manual created for new staff.",
    evidence: "Equipment inventory, behaviour logs, observation notes",
    status: "completed",
  },
  {
    id: "demo-spend-3",
    strategy_id: "demo-strategy-2025-26",
    indicator: 2,
    activity: "Whole-school Sports Day and inter-house competitions",
    description:
      "Enhanced sports day format with termly inter-house competitions, celebration assemblies, and sports achievement display boards.",
    budgeted_cost: 800,
    actual_cost: 750,
    impact_notes:
      "All pupils participated in at least 2 competitive events. Parent attendance at Sports Day up 30%. Sports captains programme established.",
    sustainability:
      "Inter-house system embedded in school culture. Sports captain roles in school council.",
    evidence: "Event photos, participation records, parent feedback forms",
    status: "completed",
  },
  {
    id: "demo-spend-4",
    strategy_id: "demo-strategy-2025-26",
    indicator: 2,
    activity: "PE display boards and achievement celebration",
    description:
      "Dedicated PE and sport display areas in corridors, weekly PE star awards in assembly, school sports social media updates.",
    budgeted_cost: 400,
    actual_cost: 350,
    impact_notes:
      "Pupil awareness of PE importance increased. 92% of pupils can name at least 3 benefits of physical activity.",
    sustainability:
      "Display templates created for annual refresh at minimal cost.",
    evidence: "Display photos, pupil survey results, assembly records",
    status: "completed",
  },
  {
    id: "demo-spend-5",
    strategy_id: "demo-strategy-2025-26",
    indicator: 3,
    activity: "PE CPD programme with specialist coaching",
    description:
      "External PE specialist working alongside class teachers for 2 days/week to model lessons and build confidence in delivering high-quality PE.",
    budgeted_cost: 5200,
    actual_cost: 4800,
    impact_notes:
      "Teacher confidence in delivering PE increased from 45% to 78%. Lesson observation grades improved. 6 staff completed Level 1 coaching awards.",
    sustainability:
      "Teachers now confident to deliver independently. PE scheme of work updated with video resources.",
    evidence:
      "Staff CPD logs, lesson observations, confidence survey (before/after), coaching certificates",
    status: "in_progress",
  },
  {
    id: "demo-spend-6",
    strategy_id: "demo-strategy-2025-26",
    indicator: 3,
    activity: "PE subject leader training and network meetings",
    description:
      "PE lead attending termly network meetings, AfPE membership, and Youth Sport Trust resources subscription.",
    budgeted_cost: 600,
    actual_cost: 580,
    impact_notes:
      "PE lead sharing best practice across school. New assessment framework implemented. Curriculum map updated.",
    sustainability:
      "Knowledge embedded in school PE policy and curriculum documentation.",
    evidence:
      "Training certificates, network meeting notes, updated curriculum plans",
    status: "in_progress",
  },
  {
    id: "demo-spend-7",
    strategy_id: "demo-strategy-2025-26",
    indicator: 4,
    activity: "Swimming top-up programme (Y5/Y6)",
    description:
      "Additional swimming lessons for Y5/Y6 pupils not yet meeting the 25m standard. Partnership with local leisure centre.",
    budgeted_cost: 1500,
    actual_cost: 1400,
    impact_notes:
      "12 additional pupils achieved 25m standard. Self-rescue competency improved for 18 pupils. Swimming data improved from 65% to 72%.",
    sustainability:
      "Partnership agreement in place for 3 years. Transport costs shared with neighbouring school.",
    evidence: "Swimming assessment records, instructor reports, transport logs",
    status: "in_progress",
  },
  {
    id: "demo-spend-8",
    strategy_id: "demo-strategy-2025-26",
    indicator: 4,
    activity: "Outdoor adventurous activities residentials",
    description:
      "Y4 and Y6 residential trips including rock climbing, canoeing, orienteering, and team-building activities.",
    budgeted_cost: 1200,
    actual_cost: 1100,
    impact_notes:
      "100% of Y4 and Y6 pupils attended. Pupil wellbeing scores increased. 8 pupils tried activities they had never experienced before.",
    sustainability:
      "Annual residential now part of school calendar. Pupil premium subsidies ensure all pupils can attend.",
    evidence:
      "Residential booking confirmations, pupil reflections, parent feedback",
    status: "planned",
  },
  {
    id: "demo-spend-9",
    strategy_id: "demo-strategy-2025-26",
    indicator: 5,
    activity: "School Games and local league participation",
    description:
      "Entry fees, transport, and staffing costs for participation in School Games, local football/netball leagues, and cross-country events.",
    budgeted_cost: 900,
    actual_cost: 720,
    impact_notes:
      "Teams entered in 8 competitions (up from 3 last year). 45% of KS2 pupils represented school in at least one event. Won district cross-country.",
    sustainability:
      "Competition calendar embedded. Parent volunteer transport rota established.",
    evidence:
      "Competition results, team sheets, transport records, certificates",
    status: "in_progress",
  },
  {
    id: "demo-spend-10",
    strategy_id: "demo-strategy-2025-26",
    indicator: 5,
    activity: "Intra-school competition programme",
    description:
      "Termly intra-school competitions ensuring every pupil competes. Includes inclusive adapted sports for SEND pupils.",
    budgeted_cost: 500,
    actual_cost: 420,
    impact_notes:
      "100% pupil participation in at least one intra-school competition. SEND pupils fully included with adapted activities. Pupil leadership through sports captains.",
    sustainability:
      "Competition formats documented. Student sports leaders trained to support delivery.",
    evidence:
      "Competition schedules, participation records, SEND inclusion evidence, sports leader training logs",
    status: "in_progress",
  },
];

function getContextParams(request: NextRequest) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("strategies") + 1;
  return { id: segments[idIndex] };
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { id } = getContextParams(request);

  // Demo mode
  if (id === "demo-strategy-2025-26" || id === "demo") {
    return apiSuccess({
      strategy: {
        id: "demo-strategy-2025-26",
        organization_id: organizationId,
        academic_year: "2025-26",
        total_funding: 17100,
        base_funding: 16000,
        per_pupil_funding: 10,
        pupil_count: 210,
        headteacher_name: "Mrs Sarah Johnson",
        pe_lead_name: "Mr James Williams",
        swimming_25m_percent: 72,
        swimming_strokes_percent: 68,
        swimming_self_rescue_percent: 85,
        publication_date: "2025-09-01",
        review_date: "2026-07-20",
        status: "active",
        sustainability_statement:
          "We ensure sustainability by embedding CPD into staff development plans, maintaining community partnerships, and investing in long-term equipment and facilities that will continue to benefit pupils beyond the funding period.",
        created_at: "2025-09-01T00:00:00Z",
        updated_at: "2025-09-01T00:00:00Z",
        _demo: true,
      },
      spend_items: DEMO_SPEND_ITEMS,
      _demo: true,
    });
  }

  const supabase = createServiceRoleClient();

  const { data: strategy, error: stratError } = await supabase
    .from("sports_premium_strategies")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (stratError || !strategy) {
    return apiError("Strategy not found", 404);
  }

  const { data: spendItems, error: spendError } = await supabase
    .from("sports_premium_spend")
    .select("*")
    .eq("strategy_id", id)
    .order("indicator", { ascending: true })
    .order("created_at", { ascending: true });

  if (spendError) {
    console.error("[Sports Premium] Spend items fetch error:", spendError);
  }

  return apiSuccess({
    strategy,
    spend_items: spendItems || [],
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { id } = getContextParams(request);
  const body = await request.json();

  if (id.startsWith("demo")) {
    return apiError("Cannot update demo strategy. Create your own first.", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("sports_premium_strategies")
    .select("id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!existing) {
    return apiError("Strategy not found", 404);
  }

  const updates: Record<string, any> = {};
  const allowedFields = [
    "total_funding",
    "base_funding",
    "per_pupil_funding",
    "pupil_count",
    "headteacher_name",
    "pe_lead_name",
    "swimming_25m_percent",
    "swimming_strokes_percent",
    "swimming_self_rescue_percent",
    "publication_date",
    "review_date",
    "status",
    "sustainability_statement",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("sports_premium_strategies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Sports Premium] Strategy update error:", error);
    return apiError("Failed to update strategy: " + error.message, 500);
  }

  return apiSuccess(data);
});
