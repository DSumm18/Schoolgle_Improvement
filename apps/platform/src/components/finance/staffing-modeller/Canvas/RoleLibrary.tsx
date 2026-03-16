"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TIER_CONFIG, TIER_ORDER, ROLE_LIBRARY } from "../tier-config";
import { fmt } from "../utils";
import type { Tier } from "@/types/staffing";

interface LibraryItemProps {
  item: (typeof ROLE_LIBRARY)[number];
}

function LibraryItem({ item }: LibraryItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-${item.id}`,
    data: { type: "library", libraryItem: item },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-900 cursor-grab select-none transition-opacity ${
        isDragging ? "opacity-30" : "hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="text-[11px] font-medium text-slate-900 dark:text-white">{item.role}</div>
      <div className="text-[9px] text-slate-400 dark:text-slate-500">{fmt(item.salary)}</div>
    </div>
  );
}

export function RoleLibrary() {
  const grouped = TIER_ORDER.reduce(
    (acc, tier) => {
      const items = ROLE_LIBRARY.filter((r) => r.tier === tier);
      if (items.length > 0) acc[tier] = items;
      return acc;
    },
    {} as Record<Tier, (typeof ROLE_LIBRARY)[number][]>,
  );

  return (
    <div className="flex flex-col border-l border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 w-[180px] shrink-0">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-200/60 dark:border-slate-700/50 shrink-0">
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Role library</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">drag in</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[380px] p-1.5 flex flex-col gap-0.5">
        {(Object.entries(grouped) as [Tier, (typeof ROLE_LIBRARY)[number][]][]).map(
          ([tier, items]) => (
            <div key={tier}>
              <div
                className="text-[9px] font-medium tracking-wider my-1.5"
                style={{ color: TIER_CONFIG[tier].color }}
              >
                {TIER_CONFIG[tier].label}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <LibraryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
