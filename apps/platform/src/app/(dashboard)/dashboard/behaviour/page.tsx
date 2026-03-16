"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Scale,
  Users,
  Clock,
  MapPin,
  CalendarDays,
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  Shield,
  UserX,
  Ban,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Gavel,
  Star,
  Award,
  RefreshCw,
  Eye,
  Phone,
  BookOpen,
  Megaphone,
  Flame,
  Target,
  Hash,
  ArrowRight,
  Info,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface Incident {
  id: string;
  pupil_name: string;
  pupil_id?: string;
  year_group?: number;
  type: "positive" | "negative";
  category: string;
  description?: string;
  location?: string;
  lesson_period?: string;
  consequence?: string;
  reported_by?: string;
  parent_notified?: boolean;
  notes?: string;
  created_at: string;
}

interface Exclusion {
  id: string;
  incident_id?: string;
  pupil_name: string;
  year_group?: number;
  exclusion_type: string;
  reason: string;
  start_date: string;
  end_date?: string;
  days: number;
  is_sen: boolean;
  is_fsm: boolean;
  is_lac: boolean;
  ethnicity?: string;
  governor_informed: boolean;
  governor_review_date?: string;
  reintegration_meeting?: string;
  reintegration_completed: boolean;
  parent_notified: boolean;
  la_notified: boolean;
  alternative_provision?: string;
  notes?: string;
  cumulative_days_this_year: number;
  status: string;
  created_at: string;
}

interface DashboardStats {
  today: { total: number; positive: number; negative: number; ratio: number };
  this_week: {
    total: number;
    positive: number;
    negative: number;
    ratio: number;
  };
  this_term: {
    total: number;
    positive: number;
    negative: number;
    ratio: number;
  };
  detentions_scheduled: number;
  active_exclusions: number;
  slt_referrals_today: number;
  category_breakdown: {
    positive: { category: string; count: number }[];
    negative: { category: string; count: number }[];
  };
  by_time_of_day: { period: string; positive: number; negative: number }[];
  by_location: { location: string; count: number }[];
  exclusion_summary: {
    fixed_term_this_term: number;
    permanent_this_term: number;
    lunchtime_this_term: number;
    managed_moves: number;
    total_days_lost: number;
    pupils_excluded: number;
  };
  repeat_offenders: {
    pupil_name: string;
    year_group: number;
    incident_count: number;
    last_incident: string;
    categories: string[];
  }[];
  demo: boolean;
}

