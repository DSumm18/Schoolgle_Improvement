/**
 * GET /api/canvas/quick-report — Pull real data for Canvas reports
 *
 * Queries Supabase tables for the authenticated school and returns
 * chart-ready data. Overlays DfE national data where available.
 *
 * ?type=staff_overview | attendance | budget | finance | send | energy | risks | estates | safeguarding
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getAvailableOverlays,
  getOverlayById,
  getOverlayQueryFields,
  formatTimePeriod,
} from "@/lib/canvas/overlay-registry";
import type { OverlayData } from "@/lib/canvas/types";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const reportType =
    request.nextUrl.searchParams.get("type") || "staff_overview";
  const overlayParam = request.nextUrl.searchParams.get("overlays") || "";
  const requestedOverlayIds = overlayParam
    ? overlayParam.split(",").filter(Boolean)
    : [];
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Compute available overlays for this report type
  const availableOverlays = getAvailableOverlays(reportType);

  // Fetch requested overlay data
  const overlays: OverlayData[] = [];
  for (const overlayId of requestedOverlayIds) {
    const def = getOverlayById(overlayId);
    if (!def) continue;

    const queryFields = getOverlayQueryFields(def);
    const { data: overlayRows } = await supabase
      .from(def.table)
      .select(queryFields)
      .not(def.fields[0].source, "is", null)
      .order(def.joinKey, { ascending: false })
      .limit(500);

    if (!overlayRows || overlayRows.length === 0) continue;

    // Aggregate by join key (time_period) — AVG across all schools
    const byKey: Record<
      string,
      { sums: Record<string, number>; count: number }
    > = {};
    for (const row of overlayRows as unknown as Record<string, unknown>[]) {
      const key = String(row[def.joinKey]);
      if (!byKey[key]) {
        byKey[key] = { sums: {}, count: 0 };
        for (const f of def.fields) byKey[key].sums[f.source] = 0;
      }
      byKey[key].count++;
      for (const f of def.fields) {
        byKey[key].sums[f.source] += parseFloat(String(row[f.source])) || 0;
      }
    }

    const aggregatedData = Object.entries(byKey)
      .map(([key, { sums, count }]) => {
        const row: Record<string, unknown> = {
          [def.joinKey]: formatTimePeriod(key),
        };
        for (const f of def.fields) {
          row[f.source] = Math.round((sums[f.source] / count) * 10) / 10;
        }
        return row;
      })
      .sort((a, b) =>
        String(a[def.joinKey]).localeCompare(String(b[def.joinKey])),
      )
      .slice(-6);

    overlays.push({
      overlayId: def.id,
      label: def.label,
      renderAs: def.renderAs,
      fields: def.fields.map((f) => ({
        dataKey: f.source,
        label: f.label,
        color: f.color || def.color,
      })),
      data: aggregatedData,
    });
  }

  switch (reportType) {
    case "staff":
    case "staff_overview": {
      // Pull staff from staff_directory (no fte column — count headcount only)
      const { data: staff } = await supabase
        .from("staff_directory")
        .select(
          "id, first_name, last_name, job_title, role_category, is_active, start_date",
        )
        .eq("organization_id", orgId)
        .eq("is_active", true);

      if (!staff || staff.length === 0) {
        return buildResponse({
          type: "staff_overview",
          title: "Staff Overview",
          empty: true,
          message:
            "No staff records found. Import staff data via Smart Ingest.",
          charts: [],
        });
      }

      // Group by role category
      const byRole: Record<string, number> = {};
      for (const s of staff) {
        const role = s.role_category || "other";
        byRole[role] = (byRole[role] || 0) + 1;
      }

      const roleData = Object.entries(byRole)
        .map(([name, count]) => ({
          name: name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // DfE workforce benchmark — actual columns: fte_teachers, pupil_teacher_ratio, etc.
      const { data: dfeWorkforce } = await supabase
        .from("workforce")
        .select(
          "time_period, fte_teachers, fte_teaching_assistants, fte_total, pupil_teacher_ratio, teachers_with_qts_pct",
        )
        .not("fte_total", "is", null)
        .order("time_period", { ascending: false })
        .limit(10);

      const teachingCount =
        byRole["class_teacher"] || byRole["teacher"] || byRole["Teacher"] || 0;

      return buildResponse({
        type: "staff_overview",
        title: "Staff Overview",
        subtitle: `${staff.length} active staff`,
        charts: [
          {
            id: "staff_by_role",
            chartType: "pie",
            title: "Staff by Role",
            data: roleData,
            xKey: "name",
            valueKey: "count",
          },
          {
            id: "staff_metrics",
            chartType: "metric_card",
            title: "Key Metrics",
            data: [
              {
                label: "Total Staff",
                value: staff.length,
                total: staff.length,
                pct: 100,
              },
              {
                label: "Teaching",
                value: teachingCount,
                total: staff.length,
                pct:
                  staff.length > 0
                    ? Math.round((teachingCount / staff.length) * 100)
                    : 0,
              },
              {
                label: "Support",
                value: staff.length - teachingCount,
                total: staff.length,
                pct:
                  staff.length > 0
                    ? Math.round(
                        ((staff.length - teachingCount) / staff.length) * 100,
                      )
                    : 0,
              },
            ],
          },
        ],
        dfe: dfeWorkforce || [],
      });
    }

    case "attendance": {
      // Pull attendance data
      const { data: attendance } = await supabase
        .from("attendance_registers")
        .select("date, status, year_group")
        .eq("organization_id", orgId)
        .order("date", { ascending: true })
        .limit(5000);

      if (!attendance || attendance.length === 0) {
        // DfE national attendance — actual columns: time_period, overall_attendance_pct
        const { data: dfeAttendance } = await supabase
          .from("attendance")
          .select("time_period, overall_attendance_pct, overall_absence_pct")
          .not("overall_attendance_pct", "is", null)
          .order("time_period", { ascending: false })
          .limit(500);

        // Average by time_period to get national figures
        const byPeriod: Record<string, { sum: number; count: number }> = {};
        for (const d of dfeAttendance || []) {
          const p = d.time_period;
          if (!byPeriod[p]) byPeriod[p] = { sum: 0, count: 0 };
          byPeriod[p].sum += parseFloat(d.overall_attendance_pct) || 0;
          byPeriod[p].count++;
        }

        const nationalData = Object.entries(byPeriod)
          .map(([period, { sum, count }]) => ({
            period: `${period.slice(0, 4)}/${period.slice(4)}`,
            national: Math.round((sum / count) * 10) / 10,
          }))
          .sort((a, b) => a.period.localeCompare(b.period))
          .slice(-6);

        return buildResponse({
          type: "attendance",
          title: "Attendance — National Benchmarks",
          subtitle:
            "No school attendance data yet. Showing DfE national figures.",
          charts:
            nationalData.length > 0
              ? [
                  {
                    id: "national_attendance",
                    chartType: "line",
                    title: "National Attendance Rate by Year",
                    data: nationalData,
                    xKey: "period",
                    valueKey: "national",
                    benchmark: { label: "95% Target", value: 95 },
                  },
                ]
              : [],
          dfe: dfeAttendance || [],
        });
      }

      // Group by month
      const byMonth: Record<string, { total: number; present: number }> = {};
      for (const a of attendance) {
        const month = a.date?.slice(0, 7) || "unknown";
        if (!byMonth[month]) byMonth[month] = { total: 0, present: 0 };
        byMonth[month].total++;
        if (a.status === "present" || a.status === "/" || a.status === "\\") {
          byMonth[month].present++;
        }
      }

      const monthlyData = Object.entries(byMonth)
        .map(([month, d]) => ({
          month,
          rate: d.total > 0 ? Math.round((d.present / d.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return buildResponse({
        type: "attendance",
        title: "Attendance Overview",
        charts: [
          {
            id: "monthly_attendance",
            chartType: "line",
            title: "Monthly Attendance Rate",
            data: monthlyData,
            xKey: "month",
            valueKey: "rate",
            benchmark: { label: "National (95.7%)", value: 95.7 },
          },
        ],
      });
    }

    case "budget": {
      const { data: budget } = await supabase
        .from("finance_budget_lines")
        .select("cfr_code, category, budget_amount, actual_amount")
        .eq("organization_id", orgId);

      if (!budget || budget.length === 0) {
        // Fall through to finance transactions if no budget lines
        return handleFinanceTransactions(supabase, orgId, buildResponse);
      }

      const budgetData = budget
        .slice(0, 10)
        .map((b: Record<string, unknown>) => ({
          category: String(b.category || b.cfr_code),
          budget: parseFloat(String(b.budget_amount)) || 0,
          actual: parseFloat(String(b.actual_amount)) || 0,
        }));

      return buildResponse({
        type: "budget",
        title: "Budget vs Actual",
        charts: [
          {
            id: "budget_vs_actual",
            chartType: "bar",
            title: "Budget vs Actual by Category",
            data: budgetData,
            xKey: "category",
            series: [
              { field: "budget", label: "Budget", color: "#94a3b8" },
              { field: "actual", label: "Actual" },
            ],
          },
        ],
      });
    }

    case "finance":
    case "fms": {
      return handleFinanceTransactions(supabase, orgId, buildResponse);
    }

    case "send": {
      const { data: sendReg } = await supabase
        .from("send_register")
        .select("year_group, sen_type, primary_need")
        .eq("organization_id", orgId);

      if (!sendReg || sendReg.length === 0) {
        return buildResponse({
          type: "send",
          title: "SEND Register",
          empty: true,
          message:
            "No SEND data found. Import your SEN register via Smart Ingest.",
          charts: [],
        });
      }

      // Group by year group and type
      const byYg: Record<string, { k: number; e: number }> = {};
      for (const s of sendReg) {
        const yg = s.year_group || "Unknown";
        if (!byYg[yg]) byYg[yg] = { k: 0, e: 0 };
        if (s.sen_type === "K") byYg[yg].k++;
        else if (s.sen_type === "E") byYg[yg].e++;
      }

      const sendData = Object.entries(byYg)
        .map(([yg, counts]) => ({
          year_group: yg,
          sen_support: counts.k,
          ehcp: counts.e,
        }))
        .sort((a, b) => a.year_group.localeCompare(b.year_group));

      return buildResponse({
        type: "send",
        title: "SEND Register",
        subtitle: `${sendReg.length} pupils on register`,
        charts: [
          {
            id: "send_by_year",
            chartType: "bar",
            title: "SEND by Year Group",
            data: sendData,
            xKey: "year_group",
            series: [
              { field: "sen_support", label: "SEN Support (K)" },
              { field: "ehcp", label: "EHCP (E)", color: "#ef4444" },
            ],
          },
        ],
      });
    }

    case "risks": {
      const { data: risks } = await supabase
        .from("risk_register")
        .select(
          "id, title, risk_categories, inherent_likelihood, inherent_impact, effective_residual_score, status",
        )
        .eq("organization_id", orgId)
        .in("status", ["assessing", "treating", "tolerated"]);

      if (!risks || risks.length === 0) {
        return buildResponse({
          type: "risks",
          title: "Risk Register",
          empty: true,
          message: "No open risks found.",
          charts: [],
        });
      }

      // Group by first category
      const byCat: Record<string, number> = {};
      for (const r of risks) {
        const cats = r.risk_categories as string[] | null;
        const cat = cats?.[0] || "General";
        byCat[cat] = (byCat[cat] || 0) + 1;
      }

      const riskData = Object.entries(byCat)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return buildResponse({
        type: "risks",
        title: "Open Risks",
        subtitle: `${risks.length} open risks`,
        charts: [
          {
            id: "risks_by_category",
            chartType: "bar",
            title: "Risks by Category",
            data: riskData,
            xKey: "name",
            valueKey: "count",
          },
        ],
      });
    }

    case "estates": {
      const { data: tickets } = await supabase
        .from("estates_helpdesk_tickets")
        .select("id, title, priority, status, category")
        .eq("organization_id", orgId);

      if (!tickets || tickets.length === 0) {
        return buildResponse({
          type: "estates",
          title: "Estates & Premises",
          empty: true,
          message: "No estates data found.",
          charts: [],
        });
      }

      const byPriority: Record<string, number> = {};
      for (const t of tickets) {
        byPriority[t.priority || "Medium"] =
          (byPriority[t.priority || "Medium"] || 0) + 1;
      }

      return buildResponse({
        type: "estates",
        title: "Estates & Premises",
        subtitle: `${tickets.length} tickets`,
        charts: [
          {
            id: "tickets_by_priority",
            chartType: "bar",
            title: "Tickets by Priority",
            data: Object.entries(byPriority).map(([name, count]) => ({
              name,
              count,
            })),
            xKey: "name",
            valueKey: "count",
          },
        ],
      });
    }

    case "safeguarding": {
      return buildResponse({
        type: "safeguarding",
        title: "Safeguarding",
        empty: true,
        message:
          "No safeguarding data in this view. Use the Safeguarding module for detailed records.",
        charts: [],
      });
    }

    case "pupils": {
      // DfE School Census data
      const { data: census } = await supabase
        .from("census")
        .select("time_period, number_on_roll, fsm_pct, eal_pct, sen_pct")
        .not("number_on_roll", "is", null)
        .order("time_period", { ascending: false })
        .limit(500);

      if (!census || census.length === 0) {
        return buildResponse({
          type: "pupils",
          title: "DfE School Census",
          empty: true,
          message: "No census data available.",
          charts: [],
        });
      }

      // Average by time_period
      const byPeriod: Record<
        string,
        { fsm: number; eal: number; sen: number; n: number }
      > = {};
      for (const d of census) {
        const p = d.time_period;
        if (!byPeriod[p]) byPeriod[p] = { fsm: 0, eal: 0, sen: 0, n: 0 };
        byPeriod[p].fsm += parseFloat(d.fsm_pct) || 0;
        byPeriod[p].eal += parseFloat(d.eal_pct) || 0;
        byPeriod[p].sen += parseFloat(d.sen_pct) || 0;
        byPeriod[p].n++;
      }

      const censusData = Object.entries(byPeriod)
        .map(([period, { fsm, eal, sen, n }]) => ({
          period: `${period.slice(0, 4)}/${period.slice(4)}`,
          fsm: Math.round((fsm / n) * 10) / 10,
          eal: Math.round((eal / n) * 10) / 10,
          sen: Math.round((sen / n) * 10) / 10,
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-6);

      return buildResponse({
        type: "pupils",
        title: "DfE School Census — Demographics",
        subtitle: "National averages across all schools",
        charts: [
          {
            id: "census_demographics",
            chartType: "line",
            title: "National Demographics Trends",
            data: censusData,
            xKey: "period",
            series: [
              { field: "fsm", label: "FSM %" },
              { field: "sen", label: "SEN %", color: "#22c55e" },
              { field: "eal", label: "EAL %", color: "#8b5cf6" },
            ],
          },
        ],
      });
    }

    case "assessments": {
      // DfE KS2 Results
      const { data: ks2 } = await supabase
        .from("ks2_results")
        .select(
          "time_period, subject, expected_standard_pct, higher_standard_pct, average_scaled_score",
        )
        .eq("breakdown_topic", "All pupils")
        .not("expected_standard_pct", "is", null)
        .order("time_period", { ascending: false })
        .limit(200);

      if (!ks2 || ks2.length === 0) {
        return buildResponse({
          type: "assessments",
          title: "DfE KS2 Results",
          empty: true,
          message: "No KS2 data available.",
          charts: [],
        });
      }

      // Group by time_period + subject, average values
      const byKey: Record<
        string,
        { expected: number; higher: number; n: number }
      > = {};
      for (const d of ks2) {
        const key = `${d.time_period}|${d.subject}`;
        if (!byKey[key]) byKey[key] = { expected: 0, higher: 0, n: 0 };
        byKey[key].expected += parseFloat(d.expected_standard_pct) || 0;
        byKey[key].higher += parseFloat(d.higher_standard_pct) || 0;
        byKey[key].n++;
      }

      // Pivot: one row per period with columns per subject
      const periods = [...new Set(ks2.map((d) => d.time_period))].sort();
      const subjects = [...new Set(ks2.map((d) => d.subject))];

      const ks2Data = periods.slice(-6).map((p) => {
        const row: Record<string, unknown> = {
          period: `${p.slice(0, 4)}/${p.slice(4)}`,
        };
        for (const s of subjects) {
          const k = `${p}|${s}`;
          if (byKey[k]) {
            row[s] = Math.round((byKey[k].expected / byKey[k].n) * 10) / 10;
          }
        }
        return row;
      });

      return buildResponse({
        type: "assessments",
        title: "DfE KS2 Results — Expected Standard",
        subtitle: "National % achieving expected standard",
        charts: [
          {
            id: "ks2_expected",
            chartType: "line",
            title: "KS2 Expected Standard by Subject",
            data: ks2Data,
            xKey: "period",
            series: subjects.slice(0, 4).map((s, i) => ({
              field: s,
              label: s,
              color: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"][i],
            })),
          },
        ],
      });
    }

    case "behaviour": {
      // DfE Exclusions data
      const { data: exclusions } = await supabase
        .from("exclusions")
        .select(
          "time_period, fixed_period_exclusions_rate, permanent_exclusions_rate",
        )
        .not("fixed_period_exclusions_rate", "is", null)
        .order("time_period", { ascending: false })
        .limit(500);

      if (!exclusions || exclusions.length === 0) {
        return buildResponse({
          type: "behaviour",
          title: "DfE Exclusions",
          empty: true,
          message: "No exclusion data available.",
          charts: [],
        });
      }

      const byP: Record<string, { fixed: number; perm: number; n: number }> =
        {};
      for (const d of exclusions) {
        const p = d.time_period;
        if (!byP[p]) byP[p] = { fixed: 0, perm: 0, n: 0 };
        byP[p].fixed += parseFloat(d.fixed_period_exclusions_rate) || 0;
        byP[p].perm += parseFloat(d.permanent_exclusions_rate) || 0;
        byP[p].n++;
      }

      const exclData = Object.entries(byP)
        .map(([period, { fixed, perm, n }]) => ({
          period: `${period.slice(0, 4)}/${period.slice(4)}`,
          fixed: Math.round((fixed / n) * 100) / 100,
          permanent: Math.round((perm / n) * 1000) / 1000,
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-6);

      return buildResponse({
        type: "behaviour",
        title: "DfE Exclusions — National Rates",
        subtitle: "Average exclusion rates across all schools",
        charts: [
          {
            id: "exclusion_rates",
            chartType: "line",
            title: "Exclusion Rates Over Time",
            data: exclData,
            xKey: "period",
            series: [
              { field: "fixed", label: "Fixed Period Rate" },
              {
                field: "permanent",
                label: "Permanent Rate",
                color: "#ef4444",
              },
            ],
          },
        ],
      });
    }

    default:
      return buildResponse({
        type: reportType,
        title: reportType,
        empty: true,
        message: `No data available for "${reportType}". Try importing data via Smart Ingest.`,
        charts: [],
      });
  }

  // Helper to inject overlay metadata into every response
  function buildResponse(payload: Record<string, unknown>) {
    return apiSuccess({
      ...payload,
      availableOverlays: availableOverlays.map((o) => ({
        id: o.id,
        label: o.label,
        description: o.description,
        renderAs: o.renderAs,
        color: o.color,
      })),
      overlays,
    });
  }
});

// ─── Finance Transactions Helper ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleFinanceTransactions(
  supabase: any,
  orgId: string,
  respond: (payload: Record<string, unknown>) => NextResponse = (p) =>
    apiSuccess(p),
) {
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select(
      "id, transaction_date, transaction_type, cost_centre, cfr_code, cfr_description, gross_amount, net_amount, is_income, supplier_name",
    )
    .eq("organization_id", orgId)
    .order("transaction_date", { ascending: false })
    .limit(2000);

  if (!transactions || transactions.length === 0) {
    return respond({
      type: "finance",
      title: "Finance Transactions",
      empty: true,
      message:
        "No finance data found. Import your transactions via Smart Ingest.",
      charts: [],
    });
  }

  // Group spend by cost centre
  const byCostCentre: Record<string, { income: number; spend: number }> = {};
  for (const t of transactions) {
    const cc = t.cfr_description || t.cost_centre || "Other";
    if (!byCostCentre[cc]) byCostCentre[cc] = { income: 0, spend: 0 };
    const amount = parseFloat(t.gross_amount) || parseFloat(t.net_amount) || 0;
    if (t.is_income) {
      byCostCentre[cc].income += Math.abs(amount);
    } else {
      byCostCentre[cc].spend += Math.abs(amount);
    }
  }

  const spendData = Object.entries(byCostCentre)
    .map(([name, { income, spend }]) => ({
      name: name.length > 30 ? name.slice(0, 27) + "..." : name,
      spend: Math.round(spend),
      income: Math.round(income),
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 12);

  // Group by month
  const byMonth: Record<string, number> = {};
  for (const t of transactions) {
    const month = t.transaction_date?.slice(0, 7) || "unknown";
    const amount = parseFloat(t.gross_amount) || parseFloat(t.net_amount) || 0;
    if (!t.is_income) {
      byMonth[month] = (byMonth[month] || 0) + Math.abs(amount);
    }
  }

  const monthlySpend = Object.entries(byMonth)
    .map(([month, total]) => ({ month, spend: Math.round(total) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalSpend = transactions
    .filter((t: Record<string, unknown>) => !t.is_income)
    .reduce(
      (sum: number, t: Record<string, unknown>) =>
        sum + Math.abs(parseFloat(String(t.gross_amount)) || 0),
      0,
    );
  const totalIncome = transactions
    .filter((t: Record<string, unknown>) => t.is_income)
    .reduce(
      (sum: number, t: Record<string, unknown>) =>
        sum + Math.abs(parseFloat(String(t.gross_amount)) || 0),
      0,
    );

  return respond({
    type: "finance",
    title: "Finance Transactions",
    subtitle: `${transactions.length} transactions — £${Math.round(totalSpend).toLocaleString()} spend, £${Math.round(totalIncome).toLocaleString()} income`,
    charts: [
      {
        id: "spend_by_category",
        chartType: "bar",
        title: "Spend by Category",
        data: spendData,
        xKey: "name",
        series: [
          { field: "spend", label: "Expenditure" },
          { field: "income", label: "Income", color: "#22c55e" },
        ],
      },
      ...(monthlySpend.length > 1
        ? [
            {
              id: "monthly_spend",
              chartType: "line",
              title: "Monthly Expenditure",
              data: monthlySpend,
              xKey: "month",
              valueKey: "spend",
            },
          ]
        : []),
    ],
  });
}
