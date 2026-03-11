/**
 * Behaviour Incidents API
 *
 * GET /api/behaviour/incidents - List incidents with filters
 * POST /api/behaviour/incidents - Create a new incident
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ──────────────────────────────────────────────────────

const DEMO_PUPILS = [
  "Oliver Thompson",
  "Amira Hassan",
  "Jake Williams",
  "Chloe Richards",
  "Ethan Patel",
  "Sophie Carter",
  "Liam O'Brien",
  "Fatima Ahmed",
  "Noah Jenkins",
  "Isabella Martinez",
  "Mason Clarke",
  "Ava Robinson",
  "Harry Wilson",
  "Mia Taylor",
  "Leo Brown",
  "Ella Davies",
  "Oscar White",
  "Grace Moore",
  "Charlie Hall",
  "Lily Turner",
];

const DEMO_STAFF = [
  "Mrs J. Hartley",
  "Mr A. Singh",
  "Miss L. Cooper",
  "Mr D. Thompson",
  "Mrs S. Williams",
  "Ms R. Chen",
  "Mr K. Okafor",
  "Mrs P. Davies",
];

const LOCATIONS = [
  "Classroom 1A",
  "Classroom 2B",
  "Playground",
  "Dining Hall",
  "Corridor - Main",
  "Sports Hall",
  "Science Lab",
  "Library",
  "Reception Area",
  "ICT Suite",
  "Art Room",
  "Music Room",
];

const LESSON_PERIODS = [
  "Registration",
  "Period 1",
  "Period 2",
  "Break",
  "Period 3",
  "Lunch",
  "Period 4",
  "Period 5",
  "After School",
];

function generateDemoIncidents() {
  const now = new Date();
  const incidents: any[] = [];

  // Generate 30 positive incidents over past 2 weeks
  const positiveCategories = [
    "achievement",
    "effort",
    "kindness",
    "leadership",
    "improvement",
    "community",
    "homework",
    "attendance",
    "other_positive",
  ];
  const positiveConsequences = [
    "reward_points",
    "certificate",
    "prize",
    "house_points",
  ];
  const positiveDescriptions = [
    "Outstanding contribution to class discussion",
    "Helped a younger pupil in the playground",
    "Completed all homework tasks to an excellent standard",
    "Showed great leadership during group work",
    "Significant improvement in maths assessment",
    "Organised a charity fundraiser for the community",
    "Perfect attendance this half term",
    "Demonstrated exceptional effort in PE",
    "Showed kindness to a new pupil joining the class",
    "Volunteered to tidy the classroom without being asked",
  ];

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      8 + Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 60),
    );

    incidents.push({
      id: `demo-pos-${i + 1}`,
      organization_id: "demo",
      pupil_name: DEMO_PUPILS[Math.floor(Math.random() * DEMO_PUPILS.length)],
      pupil_id: `pupil-${Math.floor(Math.random() * 20) + 1}`,
      year_group: Math.floor(Math.random() * 6) + 7,
      type: "positive",
      category:
        positiveCategories[
          Math.floor(Math.random() * positiveCategories.length)
        ],
      description:
        positiveDescriptions[
          Math.floor(Math.random() * positiveDescriptions.length)
        ],
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      lesson_period:
        LESSON_PERIODS[Math.floor(Math.random() * LESSON_PERIODS.length)],
      consequence:
        positiveConsequences[
          Math.floor(Math.random() * positiveConsequences.length)
        ],
      reported_by: DEMO_STAFF[Math.floor(Math.random() * DEMO_STAFF.length)],
      parent_notified: Math.random() > 0.7,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }

  // Generate 10 negative incidents over past 2 weeks
  const negativeCategories = [
    "disruption",
    "defiance",
    "verbal_abuse",
    "uniform",
    "mobile_phone",
    "truancy",
    "bullying",
    "physical_aggression",
    "damage",
    "other_negative",
  ];
  const negativeConsequences = [
    "verbal_warning",
    "written_warning",
    "loss_of_privilege",
    "detention_break",
    "detention_lunch",
    "detention_after_school",
    "community_service",
    "internal_exclusion",
    "restorative_justice",
    "parent_contact",
  ];
  const negativeDescriptions = [
    "Persistent talking during lesson despite repeated warnings",
    "Refused to follow teacher instructions",
    "Used inappropriate language towards another pupil",
    "Incorrect uniform - no tie, trainers instead of shoes",
    "Mobile phone confiscated during lesson - second offence this week",
    "Left lesson without permission",
    "Reported bullying behaviour towards Year 7 pupil",
    "Pushed another pupil in the corridor",
    "Damaged school property - graffiti on desk",
    "Disrupted the learning of others by throwing equipment",
  ];

  // Make some pupils repeat offenders
  const repeatOffenders = [
    "Jake Williams",
    "Ethan Patel",
    "Mason Clarke",
    "Charlie Hall",
    "Noah Jenkins",
  ];

  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      8 + Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 60),
    );

    const isRepeat = i < 5;
    const pupil = isRepeat
      ? repeatOffenders[i]
      : DEMO_PUPILS[Math.floor(Math.random() * DEMO_PUPILS.length)];

    incidents.push({
      id: `demo-neg-${i + 1}`,
      organization_id: "demo",
      pupil_name: pupil,
      pupil_id: `pupil-${DEMO_PUPILS.indexOf(pupil) + 1}`,
      year_group: Math.floor(Math.random() * 6) + 7,
      type: "negative",
      category: negativeCategories[i % negativeCategories.length],
      description: negativeDescriptions[i % negativeDescriptions.length],
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      lesson_period:
        LESSON_PERIODS[Math.floor(Math.random() * LESSON_PERIODS.length)],
      consequence:
        negativeConsequences[
          Math.floor(Math.random() * negativeConsequences.length)
        ],
      reported_by: DEMO_STAFF[Math.floor(Math.random() * DEMO_STAFF.length)],
      parent_notified: Math.random() > 0.5,
      notes: i < 3 ? "SLT referral made" : undefined,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }

  // Add extra incidents for repeat offenders
  for (const offender of repeatOffenders.slice(0, 3)) {
    for (let j = 0; j < 2; j++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(
        9 + Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 60),
      );

      incidents.push({
        id: `demo-repeat-${offender.replace(/\s/g, "")}-${j}`,
        organization_id: "demo",
        pupil_name: offender,
        pupil_id: `pupil-${DEMO_PUPILS.indexOf(offender) + 1}`,
        year_group: Math.floor(Math.random() * 3) + 9,
        type: "negative",
        category:
          negativeCategories[
            Math.floor(Math.random() * negativeCategories.length)
          ],
        description:
          negativeDescriptions[
            Math.floor(Math.random() * negativeDescriptions.length)
          ],
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        lesson_period:
          LESSON_PERIODS[Math.floor(Math.random() * LESSON_PERIODS.length)],
        consequence:
          negativeConsequences[
            Math.floor(Math.random() * negativeConsequences.length)
          ],
        reported_by: DEMO_STAFF[Math.floor(Math.random() * DEMO_STAFF.length)],
        parent_notified: true,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
  }

  return incidents.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

// ─── Routes ──────────────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const params = request.nextUrl.searchParams;

  const type = params.get("type");
  const category = params.get("category");
  const pupil = params.get("pupil");
  const year_group = params.get("year_group");
  const date_from = params.get("date_from");
  const date_to = params.get("date_to");
  const page = parseInt(params.get("page") || "1");
  const pageSize = parseInt(params.get("pageSize") || "50");

  let query = supabase
    .from("behaviour_incidents")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category", category);
  if (pupil) query = query.ilike("pupil_name", `%${pupil}%`);
  if (year_group) query = query.eq("year_group", parseInt(year_group));
  if (date_from) query = query.gte("created_at", date_from);
  if (date_to) query = query.lte("created_at", date_to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[behaviour/incidents] DB error:", error);
  }

  // If no data or error, return demo data
  if (!data || data.length === 0) {
    let demoData = generateDemoIncidents();

    if (type) demoData = demoData.filter((d) => d.type === type);
    if (category) demoData = demoData.filter((d) => d.category === category);
    if (pupil)
      demoData = demoData.filter((d) =>
        d.pupil_name.toLowerCase().includes(pupil.toLowerCase()),
      );
    if (year_group)
      demoData = demoData.filter((d) => d.year_group === parseInt(year_group));

    return apiSuccess({
      incidents: demoData.slice((page - 1) * pageSize, page * pageSize),
      total: demoData.length,
      page,
      pageSize,
      demo: true,
    });
  }

  return apiSuccess({
    incidents: data,
    total: count || data.length,
    page,
    pageSize,
    demo: false,
  });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      pupil_name,
      pupil_id,
      year_group,
      type,
      category,
      description,
      location,
      lesson_period,
      consequence,
      reported_by,
      parent_notified,
      notes,
    } = body;

    if (!pupil_name || !type || !category) {
      return apiError("pupil_name, type, and category are required", 400);
    }

    if (!["positive", "negative"].includes(type)) {
      return apiError("type must be 'positive' or 'negative'", 400);
    }

    const { data, error } = await supabase
      .from("behaviour_incidents")
      .insert({
        organization_id: organizationId,
        pupil_name,
        pupil_id: pupil_id || null,
        year_group: year_group || null,
        type,
        category,
        description: description || null,
        location: location || null,
        lesson_period: lesson_period || null,
        consequence: consequence || null,
        reported_by: reported_by || userId,
        parent_notified: parent_notified || false,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[behaviour/incidents] Insert error:", error);
      return apiError("Failed to create incident", 500);
    }

    return apiSuccess(data, 201);
  },
  { requiredRole: "teacher" },
);
