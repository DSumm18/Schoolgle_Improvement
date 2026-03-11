"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  UserMinus,
  UserPlus,
  Calendar,
  Clock,
  PoundSterling,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Phone,
  FileText,
  BarChart3,
  TrendingUp,
  Building2,
  Search,
  Plus,
  X,
  ArrowUpDown,
  Info,
  ClipboardCheck,
  CalendarDays,
  Briefcase,
  Shield,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

type AbsenceType =
  | "sickness"
  | "family_emergency"
  | "bereavement"
  | "medical_appointment"
  | "training"
  | "jury_service"
  | "maternity"
  | "paternity"
  | "adoption"
  | "authorised_unpaid"
  | "unauthorised"
  | "suspension"
  | "other";

interface Absence {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_role: string;
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  half_day: boolean;
  half_day_period: string | null;
  total_days: number;
  reason: string;
  sick_note_received: boolean;
  return_to_work_completed: boolean;
  cover_required: boolean;
  status: string;
  created_at: string;
}

interface CoverArrangement {
  id: string;
  absence_id: string;
  staff_name: string;
  staff_role: string;
  date: string;
  period: string;
  class_name: string;
  cover_type: string;
  cover_staff_name: string;
  cover_staff_role: string;
  subject: string;
  notes: string;
  status: string;
  cost: number;
}

interface BradfordAlert {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  spells: number;
  total_days: number;
  bradford_score: number;
  trigger_level: string;
  last_absence: string;
}

interface SupplyAgency {
  name: string;
  daily_rate: number;
  bookings_ytd: number;
  spend_ytd: number;
  rating: number;
}

interface SupplyBooking {
  id: string;
  supply_name: string;
  agency: string;
  date: string;
  covering_for: string;
  class_name: string;
  daily_rate: number;
  status: string;
}

