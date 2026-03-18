import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo dashboard stats
const DEMO_STATS = {
  register: {
    total: 15,
    sen_k: 8,
    ehcp: 5,
    monitoring: 2,
    by_need: {
      SPLD: 2,
      MLD: 2,
      SEMH: 3,
      SLCN: 2,
      ASD: 2,
      PD: 1,
      HI: 1,
      SLD: 1,
      NSA: 1,
    },
    by_year: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 2 },
  },
  ehcp: {
    total: 5,
    reviews_due_this_term: 2,
    reviews_overdue: 0,
    assessments_in_progress: 1,
  },
  provisions: {
    total_active: 20,
    total_weekly_cost: 2178.5,
    total_annual_cost: 2178.5 * 39,
    by_type: {
      intervention: 9,
      adult_support: 3,
      therapy_programme: 2,
      environmental: 2,
      specialist_equipment: 1,
      curriculum_modification: 1,
    },
    by_funding: {
      school_budget: 10,
      ehcp_funding: 8,
      pupil_premium: 0,
      other: 0,
    },
    pupils_without_provision: 1,
  },
  referrals: {
    total_active: 6,
    draft: 1,
    submitted: 1,
    waiting_list: 2,
    assessment: 2,
    report_received: 2,
    by_type: {
      SALT: 1,
      CAMHS: 1,
      EP: 1,
      OT: 1,
      Physio: 1,
      Sensory: 1,
      "EHCP Assessment": 1,
      Paediatrician: 1,
    },
    overdue: 0,
  },
  graduated_approach: {
    total_active_cycles: 8,
    by_stage: { assess: 1, plan: 1, do: 5, review: 1 },
    reviews_due_this_term: 3,
    outcomes_this_year: {
      targets_met: 2,
      partial_progress: 3,
      no_progress: 0,
      regression: 0,
    },
  },
};

/**
 * GET /api/send/dashboard
 * SENCO dashboard stats
 */
