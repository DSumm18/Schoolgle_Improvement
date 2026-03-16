"use client";

import { useStaffing } from "@/store/staffingStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ScenarioTabs() {
  const { state, switchScenario } = useStaffing();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {state.scenarios.map((sc) => (
        <button
          key={sc.id}
          onClick={() => switchScenario(sc.id)}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
            sc.id === state.activeScenarioId
              ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          {sc.name}
          {sc.is_baseline && (
            <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-[#0F6E56]/10 text-[#0F6E56]">
              baseline
            </span>
          )}
        </button>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
        <Plus className="h-3 w-3" />
        Scenario
      </Button>
    </div>
  );
}
