"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  Shield,
  ShieldAlert,
  Flame,
  Lock,
  CloudRain,
  Bomb,
  AlertTriangle,
  Wind,
  Droplets,
  Bug,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Users,
  ChevronRight,
  ChevronDown,
  Plus,
  Printer,
  Timer,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  AlertOctagon,
  ClipboardList,
  MapPin,
  GitBranch,
  ListChecks,
  Eye,
  FileText,
  BarChart3,
  Activity,
  CircleDot,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface EmergencyPlan {
  id: string;
  plan_type: string;
  title: string;
  status: "active" | "draft" | "under_review";
  description: string;
  procedures: { step: number; action: string; responsible: string }[];
  assembly_points: {
    name: string;
    location: string;
    capacity: number;
    primary: boolean;
  }[];
  communication_tree: { role: string; notifies: string[] }[];
  post_incident_checklist: string[];
  key_contacts: {
    role: string;
    name: string;
    phone: string;
    email: string;
  }[];
  last_reviewed_at: string;
  next_review_due: string;
  review_frequency_months: number;
  created_at: string;
  updated_at: string;
}

interface DrillRecord {
  id: string;
  drill_type: string;
  drill_date: string;
  evacuation_time_seconds: number | null;
  all_accounted_for: boolean;
  total_persons: number | null;
  persons_accounted: number | null;
  issues_found: string[];
  notes: string;
  weather_conditions: string | null;
  time_of_day: string | null;
  announced: boolean;
  conducted_by: string;
  created_at: string;
}

interface DrillCompliance {
  type: string;
  label: string;
  requirement: string;
  frequency: string;
  requiredPerYear: number;
  completedCount: number;
  lastDrill: string | null;
  nextDue: string | null;
  compliant: boolean;
}

interface DashboardData {
  plans: {
    total: number;
    active: number;
    draft: number;
    under_review: number;
    overdue_reviews: number;
    by_type: {
      type: string;
      title: string;
      status: string;
      last_reviewed: string;
      next_review: string;
      overdue: boolean;
    }[];
  };
  drills: {
    total_this_year: number;
    fire_by_term: { term: string; count: number; compliant: boolean }[];
    compliance: DrillCompliance[];
    evacuation_times: {
      best_seconds: number | null;
      average_seconds: number | null;
      worst_seconds: number | null;
      target_seconds: number;
    };
    recent_issues: {
      drill_type: string;
      drill_date: string;
      issue: string;
    }[];
  };
  overall_status: "green" | "amber" | "red";
}

// ─── Constants ──────────────────────────────────────────────────────