export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Try to load real data
  const { data: register } = await supabase
    .from("send_register")
    .select("id, sen_status, primary_need, year_group, ehcp_status")
    .eq("organization_id", organizationId);

  // If no real data, try MIS fallback before demo
  if (!register || register.length === 0) {
    try {
      console.log("[SEND Dashboard] No Supabase data, trying MIS fallback...");
      const { getMISDataServiceForOrg } =
        await import("@/lib/mis/data-service");
      const misService = await getMISDataServiceForOrg(organizationId);
      const misResult = await misService.read(organizationId, "sen_register");
      console.log(
        "[SEND Dashboard] MIS returned",
        misResult.data.length,
        "records, warnings:",
        misResult.warnings,
      );
      if (misResult.data.length > 0) {
        const misRegister = misResult.data as any[];
        const misSenK = misRegister.filter((r) => r.sen_status === "K");
        const misEhcp = misRegister.filter((r) => r.sen_status === "E");

        const misByNeed: Record<string, number> = {};
        misRegister.forEach((r) => {
          if (r.sen_primary_need)
            misByNeed[r.sen_primary_need] =
              (misByNeed[r.sen_primary_need] || 0) + 1;
        });

        const misByYear: Record<string, number> = {};
        misRegister.forEach((r) => {
          if (r.year_group !== undefined)
            misByYear[r.year_group] = (misByYear[r.year_group] || 0) + 1;
        });

        const misEhcpFinalised = misRegister.filter((r) => r.ehcp);

        return apiSuccess({
          register: {
            total: misRegister.length,
            sen_k: misSenK.length,
            ehcp: misEhcp.length,
            monitoring: 0,
            by_need: misByNeed,
            by_year: misByYear,
          },
          ehcp: {
            total: misEhcpFinalised.length,
            reviews_due_this_term: misEhcpFinalised.filter(
              (r) => r.next_annual_review,
            ).length,
            reviews_overdue: 0,
            assessments_in_progress: 0,
          },
          provisions: {
            total_active: 0,
            total_weekly_cost: 0,
            total_annual_cost: 0,
            by_type: {},
            by_funding: {},
            pupils_without_provision: misRegister.length,
          },
          referrals: {
            total_active: 0,
            by_type: {},
            overdue: 0,
          },
          graduated_approach: {
            total_active_cycles: 0,
            by_stage: {},
            reviews_due_this_term: 0,
            outcomes_this_year: {},
          },
          source: "mis",
          demo: false,
        });
      }
    } catch (e) {
      console.error("[SEND Dashboard] MIS fallback error:", e);
    }

    return apiSuccess({ ...DEMO_STATS, demo: true });
  }

  // Compute real stats
  const senK = register.filter((r) => r.sen_status === "K");
  const ehcp = register.filter((r) => r.sen_status === "E");
  const monitoring = register.filter((r) => r.sen_status === "monitoring");

  // By need
  const byNeed: Record<string, number> = {};
  register.forEach((r) => {
    if (r.primary_need)
      byNeed[r.primary_need] = (byNeed[r.primary_need] || 0) + 1;
  });

  // By year
  const byYear: Record<string, number> = {};
  register.forEach((r) => {
    if (r.year_group) byYear[r.year_group] = (byYear[r.year_group] || 0) + 1;
  });

  // EHCP reviews - check for annual reviews due this term
  const today = new Date();
  const termEnd = new Date(today);
  // Approximate term end
  if (today.getMonth() < 3)
    termEnd.setMonth(3, 1); // Spring ends April
  else if (today.getMonth() < 7)
    termEnd.setMonth(7, 1); // Summer ends July
  else termEnd.setMonth(11, 20); // Autumn ends Dec

  // Provisions
  const { data: provisions } = await supabase
    .from("send_provision_map")
    .select(
      "id, provision_type, cost_per_week, funding_source, is_active, pupil_id",
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const activeProvisions = provisions || [];
  const totalWeeklyCost = activeProvisions.reduce(
    (sum, p) => sum + (p.cost_per_week || 0),
    0,
  );

  const provByType: Record<string, number> = {};
  activeProvisions.forEach((p) => {
    provByType[p.provision_type] = (provByType[p.provision_type] || 0) + 1;
  });

  const provByFunding: Record<string, number> = {};
  activeProvisions.forEach((p) => {
    const src = p.funding_source || "school_budget";
    provByFunding[src] = (provByFunding[src] || 0) + 1;
  });

  // Pupils without provisions
  const pupilsWithProvisions = new Set(activeProvisions.map((p) => p.pupil_id));
  const pupilsWithoutProvision = register.filter(
    (r) => r.sen_status !== "monitoring" && !pupilsWithProvisions.has(r.id),
  ).length;

  // Referrals
  const { data: referrals } = await supabase
    .from("send_referrals")
    .select("id, status, referral_type")
    .eq("organization_id", organizationId);

  const allRefs = referrals || [];
  const activeRefs = allRefs.filter(
    (r) => r.status !== "report_received" && r.status !== "closed",
  );

  const refByStatus: Record<string, number> = {};
  allRefs.forEach((r) => {
    refByStatus[r.status] = (refByStatus[r.status] || 0) + 1;
  });

  const refByType: Record<string, number> = {};
  allRefs.forEach((r) => {
    refByType[r.referral_type] = (refByType[r.referral_type] || 0) + 1;
  });

  // Graduated approach
  const { data: cycles } = await supabase
    .from("send_graduated_approach")
    .select("id, current_stage, review_outcome, review_date")
    .eq("organization_id", organizationId);

  const allCycles = cycles || [];
  const activeCycles = allCycles.filter(
    (c) => c.current_stage !== "review" || !c.review_outcome,
  );
  const byStage: Record<string, number> = {};
  activeCycles.forEach((c) => {
    byStage[c.current_stage] = (byStage[c.current_stage] || 0) + 1;
  });

  const outcomes: Record<string, number> = {};
  allCycles
    .filter((c) => c.review_outcome)
    .forEach((c) => {
      outcomes[c.review_outcome] = (outcomes[c.review_outcome] || 0) + 1;
    });

  const stats = {
    register: {
      total: register.length,
      sen_k: senK.length,
      ehcp: ehcp.length,
      monitoring: monitoring.length,
      by_need: byNeed,
      by_year: byYear,
    },
    ehcp: {
      total: ehcp.length,
      reviews_due_this_term: ehcp.filter((e) => e.ehcp_status === "finalised")
        .length, // simplified
      reviews_overdue: 0,
      assessments_in_progress: register.filter(
        (r) => r.ehcp_status === "requested" || r.ehcp_status === "assessment",
      ).length,
    },
    provisions: {
      total_active: activeProvisions.length,
      total_weekly_cost: totalWeeklyCost,
      total_annual_cost: totalWeeklyCost * 39,
      by_type: provByType,
      by_funding: provByFunding,
      pupils_without_provision: pupilsWithoutProvision,
    },
    referrals: {
      total_active: activeRefs.length,
      ...refByStatus,
      by_type: refByType,
      overdue: 0,
    },
    graduated_approach: {
      total_active_cycles: activeCycles.length,
      by_stage: byStage,
      reviews_due_this_term: activeCycles.filter(
        (c) => c.current_stage === "review" && !c.review_outcome,
      ).length,
      outcomes_this_year: outcomes,
    },
    demo: false,
  };

  return apiSuccess(stats);
});
