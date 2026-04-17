"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, GraduationCap, Printer, Calendar } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
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

interface SchoolCalendarEvent {
  id: string;
  title: string;
  event_type?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

interface WholeSchoolViewProps {
  organizationId: string;
  weekCommencing: string;
  onClassClick: (classId: string) => void;
}

// ─── Lunch stagger defaults ───────────────────────────────────────────────────

const CONNECTOR_BADGES: Record<string, { icon: string; label: string; bg: string }> = {
  "dsl": { icon: "🛡️", label: "DSL", bg: "bg-purple-100 text-purple-700" },
  "deputy-dsl": { icon: "🛡️", label: "Deputy DSL", bg: "bg-purple-50 text-purple-600" },
  "senco": { icon: "🧩", label: "SENCO", bg: "bg-blue-100 text-blue-700" },
  "first-aider": { icon: "🩹", label: "First Aider", bg: "bg-green-100 text-green-700" },
  "paediatric-first-aider": { icon: "👶🩹", label: "Paediatric FA", bg: "bg-green-100 text-green-700" },
  "fire-marshal": { icon: "🔥", label: "Fire Marshal", bg: "bg-orange-100 text-orange-700" },
  "dpo": { icon: "🔒", label: "DPO", bg: "bg-slate-100 text-slate-700" },
  "mental-health-lead": { icon: "💚", label: "MH Lead", bg: "bg-emerald-100 text-emerald-700" },
  "eyfs-lead": { icon: "🌱", label: "EYFS Lead", bg: "bg-teal-100 text-teal-700" },
  "online-safety-lead": { icon: "🌐", label: "Online Safety", bg: "bg-cyan-100 text-cyan-700" },
  "prevent-lead": { icon: "⚠️", label: "Prevent", bg: "bg-amber-100 text-amber-700" },
  "h-and-s-lead": { icon: "🦺", label: "H&S Lead", bg: "bg-yellow-100 text-yellow-700" },
};

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

function getLunchTime(yearGroup: string): { start: string; end: string } {
  if (LUNCH_STAGGER[yearGroup]) return LUNCH_STAGGER[yearGroup];
  for (const key of Object.keys(LUNCH_STAGGER)) {
    if (yearGroup.startsWith(key)) return LUNCH_STAGGER[key];
  }
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
  key: string;
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

  cols.sort((a, b) => a.start.localeCompare(b.start));

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

// ─── Time overlap check for school events ────────────────────────────────────

function timeOverlaps(
  evtStart: string | undefined,
  evtEnd: string | undefined,
  colStart: string,
  colEnd: string,
): boolean {
  if (!evtStart || !evtEnd) return false;
  // Normalise to HH:MM for comparison
  const es = evtStart.slice(0, 5);
  const ee = evtEnd.slice(0, 5);
  const cs = colStart.slice(0, 5);
  const ce = colEnd.slice(0, 5);
  return es < ce && ee > cs;
}

// ─── Format selected date for display ────────────────────────────────────────

function formatDisplayDate(weekCommencing: string, selectedDay: number): string {
  const d = new Date(weekCommencing);
  d.setDate(d.getDate() + (selectedDay - 1));
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getEventDateStr(weekCommencing: string, selectedDay: number): string {
  const d = new Date(weekCommencing);
  d.setDate(d.getDate() + (selectedDay - 1));
  return d.toISOString().split("T")[0];
}

// ─── Event type badge colours ────────────────────────────────────────────────

function eventBadgeClass(eventType?: string): string {
  switch (eventType) {
    case "trip":         return "bg-green-100 text-green-700";
    case "visitor":      return "bg-purple-100 text-purple-700";
    case "inspection":   return "bg-red-100 text-red-700";
    case "training":     return "bg-orange-100 text-orange-700";
    case "celebration":  return "bg-pink-100 text-pink-700";
    default:             return "bg-indigo-100 text-indigo-700";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WholeSchoolView({
  organizationId,
  weekCommencing,
  onClassClick,
}: WholeSchoolViewProps) {
  const { session } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolCalendarEvent[]>([]);
  const [connectors, setConnectors] = useState<Record<string, Array<{ type: string; area?: string; expiring?: boolean }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Today's day of week (1=Mon…5=Fri), default to Monday if weekend
  const todayDow = (() => {
    const d = new Date().getDay(); // 0=Sun
    if (d === 0 || d === 6) return 1;
    return d;
  })();
  const [selectedDay, setSelectedDay] = useState(todayDow);

  const fetchEvents = useCallback(
    (day: number) => {
      if (!organizationId) return;
      const dateStr = getEventDateStr(weekCommencing, day);
      supabase
        .from("school_calendar_events")
        .select("id, title, event_type, start_date, end_date, start_time, end_time")
        .eq("organization_id", organizationId)
        .lte("start_date", dateStr)
        .gte("end_date", dateStr)
        .then(({ data }) => setSchoolEvents(data || []));
    },
    [organizationId, weekCommencing],
  );

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    const headers: HeadersInit = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    fetch(
      `/api/lesson-studio/whole-school?weekCommencing=${weekCommencing}&organizationId=${organizationId}`,
      { headers },
    )
      .then((r) => r.json())
      .then((json) => {
        const data: ClassRow[] = json?.data?.classes ?? json?.classes ?? [];
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

    // Fetch calendar events for current selected day
    fetchEvents(selectedDay);

    // Fetch staff connectors for badge display
    supabase
      .from("staff_connectors")
      .select("staff_name, connector_type_id, status, training_expires_at, coverage_area")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .then(({ data }) => {
        const byName: Record<string, Array<{ type: string; area?: string; expiring?: boolean }>> = {};
        for (const c of data || []) {
          if (!byName[c.staff_name]) byName[c.staff_name] = [];
          const expiresAt = c.training_expires_at ? new Date(c.training_expires_at) : null;
          const isExpiring = expiresAt ? (expiresAt.getTime() - Date.now()) < 90 * 24 * 60 * 60 * 1000 : false;
          byName[c.staff_name].push({
            type: c.connector_type_id,
            area: c.coverage_area || undefined,
            expiring: isExpiring,
          });
        }
        setConnectors(byName);
      })
      .catch(() => setConnectors({}));
  }, [organizationId, weekCommencing, session, fetchEvents, selectedDay]);

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

  const displayDate = formatDisplayDate(weekCommencing, selectedDay);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white print:border-b-2 print:border-slate-300">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-teal-500 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-slate-800 leading-tight">Daily Operations Overview</div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3 h-3" />
              {displayDate}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors print:hidden"
          title="Print daily overview"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>

      {/* ── Day selector + legend ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 print:hidden">
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
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Taught
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Draft
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> No plan
          </span>
        </span>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-40 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Class / Staff
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
              {/* Coverage summary column */}
              <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 text-center bg-slate-50 border-l border-slate-200 w-16 whitespace-nowrap">
                Coverage
              </th>
            </tr>
          </thead>
          <tbody>
            {/* ── School Events row ─────────────────────────────────────────── */}
            <tr className="bg-indigo-50 border-b border-indigo-100">
              <td className="px-3 py-2 sticky left-0 bg-indigo-50 z-10 border-r border-indigo-100">
                <div className="font-semibold text-indigo-700 text-[10px] uppercase tracking-wide">
                  School Events
                </div>
              </td>
              {timeColumns.map((col) => {
                if (col.isLunch) {
                  return (
                    <td key="LUNCH-events" className="px-1 py-1 bg-amber-50 border-x border-amber-100" />
                  );
                }
                const colEvents = schoolEvents.filter((e) =>
                  timeOverlaps(e.start_time, e.end_time, col.start, col.end),
                );
                // Also show all-day events in the first column
                const allDayEvents =
                  col.key === timeColumns.find((c) => !c.isLunch)?.key
                    ? schoolEvents.filter((e) => !e.start_time)
                    : [];
                const combined = [...colEvents, ...allDayEvents];
                return (
                  <td key={col.key} className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      {combined.map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-[9px] rounded px-1.5 py-0.5 truncate font-medium ${eventBadgeClass(evt.event_type)}`}
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
              {/* Empty coverage cell for events row */}
              <td className="border-l border-slate-200" />
            </tr>

            {/* ── Class rows ────────────────────────────────────────────────── */}
            {classes.map((cls) => {
              const ks = getKeyStageLabel(cls.year_group);
              let separatorRow: React.ReactNode = null;
              if (ks && ks !== lastKS) {
                lastKS = ks;
                separatorRow = (
                  <tr key={`ks-${ks}`} className="bg-slate-100 border-t-2 border-slate-200">
                    <td
                      colSpan={2 + timeColumns.length}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      {ks}
                    </td>
                  </tr>
                );
              }

              const slotMap = new Map<string, SlotSummary>();
              for (const slot of cls.slots) {
                if (slot.day_of_week !== selectedDay) continue;
                const key = `${slot.start_time}-${slot.end_time}`;
                slotMap.set(key, slot);
              }

              const hasNoSlotsToday = slotMap.size === 0;
              const lunch = getLunchTime(cls.year_group);

              // Assembly: Friday first non-lunch period
              const firstNonLunchCol = timeColumns.find((c) => !c.isLunch);
              const assemblyColKey = selectedDay === 5 && firstNonLunchCol?.start === "09:00"
                ? firstNonLunchCol?.key
                : null;

              const row = (
                <tr
                  key={cls.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  {/* ── Class + staff cell ──────────────────────────────────── */}
                  <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 transition-colors">
                    <div
                      className="font-semibold text-slate-800 truncate max-w-[140px] leading-tight"
                      title={cls.class_name}
                    >
                      {cls.class_name}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {cls.teacher_name || cls.year_group}
                    </div>
                    {/* TA placeholder — wired when staff_connectors table is populated */}
                    {/* Staff connector badges */}
                    {cls.teacher_name && connectors[cls.teacher_name] && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap">
                        {connectors[cls.teacher_name].map((c, ci) => {
                          const badge = CONNECTOR_BADGES[c.type];
                          if (!badge) return null;
                          return (
                            <span
                              key={ci}
                              className={`text-[8px] px-1 py-0.5 rounded ${c.expiring ? "bg-red-100 text-red-700" : badge.bg} cursor-default`}
                              title={`${badge.label}${c.area ? ` (${c.area})` : ""}${c.expiring ? " ⚠ Training expiring soon" : ""}`}
                            >
                              {badge.icon}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* No timetable message */}
                  {hasNoSlotsToday && (
                    <td
                      colSpan={timeColumns.length}
                      className="px-3 py-2 text-left"
                    >
                      <span className="text-[10px] text-slate-300 italic">No timetable set up</span>
                    </td>
                  )}

                  {/* Time slot cells */}
                  {!hasNoSlotsToday && timeColumns.map((col) => {
                    if (col.isLunch) {
                      return (
                        <td key="LUNCH" className="px-2 py-1.5 text-center bg-amber-50 border-x border-amber-100">
                          <div className="text-[10px] font-medium text-amber-700">
                            {lunch.start}–{lunch.end}
                          </div>
                          <div className="text-[9px] text-amber-500">Lunch</div>
                        </td>
                      );
                    }

                    // Assembly override on Fridays at 09:00
                    if (assemblyColKey && col.key === assemblyColKey) {
                      return (
                        <td key={col.key} className="px-2 py-1.5 bg-violet-50 border border-violet-100">
                          <div className="text-[10px] font-medium text-violet-700">Assembly</div>
                          <div className="text-[9px] text-violet-400">Whole school</div>
                        </td>
                      );
                    }

                    const slot = slotMap.get(col.key);
                    if (!slot) {
                      return (
                        <td key={col.key} className="px-2 py-1.5 text-center bg-slate-50/60" />
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
                          title={`${slot.subject}${slot.plan_title ? ` — ${slot.plan_title}` : ""}\nClick to view class`}
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

                  {/* ── Coverage summary cell ─────────────────────────────── */}
                  <td className="px-2 py-1.5 text-center border-l border-slate-200">
                    <div className="text-[10px] font-bold text-teal-600">--</div>
                    <div className="text-[8px] text-slate-400">curriculum</div>
                  </td>
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

      {/* ── Footer legend ──────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center gap-4 print:hidden">
        <span>Click any lesson cell to open that class.</span>
        <span>Lunch times are staggered by year group.</span>
        <span className="ml-auto">Coverage column will show curriculum % when data is available.</span>
      </div>
    </div>
  );
}
