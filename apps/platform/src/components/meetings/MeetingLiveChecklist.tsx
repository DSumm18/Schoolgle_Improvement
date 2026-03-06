"use client";

import { useState, useCallback } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { MeetingChecklistItem } from "@/lib/meetings";

interface Props {
  meetingId: string;
  organizationId: string;
  items: MeetingChecklistItem[];
  onItemToggle?: (updatedItems: MeetingChecklistItem[]) => void;
}

export function MeetingLiveChecklist({
  meetingId,
  organizationId,
  items: initialItems,
  onItemToggle,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState<string | null>(null);

  const totalItems = items.length;
  const tickedItems = items.filter((i) => i.manually_ticked).length;
  const progress =
    totalItems > 0 ? Math.round((tickedItems / totalItems) * 100) : 0;
  const pastHalfway = tickedItems >= totalItems / 2;

  // Group items by category
  const grouped = new Map<string, MeetingChecklistItem[]>();
  for (const item of items) {
    const cat = item.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const handleToggle = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newTicked = !item.manually_ticked;
      const updated = items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              manually_ticked: newTicked,
              status: newTicked ? ("green" as const) : ("red" as const),
            }
          : i,
      );
      setItems(updated);
      onItemToggle?.(updated);

      setSaving(itemId);
      try {
        await fetch(`/api/meetings/${meetingId}/checklist`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            items: [{ id: itemId, manually_ticked: newTicked }],
          }),
        });
      } catch (err) {
        console.error("Failed to save checklist item:", err);
      } finally {
        setSaving(null);
      }
    },
    [items, meetingId, organizationId, onItemToggle],
  );

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Compliance Progress
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {tickedItems}/{totalItems} ({progress}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor:
                progress === 100
                  ? "#22c55e"
                  : progress >= 50
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          />
        </div>
      </div>

      {/* Checklist groups */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryItems
              .sort((a, b) => a.order_index - b.order_index)
              .map((item) => {
                const isUnticked = !item.manually_ticked;
                const showWarning =
                  isUnticked && item.is_critical && pastHalfway;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                      item.manually_ticked
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : showWarning
                          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 animate-pulse"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 transition-colors ${
                        item.manually_ticked
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                      }`}
                    >
                      {item.manually_ticked && (
                        <Check size={16} strokeWidth={3} />
                      )}
                      {saving === item.id && (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-relaxed ${
                          item.manually_ticked
                            ? "text-green-800 dark:text-green-200"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        &ldquo;{item.phrase}&rdquo;
                      </p>
                      {item.is_critical && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <AlertCircle size={12} />
                          Critical compliance item
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