interface DashboardData {
  today: {
    date: string;
    absences_count: number;
    periods_needing_cover: number;
    periods_covered: number;
    periods_pending: number;
    periods_uncovered: number;
    cover_rate: number;
  };
  week: {
    total_absences: number;
    total_days_lost: number;
    supply_days: number;
    internal_cover_periods: number;
    supply_cost: number;
  };
  term: {
    total_absences: number;
    total_days_lost: number;
    sickness_days: number;
    other_days: number;
    supply_days: number;
    supply_cost: number;
    average_daily_absence: number;
  };
  ytd: {
    supply_spend: number;
    supply_budget: number;
    supply_budget_remaining: number;
    budget_percentage_used: number;
    average_supply_day_rate: number;
    icfp_e02_total: number;
  };
  monthly_supply_spend: { month: string; spend: number }[];
  absence_by_type: {
    type: string;
    count: number;
    days: number;
    label: string;
  }[];
  bradford_alerts: BradfordAlert[];
  supply_agencies: SupplyAgency[];
  supply_bookings: SupplyBooking[];
  patterns: {
    day_of_week: { day: string; count: number }[];
    return_to_work: {
      completed: number;
      pending: number;
      overdue: number;
      completion_rate: number;
    };
  };
  demo: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────

const ABSENCE_TYPES: { value: AbsenceType; label: string; icon: string }[] = [
  { value: "sickness", label: "Sickness", icon: "🤒" },
  { value: "family_emergency", label: "Family Emergency", icon: "👨‍👩‍👧" },
  { value: "bereavement", label: "Bereavement", icon: "🕊️" },
  { value: "medical_appointment", label: "Medical Appointment", icon: "🏥" },
  { value: "training", label: "Training / CPD", icon: "📚" },
  { value: "jury_service", label: "Jury Service", icon: "⚖️" },
  { value: "maternity", label: "Maternity Leave", icon: "👶" },
  { value: "paternity", label: "Paternity Leave", icon: "👶" },
  { value: "adoption", label: "Adoption Leave", icon: "🤝" },
  { value: "authorised_unpaid", label: "Authorised Unpaid", icon: "📋" },
  { value: "unauthorised", label: "Unauthorised", icon: "⚠️" },
  { value: "suspension", label: "Suspension", icon: "🚫" },
  { value: "other", label: "Other", icon: "📝" },
];

const PERIODS = ["Reg", "P1", "P2", "P3", "P4", "P5"];

const COVER_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  internal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  supply: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  uncovered: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const BRADFORD_TRIGGERS = [
  { threshold: 0, label: "Monitor", color: "text-gray-500", bg: "bg-gray-100" },
  {
    threshold: 100,
    label: "Informal Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    threshold: 500,
    label: "Formal Meeting",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    threshold: 1000,
    label: "Final Warning",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

// ─── Demo Staff List ────────────────────────────────────────────────

const DEMO_STAFF = [
  { id: "staff-001", name: "Sarah Mitchell", role: "Year 4 Teacher" },
  { id: "staff-002", name: "James Anderson", role: "Year 6 Teacher" },
  { id: "staff-003", name: "Emily Roberts", role: "Year 2 Teacher" },
  { id: "staff-004", name: "David Thompson", role: "PE Teacher" },
  { id: "staff-005", name: "Rachel Green", role: "Year 1 Teacher" },
  { id: "staff-006", name: "Tom Wilson", role: "Year 5 Teacher" },
  { id: "staff-007", name: "Laura Chen", role: "Year 3 Teacher" },
  { id: "staff-008", name: "Karen Patel", role: "Reception Teacher" },
  { id: "staff-009", name: "Angela Foster", role: "Year 3 TA" },
  { id: "staff-010", name: "Paul Chambers", role: "Site Manager" },
  { id: "staff-011", name: "Helen Barnes", role: "HLTA" },
  { id: "staff-012", name: "Mark Stevens", role: "Deputy Head" },
  { id: "staff-013", name: "Susan Clarke", role: "SENCO" },
  { id: "staff-014", name: "Lisa Morgan", role: "TA3 (Year 2)" },
];

// ─── Helper Functions ───────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getBradfordTrigger(score: number) {
  let trigger = BRADFORD_TRIGGERS[0];
  for (const t of BRADFORD_TRIGGERS) {
    if (score >= t.threshold) trigger = t;
  }
  return trigger;
}

function getAbsenceTypeLabel(type: AbsenceType): string {
  return ABSENCE_TYPES.find((t) => t.value === type)?.label || type;
}

// ─── Main Component ─────────────────────────────────────────────────

export default function CoverManagementPage() {
  // ─── State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "board" | "record" | "supply" | "analysis"
  >("board");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [arrangements, setArrangements] = useState<CoverArrangement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  // Record absence form
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [formStaffId, setFormStaffId] = useState("");
  const [formAbsenceType, setFormAbsenceType] =
    useState<AbsenceType>("sickness");
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formEndDate, setFormEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formHalfDay, setFormHalfDay] = useState(false);
  const [formHalfDayPeriod, setFormHalfDayPeriod] = useState<"am" | "pm">("am");
  const [formReason, setFormReason] = useState("");

  // Quick-assign modal
  const [assignModal, setAssignModal] = useState<{
    period: string;
    className: string;
    absenceId: string;
  } | null>(null);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignType, setAssignType] = useState<"internal" | "supply">(
    "internal",
  );

  // Analysis sort
  const [bradfordSort, setBradfordSort] = useState<"score" | "name" | "days">(
    "score",
  );
  const [bradfordSortDir, setBradfordSortDir] = useState<"asc" | "desc">(
    "desc",
  );

