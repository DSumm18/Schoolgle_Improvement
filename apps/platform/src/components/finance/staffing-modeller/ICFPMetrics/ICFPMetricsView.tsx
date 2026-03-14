"use client";

import { useMemo } from "react";
import { useStaffing } from "@/store/staffingStore";
import { KPICard } from "./KPICard";
import { RiskFlag } from "./RiskFlag";
import {
  fmt,
  fk,
  pct,
  RAG_COLORS,
  ragForStaffPct,
  ragForSltPct,
  ragForTaPct,
  ragForRange,
  ragForAvgTeach,
} from "../utils";
import { TIER_CONFIG, TIER_ORDER } from "../tier-config";

export function ICFPMetricsView() {
  const { computedMetrics: m, state } = useStaffing();
  const phase = state.schoolSettings?.phase ?? "primary";

  const teachPctOfStaff = m.totalStaffingCost > 0
    ? ((m.tierBreakdown.headteacher.cost + m.tierBreakdown.slt.cost + m.tierBreakdown.teachers.cost) / m.totalStaffingCost) * 100
    : 0;
  const taPctOfStaff = m.totalStaffingCost > 0
    ? (m.tierBreakdown.tas.cost / m.totalStaffingCost) * 100
    : 0;

  const teachLo = phase === "primary" ? 78 : 72;
  const teachHi = phase === "primary" ? 82 : 78;
  const ptrLo = phase === "primary" ? 22 : 18;
  const ptrHi = phase === "primary" ? 26 : 22;

  // Compute RAG once per KPI, derive color from lookup
  const kpis = useMemo(() => {
    const staffRag = ragForStaffPct(m.staffingPct);
    const teachRag = ragForRange(teachPctOfStaff, teachLo, teachHi);
    const sltRag = ragForSltPct(m.sltPct);
    const ptrRag = ragForRange(m.pupilTeacherRatio, ptrLo, ptrHi);
    const avgRag = ragForAvgTeach(m.averageTeacherCost);
    const taRag = ragForTaPct(taPctOfStaff);

    return [
      { label: "Staffing as % of income", value: pct(m.staffingPct), target: "<80%", rag: staffRag, color: RAG_COLORS[staffRag] },
      { label: "Teaching staff % of staffing", value: pct(teachPctOfStaff), target: phase === "primary" ? "78–82%" : "72–78%", rag: teachRag, color: RAG_COLORS[teachRag] },
      { label: "SLT cost % of staffing", value: pct(m.sltPct), target: "<15%", rag: sltRag, color: RAG_COLORS[sltRag] },
      { label: "Pupil:teacher ratio", value: `${(Math.round(m.pupilTeacherRatio * 10) / 10).toFixed(1)}:1`, target: phase === "primary" ? "22–26" : "18–22", rag: ptrRag, color: RAG_COLORS[ptrRag] },
      { label: "Avg teacher cost (salary)", value: fmt(m.averageTeacherCost), target: "~£35–47k", rag: avgRag, color: RAG_COLORS[avgRag] },
      { label: "TA cost % of staffing", value: pct(taPctOfStaff), target: "<12%", rag: taRag, color: RAG_COLORS[taRag] },
    ];
  }, [m, phase, teachPctOfStaff, taPctOfStaff, teachLo, teachHi, ptrLo, ptrHi]);

  const risks = useMemo(() => {
    const r: { color: string; title: string; description: string }[] = [];
    if (m.staffingPct > 80) {
      r.push({
        color: "#E24B4A",
        title: "Staffing over 80% of income",
        description: `At ${pct(m.staffingPct)} of GAG, you have limited headroom. DfE flags this as a sustainability risk.`,
      });
    }
    if (m.sltPct > 15) {
      r.push({
        color: "#E24B4A",
        title: "SLT cost above 15% of staffing",
        description: `Senior leadership is at ${pct(m.sltPct)} of your total staff bill. Consider reviewing SLT teaching commitments.`,
      });
    }
    if (m.pupilTeacherRatio < 18 && phase === "secondary") {
      r.push({
        color: "#EF9F27",
        title: "PTR below 18 — potential over-staffing",
        description: `A ratio of ${(Math.round(m.pupilTeacherRatio * 10) / 10).toFixed(1)}:1 for secondary phase suggests more teachers than your pupil number warrants.`,
      });
    }
    if (m.pupilTeacherRatio > 28 && phase === "primary") {
      r.push({
        color: "#E24B4A",
        title: "PTR above 28 — curriculum risk",
        description: "Large class sizes may affect Ofsted judgement and curriculum quality.",
      });
    }
    if (teachPctOfStaff < 70) {
      r.push({
        color: "#EF9F27",
        title: "Teacher proportion of staff costs is low",
        description: `At ${pct(teachPctOfStaff)}, a high share of spend is on non-teaching staff. Review support staff deployment.`,
      });
    }
    if (r.length === 0) {
      r.push({
        color: "#639922",
        title: "No critical risks detected",
        description: "All ICFP metrics are within or close to DfE guidance for your school phase.",
      });
    }
    return r;
  }, [m, phase, teachPctOfStaff]);

  // Derive tier costs from TIER_CONFIG instead of duplicating colour data
  const tierCosts = useMemo(
    () =>
      TIER_ORDER.map((tier) => ({
        label: TIER_CONFIG[tier].label,
        cost: m.tierBreakdown[tier].cost,
        color: TIER_CONFIG[tier].color,
      })),
    [m],
  );

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
        ICFP key performance indicators — vs DfE benchmarks
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {kpis.map((k) => (
          <KPICard
            key={k.label}
            label={k.label}
            value={k.value}
            target={k.target}
            rag={k.rag}
            borderColor={k.color}
          />
        ))}
      </div>

      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
        Risk flags
      </div>
      <div className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg overflow-hidden">
        {risks.map((r, i) => (
          <RiskFlag key={i} color={r.color} title={r.title} description={r.description} />
        ))}
      </div>

      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
        Staffing cost breakdown
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {tierCosts.map((t) => {
          const pctOfTotal = m.totalStaffingCost > 0
            ? Math.round((t.cost / m.totalStaffingCost) * 100)
            : 0;
          return (
            <div
              key={t.label}
              className="border border-slate-200/60 dark:border-slate-700/50 rounded-md px-2 py-1.5 bg-white dark:bg-slate-900"
              style={{ borderTopWidth: 2, borderTopColor: t.color }}
            >
              <div className="text-[9px] text-slate-400 dark:text-slate-500">{t.label}</div>
              <div className="text-[13px] font-medium text-slate-900 dark:text-white">{fk(t.cost)}</div>
              <div className="h-1 rounded bg-slate-100 dark:bg-slate-800 mt-1">
                <div
                  className="h-full rounded"
                  style={{ background: t.color, width: `${pctOfTotal}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                {pctOfTotal}% of staffing
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
