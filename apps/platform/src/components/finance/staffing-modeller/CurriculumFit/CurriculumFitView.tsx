"use client";

import { useState, useMemo } from "react";
import { useStaffing } from "@/store/staffingStore";

export function CurriculumFitView() {
  const { computedMetrics: m, state } = useStaffing();
  const phase = state.schoolSettings?.phase ?? "primary";
  const roll = state.schoolSettings?.roll ?? 420;

  const [periods, setPeriods] = useState(25);
  const [classSize, setClassSize] = useState(28);
  const [contactPct, setContactPct] = useState(80);
  const [sltTeachPct, setSltTeachPct] = useState(25);
  const [yearGroups, setYearGroups] = useState(phase === "secondary" ? 7 : 6);

  const calc = useMemo(() => {
    const contact = contactPct / 100;
    const sltTeach = sltTeachPct / 100;
    const lessonsPerWeek = yearGroups * (phase === "secondary" ? 30 : periods);
    const teacherWeeklyPeriods = periods * contact;
    const teachersNeeded = Math.round((lessonsPerWeek / teacherWeeklyPeriods) * 10) / 10;

    const sltFte = m.tierBreakdown.slt.fte;
    const sltTeachEquiv = Math.round(sltFte * sltTeach * 10) / 10;
    const totalTeachingCapacity = Math.round((m.teacherFte + sltTeachEquiv) * 10) / 10;

    const avgTeachCostFull =
      m.tierBreakdown.teachers.count > 0
        ? m.tierBreakdown.teachers.cost / m.tierBreakdown.teachers.count
        : 40000 * 1.428;
    const teacherBudget = m.totalIncome * 0.55;
    const teachersAffordable = Math.round((teacherBudget / avgTeachCostFull) * 10) / 10;

    const gap = Math.round((totalTeachingCapacity - teachersNeeded) * 10) / 10;
    const afford = Math.round((teachersAffordable - teachersNeeded) * 10) / 10;

    return {
      teachersNeeded,
      totalTeachingCapacity,
      sltTeachEquiv,
      teachersAffordable,
      gap,
      afford,
      contact,
    };
  }, [m, periods, contactPct, sltTeachPct, yearGroups, phase]);

  const inputs = [
    { label: "Timetabled periods per week", value: periods, set: setPeriods, min: 10, max: 60 },
    { label: "Average class size", value: classSize, set: setClassSize, min: 10, max: 35 },
    { label: "Teacher contact ratio (%)", value: contactPct, set: setContactPct, min: 50, max: 95 },
    { label: "SLT teaching % (of their time)", value: sltTeachPct, set: setSltTeachPct, min: 0, max: 80 },
    { label: "Year groups in school", value: yearGroups, set: setYearGroups, min: 1, max: 14 },
  ];

  const gapColor = calc.gap >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400";

  const cards = [
    {
      label: "Teachers needed",
      value: calc.teachersNeeded,
      sub: "FTE to deliver curriculum",
      borderColor: "#185FA5",
    },
    {
      label: "Current capacity",
      value: calc.totalTeachingCapacity,
      sub: `incl. ${calc.sltTeachEquiv} SLT equiv.`,
      borderColor: "#0F6E56",
    },
    {
      label: "Gap / surplus",
      value: (calc.gap > 0 ? "+" : "") + calc.gap,
      sub: calc.gap >= 0 ? "capacity to spare" : "shortage — review timetable",
      borderColor: calc.gap >= 0 ? "#3B6D11" : "#A32D2D",
      valueColor: gapColor,
    },
    {
      label: "Affordable (55% of income)",
      value: calc.teachersAffordable,
      sub: calc.afford >= 0 ? "within budget" : `${Math.abs(calc.afford)} FTE over budget`,
      borderColor: "#534AB7",
      subDanger: calc.afford < -1,
    },
  ];

  const ratios = [
    {
      label: "Pupil:teacher ratio",
      value: `${(Math.round(m.pupilTeacherRatio * 10) / 10).toFixed(1)}`,
      bench: "22–26 primary / 18–22 secondary",
    },
    {
      label: "Contact ratio",
      value: `${contactPct}%`,
      bench: "DfE suggests 75–85%",
    },
    {
      label: "SLT teaching contribution",
      value: `${calc.sltTeachEquiv} FTE equiv`,
      bench: "Higher = lower TA/supply need",
    },
    {
      label: "Average class size",
      value: `${classSize}`,
      bench: "Ofsted focus: 30 statutory max",
    },
  ];

  return (
    <div className="p-3 grid grid-cols-[240px_1fr] gap-3">
      {/* Inputs */}
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider">
          Curriculum assumptions
        </div>
        {inputs.map((inp) => (
          <div key={inp.label} className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-500 dark:text-slate-400">{inp.label}</label>
            <input
              type="number"
              value={inp.value}
              onChange={(e) => inp.set(parseInt(e.target.value) || 0)}
              min={inp.min}
              max={inp.max}
              className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-3">
        {/* Four result cards */}
        <div className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg p-3 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-2">
            Curriculum requirement vs capacity
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <div
                key={c.label}
                className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900"
                style={{ borderLeftWidth: 3, borderLeftColor: c.borderColor }}
              >
                <div className="text-[9px] text-slate-400 dark:text-slate-500">{c.label}</div>
                <div className={`text-[28px] font-medium leading-none ${c.valueColor ?? "text-slate-900 dark:text-white"}`}>
                  {c.value}
                </div>
                <div className={`text-[9px] mt-0.5 ${c.subDanger ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {c.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ratios table */}
        <div className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg p-3 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider mb-2">
            Key ratios
          </div>
          <div className="flex flex-col gap-2">
            {ratios.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
              >
                <span className="text-[11px] text-slate-700 dark:text-slate-300">{r.label}</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-slate-900 dark:text-white">{r.value}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">{r.bench}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
