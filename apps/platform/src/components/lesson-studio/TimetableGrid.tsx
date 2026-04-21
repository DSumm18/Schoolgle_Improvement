"use client";

import React from "react";
import { Sparkles, Check, FileText, Clock, X } from "lucide-react";
import type { LSTimetableSlot, LSLessonPlan, LessonStatus } from "@/types/lesson-studio";
import { SUBJECT_COLORS, STATUS_CONFIG, DAY_NAMES } from "@/types/lesson-studio";

export interface SlotAllocation {
  title: string;
  position: number;
  unitName: string;
  learningFocus: string;
  ncCode?: string | null;
}

interface TimetableGridProps {
  slots: LSTimetableSlot[];
  plans: LSLessonPlan[];
  onSlotClick: (slot: LSTimetableSlot, plan: LSLessonPlan | null) => void;
  onGenerate: (slot: LSTimetableSlot) => void;
  generating: string | null; // slot id currently generating
  allocations?: Record<string, SlotAllocation>; // keyed by slot.id
}

const STATUS_ICONS: Record<LessonStatus, React.ReactNode> = {
  empty: null,
  draft: <FileText className="w-3 h-3" />,
  planned: <Check className="w-3 h-3" />,
  taught: <Check className="w-3 h-3" />,
  cancelled: <X className="w-3 h-3" />,
};

export function TimetableGrid({ slots, plans, onSlotClick, onGenerate, generating, allocations = {} }: TimetableGridProps) {
  const planMap = new Map(plans.map((p) => [`${p.day_of_week}-${p.subject}`, p]));
  const days = [1, 2, 3, 4, 5];

  // Group slots by day
  const slotsByDay = new Map<number, LSTimetableSlot[]>();
  for (const slot of slots) {
    const arr = slotsByDay.get(slot.day_of_week) ?? [];
    arr.push(slot);
    slotsByDay.set(slot.day_of_week, arr);
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {/* Day headers */}
      {days.map((d) => (
        <div key={d} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1">
          {DAY_NAMES[d]}
        </div>
      ))}

      {/* Slot cards per day */}
      {days.map((day) => (
        <div key={day} className="space-y-1.5">
          {(slotsByDay.get(day) ?? []).map((slot) => {
            const plan = planMap.get(`${slot.day_of_week}-${slot.subject}`);
            const status = plan?.status ?? "empty";
            const sc = STATUS_CONFIG[status];
            const subjectColor = SUBJECT_COLORS[slot.subject] ?? SUBJECT_COLORS.English;
            const isGenerating = generating === slot.id;
            const allocation = allocations[slot.id];

            return (
              <div
                key={slot.id}
                className={`relative rounded-xl border p-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${subjectColor.border} ${subjectColor.bg}`}
                onClick={() => (plan ? onSlotClick(slot, plan) : onSlotClick(slot, null))}
              >
                {/* Time */}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <Clock className="w-2.5 h-2.5" />
                  {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                </div>

                {/* Subject */}
                <div className={`text-sm font-bold mt-0.5 ${subjectColor.text}`}>
                  {slot.subject}
                </div>

                {/* Plan title or allocated lesson or generate button */}
                {plan ? (
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                    {plan.title}
                  </div>
                ) : allocation ? (
                  <div className="mt-0.5">
                    <div className="text-[10px] text-slate-700 dark:text-slate-200 font-medium leading-tight line-clamp-2">
                      {allocation.title}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Lesson {allocation.position} &middot; {allocation.unitName}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerate(slot);
                    }}
                    disabled={isGenerating}
                    className="mt-1 flex items-center gap-1 text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                )}

                {/* Status badge */}
                {status !== "empty" && (
                  <div className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    {STATUS_ICONS[status]}
                    {sc.label}
                  </div>
                )}

                {/* Room */}
                {slot.room && (
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {slot.room}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
