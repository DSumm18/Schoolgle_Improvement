"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { UnifiedCalendarEvent, CalendarSource } from "@/app/api/calendar/unified/route";
import CalendarSidebar, {
  DEFAULT_LAYERS,
  type CalendarLayer,
} from "./CalendarSidebar";

// ─── Constants ────────────────────────────────────────────────────────

const HOUR_START = 7; // 07:00
const HOUR_END = 19; // 19:00
const SLOT_MINUTES = 30;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;
const SLOT_HEIGHT_PX = 40; // height of each 30-min row
const TIME_COL_WIDTH = 56; // px

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ─── Helpers ──────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - HOUR_START) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES);
}

function timeToPixels(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const minutes = (h - HOUR_START) * 60 + m;
  return (minutes / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}

function durationToPixels(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = (eh - em >= 0 ? eh * 60 + em - sh * 60 - sm : 30);
  const safeDuration = Math.max(minutes, 30); // minimum 30min height
  return (safeDuration / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")}${suffix}`;
}

function isToday(d: Date): boolean {
  return toYMD(d) === toYMD(new Date());
}

// ─── EventBlock ───────────────────────────────────────────────────────

interface EventBlockProps {
  event: UnifiedCalendarEvent;
  onClick: (event: UnifiedCalendarEvent) => void;
}

function EventBlock({ event, onClick }: EventBlockProps) {
  const top = event.startTime ? timeToPixels(event.startTime) : 0;
  const height =
    event.startTime && event.endTime
      ? durationToPixels(event.startTime, event.endTime)
      : SLOT_HEIGHT_PX;

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      title={event.title}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden hover:brightness-110 transition-all shadow-sm z-10 border-l-4"
      style={{
        top,
        height: Math.max(height, 22),
        backgroundColor: `${event.color}18`,
        borderLeftColor: event.color,
      }}
    >
      <p
        className="text-xs font-semibold leading-tight truncate"
        style={{ color: event.color }}
      >
        {event.title}
      </p>
      {event.startTime && (
        <p className="text-xs leading-tight" style={{ color: `${event.color}cc` }}>
          {formatTime(event.startTime)}
          {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
        </p>
      )}
    </button>
  );
}

// ─── AllDayEvent ──────────────────────────────────────────────────────

function AllDayEvent({
  event,
  onClick,
}: {
  event: UnifiedCalendarEvent;
  onClick: (e: UnifiedCalendarEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      title={event.title}
      className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate hover:brightness-105 border-l-2"
      style={{
        backgroundColor: `${event.color}20`,
        borderLeftColor: event.color,
        color: event.color,
      }}
    >
      {event.title}
    </button>
  );
}

// ─── EventPopover ─────────────────────────────────────────────────────

function EventPopover({
  event,
  onClose,
}: {
  event: UnifiedCalendarEvent;
  onClose: () => void;
}) {
  const sourceLabels: Record<CalendarSource, string> = {
    school_events: "School Event",
    lessons: "Lesson",
    absences: "Staff Absence",
    meetings: "Meeting",
    estates: "Estates Diary",
    compliance: "Compliance Due",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-5 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>

        {/* Source badge */}
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 mb-3"
          style={{ backgroundColor: `${event.color}18`, color: event.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          {sourceLabels[event.source]}
        </span>

        <h3 className="font-semibold text-slate-800 text-base mb-2 pr-4">
          {event.title}
        </h3>

        {/* Date / time */}
        <div className="text-sm text-slate-500 space-y-1 mb-3">
          <p>
            {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {event.endDate && event.endDate !== event.date && (
              <> &mdash; {new Date(event.endDate + "T00:00:00").toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })}</>
            )}
          </p>
          {event.startTime && (
            <p>
              {formatTime(event.startTime)}
              {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
            </p>
          )}
          {event.allDay && !event.startTime && (
            <p className="italic text-slate-400">All day</p>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1 border-t border-slate-100 pt-3">
          {Object.entries(event.metadata)
            .filter(([, v]) => v != null && v !== "")
            .slice(0, 5)
            .map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-slate-400 capitalize w-24 flex-shrink-0">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-slate-600 truncate">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function UnifiedCalendar() {
  const { supabase, session } = useAuth();

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [layers, setLayers] = useState<CalendarLayer[]>(DEFAULT_LAYERS);
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDates[4];

  // Fetch events for the current week
  const fetchEvents = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const start = toYMD(weekStart);
      const end = toYMD(weekEnd);
      const res = await fetch(
        `/api/calendar/unified?start=${start}&end=${end}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setEvents(json.events ?? []);
    } catch (err) {
      console.error("[UnifiedCalendar] fetch error:", err);
      setError("Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  }, [session, weekStart, weekEnd]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Toggle a layer
  const toggleLayer = useCallback((source: CalendarSource) => {
    setLayers((prev) =>
      prev.map((l) => (l.source === source ? { ...l, enabled: !l.enabled } : l)),
    );
  }, []);

  // Visible events = only from enabled layers
  const enabledSources = new Set(layers.filter((l) => l.enabled).map((l) => l.source));
  const visibleEvents = events.filter((e) => enabledSources.has(e.source));

  // Split into all-day and timed
  const allDayByDay: Record<string, UnifiedCalendarEvent[]> = {};
  const timedByDay: Record<string, UnifiedCalendarEvent[]> = {};

  for (const event of visibleEvents) {
    const key = event.date;
    if (event.allDay || !event.startTime) {
      if (!allDayByDay[key]) allDayByDay[key] = [];
      allDayByDay[key].push(event);
    } else {
      if (!timedByDay[key]) timedByDay[key] = [];
      timedByDay[key].push(event);
    }
  }

  const maxAllDay = Math.max(
    1,
    ...weekDates.map((d) => (allDayByDay[toYMD(d)] ?? []).length),
  );
  const allDayRowHeight = Math.min(maxAllDay * 26 + 8, 120);

  // Time labels
  const timeLabels: string[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    timeLabels.push(`${h}:00`);
    timeLabels.push("");
  }

  const gridHeight = TOTAL_SLOTS * SLOT_HEIGHT_PX;

  return (
    <div className="flex h-full bg-white font-[Poppins,sans-serif]">
      {/* Sidebar */}
      <CalendarSidebar layers={layers} onToggle={toggleLayer} />

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-700 ml-1">
              {weekStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setWeekStart(getMondayOf(new Date()))}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md border border-blue-200 hover:border-blue-400 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Loading / error banners */}
        {loading && (
          <div className="px-4 py-1.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 flex-shrink-0">
            Loading calendar events...
          </div>
        )}
        {error && (
          <div className="px-4 py-1.5 bg-red-50 border-b border-red-100 text-xs text-red-600 flex-shrink-0">
            {error}
          </div>
        )}

        {/* Calendar grid wrapper */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col min-h-full">
            {/* Day header row */}
            <div
              className="flex border-b border-slate-100 sticky top-0 bg-white z-20 flex-shrink-0"
              style={{ paddingLeft: TIME_COL_WIDTH }}
            >
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 text-center py-2 border-l border-slate-100 first:border-l-0"
                >
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-lg font-semibold mt-0.5 w-8 h-8 rounded-full mx-auto flex items-center justify-center
                      ${isToday(d) ? "bg-blue-600 text-white" : "text-slate-700"}`}
                  >
                    {d.getDate()}
                  </p>
                  <p className="text-xs text-slate-400">{formatHeaderDate(d)}</p>
                </div>
              ))}
            </div>

            {/* All-day row */}
            <div
              className="flex border-b border-slate-200 flex-shrink-0"
              style={{ paddingLeft: TIME_COL_WIDTH, minHeight: allDayRowHeight }}
            >
              {weekDates.map((d, i) => {
                const key = toYMD(d);
                const dayEvents = allDayByDay[key] ?? [];
                return (
                  <div
                    key={i}
                    className={`flex-1 border-l border-slate-100 first:border-l-0 p-1 space-y-0.5 ${
                      isToday(d) ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {dayEvents.slice(0, 4).map((e) => (
                      <AllDayEvent key={e.id} event={e} onClick={setSelectedEvent} />
                    ))}
                    {dayEvents.length > 4 && (
                      <p className="text-xs text-slate-400 px-1">
                        +{dayEvents.length - 4} more
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timed grid */}
            <div className="flex flex-1" style={{ minHeight: gridHeight }}>
              {/* Time labels */}
              <div
                className="flex flex-col flex-shrink-0"
                style={{ width: TIME_COL_WIDTH }}
              >
                {timeLabels.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-end pr-2 text-xs text-slate-400 border-b border-slate-50"
                    style={{ height: SLOT_HEIGHT_PX }}
                  >
                    {label && <span className="-mt-2">{formatTime(label)}</span>}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((d, i) => {
                const key = toYMD(d);
                const dayEvents = timedByDay[key] ?? [];
                return (
                  <div
                    key={i}
                    className={`flex-1 border-l border-slate-100 first:border-l-0 relative ${
                      isToday(d) ? "bg-blue-50/30" : ""
                    }`}
                    style={{ height: gridHeight }}
                  >
                    {/* Hour lines */}
                    {Array.from({ length: TOTAL_SLOTS }, (_, s) => (
                      <div
                        key={s}
                        className={`border-b ${
                          s % SLOTS_PER_HOUR === 0
                            ? "border-slate-200"
                            : "border-slate-50"
                        }`}
                        style={{ height: SLOT_HEIGHT_PX }}
                      />
                    ))}

                    {/* Timed events */}
                    {dayEvents.map((e) => (
                      <EventBlock key={e.id} event={e} onClick={setSelectedEvent} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event detail popover */}
      {selectedEvent && (
        <EventPopover
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
