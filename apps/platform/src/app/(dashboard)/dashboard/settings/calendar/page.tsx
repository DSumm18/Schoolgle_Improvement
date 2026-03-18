"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Users,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getSessionToken } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";

// ─── Types ────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  academic_year: string;
  affects_energy: boolean;
  expected_occupancy_pct?: number | null;
  colour?: string | null;
  notes?: string | null;
  recurrence?: string | null;
  created_at: string;
}

interface EventFormData {
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  academic_year: string;
  affects_energy: boolean;
  expected_occupancy_pct: string;
  colour: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────

const EVENT_TYPES = [
  {
    value: "inset_day",
    label: "INSET Day",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    value: "bank_holiday",
    label: "Bank Holiday",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  {
    value: "after_school_club",
    label: "After School Club",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  {
    value: "breakfast_club",
    label: "Breakfast Club",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    value: "holiday_club",
    label: "Holiday Club",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  {
    value: "parents_evening",
    label: "Parents' Evening",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    value: "school_trip",
    label: "School Trip",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  },
  {
    value: "staff_training",
    label: "Staff Training",
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  {
    value: "lettings",
    label: "Lettings",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  {
    value: "exam_period",
    label: "Exam Period",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
  {
    value: "sports_day",
    label: "Sports Day",
    color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  },
  {
    value: "custom",
    label: "Custom",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
] as const;

const COLOUR_PRESETS = [
  "#0d9488",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#64748b",
];

const EMPTY_FORM: EventFormData = {
  title: "",
  event_type: "custom",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  academic_year: "2025-26",
  affects_energy: false,
  expected_occupancy_pct: "",
  colour: "#0d9488",
  notes: "",
};

function getEventTypeBadge(eventType: string) {
  return (
    EVENT_TYPES.find((t) => t.value === eventType) ||
    EVENT_TYPES[EVENT_TYPES.length - 1]
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return null;
  try {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m}${ampm}`;
  } catch {
    return timeStr;
  }
}

// ─── Auth fetch helper ────────────────────────────────────

async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new Error(info.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Main Component ───────────────────────────────────────

export default function CalendarSettingsPage() {
  const { user, organization, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    "2025-26": true,
    "2024-25": true,
  });

  const orgId = organization?.id;
  const { data, isLoading, mutate } = useSWR(
    user && orgId ? `/api/calendar/events?organizationId=${orgId}` : null,
    fetcher,
  );

  const events: CalendarEvent[] = data?.events || data?.data || [];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Group events by academic year
  const groupedEvents = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, event) => {
      const year = event.academic_year || "Unknown";
      if (!acc[year]) acc[year] = [];
      acc[year].push(event);
      return acc;
    },
    {},
  );

  // Sort years descending
  const sortedYears = Object.keys(groupedEvents).sort((a, b) =>
    b.localeCompare(a),
  );

  const handleChange = (
    field: keyof EventFormData,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const openEditForm = (event: CalendarEvent) => {
    setForm({
      title: event.title,
      event_type: event.event_type,
      start_date: event.start_date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      academic_year: event.academic_year,
      affects_energy: event.affects_energy,
      expected_occupancy_pct:
        event.expected_occupancy_pct != null
          ? String(event.expected_occupancy_pct)
          : "",
      colour: event.colour || "#0d9488",
      notes: event.notes || "",
    });
    setEditingId(event.id);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.start_date) {
      setError("Start date is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        academic_year: form.academic_year,
        affects_energy: form.affects_energy,
        expected_occupancy_pct: form.expected_occupancy_pct
          ? parseInt(form.expected_occupancy_pct, 10)
          : null,
        colour: form.colour || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        await authFetch(
          `/api/calendar/events/${editingId}?organizationId=${orgId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ ...payload, organizationId: orgId }),
          },
        );
        setSuccess("Event updated successfully.");
      } else {
        await authFetch(`/api/calendar/events?organizationId=${orgId}`, {
          method: "POST",
          body: JSON.stringify({ ...payload, organizationId: orgId }),
        });
        setSuccess("Event created successfully.");
      }

      await mutate();
      closeForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calendar event?"))
      return;

    setDeleting(id);
    setError(null);

    try {
      await authFetch(`/api/calendar/events/${id}?organizationId=${orgId}`, {
        method: "DELETE",
      });
      await mutate();
      setSuccess("Event deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setDeleting(null);
    }
  };

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  // ─── Render ───────────────────────────────────────────

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/settings")}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Settings
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Calendar Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your school calendar events -- INSET days, clubs,
            parents&apos; evenings, lettings, and more.
          </p>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Event
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3 flex items-center gap-2 text-sm text-teal-700 dark:text-teal-400">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                {editingId ? "Edit Event" : "New Calendar Event"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. INSET Day 1, Year 6 Trip to Science Museum"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            {/* Event type + Academic year row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event_type" className="text-sm font-medium">
                  Event Type
                </Label>
                <select
                  id="event_type"
                  value={form.event_type}
                  onChange={(e) => handleChange("event_type", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="academic_year" className="text-sm font-medium">
                  Academic Year
                </Label>
                <select
                  id="academic_year"
                  value={form.academic_year}
                  onChange={(e) =>
                    handleChange("academic_year", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for single-day events.
                </p>
              </div>
            </div>

            {/* Times row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                />
              </div>
            </div>

            {/* Energy + Occupancy row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    id="affects_energy"
                    type="checkbox"
                    checked={form.affects_energy}
                    onChange={(e) =>
                      handleChange("affects_energy", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <Label
                    htmlFor="affects_energy"
                    className="text-sm font-medium"
                  >
                    Affects Energy Usage
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Tick if this event impacts building energy consumption (e.g.
                  holiday closures, lettings).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="expected_occupancy_pct"
                  className="text-sm font-medium"
                >
                  Expected Occupancy (%)
                </Label>
                <Input
                  id="expected_occupancy_pct"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 50"
                  value={form.expected_occupancy_pct}
                  onChange={(e) =>
                    handleChange("expected_occupancy_pct", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Colour */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Colour</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.colour}
                  onChange={(e) => handleChange("colour", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {COLOUR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange("colour", c)}
                      className={`w-7 h-7 rounded-md border-2 transition-all ${
                        form.colour === c
                          ? "border-slate-900 dark:border-white scale-110"
                          : "border-transparent hover:border-slate-300"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Optional additional details..."
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </Button>
              <Button variant="outline" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events list grouped by academic year */}
      {sortedYears.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">No Calendar Events</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add your school&apos;s INSET days, term dates, clubs, and other
              events to keep the calendar up to date.
            </p>
            <Button
              onClick={openAddForm}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Event
            </Button>
          </CardContent>
        </Card>
      )}

      {sortedYears.map((year) => {
        const yearEvents = groupedEvents[year].sort((a, b) =>
          a.start_date.localeCompare(b.start_date),
        );
        const isExpanded = expandedYears[year] !== false;

        return (
          <Card key={year}>
            <CardHeader className="pb-0">
              <button
                onClick={() => toggleYear(year)}
                className="flex items-center justify-between w-full text-left group"
              >
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-teal-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-600" />
                  )}
                  Academic Year {year}
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs font-normal"
                  >
                    {yearEvents.length} event
                    {yearEvents.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </button>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-0 mt-3">
                <div className="divide-y">
                  {yearEvents.map((event) => {
                    const typeBadge = getEventTypeBadge(event.event_type);
                    const isDeleting = deleting === event.id;

                    return (
                      <div
                        key={event.id}
                        className="flex items-start justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Colour dot */}
                          <div
                            className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                            style={{
                              backgroundColor: event.colour || "#0d9488",
                            }}
                          />

                          <div className="min-w-0 flex-1">
                            {/* Title + type badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {event.title}
                              </span>
                              <Badge
                                className={`text-[10px] font-medium px-1.5 py-0 ${typeBadge.color}`}
                              >
                                {typeBadge.label}
                              </Badge>
                              {event.affects_energy && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:text-amber-400"
                                >
                                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                                  Energy
                                </Badge>
                              )}
                            </div>

                            {/* Date + time info */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(event.start_date)}
                                {event.end_date &&
                                  event.end_date !== event.start_date && (
                                    <> &mdash; {formatDate(event.end_date)}</>
                                  )}
                              </span>
                              {(event.start_time || event.end_time) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.start_time)}
                                  {event.end_time && (
                                    <> &ndash; {formatTime(event.end_time)}</>
                                  )}
                                </span>
                              )}
                              {event.expected_occupancy_pct != null && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {event.expected_occupancy_pct}% occupancy
                                </span>
                              )}
                              {event.recurrence && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {event.recurrence}
                                </Badge>
                              )}
                            </div>

                            {/* Notes */}
                            {event.notes && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(event)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Info card */}
      <Card className="bg-teal-50/50 dark:bg-teal-950/10 border-teal-200 dark:border-teal-800">
        <CardContent className="py-4">
          <h3 className="text-sm font-bold mb-2 text-teal-900 dark:text-teal-200">
            How calendar events are used
          </h3>
          <ul className="space-y-1.5 text-xs text-teal-700 dark:text-teal-300">
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Energy forecasting</strong> uses INSET days, holidays, and
              lettings to predict building energy consumption.
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Ed AI</strong> references your calendar when answering
              questions about upcoming events and term dates.
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Newsletters</strong> auto-include diary dates from this
              calendar in the next 14 days.
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Estates compliance</strong> schedules routine checks
              around term dates and occupancy patterns.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
