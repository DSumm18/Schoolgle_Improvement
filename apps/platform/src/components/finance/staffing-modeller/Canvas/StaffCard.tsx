"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import type { ScenarioPost, StaffPost } from "@/types/staffing";
import { TIER_CONFIG } from "../tier-config";
import { fmt, postCost, DEFAULT_TIER, SCENARIO_STATUS } from "../utils";

interface StaffCardProps {
  scenarioPost: ScenarioPost & { staff_post: StaffPost };
  onRelease: (id: string) => void;
}

export function StaffCard({ scenarioPost, onRelease }: StaffCardProps) {
  const post = scenarioPost.staff_post;
  const tier = post.tier ?? DEFAULT_TIER;
  const config = TIER_CONFIG[tier];
  const fte = scenarioPost.override_fte ?? post.fte;
  const cost = postCost(scenarioPost);
  const isNew = scenarioPost.status === SCENARIO_STATUS.ADDED;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `active-${scenarioPost.id}`,
    data: { type: "active", scenarioPostId: scenarioPost.id, tier },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), borderLeftWidth: 3, borderLeftColor: config.color }
    : { borderLeftWidth: 3, borderLeftColor: config.color };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative border border-slate-200/60 dark:border-slate-700/50 rounded-md px-2 py-1.5 pr-5 min-w-[115px] max-w-[165px] cursor-grab bg-white dark:bg-slate-900 select-none transition-opacity ${
        isDragging ? "opacity-30" : "hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="text-[11px] font-medium text-slate-900 dark:text-white truncate">
        {post.name || post.role}
      </div>
      <div className="text-[9px] text-slate-500 dark:text-slate-400">
        {post.role}
        {fte < 1 && ` (${Math.round(fte * 100)}% FTE)`}
      </div>
      {isNew && (
        <span className="inline-block text-[8px] px-1 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 mt-0.5">
          New
        </span>
      )}
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
        {fmt(cost)}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRelease(scenarioPost.id);
        }}
        className="absolute top-1 right-1 w-3.5 h-3.5 rounded flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
