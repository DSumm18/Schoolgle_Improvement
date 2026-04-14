"use client";

import React, { useState, useEffect } from "react";
import { Loader2, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { SUBJECT_COLORS, DAY_NAMES } from "@/types/lesson-studio";
import type { LessonStatus } from "@/types/lesson-studio";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlotSummary {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  plan_title?: string;
  plan_status?: string;
}

interface ClassRow {
  id: string;
  class_name: string;
  year_group: string;
  teacher_name?: string;
  slots: SlotSummary[];
}

interface WholeSchoolViewProps {
  organizationId: string;
  weekCommencing: string;
  onClassClick: (classId: string) => void;
}

// ─── Lunch stagger defaults ───────────────────────────────────────────────────

const LUNCH_STAGGER: Record<string, { start: string; end: string }> = {
  Nursery:   { start: "11:30", end: "12:00" },
  Reception: { start: "11:45", end: "12:15" },
  "Year 1":  { start: "12:00", end: "12:30" },
  "Year 2":  { start: "12:00", end: "12:30" },
  "Year 3":  { start: "12:15", end: "12:45" },
  "Year 4":  { start: "12:15", end: "12:45" },
  "Year 5":  { start: "12:30", end: "13:00" },
  "Year 6":  { start: "12:30", end: "13:00" },
};

// Derive a lunch stagger for a year group string that might not match exactly
function getLunchTime(yearGroup: string): { start: string; end: string } {
  if (LUNCH_STAGGER[yearGroup]) return LUNCH_STAGGER[yearGroup];
  // Try prefix match (e.g. "Year 2A" → "Year 2")
  for (const key of Object.keys(LUNCH_STAGGER)) {
    if (yearGroup.startsWith(key)) return LUNCH_STAGGER[key];
  }
  // Fallback
  return { start: "12:15", end: "12:45" };
}

// ─── Status dot ──────────────────────────────────────────────────────────────

const STATUS_DOT: Record<LessonStatus, string> = {
  taught:    "bg-green-500",
  planned:   "bg-blue-500",
  draft:     "bg-amber-400",
  empty:     "bg-slate-300",
  cancelled: "bg-red-400",
};

function PlanStatusDot({ status }: { status?: string }) {
  const dotClass =
    status && status in STATUS_DOT
      ? STATUS_DOT[status as LessonStatus]
      : "bg-slate-200";
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}
      title={status ?? "No plan"}
    />
  );
}

// ─── Year group ordering ──────────────────────────────────────────────────────

const YEAR_ORDER = [
  "Nursery", "Reception",
  "Year 1", "Year 2",
  "Year 3", "Year 4",
  "Year 5", "Year 6",
];

function yearSortKey(yg: string): number {
  const idx = YEAR_ORDER.findIndex((y) => yg.startsWith(y) || yg === y);
  return idx === -1 ? 99 : idx;
}

// ─── Key stage separators ─────────────────────────────────────────────────────

function getKeyStageLabel(yearGroup: string): string | null {
  if (yearGroup === "Nursery" || yearGroup === "Reception") return "EYFS";
  if (yearGroup.startsWith("Year 1") || yearGroup.startsWith("Year 2")) return "KS1";
  if (yearGroup.startsWith("Year 3") || yearGroup.startsWith("Year 4")) return "Lower KS2";
  if (yearGroup.startsWith("Year 5") || yearGroup.startsWith("Year 6")) return "Upper KS2";
  return null;
}

// ─── Build unified time columns from all slots ────────────────────────────────

interface TimeColumn {
  key: string; // "09:00-10:00" or "LUNCH"
  label: string;
  start: string;
  end: string;
  isLunch?: boolean;
}

