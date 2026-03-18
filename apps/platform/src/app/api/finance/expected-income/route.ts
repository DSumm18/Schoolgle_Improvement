/**
 * Expected Income API
 *
 * GET  /api/finance/expected-income?organizationId=<id>&financial_year=2025-26
 * POST /api/finance/expected-income?organizationId=<id>
 *
 * Returns expected income items with confidence-weighted totals
 * for the "True Position" budget view.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const sp = request.nextUrl.searchParams;
  const financialYear = sp.get("financial_year") || "2025-26";

  const { data: items, error } = await supabase
    .from("expected_income")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("financial_year", financialYear)
    .order("total_expected", { ascending: false });

  if (error) {
    console.error("[Expected Income] DB error:", error.message);
    return apiError("Failed to fetch expected income", 500);
  }

  // Calculate confidence-weighted summaries
  const summary = {
    total_expected: 0,
    total_received: 0,
    total_outstanding: 0,
    // Confidence-weighted buckets
    confirmed: 0,
    highly_likely: 0,
    likely: 0,
    uncertain: 0,
    // Overdue tracking
    overdue_count: 0,
    overdue_amount: 0,
    // True position additions (what to add to FMS)
    conservative_add: 0, // confirmed only
    realistic_add: 0, // confirmed + highly_likely
    optimistic_add: 0, // all outstanding
  };

  for (const item of items ?? []) {
    const expected = parseFloat(item.total_expected || "0");
    const received = parseFloat(item.amount_received || "0");
    const outstanding = expected - received;

    summary.total_expected += expected;
    summary.total_received += received;
    summary.total_outstanding += outstanding;

    // Bucket by confidence
    switch (item.confidence) {
      case "confirmed":
        summary.confirmed += outstanding;
        summary.conservative_add += outstanding;
        summary.realistic_add += outstanding;
        summary.optimistic_add += outstanding;
        break;
      case "highly_likely":
        summary.highly_likely += outstanding;
        summary.realistic_add += outstanding;
        summary.optimistic_add += outstanding;
        break;
      case "likely":
        summary.likely += outstanding;
        summary.optimistic_add += outstanding;
        break;
      case "uncertain":
        summary.uncertain += outstanding;
        summary.optimistic_add += outstanding;
        break;
    }

    // Check for overdue payments
    const dates = item.expected_dates || [];
    for (const d of dates) {
      if (d.status === "overdue") {
        summary.overdue_count++;
        summary.overdue_amount += d.amount || 0;
      }
    }
  }

  return apiSuccess({
    items: items ?? [],
    summary,
    financial_year: financialYear,
  });
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  if (
    !body.description ||
    !body.category ||
    !body.cfr_code ||
    !body.total_expected
  ) {
    return apiError(
      "description, category, cfr_code, and total_expected are required",
      400,
    );
  }

  const { data, error } = await supabase
    .from("expected_income")
    .insert({
      organization_id: auth.organizationId,
      financial_year: body.financial_year || "2025-26",
      description: body.description,
      category: body.category,
      cfr_code: body.cfr_code,
      cost_centre: body.cost_centre || null,
      total_expected: body.total_expected,
      amount_received: body.amount_received || 0,
      frequency: body.frequency || "one_off",
      expected_dates: body.expected_dates || [],
      confidence: body.confidence || "likely",
      confidence_reason: body.confidence_reason || null,
      evidence_url: body.evidence_url || null,
      source: body.source || null,
      source_reference: body.source_reference || null,
      status: body.status || "expected",
      staff_name: body.staff_name || null,
      staff_role: body.staff_role || null,
      monthly_recharge: body.monthly_recharge || null,
      recharge_destination: body.recharge_destination || null,
      notes: body.notes || null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Expected Income] Insert error:", error.message);
    return apiError(`Failed to create entry: ${error.message}`, 500);
  }

  return apiSuccess({ item: data }, 201);
});
