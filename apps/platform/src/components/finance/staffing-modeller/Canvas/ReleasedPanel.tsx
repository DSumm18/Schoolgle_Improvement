"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RotateCcw } from "lucide-react";
import type { ScenarioPost, StaffPost } from "@/types/staffing";
import { TIER_CONFIG } from "../tier-config";
import { fmt, postCost, DEFAULT_TIER } from "../utils";

interface ReleasedCardProps {
  scenarioPost: ScenarioPost & { staff_post: StaffPost };
  onRestore: (id: string) => void;
}

function ReleasedCard({ scenarioPost, onRestore }: ReleasedCardProps) {
  const post = scenarioPost.staff_post;
  const tier = post.tier ?? DEFAULT_TIER;
  const config = TIER_CONFIG[tier];
  const cost = postCost(scenarioPost);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `released-${scenarioPost.id}`,
    data: { type: "released", scenarioPostId: scenarioPost.id },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftWidth: 3, borderLeftColor: config.color }}
      {...listeners}
      {...attributes}
      className={`relative border border-slate-200/60 dark:border-slate-700/50 rounded-md px-2 py-1.5 pr-5 cursor-grab bg-white dark:bg-slate-900 select-none opacity-80 transition-opacity ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <span className="inline-block text-[8px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-0.5">
        Released
      </span>
      <div className="text-[11px] font-medium text-slate-900 dark:text-white line-through">
        {post.name || post.role}
      </div>
      <div className="text-[9px] text-green-700 dark:text-green-400 font-medium">
        Save {fmt(cost)}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRestore(scenarioPost.id);
        }}
        title="Restore"
        className="absolute top-1 right-1 w-3.5 h-3.5 rounded flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
      >
        <RotateCcw className="h-2.5 w-2.5 text-slate-400" />
      </button>
    </div>
  );
}

interface ReleasedPanelProps {
  releasedPosts: (ScenarioPost & { staff_post: StaffPost })[];
  onRestore: (id: string) => void;
}

export function ReleasedPanel({ releasedPosts, onRestore }: ReleasedPanelProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "released-zone",
    data: { type: "released-zone" },
  });

  return (
    <div className="flex flex-col border-r border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 w-[190px] shrink-0">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-200/60 dark:border-slate-700/50 shrink-0">
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Released posts</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{releasedPosts.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[380px] p-1.5 flex flex-col gap-1">
        <div
          ref={setNodeRef}
          className={`border border-dashed rounded-lg flex flex-col items-center justify-center gap-1 p-3 text-center text-[10px] text-slate-400 dark:text-slate-500 transition-colors ${
            isOver ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300" : "border-slate-300 dark:border-slate-600"
          } ${releasedPosts.length > 0 ? "min-h-[22px] py-1" : "min-h-[60px]"}`}
        >
          {releasedPosts.length === 0 ? (
            <>
              <span className="text-base">←</span>
              <span>Drag to release</span>
            </>
          ) : (
            <span className="text-[9px]">Drop here</span>
          )}
        </div>
        {releasedPosts.map((sp) => (
          <ReleasedCard key={sp.id} scenarioPost={sp} onRestore={onRestore} />
        ))}
      </div>
    </div>
  );
}
