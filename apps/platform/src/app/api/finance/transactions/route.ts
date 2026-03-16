/**
 * Finance Transactions API
 *
 * GET /api/finance/transactions?organizationId=<id>&cfr_code=<code>&page=1&limit=50
 * Returns transactions with optional CFR code filter, pagination, and summary stats.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const sp = request.nextUrl.searchParams;

  const cfrCode = sp.get("cfr_code");
  const group = sp.get("group"); // Staffing, Premises, Energy, Supplies, Other, Income
  const search = sp.get("search");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(sp.get("limit") || "50", 10)),
  );
  const offset = (page - 1) * limit;
  const financialYear = sp.get("financial_year");

  // Build query
  let query = supabase
    .from("finance_transactions")
    .select("*", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .order("transaction_date", { ascending: false })
    .order("source_row_number", { ascending: false })
    .range(offset, offset + limit - 1);

  if (cfrCode) {
    query = query.eq("cfr_code", cfrCode);
  }

  if (financialYear) {
    query = query.eq("financial_year", financialYear);
  }

  if (search) {
    query = query.or(
      `supplier_name.ilike.%${search}%,cfr_description.ilike.%${search}%,transaction_ref.ilike.%${search}%`,
    );
  }

  // Group filter — map group names to CFR code ranges
  if (group) {
    const groupCodes: Record<string, string[]> = {
      Staffing: [
        "E01",
        "E02",
        "E03",
        "E04",
        "E05",
        "E06",
        "E07",
        "E08",
        "E09",
        "E10",
        "E11",
        "E26",
      ],
      Premises: ["E12", "E13", "E14"],
      Energy: ["E15", "E16", "E17", "E18"],
      Supplies: ["E19", "E20", "E21", "E22", "E23", "E24", "E25"],
      Other: ["E28", "E28a", "E28C", "E29", "E30", "E31", "E32", "B01"],
    };
    const codes = groupCodes[group];
    if (codes) {
      query = query.in("cfr_code", codes);
    } else if (group === "Income") {
      query = query.lt("gross_amount", 0);
    }
  }

  const { data: transactions, error, count } = await query;

  if (error) {
    console.error("[Finance Transactions] DB error:", error.message);
    return apiError("Failed to fetch transactions", 500);
  }

  // Build summary stats for the filtered set
  let summaryQuery = supabase
    .from("finance_transactions")
    .select("gross_amount, vat_amount")
    .eq("organization_id", auth.organizationId);

  if (cfrCode) summaryQuery = summaryQuery.eq("cfr_code", cfrCode);
  if (financialYear)
    summaryQuery = summaryQuery.eq("financial_year", financialYear);

  const { data: allForSummary } = await summaryQuery;

  const summary = {
    total_gross: 0,
    total_vat: 0,
    transaction_count: count ?? 0,
  };

  if (allForSummary) {
    for (const t of allForSummary) {
      summary.total_gross += parseFloat(t.gross_amount || "0");
      summary.total_vat += parseFloat(t.vat_amount || "0");
    }
  }

  return apiSuccess({
    transactions: transactions ?? [],
    summary,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
});
