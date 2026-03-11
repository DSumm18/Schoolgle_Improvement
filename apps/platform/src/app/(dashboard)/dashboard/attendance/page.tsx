"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import {
  Users,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserX,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Save,
  BarChart3,
  FileText,
  Plus,
  Search,
  RefreshCw,
  Info,
  ArrowUpDown,
  Eye,
  Mail,
  Phone,
  UserCheck,
  Shield,
  CalendarDays,
  ArrowRight,
  X,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface DashboardOverview {
  overall_attendance: number;
  national_average: number;
  trend: "up" | "down";
  trend_change: number;
  total_pupils: number;
  pa_count: number;
  pa_rate: number;
  severe_absence_count: number;
  late_today: number;
  cme_count: number;
}

interface YearGroupStat {
  year_group: number;
  pupil_count: number;
  attendance_rate: number;
  pa_count: number;
  severe_count: number;
}

interface WeeklyTrend {
  week_commencing: string;
  attendance_rate: number;
  pa_rate: number;
}

interface DayOfWeekPattern {
  day: string;
  attendance_rate: number;
}

interface DashboardData {
  overview: DashboardOverview;
  year_groups: YearGroupStat[];
  weekly_trend: WeeklyTrend[];
  day_of_week_pattern: DayOfWeekPattern[];
  is_demo: boolean;
}

