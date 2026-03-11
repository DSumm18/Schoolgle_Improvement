"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  Target,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Users,
  ClipboardCheck,
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  PoundSterling,
  Eye,
  Edit3,
  BookOpen,
  UserCheck,
  ArrowUpRight,
  Shield,
  CircleDot,
  BarChart3,
  FileText,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface SmartCriteria {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  time_bound: boolean;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  sdp_link: string;
  smart_criteria: SmartCriteria;
  mid_year_progress: string | null;
  end_year_outcome: string | null;
  rating: string | null;
}

interface MidYearReview {
  date: string;
  overall_progress: string;
  evidence_notes: string;
  reviewer_comments: string;
  completed: boolean;
}

interface EndYearReview {
  date: string;
  overall_rating: string;
  evidence_summary: string;
  reviewer_comments: string;
  areas_for_development: string;
  completed: boolean;
}

interface CpdEntry {
  title: string;
  date: string;
  provider: string;
}

interface Observation {
  date: string;
  focus: string;
  judgement: string;
  feedback: string;
}

interface PayRecommendation {
  type: string;
  current_scale: string;
  recommended_scale: string;
  justification: string;
  status: string;
  submitted_date: string;
}

interface EctAssessment {
  term: number;
  date: string;
  outcome: string;
  assessor: string;
}

