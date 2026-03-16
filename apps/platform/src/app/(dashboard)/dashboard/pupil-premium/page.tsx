"use client";

import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import {
  Target,
  BookOpen,
  Users,
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Sparkles,
  ClipboardCheck,
  Eye,
  Calendar,
  Star,
  Minus,
  Shield,
  Lightbulb,
  Activity,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

// ─── Types ───────────────────────────────────────────────────────────

interface Strategy {
  id: string;
  academic_year: string;
  status: string;
  total_pupils: number;
  pp_eligible: number;
  pp_funding: number;
  service_children: number;
  lac_children: number;
  post_lac_children: number;
  fsm_ever6: number;
  statement_summary: string;
  barriers_to_learning: string;
  desired_outcomes: string;
  strategy_aims_teaching: string;
  strategy_aims_targeted: string;
  strategy_aims_wider: string;
  review_date: string;
  year_1_status: string;
  year_2_status: string;
  year_3_status: string;
  publish_date: string;
  headteacher_name: string;
  governor_name: string;
  created_at: string;
  updated_at: string;
  interventions?: Intervention[];
}

interface Intervention {
  id: string;
  strategy_id: string;
  name: string;
  description: string;
  strand: "teaching" | "targeted" | "wider";
  budgeted_cost: number;
  actual_cost: number;
  staff_lead: string;
  target_pupils: string;
  year_groups: string;
  eef_strategy_id: string | null;
  eef_strategy_name: string | null;
  eef_months_progress: number | null;
  eef_evidence_strength: number | null;
  impact_status: ImpactStatus;
  impact_notes: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

type ImpactStatus =
  | "not_yet_measured"
  | "below_expected"
  | "expected"
  | "above_expected"
  | "significant";

interface StrandData {
  label: string;
  description: string;
  budgeted: number;
  actual: number;
  intervention_count: number;
  target_pct: number;
}

interface GapSubject {
  pp: number;
  non_pp: number;
  gap: number;
  prev_gap: number;
  narrowing: boolean;
}

interface DashboardData {
  funding_summary: {
    total_funding: number;
    total_budgeted: number;
    total_spent: number;
    variance: number;
    variance_pct: number;
    pp_eligible: number;
    total_pupils: number;
    pp_percentage: number;
    per_pupil_funding: number;
    service_children: number;
    lac_children: number;
    post_lac_children: number;
  };
  spend_by_strand: Record<string, StrandData>;
  impact_summary: {
    total_interventions: number;
    significant: number;
    above_expected: number;
    expected: number;
    below_expected: number;
    not_yet_measured: number;
    avg_eef_months: number;
    avg_evidence_strength: number;
  };
  gap_analysis: Record<string, GapSubject>;
  attendance: {
    pp_attendance: number;
    non_pp_attendance: number;
    pp_persistent_absence: number;
    non_pp_persistent_absence: number;
    pp_attendance_prev: number;
  };
  dfe_template_completeness: {
    school_overview: boolean;
    funding_overview: boolean;
    barriers_identified: boolean;
    outcomes_defined: boolean;
    teaching_strategy: boolean;
    targeted_strategy: boolean;
    wider_strategy: boolean;
    implementation: boolean;
    review_mechanism: boolean;
    externally_reviewed: boolean;
    total: number;
    required: number;
    pct: number;
  };
  demo: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

const STRAND_COLORS: Record<
  string,
  { bg: string; border: string; text: string; light: string }
> = {
  teaching: {
    bg: "bg-blue-500",
    border: "border-blue-500",
    text: "text-blue-700",
    light: "bg-blue-50",
  },
  targeted: {
    bg: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-700",
    light: "bg-amber-50",
  },
  wider: {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-700",
    light: "bg-emerald-50",
  },
};

const STRAND_ICONS: Record<string, typeof GraduationCap> = {
  teaching: GraduationCap,
  targeted: Target,
  wider: Users,
};

const IMPACT_CONFIG: Record<
  ImpactStatus,
  { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }
> = {
  significant: {
    label: "Significant Impact",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: Star,
  },
  above_expected: {
    label: "Above Expected",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: TrendingUp,
  },
  expected: {
    label: "Expected Impact",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: CheckCircle2,
  },
  below_expected: {
    label: "Below Expected",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: AlertTriangle,
  },
  not_yet_measured: {
    label: "Not Yet Measured",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    icon: Circle,
  },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-200 text-gray-700" },
  published: { label: "Published", color: "bg-green-100 text-green-700" },
  under_review: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-700",
  },
  archived: { label: "Archived", color: "bg-red-100 text-red-700" },
};

const YEAR_STATUS: Record<string, { label: string; color: string }> = {
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  planned: {
    label: "Planned",
    color: "bg-gray-100 text-gray-600 border-gray-300",
  },
  complete: {
    label: "Complete",
    color: "bg-green-100 text-green-700 border-green-300",
  },
};

const EEF_STRATEGIES_BY_STRAND = {
  teaching: [
    {
      id: "metacognition",
      name: "Metacognition & Self-Regulation",
      months: 7,
      evidence: 5,
    },
    { id: "feedback", name: "Feedback", months: 6, evidence: 5 },
    {
      id: "reading-comprehension",
      name: "Reading Comprehension Strategies",
      months: 6,
      evidence: 5,
    },
    { id: "phonics", name: "Phonics", months: 5, evidence: 5 },
    {
      id: "collaborative-learning",
      name: "Collaborative Learning",
      months: 5,
      evidence: 5,
    },
    {
      id: "mastery-learning",
      name: "Mastery Learning",
      months: 5,
      evidence: 4,
    },
    { id: "peer-tutoring", name: "Peer Tutoring", months: 5, evidence: 5 },
    { id: "homework", name: "Homework", months: 5, evidence: 4 },
    {
      id: "digital-technology",
      name: "Digital Technology",
      months: 4,
      evidence: 4,
    },
    {
      id: "individualised-instruction",
      name: "Individualised Instruction",
      months: 4,
      evidence: 4,
    },
  ],
  targeted: [
    {
      id: "oral-language",
      name: "Oral Language Interventions",
      months: 6,
      evidence: 5,
    },
    {
      id: "one-to-one-tuition",
      name: "One to One Tuition",
      months: 5,
      evidence: 4,
    },
    {
      id: "small-group-tuition",
      name: "Small Group Tuition",
      months: 4,
      evidence: 4,
    },
    {
      id: "teaching-assistants",
      name: "Teaching Assistant Interventions",
      months: 4,
      evidence: 4,
    },
    {
      id: "early-years-intervention",
      name: "Early Years Intervention",
      months: 6,
      evidence: 5,
    },
  ],
  wider: [
    {
      id: "behaviour-interventions",
      name: "Behaviour Interventions",
      months: 4,
      evidence: 4,
    },
    {
      id: "social-emotional-learning",
      name: "Social & Emotional Learning",
      months: 4,
      evidence: 4,
    },
    {
      id: "parental-engagement",
      name: "Parental Engagement",
      months: 4,
      evidence: 4,
    },
    {
      id: "extending-school-time",
      name: "Extending School Time",
      months: 3,
      evidence: 3,
    },
    {
      id: "arts-participation",
      name: "Arts Participation",
      months: 3,
      evidence: 3,
    },
    {
      id: "sports-participation",
      name: "Sports Participation",
      months: 2,
      evidence: 3,
    },
  ],
};

// ─── Helper Components ───────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <div className="bg-amber-100 rounded-lg p-2 mt-0.5">
        <Eye className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="font-semibold text-amber-800">Demo Mode</p>
        <p className="text-sm text-amber-700 mt-0.5">
          You are viewing sample data for a fictional primary school. Connect
          your data to see your real pupil premium strategy, interventions, and
          impact analysis.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof Target;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="bg-pink-100 rounded-lg p-2">
          <Icon className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  className = "",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: typeof Target;
  trend?: "up" | "down" | null;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend === "up" && (
          <ArrowUpRight className="w-4 h-4 text-green-500 mb-1" />
        )}
        {trend === "down" && (
          <ArrowDownRight className="w-4 h-4 text-red-500 mb-1" />
        )}
      </div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color = "bg-blue-500",
  bgColor = "bg-gray-200",
  height = "h-3",
  showLabel = false,
}: {
  value: number;
  max: number;
  color?: string;
  bgColor?: string;
  height?: string;
  showLabel?: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full">
      <div className={`${bgColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 mt-1">{Math.round(pct)}%</span>
      )}
    </div>
  );
}

function EvidenceBadge({
  months,
  strength,
}: {
  months: number | null;
  strength: number | null;
}) {
  if (!months && !strength) return null;
  return (
    <div className="flex items-center gap-2">
      {months !== null && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          <TrendingUp className="w-3 h-3" />+{months} months
        </span>
      )}
      {strength !== null && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                i < (strength || 0) ? "bg-indigo-500" : "bg-gray-300"
              }`}
            />
          ))}
          <span className="ml-0.5">evidence</span>
        </span>
      )}
    </div>
  );
}