interface PatternData {
  by_day_of_week: { day: string; positive: number; negative: number }[];
  by_lesson_period: { period: string; positive: number; negative: number }[];
  by_staff: { staff: string; positive: number; negative: number }[];
  hotspot_locations: {
    location: string;
    incidents: number;
    severity_avg: number;
  }[];
  by_year_group?: { year_group: number; positive: number; negative: number }[];
  demo: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────

const NEGATIVE_CATEGORIES = [
  { value: "disruption", label: "Disruption" },
  { value: "defiance", label: "Defiance" },
  { value: "verbal_abuse", label: "Verbal Abuse" },
  { value: "physical_aggression", label: "Physical Aggression" },
  { value: "bullying", label: "Bullying" },
  { value: "cyberbullying", label: "Cyberbullying" },
  { value: "racist", label: "Racist Incident" },
  { value: "homophobic", label: "Homophobic Incident" },
  { value: "sexual", label: "Sexual Harassment" },
  { value: "substance", label: "Substance Misuse" },
  { value: "theft", label: "Theft" },
  { value: "damage", label: "Damage to Property" },
  { value: "truancy", label: "Truancy" },
  { value: "uniform", label: "Uniform Violation" },
  { value: "mobile_phone", label: "Mobile Phone" },
  { value: "other_negative", label: "Other" },
];

const POSITIVE_CATEGORIES = [
  { value: "achievement", label: "Achievement" },
  { value: "effort", label: "Effort" },
  { value: "kindness", label: "Kindness" },
  { value: "leadership", label: "Leadership" },
  { value: "improvement", label: "Improvement" },
  { value: "community", label: "Community" },
  { value: "homework", label: "Homework" },
  { value: "attendance", label: "Attendance" },
  { value: "other_positive", label: "Other" },
];

const NEGATIVE_CONSEQUENCES = [
  { value: "verbal_warning", label: "Verbal Warning" },
  { value: "written_warning", label: "Written Warning" },
  { value: "loss_of_privilege", label: "Loss of Privilege" },
  { value: "detention_break", label: "Detention (Break)" },
  { value: "detention_lunch", label: "Detention (Lunch)" },
  { value: "detention_after_school", label: "Detention (After School)" },
  { value: "community_service", label: "Community Service" },
  { value: "internal_exclusion", label: "Internal Exclusion" },
  { value: "fixed_term_exclusion", label: "Fixed-Term Exclusion" },
  { value: "permanent_exclusion", label: "Permanent Exclusion" },
  { value: "managed_move", label: "Managed Move" },
  { value: "alternative_provision", label: "Alternative Provision" },
  { value: "restorative_justice", label: "Restorative Justice" },
  { value: "parent_contact", label: "Parent Contact" },
];

const POSITIVE_CONSEQUENCES = [
  { value: "reward_points", label: "Reward Points" },
  { value: "certificate", label: "Certificate" },
  { value: "prize", label: "Prize" },
  { value: "house_points", label: "House Points" },
];

const LOCATIONS = [
  "Classroom 1A",
  "Classroom 1B",
  "Classroom 2A",
  "Classroom 2B",
  "Playground",
  "Dining Hall",
  "Corridor - Main",
  "Corridor - Science",
  "Sports Hall",
  "Science Lab",
  "Library",
  "Reception Area",
  "ICT Suite",
  "Art Room",
  "Music Room",
  "Drama Studio",
  "Toilets",
  "Car Park",
  "School Gates",
  "Other",
];

const LESSON_PERIODS = [
  "Registration",
  "Period 1",
  "Period 2",
  "Break",
  "Period 3",
  "Lunch",
  "Period 4",
  "Period 5",
  "After School",
];

// ─── Utility Functions ──────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatConsequence(cons: string): string {
  return cons.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function BehaviourPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || "";

  // Data fetching with SWR
  const swrOpts = { revalidateOnFocus: false };
  const {
    data: statsData,
    error: statsError,
    mutate: mutateStats,
  } = useSWR<DashboardStats>(
    orgId ? "/api/behaviour/dashboard" : null,
    fetcher,
    swrOpts,
  );
  const {
    data: incidentsData,
    error: incidentsError,
    mutate: mutateIncidents,
  } = useSWR(
    orgId ? "/api/behaviour/incidents?pageSize=100" : null,
    fetcher,
    swrOpts,
  );
  const {
    data: exclusionsData,
    error: exclusionsError,
    mutate: mutateExclusions,
  } = useSWR(orgId ? `/api/behaviour/exclusions?organizationId=${orgId}` : null, fetcher, swrOpts);
  const {
    data: patternsData,
    error: patternsError,
    mutate: mutatePatterns,
  } = useSWR<PatternData>(
    orgId ? "/api/behaviour/patterns" : null,
    fetcher,
    swrOpts,
  );

  const stats = statsData ?? null;
  const incidents: Incident[] = incidentsData?.incidents || [];
  const exclusions: Exclusion[] = exclusionsData?.exclusions || [];
  const patterns = patternsData ?? null;
  const isDemo = statsData?.demo ?? true;
  const loading = !statsData && !statsError;
  const fetchError =
    statsError || incidentsError || exclusionsError || patternsError
      ? "Failed to load behaviour data. Please try again."
      : "";

  const fetchData = useCallback(() => {
    mutateStats();
    mutateIncidents();
    mutateExclusions();
    mutatePatterns();
  }, [mutateStats, mutateIncidents, mutateExclusions, mutatePatterns]);