interface Appraisal {
  id: string;
  cycle_id: string;
  organization_id: string;
  staff_name: string;
  staff_email: string;
  role: string;
  role_type: string;
  pay_scale: string;
  appraiser_name: string;
  status: string;
  objectives: Objective[];
  mid_year_review: MidYearReview | null;
  end_year_review: EndYearReview | null;
  cpd_completed: CpdEntry[];
  cpd_planned: CpdEntry[];
  observations: Observation[];
  pay_recommendation: PayRecommendation | null;
  is_ect: boolean;
  ect_term: number | null;
  ect_mentor: string | null;
  ect_assessments?: EctAssessment[];
  ect_teachers_standards?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface Cycle {
  id: string;
  name: string;
  academic_year: string;
  status: string;
  objectives_due: string;
  mid_year_due: string;
  end_year_due: string;
  pay_review_due: string;
}

interface DashboardStats {
  cycle: Cycle;
  total_staff: number;
  stages: Record<string, number>;
  percentages: {
    objectives_set: number;
    mid_year_complete: number;
    end_year_complete: number;
    pay_recommendations_submitted: number;
  };
  by_role_type: Record<
    string,
    {
      total: number;
      objectives_set: number;
      mid_year_complete: number;
      end_year_complete: number;
    }
  >;
  ect_count: number;
  pending_pay_decisions: {
    progression: number;
    ups_threshold: number;
    increment: number;
    total: number;
    pending_headteacher: number;
    pending_governors: number;
  };
  observations_this_cycle: number;
  cpd_hours_logged: number;
  demo: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  not_started: {
    label: "Not Started",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: CircleDot,
  },
  objectives_set: {
    label: "Objectives Set",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: Target,
  },
  mid_year_review: {
    label: "Mid-Year Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Clock,
  },
  end_year_review: {
    label: "End-Year Review",
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: ClipboardCheck,
  },
  pay_recommendation: {
    label: "Pay Review",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: PoundSterling,
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: CheckCircle2,
  },
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  teacher: "Teaching Staff",
  leader: "Leadership",
  support: "Support Staff",
};

const JUDGEMENT_COLORS: Record<string, string> = {
  outstanding: "text-emerald-700 bg-emerald-50 border-emerald-200",
  exceptional: "text-emerald-700 bg-emerald-50 border-emerald-200",
  good: "text-blue-700 bg-blue-50 border-blue-200",
  satisfactory: "text-amber-700 bg-amber-50 border-amber-200",
  requires_improvement: "text-orange-700 bg-orange-50 border-orange-200",
  inadequate: "text-red-700 bg-red-50 border-red-200",
};

const PIPELINE_STAGES = [
  "objectives_set",
  "mid_year_review",
  "end_year_review",
  "pay_recommendation",
  "completed",
];

const TEACHERS_STANDARDS_LABELS: Record<string, string> = {
  ts1_expectations: "TS1: Set high expectations",
  ts2_progress: "TS2: Promote good progress",
  ts3_subject: "TS3: Subject knowledge",
  ts4_planning: "TS4: Plan & teach well-structured lessons",
  ts5_adapt: "TS5: Adapt teaching",
  ts6_assessment: "TS6: Make accurate use of assessment",
  ts7_behaviour: "TS7: Manage behaviour effectively",
  ts8_professional: "TS8: Professional responsibilities",
};

// ─── Helper Functions ────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not set";
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

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStageIndex(status: string): number {
  return PIPELINE_STAGES.indexOf(status);
}

// ─── Sub-Components ──────────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
        <Lightbulb className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">Demo Mode</p>
        <p className="text-xs text-amber-700">
          Showing sample data. Create an appraisal cycle and add staff
          appraisals to see your real data here.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function ProgressPipeline({ stats }: { stats: DashboardStats }) {
  const stages = [
    {
      key: "objectives_set",
      label: "Objectives",
      date: stats.cycle.objectives_due,
      pct: stats.percentages.objectives_set,
    },
    {
      key: "mid_year_review",
      label: "Mid-Year",
      date: stats.cycle.mid_year_due,
      pct: stats.percentages.mid_year_complete,
    },
    {
      key: "end_year_review",
      label: "End-Year",
      date: stats.cycle.end_year_due,
      pct: stats.percentages.end_year_complete,
    },
    {
      key: "pay_recommendation",
      label: "Pay Review",
      date: stats.cycle.pay_review_due,
      pct: stats.percentages.pay_recommendations_submitted,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Cycle Progress: {stats.cycle.name}
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {stats.total_staff} staff members in this cycle
      </p>

      <div className="flex items-start gap-2">
        {stages.map((stage, i) => {
          const overdue = isOverdue(stage.date);
          const days = daysUntil(stage.date);
          const upcoming = days > 0 && days <= 14;

          return (
            <div key={stage.key} className="flex-1 relative">
              {/* Progress bar */}
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stage.pct === 100
                      ? "bg-emerald-500"
                      : overdue
                        ? "bg-red-400"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${stage.pct}%` }}
                />
              </div>

              <p className="text-xs font-medium text-gray-700">{stage.label}</p>
              <p className="text-lg font-bold text-gray-900">{stage.pct}%</p>
              <p
                className={`text-xs mt-1 ${overdue ? "text-red-600 font-medium" : upcoming ? "text-amber-600" : "text-gray-400"}`}
              >
                {overdue
                  ? `Overdue (${formatDate(stage.date)})`
                  : `Due ${formatDate(stage.date)}`}
              </p>

              {/* Connector line */}
              {i < stages.length - 1 && (
                <div className="absolute top-1.5 right-0 w-2 h-0.5 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage counts */}
      <div className="mt-6 grid grid-cols-6 gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = stats.stages[key] || 0;
          const StatusIcon = cfg.icon;
          return (
            <div key={key} className={`rounded-lg p-3 text-center ${cfg.bg}`}>
              <StatusIcon className={`w-4 h-4 mx-auto mb-1 ${cfg.color}`} />
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600">{cfg.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleBreakdown({ stats }: { stats: DashboardStats }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Progress by Role Type
      </h3>
      <div className="space-y-4">
        {Object.entries(stats.by_role_type).map(([role, data]) => (
          <div key={role} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {ROLE_TYPE_LABELS[role] || role} ({data.total})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-blue-700">
                  {data.objectives_set}/{data.total}
                </p>
                <p className="text-xs text-blue-600">Objectives</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-amber-700">
                  {data.mid_year_complete}/{data.total}
                </p>
                <p className="text-xs text-amber-600">Mid-Year</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-purple-700">
                  {data.end_year_complete}/{data.total}
                </p>
                <p className="text-xs text-purple-600">End-Year</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Staff Appraisals Table ──────────────────────────────────────────

function StaffAppraisalsTable({
  appraisals,
  onSelect,
  selectedId,
  filterStatus,
  setFilterStatus,
  filterRole,
  setFilterRole,
}: {
  appraisals: Appraisal[];
  onSelect: (a: Appraisal) => void;
  selectedId: string | null;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterRole: string;
  setFilterRole: (s: string) => void;
}) {
  const filtered = useMemo(() => {
    let result = [...appraisals];
    if (filterStatus) result = result.filter((a) => a.status === filterStatus);
    if (filterRole) result = result.filter((a) => a.role_type === filterRole);
    return result;
  }, [appraisals, filterStatus, filterRole]);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Staff Appraisals ({filtered.length})
          </h3>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Stages</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="teacher">Teachers</option>
            <option value="leader">Leaders</option>
            <option value="support">Support Staff</option>
          </select>

          {(filterStatus || filterRole) && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterRole("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {filtered.map((appraisal) => {
          const cfg =
            STATUS_CONFIG[appraisal.status] || STATUS_CONFIG.not_started;
          const StatusIcon = cfg.icon;
          const isSelected = selectedId === appraisal.id;

          return (
            <button
              key={appraisal.id}
              onClick={() => onSelect(appraisal)}
              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 ${
                isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              {/* Avatar / ECT badge */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  {appraisal.staff_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                {appraisal.is_ect && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <GraduationCap className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {appraisal.staff_name}
                  </p>
                  {appraisal.is_ect && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                      ECT Term {appraisal.ect_term}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {appraisal.role} &middot; {appraisal.pay_scale}
                </p>
              </div>

              {/* Objectives count */}
              <div className="text-center flex-shrink-0">
                <p className="text-sm font-bold text-gray-700">
                  {appraisal.objectives.length}
                </p>
                <p className="text-xs text-gray-400">Obj.</p>
              </div>

              {/* Appraiser */}
              <div className="hidden md:block flex-shrink-0 max-w-[120px]">
                <p className="text-xs text-gray-400">Appraiser</p>
                <p className="text-xs text-gray-600 truncate">
                  {appraisal.appraiser_name}
                </p>
              </div>

              {/* Status badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No appraisals match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Appraisal Detail Panel ──────────────────────────────────────────

function AppraisalDetailPanel({
  appraisal,
  onClose,
}: {
  appraisal: Appraisal;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    | "objectives"
    | "mid_year"
    | "end_year"
    | "cpd"
    | "observations"
    | "pay"
    | "ect"
  >("objectives");

  const cfg = STATUS_CONFIG[appraisal.status] || STATUS_CONFIG.not_started;
  const StatusIcon = cfg.icon;

  const tabs = [
    {
      key: "objectives" as const,
      label: "Objectives",
      icon: Target,
      count: appraisal.objectives.length,
    },
    { key: "mid_year" as const, label: "Mid-Year", icon: Clock, show: true },
    {
      key: "end_year" as const,
      label: "End-Year",
      icon: ClipboardCheck,
      show: true,
    },
    {
      key: "cpd" as const,
      label: "CPD",
      icon: BookOpen,
      count: appraisal.cpd_completed.length + appraisal.cpd_planned.length,
    },
    {
      key: "observations" as const,
      label: "Observations",
      icon: Eye,
      count: appraisal.observations.length,
    },
    { key: "pay" as const, label: "Pay", icon: PoundSterling, show: true },
    ...(appraisal.is_ect
      ? [{ key: "ect" as const, label: "ECT", icon: GraduationCap, show: true }]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
              {appraisal.staff_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {appraisal.staff_name}
                {appraisal.is_ect && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                    ECT - Term {appraisal.ect_term}/6
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {appraisal.role} &middot; {appraisal.pay_scale} &middot;
                Appraiser: {appraisal.appraiser_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
                {"count" in tab && typeof tab.count === "number" && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "objectives" && (
          <ObjectivesTab objectives={appraisal.objectives} />
        )}
        {activeTab === "mid_year" && (
          <MidYearTab review={appraisal.mid_year_review} />
        )}
        {activeTab === "end_year" && (
          <EndYearTab review={appraisal.end_year_review} />
        )}
        {activeTab === "cpd" && (
          <CpdTab
            completed={appraisal.cpd_completed}
            planned={appraisal.cpd_planned}
          />
        )}
        {activeTab === "observations" && (
          <ObservationsTab observations={appraisal.observations} />
        )}
        {activeTab === "pay" && (
          <PayTab recommendation={appraisal.pay_recommendation} />
        )}
        {activeTab === "ect" && appraisal.is_ect && (
          <EctTab appraisal={appraisal} />
        )}
      </div>
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────

function ObjectivesTab({ objectives }: { objectives: Objective[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">
          Objectives ({objectives.length})
        </h4>
        <button
          disabled
          title="Coming Soon"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-50 cursor-not-allowed"
        >
          <Plus className="w-3 h-3" /> Add Objective (Coming Soon)
        </button>
      </div>

      {objectives.map((obj, idx) => {
        const expanded = expandedId === obj.id;
        const smartCount = Object.values(obj.smart_criteria).filter(
          Boolean,
        ).length;

        return (
          <div
            key={obj.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(expanded ? null : obj.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {obj.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {obj.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {obj.sdp_link && (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        SDP: {obj.sdp_link}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        smartCount === 5
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      SMART: {smartCount}/5
                    </span>
                    {obj.rating && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${JUDGEMENT_COLORS[obj.rating] || "bg-gray-50 text-gray-700"}`}
                      >
                        {obj.rating}
                      </span>
                    )}
                  </div>
                </div>
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                )}
              </div>
            </button>

            {expanded && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* SMART Criteria */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      SMART Criteria
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          "specific",
                          "measurable",
                          "achievable",
                          "relevant",
                          "time_bound",
                        ] as const
                      ).map((key) => (
                        <span
                          key={key}
                          className={`text-xs px-2 py-1 rounded-full ${
                            obj.smart_criteria[key]
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {obj.smart_criteria[key] ? "✓" : "✗"}{" "}
                          {key.replace("_", "-").charAt(0).toUpperCase() +
                            key.replace("_", "-").slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SDP Link */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      SDP Priority Link
                    </p>
                    <p className="text-sm text-gray-700">
                      {obj.sdp_link || "Not linked to SDP"}
                    </p>
                  </div>
                </div>

                {/* Progress sections */}
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Mid-Year Progress
                    </p>
                    <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
                      {obj.mid_year_progress || (
                        <span className="text-gray-400 italic">
                          Not yet completed
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      End-Year Outcome
                    </p>
                    <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
                      {obj.end_year_outcome || (
                        <span className="text-gray-400 italic">
                          Not yet completed
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {objectives.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-500">
          <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No objectives set yet.
        </div>
      )}
    </div>
  );
}

function MidYearTab({ review }: { review: MidYearReview | null }) {
  if (!review) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">
          Mid-year review not yet completed
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This will be available during the mid-year review window.
        </p>
        <button
          disabled
          title="Coming Soon"
          className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto opacity-50 cursor-not-allowed"
        >
          <Edit3 className="w-3 h-3" /> Start Mid-Year Review (Coming Soon)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900">
            Completed: {formatDate(review.date)}
          </span>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border font-medium ${JUDGEMENT_COLORS[review.overall_progress] || "bg-gray-50 text-gray-700"}`}
        >
          {review.overall_progress.charAt(0).toUpperCase() +
            review.overall_progress.slice(1)}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Evidence Notes
          </p>
          <p className="text-sm text-gray-700">{review.evidence_notes}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Reviewer Comments
          </p>
          <p className="text-sm text-gray-700">{review.reviewer_comments}</p>
        </div>
      </div>
    </div>
  );
}

function EndYearTab({ review }: { review: EndYearReview | null }) {
  if (!review) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">
          End-year review not yet completed
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This will be available during the end-year review window.
        </p>
        <button
          disabled
          title="Coming Soon"
          className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto opacity-50 cursor-not-allowed"
        >
          <Edit3 className="w-3 h-3" /> Start End-Year Review (Coming Soon)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900">
            Completed: {formatDate(review.date)}
          </span>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border font-medium ${JUDGEMENT_COLORS[review.overall_rating] || "bg-gray-50 text-gray-700"}`}
        >
          {review.overall_rating.charAt(0).toUpperCase() +
            review.overall_rating.slice(1)}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Evidence Summary
          </p>
          <p className="text-sm text-gray-700">{review.evidence_summary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Reviewer Comments
          </p>
          <p className="text-sm text-gray-700">{review.reviewer_comments}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Areas for Development
          </p>
          <p className="text-sm text-gray-700">
            {review.areas_for_development}
          </p>
        </div>
      </div>
    </div>
  );
}

function CpdTab({
  completed,
  planned,
}: {
  completed: CpdEntry[];
  planned: CpdEntry[];
}) {
  return (
    <div className="space-y-6">
      {/* Completed CPD */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Completed ({completed.length})
        </h4>
        {completed.length > 0 ? (
          <div className="space-y-2">
            {completed.map((cpd, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-emerald-50 rounded-lg p-3 border border-emerald-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {cpd.title}
                  </p>
                  <p className="text-xs text-gray-500">{cpd.provider}</p>
                </div>
                <p className="text-xs text-gray-500">{formatDate(cpd.date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No completed CPD recorded.
          </p>
        )}
      </div>

      {/* Planned CPD */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          Planned ({planned.length})
        </h4>
        {planned.length > 0 ? (
          <div className="space-y-2">
            {planned.map((cpd, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {cpd.title}
                  </p>
                  <p className="text-xs text-gray-500">{cpd.provider}</p>
                </div>
                <p className="text-xs text-gray-500">{formatDate(cpd.date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No CPD planned.</p>
        )}
      </div>

      <button
        disabled
        title="Coming Soon"
        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 opacity-50 cursor-not-allowed"
      >
        <Plus className="w-3 h-3" /> Add CPD Record (Coming Soon)
      </button>
    </div>
  );
}

function ObservationsTab({ observations }: { observations: Observation[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">
          Lesson Observations ({observations.length})
        </h4>
        <button
          disabled
          title="Coming Soon"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-50 cursor-not-allowed"
        >
          <Plus className="w-3 h-3" /> Add Observation (Coming Soon)
        </button>
      </div>

      {observations.length > 0 ? (
        observations.map((obs, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {obs.focus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDate(obs.date)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${JUDGEMENT_COLORS[obs.judgement] || "bg-gray-50 text-gray-700"}`}
                >
                  {obs.judgement.replace("_", " ").charAt(0).toUpperCase() +
                    obs.judgement.replace("_", " ").slice(1)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 pl-6">{obs.feedback}</p>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">
          <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No observations recorded this cycle.
        </div>
      )}
    </div>
  );
}

