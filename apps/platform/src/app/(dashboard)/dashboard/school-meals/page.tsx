"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  UtensilsCrossed,
  Users,
  GraduationCap,
  PoundSterling,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Printer,
  Download,
  Plus,
  X,
  Info,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  Wheat,
  Heart,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  totalPupils: number;
  totalOnSchoolMeals: number;
  schoolMealUptakePct: number;
  fsmEligibleCount: number;
  uifsmCount: number;
  ever6FsmCount: number;
  paidMealsCount: number;
  packedLunchCount: number;
  mealPrice: number;
  dailyOrdersToday: number;
  byYearGroup: YearGroupBreakdown[];
  dietarySummary: { requirement: string; count: number }[];
  allergySummary: { allergy: string; count: number }[];
  dailyTrends: DailyTrend[];
  financials: FinancialSummary;
  nationalBenchmarks: Benchmarks;
  isDemo: boolean;
}

interface YearGroupBreakdown {
  yearGroup: string;
  total: number;
  fsm: number;
  uifsm: number;
  paid: number;
  packedLunch: number;
  uptakePct: number;
}

interface DailyTrend {
  date: string;
  ordered: number;
  served: number;
  wasteKg: number;
}

interface FinancialSummary {
  fsmFundingDaily: number;
  uifsmFundingDaily: number;
  paidIncomeDaily: number;
  totalDailyIncome: number;
  estimatedTermIncome: number;
  estimatedAnnualIncome: number;
}

interface Benchmarks {
  ks1UptakePct: number;
  ks2UptakePct: number;
  schoolKs1UptakePct: number;
  schoolKs2UptakePct: number;
}

interface Registration {
  id: string;
  pupil_name_pseudonymised: string;
  year_group: string;
  meal_type: string;
  fsm_eligible: boolean;
  ever_6_fsm: boolean;
  uifsm_eligible: boolean;
  dietary_requirement: string;
  allergies: string[];
  start_date: string;
  status: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YEAR_GROUPS = ["R", "1", "2", "3", "4", "5", "6"];
const MEAL_TYPES = [
  { value: "fsm", label: "Free School Meals", color: "#22c55e" },
  { value: "uifsm", label: "UIFSM", color: "#3b82f6" },
  { value: "paid", label: "Paid", color: "#f59e0b" },
  { value: "packed_lunch", label: "Packed Lunch", color: "#8b5cf6" },
  { value: "home", label: "Home", color: "#6b7280" },
];

const DIETARY_OPTIONS = [
  "Standard",
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
];

const ALLERGY_OPTIONS = [
  "Nuts",
  "Dairy",
  "Gluten",
  "Eggs",
  "Soya",
  "Fish",
  "Sesame",
  "Shellfish",
  "Celery",
  "Mustard",
  "Lupin",
  "Molluscs",
  "Sulphites",
];

// ─── Helper Components ───────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "#0ea5e9",
  alert,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 bg-white dark:bg-zinc-900 ${alert ? "border-amber-300 ring-1 ring-amber-200" : "border-zinc-200 dark:border-zinc-800"}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {alert && (
          <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      {subtext && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
          <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
  label,
  showPct = true,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  showPct?: boolean;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-24 truncate">{label}</span>
      <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showPct && (
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-12 text-right">
          {value} ({pct}%)
        </span>
      )}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function SchoolMealsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  // State
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [yearGroupFilter, setYearGroupFilter] = useState<string>("");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("");
  const [fsmFilter, setFsmFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regPage, setRegPage] = useState(1);
  const regPageSize = 25;

  // Daily orders
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dailyOrderForm, setDailyOrderForm] = useState<
    Record<string, { ordered: number; served: number; wasteKg: number }>
  >({});
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Registration form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReg, setNewReg] = useState({
    pupil_name_pseudonymised: "",
    year_group: "R",
    meal_type: "paid",
    fsm_eligible: false,
    ever_6_fsm: false,
    dietary_requirement: "Standard",
    allergies: [] as string[],
  });