const PLAN_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Flame; color: string; bgColor: string }
> = {
  fire_evacuation: {
    label: "Fire Evacuation",
    icon: Flame,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  lockdown: {
    label: "Lockdown",
    icon: Lock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  shelter_in_place: {
    label: "Shelter in Place",
    icon: CloudRain,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  bomb_threat: {
    label: "Bomb Threat",
    icon: Bomb,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  intruder: {
    label: "Intruder",
    icon: AlertTriangle,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  flood: {
    label: "Flood",
    icon: Droplets,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  gas_leak: {
    label: "Gas Leak",
    icon: Wind,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  pandemic: {
    label: "Pandemic",
    icon: Bug,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: "Active",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100" },
  under_review: {
    label: "Under Review",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
};

const EMERGENCY_CONTACTS = [
  {
    role: "Headteacher",
    name: "Mrs Helen Carter",
    phone: "07700 900100",
    email: "h.carter@school.edu",
    category: "school",
  },
  {
    role: "Designated Safeguarding Lead",
    name: "Mr David Brown",
    phone: "07700 900101",
    email: "d.brown@school.edu",
    category: "school",
  },
  {
    role: "First Aider (Lead)",
    name: "Mrs Jane Smith",
    phone: "07700 900102",
    email: "j.smith@school.edu",
    category: "school",
  },
  {
    role: "Fire Marshal",
    name: "Mr James Thompson",
    phone: "07700 900123",
    email: "j.thompson@school.edu",
    category: "school",
  },
  {
    role: "Site Manager",
    name: "Mr Keith Williams",
    phone: "07700 900104",
    email: "k.williams@school.edu",
    category: "school",
  },
  {
    role: "Chair of Governors",
    name: "Dr Patricia Green",
    phone: "07700 900105",
    email: "p.green@governors.school.edu",
    category: "governance",
  },
  {
    role: "LA Emergency Line",
    name: "Local Authority",
    phone: "0300 123 4567",
    email: "emergency@la.gov.uk",
    category: "external",
  },
  {
    role: "Police (Non-Emergency)",
    name: "Local Police",
    phone: "101",
    email: "",
    category: "emergency",
  },
  {
    role: "Fire Service (Non-Emergency)",
    name: "Fire and Rescue",
    phone: "0300 303 8123",
    email: "",
    category: "emergency",
  },
  {
    role: "Ambulance (Non-Emergency)",
    name: "NHS 111",
    phone: "111",
    email: "",
    category: "emergency",
  },
  {
    role: "Gas Emergency",
    name: "National Gas Emergency",
    phone: "0800 111 999",
    email: "",
    category: "utility",
  },
  {
    role: "Water Emergency",
    name: "Water Company",
    phone: "0800 783 4444",
    email: "",
    category: "utility",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Main Component ─────────────────────────────────────────────────

type ActiveSection = "overview" | "plans" | "drills" | "contacts" | "detail";

export default function EmergencyPlanningPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDrillForm, setShowDrillForm] = useState(false);
  const [drillFormData, setDrillFormData] = useState({
    drill_type: "fire_evacuation",
    drill_date: new Date().toISOString().split("T")[0],
    evacuation_time_seconds: "",
    all_accounted_for: true,
    total_persons: "",
    persons_accounted: "",
    issues_found: "",
    notes: "",
    weather_conditions: "dry",
    time_of_day: "morning",
    announced: false,
    conducted_by: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, drillsRes, dashRes] = await Promise.all([
        fetch("/api/emergency/plans").then((r) => r.json()),
        fetch("/api/emergency/drills").then((r) => r.json()),
        fetch("/api/emergency/dashboard").then((r) => r.json()),
      ]);

      if (plansRes.plans) {
        setPlans(plansRes.plans);
        setIsDemo(plansRes.isDemo ?? true);
      }
      if (drillsRes.drills) {
        setDrills(drillsRes.drills);
      }
      if (dashRes.plans) {
        setDashboard(dashRes);
      }
    } catch (err) {
      console.error("[Emergency] Failed to fetch data:", err);
      toast.error("Failed to load emergency planning data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Drill Form Submit ─────────────────────────────────────────

  const handleDrillSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        drill_type: drillFormData.drill_type,
        drill_date: drillFormData.drill_date,
        evacuation_time_seconds: drillFormData.evacuation_time_seconds
          ? parseInt(drillFormData.evacuation_time_seconds)
          : null,
        all_accounted_for: drillFormData.all_accounted_for,
        total_persons: drillFormData.total_persons
          ? parseInt(drillFormData.total_persons)
          : null,
        persons_accounted: drillFormData.persons_accounted
          ? parseInt(drillFormData.persons_accounted)
          : null,
        issues_found: drillFormData.issues_found
          ? drillFormData.issues_found.split("\n").filter(Boolean)
          : [],
        notes: drillFormData.notes,
        weather_conditions: drillFormData.weather_conditions,
        time_of_day: drillFormData.time_of_day,
        announced: drillFormData.announced,
        conducted_by: drillFormData.conducted_by,
      };

      const res = await fetch("/api/emergency/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowDrillForm(false);
        setDrillFormData({
          drill_type: "fire_evacuation",
          drill_date: new Date().toISOString().split("T")[0],
          evacuation_time_seconds: "",
          all_accounted_for: true,
          total_persons: "",
          persons_accounted: "",
          issues_found: "",
          notes: "",
          weather_conditions: "dry",
          time_of_day: "morning",
          announced: false,
          conducted_by: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error("[Emergency] Failed to submit drill:", err);
      toast.error("Failed to record drill");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Plan Detail ──────────────────────────────────────────

  const viewPlanDetail = (plan: EmergencyPlan) => {
    setSelectedPlan(plan);
    setActiveSection("detail");
  };

  // ─── Print Handler ─────────────────────────────────────────────

  const handlePrint = () => {
    window.print();
  };

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeSection === "detail" && (
            <button
              onClick={() => {
                setActiveSection("overview");
                setSelectedPlan(null);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#FF6B6B20" }}
          >
            <ShieldAlert className="w-5 h-5" style={{ color: "#FF6B6B" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === "detail" && selectedPlan
                ? selectedPlan.title
                : "Emergency Planning"}
            </h1>
            <p className="text-sm text-gray-500">
              {activeSection === "detail"
                ? "Plan procedures and key information"
                : "Lockdown, evacuation plans, drill logging and emergency contacts"}
            </p>
          </div>
        </div>
        {activeSection === "detail" && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print Plan
          </button>
        )}
      </div>

      {/* ─── Demo Banner ───────────────────────────────────────── */}
      {isDemo && activeSection !== "detail" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Demo Mode</p>
            <p className="text-xs text-amber-600">
              Showing sample emergency plans and drill records. Create your
              first plan to replace demo data with your school&apos;s real
              information.
            </p>
          </div>
        </div>
      )}

      {/* ─── Navigation Tabs ───────────────────────────────────── */}
      {activeSection !== "detail" && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(
            [
              {
                key: "overview",
                label: "Overview",
                icon: BarChart3,
              },
              { key: "plans", label: "Plans", icon: FileText },
              {
                key: "drills",
                label: "Drill Log",
                icon: ClipboardList,
              },
              {
                key: "contacts",
                label: "Emergency Contacts",
                icon: Phone,
              },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Overview Section ──────────────────────────────────── */}
      {activeSection === "overview" && (
        <OverviewSection
          dashboard={dashboard}
          plans={plans}
          drills={drills}
          onViewPlan={viewPlanDetail}
          onAddDrill={() => {
            setActiveSection("drills");
            setShowDrillForm(true);
          }}
        />
      )}

      {/* ─── Plans Section ─────────────────────────────────────── */}
      {activeSection === "plans" && (
        <PlansSection plans={plans} onViewPlan={viewPlanDetail} />
      )}

      {/* ─── Drills Section ────────────────────────────────────── */}
      {activeSection === "drills" && (
        <DrillsSection
          drills={drills}
          dashboard={dashboard}
          showForm={showDrillForm}
          onToggleForm={() => setShowDrillForm(!showDrillForm)}
          formData={drillFormData}
          onFormChange={setDrillFormData}
          onSubmit={handleDrillSubmit}
          submitting={submitting}
        />
      )}

      {/* ─── Contacts Section ──────────────────────────────────── */}
      {activeSection === "contacts" && <ContactsSection />}

      {/* ─── Plan Detail Section ───────────────────────────────── */}
      {activeSection === "detail" && selectedPlan && (
        <PlanDetailSection plan={selectedPlan} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ─── Overview Section ───────────────────────────────────────────────

function OverviewSection({
  dashboard,
  plans,
  drills,
  onViewPlan,
  onAddDrill,
}: {
  dashboard: DashboardData | null;
  plans: EmergencyPlan[];
  drills: DrillRecord[];
  onViewPlan: (plan: EmergencyPlan) => void;
  onAddDrill: () => void;
}) {
  const overallStatus = dashboard?.overall_status || "amber";
  const statusColors = {
    green: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      label: "Compliant",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      label: "Action Needed",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      label: "Non-Compliant",
    },
  };
  const sc = statusColors[overallStatus];

  const evacTimes = dashboard?.drills.evacuation_times;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Status */}
        <div className={`rounded-xl border-2 ${sc.border} ${sc.bg} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Overall Status
            </span>
            <Shield className={`w-5 h-5 ${sc.text}`} />
          </div>
          <p className={`text-2xl font-bold ${sc.text}`}>{sc.label}</p>
          <p className="text-xs text-gray-500 mt-1">
            {dashboard?.plans.active || 0} active plans,{" "}
            {dashboard?.drills.total_this_year || 0} drills this year
          </p>
        </div>

        {/* Plans */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Emergency Plans
            </span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboard?.plans.active || 0}
            <span className="text-sm font-normal text-gray-400 ml-1">
              / {dashboard?.plans.total || 0}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {dashboard?.plans.overdue_reviews || 0} overdue for review
          </p>
        </div>

        {/* Evacuation Time */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Best Evacuation
            </span>
            <Timer className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatTime(evacTimes?.best_seconds ?? null)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Target: {formatTime(evacTimes?.target_seconds ?? 180)} | Avg:{" "}
            {formatTime(evacTimes?.average_seconds ?? null)}
          </p>
        </div>

        {/* Drill Compliance */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Drill Compliance
            </span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-center gap-2">
            {dashboard?.drills.compliance.map((c) => (
              <div
                key={c.type}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  c.compliant
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {c.compliant ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {c.type === "fire_evacuation" ? "Fire" : "Lockdown"}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Fire: termly (statutory) | Lockdown: annual
          </p>
        </div>
      </div>

      {/* Fire Drill by Term */}
      {dashboard?.drills.fire_by_term && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Fire Drill Compliance by Term
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {dashboard.drills.fire_by_term.map((term) => (
              <div
                key={term.term}
                className={`rounded-lg p-4 border-2 ${
                  term.compliant
                    ? "border-emerald-200 bg-emerald-50"
                    : term.count === 0
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {term.term} Term
                  </span>
                  {term.compliant ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {term.count} drill{term.count !== 1 ? "s" : ""}
                </p>
                <p
                  className={`text-xs mt-1 ${term.compliant ? "text-emerald-600" : "text-red-600"}`}
                >
                  {term.compliant ? "Requirement met" : "Drill required"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Status Grid + Recent Drills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Plan Status
          </h3>
          <div className="space-y-3">
            {plans.map((plan) => {
              const config = PLAN_TYPE_CONFIG[plan.plan_type];
              const Icon = config?.icon || Shield;
              const overdue = isOverdue(plan.next_review_due);
              const days = daysUntil(plan.next_review_due);
              return (
                <button
                  key={plan.id}
                  onClick={() => onViewPlan(plan)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-100"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${config?.bgColor || "bg-gray-50"}`}
                  >
                    <Icon
                      className={`w-4 h-4 ${config?.color || "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {plan.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reviewed: {formatDate(plan.last_reviewed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Overdue
                      </span>
                    )}
                    {!overdue && days <= 30 && days > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {days}d
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[plan.status]?.bgColor || "bg-gray-100"} ${STATUS_CONFIG[plan.status]?.color || "text-gray-600"}`}
                    >
                      {STATUS_CONFIG[plan.status]?.label || plan.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Drills */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-500" />
              Recent Drills
            </h3>
            <button
              onClick={onAddDrill}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" />
              Log Drill
            </button>
          </div>
          <div className="space-y-3">
            {drills.slice(0, 5).map((drill) => {
              const config = PLAN_TYPE_CONFIG[drill.drill_type];
              const Icon = config?.icon || Shield;
              return (
                <div
                  key={drill.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${config?.bgColor || "bg-gray-50"}`}
                  >
                    <Icon
                      className={`w-4 h-4 ${config?.color || "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {config?.label || drill.drill_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(drill.drill_date)} | {drill.conducted_by}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {formatTime(drill.evacuation_time_seconds)}
                    </p>
                    <div className="flex items-center gap-1">
                      {drill.all_accounted_for ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${drill.all_accounted_for ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {drill.all_accounted_for
                          ? "All accounted"
                          : "Missing persons"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      {dashboard?.drills.recent_issues &&
        dashboard.drills.recent_issues.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Outstanding Issues from Drills
            </h3>
            <div className="space-y-2">
              {dashboard.drills.recent_issues.map((issue, idx) => {
                const config = PLAN_TYPE_CONFIG[issue.drill_type];
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900">{issue.issue}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {config?.label || issue.drill_type} drill -{" "}
                        {formatDate(issue.drill_date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}

// ─── Plans Section ──────────────────────────────────────────────────

function PlansSection({
  plans,
  onViewPlan,
}: {
  plans: EmergencyPlan[];
  onViewPlan: (plan: EmergencyPlan) => void;
}) {
  // All possible plan types
  const allTypes = Object.keys(PLAN_TYPE_CONFIG);
  const existingTypes = new Set(plans.map((p) => p.plan_type));
  const missingTypes = allTypes.filter((t) => !existingTypes.has(t));

  return (
    <div className="space-y-6">
      {/* Active Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const config = PLAN_TYPE_CONFIG[plan.plan_type];
          const Icon = config?.icon || Shield;
          const overdue = isOverdue(plan.next_review_due);
          const days = daysUntil(plan.next_review_due);

          return (
            <button
              key={plan.id}
              onClick={() => onViewPlan(plan)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-gray-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${config?.bgColor || "bg-gray-50"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${config?.color || "text-gray-500"}`}
                  />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[plan.status]?.bgColor || "bg-gray-100"} ${STATUS_CONFIG[plan.status]?.color || "text-gray-600"}`}
                >
                  {STATUS_CONFIG[plan.status]?.label || plan.status}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {plan.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                {plan.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Last Reviewed</span>
                  <span className="text-gray-600 font-medium">
                    {formatDate(plan.last_reviewed_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Next Review</span>
                  <span
                    className={`font-medium ${overdue ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-gray-600"}`}
                  >
                    {overdue ? "OVERDUE" : formatDate(plan.next_review_due)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Procedures</span>
                  <span className="text-gray-600 font-medium">
                    {plan.procedures?.length || 0} steps
                  </span>
                </div>
              </div>

              {overdue && (
                <div className="mt-3 flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                  <AlertOctagon className="w-3 h-3" />
                  Review overdue by {Math.abs(days)} days
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Missing Plans */}
      {missingTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            Plans Not Yet Created
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {missingTypes.map((type) => {
              const config = PLAN_TYPE_CONFIG[type];
              const Icon = config?.icon || Shield;
              return (
                <div
                  key={type}
                  className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 opacity-60"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${config?.bgColor || "bg-gray-100"}`}
                    >
                      <Icon
                        className={`w-5 h-5 ${config?.color || "text-gray-400"}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {config?.label || type}
                      </p>
                      <p className="text-xs text-gray-400">Not created</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-lg py-2 transition-colors opacity-50 cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                    Create Plan (Coming Soon)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drills Section ─────────────────────────────────────────────────

function DrillsSection({
  drills,
  dashboard,
  showForm,
  onToggleForm,
  formData,
  onFormChange,
  onSubmit,
  submitting,
}: {
  drills: DrillRecord[];
  dashboard: DashboardData | null;
  showForm: boolean;
  onToggleForm: () => void;
  formData: {
    drill_type: string;
    drill_date: string;
    evacuation_time_seconds: string;
    all_accounted_for: boolean;
    total_persons: string;
    persons_accounted: string;
    issues_found: string;
    notes: string;
    weather_conditions: string;
    time_of_day: string;
    announced: boolean;
    conducted_by: string;
  };
  onFormChange: (data: typeof formData) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  const evacTimes = dashboard?.drills.evacuation_times;

  return (
    <div className="space-y-6">
      {/* Compliance + Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compliance Cards */}
        {dashboard?.drills.compliance.map((c) => {
          const config = PLAN_TYPE_CONFIG[c.type];
          return (
            <div
              key={c.type}
              className={`rounded-xl border-2 p-4 ${
                c.compliant
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  {c.label}
                </span>
                {c.compliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">{c.requirement}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {c.completedCount} / {c.requiredPerYear} required
                </span>
                <span
                  className={`font-medium ${c.compliant ? "text-emerald-700" : "text-red-700"}`}
                >
                  {c.compliant ? "Compliant" : "Action Required"}
                </span>
              </div>
              {c.lastDrill && (
                <p className="text-xs text-gray-400 mt-1">
                  Last: {formatDate(c.lastDrill)}
                </p>
              )}
              {c.nextDue && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {c.nextDue}
                </p>
              )}
            </div>
          );
        })}

        {/* Evacuation Time Stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            Evacuation Times
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">Best</span>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-600">
                {formatTime(evacTimes?.best_seconds ?? null)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Average</span>
              </div>
              <span className="text-sm font-mono font-bold text-blue-600">
                {formatTime(evacTimes?.average_seconds ?? null)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">Slowest</span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-600">
                {formatTime(evacTimes?.worst_seconds ?? null)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Target</span>
              <span className="text-sm font-mono text-gray-500">
                {formatTime(evacTimes?.target_seconds ?? 180)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Drill Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Drill History</h3>
        <button
          onClick={onToggleForm}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showForm
              ? "bg-gray-200 text-gray-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {showForm ? (
            <>
              <XCircle className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Log New Drill
            </>
          )}
        </button>
      </div>

      {/* Drill Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Log Emergency Drill
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Drill Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Drill Type *
              </label>
              <select
                value={formData.drill_type}
                onChange={(e) =>
                  onFormChange({ ...formData, drill_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PLAN_TYPE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.drill_date}
                onChange={(e) =>
                  onFormChange({ ...formData, drill_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Evacuation Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Evacuation Time (seconds)
              </label>
              <input
                type="number"
                placeholder="e.g. 195"
                value={formData.evacuation_time_seconds}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    evacuation_time_seconds: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Total Persons */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Total Persons on Site
              </label>
              <input
                type="number"
                placeholder="e.g. 290"
                value={formData.total_persons}
                onChange={(e) =>
                  onFormChange({ ...formData, total_persons: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Persons Accounted */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Persons Accounted For
              </label>
              <input
                type="number"
                placeholder="e.g. 290"
                value={formData.persons_accounted}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    persons_accounted: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Conducted By */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Conducted By
              </label>
              <input
                type="text"
                placeholder="e.g. Mrs Carter"
                value={formData.conducted_by}
                onChange={(e) =>
                  onFormChange({ ...formData, conducted_by: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Weather */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Weather Conditions
              </label>
              <select
                value={formData.weather_conditions}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    weather_conditions: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dry">Dry</option>
                <option value="wet">Wet / Rain</option>
                <option value="cold">Cold</option>
                <option value="hot">Hot</option>
                <option value="snow">Snow / Ice</option>
                <option value="windy">Windy</option>
              </select>
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Time of Day
              </label>
              <select
                value={formData.time_of_day}
                onChange={(e) =>
                  onFormChange({ ...formData, time_of_day: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="morning">Morning (before break)</option>
                <option value="break">Break / Lunch</option>
                <option value="afternoon">Afternoon</option>
                <option value="after_school">After School</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.all_accounted_for}
                  onChange={(e) =>
                    onFormChange({
                      ...formData,
                      all_accounted_for: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  All persons accounted for
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.announced}
                  onChange={(e) =>
                    onFormChange({ ...formData, announced: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Pre-announced drill
                </span>
              </label>
            </div>
          </div>

          {/* Issues + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Issues Found (one per line)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Year 5 exit door was stiff"
                value={formData.issues_found}
                onChange={(e) =>
                  onFormChange({ ...formData, issues_found: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional observations..."
                value={formData.notes}
                onChange={(e) =>
                  onFormChange({ ...formData, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : "Save Drill Record"}
            </button>
          </div>
        </div>
      )}

      {/* Drill History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Type
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Date
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Time
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Accounted
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Issues
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                Conducted By
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {drills.map((drill) => {
              const config = PLAN_TYPE_CONFIG[drill.drill_type];
              const Icon = config?.icon || Shield;
              const expanded = expandedDrill === drill.id;
              return (
                <>
                  <tr
                    key={drill.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedDrill(expanded ? null : drill.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${config?.color || "text-gray-500"}`}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {config?.label || drill.drill_type}
                        </span>
                        {!drill.announced && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Unannounced
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(drill.drill_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-mono font-medium ${
                          drill.evacuation_time_seconds &&
                          drill.evacuation_time_seconds <= 180
                            ? "text-emerald-600"
                            : drill.evacuation_time_seconds &&
                                drill.evacuation_time_seconds <= 240
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {formatTime(drill.evacuation_time_seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {drill.all_accounted_for ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {drill.total_persons
                            ? `${drill.persons_accounted}/${drill.total_persons}`
                            : "Yes"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          {drill.total_persons
                            ? `${drill.persons_accounted}/${drill.total_persons}`
                            : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {drill.issues_found && drill.issues_found.length > 0 ? (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {drill.issues_found.length} issue
                          {drill.issues_found.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {drill.conducted_by}
                    </td>
                    <td className="px-4 py-3">
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  {expanded && (
                    <tr key={`${drill.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Notes
                            </h4>
                            <p className="text-sm text-gray-700">
                              {drill.notes || "No notes recorded"}
                            </p>
                          </div>
                          {drill.issues_found &&
                            drill.issues_found.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  Issues Found
                                </h4>
                                <ul className="space-y-1">
                                  {drill.issues_found.map(
                                    (issue: string, idx: number) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2 text-sm text-amber-700"
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        {issue}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          <div className="flex gap-6">
                            {drill.weather_conditions && (
                              <div>
                                <span className="text-xs text-gray-400 block">
                                  Weather
                                </span>
                                <span className="text-sm text-gray-700 capitalize">
                                  {drill.weather_conditions}
                                </span>
                              </div>
                            )}
                            {drill.time_of_day && (
                              <div>
                                <span className="text-xs text-gray-400 block">
                                  Time
                                </span>
                                <span className="text-sm text-gray-700 capitalize">
                                  {drill.time_of_day.replace("_", " ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Contacts Section ───────────────────────────────────────────────

function ContactsSection() {
  const categories = [
    {
      key: "school",
      label: "School Leadership",
      color: "blue",
    },
    {
      key: "governance",
      label: "Governance",
      color: "purple",
    },
    {
      key: "emergency",
      label: "Emergency Services",
      color: "red",
    },
    {
      key: "external",
      label: "Local Authority",
      color: "green",
    },
    {
      key: "utility",
      label: "Utilities",
      color: "amber",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string }> =
    {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-500",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: "text-purple-500",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "text-red-500",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-500",
      },
      amber: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "text-amber-500",
      },
    };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Emergency: Always dial 999 first
          </p>
          <p className="text-xs text-blue-600">
            For fire, police, or ambulance emergencies, call 999 immediately.
            The contacts below are for follow-up and non-emergency coordination.
          </p>
        </div>
      </div>

      {categories.map((cat) => {
        const contacts = EMERGENCY_CONTACTS.filter(
          (c) => c.category === cat.key,
        );
        if (contacts.length === 0) return null;
        const colors = colorMap[cat.color];
        return (
          <div key={cat.key}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {cat.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <div
                  key={contact.role}
                  className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {contact.role}
                      </p>
                      <p className="text-xs text-gray-600">{contact.name}</p>
                    </div>
                    <Users className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors truncate"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        {contact.email}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Plan Detail Section ────────────────────────────────────────────

function PlanDetailSection({ plan }: { plan: EmergencyPlan }) {
  const config = PLAN_TYPE_CONFIG[plan.plan_type];
  const Icon = config?.icon || Shield;
  const overdue = isOverdue(plan.next_review_due);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Plan Meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${config?.bgColor || "bg-gray-50"}`}
          >
            <Icon className={`w-6 h-6 ${config?.color || "text-gray-500"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[plan.status]?.bgColor || "bg-gray-100"} ${STATUS_CONFIG[plan.status]?.color || "text-gray-600"}`}
              >
                {STATUS_CONFIG[plan.status]?.label || plan.status}
              </span>
              {overdue && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Review Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400 block">Last Reviewed</span>
            <span className="text-sm font-medium text-gray-700">
              {formatDate(plan.last_reviewed_at)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Next Review</span>
            <span
              className={`text-sm font-medium ${overdue ? "text-red-600" : "text-gray-700"}`}
            >
              {formatDate(plan.next_review_due)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">
              Review Frequency
            </span>
            <span className="text-sm font-medium text-gray-700">
              Every {plan.review_frequency_months} months
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Last Updated</span>
            <span className="text-sm font-medium text-gray-700">
              {formatDate(plan.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Procedures */}
      {plan.procedures && plan.procedures.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-500 print:hidden" />
            Step-by-Step Procedures
          </h3>
          <div className="space-y-3">
            {plan.procedures.map((step) => (
              <div
                key={step.step}
                className="flex gap-4 p-3 rounded-lg border border-gray-100 print:border-none print:p-1"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">
                    {step.step}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{step.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Responsible: {step.responsible}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assembly Points */}
      {plan.assembly_points && plan.assembly_points.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500 print:hidden" />
            Assembly Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.assembly_points.map((point, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-4 border-2 ${
                  point.primary
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {point.name}
                  </span>
                  {point.primary && (
                    <span className="text-[10px] font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full uppercase">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{point.location}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Capacity: {point.capacity} persons
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication Tree */}
      {plan.communication_tree && plan.communication_tree.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-500 print:hidden" />
            Communication Tree
          </h3>
          <div className="space-y-4">
            {plan.communication_tree.map((node, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-36 flex-shrink-0">
                  <div className="bg-purple-100 text-purple-800 rounded-lg px-3 py-2 text-sm font-medium text-center">
                    {node.role}
                  </div>
                </div>
                <div className="flex items-center pt-2 text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {node.notifies.map((target, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post-Incident Checklist */}
      {plan.post_incident_checklist &&
        plan.post_incident_checklist.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500 print:hidden" />
              Post-Incident Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plan.post_incident_checklist.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

      {/* Plan-Specific Key Contacts */}
      {plan.key_contacts && plan.key_contacts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-none print:p-0">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-500 print:hidden" />
            Key Contacts for This Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.key_contacts.map((contact, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {contact.role}
                  </p>
                  <p className="text-xs text-gray-500">{contact.name}</p>
                </div>
                <div className="flex gap-2">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title={contact.phone}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title={contact.email}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