  // ─── Data Fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, absRes, arrRes] = await Promise.all([
        fetch("/api/cover/dashboard"),
        fetch("/api/cover/absences?status=active"),
        fetch(
          "/api/cover/arrangements?date=" +
            new Date().toISOString().split("T")[0],
        ),
      ]);

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboard(dashData);
        setIsDemo(dashData.demo === true);
      }
      if (absRes.ok) {
        const absData = await absRes.json();
        setAbsences(absData.absences || []);
      }
      if (arrRes.ok) {
        const arrData = await arrRes.json();
        setArrangements(arrData.arrangements || []);
      }
    } catch (err) {
      console.error("[Cover] Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived Data ───────────────────────────────────────────────

  const todayAbsences = useMemo(
    () => absences.filter((a) => a.status === "active"),
    [absences],
  );

  // Group arrangements by class for the cover board
  const coverBoard = useMemo(() => {
    const classes = new Map<
      string,
      {
        className: string;
        staffName: string;
        absenceId: string;
        periods: Record<string, CoverArrangement | null>;
      }
    >();

    arrangements.forEach((arr) => {
      if (!classes.has(arr.class_name)) {
        classes.set(arr.class_name, {
          className: arr.class_name,
          staffName: arr.staff_name,
          absenceId: arr.absence_id,
          periods: {},
        });
      }
      const row = classes.get(arr.class_name)!;
      row.periods[arr.period] = arr;
    });

    return Array.from(classes.values()).sort((a, b) =>
      a.className.localeCompare(b.className),
    );
  }, [arrangements]);

  // Sorted Bradford alerts
  const sortedBradford = useMemo(() => {
    if (!dashboard) return [];
    const alerts = [...dashboard.bradford_alerts];
    alerts.sort((a, b) => {
      let cmp = 0;
      if (bradfordSort === "score") cmp = a.bradford_score - b.bradford_score;
      else if (bradfordSort === "name")
        cmp = a.staff_name.localeCompare(b.staff_name);
      else if (bradfordSort === "days") cmp = a.total_days - b.total_days;
      return bradfordSortDir === "desc" ? -cmp : cmp;
    });
    return alerts;
  }, [dashboard, bradfordSort, bradfordSortDir]);

  // ─── Handlers ───────────────────────────────────────────────────

  const handleRecordAbsence = async () => {
    const staff = DEMO_STAFF.find((s) => s.id === formStaffId);
    if (!staff) return;

    try {
      const res = await fetch("/api/cover/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: formStaffId,
          staff_name: staff.name,
          staff_role: staff.role,
          absence_type: formAbsenceType,
          start_date: formStartDate,
          end_date: formEndDate,
          half_day: formHalfDay,
          half_day_period: formHalfDay ? formHalfDayPeriod : null,
          reason: formReason,
          cover_required: true,
        }),
      });

      if (res.ok) {
        setShowRecordForm(false);
        setFormStaffId("");
        setFormReason("");
        fetchData();
      }
    } catch (err) {
      console.error("[Cover] Failed to record absence:", err);
    }
  };

  const handleQuickAssign = async () => {
    if (!assignModal || !assignStaffId) return;
    const staff = DEMO_STAFF.find((s) => s.id === assignStaffId);
    if (!staff) return;

    try {
      await fetch("/api/cover/arrangements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          absence_id: assignModal.absenceId,
          date: new Date().toISOString().split("T")[0],
          period: assignModal.period,
          class_name: assignModal.className,
          cover_type: assignType,
          cover_staff_name: staff.name,
          cover_staff_role: staff.role,
        }),
      });
      setAssignModal(null);
      setAssignStaffId("");
      fetchData();
    } catch (err) {
      console.error("[Cover] Failed to assign cover:", err);
    }
  };

  const toggleBradfordSort = (field: "score" | "name" | "days") => {
    if (bradfordSort === field) {
      setBradfordSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setBradfordSort(field);
      setBradfordSortDir("desc");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-100 animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const d = dashboard;

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <UserMinus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cover Management
            </h1>
            <p className="text-sm text-gray-500">
              Staff absences, cover arrangements and supply tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => {
              setShowRecordForm(true);
              setActiveTab("record");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Record Absence
          </button>
        </div>
      </div>

      {/* ─── Demo Banner ─────────────────────────────────────────── */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-medium text-amber-800">Demo Mode</span>
            <span className="text-amber-700 text-sm ml-2">
              Showing sample data. Connect your staff directory and start
              recording absences to see real data.
            </span>
          </div>
        </div>
      )}

      {/* ─── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserMinus className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Absent Today
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {d?.today.absences_count ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {d?.today.periods_uncovered ?? 0} uncovered periods
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Cover Rate
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {d?.today.cover_rate ?? 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {d?.today.periods_covered ?? 0} of{" "}
            {d?.today.periods_needing_cover ?? 0} periods covered
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Supply YTD
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(d?.ytd?.supply_spend ?? 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(d?.ytd?.supply_budget_remaining ?? 0)} budget
            remaining
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Bradford Alerts
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {d?.bradford_alerts?.filter((a) => a.trigger_level !== "monitor")
              .length ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Staff above trigger thresholds
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          {
            key: "board" as const,
            label: "Today's Cover Board",
            icon: Calendar,
          },
          { key: "record" as const, label: "Record Absence", icon: UserMinus },
          {
            key: "supply" as const,
            label: "Supply Management",
            icon: Briefcase,
          },
          {
            key: "analysis" as const,
            label: "Absence Analysis",
            icon: BarChart3,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: TODAY'S COVER BOARD                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "board" && (
        <div className="space-y-6">
          {/* Staff absent today */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-red-500" />
                Staff Absent Today
              </h2>
              <span className="text-sm text-gray-500">
                {todayAbsences.length} absent
              </span>
            </div>
            <div className="p-5">
              {todayAbsences.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                  <p className="font-medium">No absences today</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayAbsences.map((abs) => (
                    <div
                      key={abs.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {abs.staff_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {abs.staff_role}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            abs.absence_type === "sickness"
                              ? "bg-red-100 text-red-700"
                              : abs.absence_type === "training"
                                ? "bg-blue-100 text-blue-700"
                                : abs.absence_type === "medical_appointment"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getAbsenceTypeLabel(abs.absence_type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{abs.reason}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {abs.half_day
                            ? `Half day (${abs.half_day_period?.toUpperCase()})`
                            : abs.total_days > 1
                              ? `Day ${Math.ceil((Date.now() - new Date(abs.start_date + "T00:00:00").getTime()) / 86400000) + 1} of ${abs.total_days}`
                              : "Full day"}
                        </span>
                        {abs.total_days > 3 && !abs.sick_note_received && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <FileText className="w-3 h-3" />
                            Sick note needed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cover Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Cover Grid
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-200" /> Internal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-200" /> Supply
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-200" /> Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-200" /> Uncovered
                </span>
              </div>
            </div>
            <div className="p-5 overflow-x-auto">
              {coverBoard.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2" />
                  <p>No cover arrangements for today</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-40">
                        Class (Absent Staff)
                      </th>
                      {PERIODS.map((p) => (
                        <th
                          key={p}
                          className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide"
                        >
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coverBoard.map((row) => (
                      <tr
                        key={row.className}
                        className="border-b border-gray-50 hover:bg-gray-25"
                      >
                        <td className="py-2 px-3">
                          <div className="font-medium text-gray-900">
                            {row.className}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.staffName}
                          </div>
                        </td>
                        {PERIODS.map((period) => {
                          const arr = row.periods[period];
                          if (!arr) {
                            return (
                              <td
                                key={period}
                                className="py-2 px-1 text-center"
                              >
                                <span className="text-gray-300 text-xs">—</span>
                              </td>
                            );
                          }
                          const colors =
                            COVER_COLORS[arr.cover_type] ||
                            COVER_COLORS[arr.status] ||
                            COVER_COLORS.pending;
                          return (
                            <td key={period} className="py-2 px-1">
                              {arr.status === "uncovered" ||
                              arr.status === "pending" ? (
                                <button
                                  onClick={() =>
                                    setAssignModal({
                                      period,
                                      className: row.className,
                                      absenceId: row.absenceId,
                                    })
                                  }
                                  className={`w-full px-2 py-1.5 rounded border text-xs font-medium cursor-pointer transition-all hover:shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}
                                >
                                  {arr.status === "uncovered" ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <XCircle className="w-3 h-3" />
                                      Assign
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <div
                                  className={`w-full px-2 py-1.5 rounded border text-xs ${colors.bg} ${colors.text} ${colors.border}`}
                                  title={`${arr.cover_staff_name} — ${arr.subject}\n${arr.notes}`}
                                >
                                  <div className="font-medium truncate">
                                    {arr.cover_staff_name?.split(" ")[0] ||
                                      "Assigned"}
                                  </div>
                                  <div className="text-[10px] opacity-75 truncate">
                                    {arr.subject}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Period summary counts */}
          {d && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {d.today.periods_covered}
                </div>
                <div className="text-xs text-emerald-600">Covered</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {d.week?.supply_days ?? 0}
                </div>
                <div className="text-xs text-blue-600">Supply Days (Week)</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {d.today.periods_pending}
                </div>
                <div className="text-xs text-amber-600">Pending</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {d.today.periods_uncovered}
                </div>
                <div className="text-xs text-red-600">Uncovered</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: RECORD ABSENCE                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "record" && (
        <div className="space-y-6">
          {/* Record Absence Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-red-500" />
                Record New Absence
              </h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Staff selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Staff Member
                </label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select staff member...</option>
                  {DEMO_STAFF.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Absence type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Absence Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ABSENCE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormAbsenceType(type.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        formAbsenceType === type.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span className="truncate">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => {
                      setFormStartDate(e.target.value);
                      if (e.target.value > formEndDate)
                        setFormEndDate(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={formStartDate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Half day toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHalfDay}
                    onChange={(e) => setFormHalfDay(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Half day only
                  </span>
                </label>
                {formHalfDay && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormHalfDayPeriod("am")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        formHalfDayPeriod === "am"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      AM (Morning)
                    </button>
                    <button
                      onClick={() => setFormHalfDayPeriod("pm")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        formHalfDayPeriod === "pm"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      PM (Afternoon)
                    </button>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason / Notes
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={3}
                  placeholder="Brief description of absence reason..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Cover slots generated */}
              {formStaffId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Cover Slots Required
                  </h3>
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const start = new Date(formStartDate);
                      const end = new Date(formEndDate);
                      let days = 0;
                      const curr = new Date(start);
                      while (curr <= end) {
                        if (curr.getDay() !== 0 && curr.getDay() !== 6) days++;
                        curr.setDate(curr.getDate() + 1);
                      }
                      if (formHalfDay) days = Math.max(days - 0.5, 0.5);
                      const periods = formHalfDay ? 3 : 6;
                      const totalSlots = days * periods;
                      return (
                        <>
                          <span className="font-semibold">{days}</span> working
                          day{days !== 1 ? "s" : ""} ={" "}
                          <span className="font-semibold">{totalSlots}</span>{" "}
                          cover period{totalSlots !== 1 ? "s" : ""} to arrange
                          {formHalfDay && (
                            <span className="ml-2 text-xs">
                              ({formHalfDayPeriod?.toUpperCase()} only)
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRecordForm(false);
                    setFormStaffId("");
                    setFormReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordAbsence}
                  disabled={!formStaffId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Absence
                </button>
              </div>
            </div>
          </div>

          {/* Recent absences list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Absences
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Staff
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Dates
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Days
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      RTW
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {absences.slice(0, 15).map((abs) => (
                    <tr
                      key={abs.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {abs.staff_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {abs.staff_role}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            abs.absence_type === "sickness"
                              ? "bg-red-100 text-red-700"
                              : abs.absence_type === "training"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getAbsenceTypeLabel(abs.absence_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(abs.start_date)}
                        {abs.start_date !== abs.end_date &&
                          ` — ${formatDate(abs.end_date)}`}
                        {abs.half_day && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({abs.half_day_period?.toUpperCase()})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-gray-900">
                        {abs.total_days}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            abs.status === "active"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {abs.status === "active" ? "Active" : "Completed"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {abs.return_to_work_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : abs.status === "completed" ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: SUPPLY MANAGEMENT                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "supply" && d && (
        <div className="space-y-6">
          {/* Supply Agencies */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Supply Agencies
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(d.supply_agencies || []).map((agency) => (
                  <div
                    key={agency.name}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {agency.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(agency.daily_rate)}/day
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < Math.round(agency.rating)
                                ? "bg-amber-400"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {agency.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bookings YTD</span>
                      <span className="font-medium text-gray-900">
                        {agency.bookings_ytd}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Spend YTD</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(agency.spend_ytd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Supply Bookings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Active Supply Bookings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Supply Teacher
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Agency
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Covering For
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Day Rate
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(d.supply_bookings || []).map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {booking.supply_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {booking.agency}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(booking.date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {booking.covering_for}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {booking.class_name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(booking.daily_rate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            booking.status === "on_site"
                              ? "bg-emerald-100 text-emerald-700"
                              : booking.status === "booked"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {booking.status === "on_site"
                            ? "On Site"
                            : booking.status === "booked"
                              ? "Booked"
                              : booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supply Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Supply Spend Chart (CSS bar chart) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Monthly Supply Spend
                </h2>
              </div>
              <div className="p-5">
                {(() => {
                  const maxSpend = Math.max(
                    ...d.monthly_supply_spend.map((m) => m.spend),
                  );
                  return (
                    <div className="space-y-3">
                      {d.monthly_supply_spend.map((month) => (
                        <div
                          key={month.month}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm text-gray-500 w-10 text-right">
                            {month.month}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.max((month.spend / maxSpend) * 100, 8)}%`,
                              }}
                            >
                              <span className="text-xs font-medium text-white">
                                {formatCurrency(month.spend)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PoundSterling className="w-5 h-5 text-emerald-500" />
                  Supply Budget YTD
                </h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Budget progress bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Budget Used</span>
                    <span className="font-medium text-gray-900">
                      {d.ytd?.budget_percentage_used ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (d.ytd?.budget_percentage_used ?? 0) > 90
                          ? "bg-red-500"
                          : (d.ytd?.budget_percentage_used ?? 0) > 75
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(d.ytd?.budget_percentage_used ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>
                      {formatCurrency(d.ytd?.supply_spend ?? 0)} spent
                    </span>
                    <span>
                      {formatCurrency(d.ytd?.supply_budget ?? 0)} budget
                    </span>
                  </div>
                </div>

                {/* Key figures */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">
                      Total Supply Spend
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(d.ytd?.supply_spend ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">
                      Budget Remaining
                    </span>
                    <span
                      className={`font-semibold ${
                        (d.ytd?.supply_budget_remaining ?? 0) < 2000
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(d.ytd?.supply_budget_remaining ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Avg Day Rate</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(d.ytd?.average_supply_day_rate ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">
                      Term Supply Days
                    </span>
                    <span className="font-semibold text-gray-900">
                      {d.term?.supply_days ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      ICFP Code E02
                      <span
                        className="text-xs text-gray-400"
                        title="Supply teaching costs"
                      >
                        (i)
                      </span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(d.ytd?.icfp_e02_total ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 4: ABSENCE ANALYSIS                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "analysis" && d && (
        <div className="space-y-6">
          {/* Bradford Factor Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Bradford Factor Scores
                </h2>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Formula: S{"\u00B2"} x D (Spells squared x Total Days)
                </div>
              </div>
            </div>
            <div className="p-5">
              {/* Bradford threshold key */}
              <div className="flex flex-wrap gap-3 mb-4">
                {BRADFORD_TRIGGERS.map((trigger) => (
                  <div
                    key={trigger.label}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${trigger.bg} ${trigger.color}`}
                  >
                    <span>
                      {trigger.threshold === 0
                        ? "0-99"
                        : trigger.threshold === 100
                          ? "100-499"
                          : trigger.threshold === 500
                            ? "500-999"
                            : "1000+"}
                    </span>
                    <span>{trigger.label}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th
                        className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                        onClick={() => toggleBradfordSort("name")}
                      >
                        <span className="flex items-center gap-1">
                          Staff Member
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Spells (S)
                      </th>
                      <th
                        className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                        onClick={() => toggleBradfordSort("days")}
                      >
                        <span className="flex items-center justify-center gap-1">
                          Total Days (D)
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                        onClick={() => toggleBradfordSort("score")}
                      >
                        <span className="flex items-center justify-center gap-1">
                          Bradford Score
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Trigger Level
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Last Absence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBradford.map((alert) => {
                      const trigger = getBradfordTrigger(alert.bradford_score);
                      return (
                        <tr
                          key={alert.staff_id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {alert.staff_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {alert.staff_role}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-gray-900">
                            {alert.spells}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-gray-900">
                            {alert.total_days}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-bold text-lg ${
                                alert.bradford_score >= 500
                                  ? "text-red-600"
                                  : alert.bradford_score >= 100
                                    ? "text-amber-600"
                                    : "text-gray-700"
                              }`}
                            >
                              {alert.bradford_score}
                            </span>
                            <div className="text-[10px] text-gray-400">
                              {alert.spells}
                              {"\u00B2"} x {alert.total_days}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${trigger.bg} ${trigger.color}`}
                            >
                              {trigger.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDate(alert.last_absence)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Absence by Type & Day Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Absence by Type (CSS pie chart approximation) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Absence by Type (This Term)
                </h2>
              </div>
              <div className="p-5">
                {(() => {
                  const total = d.absence_by_type.reduce(
                    (s, t) => s + t.count,
                    0,
                  );
                  const typeColors = [
                    "bg-red-400",
                    "bg-blue-400",
                    "bg-amber-400",
                    "bg-purple-400",
                    "bg-indigo-400",
                    "bg-emerald-400",
                    "bg-gray-400",
                  ];
                  return (
                    <div className="space-y-4">
                      {/* Stacked bar */}
                      <div className="flex rounded-full h-6 overflow-hidden">
                        {d.absence_by_type.map((type, i) => (
                          <div
                            key={type.type}
                            className={`${typeColors[i % typeColors.length]} transition-all duration-500`}
                            style={{
                              width: `${(type.count / total) * 100}%`,
                            }}
                            title={`${type.label}: ${type.count} (${Math.round((type.count / total) * 100)}%)`}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="space-y-2">
                        {d.absence_by_type.map((type, i) => (
                          <div
                            key={type.type}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded ${typeColors[i % typeColors.length]}`}
                              />
                              <span className="text-sm text-gray-700">
                                {type.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-900">
                                {type.count}
                              </span>
                              <span className="text-xs text-gray-500 w-12 text-right">
                                {type.days}d
                              </span>
                              <span className="text-xs text-gray-400 w-10 text-right">
                                {Math.round((type.count / total) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Day of Week Pattern */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  Absence Patterns by Day
                </h2>
              </div>
              <div className="p-5">
                {(() => {
                  const maxCount = Math.max(
                    ...d.patterns.day_of_week.map((d) => d.count),
                  );
                  const avgCount =
                    d.patterns.day_of_week.reduce((s, d) => s + d.count, 0) / 5;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {d.patterns.day_of_week.map((day) => {
                          const isAboveAverage = day.count > avgCount * 1.3;
                          return (
                            <div
                              key={day.day}
                              className="flex items-center gap-3"
                            >
                              <span className="text-sm text-gray-500 w-20 text-right">
                                {day.day}
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                                    isAboveAverage
                                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                                      : "bg-gradient-to-r from-indigo-500 to-indigo-400"
                                  }`}
                                  style={{
                                    width: `${Math.max((day.count / maxCount) * 100, 12)}%`,
                                  }}
                                >
                                  <span className="text-xs font-medium text-white">
                                    {day.count}
                                  </span>
                                </div>
                              </div>
                              {isAboveAverage && (
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 border-t border-gray-100 pt-3">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>
                          Monday and Friday absences are{" "}
                          <span className="font-medium">
                            30%+ above average
                          </span>{" "}
                          — common pattern in schools
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Return to Work Tracker */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                Return-to-Work Completion
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-700">
                    {d.patterns?.return_to_work.completed ?? 0}
                  </div>
                  <div className="text-xs text-emerald-600">Completed</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">
                    {d.patterns?.return_to_work.pending ?? 0}
                  </div>
                  <div className="text-xs text-amber-600">Pending</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {d.patterns?.return_to_work.overdue ?? 0}
                  </div>
                  <div className="text-xs text-red-600">Overdue</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {d.patterns?.return_to_work.completion_rate ?? 0}%
                  </div>
                  <div className="text-xs text-blue-600">Completion Rate</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${d.patterns?.return_to_work.completion_rate ?? 0}%`,
                  }}
                />
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Return-to-work interviews should be conducted after every
                absence spell. They help identify underlying issues, offer
                support, and demonstrate consistent management of attendance.
              </div>
            </div>
          </div>

          {/* Term Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Term Absence Summary
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {d.term?.total_absences ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total Absences
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {d.term?.total_days_lost ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total Days Lost
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {d.term?.sickness_days ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Sickness Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {d.term?.average_daily_absence?.toFixed(1) ?? "0.0"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg Daily Absence
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK-ASSIGN MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Cover
              </h3>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Class:</span>
                  <span className="font-medium">{assignModal.className}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-medium">{assignModal.period}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignType("internal")}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      assignType === "internal"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Internal Cover
                  </button>
                  <button
                    onClick={() => setAssignType("supply")}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      assignType === "supply"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Supply Teacher
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {assignType === "internal"
                    ? "Select Staff Member"
                    : "Select Supply Teacher"}
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  {assignType === "internal"
                    ? DEMO_STAFF.filter(
                        (s) => !todayAbsences.some((a) => a.staff_id === s.id),
                      ).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.role}
                        </option>
                      ))
                    : [
                        {
                          id: "supply-001",
                          name: "Janet Taylor",
                          role: "Supply (Reed Education)",
                        },
                        {
                          id: "supply-002",
                          name: "Maria Santos",
                          role: "Supply (Reed Education)",
                        },
                        {
                          id: "supply-003",
                          name: "Chris Blackwell",
                          role: "Supply (Hays Education)",
                        },
                      ].map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.role}
                        </option>
                      ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAssign}
                  disabled={!assignStaffId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Cover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