interface RegisterMark {
  id: string;
  pupil_id: string;
  pupil_name: string;
  date: string;
  session: string;
  code: string;
  minutes_late: number | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

interface PupilSummary {
  id: string;
  pupil_id: string;
  pupil_name: string;
  year_group: number;
  possible_sessions: number;
  attended_sessions: number;
  authorised_absences: number;
  unauthorised_absences: number;
  late_marks: number;
  attendance_rate: number;
  is_persistent_absence: boolean;
  is_severe_absence: boolean;
  academic_year: string;
}

interface Intervention {
  id: string;
  pupil_id: string;
  pupil_name: string;
  year_group: number;
  attendance_rate: number;
  trigger: string;
  type: string;
  status: string;
  description: string;
  assigned_to: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const ATTENDANCE_CODES: {
  code: string;
  label: string;
  category: "present" | "authorised" | "unauthorised" | "admin";
  color: string;
}[] = [
  {
    code: "/",
    label: "Present AM",
    category: "present",
    color: "bg-green-500",
  },
  {
    code: "\\",
    label: "Present PM",
    category: "present",
    color: "bg-green-500",
  },
  {
    code: "L",
    label: "Late (before reg closes)",
    category: "present",
    color: "bg-yellow-500",
  },
  {
    code: "B",
    label: "Educated off site",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "C",
    label: "Authorised leave",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "D",
    label: "Dual registered",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "E",
    label: "Excluded",
    category: "authorised",
    color: "bg-orange-500",
  },
  {
    code: "G",
    label: "Holiday (not agreed)",
    category: "unauthorised",
    color: "bg-red-500",
  },
  {
    code: "H",
    label: "Holiday (agreed)",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "I",
    label: "Illness",
    category: "authorised",
    color: "bg-purple-500",
  },
  {
    code: "J",
    label: "Interview",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "M",
    label: "Medical/dental",
    category: "authorised",
    color: "bg-purple-400",
  },
  {
    code: "N",
    label: "No reason yet",
    category: "unauthorised",
    color: "bg-red-400",
  },
  {
    code: "O",
    label: "Unauthorised absence",
    category: "unauthorised",
    color: "bg-red-500",
  },
  {
    code: "P",
    label: "Approved sporting activity",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "R",
    label: "Religious observance",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "S",
    label: "Study leave",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "T",
    label: "Traveller absence",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "U",
    label: "Late (after reg closes)",
    category: "unauthorised",
    color: "bg-red-400",
  },
  {
    code: "V",
    label: "Educational visit",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "W",
    label: "Work experience",
    category: "authorised",
    color: "bg-blue-400",
  },
  {
    code: "X",
    label: "Non-compulsory school age",
    category: "admin",
    color: "bg-gray-400",
  },
  {
    code: "Y",
    label: "Unable to attend (exceptional)",
    category: "admin",
    color: "bg-gray-400",
  },
  {
    code: "Z",
    label: "Pupil not on roll",
    category: "admin",
    color: "bg-gray-400",
  },
  {
    code: "#",
    label: "School closed",
    category: "admin",
    color: "bg-gray-400",
  },
];

const QUICK_CODES = ["/", "\\", "L", "I", "C", "N", "O", "U"];

const INTERVENTION_THRESHOLDS = [
  {
    rate: 95,
    action: "Monitoring letter",
    type: "letter",
    color: "text-yellow-600",
  },
  {
    rate: 92,
    action: "Parental meeting",
    type: "meeting",
    color: "text-orange-600",
  },
  {
    rate: 90,
    action: "PA formal letter",
    type: "pa_letter",
    color: "text-red-600",
  },
  {
    rate: 85,
    action: "EWO referral",
    type: "ewo_referral",
    color: "text-red-800",
  },
];

const DEMO_CLASSES = [
  { id: "class-r", name: "Reception - Butterflies", year_group: 0 },
  { id: "class-1", name: "Year 1 - Robins", year_group: 1 },
  { id: "class-2", name: "Year 2 - Owls", year_group: 2 },
  { id: "class-3", name: "Year 3 - Foxes", year_group: 3 },
  { id: "class-4", name: "Year 4 - Badgers", year_group: 4 },
  { id: "class-5", name: "Year 5 - Eagles", year_group: 5 },
  { id: "class-6", name: "Year 6 - Falcons", year_group: 6 },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRAGColor(rate: number): string {
  if (rate >= 96) return "text-green-600";
  if (rate >= 90) return "text-amber-600";
  if (rate >= 50) return "text-red-600";
  return "text-red-900";
}

function getRAGBg(rate: number): string {
  if (rate >= 96) return "bg-green-50 border-green-200";
  if (rate >= 90) return "bg-amber-50 border-amber-200";
  if (rate >= 50) return "bg-red-50 border-red-200";
  return "bg-red-100 border-red-400";
}

function getRAGDot(rate: number): string {
  if (rate >= 96) return "bg-green-500";
  if (rate >= 90) return "bg-amber-500";
  if (rate >= 50) return "bg-red-500";
  return "bg-red-800";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return { bg: "bg-yellow-100 text-yellow-800", label: "Pending" };
    case "in_progress":
      return { bg: "bg-blue-100 text-blue-800", label: "In Progress" };
    case "completed":
      return { bg: "bg-green-100 text-green-800", label: "Completed" };
    case "escalated":
      return { bg: "bg-red-100 text-red-800", label: "Escalated" };
    case "cancelled":
      return { bg: "bg-gray-100 text-gray-600", label: "Cancelled" };
    default:
      return { bg: "bg-gray-100 text-gray-600", label: status };
  }
}

function getTriggerLabel(trigger: string): string {
  switch (trigger) {
    case "95_percent":
      return "Below 95%";
    case "92_percent":
      return "Below 92%";
    case "90_percent":
      return "Below 90% (PA)";
    case "85_percent":
      return "Below 85%";
    case "custom":
      return "Manual";
    default:
      return trigger;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "letter":
      return "Monitoring Letter";
    case "meeting":
      return "Parent Meeting";
    case "pa_letter":
      return "PA Formal Letter";
    case "ewo_referral":
      return "EWO Referral";
    case "parenting_contract":
      return "Parenting Contract";
    case "fixed_penalty":
      return "Fixed Penalty Notice";
    case "custom":
      return "Custom";
    default:
      return type;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Overview Cards
// ──────────────────────────────────────────────────────────────────────────────

function OverviewCards({ data }: { data: DashboardOverview }) {
  const cards = [
    {
      title: "Whole-School Attendance",
      value: `${data.overall_attendance}%`,
      subtitle: `National avg: ${data.national_average}%`,
      icon: Users,
      trend: data.trend,
      trendValue: `${data.trend_change}%`,
      color:
        data.overall_attendance >= data.national_average
          ? "text-green-600"
          : "text-red-600",
      bgColor:
        data.overall_attendance >= data.national_average
          ? "bg-green-50"
          : "bg-red-50",
      borderColor:
        data.overall_attendance >= data.national_average
          ? "border-green-200"
          : "border-red-200",
      large: true,
    },
    {
      title: "Persistent Absence",
      value: data.pa_count.toString(),
      subtitle: `${data.pa_rate}% of pupils below 90%`,
      icon: TrendingDown,
      color: data.pa_count > 0 ? "text-red-600" : "text-green-600",
      bgColor: data.pa_count > 0 ? "bg-red-50" : "bg-green-50",
      borderColor: data.pa_count > 0 ? "border-red-200" : "border-green-200",
    },
    {
      title: "Severe Absence",
      value: data.severe_absence_count.toString(),
      subtitle: "Pupils below 50%",
      icon: XCircle,
      color: data.severe_absence_count > 0 ? "text-red-800" : "text-green-600",
      bgColor: data.severe_absence_count > 0 ? "bg-red-100" : "bg-green-50",
      borderColor:
        data.severe_absence_count > 0 ? "border-red-300" : "border-green-200",
    },
    {
      title: "Late Today",
      value: data.late_today.toString(),
      subtitle: "Arrivals after registration",
      icon: Clock,
      color: data.late_today > 5 ? "text-amber-600" : "text-green-600",
      bgColor: data.late_today > 5 ? "bg-amber-50" : "bg-green-50",
      borderColor:
        data.late_today > 5 ? "border-amber-200" : "border-green-200",
    },
    {
      title: "CME",
      value: data.cme_count.toString(),
      subtitle: "Children missing education",
      icon: UserX,
      color: data.cme_count > 0 ? "text-red-700" : "text-green-600",
      bgColor: data.cme_count > 0 ? "bg-red-50" : "bg-green-50",
      borderColor: data.cme_count > 0 ? "border-red-200" : "border-green-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`rounded-xl border p-4 ${card.bgColor} ${card.borderColor} transition-all hover:shadow-md ${card.large ? "sm:col-span-2 lg:col-span-1" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {card.title}
              </span>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">{card.subtitle}</span>
              {card.trend && (
                <span
                  className={`flex items-center text-xs ${card.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {card.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {card.trendValue}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Registration View
// ──────────────────────────────────────────────────────────────────────────────

function RegistrationView({ organizationId }: { organizationId: string }) {
  const [selectedClass, setSelectedClass] = useState(DEMO_CLASSES[3].id);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [session, setSession] = useState<"AM" | "PM">("AM");
  const [editedMarks, setEditedMarks] = useState<Map<string, string>>(
    new Map(),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCodePicker, setShowCodePicker] = useState<string | null>(null);

  const registerParams = new URLSearchParams({
    date: selectedDate,
    class_id: selectedClass,
    session,
  }).toString();
  const {
    data: registerData,
    isLoading: loading,
    mutate: mutateRegisters,
  } = useSWR(`/api/attendance/registers?${registerParams}`, fetcher, {
    revalidateOnFocus: false,
    onSuccess: () => {
      setSaved(false);
      setEditedMarks(new Map());
    },
  });
  const marks: RegisterMark[] = registerData?.registers || [];
  const isDemo = registerData?.is_demo ?? true;

  const handleMarkChange = (pupilId: string, code: string) => {
    setEditedMarks((prev) => new Map(prev).set(pupilId, code));
    setShowCodePicker(null);
    setSaved(false);
  };

  const handleAllPresent = () => {
    const newMarks = new Map<string, string>();
    const code = session === "AM" ? "/" : "\\";
    marks.forEach((m) => newMarks.set(m.pupil_id, code));
    setEditedMarks(newMarks);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const marksToSave = marks.map((m) => ({
        pupil_id: m.pupil_id,
        pupil_name: m.pupil_name,
        code: editedMarks.get(m.pupil_id) || m.code,
        minutes_late: null,
        notes: null,
      }));

      const res = await fetch("/api/attendance/registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          session,
          class_id: selectedClass,
          marks: marksToSave,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorText = await res.text().catch(() => "");
        setSaveError(
          `Failed to save register (${res.status}). ${errorText ? errorText : "Please try again or contact your administrator."}`,
        );
      }
    } catch (err) {
      console.error("Failed to save marks:", err);
      setSaveError(
        "Network error: could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getCurrentCode = (pupilId: string, originalCode: string) => {
    return editedMarks.get(pupilId) || originalCode;
  };

  const getCodeInfo = (code: string) => {
    return ATTENDANCE_CODES.find((c) => c.code === code);
  };

  const hasChanges = editedMarks.size > 0;
  const selectedClassName =
    DEMO_CLASSES.find((c) => c.id === selectedClass)?.name || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Registration
          </h3>
          <div className="flex-1" />

          {/* Class selector */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEMO_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Date picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* AM/PM toggle */}
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setSession("AM")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                session === "AM"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              AM
            </button>
            <button
              onClick={() => setSession("PM")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                session === "PM"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleAllPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            All Present
          </button>
          <div className="text-xs text-gray-500 ml-2">
            {formatDate(selectedDate)} &middot; {selectedClassName} &middot;{" "}
            {session} session
          </div>
          <div className="flex-1" />
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Register"}
            </button>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              Register not saved
            </p>
            <p className="text-sm text-red-700 mt-0.5">{saveError}</p>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 p-1"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Marks grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading register...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {marks.map((mark) => {
              const currentCode = getCurrentCode(mark.pupil_id, mark.code);
              const codeInfo = getCodeInfo(currentCode);
              const isEdited = editedMarks.has(mark.pupil_id);
              const isPresent = currentCode === "/" || currentCode === "\\";
              const isPickerOpen = showCodePicker === mark.pupil_id;

              return (
                <div
                  key={mark.pupil_id}
                  className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    isEdited
                      ? "border-blue-300 bg-blue-50"
                      : isPresent
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {mark.pupil_name}
                    </div>
                  </div>

                  {/* Quick code buttons */}
                  <div className="flex items-center gap-1">
                    {QUICK_CODES.slice(0, 4).map((qCode) => {
                      const qi = getCodeInfo(qCode);
                      const isActive = currentCode === qCode;
                      return (
                        <button
                          key={qCode}
                          onClick={() => handleMarkChange(mark.pupil_id, qCode)}
                          title={qi?.label}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded transition-colors ${
                            isActive
                              ? `${qi?.color || "bg-gray-500"} text-white`
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {qCode === "\\" ? "\\" : qCode}
                        </button>
                      );
                    })}

                    {/* More codes button */}
                    <button
                      onClick={() =>
                        setShowCodePicker(isPickerOpen ? null : mark.pupil_id)
                      }
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      title="More codes"
                    >
                      ...
                    </button>
                  </div>

                  {/* Expanded code picker */}
                  {isPickerOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Select Code
                        </span>
                        <button
                          onClick={() => setShowCodePicker(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {ATTENDANCE_CODES.map((ac) => (
                          <button
                            key={ac.code}
                            onClick={() =>
                              handleMarkChange(mark.pupil_id, ac.code)
                            }
                            title={ac.label}
                            className={`w-full py-1.5 text-xs font-bold rounded transition-colors ${
                              currentCode === ac.code
                                ? `${ac.color} text-white`
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {ac.code === "\\" ? "\\" : ac.code}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {codeInfo?.label || "Select a code"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Code legend */}
      <div className="px-4 pb-4">
        <details className="group">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
            <Info className="h-3 w-3" />
            DfE Attendance Code Reference
            <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
            {ATTENDANCE_CODES.map((ac) => (
              <div
                key={ac.code}
                className="flex items-center gap-2 text-xs py-1"
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center text-white font-bold rounded text-[10px] ${ac.color}`}
                >
                  {ac.code === "\\" ? "\\" : ac.code}
                </span>
                <span className="text-gray-600">{ac.label}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Year Group Comparison
// ──────────────────────────────────────────────────────────────────────────────

function YearGroupComparison({
  yearGroups,
  nationalAvg,
}: {
  yearGroups: YearGroupStat[];
  nationalAvg: number;
}) {
  const maxRate = 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-indigo-600" />
        Year Group Comparison
      </h3>
      <div className="space-y-3">
        {yearGroups.map((yg) => {
          const barWidth = (yg.attendance_rate / maxRate) * 100;
          const nationalLine = (nationalAvg / maxRate) * 100;
          const aboveNational = yg.attendance_rate >= nationalAvg;

          return (
            <div key={yg.year_group} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-16">
                    Year {yg.year_group}
                  </span>
                  <span className="text-xs text-gray-400">
                    {yg.pupil_count} pupils
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {yg.pa_count > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      {yg.pa_count} PA
                    </span>
                  )}
                  {yg.severe_count > 0 && (
                    <span className="text-xs text-red-800 font-bold">
                      {yg.severe_count} SA
                    </span>
                  )}
                  <span
                    className={`text-sm font-bold ${getRAGColor(yg.attendance_rate)}`}
                  >
                    {yg.attendance_rate}%
                  </span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    aboveNational
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : yg.attendance_rate >= 90
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
                {/* National average line */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-gray-800 opacity-40"
                  style={{ left: `${nationalLine}%` }}
                  title={`National average: ${nationalAvg}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <div className="w-4 h-0.5 bg-gray-800 opacity-40" />
        <span>National average ({nationalAvg}%)</span>
        <div className="flex-1" />
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Above national
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Below national
          (90%+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Below 90%
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Weekly Trend
// ──────────────────────────────────────────────────────────────────────────────

function WeeklyTrendChart({ trend }: { trend: WeeklyTrend[] }) {
  if (trend.length === 0) return null;

  const minRate = Math.min(...trend.map((t) => t.attendance_rate)) - 2;
  const maxRate = Math.max(...trend.map((t) => t.attendance_rate)) + 2;
  const range = maxRate - minRate || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        Weekly Attendance Trend
      </h3>
      <div className="flex items-end gap-1.5 h-40">
        {trend.map((week, idx) => {
          const height = ((week.attendance_rate - minRate) / range) * 100;
          const weekLabel = new Date(
            week.week_commencing + "T00:00:00",
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });
          const isBelow = week.attendance_rate < 94.2;

          return (
            <div
              key={week.week_commencing}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                  {week.attendance_rate}% &middot; w/c {weekLabel}
                </div>
              </div>
              <div
                className={`w-full rounded-t-md transition-all ${
                  isBelow
                    ? "bg-gradient-to-t from-amber-400 to-amber-300"
                    : "bg-gradient-to-t from-blue-500 to-blue-400"
                } hover:opacity-80`}
                style={{
                  height: `${Math.max(height, 5)}%`,
                  minHeight: "4px",
                }}
              />
              <span className="text-[9px] text-gray-400 mt-1 hidden sm:block">
                {weekLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-400 text-center">
        12-week rolling attendance trend
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Day of Week Pattern
// ──────────────────────────────────────────────────────────────────────────────

function DayOfWeekChart({ pattern }: { pattern: DayOfWeekPattern[] }) {
  if (pattern.length === 0) return null;

  const minRate = Math.min(...pattern.map((p) => p.attendance_rate)) - 1;
  const maxRate = 100;
  const range = maxRate - minRate || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-purple-600" />
        Attendance by Day
      </h3>
      <div className="flex items-end gap-3 h-32">
        {pattern.map((day) => {
          const height = ((day.attendance_rate - minRate) / range) * 100;
          const isFriday = day.day === "Friday";
          return (
            <div
              key={day.day}
              className="flex-1 flex flex-col items-center group"
            >
              <span
                className={`text-xs font-bold mb-1 ${
                  isFriday ? "text-red-600" : "text-gray-700"
                }`}
              >
                {day.attendance_rate}%
              </span>
              <div
                className={`w-full rounded-t-lg transition-all ${
                  isFriday
                    ? "bg-gradient-to-t from-red-400 to-red-300"
                    : "bg-gradient-to-t from-indigo-500 to-indigo-400"
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-xs text-gray-500 mt-2 font-medium">
                {day.day.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
      {pattern.some((p) => p.day === "Friday") && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Friday attendance is typically lowest — consider Friday engagement
          activities
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Pupil List with RAG
// ──────────────────────────────────────────────────────────────────────────────

function PupilAttendanceList({ organizationId }: { organizationId: string }) {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"rate" | "name">("rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const summaryParams = yearFilter !== "all" ? `?year_group=${yearFilter}` : "";
  const { data: summaryData, isLoading: loading } = useSWR(
    organizationId ? `/api/attendance/summaries${summaryParams}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const summaries: PupilSummary[] = summaryData?.summaries || [];
  const isDemo = summaryData?.is_demo ?? true;

  const filtered = useMemo(() => {
    let list = [...summaries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.pupil_name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortField === "rate") {
        return sortDir === "asc"
          ? a.attendance_rate - b.attendance_rate
          : b.attendance_rate - a.attendance_rate;
      }
      return sortDir === "asc"
        ? a.pupil_name.localeCompare(b.pupil_name)
        : b.pupil_name.localeCompare(a.pupil_name);
    });
    return list;
  }, [summaries, search, sortField, sortDir]);

  const toggleSort = (field: "rate" | "name") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "rate" ? "asc" : "asc");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-600" />
            Pupil Attendance List
          </h3>
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pupil..."
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          {/* Year filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Years</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y.toString()}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700"
                  >
                    Pupil
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Year
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => toggleSort("rate")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700 mx-auto"
                  >
                    Attendance %
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Sessions
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Auth. Abs.
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Unauth. Abs.
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Late
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((pupil) => (
                <tr
                  key={pupil.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    pupil.is_severe_absence
                      ? "bg-red-50"
                      : pupil.is_persistent_absence
                        ? "bg-amber-50/50"
                        : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getRAGDot(pupil.attendance_rate)}`}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {pupil.pupil_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-600">
                    {pupil.year_group}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`text-sm font-bold ${getRAGColor(pupil.attendance_rate)}`}
                    >
                      {pupil.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-600">
                    {pupil.attended_sessions}/{pupil.possible_sessions}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-600">
                    {pupil.authorised_absences}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`text-sm ${
                        pupil.unauthorised_absences > 5
                          ? "text-red-600 font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      {pupil.unauthorised_absences}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`text-sm ${
                        pupil.late_marks > 10
                          ? "text-amber-600 font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      {pupil.late_marks}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {pupil.is_severe_absence ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-200 text-red-900">
                        <XCircle className="h-3 w-3" />
                        SEVERE
                      </span>
                    ) : pupil.is_persistent_absence ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        PA
                      </span>
                    ) : pupil.attendance_rate < 96 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        Monitor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Good
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RAG key */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-600">RAG Key:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          96%+ (Good)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          90-96% (Monitor)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          &lt;90% (PA)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-800" />
          &lt;50% (Severe)
        </span>
        <span className="ml-auto text-gray-400">
          {filtered.length} pupils shown
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Interventions
// ──────────────────────────────────────────────────────────────────────────────

function InterventionsPanel({ organizationId }: { organizationId: string }) {
  const {
    data: interventionData,
    isLoading: loading,
    mutate: mutateInterventions,
  } = useSWR(organizationId ? "/api/attendance/interventions" : null, fetcher, {
    revalidateOnFocus: false,
  });
  const interventions: Intervention[] = interventionData?.interventions || [];
  const isDemo = interventionData?.is_demo ?? true;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [newPupilName, setNewPupilName] = useState("");
  const [newType, setNewType] = useState("letter");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newPupilName || !newDescription) return;
    setCreating(true);
    try {
      const res = await fetch("/api/attendance/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pupil_id: `manual-${Date.now()}`,
          pupil_name: newPupilName,
          type: newType,
          description: newDescription,
          assigned_to: newAssignedTo,
          due_date: newDueDate || null,
          trigger: "custom",
        }),
      });
      if (res.ok) {
        mutateInterventions();
        setShowCreateForm(false);
        setNewPupilName("");
        setNewDescription("");
        setNewAssignedTo("");
        setNewDueDate("");
      }
    } catch (err) {
      console.error("Failed to create intervention:", err);
    } finally {
      setCreating(false);
    }
  };

  const activeInterventions = interventions.filter(
    (i) => i.status !== "completed" && i.status !== "cancelled",
  );
  const completedInterventions = interventions.filter(
    (i) => i.status === "completed" || i.status === "cancelled",
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Attendance Interventions
            {activeInterventions.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                {activeInterventions.length} active
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Intervention
          </button>
        </div>
      </div>

      {/* Auto-trigger thresholds info */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">
              Auto-trigger thresholds (DfE Working Together guidance)
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {INTERVENTION_THRESHOLDS.map((t) => (
                <span key={t.rate} className={`text-xs ${t.color} font-medium`}>
                  &lt;{t.rate}%: {t.action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Create Intervention
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-medium">
                Pupil Name *
              </label>
              <input
                type="text"
                value={newPupilName}
                onChange={(e) => setNewPupilName(e.target.value)}
                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Oliver Thompson"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">
                Intervention Type *
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="letter">Monitoring Letter</option>
                <option value="meeting">Parent Meeting</option>
                <option value="pa_letter">PA Formal Letter</option>
                <option value="ewo_referral">EWO Referral</option>
                <option value="parenting_contract">Parenting Contract</option>
                <option value="fixed_penalty">Fixed Penalty Notice</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600 font-medium">
                Description *
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Describe the intervention and reason..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">
                Assigned To
              </label>
              <input
                type="text"
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Mrs Johnson (Attendance Lead)"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">
                Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={creating || !newPupilName || !newDescription}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Interventions list */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : activeInterventions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm">No active interventions</p>
          </div>
        ) : (
          activeInterventions.map((intervention) => {
            const statusBadge = getStatusBadge(intervention.status);
            const isExpanded = expandedId === intervention.id;
            const isOverdue =
              intervention.due_date &&
              new Date(intervention.due_date) < new Date();

            return (
              <div
                key={intervention.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isOverdue ? "bg-red-50/30" : ""
                }`}
              >
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : intervention.id)
                  }
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getRAGDot(intervention.attendance_rate)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {intervention.pupil_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        Year {intervention.year_group}
                      </span>
                      <span
                        className={`text-xs font-bold ${getRAGColor(intervention.attendance_rate)}`}
                      >
                        {intervention.attendance_rate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {getTriggerLabel(intervention.trigger)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-300" />
                      <span className="text-xs font-medium text-gray-700">
                        {getTypeLabel(intervention.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOverdue && (
                      <span className="text-xs font-bold text-red-600">
                        OVERDUE
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-5 pl-3 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-700">
                      {intervention.description}
                    </p>
                    {intervention.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        Notes: {intervention.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                      {intervention.assigned_to && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {intervention.assigned_to}
                        </span>
                      )}
                      {intervention.due_date && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? "text-red-600 font-bold" : ""
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          Due: {formatDate(intervention.due_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created:{" "}
                        {new Date(intervention.created_at).toLocaleDateString(
                          "en-GB",
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Completed interventions (collapsed) */}
      {completedInterventions.length > 0 && (
        <details className="border-t border-gray-200">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            {completedInterventions.length} completed/cancelled interventions
          </summary>
          <div className="divide-y divide-gray-100">
            {completedInterventions.map((intervention) => {
              const statusBadge = getStatusBadge(intervention.status);
              return (
                <div key={intervention.id} className="px-4 py-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {intervention.pupil_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getTypeLabel(intervention.type)}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* DfE link */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <a
          href="/dashboard/intelligence"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <BarChart3 className="h-3 w-3" />
          View DfE attendance data trends in Intelligence module
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section: Active Tab Navigation
// ──────────────────────────────────────────────────────────────────────────────

type TabId = "overview" | "register" | "analysis" | "interventions";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    description: "Whole-school statistics and trends",
  },
  {
    id: "register",
    label: "Registration",
    icon: ClipboardList,
    description: "Take the register",
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: Eye,
    description: "Pupil-level attendance data",
  },
  {
    id: "interventions",
    label: "Interventions",
    icon: Shield,
    description: "Manage attendance interventions",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────────────────────────────────────

export default function AttendanceDashboardPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { data: dashboardData, isLoading: loadingDashboard } =
    useSWR<DashboardData>(
      organizationId ? "/api/attendance/dashboard" : null,
      fetcher,
      { revalidateOnFocus: false },
    );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500">
                Track, analyse and improve school attendance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Academic Year 2025-26</span>
        </div>
      </div>

      {/* Demo banner */}
      {dashboardData?.is_demo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Demo Mode</p>
            <p className="text-xs text-blue-700">
              Showing sample data. Connect your MIS (SIMS, Arbor, Bromcom) to
              see real attendance data.
            </p>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">
                Loading attendance data...
              </span>
            </div>
          ) : dashboardData ? (
            <>
              <OverviewCards data={dashboardData.overview} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <YearGroupComparison
                  yearGroups={dashboardData.year_groups}
                  nationalAvg={dashboardData.overview.national_average}
                />
                <WeeklyTrendChart trend={dashboardData.weekly_trend} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DayOfWeekChart pattern={dashboardData.day_of_week_pattern} />

                {/* Quick stats card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Key Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Total on roll
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {dashboardData.overview.total_pupils}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Overall attendance
                      </span>
                      <span
                        className={`text-sm font-bold ${getRAGColor(dashboardData.overview.overall_attendance)}`}
                      >
                        {dashboardData.overview.overall_attendance}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        vs National average
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          dashboardData.overview.overall_attendance >=
                          dashboardData.overview.national_average
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {dashboardData.overview.overall_attendance >=
                        dashboardData.overview.national_average
                          ? "+"
                          : ""}
                        {(
                          dashboardData.overview.overall_attendance -
                          dashboardData.overview.national_average
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Persistent absence rate
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          dashboardData.overview.pa_rate > 10
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {dashboardData.overview.pa_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Best year group
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        Year{" "}
                        {
                          dashboardData.year_groups.reduce((best, yg) =>
                            yg.attendance_rate > best.attendance_rate
                              ? yg
                              : best,
                          ).year_group
                        }{" "}
                        (
                        {Math.max(
                          ...dashboardData.year_groups.map(
                            (yg) => yg.attendance_rate,
                          ),
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">
                        Year group of concern
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        Year{" "}
                        {
                          dashboardData.year_groups.reduce((worst, yg) =>
                            yg.attendance_rate < worst.attendance_rate
                              ? yg
                              : worst,
                          ).year_group
                        }{" "}
                        (
                        {Math.min(
                          ...dashboardData.year_groups.map(
                            (yg) => yg.attendance_rate,
                          ),
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">
              Failed to load dashboard data.
            </div>
          )}
        </div>
      )}

      {activeTab === "register" && (
        <RegistrationView organizationId={organizationId} />
      )}

      {activeTab === "analysis" && (
        <PupilAttendanceList organizationId={organizationId} />
      )}

      {activeTab === "interventions" && (
        <InterventionsPanel organizationId={organizationId} />
      )}
    </div>
  );
}