  // UI state
  const [activeSection, setActiveSection] = useState<string>("summary");
  const [feedFilter, setFeedFilter] = useState<
    "all" | "positive" | "negative" | "exclusions"
  >("all");
  const [showLogForm, setShowLogForm] = useState(false);
  const [expandedExclusion, setExpandedExclusion] = useState<string | null>(
    null,
  );
  const [patternView, setPatternView] = useState<
    "day" | "period" | "staff" | "location" | "year"
  >("day");

  // Form state
  const [formType, setFormType] = useState<"positive" | "negative">("positive");
  const [formPupil, setFormPupil] = useState("");
  const [formYearGroup, setFormYearGroup] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formConsequence, setFormConsequence] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── Form Submit ──────────────────────────────────────────────

  const handleSubmitIncident = async () => {
    if (!formPupil || !formCategory) return;
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/behaviour/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pupil_name: formPupil,
          year_group: formYearGroup ? parseInt(formYearGroup) : null,
          type: formType,
          category: formCategory,
          description: formDescription,
          location: formLocation,
          lesson_period: formPeriod,
          consequence: formConsequence,
        }),
      });
      if (res.ok) {
        setFormSuccess(true);
        setFormError("");
        setFormPupil("");
        setFormYearGroup("");
        setFormCategory("");
        setFormDescription("");
        setFormLocation("");
        setFormPeriod("");
        setFormConsequence("");
        setTimeout(() => setFormSuccess(false), 3000);
        fetchData();
      } else {
        setFormError("Failed to log incident. Please try again.");
      }
    } catch {
      setFormError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Filtered Incidents ──────────────────────────────────────

  const filteredIncidents = useMemo(() => {
    if (feedFilter === "all") return incidents;
    if (feedFilter === "positive")
      return incidents.filter((i) => i.type === "positive");
    if (feedFilter === "negative")
      return incidents.filter((i) => i.type === "negative");
    return [];
  }, [incidents, feedFilter]);

  const todayIncidents = useMemo(
    () => incidents.filter((i) => isToday(i.created_at)),
    [incidents],
  );

  // ─── Severity color for negative categories ──────────────────

  function getSeverityColor(category: string): string {
    const severe = [
      "physical_aggression",
      "sexual",
      "substance",
      "racist",
      "homophobic",
    ];
    const moderate = [
      "verbal_abuse",
      "bullying",
      "cyberbullying",
      "theft",
      "damage",
    ];
    if (severe.includes(category)) return "bg-red-700 text-white";
    if (moderate.includes(category)) return "bg-red-500 text-white";
    return "bg-red-400 text-white";
  }

  function getCategoryIcon(category: string): React.ReactNode {
    switch (category) {
      case "achievement":
        return <Award className="h-4 w-4" />;
      case "effort":
        return <TrendingUp className="h-4 w-4" />;
      case "kindness":
        return <ThumbsUp className="h-4 w-4" />;
      case "leadership":
        return <Star className="h-4 w-4" />;
      case "disruption":
        return <Megaphone className="h-4 w-4" />;
      case "defiance":
        return <Ban className="h-4 w-4" />;
      case "bullying":
        return <UserX className="h-4 w-4" />;
      case "physical_aggression":
        return <Flame className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  }

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl"
              />
            ))}
          </div>
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Behaviour & Sanctions
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Incident logging, consequence tracking & exclusion management
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Log Incident
          </button>
        </div>
      </div>

      {/* ─── Demo Banner ──────────────────────────────────────────── */}
      {isDemo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Demo Mode</span> — Showing sample
            data. Log a real incident to start tracking behaviour for your
            school.
          </p>
        </div>
      )}

      {/* ─── Error Banner ──────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{fetchError}</p>
          <button
            onClick={() => {
              fetchData();
            }}
            className="ml-auto text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: Today's Summary Cards                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Incidents Today */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Today
              </span>
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.today.total}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ThumbsUp className="h-3 w-3" />
                {stats.today.positive}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span className="flex items-center gap-1 text-xs text-red-500">
                <ThumbsDown className="h-3 w-3" />
                {stats.today.negative}
              </span>
            </div>
          </div>

          {/* Positive:Negative Ratio */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ratio +/-
              </span>
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.today.ratio.toFixed(1)}:1
            </div>
            <div className="mt-2">
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                {stats.today.total > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{
                      width: `${(stats.today.positive / stats.today.total) * 100}%`,
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {stats.today.total > 0
                  ? `${Math.round((stats.today.positive / stats.today.total) * 100)}% positive`
                  : "No incidents today"}
              </p>
            </div>
          </div>

          {/* Detentions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Detentions
              </span>
              <Clock className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {stats.detentions_scheduled}
            </div>
            <p className="text-xs text-zinc-400 mt-2">Scheduled today</p>
          </div>

          {/* Active Exclusions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Exclusions
              </span>
              <Ban className="h-4 w-4 text-zinc-400" />
            </div>
            <div
              className={`text-3xl font-bold ${stats.active_exclusions > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}
            >
              {stats.active_exclusions}
            </div>
            <p className="text-xs text-zinc-400 mt-2">Currently active</p>
          </div>

          {/* SLT Referrals */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                SLT Referrals
              </span>
              <AlertTriangle className="h-4 w-4 text-zinc-400" />
            </div>
            <div
              className={`text-3xl font-bold ${stats.slt_referrals_today > 0 ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-zinc-100"}`}
            >
              {stats.slt_referrals_today}
            </div>
            <p className="text-xs text-zinc-400 mt-2">Today</p>
          </div>
        </div>
      )}

      {/* Weekly stats bar */}
      {stats && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">
                This Week:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {stats.this_week.total} incidents
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ({stats.this_week.positive} positive)
              </span>
              <span className="text-red-500">
                ({stats.this_week.negative} negative)
              </span>
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">
                This Term:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {stats.this_term.total}
              </span>
              <span className="text-zinc-400">
                ({stats.this_term.ratio.toFixed(1)}:1 ratio)
              </span>
            </div>
            {stats.exclusion_summary && (
              <>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Exclusion days this term:
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {stats.exclusion_summary.total_days_lost}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: Log Incident Form                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showLogForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Log New Incident
            </h2>
            <button
              onClick={() => setShowLogForm(false)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {formSuccess && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Incident logged successfully!
            </div>
          )}

          {formError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="h-4 w-4" />
              {formError}
            </div>
          )}

          {/* Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormType("positive");
                  setFormCategory("");
                  setFormConsequence("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  formType === "positive"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-emerald-300"
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
                Positive
              </button>
              <button
                onClick={() => {
                  setFormType("negative");
                  setFormCategory("");
                  setFormConsequence("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  formType === "negative"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-red-300"
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
                Negative
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pupil Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Pupil Name *
              </label>
              <input
                type="text"
                value={formPupil}
                onChange={(e) => setFormPupil(e.target.value)}
                placeholder="e.g. Oliver Thompson"
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Year Group */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Year Group
              </label>
              <select
                value={formYearGroup}
                onChange={(e) => setFormYearGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select...</option>
                {["N", "R", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(
                  (y) => (
                    <option key={y} value={y}>
                      {y === "N"
                        ? "Nursery"
                        : y === "R"
                          ? "Reception"
                          : `Year ${y}`}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select category...</option>
                {(formType === "positive"
                  ? POSITIVE_CATEGORIES
                  : NEGATIVE_CATEGORIES
                ).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Location
              </label>
              <select
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select location...</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson Period */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Lesson Period
              </label>
              <select
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select period...</option>
                {LESSON_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Consequence */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Consequence / Reward
              </label>
              <select
                value={formConsequence}
                onChange={(e) => setFormConsequence(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select...</option>
                {(formType === "positive"
                  ? POSITIVE_CONSEQUENCES
                  : NEGATIVE_CONSEQUENCES
                ).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmitIncident}
              disabled={!formPupil || !formCategory || formSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {formSubmitting ? "Saving..." : "Log Incident"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: Incident Feed                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Incident Feed
              <span className="text-sm font-normal text-zinc-400">
                ({filteredIncidents.length} incidents)
              </span>
            </h2>
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              {(["all", "positive", "negative", "exclusions"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFeedFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      feedFilter === f
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "positive"
                        ? "Positive"
                        : f === "negative"
                          ? "Negative"
                          : "Exclusions"}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {feedFilter === "exclusions" ? (
          /* Exclusions inline view */
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {exclusions.filter((e) => e.status === "active").length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <Ban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active exclusions</p>
              </div>
            ) : (
              exclusions
                .filter((e) => e.status === "active")
                .map((excl) => (
                  <div
                    key={excl.id}
                    className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          <Ban className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {excl.pupil_name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                              {excl.exclusion_type === "fixed_term"
                                ? "FTE"
                                : excl.exclusion_type === "permanent"
                                  ? "PEX"
                                  : excl.exclusion_type === "lunchtime"
                                    ? "Lunchtime"
                                    : excl.exclusion_type === "managed_move"
                                      ? "Managed Move"
                                      : "AP"}
                            </span>
                            {excl.year_group && (
                              <span className="text-xs text-zinc-400">
                                Y{excl.year_group}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {excl.reason}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {excl.start_date} to {excl.end_date || "ongoing"}
                            </span>
                            <span>
                              {excl.days} day{excl.days !== 1 ? "s" : ""}
                            </span>
                            <span>
                              Cumulative: {excl.cumulative_days_this_year} days
                            </span>
                            {excl.is_sen && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                SEN
                              </span>
                            )}
                            {excl.is_fsm && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                FSM
                              </span>
                            )}
                            {excl.is_lac && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                LAC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          /* Normal incident feed */
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No incidents to display</p>
              </div>
            ) : (
              filteredIncidents.slice(0, 50).map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Type indicator */}
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        incident.type === "positive"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {incident.type === "positive" ? (
                        <ThumbsUp className="h-4 w-4" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {incident.pupil_name}
                        </span>
                        {incident.year_group && (
                          <span className="text-xs text-zinc-400">
                            Y{incident.year_group}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            incident.type === "positive"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                              : getSeverityColor(incident.category)
                          }`}
                        >
                          {formatCategory(incident.category)}
                        </span>
                        {incident.consequence && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {formatConsequence(incident.consequence)}
                          </span>
                        )}
                      </div>
                      {incident.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                          {incident.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(incident.created_at)}
                        </span>
                        {incident.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {incident.location}
                          </span>
                        )}
                        {incident.lesson_period && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {incident.lesson_period}
                          </span>
                        )}
                        {incident.reported_by && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {incident.reported_by}
                          </span>
                        )}
                        {incident.parent_notified && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <Phone className="h-3 w-3" />
                            Parent notified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Pattern Analysis                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {patterns && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Pattern Analysis
              </h2>
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                {(
                  [
                    { key: "day", label: "By Day" },
                    { key: "period", label: "By Period" },
                    { key: "staff", label: "By Staff" },
                    { key: "location", label: "Hotspots" },
                    { key: "year", label: "By Year" },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setPatternView(v.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      patternView === v.key
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* By Day of Week */}
            {patternView === "day" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                  Incidents by Day of Week
                </h3>
                {patterns.by_day_of_week.map((d) => {
                  const total = d.positive + d.negative;
                  const maxTotal = Math.max(
                    ...patterns.by_day_of_week.map(
                      (x) => x.positive + x.negative,
                    ),
                  );
                  return (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24">
                        {d.day}
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        <div
                          className="h-7 rounded-l-md bg-emerald-400 dark:bg-emerald-600 transition-all flex items-center justify-end pr-1"
                          style={{ width: `${(d.positive / maxTotal) * 100}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">
                            {d.positive}
                          </span>
                        </div>
                        <div
                          className="h-7 rounded-r-md bg-red-400 dark:bg-red-600 transition-all flex items-center pl-1"
                          style={{ width: `${(d.negative / maxTotal) * 100}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">
                            {d.negative}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 w-10 text-right">
                        {total}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-400" /> Positive
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-400" /> Negative
                  </span>
                </div>
              </div>
            )}

            {/* By Lesson Period - Heatmap Grid */}
            {patternView === "period" && (
              <div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                  Incidents by Lesson Period (Heatmap)
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {patterns.by_lesson_period.map((p) => {
                    const total = p.positive + p.negative;
                    const maxNeg = Math.max(
                      ...patterns.by_lesson_period.map((x) => x.negative),
                    );
                    const intensity = maxNeg > 0 ? p.negative / maxNeg : 0;
                    return (
                      <div key={p.period} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-28 shrink-0">
                          {p.period}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-1">
                          <div
                            className="h-8 rounded-md flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{
                              backgroundColor: `rgba(16, 185, 129, ${0.3 + (p.positive / Math.max(...patterns.by_lesson_period.map((x) => x.positive))) * 0.7})`,
                            }}
                          >
                            {p.positive}
                          </div>
                          <div
                            className="h-8 rounded-md flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`,
                            }}
                          >
                            {p.negative}
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400 w-8 text-right">
                          {total}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
                  <span>Darker = higher count</span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500" /> Positive
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" /> Negative
                  </span>
                </div>
              </div>
            )}

            {/* By Staff */}
            {patternView === "staff" && (
              <div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                  Incidents by Staff Member
                </h3>
                <div className="space-y-3">
                  {patterns.by_staff
                    .sort(
                      (a, b) =>
                        b.positive + b.negative - (a.positive + a.negative),
                    )
                    .map((s) => {
                      const total = s.positive + s.negative;
                      const ratio =
                        s.negative > 0 ? s.positive / s.negative : s.positive;
                      return (
                        <div key={s.staff} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-36 shrink-0 truncate">
                            {s.staff}
                          </span>
                          <div className="flex-1 flex items-center gap-1">
                            <div
                              className="h-6 rounded-l-md bg-emerald-400 dark:bg-emerald-600 transition-all"
                              style={{
                                width: `${(s.positive / (s.positive + s.negative)) * 100}%`,
                              }}
                            />
                            <div
                              className="h-6 rounded-r-md bg-red-400 dark:bg-red-600 transition-all"
                              style={{
                                width: `${(s.negative / (s.positive + s.negative)) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <span className="text-xs text-zinc-500">
                              {total} total
                            </span>
                            <br />
                            <span
                              className={`text-xs font-medium ${ratio >= 3 ? "text-emerald-600" : ratio >= 2 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {ratio.toFixed(1)}:1
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Hotspot Locations */}
            {patternView === "location" && (
              <div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                  Top 5 Negative Incident Locations
                </h3>
                <div className="space-y-3">
                  {patterns.hotspot_locations.map((loc, idx) => {
                    const maxCount =
                      patterns.hotspot_locations[0]?.incidents || 1;
                    return (
                      <div
                        key={loc.location}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            idx === 0
                              ? "bg-red-600"
                              : idx === 1
                                ? "bg-red-500"
                                : idx === 2
                                  ? "bg-orange-500"
                                  : "bg-amber-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-36 shrink-0">
                          {loc.location}
                        </span>
                        <div className="flex-1">
                          <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden">
                            <div
                              className={`h-full rounded-md transition-all ${
                                idx === 0
                                  ? "bg-red-500"
                                  : idx === 1
                                    ? "bg-red-400"
                                    : idx === 2
                                      ? "bg-orange-400"
                                      : "bg-amber-400"
                              }`}
                              style={{
                                width: `${(loc.incidents / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-8 text-right">
                          {loc.incidents}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* By Year Group */}
            {patternView === "year" && patterns.by_year_group && (
              <div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                  Incidents by Year Group
                </h3>
                <div className="space-y-3">
                  {patterns.by_year_group.map((yg) => {
                    const total = yg.positive + yg.negative;
                    const maxTotal = Math.max(
                      ...patterns.by_year_group!.map(
                        (x) => x.positive + x.negative,
                      ),
                    );
                    return (
                      <div
                        key={yg.year_group}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-16">
                          Year {yg.year_group}
                        </span>
                        <div className="flex-1 flex items-center gap-1">
                          <div
                            className="h-7 rounded-l-md bg-emerald-400 dark:bg-emerald-600 transition-all flex items-center justify-end pr-1"
                            style={{
                              width: `${(yg.positive / maxTotal) * 100}%`,
                            }}
                          >
                            {yg.positive > 5 && (
                              <span className="text-[10px] text-white font-medium">
                                {yg.positive}
                              </span>
                            )}
                          </div>
                          <div
                            className="h-7 rounded-r-md bg-red-400 dark:bg-red-600 transition-all flex items-center pl-1"
                            style={{
                              width: `${(yg.negative / maxTotal) * 100}%`,
                            }}
                          >
                            {yg.negative > 3 && (
                              <span className="text-[10px] text-white font-medium">
                                {yg.negative}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400 w-10 text-right">
                          {total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {stats && stats.category_breakdown && (
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
                Category Breakdown (This Term)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Positive Categories */}
                <div>
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
                    Positive Categories
                  </h4>
                  <div className="space-y-2">
                    {stats.category_breakdown.positive.map((cat) => {
                      const maxCount =
                        stats.category_breakdown.positive[0]?.count || 1;
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 w-24 shrink-0">
                            {formatCategory(cat.category)}
                          </span>
                          <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 dark:bg-emerald-600 rounded transition-all"
                              style={{
                                width: `${(cat.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-500 w-8 text-right">
                            {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Negative Categories */}
                <div>
                  <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                    Negative Categories
                  </h4>
                  <div className="space-y-2">
                    {stats.category_breakdown.negative.map((cat) => {
                      const maxCount =
                        stats.category_breakdown.negative[0]?.count || 1;
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 w-24 shrink-0">
                            {formatCategory(cat.category)}
                          </span>
                          <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                            <div
                              className="h-full bg-red-400 dark:bg-red-600 rounded transition-all"
                              style={{
                                width: `${(cat.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-500 w-8 text-right">
                            {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Repeat Pupils */}
          {stats &&
            stats.repeat_offenders &&
            stats.repeat_offenders.length > 0 && (
              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Repeat Pupils (3+ incidents this term)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-zinc-400 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Pupil</th>
                        <th className="pb-3 pr-4">Year</th>
                        <th className="pb-3 pr-4">Incidents</th>
                        <th className="pb-3 pr-4">Categories</th>
                        <th className="pb-3">Last Incident</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stats.repeat_offenders.map((pupil) => (
                        <tr
                          key={pupil.pupil_name}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                            {pupil.pupil_name}
                          </td>
                          <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                            Y{pupil.year_group}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                pupil.incident_count >= 7
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : pupil.incident_count >= 5
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              <Hash className="h-3 w-3" />
                              {pupil.incident_count}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {pupil.categories.map((c) => (
                                <span
                                  key={c}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                >
                                  {formatCategory(c)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-zinc-500 text-xs">
                            {pupil.last_incident}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: Exclusions                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Gavel className="h-5 w-5 text-amber-500" />
            Exclusions & Managed Moves
          </h2>
        </div>

        {/* Exclusion Summary Stats */}
        {stats?.exclusion_summary && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.exclusion_summary.fixed_term_this_term}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Fixed-Term</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                {stats.exclusion_summary.permanent_this_term}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Permanent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.exclusion_summary.lunchtime_this_term}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Lunchtime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.exclusion_summary.managed_moves}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Managed Moves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.exclusion_summary.total_days_lost}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Days Lost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.exclusion_summary.pupils_excluded}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Pupils Excluded</div>
            </div>
          </div>
        )}

        {/* Exclusion Cards */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {exclusions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No exclusions recorded</p>
            </div>
          ) : (
            exclusions.map((excl) => (
              <div key={excl.id} className="p-5">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedExclusion(
                      expandedExclusion === excl.id ? null : excl.id,
                    )
                  }
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl ${
                        excl.status === "active"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {excl.exclusion_type === "managed_move" ? (
                        <ArrowRight className="h-5 w-5" />
                      ) : (
                        <Ban className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {excl.pupil_name}
                        </span>
                        {excl.year_group && (
                          <span className="text-sm text-zinc-400">
                            Year {excl.year_group}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            excl.exclusion_type === "permanent"
                              ? "bg-red-700 text-white"
                              : excl.exclusion_type === "fixed_term"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : excl.exclusion_type === "lunchtime"
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : excl.exclusion_type === "managed_move"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          }`}
                        >
                          {excl.exclusion_type === "fixed_term"
                            ? "Fixed-Term Exclusion"
                            : excl.exclusion_type === "permanent"
                              ? "Permanent Exclusion"
                              : excl.exclusion_type === "lunchtime"
                                ? "Lunchtime Exclusion"
                                : excl.exclusion_type === "managed_move"
                                  ? "Managed Move"
                                  : "Alternative Provision"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            excl.status === "active"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {excl.status === "active" ? "Active" : "Completed"}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {excl.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {excl.start_date}{" "}
                          {excl.end_date ? `to ${excl.end_date}` : "(ongoing)"}
                        </span>
                        {excl.days > 0 && (
                          <span>
                            {excl.days} day{excl.days !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="font-medium">
                          Cumulative: {excl.cumulative_days_this_year} days this
                          year
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-600 transition-colors p-1">
                    {expandedExclusion === excl.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Expanded Detail */}
                {expandedExclusion === excl.id && (
                  <div className="mt-4 ml-14 space-y-4">
                    {/* DfE Return Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`w-2 h-2 rounded-full ${excl.is_sen ? "bg-blue-500" : "bg-zinc-300"}`}
                        />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          SEN:
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {excl.is_sen ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`w-2 h-2 rounded-full ${excl.is_fsm ? "bg-purple-500" : "bg-zinc-300"}`}
                        />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          FSM:
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {excl.is_fsm ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`w-2 h-2 rounded-full ${excl.is_lac ? "bg-orange-500" : "bg-zinc-300"}`}
                        />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          LAC:
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {excl.is_lac ? "Yes" : "No"}
                        </span>
                      </div>
                      {excl.ethnicity && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Ethnicity:
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {excl.ethnicity}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Governance & Process Tracking */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                          Governance
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Governor Informed
                            </span>
                            {excl.governor_informed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Governor Review
                            </span>
                            <span className="text-zinc-900 dark:text-zinc-100 text-xs">
                              {excl.governor_review_date || "Not scheduled"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              LA Notified
                            </span>
                            {excl.la_notified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-zinc-300" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Parent Notified
                            </span>
                            {excl.parent_notified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                          Reintegration
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Meeting Date
                            </span>
                            <span className="text-zinc-900 dark:text-zinc-100 text-xs">
                              {excl.reintegration_meeting || "Not scheduled"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Completed
                            </span>
                            {excl.reintegration_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-zinc-300" />
                            )}
                          </div>
                          {excl.alternative_provision && (
                            <div>
                              <span className="text-zinc-600 dark:text-zinc-400">
                                Alternative Provision:
                              </span>
                              <p className="text-zinc-900 dark:text-zinc-100 mt-1">
                                {excl.alternative_provision}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {excl.notes && (
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                          Notes
                        </h4>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {excl.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Footer spacing ──────────────────────────────────────────── */}
      <div className="h-8" />
    </div>
  );
}