  // Collapsed sections
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: true,
    breakdown: true,
    register: true,
    orders: true,
    dietary: true,
    financial: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await fetch(
        `/api/school-meals/dashboard?organizationId=${organizationId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setDashboard(data);
      setIsDemo(data.isDemo);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load school meals data");
    }
  }, [organizationId]);

  const fetchRegistrations = useCallback(async () => {
    if (!organizationId) return;
    setRegLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        page: regPage.toString(),
        pageSize: regPageSize.toString(),
      });
      if (yearGroupFilter) params.set("year_group", yearGroupFilter);
      if (mealTypeFilter) params.set("meal_type", mealTypeFilter);
      if (fsmFilter) params.set("fsm", "true");

      const res = await fetch(
        `/api/school-meals/registrations?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setRegTotal(data.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch registrations:", err);
      toast.error("Failed to load registrations");
    } finally {
      setRegLoading(false);
    }
  }, [organizationId, yearGroupFilter, mealTypeFilter, fsmFilter, regPage]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchRegistrations()]);
      setLoading(false);
    }
    load();
  }, [fetchDashboard, fetchRegistrations]);

  // ─── Filtered registrations (client-side search) ─────────────────────────

  const filteredRegistrations = useMemo(() => {
    if (!searchQuery) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter(
      (r) =>
        r.pupil_name_pseudonymised.toLowerCase().includes(q) ||
        r.year_group.toLowerCase().includes(q) ||
        r.dietary_requirement.toLowerCase().includes(q),
    );
  }, [registrations, searchQuery]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAddRegistration = async () => {
    if (!organizationId || !newReg.pupil_name_pseudonymised) return;
    try {
      const res = await fetch("/api/school-meals/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newReg, organizationId }),
      });
      if (!res.ok) throw new Error("Failed to add registration");
      setShowAddForm(false);
      setNewReg({
        pupil_name_pseudonymised: "",
        year_group: "R",
        meal_type: "paid",
        fsm_eligible: false,
        ever_6_fsm: false,
        dietary_requirement: "Standard",
        allergies: [],
      });
      fetchRegistrations();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleSaveDailyOrders = async () => {
    if (!organizationId) return;
    const orders = Object.entries(dailyOrderForm).map(([yg, data]) => ({
      date: selectedDate,
      year_group: yg,
      total_pupils: 30,
      school_meals_ordered: data.ordered,
      school_meals_served: data.served,
      waste_kg: data.wasteKg,
      fsm_count: 0,
      uifsm_count: 0,
      paid_count: 0,
      packed_lunch_count: 0,
    }));
    try {
      const res = await fetch("/api/school-meals/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders, organizationId }),
      });
      if (!res.ok) throw new Error("Failed to save orders");
      setShowOrderForm(false);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const toggleAllergy = (allergy: string) => {
    setNewReg((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  // ─── Loading / Error ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl p-3 bg-sky-50 dark:bg-sky-900/20">
            <UtensilsCrossed className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              School Meals & FSM Tracking
            </h1>
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Failed to load dashboard</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const d = dashboard!;
  const totalRegPages = Math.ceil(regTotal / regPageSize);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-3 bg-sky-50 dark:bg-sky-900/20">
            <UtensilsCrossed className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              School Meals & FSM Tracking
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Meal registrations, FSM eligibility, UIFSM, daily orders & dietary
              requirements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchDashboard();
              fetchRegistrations();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm transition opacity-50 cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV (Coming Soon)
          </button>
        </div>
      </div>

      {/* ── Demo Mode Banner ────────────────────────────────────────────── */}
      {isDemo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 flex items-center gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Demo Mode
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Showing sample data for 210 pupils (R-Y6). Import your MIS data or
              add registrations to see real figures.
            </p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition">
            Import from MIS
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 1: Overview Cards
           ══════════════════════════════════════════════════════════════════ */}
      <section>
        <button
          onClick={() => toggleSection("overview")}
          className="flex items-center gap-2 mb-4 group"
        >
          <BarChart3 className="h-5 w-5 text-sky-600" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Overview
          </h2>
          {expandedSections.overview ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {expandedSections.overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={Users}
              label="School Meals"
              value={d.totalOnSchoolMeals}
              subtext={`${d.schoolMealUptakePct}% uptake of ${d.totalPupils} pupils`}
              color="#0ea5e9"
            />
            <StatCard
              icon={Heart}
              label="FSM Eligible"
              value={d.fsmEligibleCount}
              subtext="Feeds into Pupil Premium"
              color="#22c55e"
              alert={d.fsmEligibleCount > 0}
            />
            <StatCard
              icon={GraduationCap}
              label="UIFSM (KS1)"
              value={d.uifsmCount}
              subtext="Reception, Y1, Y2"
              color="#3b82f6"
            />
            <StatCard
              icon={ClipboardList}
              label="Ever 6 FSM"
              value={d.ever6FsmCount}
              subtext="PP eligibility window"
              color="#8b5cf6"
            />
            <StatCard
              icon={PoundSterling}
              label="Meal Price"
              value={`\u00A3${d.mealPrice.toFixed(2)}`}
              subtext="Per paid meal"
              color="#f59e0b"
            />
            <StatCard
              icon={UtensilsCrossed}
              label="Orders Today"
              value={d.dailyOrdersToday}
              subtext={`${new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
              color="#ef4444"
            />
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 2: Meal Type Breakdown by Year Group
           ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <button
          onClick={() => toggleSection("breakdown")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
              <BarChart3 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Meal Type Breakdown
              </h2>
              <p className="text-sm text-zinc-500">
                By year group with national benchmarks
              </p>
            </div>
          </div>
          {expandedSections.breakdown ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>

        {expandedSections.breakdown && (
          <div className="mt-5 space-y-5">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
              {MEAL_TYPES.map((mt) => (
                <div key={mt.value} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: mt.color }}
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {mt.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Stacked bars */}
            <div className="space-y-3">
              {d.byYearGroup.map((yg) => {
                const meals = yg.fsm + yg.uifsm + yg.paid;
                const isKS1 = ["R", "1", "2"].includes(yg.yearGroup);
                return (
                  <div key={yg.yearGroup} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 w-16">
                        {yg.yearGroup === "R" ? "Rec" : `Year ${yg.yearGroup}`}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>
                          {meals}/{yg.total} meals ({yg.uptakePct}%)
                        </span>
                        {isKS1 && (
                          <span className="text-blue-500 font-medium">
                            UIFSM
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex h-6 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {yg.fsm > 0 && (
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(yg.fsm / yg.total) * 100}%`,
                            backgroundColor: "#22c55e",
                          }}
                          title={`FSM: ${yg.fsm}`}
                        />
                      )}
                      {yg.uifsm > 0 && (
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(yg.uifsm / yg.total) * 100}%`,
                            backgroundColor: "#3b82f6",
                          }}
                          title={`UIFSM: ${yg.uifsm}`}
                        />
                      )}
                      {yg.paid > 0 && (
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(yg.paid / yg.total) * 100}%`,
                            backgroundColor: "#f59e0b",
                          }}
                          title={`Paid: ${yg.paid}`}
                        />
                      )}
                      {yg.packedLunch > 0 && (
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(yg.packedLunch / yg.total) * 100}%`,
                            backgroundColor: "#8b5cf6",
                          }}
                          title={`Packed Lunch: ${yg.packedLunch}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* National Benchmark Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  KS1 Uptake (Rec-Y2)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar
                      value={d.nationalBenchmarks.schoolKs1UptakePct}
                      max={100}
                      color="#3b82f6"
                      label="Your School"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1">
                    <ProgressBar
                      value={d.nationalBenchmarks.ks1UptakePct}
                      max={100}
                      color="#94a3b8"
                      label="National Avg"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  KS2 Uptake (Y3-Y6)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar
                      value={d.nationalBenchmarks.schoolKs2UptakePct}
                      max={100}
                      color="#f59e0b"
                      label="Your School"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1">
                    <ProgressBar
                      value={d.nationalBenchmarks.ks2UptakePct}
                      max={100}
                      color="#94a3b8"
                      label="National Avg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 3: FSM Register
           ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <button
          onClick={() => toggleSection("register")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
              <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                FSM & Meal Register
              </h2>
              <p className="text-sm text-zinc-500">{regTotal} registrations</p>
            </div>
          </div>
          {expandedSections.register ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>

        {expandedSections.register && (
          <div className="mt-5 space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by name, year group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <select
                value={yearGroupFilter}
                onChange={(e) => {
                  setYearGroupFilter(e.target.value);
                  setRegPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              >
                <option value="">All Years</option>
                {YEAR_GROUPS.map((yg) => (
                  <option key={yg} value={yg}>
                    {yg === "R" ? "Reception" : `Year ${yg}`}
                  </option>
                ))}
              </select>
              <select
                value={mealTypeFilter}
                onChange={(e) => {
                  setMealTypeFilter(e.target.value);
                  setRegPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              >
                <option value="">All Meal Types</option>
                {MEAL_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>
                    {mt.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={fsmFilter}
                  onChange={(e) => {
                    setFsmFilter(e.target.checked);
                    setRegPage(1);
                  }}
                  className="rounded border-zinc-300"
                />
                FSM Only
              </label>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Pupil
              </button>
              <button
                disabled
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm transition opacity-50 cursor-not-allowed"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Bulk Import (Coming Soon)
              </button>
            </div>

            {/* Add Registration Form */}
            {showAddForm && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    Add Pupil Registration
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Pupil ID / Pseudonym
                    </label>
                    <input
                      type="text"
                      value={newReg.pupil_name_pseudonymised}
                      onChange={(e) =>
                        setNewReg((p) => ({
                          ...p,
                          pupil_name_pseudonymised: e.target.value,
                        }))
                      }
                      placeholder="e.g. Pupil_A_Y3"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Year Group
                    </label>
                    <select
                      value={newReg.year_group}
                      onChange={(e) =>
                        setNewReg((p) => ({
                          ...p,
                          year_group: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    >
                      {YEAR_GROUPS.map((yg) => (
                        <option key={yg} value={yg}>
                          {yg === "R" ? "Reception" : `Year ${yg}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={newReg.meal_type}
                      onChange={(e) =>
                        setNewReg((p) => ({
                          ...p,
                          meal_type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    >
                      {MEAL_TYPES.map((mt) => (
                        <option key={mt.value} value={mt.value}>
                          {mt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Dietary Requirement
                    </label>
                    <select
                      value={newReg.dietary_requirement}
                      onChange={(e) =>
                        setNewReg((p) => ({
                          ...p,
                          dietary_requirement: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    >
                      {DIETARY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={newReg.fsm_eligible}
                        onChange={(e) =>
                          setNewReg((p) => ({
                            ...p,
                            fsm_eligible: e.target.checked,
                          }))
                        }
                        className="rounded border-zinc-300"
                      />
                      FSM Eligible
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={newReg.ever_6_fsm}
                        onChange={(e) =>
                          setNewReg((p) => ({
                            ...p,
                            ever_6_fsm: e.target.checked,
                          }))
                        }
                        className="rounded border-zinc-300"
                      />
                      Ever 6 FSM
                    </label>
                  </div>
                </div>
                {/* Allergies */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Allergies (14 Major Allergens)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGY_OPTIONS.map((allergy) => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          newReg.allergies.includes(allergy)
                            ? "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRegistration}
                    disabled={!newReg.pupil_name_pseudonymised}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-50 transition"
                  >
                    Save Registration
                  </button>
                </div>
              </div>
            )}

            {/* Registration Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Pupil ID
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Year
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Meal Type
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-zinc-500">
                      FSM
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-zinc-500">
                      Ever 6
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Dietary
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Allergies
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {regLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-zinc-400"
                      >
                        Loading registrations...
                      </td>
                    </tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-zinc-400"
                      >
                        No registrations found
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => {
                      const mealInfo = MEAL_TYPES.find(
                        (m) => m.value === reg.meal_type,
                      );
                      return (
                        <tr
                          key={reg.id}
                          className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                        >
                          <td className="py-2.5 px-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                            {reg.pupil_name_pseudonymised}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                              {reg.year_group === "R"
                                ? "Rec"
                                : `Y${reg.year_group}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{
                                backgroundColor: mealInfo?.color || "#6b7280",
                              }}
                            >
                              {mealInfo?.label || reg.meal_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {reg.fsm_eligible ? (
                              <span className="text-green-600 font-bold">
                                Yes
                              </span>
                            ) : (
                              <span className="text-zinc-300">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {reg.ever_6_fsm ? (
                              <span className="text-purple-600 font-bold">
                                Yes
                              </span>
                            ) : (
                              <span className="text-zinc-300">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-zinc-600 dark:text-zinc-400">
                            {reg.dietary_requirement !== "Standard" ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                                {reg.dietary_requirement}
                              </span>
                            ) : (
                              "Standard"
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {reg.allergies && reg.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {reg.allergies.map((a) => (
                                  <span
                                    key={a}
                                    className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-300 text-xs">
                                None
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalRegPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-zinc-500">
                  Showing {(regPage - 1) * regPageSize + 1}-
                  {Math.min(regPage * regPageSize, regTotal)} of {regTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRegPage((p) => Math.max(1, p - 1))}
                    disabled={regPage === 1}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Page {regPage} of {totalRegPages}
                  </span>
                  <button
                    onClick={() =>
                      setRegPage((p) => Math.min(totalRegPages, p + 1))
                    }
                    disabled={regPage === totalRegPages}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 4: Daily Orders
           ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <button
          onClick={() => toggleSection("orders")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
              <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Daily Orders & Waste Tracking
              </h2>
              <p className="text-sm text-zinc-500">
                Order counts, trends & waste reduction
              </p>
            </div>
          </div>
          {expandedSections.orders ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>

        {expandedSections.orders && (
          <div className="mt-5 space-y-5">
            {/* Date picker + Record button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  const form: Record<
                    string,
                    { ordered: number; served: number; wasteKg: number }
                  > = {};
                  YEAR_GROUPS.forEach((yg) => {
                    form[yg] = { ordered: 0, served: 0, wasteKg: 0 };
                  });
                  setDailyOrderForm(form);
                  setShowOrderForm(!showOrderForm);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
              >
                <Plus className="h-4 w-4" />
                Record Daily Count
              </button>
            </div>

            {/* Daily Order Entry Form */}
            {showOrderForm && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4">
                <h3 className="font-medium text-zinc-900 dark:text-white mb-3">
                  Daily Count for{" "}
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    "en-GB",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sky-200 dark:border-sky-700">
                        <th className="text-left py-2 px-3 font-medium text-zinc-600">
                          Year Group
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-zinc-600">
                          Meals Ordered
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-zinc-600">
                          Meals Served
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-zinc-600">
                          Waste (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {YEAR_GROUPS.map((yg) => (
                        <tr
                          key={yg}
                          className="border-b border-sky-100 dark:border-sky-800"
                        >
                          <td className="py-2 px-3 font-medium">
                            {yg === "R" ? "Reception" : `Year ${yg}`}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              value={dailyOrderForm[yg]?.ordered || 0}
                              onChange={(e) =>
                                setDailyOrderForm((prev) => ({
                                  ...prev,
                                  [yg]: {
                                    ...prev[yg],
                                    ordered: parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-20 mx-auto block text-center px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              value={dailyOrderForm[yg]?.served || 0}
                              onChange={(e) =>
                                setDailyOrderForm((prev) => ({
                                  ...prev,
                                  [yg]: {
                                    ...prev[yg],
                                    served: parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-20 mx-auto block text-center px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              value={dailyOrderForm[yg]?.wasteKg || 0}
                              onChange={(e) =>
                                setDailyOrderForm((prev) => ({
                                  ...prev,
                                  [yg]: {
                                    ...prev[yg],
                                    wasteKg: parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-20 mx-auto block text-center px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDailyOrders}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
                  >
                    Save Daily Count
                  </button>
                </div>
              </div>
            )}

            {/* Weekly Trend Chart (CSS bars) */}
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                2-Week Trend: Meals Ordered vs Served
              </h3>
              {d.dailyTrends.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-end gap-1 h-40">
                    {d.dailyTrends.map((day, i) => {
                      const maxOrdered = Math.max(
                        ...d.dailyTrends.map((t) => t.ordered),
                      );
                      const orderedH =
                        maxOrdered > 0 ? (day.ordered / maxOrdered) * 100 : 0;
                      const servedH =
                        maxOrdered > 0 ? (day.served / maxOrdered) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex items-end gap-0.5 group relative"
                        >
                          <div
                            className="flex-1 rounded-t transition-all duration-300 bg-sky-400"
                            style={{ height: `${orderedH}%` }}
                            title={`Ordered: ${day.ordered}`}
                          />
                          <div
                            className="flex-1 rounded-t transition-all duration-300 bg-emerald-400"
                            style={{ height: `${servedH}%` }}
                            title={`Served: ${day.served}`}
                          />
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                            {new Date(
                              day.date + "T12:00:00",
                            ).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                            <br />
                            Ordered: {day.ordered} | Served: {day.served}
                            <br />
                            Waste: {day.wasteKg}kg
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Date labels */}
                  <div className="flex gap-1">
                    {d.dailyTrends.map((day, i) => (
                      <div
                        key={i}
                        className="flex-1 text-center text-[10px] text-zinc-400 truncate"
                      >
                        {new Date(day.date + "T12:00:00").toLocaleDateString(
                          "en-GB",
                          { weekday: "narrow", day: "numeric" },
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-sky-400" />
                      <span className="text-zinc-500">Ordered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                      <span className="text-zinc-500">Served</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-8">
                  No daily order data available. Record daily counts to see
                  trends.
                </p>
              )}
            </div>

            {/* Waste Summary */}
            {d.dailyTrends.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Avg Daily Waste
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {(
                      d.dailyTrends.reduce((s, t) => s + t.wasteKg, 0) /
                      d.dailyTrends.length
                    ).toFixed(1)}
                    kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Avg Meals Wasted
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {Math.round(
                      d.dailyTrends.reduce(
                        (s, t) => s + (t.ordered - t.served),
                        0,
                      ) / d.dailyTrends.length,
                    )}{" "}
                    meals/day
                  </p>
                  <p className="text-xs text-zinc-400">
                    {(
                      (d.dailyTrends.reduce(
                        (s, t) => s + (t.ordered - t.served),
                        0,
                      ) /
                        d.dailyTrends.reduce((s, t) => s + t.ordered, 0)) *
                      100
                    ).toFixed(1)}
                    % waste rate
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    2-Week Waste Total
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {d.dailyTrends
                      .reduce((s, t) => s + t.wasteKg, 0)
                      .toFixed(1)}
                    kg
                  </p>
                  <p className="text-xs text-zinc-400">
                    ~{"\u00A3"}
                    {(
                      d.dailyTrends.reduce(
                        (s, t) => s + (t.ordered - t.served),
                        0,
                      ) * d.mealPrice
                    ).toFixed(2)}{" "}
                    cost
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 5: Dietary Requirements & Allergies
           ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <button
          onClick={() => toggleSection("dietary")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
              <Wheat className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Dietary Requirements & Allergies
              </h2>
              <p className="text-sm text-zinc-500">
                Allergy alerts and kitchen communication
              </p>
            </div>
          </div>
          {expandedSections.dietary ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>

        {expandedSections.dietary && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dietary Requirements */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Dietary Requirements Summary
                </h3>
                <div className="space-y-2">
                  {d.dietarySummary.map((item) => (
                    <ProgressBar
                      key={item.requirement}
                      value={item.count}
                      max={d.totalPupils}
                      color={
                        item.requirement === "Standard"
                          ? "#94a3b8"
                          : item.requirement === "Vegetarian"
                            ? "#22c55e"
                            : item.requirement === "Vegan"
                              ? "#16a34a"
                              : item.requirement === "Halal"
                                ? "#8b5cf6"
                                : "#f59e0b"
                      }
                      label={item.requirement}
                    />
                  ))}
                </div>
              </div>

              {/* Allergy Alerts */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  Allergy Alerts
                </h3>
                {d.allergySummary.length > 0 ? (
                  <div className="space-y-2">
                    {d.allergySummary.map((item) => (
                      <div
                        key={item.allergy}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-400">
                            {item.allergy}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {item.count} pupil{item.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-zinc-400 mt-2">
                      Total pupils with recorded allergies:{" "}
                      {d.allergySummary.reduce((s, a) => s + a.count, 0)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 text-center py-4">
                    No allergies recorded
                  </p>
                )}
              </div>
            </div>

            {/* Kitchen Communication Sheet */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Kitchen Communication Sheet
                </h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition"
                >
                  <Printer className="h-3 w-3" />
                  Print
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {d.dietarySummary
                  .filter((d) => d.requirement !== "Standard")
                  .map((item) => (
                    <div
                      key={item.requirement}
                      className="p-2 rounded bg-white dark:bg-zinc-800 border border-amber-100 dark:border-amber-900/30"
                    >
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {item.requirement}
                      </p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {item.count}
                      </p>
                    </div>
                  ))}
                {d.allergySummary.map((item) => (
                  <div
                    key={item.allergy}
                    className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30"
                  >
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {item.allergy} Allergy
                    </p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      {item.count}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Generated {new Date().toLocaleDateString("en-GB")} - Always
                check individual pupil records before serving
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           SECTION 6: Financial Summary
           ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <button
          onClick={() => toggleSection("financial")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
              <PoundSterling className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Financial Summary
              </h2>
              <p className="text-sm text-zinc-500">
                Income, funding & cost analysis
              </p>
            </div>
          </div>
          {expandedSections.financial ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>

        {expandedSections.financial && (
          <div className="mt-5 space-y-5">
            {/* Daily Income Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">
                  FSM Funding (Daily)
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {"\u00A3"}
                  {d.financials.fsmFundingDaily.toFixed(2)}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {d.fsmEligibleCount} pupils x {"\u00A3"}2.53/meal
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                  UIFSM Funding (Daily)
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {"\u00A3"}
                  {d.financials.uifsmFundingDaily.toFixed(2)}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {d.uifsmCount} pupils x {"\u00A3"}2.53/meal
                </p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">
                  Paid Meal Income (Daily)
                </p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {"\u00A3"}
                  {d.financials.paidIncomeDaily.toFixed(2)}
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  {d.paidMealsCount} pupils x {"\u00A3"}
                  {d.mealPrice.toFixed(2)}/meal
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-3 font-medium text-zinc-500">
                      Period
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-zinc-500">
                      FSM Funding
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-zinc-500">
                      UIFSM Funding
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-zinc-500">
                      Paid Income
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-zinc-700 dark:text-zinc-300 font-bold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 px-3 font-medium">Daily</td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {d.financials.fsmFundingDaily.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {d.financials.uifsmFundingDaily.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {d.financials.paidIncomeDaily.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {"\u00A3"}
                      {d.financials.totalDailyIncome.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 px-3 font-medium">Weekly (5 days)</td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.fsmFundingDaily * 5).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.uifsmFundingDaily * 5).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.paidIncomeDaily * 5).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {"\u00A3"}
                      {(d.financials.totalDailyIncome * 5).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 px-3 font-medium">
                      Termly (~65 days)
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.fsmFundingDaily * 65).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.uifsmFundingDaily * 65).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {"\u00A3"}
                      {(d.financials.paidIncomeDaily * 65).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {"\u00A3"}
                      {d.financials.estimatedTermIncome.toLocaleString("en-GB")}
                    </td>
                  </tr>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <td className="py-2.5 px-3 font-bold">
                      Annual (~190 days)
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {"\u00A3"}
                      {(d.financials.fsmFundingDaily * 190).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {"\u00A3"}
                      {(d.financials.uifsmFundingDaily * 190).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {"\u00A3"}
                      {(d.financials.paidIncomeDaily * 190).toLocaleString(
                        "en-GB",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-lg">
                      {"\u00A3"}
                      {d.financials.estimatedAnnualIncome.toLocaleString(
                        "en-GB",
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CFR Code Reference */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                CFR Code Reference
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-white dark:bg-zinc-800">
                  <span className="text-zinc-500">I08 - Catering Income</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {"\u00A3"}
                    {d.financials.estimatedAnnualIncome.toLocaleString(
                      "en-GB",
                    )}{" "}
                    est.
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-zinc-800">
                  <span className="text-zinc-500">
                    E25 - Catering Expenditure
                  </span>
                  <span className="font-medium text-zinc-400">
                    Not yet tracked
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-zinc-800">
                  <span className="text-zinc-500">
                    I03 - Government Grants (FSM/UIFSM)
                  </span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {"\u00A3"}
                    {(
                      (d.financials.fsmFundingDaily +
                        d.financials.uifsmFundingDaily) *
                      190
                    ).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    est.
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-zinc-800">
                  <span className="text-zinc-500">
                    Pupil Premium (via Ever 6 FSM)
                  </span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {d.ever6FsmCount} eligible x {"\u00A3"}1,455 = {"\u00A3"}
                    {(d.ever6FsmCount * 1455).toLocaleString("en-GB")}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-3">
                Pupil Premium rates 2025-26: Primary {"\u00A3"}1,455 per
                eligible pupil. FSM/UIFSM funding rate: {"\u00A3"}2.53 per meal.
              </p>
            </div>

            {/* Pupil Premium Callout */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Pupil Premium Link
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Your school has{" "}
                    <strong>{d.ever6FsmCount} Ever 6 FSM</strong> pupils
                    eligible for Pupil Premium funding. This represents{" "}
                    <strong>
                      {"\u00A3"}
                      {(d.ever6FsmCount * 1455).toLocaleString("en-GB")}
                    </strong>{" "}
                    in annual PP funding. Accurate FSM tracking directly impacts
                    your PP allocation - ensure all eligible families are
                    registered.
                  </p>
                  <p className="text-xs text-purple-500 mt-2">
                    Tip: Families receiving Universal Credit with net income
                    below {"\u00A3"}7,400 are eligible for FSM. Run an FSM
                    eligibility awareness campaign termly to maximise
                    registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="text-xs text-zinc-400 text-center py-4">
        School Meals & FSM Tracking | Data updated{" "}
        {new Date().toLocaleString("en-GB")} | FSM funding rates as of 2025-26
        academic year
      </div>
    </div>
  );
}
