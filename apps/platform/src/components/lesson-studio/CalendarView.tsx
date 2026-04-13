"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  LSClass,
  CalendarEventWithPlan,
  LessonStatus,
} from "@/types/lesson-studio";
import { SUBJECT_COLORS } from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";

/* ── Constants ───────────────────────────────────────────────────────── */

const TIME_SLOTS = [
  { label: "9:00 - 10:00", start: "09:00", end: "10:00" },
  { label: "10:15 - 11:15", start: "10:15", end: "11:15" },
  { label: "11:30 - 12:15", start: "11:30", end: "12:15" },
  { label: "1:15 - 2:15", start: "13:15", end: "14:15" },
  { label: "2:30 - 3:15", start: "14:30", end: "15:15" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STATUS_DOTS: Record<LessonStatus, string> = {
  taught: "bg-emerald-500",
  planned: "bg-indigo-500",
  draft: "bg-amber-400",
  empty: "bg-gray-300",
  cancelled: "bg-red-400",
};

const STATUS_LEGEND: { status: LessonStatus; label: string }[] = [
  { status: "taught", label: "Taught" },
  { status: "planned", label: "Planned" },
  { status: "draft", label: "Draft" },
  { status: "empty", label: "No plan" },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function getMondayDate(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatWeekLabel(monday: Date): string {
  const friday = addDays(monday, 4);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("en-GB", opts)} - ${friday.toLocaleDateString("en-GB", opts)} ${monday.getFullYear()}`;
}

function timeOverlaps(
  eventStart: string,
  eventEnd: string,
  slotStart: string,
  slotEnd: string,
): boolean {
  // Normalise to comparable strings (HH:MM)
  const eS = eventStart.slice(0, 5);
  const eE = eventEnd.slice(0, 5);
  // Event overlaps slot if event starts before slot ends and event ends after slot starts
  return eS < slotEnd && eE > slotStart;
}

/* ── Props ───────────────────────────────────────────────────────────── */

interface CalendarViewProps {
  classes: LSClass[];
  selectedClassId: string | null;
  onEventClick: (event: CalendarEventWithPlan) => void;
}

/* ── Component ───────────────────────────────────────────────────────── */

export function CalendarView({
  classes,
  selectedClassId,
  onEventClick,
}: CalendarViewProps) {
  const { session } = useAuth();
  const authHeaders: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const [weekStart, setWeekStart] = useState<Date>(() =>
    getMondayDate(new Date()),
  );
  const [events, setEvents] = useState<CalendarEventWithPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const todayStr = toDateStr(new Date());

  // Fetch events when weekStart or selectedClassId changes
  const fetchEvents = useCallback(async () => {
    const startDate = toDateStr(weekStart);
    const endDate = toDateStr(addDays(weekStart, 4));
    const params = new URLSearchParams({ startDate, endDate });
    if (selectedClassId) params.set("classId", selectedClassId);

    setLoading(true);
    try {
      const res = await fetch(
        `/api/lesson-studio/calendar?${params.toString()}`,
        { headers: authHeaders },
      );
      const json = await res.json();
      setEvents(json.data?.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart, selectedClassId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(getMondayDate(new Date()));

  // Build day dates array (Mon-Fri)
  const dayDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Find events matching a cell
  const eventsForCell = (
    dayDate: Date,
    slot: (typeof TIME_SLOTS)[number],
  ): CalendarEventWithPlan[] => {
    const dateStr = toDateStr(dayDate);
    return events.filter(
      (e) =>
        e.event_date === dateStr &&
        timeOverlaps(e.start_time, e.end_time, slot.start, slot.end),
    );
  };

  // Determine status for an event
  const eventStatus = (e: CalendarEventWithPlan): LessonStatus => {
    if (e.lesson_plan?.status) return e.lesson_plan.status as LessonStatus;
    return "empty";
  };

  // Subject colour lookup
  const subjectColor = (subject: string) => {
    return (
      SUBJECT_COLORS[subject] ?? {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={goToday}
            className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
          >
            Today
          </button>
        </div>

        <span className="text-sm font-semibold text-gray-800 font-[Poppins,sans-serif]">
          {formatWeekLabel(weekStart)}
        </span>

        <div className="w-24" /> {/* Spacer for balance */}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-[70px_repeat(5,1fr)]">
        {/* Header row: empty corner + day headers */}
        <div className="bg-gray-50 border-b border-r border-gray-100" />
        {dayDates.map((d, i) => {
          const isToday = toDateStr(d) === todayStr;
          return (
            <div
              key={i}
              className={`bg-gray-50 border-b border-gray-100 px-2 py-2 text-center ${
                i < 4 ? "border-r" : ""
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isToday ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {DAY_LABELS[i]}
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  isToday
                    ? "text-indigo-600 font-bold"
                    : "text-gray-400 font-medium"
                }`}
              >
                {formatDayHeader(d)}
              </div>
            </div>
          );
        })}

        {/* Time slot rows */}
        {TIME_SLOTS.map((slot, rowIdx) => (
          <React.Fragment key={slot.start}>
            {/* Time label */}
            <div
              className={`bg-gray-50 border-r border-gray-100 px-2 py-3 flex items-start justify-end ${
                rowIdx < TIME_SLOTS.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="text-[9px] text-gray-400 font-medium leading-tight text-right whitespace-nowrap">
                {slot.label}
              </span>
            </div>

            {/* Day cells */}
            {dayDates.map((dayDate, colIdx) => {
              const cellEvents = eventsForCell(dayDate, slot);
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`min-h-[64px] p-1 ${
                    rowIdx < TIME_SLOTS.length - 1 ? "border-b" : ""
                  } ${colIdx < 4 ? "border-r" : ""} border-gray-100`}
                >
                  {cellEvents.map((evt) => {
                    const sc = subjectColor(evt.subject);
                    const status = eventStatus(evt);
                    return (
                      <button
                        key={evt.id}
                        onClick={() => onEventClick(evt)}
                        className={`w-full text-left rounded-md px-1.5 py-1 mb-0.5 border transition-all hover:shadow-sm cursor-pointer ${sc.bg} ${sc.border}`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOTS[status]}`}
                          />
                          <span
                            className={`text-[10px] font-bold truncate ${sc.text}`}
                          >
                            {evt.subject}
                          </span>
                        </div>
                        {evt.title && (
                          <div
                            className={`text-[9px] truncate mt-0.5 opacity-80 ${sc.text}`}
                          >
                            {evt.title}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="px-4 py-2 text-center">
          <span className="text-xs text-gray-400">Loading events...</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100">
        {STATUS_LEGEND.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${STATUS_DOTS[item.status]}`}
            />
            <span className="text-[10px] text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