function RAGIndicator({ status }: { status: ImpactStatus }) {
  const config = IMPACT_CONFIG[status];
  const IconComp = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      <IconComp className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Add Intervention Modal ──────────────────────────────────────────

function AddInterventionModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (intervention: Partial<Intervention>) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [strand, setStrand] = useState<"teaching" | "targeted" | "wider">(
    "teaching",
  );
  const [budgetedCost, setBudgetedCost] = useState("");
  const [staffLead, setStaffLead] = useState("");
  const [targetPupils, setTargetPupils] = useState("");
  const [yearGroups, setYearGroups] = useState("");
  const [selectedEEF, setSelectedEEF] = useState<string | null>(null);

  const strategies = EEF_STRATEGIES_BY_STRAND[strand];
  const selected = strategies.find((s) => s.id === selectedEEF);

  const handleSubmit = () => {
    if (!name || !strand) return;
    onAdd({
      name,
      description,
      strand,
      budgeted_cost: parseFloat(budgetedCost) || 0,
      staff_lead: staffLead,
      target_pupils: targetPupils,
      year_groups: yearGroups,
      eef_strategy_id: selected?.id || null,
      eef_strategy_name: selected?.name || null,
      eef_months_progress: selected?.months || null,
      eef_evidence_strength: selected?.evidence || null,
    });
    // Reset form
    setName("");
    setDescription("");
    setStrand("teaching");
    setBudgetedCost("");
    setStaffLead("");
    setTargetPupils("");
    setYearGroups("");
    setSelectedEEF(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Add Intervention</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intervention Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="e.g., Small Group Maths Tuition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Describe the intervention approach and rationale..."
            />
          </div>

          {/* Strand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EEF Strand *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["teaching", "targeted", "wider"] as const).map((s) => {
                const StrandIcon = STRAND_ICONS[s];
                const colors = STRAND_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setStrand(s);
                      setSelectedEEF(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      strand === s
                        ? `${colors.border} ${colors.light} ${colors.text}`
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <StrandIcon className="w-4 h-4" />
                    {s === "teaching"
                      ? "Teaching"
                      : s === "targeted"
                        ? "Targeted Support"
                        : "Wider Strategies"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EEF Strategy Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1 text-indigo-500" />
              Link to EEF Strategy (recommended)
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {strategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    setSelectedEEF(selectedEEF === s.id ? null : s.id)
                  }
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    selectedEEF === s.id
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 shrink-0 ml-2">
                    <span className="text-indigo-600 font-medium">
                      +{s.months} months
                    </span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            i < s.evidence ? "bg-indigo-400" : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cost & Staff */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budgeted Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">
                  £
                </span>
                <input
                  type="number"
                  value={budgetedCost}
                  onChange={(e) => setBudgetedCost(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Lead
              </label>
              <input
                type="text"
                value={staffLead}
                onChange={(e) => setStaffLead(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., Mrs K. Patel"
              />
            </div>
          </div>

          {/* Target & Year Groups */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Pupils
              </label>
              <input
                type="text"
                value={targetPupils}
                onChange={(e) => setTargetPupils(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., 12 PP pupils"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Groups
              </label>
              <input
                type="text"
                value={yearGroups}
                onChange={(e) => setYearGroups(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., 3-6"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name}
            className="px-5 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Intervention
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function PupilPremiumPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || "";
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedIntervention, setExpandedIntervention] = useState<
    string | null
  >(null);
  const [showStatement, setShowStatement] = useState(false);

  // ─── Data Fetching (SWR) ──────────────────────────────────────────

  const swrOpts = { revalidateOnFocus: false };
  const { data: dashboardData, error: dashErr } = useSWR<DashboardData>(
    orgId ? `/api/pupil-premium/dashboard?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );
  const {
    data: stratData,
    error: stratErr,
    mutate: mutateStrategies,
  } = useSWR(
    orgId ? `/api/pupil-premium/strategies?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );

  const currentStrategy = (stratData?.strategies || [])[0] || null;
  const strategyId = currentStrategy?.id;

  // Dependent fetch: strategy detail (only when we have a strategy ID)
  const { data: detailData, mutate: mutateDetail } = useSWR(
    strategyId ? `/api/pupil-premium/strategies/${strategyId}` : null,
    fetcher,
    swrOpts,
  );

  const dashboard = dashboardData ?? null;
  const strategy: Strategy | null = currentStrategy;
  const interventions: Intervention[] =
    detailData?.strategy?.interventions || [];
  const isDemo = dashboardData?.demo ?? stratData?.demo ?? true;
  const loading = !dashboardData && !dashErr;

  const fetchData = useCallback(() => {
    mutateStrategies();
    mutateDetail();
  }, [mutateStrategies, mutateDetail]);

  // ─── Computed Values ─────────────────────────────────────────────

  const interventionsByStrand = useMemo(() => {
    const grouped: Record<string, Intervention[]> = {
      teaching: [],
      targeted: [],
      wider: [],
    };
    for (const i of interventions) {
      if (grouped[i.strand]) {
        grouped[i.strand].push(i);
      }
    }
    return grouped;
  }, [interventions]);

  const handleAddIntervention = useCallback(
    (data: Partial<Intervention>) => {
      // In demo mode, add via optimistic update
      const newIntervention: Intervention = {
        id: `new-${Date.now()}`,
        strategy_id: "demo-strategy-2025",
        name: data.name || "",
        description: data.description || "",
        strand: data.strand || "teaching",
        budgeted_cost: data.budgeted_cost || 0,
        actual_cost: 0,
        staff_lead: data.staff_lead || "",
        target_pupils: data.target_pupils || "",
        year_groups: data.year_groups || "",
        eef_strategy_id: data.eef_strategy_id || null,
        eef_strategy_name: data.eef_strategy_name || null,
        eef_months_progress: data.eef_months_progress || null,
        eef_evidence_strength: data.eef_evidence_strength || null,
        impact_status: "not_yet_measured",
        impact_notes: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        active: true,
      };
      if (strategyId) {
        mutateDetail(
          (prev: any) => ({
            ...prev,
            strategy: {
              ...prev?.strategy,
              interventions: [
                ...(prev?.strategy?.interventions || []),
                newIntervention,
              ],
            },
          }),
          { revalidate: false },
        );
      }
    },
    [strategyId, mutateDetail],
  );

  // ─── Loading State ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = dashboard;
  const s = strategy;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-3 shadow-lg shadow-pink-200">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pupil Premium Strategy
            </h1>
            <p className="text-sm text-gray-500">
              {s?.academic_year || "2025-26"} &middot; DfE compliant strategy
              builder with EEF evidence matching
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {s && (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                STATUS_BADGE[s.status]?.color || STATUS_BADGE.draft.color
              }`}
            >
              {STATUS_BADGE[s.status]?.label || s.status}
            </span>
          )}
          <button
            onClick={() => setShowStatement(!showStatement)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            DfE Statement
          </button>
        </div>
      </div>

      {isDemo && <DemoBanner />}

      {/* Section Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: "overview", label: "Strategy Overview", icon: ClipboardCheck },
          { id: "spend", label: "Spend Tracker", icon: PoundSterling },
          { id: "interventions", label: "Interventions", icon: Sparkles },
          { id: "impact", label: "Impact & Gaps", icon: BarChart3 },
          { id: "statement", label: "DfE Statement", icon: FileText },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === tab.id
                  ? "bg-white text-pink-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: STRATEGY OVERVIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Key Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              label="Total Pupils"
              value={d?.funding_summary.total_pupils || 0}
              icon={Users}
              sub="On roll"
            />
            <StatCard
              label="PP Eligible"
              value={d?.funding_summary.pp_eligible || 0}
              icon={Target}
              sub={`${d?.funding_summary.pp_percentage || 0}% of cohort`}
            />
            <StatCard
              label="PP Funding"
              value={formatCurrency(d?.funding_summary.total_funding || 0)}
              icon={PoundSterling}
              sub={`${formatCurrency(d?.funding_summary.per_pupil_funding || 0)} per pupil`}
            />
            <StatCard
              label="Service Children"
              value={d?.funding_summary.service_children || 0}
              icon={Shield}
              sub="Armed forces"
            />
            <StatCard
              label="LAC"
              value={d?.funding_summary.lac_children || 0}
              icon={Users}
              sub="Looked-after"
            />
            <StatCard
              label="Post-LAC"
              value={d?.funding_summary.post_lac_children || 0}
              icon={Users}
              sub="Previously looked-after"
            />
          </div>

          {/* 3-Year Strategy Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={Calendar}
              title="3-Year Strategy Timeline"
              subtitle="Multi-year approach to closing the disadvantage gap"
            />
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                {
                  year: "Year 1 (2025-26)",
                  status: s?.year_1_status || "in_progress",
                  focus:
                    "Establish evidence-based approaches. Baseline assessments. Implement core teaching strategies.",
                },
                {
                  year: "Year 2 (2026-27)",
                  status: s?.year_2_status || "planned",
                  focus:
                    "Evaluate Year 1 impact. Scale successful interventions. Adjust approach based on data.",
                },
                {
                  year: "Year 3 (2027-28)",
                  status: s?.year_3_status || "planned",
                  focus:
                    "Sustain and embed approaches. Focus on sustainability beyond PP funding. External review.",
                },
              ].map((item) => {
                const yearStatus =
                  YEAR_STATUS[item.status] || YEAR_STATUS.planned;
                return (
                  <div
                    key={item.year}
                    className={`rounded-xl border-2 p-4 ${yearStatus.color}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{item.year}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70">
                        {yearStatus.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">
                      {item.focus}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DfE Template Completeness + Strategy Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DfE Completeness Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SectionHeader
                icon={ClipboardCheck}
                title="DfE Template Checklist"
                subtitle={`${d?.dfe_template_completeness.total || 0}/${d?.dfe_template_completeness.required || 10} sections complete`}
              />
              <div className="mb-4">
                <ProgressBar
                  value={d?.dfe_template_completeness.total || 0}
                  max={d?.dfe_template_completeness.required || 10}
                  color="bg-pink-500"
                  height="h-2.5"
                />
                <span className="text-sm font-medium text-pink-600 mt-1 block">
                  {d?.dfe_template_completeness.pct || 0}% complete
                </span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    key: "school_overview",
                    label: "School overview & context",
                  },
                  { key: "funding_overview", label: "Funding overview" },
                  {
                    key: "barriers_identified",
                    label: "Barriers to learning identified",
                  },
                  {
                    key: "outcomes_defined",
                    label: "Desired outcomes defined",
                  },
                  {
                    key: "teaching_strategy",
                    label: "Teaching strategies (Tier 1)",
                  },
                  {
                    key: "targeted_strategy",
                    label: "Targeted support (Tier 2)",
                  },
                  { key: "wider_strategy", label: "Wider strategies (Tier 3)" },
                  { key: "implementation", label: "Implementation plan" },
                  { key: "review_mechanism", label: "Review mechanism" },
                  { key: "externally_reviewed", label: "Externally reviewed" },
                ].map((item) => {
                  const isComplete =
                    d?.dfe_template_completeness[
                      item.key as keyof typeof d.dfe_template_completeness
                    ] === true;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 py-1.5"
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-gray-300 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${isComplete ? "text-gray-700" : "text-gray-400"}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <SectionHeader
                icon={BookOpen}
                title="Strategy Summary"
                subtitle="Key elements of the PP strategy"
              />
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Overview
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {s?.statement_summary ||
                      "No strategy summary provided yet."}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Barriers to Learning
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {s?.barriers_to_learning || "Not yet identified."}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Desired Outcomes
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {s?.desired_outcomes || "Not yet defined."}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Headteacher: {s?.headteacher_name || "Not specified"}
                    </span>
                    <span>
                      PP Governor: {s?.governor_name || "Not specified"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Review date: {s?.review_date || "Not set"} &middot; Last
                    updated:{" "}
                    {s?.updated_at
                      ? new Date(s.updated_at).toLocaleDateString("en-GB")
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: SPEND TRACKER
          ═══════════════════════════════════════════════════════════════ */}
      {activeSection === "spend" && d && (
        <div className="space-y-6">
          {/* Top-level spend summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total PP Funding"
              value={formatCurrency(d.funding_summary.total_funding)}
              icon={PoundSterling}
            />
            <StatCard
              label="Total Budgeted"
              value={formatCurrency(d.funding_summary.total_budgeted)}
              icon={BarChart3}
              sub={
                d.funding_summary.total_budgeted ===
                d.funding_summary.total_funding
                  ? "Fully allocated"
                  : `${formatCurrency(d.funding_summary.total_funding - d.funding_summary.total_budgeted)} unallocated`
              }
            />
            <StatCard
              label="Total Spent"
              value={formatCurrency(d.funding_summary.total_spent)}
              icon={Activity}
              sub={`${Math.round((d.funding_summary.total_spent / d.funding_summary.total_funding) * 100)}% of funding`}
            />
            <StatCard
              label="Variance"
              value={formatCurrency(d.funding_summary.variance)}
              icon={d.funding_summary.variance >= 0 ? TrendingUp : TrendingDown}
              trend={d.funding_summary.variance >= 0 ? "up" : "down"}
              sub={`${d.funding_summary.variance_pct}% ${d.funding_summary.variance >= 0 ? "under" : "over"} budget`}
            />
          </div>

          {/* Strand Breakdowns */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={BarChart3}
              title="Spend by EEF Strand"
              subtitle="Budget allocation following the EEF tiered approach"
            />

            <div className="space-y-6 mt-2">
              {(["teaching", "targeted", "wider"] as const).map((strandKey) => {
                const strand = d.spend_by_strand[strandKey];
                if (!strand) return null;
                const StrandIcon = STRAND_ICONS[strandKey];
                const colors = STRAND_COLORS[strandKey];
                const pctOfTotal =
                  d.funding_summary.total_funding > 0
                    ? Math.round(
                        (strand.budgeted / d.funding_summary.total_funding) *
                          100,
                      )
                    : 0;
                const spendPct =
                  strand.budgeted > 0
                    ? Math.round((strand.actual / strand.budgeted) * 100)
                    : 0;

                return (
                  <div
                    key={strandKey}
                    className={`rounded-xl border-2 ${colors.border} ${colors.light} p-5`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`${colors.bg} rounded-lg p-2`}>
                          <StrandIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${colors.text}`}>
                            {strand.label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {strand.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          {pctOfTotal}% of total
                        </div>
                        <div className="text-xs text-gray-500">
                          {strand.intervention_count} intervention
                          {strand.intervention_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    {/* Budget vs Actual bars */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          Budgeted: {formatCurrency(strand.budgeted)}
                        </span>
                        <span className="text-gray-600">
                          Spent: {formatCurrency(strand.actual)}
                        </span>
                      </div>
                      <div className="relative">
                        {/* Budget bar (background) */}
                        <div className="bg-white/60 rounded-full h-5 overflow-hidden border border-gray-200">
                          <div
                            className={`${colors.bg} h-5 rounded-full transition-all duration-700 opacity-40`}
                            style={{
                              width: `${d.funding_summary.total_funding > 0 ? (strand.budgeted / d.funding_summary.total_funding) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        {/* Actual bar (overlay) */}
                        <div className="absolute top-0 left-0 h-5 w-full">
                          <div
                            className={`${colors.bg} h-5 rounded-full transition-all duration-700`}
                            style={{
                              width: `${d.funding_summary.total_funding > 0 ? (strand.actual / d.funding_summary.total_funding) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${colors.text}`}>
                          {spendPct}% of strand budget spent
                        </span>
                        <span className="text-gray-500">
                          {formatCurrency(strand.budgeted - strand.actual)}{" "}
                          remaining
                        </span>
                      </div>
                    </div>

                    {/* Individual interventions in this strand */}
                    {interventionsByStrand[strandKey]?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {interventionsByStrand[strandKey].map((interv) => (
                          <div
                            key={interv.id}
                            className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 text-xs"
                          >
                            <span className="font-medium text-gray-700 truncate mr-2">
                              {interv.name}
                            </span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-gray-500">
                                Budget: {formatCurrency(interv.budgeted_cost)}
                              </span>
                              <span className="text-gray-700 font-medium">
                                Actual: {formatCurrency(interv.actual_cost)}
                              </span>
                              {interv.actual_cost <= interv.budgeted_cost ? (
                                <span className="text-green-600">
                                  {formatCurrency(
                                    interv.budgeted_cost - interv.actual_cost,
                                  )}{" "}
                                  under
                                </span>
                              ) : (
                                <span className="text-red-600">
                                  {formatCurrency(
                                    interv.actual_cost - interv.budgeted_cost,
                                  )}{" "}
                                  over
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total allocation visual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={PoundSterling}
              title="Funding Allocation Summary"
              subtitle="How the full PP grant is distributed across strands"
            />
            <div className="flex items-center gap-1 h-10 rounded-lg overflow-hidden mt-2">
              {(["teaching", "targeted", "wider"] as const).map((strandKey) => {
                const strand = d.spend_by_strand[strandKey];
                if (!strand) return null;
                const colors = STRAND_COLORS[strandKey];
                const pct =
                  d.funding_summary.total_funding > 0
                    ? (strand.budgeted / d.funding_summary.total_funding) * 100
                    : 0;
                return (
                  <div
                    key={strandKey}
                    className={`${colors.bg} h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    title={`${strand.label}: ${formatCurrency(strand.budgeted)} (${Math.round(pct)}%)`}
                  >
                    {pct > 15 && `${Math.round(pct)}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              {(["teaching", "targeted", "wider"] as const).map((strandKey) => {
                const strand = d.spend_by_strand[strandKey];
                if (!strand) return null;
                const colors = STRAND_COLORS[strandKey];
                return (
                  <div
                    key={strandKey}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className={`w-3 h-3 rounded-sm ${colors.bg}`} />
                    <span className="text-gray-600">{strand.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: INTERVENTIONS
          ═══════════════════════════════════════════════════════════════ */}
      {activeSection === "interventions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={Sparkles}
              title="Interventions"
              subtitle={`${interventions.length} interventions across 3 EEF strands`}
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Intervention
            </button>
          </div>

          {/* Impact Summary Pills */}
          {d && (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "significant",
                  "above_expected",
                  "expected",
                  "below_expected",
                  "not_yet_measured",
                ] as ImpactStatus[]
              ).map((status) => {
                const config = IMPACT_CONFIG[status];
                const count = d.impact_summary[
                  status as keyof typeof d.impact_summary
                ] as number;
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                  >
                    {React.createElement(config.icon, {
                      className: "w-3.5 h-3.5",
                    })}
                    {count} {config.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Grouped by Strand */}
          {(["teaching", "targeted", "wider"] as const).map((strandKey) => {
            const strandInterventions = interventionsByStrand[strandKey] || [];
            const StrandIcon = STRAND_ICONS[strandKey];
            const colors = STRAND_COLORS[strandKey];
            const strandLabel =
              strandKey === "teaching"
                ? "Teaching"
                : strandKey === "targeted"
                  ? "Targeted Academic Support"
                  : "Wider Strategies";

            return (
              <div key={strandKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`${colors.bg} rounded-lg p-1.5`}>
                    <StrandIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className={`font-semibold ${colors.text}`}>
                    {strandLabel}
                  </h3>
                  <span className="text-xs text-gray-400">
                    ({strandInterventions.length} intervention
                    {strandInterventions.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {strandInterventions.length === 0 && (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-400">
                      No interventions in this strand yet.
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      + Add one
                    </button>
                  </div>
                )}

                {strandInterventions.map((interv) => {
                  const isExpanded = expandedIntervention === interv.id;
                  return (
                    <div
                      key={interv.id}
                      className={`bg-white rounded-xl border-2 transition-all ${
                        isExpanded
                          ? `${colors.border} shadow-md`
                          : "border-gray-200"
                      }`}
                    >
                      {/* Card Header */}
                      <button
                        onClick={() =>
                          setExpandedIntervention(isExpanded ? null : interv.id)
                        }
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            <RAGIndicator status={interv.impact_status} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {interv.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                              <span>
                                {interv.staff_lead || "No lead assigned"}
                              </span>
                              <span>&middot;</span>
                              <span>Y{interv.year_groups}</span>
                              <span>&middot;</span>
                              <span>{interv.target_pupils}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-gray-700">
                              {formatCurrency(interv.actual_cost)}
                            </div>
                            <div className="text-xs text-gray-400">
                              of {formatCurrency(interv.budgeted_cost)}
                            </div>
                          </div>
                          <EvidenceBadge
                            months={interv.eef_months_progress}
                            strength={interv.eef_evidence_strength}
                          />
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {interv.description}
                          </p>

                          {interv.eef_strategy_name && (
                            <div className="bg-indigo-50 rounded-lg p-3 flex items-start gap-3">
                              <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-indigo-700">
                                  Linked EEF Strategy:{" "}
                                  {interv.eef_strategy_name}
                                </p>
                                <p className="text-xs text-indigo-600 mt-0.5">
                                  Expected +{interv.eef_months_progress} months
                                  progress &middot; Evidence strength:{" "}
                                  {interv.eef_evidence_strength}/5
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Budgeted
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(interv.budgeted_cost)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Actual Spend
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(interv.actual_cost)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Staff Lead
                              </div>
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {interv.staff_lead || "TBC"}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Duration
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {interv.start_date
                                  ? new Date(
                                      interv.start_date,
                                    ).toLocaleDateString("en-GB", {
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "TBC"}{" "}
                                -{" "}
                                {interv.end_date
                                  ? new Date(
                                      interv.end_date,
                                    ).toLocaleDateString("en-GB", {
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Ongoing"}
                              </div>
                            </div>
                          </div>

                          {interv.impact_notes && (
                            <div
                              className={`rounded-lg p-3 ${IMPACT_CONFIG[interv.impact_status].bgColor}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {React.createElement(
                                  IMPACT_CONFIG[interv.impact_status].icon,
                                  {
                                    className: `w-4 h-4 ${IMPACT_CONFIG[interv.impact_status].color}`,
                                  },
                                )}
                                <span
                                  className={`text-xs font-semibold ${IMPACT_CONFIG[interv.impact_status].color}`}
                                >
                                  Impact Assessment
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {interv.impact_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: IMPACT & GAP ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
      {activeSection === "impact" && d && (
        <div className="space-y-6">
          {/* Impact Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Interventions"
              value={d.impact_summary.total_interventions}
              icon={Sparkles}
              sub="Active this year"
            />
            <StatCard
              label="Avg EEF Impact"
              value={`+${d.impact_summary.avg_eef_months} months`}
              icon={TrendingUp}
              sub="Expected progress"
            />
            <StatCard
              label="Evidence Strength"
              value={`${d.impact_summary.avg_evidence_strength}/5`}
              icon={Award}
              sub="Average EEF rating"
            />
            <StatCard
              label="On Track"
              value={
                d.impact_summary.significant +
                d.impact_summary.above_expected +
                d.impact_summary.expected
              }
              icon={CheckCircle2}
              sub={`of ${d.impact_summary.total_interventions} interventions`}
              trend="up"
            />
          </div>

          {/* PP vs Non-PP Gap Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={BarChart3}
              title="PP vs Non-PP Attainment Gap"
              subtitle="Percentage of pupils achieving expected standard or above"
            />

            <div className="space-y-6 mt-4">
              {(["reading", "writing", "maths", "combined"] as const).map(
                (subject) => {
                  const gap = d.gap_analysis[subject];
                  if (!gap) return null;
                  const subjectLabel =
                    subject === "combined"
                      ? "Reading, Writing & Maths Combined"
                      : subject.charAt(0).toUpperCase() + subject.slice(1);

                  return (
                    <div key={subject} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">
                          {subjectLabel}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          {gap.narrowing ? (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <TrendingUp className="w-3 h-3" />
                              Gap narrowing ({gap.prev_gap}% to {gap.gap}%)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <TrendingDown className="w-3 h-3" />
                              Gap widening ({gap.prev_gap}% to {gap.gap}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PP bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">
                          PP
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-pink-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                            style={{ width: `${gap.pp}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {gap.pp}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Non-PP bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">
                          Non-PP
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-gray-400 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                            style={{ width: `${gap.non_pp}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {gap.non_pp}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gap indicator */}
                      <div className="flex items-center gap-2 pl-[68px]">
                        <div
                          className={`h-1 rounded-full ${gap.narrowing ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${Math.abs(gap.gap)}%` }}
                        />
                        <span className="text-xs font-medium text-gray-500">
                          {Math.abs(gap.gap)}pp gap
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-sm bg-pink-500" />
                Pupil Premium
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-sm bg-gray-400" />
                Non-Pupil Premium
              </div>
            </div>
          </div>

          {/* Attendance Gap */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={Activity}
              title="Attendance Gap"
              subtitle="PP vs non-PP attendance and persistent absence"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-pink-700">
                  {d.attendance.pp_attendance}%
                </div>
                <div className="text-xs text-pink-600 mt-1">PP Attendance</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  (prev: {d.attendance.pp_attendance_prev}%)
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {d.attendance.non_pp_attendance}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Non-PP Attendance
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {d.attendance.pp_persistent_absence}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  PP Persistent Absence
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {d.attendance.non_pp_persistent_absence}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Non-PP Persistent Absence
                </div>
              </div>
            </div>
          </div>

          {/* Intervention Impact Summary Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader
              icon={Award}
              title="Intervention Impact Summary"
              subtitle="RAG rating for each intervention based on measured outcomes"
            />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Intervention
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Strand
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      EEF Strategy
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Expected
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {interventions.map((interv) => {
                    const colors = STRAND_COLORS[interv.strand];
                    return (
                      <tr key={interv.id} className="hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <span className="font-medium text-gray-900">
                            {interv.name}
                          </span>
                          <br />
                          <span className="text-xs text-gray-500">
                            {interv.staff_lead}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}
                          >
                            {interv.strand === "teaching"
                              ? "Teaching"
                              : interv.strand === "targeted"
                                ? "Targeted"
                                : "Wider"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-600">
                          {interv.eef_strategy_name || "Not linked"}
                        </td>
                        <td className="py-3 px-2 text-right text-xs font-medium text-gray-700">
                          {formatCurrency(interv.actual_cost)}
                        </td>
                        <td className="py-3 px-2 text-right text-xs">
                          {interv.eef_months_progress
                            ? `+${interv.eef_months_progress}m`
                            : "-"}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <RAGIndicator status={interv.impact_status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
            <SectionHeader
              icon={Lightbulb}
              title="Recommendations for Next Year"
              subtitle="Based on impact data and EEF evidence"
            />
            <div className="space-y-3 mt-2">
              {[
                {
                  title: "Continue Metacognition CPD",
                  detail:
                    "Above expected impact and strong evidence base. Deepen implementation with peer observation and coaching model.",
                  type: "continue" as const,
                },
                {
                  title: "Scale 1:1 Reading Tuition",
                  detail:
                    "Significant impact for KS1 readers. Consider extending to Y3-4 pupils who are still below expected standard.",
                  type: "scale" as const,
                },
                {
                  title: "Review Attendance Strategy",
                  detail:
                    "Below expected impact despite investment. Consider more targeted approach focusing on persistent absentees. Explore EWO involvement.",
                  type: "review" as const,
                },
                {
                  title: "Increase Oral Language Provision",
                  detail:
                    "Strong evidence base (EEF +6 months). Awaiting impact data but NELI programme shows national positive outcomes. Consider expanding to Y2.",
                  type: "scale" as const,
                },
                {
                  title: "Strengthen Governor Challenge",
                  detail:
                    "Ensure PP governor visits termly and asks about specific intervention impact data. Consider external PP review.",
                  type: "strengthen" as const,
                },
              ].map((rec, idx) => {
                const typeConfig = {
                  continue: {
                    icon: CheckCircle2,
                    color: "text-green-700",
                    bg: "bg-green-100",
                  },
                  scale: {
                    icon: TrendingUp,
                    color: "text-blue-700",
                    bg: "bg-blue-100",
                  },
                  review: {
                    icon: AlertTriangle,
                    color: "text-orange-700",
                    bg: "bg-orange-100",
                  },
                  strengthen: {
                    icon: Shield,
                    color: "text-purple-700",
                    bg: "bg-purple-100",
                  },
                };
                const cfg = typeConfig[rec.type];
                const RecIcon = cfg.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white/80 rounded-lg p-4 flex items-start gap-3"
                  >
                    <div className={`${cfg.bg} rounded-lg p-1.5 mt-0.5`}>
                      <RecIcon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {rec.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: DfE STATEMENT BUILDER
          ═══════════════════════════════════════════════════════════════ */}
      {activeSection === "statement" && s && (
        <div className="space-y-6">
          {/* Export Controls */}
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={FileText}
              title="DfE Pupil Premium Strategy Statement"
              subtitle="Auto-populated from your strategy data. Publish on your school website."
            />
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Export / Print
            </button>
          </div>

          {/* Statutory Compliance Checklist */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-800 text-sm">
                  Statutory Requirements
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Schools must publish their pupil premium strategy on their
                  website. The DfE recommends using their template which follows
                  the EEF tiered approach. The strategy should be reviewed at
                  least annually. Ofsted inspectors will check your strategy as
                  part of the inspection process.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Published on website",
                    "Uses DfE template",
                    "EEF tiered approach",
                    "Annual review date set",
                    "Governor oversight",
                    "Impact measured",
                  ].map((item, idx) => {
                    const isChecked = idx < 4;
                    return (
                      <span
                        key={item}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isChecked
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Statement Document */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-8 rounded-t-xl print:rounded-none">
              <h2 className="text-2xl font-bold">
                Pupil Premium Strategy Statement
              </h2>
              <p className="text-pink-100 mt-1">
                Academic Year: {s.academic_year} &middot; Published:{" "}
                {s.publish_date
                  ? new Date(s.publish_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not yet published"}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* School Overview */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-pink-200 pb-2 mb-4">
                  1. School Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Total Pupils
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.total_pupils}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      PP Eligible
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.pp_eligible} (
                      {s.total_pupils > 0
                        ? Math.round((s.pp_eligible / s.total_pupils) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      PP Funding
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(s.pp_funding)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      FSM (Ever6)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.fsm_ever6}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Service Children
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.service_children}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      LAC / Post-LAC
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.lac_children} / {s.post_lac_children}
                    </span>
                  </div>
                </div>
              </section>

              {/* Strategy Statement */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-pink-200 pb-2 mb-4">
                  2. Strategy Statement
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {s.statement_summary || "Not yet provided."}
                </p>
              </section>

              {/* Challenges */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-pink-200 pb-2 mb-4">
                  3. Challenges / Barriers to Learning
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {s.barriers_to_learning || "Not yet identified."}
                </p>
              </section>

              {/* Intended Outcomes */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-pink-200 pb-2 mb-4">
                  4. Intended Outcomes
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {s.desired_outcomes || "Not yet defined."}
                </p>
              </section>

              {/* Teaching (Tier 1) */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-200 pb-2 mb-4 flex items-center gap-2">
                  <div className="bg-blue-500 rounded p-1">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  5. Teaching (Tier 1)
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                  {s.strategy_aims_teaching || "Not yet defined."}
                </p>
                {interventionsByStrand.teaching.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Intervention
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            EEF Evidence
                          </th>
                          <th className="text-right p-2 text-xs font-medium text-gray-600">
                            Cost
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Lead
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {interventionsByStrand.teaching.map((interv) => (
                          <tr key={interv.id}>
                            <td className="p-2">
                              <div className="font-medium text-gray-900">
                                {interv.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {interv.description}
                              </div>
                            </td>
                            <td className="p-2">
                              <EvidenceBadge
                                months={interv.eef_months_progress}
                                strength={interv.eef_evidence_strength}
                              />
                            </td>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {formatCurrency(interv.budgeted_cost)}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {interv.staff_lead}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Targeted Academic Support (Tier 2) */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-amber-200 pb-2 mb-4 flex items-center gap-2">
                  <div className="bg-amber-500 rounded p-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  6. Targeted Academic Support (Tier 2)
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                  {s.strategy_aims_targeted || "Not yet defined."}
                </p>
                {interventionsByStrand.targeted.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-amber-50">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Intervention
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            EEF Evidence
                          </th>
                          <th className="text-right p-2 text-xs font-medium text-gray-600">
                            Cost
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Lead
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {interventionsByStrand.targeted.map((interv) => (
                          <tr key={interv.id}>
                            <td className="p-2">
                              <div className="font-medium text-gray-900">
                                {interv.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {interv.description}
                              </div>
                            </td>
                            <td className="p-2">
                              <EvidenceBadge
                                months={interv.eef_months_progress}
                                strength={interv.eef_evidence_strength}
                              />
                            </td>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {formatCurrency(interv.budgeted_cost)}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {interv.staff_lead}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Wider Strategies (Tier 3) */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-emerald-200 pb-2 mb-4 flex items-center gap-2">
                  <div className="bg-emerald-500 rounded p-1">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  7. Wider Strategies (Tier 3)
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                  {s.strategy_aims_wider || "Not yet defined."}
                </p>
                {interventionsByStrand.wider.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-emerald-50">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Intervention
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            EEF Evidence
                          </th>
                          <th className="text-right p-2 text-xs font-medium text-gray-600">
                            Cost
                          </th>
                          <th className="text-left p-2 text-xs font-medium text-gray-600">
                            Lead
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {interventionsByStrand.wider.map((interv) => (
                          <tr key={interv.id}>
                            <td className="p-2">
                              <div className="font-medium text-gray-900">
                                {interv.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {interv.description}
                              </div>
                            </td>
                            <td className="p-2">
                              <EvidenceBadge
                                months={interv.eef_months_progress}
                                strength={interv.eef_evidence_strength}
                              />
                            </td>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {formatCurrency(interv.budgeted_cost)}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {interv.staff_lead}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Review */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-pink-200 pb-2 mb-4">
                  8. Review of Strategy
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Review Date
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.review_date
                        ? new Date(s.review_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Strategy Period
                    </span>
                    <span className="font-semibold text-gray-900">
                      3-year strategy ({s.academic_year} to{" "}
                      {parseInt(s.academic_year.split("-")[0]) + 2}-
                      {parseInt(s.academic_year.split("-")[1]) + 2})
                    </span>
                  </div>
                </div>
              </section>

              {/* Signatories */}
              <section className="border-t-2 border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="border-b border-gray-300 pb-8 mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {s.headteacher_name || "Headteacher"}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">Headteacher</span>
                  </div>
                  <div>
                    <div className="border-b border-gray-300 pb-8 mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {s.governor_name || "PP Governor"}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Pupil Premium Governor / Trustee
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Add Intervention Modal */}
      <AddInterventionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddIntervention}
      />
    </div>
  );
}
