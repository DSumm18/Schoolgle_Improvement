"use client";

import { useStaffing } from "@/store/staffingStore";
import { fmt, pct } from "./utils";

export function TopMetricsBar() {
  const { computedMetrics: m, derived } = useStaffing();

  const surplus = m.totalIncome - m.totalStaffingCost;
  const netVsBaseline = m.totalStaffingCost - m.baselineCost;

  const kpis = [
    {
      label: "Income (GAG est.)",
      value: fmt(m.totalIncome),
      sub: `${Math.round(m.totalIncome / (m.totalIncome / (m.totalIncome > 0 ? m.totalIncome : 1)))} pupils`,
    },
    {
      label: "Total staffing",
      value: fmt(m.totalStaffingCost),
      sub: "incl. on-costs",
      color: undefined,
    },
    {
      label: "Staffing % of income",
      value: pct(m.staffingPct),
      sub: "DfE target <80%",
      color:
        m.staffingPct < 80
          ? "text-green-700 dark:text-green-400"
          : m.staffingPct < 85
            ? "text-amber-600 dark:text-amber-400"
            : "text-red-600 dark:text-red-400",
    },
    {
      label: "Surplus / deficit",
      value: fmt(surplus),
      sub: surplus > 0 ? "headroom" : "pressure",
      color:
        surplus > 0
          ? "text-green-700 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
    },
    {
      label: "Net vs baseline",
      value:
        netVsBaseline === 0
          ? "—"
          : (netVsBaseline < 0 ? "-" : "+") + fmt(Math.abs(netVsBaseline)),
      sub: `${derived.releasedPosts.length} released, ${derived.addedPosts.length} added`,
      color:
        netVsBaseline < 0
          ? "text-green-700 dark:text-green-400"
          : netVsBaseline > 0
            ? "text-red-600 dark:text-red-400"
            : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className={`px-3 py-2 ${i < kpis.length - 1 ? "border-r border-slate-200/60 dark:border-slate-700/50" : ""}`}
        >
          <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {k.label}
          </div>
          <div className={`text-sm font-medium ${k.color ?? "text-slate-900 dark:text-white"}`}>
            {k.value}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
