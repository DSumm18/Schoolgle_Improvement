"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ScenarioPost, StaffPost, Tier } from "@/types/staffing";
import { TIER_CONFIG } from "../tier-config";
import { fmt } from "../utils";
import { StaffCard } from "./StaffCard";

interface TierSectionProps {
  tier: Tier;
  posts: (ScenarioPost & { staff_post: StaffPost })[];
  payRate: number;
  onRelease: (id: string) => void;
}

export function TierSection({ tier, posts, payRate, onRelease }: TierSectionProps) {
  const config = TIER_CONFIG[tier];
  const activePosts = posts.filter((p) => p.status !== "released");
  const totalCost = activePosts.reduce((a, sp) => {
    const fte = sp.override_fte ?? sp.staff_post.fte;
    const salary = sp.override_salary ?? sp.staff_post.salary;
    return a + fte * salary * (1 + sp.staff_post.on_cost_rate);
  }, 0);

  const { isOver, setNodeRef } = useDroppable({
    id: `tier-${tier}`,
    data: { type: "tier", tier },
  });

  return (
    <div className="border-b border-slate-200/60 dark:border-slate-700/50">
      {/* Tier header */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: config.color }} />
        <span className="text-[11px] font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500">{activePosts.length}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 ml-1">
          {payRate.toFixed(1)}%
        </span>
        {activePosts.length > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            {fmt(totalCost)}
          </span>
        )}
      </div>

      {/* Drop zone / cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-wrap gap-1.5 p-2 min-h-[38px] transition-colors ${
          isOver ? "bg-blue-50 dark:bg-blue-900/10" : ""
        }`}
      >
        {activePosts.length === 0 ? (
          <div className="w-full border border-dashed border-slate-300 dark:border-slate-600 rounded-md py-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500">
            Drop roles here
          </div>
        ) : (
          activePosts.map((sp) => (
            <StaffCard key={sp.id} scenarioPost={sp} onRelease={onRelease} />
          ))
        )}
      </div>
    </div>
  );
}
