"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Monitor,
  Bell,
  X,
  Filter,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_all_day: boolean;
  audience: string;
  color?: string;
  show_on_display: boolean;
  notify_parents: boolean;
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  general: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  meeting: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  training: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  assembly: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  trip: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  deadline: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  holiday: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  inspection: { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
  parents_evening: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  sport: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  performance: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  pta: { bg: "bg-fuchsia-100", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  worship: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchoolCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch events for current month +/- 1 month
  useEffect(() => {
    const from = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const to = new Date(year, month + 2, 0).toISOString().split("T")[0];

    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [year, month]);

  const getEventsForDate = (dateStr: string) =>
    events.filter((e) => {
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      return e.start_date === dateStr || (e.end_date && e.start_date <= dateStr && e.end_date >= dateStr);
    });

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "general",
    start_date: "",
    start_time: "",
    end_time: "",
    location: "",
    description: "",
    is_all_day: true,
    audience: "all",
    show_on_display: false,
    notify_parents: false,
  });

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_date) return;
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newEvent,
        start_time: newEvent.is_all_day ? undefined : newEvent.start_time || undefined,
        end_time: newEvent.is_all_day ? undefined : newEvent.end_time || undefined,
      }),
    });
    const data = await res.json();
    setEvents((prev) => [...prev, data]);
    setShowAddEvent(false);
    setNewEvent({
      title: "", event_type: "general", start_date: "", start_time: "", end_time: "",
      location: "", description: "", is_all_day: true, audience: "all",
      show_on_display: false, notify_parents: false,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-600" />
            School Calendar
          </h1>
          <p className="text-gray-500 mt-1">Events, meetings, trips, and key dates</p>
        </div>
        <button
          onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              >
                Today
              </button>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="all">All types</option>
                {Object.keys(EVENT_TYPE_COLORS).map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-xl overflow-hidden">
            {DAYS.map((day) => (
              <div key={day} className="bg-gray-50 text-center py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-xl overflow-hidden">
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const dateStr = date.toISOString().split("T")[0];
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    min-h-[90px] p-1.5 text-left transition relative
                    ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                    ${isSelected ? "ring-2 ring-indigo-500 ring-inset z-10" : ""}
                    ${isWeekend && isCurrentMonth ? "bg-gray-50/50" : ""}
                    hover:bg-indigo-50/50
                  `}
                >
                  <div className={`
                    text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-indigo-600 text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}
                  `}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const colors = EVENT_TYPE_COLORS[evt.event_type] || EVENT_TYPE_COLORS.general;
                      return (
                        <div
                          key={evt.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} truncate font-medium leading-tight`}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-400 font-medium px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right sidebar — selected day details */}
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-4">
            {selectedDate ? (
              <>
                <h3 className="font-bold text-gray-800 mb-1">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                </p>

                {selectedEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nothing scheduled</p>
                    <button
                      onClick={() => {
                        setNewEvent((prev) => ({ ...prev, start_date: selectedDate }));
                        setShowAddEvent(true);
                      }}
                      className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
                    >
                      Add an event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((evt) => {
                      const colors = EVENT_TYPE_COLORS[evt.event_type] || EVENT_TYPE_COLORS.general;
                      return (
                        <div key={evt.id} className="border border-gray-100 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900">{evt.title}</h4>
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                {!evt.is_all_day && evt.start_time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {evt.start_time}{evt.end_time && ` — ${evt.end_time}`}
                                  </div>
                                )}
                                {evt.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {evt.location}
                                  </div>
                                )}
                              </div>
                              {evt.description && (
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                  {evt.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-medium capitalize`}>
                                  {evt.event_type.replace("_", " ")}
                                </span>
                                {evt.show_on_display && (
                                  <Monitor className="w-3 h-3 text-gray-400" title="On displays" />
                                )}
                                {evt.notify_parents && (
                                  <Bell className="w-3 h-3 text-gray-400" title="Parents notified" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a date to see events</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Types</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className="text-[11px] text-gray-600 capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Add Calendar Event</h2>
              <button onClick={() => setShowAddEvent(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Year 6 Residential Trip"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent((p) => ({ ...p, event_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  >
                    {Object.keys(EVENT_TYPE_COLORS).map((t) => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={newEvent.is_all_day}
                  onChange={(e) => setNewEvent((p) => ({ ...p, is_all_day: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                All day event
              </label>

              {!newEvent.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent((p) => ({ ...p, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent((p) => ({ ...p, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Main Hall"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.show_on_display}
                    onChange={(e) => setNewEvent((p) => ({ ...p, show_on_display: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Monitor className="w-4 h-4 text-gray-400" />
                  Show on displays
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.notify_parents}
                    onChange={(e) => setNewEvent((p) => ({ ...p, notify_parents: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Bell className="w-4 h-4 text-gray-400" />
                  Notify parents
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !newEvent.start_date}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
