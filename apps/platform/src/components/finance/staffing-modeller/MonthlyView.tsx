"use client";

import { useMemo } from "react";
import { useStaffing } from "@/store/staffingStore";
import { TIER_CONFIG, CODE_ORDER, DFE_CODES, MONTHS } from "./tier-config";
import { fmt, fk, DEFAULT_TIER } from "./utils";
import type { StaffPost, Tier } from "@/types/staffing";

function monthCost(
  post: StaffPost,
  overrideFte: number | null,
  overrideSalary: number | null,
  m: number,
  payRate: number,
  awardMonth: number,
) {
  const fte = overrideFte ?? post.fte;
  const salary = overrideSalary ?? post.salary;
  const fyIdx = m % 12;
  const yrIdx = Math.floor(m / 12);
  const awardsApplied = yrIdx + (fyIdx >= awardMonth ? 1 : 0);
  const mult = Math.pow(1 + payRate, awardsApplied);
  const monthly = (salary * fte * mult * (1 + post.on_cost_rate)) / 12;

  let lump = 0;
  if (fyIdx === awardMonth && awardMonth > 0) {
    const prevMult = Math.pow(1 + payRate, yrIdx);
    const inc = ((salary * fte * (1 + post.on_cost_rate)) / 12) * (mult - prevMult);
    lump = inc * awardMonth;
  }

  return {
    monthly,
    lump,
    isAward: fyIdx === awardMonth,
    isBack: fyIdx === awardMonth && awardMonth > 0,
  };
}

export function MonthlyView() {
  const { derived } = useStaffing();
  const { activePosts } = derived;

  // Default pay config — in production wired from PayAssumptionsBar
  const payConfig: Record<string, { rate: number; mo: number }> = {
    head: { rate: 0.055, mo: 8 },
    teacher: { rate: 0.055, mo: 8 },
    support: { rate: 0.04, mo: 3 },
  };

  const getPayGroup = (tier: Tier) => TIER_CONFIG[tier].payGroup;
  const getCode = (tier: Tier) => TIER_CONFIG[tier].dfeCode;
  const yr = new Date().getFullYear();

  const visCodes = useMemo(
    () => CODE_ORDER.filter((c) => activePosts.some((sp) => getCode(sp.staff_post.tier ?? DEFAULT_TIER) === c)),
    [activePosts],
  );

  const moData = useMemo(() => {
    const data: {
      m: number;
      fyIdx: number;
      label: string;
      byCode: Record<string, number>;
      total: number;
      awards: Record<string, boolean>;
      back: Record<string, boolean>;
    }[] = [];

    for (let m = 0; m < 36; m++) {
      const fyIdx = m % 12;
      const yrIdx = Math.floor(m / 12);
      const label = MONTHS[fyIdx] + " " + (yr + yrIdx);
      const byCode: Record<string, number> = {};
      const awards: Record<string, boolean> = {};
      const back: Record<string, boolean> = {};
      let total = 0;

      visCodes.forEach((c) => { byCode[c] = 0; });

      activePosts.forEach((sp) => {
        const tier = sp.staff_post.tier ?? DEFAULT_TIER;
        const pg = getPayGroup(tier);
        const pay = payConfig[pg];
        const code = getCode(tier);
        const r = monthCost(sp.staff_post, sp.override_fte, sp.override_salary, m, pay.rate, pay.mo);
        byCode[code] = (byCode[code] || 0) + r.monthly + r.lump;
        total += r.monthly + r.lump;
        if (r.isAward) awards[code] = true;
        if (r.isBack) back[code] = true;
      });

      data.push({ m, fyIdx, label, byCode, total, awards, back });
    }

    return data;
  }, [activePosts, visCodes, yr]);

  return (
    <div className="p-3 overflow-x-auto">
      {/* Legend */}
      <div className="flex gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-200" />
          Pay award month
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" />
          Backdate lump
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
          £000s. Blue line = new financial year.
        </div>
      </div>

      <table className="border-collapse text-[10px] w-max">
        <thead>
          <tr>
            <th className="px-1.5 py-1 text-left bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 sticky left-0 z-10 min-w-[50px]">
              Code
            </th>
            <th className="px-1.5 py-1 text-left bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 sticky left-[50px] z-10 min-w-[60px]">
              Category
            </th>
            {moData.map((r) => {
              const isYearBreak = r.fyIdx === 0 && r.m > 0;
              return (
                <th
                  key={r.m}
                  className={`px-1.5 py-1 text-right bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 whitespace-nowrap ${
                    isYearBreak ? "border-l-2 border-l-blue-400" : ""
                  }`}
                >
                  {r.label}
                </th>
              );
            })}
            <th className="px-1.5 py-1 text-right bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50">
              3yr total
            </th>
          </tr>
        </thead>
        <tbody>
          {visCodes.map((code) => {
            const cd = DFE_CODES[code as keyof typeof DFE_CODES];
            let tally = 0;

            return (
              <tr key={code}>
                <td className="px-1.5 py-0.5 text-left font-medium border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-900 sticky left-0 z-10">
                  <span
                    className="text-[8px] font-medium px-1 py-0.5 rounded"
                    style={{ background: cd.bg, color: cd.col }}
                  >
                    {code}
                  </span>
                </td>
                <td className="px-1.5 py-0.5 text-left text-[9px] text-slate-400 border border-slate-200/60 dark:border-slate-700/50 sticky left-[50px] z-10 bg-white dark:bg-slate-900">
                  {cd.label}
                </td>
                {moData.map((r) => {
                  const v = r.byCode[code] || 0;
                  tally += v;
                  const isBack = r.back[code];
                  const isAward = r.awards[code];
                  const isYearBreak = r.fyIdx === 0 && r.m > 0;
                  const cellClass = isBack
                    ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                    : isAward
                      ? "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                      : "";

                  return (
                    <td
                      key={r.m}
                      className={`px-1.5 py-0.5 text-right border border-slate-200/60 dark:border-slate-700/50 whitespace-nowrap ${cellClass} ${
                        isYearBreak ? "border-l-2 border-l-blue-400" : ""
                      }`}
                    >
                      {fk(v)}
                    </td>
                  );
                })}
                <td className="px-1.5 py-0.5 text-right font-medium border border-slate-200/60 dark:border-slate-700/50 border-l-2 border-l-slate-300 dark:border-l-slate-600">
                  {fmt(tally)}
                </td>
              </tr>
            );
          })}

          {/* Total row */}
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <td className="px-1.5 py-0.5 text-left font-medium border border-slate-200/60 dark:border-slate-700/50 sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50">
              Total
            </td>
            <td className="px-1.5 py-0.5 text-left text-[9px] text-slate-400 border border-slate-200/60 dark:border-slate-700/50 sticky left-[50px] z-10 bg-slate-50 dark:bg-slate-800/50">
              All codes
            </td>
            {moData.map((r) => {
              const isYearBreak = r.fyIdx === 0 && r.m > 0;
              return (
                <td
                  key={r.m}
                  className={`px-1.5 py-0.5 text-right font-medium border border-slate-200/60 dark:border-slate-700/50 ${
                    isYearBreak ? "border-l-2 border-l-blue-400" : ""
                  }`}
                >
                  {fk(r.total)}
                </td>
              );
            })}
            <td className="px-1.5 py-0.5 text-right font-medium border border-slate-200/60 dark:border-slate-700/50 border-l-2 border-l-slate-300 dark:border-l-slate-600">
              {fmt(moData.reduce((a, r) => a + r.total, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