function PayTab({
  recommendation,
}: {
  recommendation: PayRecommendation | null;
}) {
  if (!recommendation) {
    return (
      <div className="text-center py-12">
        <PoundSterling className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">
          No pay recommendation submitted
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Pay recommendations are usually submitted after the end-year review.
        </p>
        <button
          disabled
          title="Coming Soon"
          className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto opacity-50 cursor-not-allowed"
        >
          <Edit3 className="w-3 h-3" /> Create Pay Recommendation (Coming Soon)
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending_headteacher: "bg-amber-50 text-amber-700 border-amber-200",
    pending_governors: "bg-purple-50 text-purple-700 border-purple-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  const typeLabels: Record<string, string> = {
    progression: "Pay Progression",
    ups_threshold: "UPS Threshold",
    increment: "Incremental Progression",
    maintained: "Maintained",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          Pay Recommendation
        </h4>
        <span
          className={`text-xs px-3 py-1 rounded-full border font-medium ${statusColors[recommendation.status] || "bg-gray-50 text-gray-700"}`}
        >
          {recommendation.status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Type
            </p>
            <p className="text-sm font-medium text-gray-900">
              {typeLabels[recommendation.type] || recommendation.type}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Submitted
            </p>
            <p className="text-sm text-gray-700">
              {formatDate(recommendation.submitted_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Current
            </p>
            <p className="text-sm text-gray-700 bg-white rounded px-3 py-2 border border-gray-200">
              {recommendation.current_scale}
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-4" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Recommended
            </p>
            <p className="text-sm font-medium text-emerald-700 bg-emerald-50 rounded px-3 py-2 border border-emerald-200">
              {recommendation.recommended_scale}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Justification
          </p>
          <p className="text-sm text-gray-700">
            {recommendation.justification}
          </p>
        </div>
      </div>

      {(recommendation.status === "pending_headteacher" ||
        recommendation.status === "pending_governors") && (
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Coming Soon"
            className="flex-1 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium opacity-50 cursor-not-allowed"
          >
            Approve (Coming Soon)
          </button>
          <button
            disabled
            title="Coming Soon"
            className="flex-1 text-xs bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg transition-colors font-medium opacity-50 cursor-not-allowed"
          >
            Return for Review (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}

function EctTab({ appraisal }: { appraisal: Appraisal }) {
  const assessments = appraisal.ect_assessments || [];
  const standards = appraisal.ect_teachers_standards || {};

  // Calculate progress
  const totalTerms = 6;
  const currentTerm = appraisal.ect_term || 1;
  const progressPct = Math.round((currentTerm / totalTerms) * 100);

  return (
    <div className="space-y-6">
      {/* ECT Overview */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">
              ECT Induction Progress
            </span>
          </div>
          <span className="text-sm font-bold text-purple-700">
            Term {currentTerm}/{totalTerms}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-purple-100 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-purple-600">
          <span>Mentor: {appraisal.ect_mentor || "Not assigned"}</span>
          <span>{progressPct}% complete</span>
        </div>
      </div>

      {/* Formal Assessments */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Formal Assessments
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => {
            const term = i + 1;
            const assessment = assessments.find((a) => a.term === term);
            const isFormal = term % 2 === 0; // Terms 2, 4, 6 are formal

            return (
              <div
                key={term}
                className={`rounded-lg p-3 text-center border ${
                  assessment
                    ? assessment.outcome === "on_track"
                      ? "bg-emerald-50 border-emerald-200"
                      : assessment.outcome === "concerns"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                    : term <= currentTerm
                      ? "bg-gray-100 border-gray-200"
                      : "bg-gray-50 border-gray-100"
                }`}
              >
                <p className="text-xs font-bold text-gray-700">T{term}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isFormal ? "Formal" : "Progress"}
                </p>
                {assessment && (
                  <>
                    <p className="text-xs mt-1">
                      {assessment.outcome === "on_track" ? (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mx-auto text-amber-500" />
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(assessment.date)}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Teachers' Standards */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          Teachers&apos; Standards Progress
        </h4>
        <div className="space-y-2">
          {Object.entries(TEACHERS_STANDARDS_LABELS).map(([key, label]) => {
            const status = standards[key] || "not_assessed";
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
              >
                <span className="text-xs text-gray-700">{label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === "met"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "working_towards"
                        ? "bg-amber-100 text-amber-700"
                        : status === "not_met"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {status === "met"
                    ? "Met"
                    : status === "working_towards"
                      ? "Working Towards"
                      : status === "not_met"
                        ? "Not Met"
                        : "Not Assessed"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ECT Tracking Section ────────────────────────────────────────────

function EctTrackingSection({ appraisals }: { appraisals: Appraisal[] }) {
  const ects = appraisals.filter((a) => a.is_ect);

  if (ects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-purple-500" />
          ECT Tracking
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">
          No ECTs currently in induction.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-purple-500" />
        ECT Tracking ({ects.length})
      </h3>

      <div className="space-y-4">
        {ects.map((ect) => {
          const assessments = ect.ect_assessments || [];
          const standards = ect.ect_teachers_standards || {};
          const metCount = Object.values(standards).filter(
            (v) => v === "met",
          ).length;
          const totalStandards = Object.keys(TEACHERS_STANDARDS_LABELS).length;

          return (
            <div
              key={ect.id}
              className="border border-purple-100 rounded-lg p-4 bg-purple-50/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
                    {ect.staff_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {ect.staff_name}
                    </p>
                    <p className="text-xs text-gray-500">{ect.role}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  Term {ect.ect_term}/6
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-2 border border-purple-100">
                  <p className="text-xs text-gray-500">Mentor</p>
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {ect.ect_mentor || "Not assigned"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-purple-100">
                  <p className="text-xs text-gray-500">Assessments</p>
                  <p className="text-xs font-medium text-gray-700">
                    {assessments.length} completed
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-purple-100">
                  <p className="text-xs text-gray-500">Standards Met</p>
                  <p className="text-xs font-medium text-gray-700">
                    {metCount}/{totalStandards}
                  </p>
                </div>
              </div>

              {/* Mini progress bar for terms */}
              <div className="flex gap-1 mt-3">
                {Array.from({ length: 6 }, (_, i) => {
                  const term = i + 1;
                  const assessment = assessments.find((a) => a.term === term);
                  return (
                    <div
                      key={term}
                      className={`flex-1 h-2 rounded-full ${
                        assessment
                          ? assessment.outcome === "on_track"
                            ? "bg-emerald-400"
                            : "bg-amber-400"
                          : term <= (ect.ect_term || 0)
                            ? "bg-gray-300"
                            : "bg-gray-100"
                      }`}
                      title={`Term ${term}: ${assessment?.outcome || "pending"}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pay Decisions Section ───────────────────────────────────────────

function PayDecisionsSection({
  appraisals,
  stats,
}: {
  appraisals: Appraisal[];
  stats: DashboardStats;
}) {
  const withPayRec = appraisals.filter((a) => a.pay_recommendation);
  const pending = withPayRec.filter(
    (a) =>
      a.pay_recommendation?.status === "pending_headteacher" ||
      a.pay_recommendation?.status === "pending_governors",
  );

  const typeLabels: Record<string, { label: string; color: string }> = {
    progression: { label: "Progression", color: "bg-blue-100 text-blue-700" },
    ups_threshold: {
      label: "UPS Threshold",
      color: "bg-emerald-100 text-emerald-700",
    },
    increment: { label: "Increment", color: "bg-amber-100 text-amber-700" },
    maintained: { label: "Maintained", color: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <PoundSterling className="w-5 h-5 text-emerald-500" />
        Pay Decisions
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-900">
            {stats.pending_pay_decisions.total}
          </p>
          <p className="text-xs text-gray-500">Total Recommendations</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700">
            {stats.pending_pay_decisions.pending_headteacher}
          </p>
          <p className="text-xs text-amber-600">Pending HT Approval</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-purple-700">
            {stats.pending_pay_decisions.pending_governors}
          </p>
          <p className="text-xs text-purple-600">Pending Governors</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">
            {stats.pending_pay_decisions.ups_threshold}
          </p>
          <p className="text-xs text-emerald-600">UPS Threshold</p>
        </div>
      </div>

      {/* Approval queue */}
      {pending.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Approval Queue ({pending.length})
          </h4>
          <div className="space-y-2">
            {pending.map((a) => {
              const rec = a.pay_recommendation!;
              const typeInfo = typeLabels[rec.type] || {
                label: rec.type,
                color: "bg-gray-100 text-gray-700",
              };

              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {a.staff_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {a.staff_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rec.current_scale} → {rec.recommended_scale}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {rec.status === "pending_headteacher"
                        ? "Awaiting HT"
                        : "Awaiting Govs"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {withPayRec.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No pay recommendations have been submitted yet.
        </p>
      )}
    </div>
  );
}

// ─── Create Cycle Modal ──────────────────────────────────────────────

function CreateCycleModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (cycle: any) => void;
}) {
  const [name, setName] = useState("2025-26 Appraisal Cycle");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [objectivesDue, setObjectivesDue] = useState("2025-10-31");
  const [midYearDue, setMidYearDue] = useState("2026-02-14");
  const [endYearDue, setEndYearDue] = useState("2026-07-18");
  const [payReviewDue, setPayReviewDue] = useState("2026-09-01");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/performance/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          academic_year: academicYear,
          objectives_due: objectivesDue,
          mid_year_due: midYearDue,
          end_year_due: endYearDue,
          pay_review_due: payReviewDue,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreate(data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create cycle:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Create Appraisal Cycle
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 2025-26"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectives Due
              </label>
              <input
                type="date"
                value={objectivesDue}
                onChange={(e) => setObjectivesDue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mid-Year Due
              </label>
              <input
                type="date"
                value={midYearDue}
                onChange={(e) => setMidYearDue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End-Year Due
              </label>
              <input
                type="date"
                value={endYearDue}
                onChange={(e) => setEndYearDue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Review Due
              </label>
              <input
                type="date"
                value={payReviewDue}
                onChange={(e) => setPayReviewDue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? "Creating..." : "Create Cycle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function PerformanceManagementPage() {
  const { organizationId } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [activeSection, setActiveSection] = useState<
    "overview" | "appraisals" | "ect" | "pay"
  >("overview");

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [dashRes, appRes] = await Promise.all([
        fetch("/api/performance/dashboard"),
        fetch("/api/performance/appraisals"),
      ]);

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setStats(dashData);
        setIsDemo(!!dashData.demo);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        setAppraisals(appData.appraisals || []);
        if (appData.demo) setIsDemo(true);
      }
    } catch (err) {
      console.error("Failed to fetch performance data:", err);
      setFetchError(
        err instanceof Error
          ? `Failed to load performance data: ${err.message}`
          : "Failed to load performance data. Please try refreshing the page.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ECT and pay appraisals
  const ectAppraisals = useMemo(
    () => appraisals.filter((a) => a.is_ect),
    [appraisals],
  );
  const payAppraisals = useMemo(
    () => appraisals.filter((a) => a.pay_recommendation),
    [appraisals],
  );

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Performance Management
            </h1>
            <p className="text-sm text-gray-500">
              Staff appraisals, objectives, reviews, and pay recommendations
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateCycle(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Cycle
        </button>
      </div>

      {/* Demo Banner */}
      {isDemo && <DemoBanner />}

      {/* Error Banner */}
      {fetchError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {fetchError}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: "overview" as const, label: "Overview", icon: BarChart3 },
          {
            key: "appraisals" as const,
            label: "Staff Appraisals",
            icon: Users,
            count: appraisals.length,
          },
          {
            key: "ect" as const,
            label: "ECT Tracking",
            icon: GraduationCap,
            count: ectAppraisals.length,
          },
          {
            key: "pay" as const,
            label: "Pay Decisions",
            icon: PoundSterling,
            count: payAppraisals.length,
          },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {"count" in tab && typeof tab.count === "number" && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeSection === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── SECTION 1: OVERVIEW ─────────────────────────────── */}
      {activeSection === "overview" && stats && (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              label="Total Staff"
              value={stats.total_staff}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Objectives Set"
              value={`${stats.percentages.objectives_set}%`}
              icon={Target}
              color="bg-indigo-100 text-indigo-600"
              subtext={`${stats.stages.objectives_set + stats.stages.mid_year_review + stats.stages.end_year_review + stats.stages.pay_recommendation + stats.stages.completed} of ${stats.total_staff}`}
            />
            <StatCard
              label="Mid-Year Complete"
              value={`${stats.percentages.mid_year_complete}%`}
              icon={Clock}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="End-Year Complete"
              value={`${stats.percentages.end_year_complete}%`}
              icon={ClipboardCheck}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              label="ECTs"
              value={stats.ect_count}
              icon={GraduationCap}
              color="bg-pink-100 text-pink-600"
              subtext="In induction"
            />
            <StatCard
              label="Pay Pending"
              value={stats.pending_pay_decisions.total}
              icon={PoundSterling}
              color="bg-emerald-100 text-emerald-600"
              subtext={`${stats.pending_pay_decisions.pending_headteacher} HT, ${stats.pending_pay_decisions.pending_governors} Gov`}
            />
          </div>

          {/* Pipeline & Role Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProgressPipeline stats={stats} />
            </div>
            <RoleBreakdown stats={stats} />
          </div>

          {/* Activity summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                Observations This Cycle
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.observations_this_cycle}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Across {stats.total_staff} staff members
              </p>
              <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(100, (stats.observations_this_cycle / (stats.total_staff * 3)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Target: {stats.total_staff * 3} (3 per staff member)
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                CPD Records
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.cpd_hours_logged}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                CPD activities recorded this cycle
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Average{" "}
                {stats.total_staff > 0
                  ? (stats.cpd_hours_logged / stats.total_staff).toFixed(1)
                  : 0}{" "}
                per staff member
              </div>
            </div>
          </div>

          {/* Key dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Key Dates — {stats.cycle.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Objectives Due",
                  date: stats.cycle.objectives_due,
                  icon: Target,
                },
                {
                  label: "Mid-Year Reviews",
                  date: stats.cycle.mid_year_due,
                  icon: Clock,
                },
                {
                  label: "End-Year Reviews",
                  date: stats.cycle.end_year_due,
                  icon: ClipboardCheck,
                },
                {
                  label: "Pay Recommendations",
                  date: stats.cycle.pay_review_due,
                  icon: PoundSterling,
                },
              ].map((item) => {
                const overdue = isOverdue(item.date);
                const days = daysUntil(item.date);
                const upcoming = days > 0 && days <= 30;
                const DateIcon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`rounded-lg p-3 border ${
                      overdue
                        ? "bg-red-50 border-red-200"
                        : upcoming
                          ? "bg-amber-50 border-amber-200"
                          : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DateIcon
                        className={`w-4 h-4 ${overdue ? "text-red-500" : upcoming ? "text-amber-500" : "text-gray-400"}`}
                      />
                      <p className="text-xs font-medium text-gray-700">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDate(item.date)}
                    </p>
                    {overdue && (
                      <p className="text-xs text-red-600 mt-0.5 font-medium">
                        Overdue by {Math.abs(days)} days
                      </p>
                    )}
                    {upcoming && !overdue && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        In {days} days
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: STAFF APPRAISALS ─────────────────────── */}
      {activeSection === "appraisals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Table (3 cols) */}
            <div
              className={selectedAppraisal ? "lg:col-span-2" : "lg:col-span-5"}
            >
              <StaffAppraisalsTable
                appraisals={appraisals}
                onSelect={(a) =>
                  setSelectedAppraisal(
                    selectedAppraisal?.id === a.id ? null : a,
                  )
                }
                selectedId={selectedAppraisal?.id || null}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
              />
            </div>

            {/* Detail panel (3 cols) */}
            {selectedAppraisal && (
              <div className="lg:col-span-3">
                <AppraisalDetailPanel
                  appraisal={selectedAppraisal}
                  onClose={() => setSelectedAppraisal(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: ECT TRACKING ─────────────────────────── */}
      {activeSection === "ect" && (
        <div className="space-y-6">
          <EctTrackingSection appraisals={appraisals} />

          {/* ECT Key Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              ECT Induction Guidance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  Assessment Schedule
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>Term 1: Progress review</li>
                  <li>Term 2: Formal assessment (end of Y1)</li>
                  <li>Term 3: Progress review</li>
                  <li>Term 4: Formal assessment (mid Y2)</li>
                  <li>Term 5: Progress review</li>
                  <li>Term 6: Final formal assessment</li>
                </ul>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">
                  Mentor Responsibilities
                </h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>Weekly 1:1 meeting (protected time)</li>
                  <li>Regular lesson observations</li>
                  <li>Support with evidence collection</li>
                  <li>Coordinate with induction tutor</li>
                  <li>Flag concerns early</li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <h4 className="text-sm font-semibold text-emerald-800 mb-2">
                  Reduced Timetable
                </h4>
                <ul className="text-xs text-emerald-700 space-y-1">
                  <li>Year 1: 90% timetable (10% ECT time)</li>
                  <li>Year 2: 95% timetable (5% ECT time)</li>
                  <li>ECT time is in addition to PPA</li>
                  <li>Should be used for development activities</li>
                  <li>Must not be used for cover</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 4: PAY DECISIONS ─────────────────────────── */}
      {activeSection === "pay" && stats && (
        <div className="space-y-6">
          <PayDecisionsSection appraisals={appraisals} stats={stats} />

          {/* Pay Scale Reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Pay Scale Reference 2025-26
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Main Pay Scale (MPS)
                </h4>
                {[
                  { point: "MPS 1", salary: "30,000" },
                  { point: "MPS 2", salary: "31,523" },
                  { point: "MPS 3", salary: "33,814" },
                  { point: "MPS 4", salary: "36,051" },
                  { point: "MPS 5", salary: "38,330" },
                  { point: "MPS 6", salary: "41,333" },
                ].map((row) => (
                  <div
                    key={row.point}
                    className="flex justify-between text-xs text-gray-600 py-1"
                  >
                    <span>{row.point}</span>
                    <span className="font-mono">{row.salary}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Upper Pay Scale (UPS)
                </h4>
                {[
                  { point: "UPS 1", salary: "43,266" },
                  { point: "UPS 2", salary: "44,870" },
                  { point: "UPS 3", salary: "46,525" },
                ].map((row) => (
                  <div
                    key={row.point}
                    className="flex justify-between text-xs text-gray-600 py-1"
                  >
                    <span>{row.point}</span>
                    <span className="font-mono">{row.salary}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    UPS Threshold Criteria
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                      Highly competent in all elements of relevant standards
                    </li>
                    <li>
                      Substantial and sustained contribution to the school
                    </li>
                    <li>Evidence over at least 2 consecutive years</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Leadership Scale (sample)
                </h4>
                {[
                  { point: "L1", salary: "47,185" },
                  { point: "L6", salary: "52,074" },
                  { point: "L11", salary: "58,959" },
                  { point: "L18", salary: "70,293" },
                  { point: "L21", salary: "76,430" },
                  { point: "L27", salary: "88,170" },
                ].map((row) => (
                  <div
                    key={row.point}
                    className="flex justify-between text-xs text-gray-600 py-1"
                  >
                    <span>{row.point}</span>
                    <span className="font-mono">{row.salary}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              Pay scales shown are indicative for 2025-26 (England, excluding
              London). Actual rates depend on school/trust pay policy.
            </p>
          </div>
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreateCycle && (
        <CreateCycleModal
          onClose={() => setShowCreateCycle(false)}
          onCreate={() => fetchData()}
        />
      )}
    </div>
  );
}