function buildTimeColumns(classes: ClassRow[], dayOfWeek: number): TimeColumn[] {
  const seen = new Set<string>();
  const cols: TimeColumn[] = [];

  for (const cls of classes) {
    for (const slot of cls.slots) {
      if (slot.day_of_week !== dayOfWeek) continue;
      const key = `${slot.start_time}-${slot.end_time}`;
      if (!seen.has(key)) {
        seen.add(key);
        cols.push({
          key,
          label: `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`,
          start: slot.start_time,
          end: slot.end_time,
        });
      }
    }
  }

  // Sort by start time
  cols.sort((a, b) => a.start.localeCompare(b.start));

  // Inject a LUNCH separator between morning and afternoon sessions if there's a gap
  // (typically after 11:30 and before 13:15)
  const lunchInsertIdx = cols.findIndex((c) => c.start >= "13:00");
  if (lunchInsertIdx > 0) {
    cols.splice(lunchInsertIdx, 0, {
      key: "LUNCH",
      label: "Lunch",
      start: "11:30",
      end: "13:15",
      isLunch: true,
    });
  }

  return cols;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WholeSchoolView({
  organizationId,
  weekCommencing,
  onClassClick,
}: WholeSchoolViewProps) {
  const { session } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Today's day of week (1=Mon…5=Fri), default to Monday if weekend
  const todayDow = (() => {
    const d = new Date().getDay(); // 0=Sun
    if (d === 0 || d === 6) return 1;
    return d;
  })();
  const [selectedDay, setSelectedDay] = useState(todayDow);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    const headers: HeadersInit = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    fetch(
      `/api/lesson-studio/whole-school?weekCommencing=${weekCommencing}`,
      { headers },
    )
      .then((r) => r.json())
      .then((json) => {
        const data: ClassRow[] = json?.data?.classes ?? json?.classes ?? [];
        // Sort by year group order, then class name
        data.sort((a, b) => {
          const ks = yearSortKey(a.year_group) - yearSortKey(b.year_group);
          if (ks !== 0) return ks;
          return a.class_name.localeCompare(b.class_name);
        });
        setClasses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, [organizationId, weekCommencing, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        <span className="ml-2 text-sm text-slate-500">Loading whole-school view...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <GraduationCap className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No classes found for this organisation.</p>
      </div>
    );
  }

  const timeColumns = buildTimeColumns(classes, selectedDay);

  // Key stage boundary tracking
  let lastKS: string | null = null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Day selector */}
      <div className="flex items-center gap-1 p-3 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-semibold text-slate-500 mr-2">Day:</span>
        {([1, 2, 3, 4, 5] as const).map((dow) => {
          const isToday = dow === todayDow;
          const isSelected = dow === selectedDay;
          return (
            <button
              key={dow}
              onClick={() => setSelectedDay(dow)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                isSelected
                  ? "bg-teal-600 text-white shadow-sm"
                  : isToday
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {DAY_NAMES[dow].slice(0, 3)}
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Taught</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Planned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Draft</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> No plan</span>
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-36 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Class
              </th>
              {timeColumns.map((col) => (
                <th
                  key={col.key}
                  className={`text-center px-2 py-2 font-semibold ${
                    col.isLunch
                      ? "text-slate-400 bg-slate-100 w-20"
                      : "text-slate-600"
                  }`}
                >
                  {col.isLunch ? "Lunch" : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => {
              // Key stage separator row
              const ks = getKeyStageLabel(cls.year_group);
              let separatorRow: React.ReactNode = null;
              if (ks && ks !== lastKS) {
                lastKS = ks;
                separatorRow = (
                  <tr key={`ks-${ks}`} className="bg-slate-100">
                    <td
                      colSpan={1 + timeColumns.length}
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {ks}
                    </td>
                  </tr>
                );
              }

              // Build slot lookup for this day
              const slotMap = new Map<string, SlotSummary>();
              for (const slot of cls.slots) {
                if (slot.day_of_week !== selectedDay) continue;
                const key = `${slot.start_time}-${slot.end_time}`;
                slotMap.set(key, slot);
              }

              const lunch = getLunchTime(cls.year_group);

              const row = (
                <tr
                  key={cls.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  {/* Class name cell */}
                  <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 transition-colors">
                    <div className="font-semibold text-slate-800 truncate max-w-[128px]" title={cls.class_name}>
                      {cls.class_name}
                    </div>
                    <div className="text-[10px] text-slate-400">{cls.year_group}</div>
                  </td>

                  {/* Time slot cells */}
                  {timeColumns.map((col) => {
                    if (col.isLunch) {
                      // Lunch cell — show staggered time
                      return (
                        <td key="LUNCH" className="px-2 py-1.5 text-center bg-amber-50 border-x border-amber-100">
                          <div className="text-[10px] font-medium text-amber-700">
                            {lunch.start}–{lunch.end}
                          </div>
                          <div className="text-[9px] text-amber-500">Lunch</div>
                        </td>
                      );
                    }

                    const slot = slotMap.get(col.key);
                    if (!slot) {
                      return (
                        <td key={col.key} className="px-2 py-1.5 text-center bg-slate-50/60">
                          <span className="text-[10px] text-slate-300">—</span>
                        </td>
                      );
                    }

                    const colors = SUBJECT_COLORS[slot.subject] ?? {
                      bg: "bg-slate-50",
                      text: "text-slate-600",
                      border: "border-slate-200",
                    };

                    return (
                      <td key={col.key} className="px-1.5 py-1.5">
                        <button
                          onClick={() => onClassClick(cls.id)}
                          className={`w-full text-left rounded-lg px-2 py-1.5 border transition-all hover:shadow-sm hover:scale-[1.02] ${colors.bg} ${colors.border} border`}
                          title={slot.plan_title ?? slot.subject}
                        >
                          <div className="flex items-center gap-1">
                            <PlanStatusDot status={slot.plan_status} />
                            <span className={`font-semibold truncate text-[10px] leading-tight ${colors.text}`}>
                              {slot.subject}
                            </span>
                          </div>
                          {slot.plan_title && (
                            <div className="text-[9px] text-slate-500 truncate mt-0.5 leading-tight">
                              {slot.plan_title}
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );

              return (
                <React.Fragment key={cls.id}>
                  {separatorRow}
                  {row}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend footer */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center gap-4">
        <span>Click any lesson cell to open that class.</span>
        <span>Lunch times are staggered by year group.</span>
      </div>
    </div>
  );
}
