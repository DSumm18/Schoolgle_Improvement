"use client";

import { useMemo } from "react";
import { useStaffing } from "@/store/staffingStore";
import { KPICard } from "./KPICard";
import { RiskFlag } from "./RiskFlag";

const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
const fk = (n: number) => "£" + Math.round(n / 1000) + "k";
const pct = (n: number) => (Math.round(n * 10) / 10).toFixed(1) + "%";

type RAG = "green" | "amber" | "red";

function ragForStaffPct(val: number): RAG {
  return val < 80 ? "green" : val < 85 ? "amber" : "red";
}
function ragForSltPct(val: number): RAG {
  return val < 15 ? "green" : val < 18 ? "amber" : "red";
}
function ragForTaPct(val: number): RAG {
  return val < 12 ? "green" : val < 15 ? "amber" : "red";
}
function ragForRange(val: number, lo: number, hi: number): RAG {
  if (val >= lo && val <= hi) return "green";
  if (Math.abs(val - (lo + hi) / 2) < 5) return "amber";
  return "red";
}
function ragForAvgTeach(val: number): RAG {
  return val >= 30000 && val <= 48000 ? "green" : "amber";
}

const TIER_COLORS = [
  { label: "Headteacher", color: "#534AB7" },
  { label: "SLT", color: "#0F6E56" },
  { label: "Teachers", color: "#185FA5" },
  { label: "TAs", color: "#3B6D11" },
  { label: "Support", color: "#854F0B" },
] as const;

export function ICFPMetricsView() {
  const { computedMetrics: m, state } = useStaffing();
  const phase = state.schoolSettings?.phase ?? "primary";
  const roll = state.schoolSettings?.roll ?? 420;

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

  const kpis = [
    {
      label: "Staffing as % of income",
      value: pct(m.staffingPct),
      target: "<80%",
      rag: ragForStaffPct(m.staffingPct),
      color: ragForStaffPct(m.staffingPct) === "green" ? "#3B6D11" : ragForStaffPct(m.staffingPct) === "amber" ? "#854F0B" : "#A32D2D",
    },
    {
      label: "Teaching staff % of staffing",
      value: pct(teachPctOfStaff),
      target: phase === "primary" ? "78–82%" : "72–78%",
      rag: ragForRange(teachPctOfStaff, teachLo, teachHi),
      color: ragForRange(teachPctOfStaff, teachLo, teachHi) === "green" ? "#3B6D11" : ragForRange(teachPctOfStaff, teachLo, teachHi) === "amber" ? "#854F0B" : "#A32D2D",
    },
    {
      label: "SLT cost % of staffing",
      value: pct(m.sltPct),
      target: "<15%",
      rag: ragForSltPct(m.sltPct),
      color: ragForSltPct(m.sltPct) === "green" ? "#3B6D11" : ragForSltPct(m.sltPct) === "amber" ? "#854F0B" : "#A32D2D",
    },
    {
      label: "Pupil:teacher ratio",
      value: `${(Math.round(m.pupilTeacherRatio * 10) / 10).toFixed(1)}:1`,
      target: phase === "primary" ? "22–26" : "18–22",
      rag: ragForRange(m.pupilTeacherRatio, ptrLo, ptrHi),
      color: ragForRange(m.pupilTeacherRatio, ptrLo, ptrHi) === "green" ? "#3B6D11" : ragForRange(m.pupilTeacherRatio, ptrLo, ptrHi) === "amber" ? "#854F0B" : "#A32D2D",
    },
    {
      label: "Avg teacher cost (salary)",
      value: fmt(m.averageTeacherCost),
      target: "~£35–47k",
      rag: ragForAvgTeach(m.averageTeacherCost),
      color: ragForAvgTeach(m.averageTeacherCost) === "green" ? "#3B6D11" : "#854F0B",
    },
    {
      label: "TA cost % of staffing",
      value: pct(taPctOfStaff),
      target: "<12%",
      rag: ragForTaPct(taPctOfStaff),
      color: ragForTaPct(taPctOfStaff) === "green" ? "#3B6D11" : ragForTaPct(taPctOfStaff) === "amber" ? "#854F0B" : "#A32D2D",
    },
  ];

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

  const tierCosts = [
    { label: "Headteacher", cost: m.tierBreakdown.headteacher.cost, color: "#534AB7" },
    { label: "SLT", cost: m.tierBreakdown.slt.cost, color: "#0F6E56" },
    { label: "Teachers", cost: m.tierBreakdown.teachers.cost, color: "#185FA5" },
    { label: "TAs", cost: m.tierBreakdown.tas.cost, color: "#3B6D11" },
    { label: "Support", cost: m.tierBreakdown.support.cost, color: "#854F0B" },
  ];

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* KPI Grid */}
      <div>
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
      </div>

      {/* Risk flags */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
          Risk flags
        </div>
        <div className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg overflow-hidden">
          {risks.map((r, i) => (
            <RiskFlag key={i} color={r.color} title={r.title} description={r.description} />
          ))}
        </div>
      </div>

      {/* Cost breakdown bars */}
      <div>
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
    </div>
  );
}
