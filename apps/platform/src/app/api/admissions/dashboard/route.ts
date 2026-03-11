import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/admissions/dashboard
 * Return dashboard statistics for the admissions module
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const searchParams = request.nextUrl.searchParams;
  const roundId = searchParams.get("round_id");

  // Fetch rounds
  const { data: rounds } = await supabase
    .from("admissions_rounds")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!rounds || rounds.length === 0) {
    // Return empty stats — the page will show demo data
    return apiSuccess({
      rounds: [],
      activeRound: null,
      stats: {
        total_applications: 0,
        received: 0,
        verified: 0,
        offered: 0,
        accepted: 0,
        declined: 0,
        waiting_list: 0,
        withdrawn: 0,
        appeals_pending: 0,
        appeals_upheld: 0,
        appeals_dismissed: 0,
        places_available: 0,
        pan: 0,
      },
      criteriaBreakdown: [],
      waitingList: [],
      appeals: [],
      recentActivity: [],
    });
  }

  // Use specified round or most recent active/open round
  let activeRound = roundId
    ? rounds.find((r: any) => r.id === roundId)
    : rounds.find((r: any) => r.status === "open") || rounds[0];

  if (!activeRound) {
    activeRound = rounds[0];
  }

  // Fetch all applications for this round
  const { data: applications } = await supabase
    .from("admissions_applications")
    .select("*")
    .eq("round_id", activeRound.id)
    .eq("organization_id", organizationId)
    .order("waiting_list_position", { ascending: true });

  const apps = applications || [];
  const pan = activeRound.pan || 0;

  // Status counts
  const statusCounts: Record<string, number> = {};
  const criteriaMap: Record<string, number> = {};
  const waitingList: any[] = [];
  const appeals: any[] = [];

  for (const app of apps) {
    // Count by status
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;

    // Count by oversubscription criterion
    if (app.oversubscription_criterion) {
      criteriaMap[app.oversubscription_criterion] =
        (criteriaMap[app.oversubscription_criterion] || 0) + 1;
    }

    // Collect waiting list entries
    if (app.status === "waiting_list") {
      waitingList.push(app);
    }

    // Collect appeal entries
    if (app.appeal_submitted) {
      appeals.push(app);
    }
  }

  // Sort waiting list by position
  waitingList.sort(
    (a: any, b: any) =>
      (a.waiting_list_position || 999) - (b.waiting_list_position || 999),
  );

  // Criteria breakdown as sorted array
  const criteriaOrder = [
    "lac",
    "ehcp",
    "sibling",
    "faith",
    "staff_child",
    "distance",
    "other",
  ];
  const criteriaBreakdown = criteriaOrder
    .filter((c) => criteriaMap[c])
    .map((c) => ({ criterion: c, count: criteriaMap[c] }));

  // Add any criteria not in standard order
  for (const [criterion, count] of Object.entries(criteriaMap)) {
    if (!criteriaOrder.includes(criterion)) {
      criteriaBreakdown.push({ criterion, count });
    }
  }

  // Recent changes (last 10 updated)
  const recentActivity = [...apps]
    .filter((a: any) => a.updated_at)
    .sort(
      (a: any, b: any) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 10);

  const accepted = statusCounts["accepted"] || 0;
  const offered = statusCounts["offered"] || 0;
  const placesUsed = accepted + offered;

  return apiSuccess({
    rounds,
    activeRound,
    stats: {
      total_applications: apps.length,
      received: statusCounts["received"] || 0,
      verified: statusCounts["verified"] || 0,
      offered: statusCounts["offered"] || 0,
      accepted: statusCounts["accepted"] || 0,
      declined: statusCounts["declined"] || 0,
      waiting_list: statusCounts["waiting_list"] || 0,
      withdrawn: statusCounts["withdrawn"] || 0,
      appeals_pending: appeals.filter((a) => !a.appeal_outcome).length,
      appeals_upheld: appeals.filter((a) => a.appeal_outcome === "upheld")
        .length,
      appeals_dismissed: appeals.filter((a) => a.appeal_outcome === "dismissed")
        .length,
      places_available: Math.max(0, pan - placesUsed),
      pan,
    },
    criteriaBreakdown,
    waitingList,
    appeals,
    recentActivity,
  });
});
