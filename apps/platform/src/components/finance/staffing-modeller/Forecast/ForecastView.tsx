"use client";

import { useMemo } from "react";
import { useStaffing } from "@/store/staffingStore";
import { TIER_CONFIG, TIER_ORDER, CODE_ORDER, DFE_CODES } from "../tier-config";
import { fmt, DEFAULT_TIER } from "../utils";
import type { ScenarioPost, StaffPost, Tier } from "@/types/staffing";

function projAnnual(
  post: StaffPost,
  overrideFte: number | null,
  overrideSalary: number | null,
  year: number,
  payRate: number,
): number {
  const fte = overrideFte ?? post.fte;
  const salary = overrideSalary ?? post.salary;
  return fte * salary * Math.pow(1 + payRate, year) * (1 + post.on_cost_rate);
}

const getRate = (tier: Tier) => {
  const pg = TIER_CONFIG[tier].payGroup;
  const rates: Record<string, number> = { head: 0.055, teacher: 0.055, support: 0.04 };
  return rates[pg] ?? 0.05;
};

const getCode = (tier: Tier) => TIER_CONFIG[tier].dfeCode;

export function ForecastView() {
  const { state, derived } = useStaffing();
  const roll = state.schoolSettings?.roll ?? 420;
  const gag = state.schoolSettings?.gag_per_pupil ?? 5200;
  const income = roll * gag;

  const { activePosts } = derived;
  const baselinePosts = state.staffPosts;

  const yr = new Date().getFullYear();
  const years = [
    `${yr}/${(yr + 1).toString().slice(-2)}`,
    `${yr + 1}/${(yr + 2).toString().slice(-2)}`,
    `${yr + 2}/${(yr + 3).toString().slice(-2)}`,
  ];

  // Memoize all projections in a single pass
  const projections = useMemo(() => {
    const bv = [1, 2, 3].map((Y) =>
      baselinePosts.reduce((a, p) => a + p.fte * p.salary * Math.pow(1 + getRate(p.tier ?? DEFAULT_TIER), Y) * (1 + p.on_cost_rate), 0),
    );
    const mv = [1, 2, 3].map((Y) =>
      activePosts.reduce((a, sp) => a + projAnnual(sp.staff_post, sp.override_fte, sp.override_salary, Y, getRate(sp.staff_post.tier ?? DEFAULT_TIER)), 0),
    );

    // Per-post projections for the table
    const perPost = activePosts.map((sp) => {
      const tier = sp.staff_post.tier ?? DEFAULT_TIER;
      const rate = getRate(tier);
      return [1, 2, 3].map((Y) => projAnnual(sp.staff_post, sp.override_fte, sp.override_salary, Y, rate));
    });

    // DfE code breakdown
    const codeData = CODE_ORDER.map((code) => {
      const indices = activePosts
        .map((sp, i) => (getCode(sp.staff_post.tier ?? DEFAULT_TIER) === code ? i : -1))
        .filter((i) => i >= 0);
      if (indices.length === 0) return null;
      const totals = [0, 1, 2].map((yi) => indices.reduce((a, i) => a + perPost[i][yi], 0));
      return { code, ...DFE_CODES[code as keyof typeof DFE_CODES], count: indices.length, totals };
    }).filter(Boolean) as { code: string; label: string; col: string; bg: string; count: number; totals: number[] }[];

    return { bv, mv, perPost, codeData };
  }, [activePosts, baselinePosts]);

  const { bv, mv, perPost, codeData } = projections;

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Year cards */}
      <div className="grid grid-cols-3 gap-2">
        {years.map((y, i) => {
          const d = mv[i] - bv[i];
          const sp = income > 0 ? (mv[i] / income) * 100 : 0;
          const dColor = d < 0 ? "text-green-700 dark:text-green-400" : d > 0 ? "text-red-600 dark:text-red-400" : "";
          const barColor = sp < 80 ? "#3B6D11" : sp < 85 ? "#EF9F27" : "#E24B4A";

          return (
            <div key={y} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-lg p-2.5">
              <div className="text-[9px] text-slate-400 dark:text-slate-500 mb-1.5">
                Year {i + 1} &middot; {y}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500">Baseline</div>
                  <div className="text-[13px] font-medium text-slate-900 dark:text-white">{fmt(bv[i])}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500">Scenario</div>
                  <div className={`text-[13px] font-medium ${dColor}`}>{fmt(mv[i])}</div>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500">
                Staffing {Math.round(sp)}% of income
              </div>
              <div className="h-1 rounded bg-slate-200 dark:bg-slate-700 mt-1">
                <div
                  className="h-full rounded transition-all"
                  style={{ background: barColor, width: `${Math.min(sp, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* DfE code breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {codeData.map((cd) => (
          <div key={cd.code} className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg overflow-hidden">
            <div className="px-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1.5">
              <span
                className="text-[9px] font-medium px-1 py-0.5 rounded"
                style={{ background: cd.bg, color: cd.col }}
              >
                {cd.code}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{cd.label}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-auto">{cd.count} staff</span>
            </div>
            <div className="px-2 py-1.5">
              {years.map((y, i) => {
                const chg = i > 0 ? cd.totals[i] - cd.totals[i - 1] : 0;
                return (
                  <div key={y} className="flex justify-between items-baseline py-0.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{y}</span>
                    <span className="text-[11px] font-medium text-slate-900 dark:text-white">{fmt(cd.totals[i])}</span>
                    {i > 0 && (
                      <span className={`text-[9px] ${chg > 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                        {chg > 0 ? "+" : ""}{fmt(chg)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role table */}
      <div className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {["Name", "Role", "Code", "Pay", "Current salary", ...years].map((h, i) => (
                <th
                  key={h}
                  className={`px-2 py-1.5 font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/50 ${i > 3 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activePosts.map((sp, ri) => {
              const p = sp.staff_post;
              const tier = p.tier ?? DEFAULT_TIER;
              const config = TIER_CONFIG[tier];
              const code = config.dfeCode;
              const cd = DFE_CODES[code as keyof typeof DFE_CODES];
              const rate = getRate(tier);
              const fte = sp.override_fte ?? p.fte;
              const salary = sp.override_salary ?? p.salary;

              return (
                <tr key={sp.id} className={ri % 2 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}>
                  <td className="px-2 py-1 font-medium text-slate-900 dark:text-white">{p.name || p.role}</td>
                  <td className="px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400">{p.role}</td>
                  <td className="px-2 py-1">
                    <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: cd.bg, color: cd.col }}>
                      {code}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-[9px] text-slate-500 dark:text-slate-400">{(rate * 100).toFixed(1)}%</td>
                  <td className="px-2 py-1 text-right">{fmt(salary * fte)}</td>
                  {perPost[ri].map((cost, yi) => (
                    <td key={yi} className="px-2 py-1 text-right text-blue-700 dark:text-blue-400">
                      {fmt(cost)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-300 dark:border-slate-600">
              <td colSpan={4} className="px-2 py-1 font-medium">Total (incl. on-costs)</td>
              <td className="px-2 py-1 text-right font-medium">
                {fmt(activePosts.reduce((a, sp) => {
                  const fte = sp.override_fte ?? sp.staff_post.fte;
                  const salary = sp.override_salary ?? sp.staff_post.salary;
                  return a + fte * salary * (1 + sp.staff_post.on_cost_rate);
                }, 0))}
              </td>
              {mv.map((v, i) => (
                <td key={i} className="px-2 py-1 text-right font-medium">{fmt(v)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
