"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Users,
  FileText,
  ClipboardList,
  ArrowRight,
  ArrowRightCircle,
  Search,
  Filter,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  PoundSterling,
  Target,
  Activity,
  BookOpen,
  UserCheck,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  Layers,
  Sparkles,
  GraduationCap,
  Stethoscope,
  Brain,
  Ear,
  Accessibility,
  MessageSquare,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  CircleDot,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface SENPupil {
  id: string;
  pupil_record_id?: string | null;
  pupil_code: string;
  first_name: string;
  last_name: string;
  year_group: number;
  sen_status: "K" | "E" | "monitoring";
  primary_need: string;
  secondary_need: string | null;
  date_identified: string;
  ehcp_status: string | null;
  class_name: string | null;
  key_worker: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GraduatedApproachCycle {
  id: string;
  pupil_id: string;
  cycle_number: number;
  term: string;
  current_stage: "assess" | "plan" | "do" | "review";
  assess_date: string | null;
  assess_notes: string | null;
  plan_date: string | null;
  plan_notes: string | null;
  plan_targets: string | null;
  do_date: string | null;
  do_notes: string | null;
  review_date: string | null;
  review_notes: string | null;
  review_outcome: string | null;
  created_at: string;
  send_register?: {
    pupil_code: string;
    first_name: string;
    last_name: string;
    year_group: number;
    primary_need: string;
  };
}

interface Provision {
  id: string;
  pupil_id: string;
  provision_name: string;
  provision_type: string;
  area: string | null;
  frequency: string | null;
  duration_minutes: number | null;
  sessions_per_week: number | null;
  delivered_by: string | null;
  start_date: string;
  end_date: string | null;
  cost_per_week: number;
  funding_source: string;
  is_active: boolean;
  impact_notes: string | null;
  created_at: string;
  send_register?: {
    pupil_code: string;
    first_name: string;
    last_name: string;
    year_group: number;
    primary_need: string;
    sen_status: string;
  };
}

interface Referral {
  id: string;
  pupil_id: string;
  referral_type: string;
  referral_date: string;
  referred_by: string | null;
  referral_reason: string;
  status: string;
  expected_wait_weeks: number | null;
  agency_name: string | null;
  agency_contact: string | null;
  outcome: string | null;
  outcome_date: string | null;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  send_register?: {
    pupil_code: string;
    first_name: string;
    last_name: string;
    year_group: number;
    primary_need: string;
    sen_status: string;
  };
}

interface DashboardStats {
  register: {
    total: number;
    sen_k: number;
    ehcp: number;
    monitoring: number;
    by_need: Record<string, number>;
    by_year: Record<string, number>;
  };
  ehcp: {
    total: number;
    reviews_due_this_term: number;
    reviews_overdue: number;
    assessments_in_progress: number;
  };
  provisions: {
    total_active: number;
    total_weekly_cost: number;
    total_annual_cost: number;
    by_type: Record<string, number>;
    by_funding: Record<string, number>;
    pupils_without_provision: number;
  };
  referrals: {
    total_active: number;
    by_type: Record<string, number>;
    draft?: number;
    submitted?: number;
    waiting_list?: number;
    assessment?: number;
    report_received?: number;
    overdue: number;
  };
  graduated_approach: {
    total_active_cycles: number;
    by_stage: Record<string, number>;
    reviews_due_this_term: number;
    outcomes_this_year: Record<string, number>;
  };
  demo: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

const SEN_NEED_CODES: Record<string, { label: string; color: string }> = {
  SPLD: {
    label: "Specific Learning Difficulty",
    color: "bg-blue-100 text-blue-800",
  },
  MLD: {
    label: "Moderate Learning Difficulty",
    color: "bg-blue-100 text-blue-700",
  },
  SLD: {
    label: "Severe Learning Difficulty",
    color: "bg-indigo-100 text-indigo-800",
  },
  PMLD: {
    label: "Profound & Multiple LD",
    color: "bg-indigo-100 text-indigo-700",
  },
  SEMH: {
    label: "Social Emotional Mental Health",
    color: "bg-amber-100 text-amber-800",
  },
  SLCN: {
    label: "Speech Language Communication",
    color: "bg-teal-100 text-teal-800",
  },
  HI: { label: "Hearing Impairment", color: "bg-purple-100 text-purple-800" },
  VI: { label: "Visual Impairment", color: "bg-purple-100 text-purple-700" },
  MSI: {
    label: "Multi-Sensory Impairment",
    color: "bg-purple-100 text-purple-600",
  },
  PD: { label: "Physical Disability", color: "bg-rose-100 text-rose-800" },
  ASD: { label: "Autism Spectrum", color: "bg-emerald-100 text-emerald-800" },
  OTH: { label: "Other", color: "bg-gray-100 text-gray-700" },
  NSA: { label: "Not Yet Assessed", color: "bg-gray-100 text-gray-500" },
};

const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  assess: {
    label: "Assess",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: <Search size={16} />,
  },
  plan: {
    label: "Plan",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: <Target size={16} />,
  },
  do: {
    label: "Do",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: <Activity size={16} />,
  },
  review: {
    label: "Review",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    icon: <Eye size={16} />,
  },
};

const REFERRAL_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  submitted: {
    label: "Submitted",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  waiting_list: {
    label: "Waiting List",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  assessment: {
    label: "Assessment",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  report_received: {
    label: "Report Received",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
};

const REFERRAL_TYPES = [
  "EP",
  "SALT",
  "OT",
  "Physio",
  "CAMHS",
  "Paediatrician",
  "School Nurse",
  "Sensory",
  "Behaviour Support",
  "EHCP Assessment",
];

const PROVISION_TYPE_LABELS: Record<string, string> = {
  intervention: "Intervention",
  adult_support: "Adult Support",
  therapy_programme: "Therapy Programme",
  environmental: "Environmental",
  specialist_equipment: "Specialist Equipment",
  curriculum_modification: "Curriculum Modification",
};

const FUNDING_SOURCE_LABELS: Record<string, string> = {
  school_budget: "School Budget",
  ehcp_funding: "EHCP Funding",
  pupil_premium: "Pupil Premium",
  catch_up: "Catch-Up Funding",
  other: "Other",
};

const REVIEW_OUTCOME_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  targets_met: {
    label: "Targets Met",
    icon: <CheckCircle2 size={14} />,
    color: "text-emerald-600",
  },
  partial_progress: {
    label: "Partial Progress",
    icon: <TrendingUp size={14} />,
    color: "text-amber-600",
  },
  no_progress: {
    label: "No Progress",
    icon: <Minus size={14} />,
    color: "text-orange-600",
  },
  regression: {
    label: "Regression",
    icon: <TrendingDown size={14} />,
    color: "text-red-600",
  },
};

// ─── Helper Functions ────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function getPupilLabel(pupil: SENPupil): string {
  return `${pupil.first_name} ${pupil.last_name}`;
}

// ─── Data Fetching Hook ──────────────────────────────────────────────

function useSENDData() {
  const { organizationId } = useAuth();
  const orgId = organizationId || "";
  const swrOpts = { revalidateOnFocus: false };
  const {
    data: statsRes,
    error: statsErr,
    mutate: mutateStats,
  } = useSWR(
    orgId ? `/api/send/dashboard?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );
  const {
    data: registerRes,
    error: registerErr,
    mutate: mutateRegister,
  } = useSWR(
    orgId ? `/api/send/register?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );
  const {
    data: cyclesRes,
    error: cyclesErr,
    mutate: mutateCycles,
  } = useSWR(
    orgId ? `/api/send/graduated-approach?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );
  const {
    data: provisionsRes,
    error: provisionsErr,
    mutate: mutateProvisions,
  } = useSWR(
    orgId
      ? `/api/send/provision-map?active=true&organizationId=${orgId}`
      : null,
    fetcher,
    swrOpts,
  );
  const {
    data: referralsRes,
    error: referralsErr,
    mutate: mutateReferrals,
  } = useSWR(
    orgId ? `/api/send/referrals?organizationId=${orgId}` : null,
    fetcher,
    swrOpts,
  );

  const anyError =
    statsErr || registerErr || cyclesErr || provisionsErr || referralsErr;
  const loading = !statsRes && !statsErr;

  const stats: DashboardStats | null = statsRes ?? null;
  const register: SENPupil[] = registerRes?.data || [];
  const cycles: GraduatedApproachCycle[] = cyclesRes?.data || [];
  const provisions: Provision[] = provisionsRes?.data || [];
  const referrals: Referral[] = referralsRes?.data || [];
  const isDemo =
    statsRes?.demo ||
    registerRes?.demo ||
    cyclesRes?.demo ||
    provisionsRes?.demo ||
    referralsRes?.demo ||
    false;

  const refetch = useCallback(() => {
    mutateStats();
    mutateRegister();
    mutateCycles();
    mutateProvisions();
    mutateReferrals();
  }, [
    mutateStats,
    mutateRegister,
    mutateCycles,
    mutateProvisions,
    mutateReferrals,
  ]);

  return {
    stats,
    register,
    cycles,
    provisions,
    referrals,
    loading,
    error: anyError
      ? anyError instanceof Error
        ? anyError.message
        : "Failed to load SEND data. Please try again."
      : null,
    isDemo,
    refetch,
  };
}

// ─── Sub-Components ──────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "emerald",
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { label: string; direction: "up" | "down" | "neutral" };
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
    teal: "from-teal-500 to-teal-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-2.5 rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.emerald} text-white`}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.direction === "up" && (
            <TrendingUp size={12} className="text-emerald-500" />
          )}
          {trend.direction === "down" && (
            <TrendingDown size={12} className="text-red-500" />
          )}
          {trend.direction === "neutral" && (
            <Minus size={12} className="text-slate-400" />
          )}
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}

function SENStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    K: {
      label: "SEN Support (K)",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    E: {
      label: "EHCP (E)",
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    monitoring: {
      label: "Monitoring",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
  };
  const c = config[status] || config.monitoring;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function NeedBadge({ code }: { code: string }) {
  const info = SEN_NEED_CODES[code];
  if (!info) return <span className="text-xs text-slate-500">{code}</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.color}`}
    >
      {code}
    </span>
  );
}

function EHCPBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">-</span>;
  const config: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800",
    assessment: "bg-blue-100 text-blue-800",
    draft: "bg-purple-100 text-purple-800",
    finalised: "bg-emerald-100 text-emerald-800",
    ceased: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Pupil Detail Panel ──────────────────────────────────────────────

function PupilDetailPanel({
  pupil,
  cycles,
  provisions,
  referrals,
  onClose,
}: {
  pupil: SENPupil;
  cycles: GraduatedApproachCycle[];
  provisions: Provision[];
  referrals: Referral[];
  onClose: () => void;
}) {
  const pupilCycles = cycles.filter((c) => c.pupil_id === pupil.id);
  const pupilProvisions = provisions.filter((p) => p.pupil_id === pupil.id);
  const pupilReferrals = referrals.filter((r) => r.pupil_id === pupil.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {getPupilLabel(pupil)}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {pupil.pupil_code} | Year {pupil.year_group} |{" "}
              {pupil.class_name || "No class"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <SENStatusBadge status={pupil.sen_status} />
          <NeedBadge code={pupil.primary_need} />
          {pupil.secondary_need && <NeedBadge code={pupil.secondary_need} />}
          {pupil.ehcp_status && <EHCPBadge status={pupil.ehcp_status} />}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Profile
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400">Date Identified:</span>
              <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                {formatDate(pupil.date_identified)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Key Worker:</span>
              <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                {pupil.key_worker || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Primary Need:</span>
              <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                {SEN_NEED_CODES[pupil.primary_need]?.label ||
                  pupil.primary_need}
              </span>
            </div>
            {pupil.secondary_need && (
              <div>
                <span className="text-slate-400">Secondary Need:</span>
                <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                  {SEN_NEED_CODES[pupil.secondary_need]?.label ||
                    pupil.secondary_need}
                </span>
              </div>
            )}
          </div>
          {pupil.notes && (
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              {pupil.notes}
            </p>
          )}
        </div>

        {/* Graduated Approach History */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <RefreshCw size={14} />
            Graduated Approach ({pupilCycles.length} cycles)
          </h3>
          {pupilCycles.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No graduated approach cycles recorded
            </p>
          ) : (
            <div className="space-y-3">
              {pupilCycles
                .sort((a, b) => b.cycle_number - a.cycle_number)
                .map((cycle) => {
                  const stageConf = STAGE_CONFIG[cycle.current_stage];
                  return (
                    <div
                      key={cycle.id}
                      className={`rounded-xl border p-4 ${stageConf.bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Cycle {cycle.cycle_number}
                          </span>
                          <span className="text-xs text-slate-500">
                            {cycle.term}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-xs font-semibold ${stageConf.color}`}
                        >
                          {stageConf.icon}
                          {stageConf.label}
                        </div>
                      </div>

                      {/* Stage timeline */}
                      <div className="flex items-center gap-1 mb-3">
                        {(["assess", "plan", "do", "review"] as const).map(
                          (stage, idx) => {
                            const stageIdx = [
                              "assess",
                              "plan",
                              "do",
                              "review",
                            ].indexOf(cycle.current_stage);
                            const thisIdx = idx;
                            const isComplete =
                              thisIdx < stageIdx ||
                              (thisIdx === stageIdx &&
                                cycle.current_stage === "review" &&
                                cycle.review_outcome);
                            const isCurrent = thisIdx === stageIdx;
                            return (
                              <React.Fragment key={stage}>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isComplete
                                      ? "bg-emerald-500 text-white"
                                      : isCurrent
                                        ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900"
                                        : "bg-slate-200 text-slate-400 dark:bg-slate-700"
                                  }`}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 size={12} />
                                  ) : (
                                    thisIdx + 1
                                  )}
                                </div>
                                {idx < 3 && (
                                  <div
                                    className={`flex-1 h-0.5 ${isComplete ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          },
                        )}
                      </div>

                      {/* Notes for each completed stage */}
                      <div className="space-y-2 text-xs">
                        {cycle.assess_notes && (
                          <div>
                            <span className="font-semibold text-blue-700">
                              Assess:
                            </span>{" "}
                            <span className="text-slate-600 dark:text-slate-300">
                              {cycle.assess_notes}
                            </span>
                          </div>
                        )}
                        {cycle.plan_targets && (
                          <div>
                            <span className="font-semibold text-amber-700">
                              Targets:
                            </span>{" "}
                            <span className="text-slate-600 dark:text-slate-300">
                              {cycle.plan_targets}
                            </span>
                          </div>
                        )}
                        {cycle.do_notes && (
                          <div>
                            <span className="font-semibold text-emerald-700">
                              Do:
                            </span>{" "}
                            <span className="text-slate-600 dark:text-slate-300">
                              {cycle.do_notes}
                            </span>
                          </div>
                        )}
                        {cycle.review_notes && (
                          <div>
                            <span className="font-semibold text-purple-700">
                              Review:
                            </span>{" "}
                            <span className="text-slate-600 dark:text-slate-300">
                              {cycle.review_notes}
                            </span>
                          </div>
                        )}
                        {cycle.review_outcome && (
                          <div className="flex items-center gap-1 mt-1">
                            {REVIEW_OUTCOME_CONFIG[cycle.review_outcome] && (
                              <>
                                <span
                                  className={
                                    REVIEW_OUTCOME_CONFIG[cycle.review_outcome]
                                      .color
                                  }
                                >
                                  {
                                    REVIEW_OUTCOME_CONFIG[cycle.review_outcome]
                                      .icon
                                  }
                                </span>
                                <span
                                  className={`font-semibold ${REVIEW_OUTCOME_CONFIG[cycle.review_outcome].color}`}
                                >
                                  {
                                    REVIEW_OUTCOME_CONFIG[cycle.review_outcome]
                                      .label
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Provisions */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Layers size={14} />
            Active Provisions ({pupilProvisions.length})
          </h3>
          {pupilProvisions.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No active provisions
            </p>
          ) : (
            <div className="space-y-2">
              {pupilProvisions.map((prov) => (
                <div
                  key={prov.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {prov.provision_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {prov.frequency} | {prov.delivered_by || "TBC"}
                      </p>
                    </div>
                    {prov.cost_per_week > 0 && (
                      <span className="text-xs font-semibold text-slate-500">
                        {formatCurrency(prov.cost_per_week)}/wk
                      </span>
                    )}
                  </div>
                  {prov.impact_notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">
                      {prov.impact_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrals */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Send size={14} />
            Referrals ({pupilReferrals.length})
          </h3>
          {pupilReferrals.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No referrals on record
            </p>
          ) : (
            <div className="space-y-2">
              {pupilReferrals.map((ref) => {
                const statusConf =
                  REFERRAL_STATUS_CONFIG[ref.status] ||
                  REFERRAL_STATUS_CONFIG.draft;
                return (
                  <div
                    key={ref.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {ref.referral_type}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.bgColor} ${statusConf.color}`}
                        >
                          {statusConf.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDate(ref.referral_date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {ref.referral_reason}
                    </p>
                    {ref.outcome && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        Outcome: {ref.outcome}
                      </p>
                    )}
                    {ref.next_action && (
                      <p className="text-xs text-amber-600 mt-1">
                        Next: {ref.next_action}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add to Register Modal ───────────────────────────────────────────

function AddToRegisterModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    pupil_code: "",
    first_name: "",
    last_name: "",
    year_group: "",
    sen_status: "K",
    primary_need: "",
    secondary_need: "",
    class_name: "",
    key_worker: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/send/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year_group: form.year_group ? parseInt(form.year_group) : null,
          secondary_need: form.secondary_need || null,
          date_identified: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error("Failed to save pupil to register");
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Add Pupil to SEN Register
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">
                {saveError}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Pupil Code *
              </label>
              <input
                required
                value={form.pupil_code}
                onChange={(e) =>
                  setForm({ ...form, pupil_code: e.target.value })
                }
                placeholder="e.g. PUP-2026-001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Year Group
              </label>
              <select
                value={form.year_group}
                onChange={(e) =>
                  setForm({ ...form, year_group: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select...</option>
                {["R", "1", "2", "3", "4", "5", "6"].map((y) => (
                  <option key={y} value={y === "R" ? "0" : y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name
              </label>
              <input
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                SEN Status *
              </label>
              <select
                required
                value={form.sen_status}
                onChange={(e) =>
                  setForm({ ...form, sen_status: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="K">SEN Support (K)</option>
                <option value="E">EHCP (E)</option>
                <option value="monitoring">Monitoring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Primary Need *
              </label>
              <select
                required
                value={form.primary_need}
                onChange={(e) =>
                  setForm({ ...form, primary_need: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select need...</option>
                {Object.entries(SEN_NEED_CODES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} - {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Secondary Need
              </label>
              <select
                value={form.secondary_need}
                onChange={(e) =>
                  setForm({ ...form, secondary_need: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">None</option>
                {Object.entries(SEN_NEED_CODES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} - {info.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Class
              </label>
              <input
                value={form.class_name}
                onChange={(e) =>
                  setForm({ ...form, class_name: e.target.value })
                }
                placeholder="e.g. 3A"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Key Worker
            </label>
            <input
              value={form.key_worker}
              onChange={(e) => setForm({ ...form, key_worker: e.target.value })}
              placeholder="e.g. Mrs Thompson (SENCO)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Initial concerns, strategies already tried, parent views..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add to Register"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Section: SEN Register Table ─────────────────────────────────────

function RegisterSection({
  register,
  cycles,
  provisions,
  referrals,
  onDataChanged,
}: {
  register: SENPupil[];
  cycles: GraduatedApproachCycle[];
  provisions: Provision[];
  referrals: Referral[];
  onDataChanged: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterNeed, setFilterNeed] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [selectedPupil, setSelectedPupil] = useState<SENPupil | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return register.filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !p.pupil_code.toLowerCase().includes(s) &&
          !p.first_name.toLowerCase().includes(s) &&
          !p.last_name.toLowerCase().includes(s) &&
          !p.primary_need.toLowerCase().includes(s) &&
          !(p.key_worker || "").toLowerCase().includes(s)
        )
          return false;
      }
      if (filterStatus && p.sen_status !== filterStatus) return false;
      if (filterNeed && p.primary_need !== filterNeed) return false;
      if (filterYear && p.year_group !== parseInt(filterYear)) return false;
      return true;
    });
  }, [register, search, filterStatus, filterNeed, filterYear]);

  const uniqueNeeds = useMemo(() => {
    return [...new Set(register.map((p) => p.primary_need))].sort();
  }, [register]);

  const uniqueYears = useMemo(() => {
    return [...new Set(register.map((p) => p.year_group))].sort(
      (a, b) => a - b,
    );
  }, [register]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            SEN Register
            <span className="text-sm font-medium text-slate-400 ml-2">
              ({filtered.length} pupils)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showFilters
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Filter size={14} />
              Filters
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add Pupil
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, need, or key worker..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="">All Statuses</option>
                  <option value="K">SEN Support (K)</option>
                  <option value="E">EHCP (E)</option>
                  <option value="monitoring">Monitoring</option>
                </select>
                <select
                  value={filterNeed}
                  onChange={(e) => setFilterNeed(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="">All Needs</option>
                  {uniqueNeeds.map((need) => (
                    <option key={need} value={need}>
                      {need} - {SEN_NEED_CODES[need]?.label || need}
                    </option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y.toString()}>
                      Year {y}
                    </option>
                  ))}
                </select>
                {(filterStatus || filterNeed || filterYear) && (
                  <button
                    onClick={() => {
                      setFilterStatus("");
                      setFilterNeed("");
                      setFilterYear("");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Pupil
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Year
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Primary Need
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Secondary
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Identified
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                EHCP
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Key Worker
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pupil) => (
              <tr
                key={pupil.id}
                onClick={() => setSelectedPupil(pupil)}
                className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {getPupilLabel(pupil)}
                    </p>
                    <p className="text-xs text-slate-400">{pupil.pupil_code}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  Y{pupil.year_group}
                </td>
                <td className="px-4 py-3">
                  <SENStatusBadge status={pupil.sen_status} />
                </td>
                <td className="px-4 py-3">
                  <NeedBadge code={pupil.primary_need} />
                </td>
                <td className="px-4 py-3">
                  {pupil.secondary_need ? (
                    <NeedBadge code={pupil.secondary_need} />
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {formatDate(pupil.date_identified)}
                </td>
                <td className="px-4 py-3">
                  <EHCPBadge status={pupil.ehcp_status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {pupil.key_worker || "-"}
                </td>
                <td className="px-4 py-3">
                  {pupil.pupil_record_id ? (
                    <Link
                      href={`/dashboard/pupils/${pupil.pupil_record_id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      Profile
                      <ExternalLink size={13} />
                    </Link>
                  ) : (
                    <ChevronRight size={16} className="text-slate-300" />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No pupils found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedPupil && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSelectedPupil(null)}
            />
            <PupilDetailPanel
              pupil={selectedPupil}
              cycles={cycles}
              provisions={provisions}
              referrals={referrals}
              onClose={() => setSelectedPupil(null)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      {showAddModal && (
        <AddToRegisterModal
          onClose={() => setShowAddModal(false)}
          onSave={onDataChanged}
        />
      )}
    </div>
  );
}

// ─── Section: Graduated Approach Tracker ─────────────────────────────

function GraduatedApproachSection({
  cycles,
  register,
  onDataChanged,
}: {
  cycles: GraduatedApproachCycle[];
  register: SENPupil[];
  onDataChanged: () => void;
}) {
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const STAGE_ORDER: Array<"assess" | "plan" | "do" | "review"> = [
    "assess",
    "plan",
    "do",
    "review",
  ];

  const handleAdvanceStage = async (cycle: GraduatedApproachCycle) => {
    const currentIdx = STAGE_ORDER.indexOf(cycle.current_stage);
    if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) return;
    const nextStage = STAGE_ORDER[currentIdx + 1];

    setAdvancingId(cycle.id);
    try {
      const res = await fetch(`/api/send/graduated-approach/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_stage: nextStage,
          [`${nextStage}_date`]: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error("Failed to advance stage");
      onDataChanged();
    } catch (err) {
      console.error("Failed to advance stage:", err);
      alert("Could not advance stage. Please try again.");
    } finally {
      setAdvancingId(null);
    }
  };

  const getPupilForCycle = (cycle: GraduatedApproachCycle) => {
    if (cycle.send_register) return cycle.send_register;
    const pupil = register.find((p) => p.id === cycle.pupil_id);
    return pupil
      ? {
          pupil_code: pupil.pupil_code,
          first_name: pupil.first_name,
          last_name: pupil.last_name,
          year_group: pupil.year_group,
          primary_need: pupil.primary_need,
        }
      : null;
  };

  // Exclude fully completed reviews (those with an outcome set)
  const activeCycles = cycles.filter(
    (c) => !(c.current_stage === "review" && c.review_outcome),
  );

  const byStage = {
    assess: activeCycles.filter((c) => c.current_stage === "assess"),
    plan: activeCycles.filter((c) => c.current_stage === "plan"),
    do: activeCycles.filter((c) => c.current_stage === "do"),
    review: activeCycles.filter((c) => c.current_stage === "review"),
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <RefreshCw size={20} className="text-emerald-600" />
          Graduated Approach Tracker
          <span className="text-sm font-medium text-slate-400 ml-2">
            ({activeCycles.length} active cycles)
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Assess, Plan, Do, Review cycles for SEN pupils. Click cards to advance
          stages.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-0 divide-x divide-slate-200 dark:divide-slate-700">
        {(["assess", "plan", "do", "review"] as const).map((stage) => {
          const stageConf = STAGE_CONFIG[stage];
          const stageCycles = byStage[stage];
          return (
            <div key={stage} className="min-h-[300px]">
              {/* Column header */}
              <div className={`px-3 py-2 border-b ${stageConf.bgColor}`}>
                <div
                  className={`flex items-center gap-1.5 ${stageConf.color} font-bold text-sm`}
                >
                  {stageConf.icon}
                  {stageConf.label}
                  <span className="ml-auto bg-white dark:bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600">
                    {stageCycles.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2">
                {stageCycles.map((cycle) => {
                  const pupilInfo = getPupilForCycle(cycle);
                  return (
                    <motion.div
                      key={cycle.id}
                      layout
                      className={`rounded-lg border p-2.5 ${stageConf.bgColor} hover:shadow-sm transition-shadow cursor-pointer group`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {pupilInfo
                              ? `${pupilInfo.first_name} ${pupilInfo.last_name}`
                              : cycle.pupil_id}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {pupilInfo ? `Y${pupilInfo.year_group}` : ""} |
                            Cycle {cycle.cycle_number} | {cycle.term}
                          </p>
                        </div>
                        {pupilInfo && (
                          <NeedBadge code={pupilInfo.primary_need} />
                        )}
                      </div>

                      {/* Show relevant notes for current stage */}
                      {stage === "assess" && cycle.assess_notes && (
                        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                          {cycle.assess_notes}
                        </p>
                      )}
                      {stage === "plan" && cycle.plan_targets && (
                        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                          {cycle.plan_targets}
                        </p>
                      )}
                      {stage === "do" && cycle.do_notes && (
                        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                          {cycle.do_notes}
                        </p>
                      )}
                      {stage === "review" && cycle.review_notes && (
                        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                          {cycle.review_notes}
                        </p>
                      )}

                      {/* Advance button */}
                      {stage !== "review" && (
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStage(cycle);
                            }}
                            disabled={advancingId === cycle.id}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {advancingId === cycle.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <ArrowRightCircle size={12} />
                            )}
                            Advance to{" "}
                            {
                              STAGE_CONFIG[
                                ["assess", "plan", "do", "review"][
                                  ["assess", "plan", "do", "review"].indexOf(
                                    stage,
                                  ) + 1
                                ]
                              ]?.label
                            }
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {stageCycles.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-300">
                    No cycles at this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Outcomes */}
      {cycles.filter((c) => c.review_outcome).length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Recent Review Outcomes
          </h3>
          <div className="flex flex-wrap gap-2">
            {cycles
              .filter((c) => c.review_outcome)
              .sort(
                (a, b) =>
                  new Date(b.review_date || "").getTime() -
                  new Date(a.review_date || "").getTime(),
              )
              .slice(0, 6)
              .map((cycle) => {
                const pupilInfo = getPupilForCycle(cycle);
                const outcomeConf =
                  REVIEW_OUTCOME_CONFIG[cycle.review_outcome || ""];
                return (
                  <div
                    key={cycle.id}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {pupilInfo
                        ? `${pupilInfo.first_name} ${pupilInfo.last_name}`
                        : "Pupil"}
                    </span>
                    <span className="text-slate-400">
                      Cycle {cycle.cycle_number}
                    </span>
                    {outcomeConf && (
                      <span
                        className={`flex items-center gap-1 font-semibold ${outcomeConf.color}`}
                      >
                        {outcomeConf.icon}
                        {outcomeConf.label}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Provision Map ──────────────────────────────────────────

function ProvisionMapSection({
  provisions,
  register,
  stats,
}: {
  provisions: Provision[];
  register: SENPupil[];
  stats: DashboardStats | null;
}) {
  const [filterType, setFilterType] = useState<string>("");
  const [filterFunding, setFilterFunding] = useState<string>("");

  const filtered = useMemo(() => {
    return provisions.filter((p) => {
      if (filterType && p.provision_type !== filterType) return false;
      if (filterFunding && p.funding_source !== filterFunding) return false;
      return true;
    });
  }, [provisions, filterType, filterFunding]);

  const totalWeekly = filtered.reduce(
    (sum, p) => sum + (p.cost_per_week || 0),
    0,
  );
  const totalAnnual = totalWeekly * 39;

  // Group by type for summary
  const byType = useMemo(() => {
    const grouped: Record<string, { count: number; cost: number }> = {};
    provisions.forEach((p) => {
      if (!grouped[p.provision_type])
        grouped[p.provision_type] = { count: 0, cost: 0 };
      grouped[p.provision_type].count++;
      grouped[p.provision_type].cost += p.cost_per_week || 0;
    });
    return grouped;
  }, [provisions]);

  // Funding breakdown
  const byFunding = useMemo(() => {
    const grouped: Record<string, { count: number; cost: number }> = {};
    provisions.forEach((p) => {
      const src = p.funding_source || "school_budget";
      if (!grouped[src]) grouped[src] = { count: 0, cost: 0 };
      grouped[src].count++;
      grouped[src].cost += p.cost_per_week || 0;
    });
    return grouped;
  }, [provisions]);

  // Gap analysis
  const pupilsWithProvisions = new Set(provisions.map((p) => p.pupil_id));
  const pupilsWithoutProvision = register.filter(
    (r) => r.sen_status !== "monitoring" && !pupilsWithProvisions.has(r.id),
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={20} className="text-emerald-600" />
            Provision Map
            <span className="text-sm font-medium text-slate-400 ml-2">
              ({provisions.length} active)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Types</option>
              {Object.entries(PROVISION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filterFunding}
              onChange={(e) => setFilterFunding(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Funding</option>
              {Object.entries(FUNDING_SOURCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <p className="text-xs font-medium text-emerald-600">Weekly Cost</p>
            <p className="text-lg font-black text-emerald-700">
              {formatCurrency(totalWeekly)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <p className="text-xs font-medium text-blue-600">
              Annual Cost (39 wks)
            </p>
            <p className="text-lg font-black text-blue-700">
              {formatCurrency(totalAnnual)}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-xs font-medium text-amber-600">
              Provision Types
            </p>
            <p className="text-lg font-black text-amber-700">
              {Object.keys(byType).length}
            </p>
          </div>
          <div
            className={`rounded-lg p-3 text-center ${pupilsWithoutProvision.length > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}
          >
            <p
              className={`text-xs font-medium ${pupilsWithoutProvision.length > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              Gaps
            </p>
            <p
              className={`text-lg font-black ${pupilsWithoutProvision.length > 0 ? "text-red-700" : "text-emerald-700"}`}
            >
              {pupilsWithoutProvision.length}{" "}
              {pupilsWithoutProvision.length === 1 ? "pupil" : "pupils"}
            </p>
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          By Type
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(byType).map(([type, data]) => (
            <div
              key={type}
              className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {PROVISION_TYPE_LABELS[type] || type}
              </span>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {data.count}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({formatCurrency(data.cost)}/wk)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funding breakdown */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          By Funding Source
        </h3>
        <div className="space-y-2">
          {Object.entries(byFunding).map(([source, data]) => {
            const totalCost = provisions.reduce(
              (s, p) => s + (p.cost_per_week || 0),
              0,
            );
            const pct = totalCost > 0 ? (data.cost / totalCost) * 100 : 0;
            return (
              <div key={source}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {FUNDING_SOURCE_LABELS[source] || source}
                  </span>
                  <span className="text-slate-500">
                    {data.count} provisions | {formatCurrency(data.cost)}/wk (
                    {Math.round(pct)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      source === "ehcp_funding"
                        ? "bg-purple-500"
                        : source === "pupil_premium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provision table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Provision
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pupil
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Frequency
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cost/wk
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Funding
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Delivered By
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prov) => {
              const pupilInfo =
                prov.send_register ||
                register.find((r) => r.id === prov.pupil_id);
              return (
                <tr
                  key={prov.id}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                      {prov.provision_name}
                    </p>
                    {prov.impact_notes && (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {prov.impact_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300">
                    {pupilInfo
                      ? `${(pupilInfo as any).first_name || ""} ${(pupilInfo as any).last_name || ""}`.trim()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {PROVISION_TYPE_LABELS[prov.provision_type] ||
                      prov.provision_type}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {prov.frequency || "-"}
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {prov.cost_per_week > 0
                      ? formatCurrency(prov.cost_per_week)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {FUNDING_SOURCE_LABELS[prov.funding_source] ||
                      prov.funding_source}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {prov.delivered_by || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Gap Analysis */}
      {pupilsWithoutProvision.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} />
            Gap Analysis: {pupilsWithoutProvision.length} SEN pupil
            {pupilsWithoutProvision.length !== 1 ? "s" : ""} without active
            provision
          </h3>
          <div className="flex flex-wrap gap-2">
            {pupilsWithoutProvision.map((pupil) => (
              <span
                key={pupil.id}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1 text-xs border border-red-200 dark:border-red-800"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {getPupilLabel(pupil)}
                </span>
                <NeedBadge code={pupil.primary_need} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Referral Pipeline ──────────────────────────────────────

function ReferralPipelineSection({
  referrals,
  register,
}: {
  referrals: Referral[];
  register: SENPupil[];
}) {
  const stages = [
    "draft",
    "submitted",
    "waiting_list",
    "assessment",
    "report_received",
  ] as const;

  const byStage = useMemo(() => {
    const grouped: Record<string, Referral[]> = {};
    stages.forEach((s) => {
      grouped[s] = [];
    });
    referrals.forEach((r) => {
      if (grouped[r.status]) grouped[r.status].push(r);
    });
    return grouped;
  }, [referrals]);

  const getPupilForReferral = (ref: Referral) => {
    if (ref.send_register) return ref.send_register;
    return register.find((p) => p.id === ref.pupil_id);
  };

  const isOverdue = (ref: Referral) => {
    if (!ref.expected_wait_weeks || ref.status === "report_received")
      return false;
    const refDate = new Date(ref.referral_date);
    const expectedDate = new Date(
      refDate.getTime() + ref.expected_wait_weeks * 7 * 24 * 60 * 60 * 1000,
    );
    return new Date() > expectedDate;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Send size={20} className="text-emerald-600" />
          Referral Pipeline
          <span className="text-sm font-medium text-slate-400 ml-2">
            ({referrals.length} referrals)
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Track external agency referrals from draft through to report received.
        </p>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-5 gap-0 divide-x divide-slate-200 dark:divide-slate-700">
        {stages.map((stage) => {
          const statusConf = REFERRAL_STATUS_CONFIG[stage];
          const stageRefs = byStage[stage] || [];
          return (
            <div key={stage} className="min-h-[250px]">
              <div className={`px-3 py-2 border-b ${statusConf.bgColor}`}>
                <div
                  className={`flex items-center justify-between ${statusConf.color} font-bold text-xs`}
                >
                  {statusConf.label}
                  <span className="bg-white dark:bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600">
                    {stageRefs.length}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2">
                {stageRefs.map((ref) => {
                  const pupilInfo = getPupilForReferral(ref);
                  const overdue = isOverdue(ref);
                  return (
                    <div
                      key={ref.id}
                      className={`rounded-lg border p-2.5 bg-white dark:bg-slate-800 ${
                        overdue
                          ? "border-red-300 dark:border-red-700"
                          : "border-slate-200 dark:border-slate-700"
                      } hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {ref.referral_type}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {pupilInfo
                              ? `${(pupilInfo as any).first_name || ""} ${(pupilInfo as any).last_name || ""}`.trim()
                              : "Pupil"}{" "}
                            | Y{(pupilInfo as any)?.year_group || "?"}
                          </p>
                        </div>
                        {overdue && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
                            <AlertCircle size={10} />
                            Overdue
                          </span>
                        )}
                      </div>

                      {ref.agency_name && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {ref.agency_name}
                        </p>
                      )}

                      {ref.expected_wait_weeks &&
                        stage !== "report_received" && (
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={9} />~{ref.expected_wait_weeks} week
                            wait
                          </p>
                        )}

                      {ref.outcome && (
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium line-clamp-2">
                          {ref.outcome}
                        </p>
                      )}

                      {ref.next_action && stage !== "report_received" && (
                        <p className="text-[10px] text-amber-600 mt-1 line-clamp-1">
                          Next: {ref.next_action}
                        </p>
                      )}

                      <p className="text-[10px] text-slate-300 mt-1">
                        {formatDate(ref.referral_date)}
                      </p>
                    </div>
                  );
                })}
                {stageRefs.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-300">
                    None
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Referral type summary */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Active Referrals by Type
        </h3>
        <div className="flex flex-wrap gap-2">
          {REFERRAL_TYPES.map((type) => {
            const count = referrals.filter(
              (r) => r.referral_type === type,
            ).length;
            if (count === 0) return null;
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700"
              >
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {type}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Needs Analysis Chart ───────────────────────────────────

function NeedsAnalysisSection({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(...Object.values(stats.register.by_need), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
        <BarChart3 size={14} />
        Needs Profile
      </h3>
      <div className="space-y-2">
        {Object.entries(stats.register.by_need)
          .sort(([, a], [, b]) => b - a)
          .map(([need, count]) => {
            const pct = (count / maxCount) * 100;
            const info = SEN_NEED_CODES[need];
            return (
              <div key={need} className="flex items-center gap-3">
                <div className="w-12 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {need}
                </div>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {info?.label || need}
                  </span>
                </div>
                <div className="w-6 text-xs font-bold text-slate-700 dark:text-slate-200 text-right">
                  {count}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Section: Year Group Distribution ────────────────────────────────

function YearGroupSection({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(...Object.values(stats.register.by_year), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
        <GraduationCap size={14} />
        By Year Group
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {["R", "1", "2", "3", "4", "5", "6"].map((year) => {
          const key = year === "R" ? "0" : year;
          const count = stats.register.by_year[key] || 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={year} className="text-center">
              <div className="h-24 flex items-end justify-center mb-1">
                <div
                  className="w-full max-w-[36px] bg-emerald-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(pct, 5)}%` }}
                />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Y{year}
              </p>
              <p className="text-xs text-slate-400">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function SENDPage() {
  const {
    stats,
    register,
    cycles,
    provisions,
    referrals,
    loading,
    error,
    isDemo,
    refetch,
  } = useSENDData();
  const [activeTab, setActiveTab] = useState<
    "overview" | "register" | "graduated" | "provisions" | "referrals"
  >("overview");

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading SEND data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Demo Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className="p-1.5 bg-amber-100 dark:bg-amber-800 rounded-lg">
            <Info size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Demo Mode
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Showing sample data with 15 SEN pupils, 20 provisions, 11
              graduated approach cycles, and 8 referrals. Connect your school
              data to see real information.
            </p>
          </div>
          <Sparkles size={20} className="text-amber-400" />
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className="p-1.5 bg-red-100 dark:bg-red-800 rounded-lg">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              Failed to Load Data
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-900/20 w-fit px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800 mb-3">
            <Heart size={16} />
            Inclusive Education
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            SEND Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            SEN register, graduated approach, provision mapping, and referral
            tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="/dashboard/send/copilot"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Sparkles size={14} />
            Open SEND & Inclusion Copilot
            <ArrowRight size={14} />
          </a>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {[
          { id: "overview", label: "Overview", icon: <BarChart3 size={14} /> },
          { id: "register", label: "SEN Register", icon: <Users size={14} /> },
          {
            id: "graduated",
            label: "Graduated Approach",
            icon: <RefreshCw size={14} />,
          },
          {
            id: "provisions",
            label: "Provision Map",
            icon: <Layers size={14} />,
          },
          { id: "referrals", label: "Referrals", icon: <Send size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total SEN Pupils"
              value={stats.register.total}
              subtitle={`${stats.register.sen_k} SEN K | ${stats.register.ehcp} EHCP | ${stats.register.monitoring} Monitoring`}
              icon={<Users size={20} />}
              color="emerald"
            />
            <StatCard
              title="EHCPs"
              value={stats.ehcp.total}
              subtitle={`${stats.ehcp.reviews_due_this_term} reviews due this term`}
              icon={<FileText size={20} />}
              color="purple"
              trend={
                stats.ehcp.assessments_in_progress > 0
                  ? {
                      label: `${stats.ehcp.assessments_in_progress} assessment${stats.ehcp.assessments_in_progress !== 1 ? "s" : ""} in progress`,
                      direction: "up",
                    }
                  : undefined
              }
            />
            <StatCard
              title="Active Provisions"
              value={stats.provisions.total_active}
              subtitle={`${formatCurrency(stats.provisions.total_weekly_cost)}/week`}
              icon={<Layers size={20} />}
              color="blue"
              trend={
                stats.provisions.pupils_without_provision > 0
                  ? {
                      label: `${stats.provisions.pupils_without_provision} pupil${stats.provisions.pupils_without_provision !== 1 ? "s" : ""} without provision`,
                      direction: "down",
                    }
                  : undefined
              }
            />
            <StatCard
              title="Active Referrals"
              value={stats.referrals.total_active}
              subtitle={`${stats.referrals.waiting_list || 0} on waiting lists`}
              icon={<Send size={20} />}
              color="amber"
              trend={
                stats.referrals.overdue > 0
                  ? {
                      label: `${stats.referrals.overdue} overdue`,
                      direction: "down",
                    }
                  : undefined
              }
            />
            <StatCard
              title="GA Cycles Active"
              value={stats.graduated_approach.total_active_cycles}
              subtitle={`${stats.graduated_approach.reviews_due_this_term} reviews due`}
              icon={<RefreshCw size={20} />}
              color="teal"
            />
          </div>

          {/* EHCP review alert */}
          {stats.ehcp.reviews_due_this_term > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center gap-3"
            >
              <Calendar size={20} className="text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  {stats.ehcp.reviews_due_this_term} EHCP Annual Review
                  {stats.ehcp.reviews_due_this_term !== 1 ? "s" : ""} Due This
                  Term
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Annual reviews must be completed within 12 months of the EHCP
                  being issued or the previous review.
                </p>
              </div>
            </motion.div>
          )}

          {/* GA Outcomes this year */}
          {Object.keys(stats.graduated_approach.outcomes_this_year).length >
            0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
                Graduated Approach Outcomes This Year
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(REVIEW_OUTCOME_CONFIG).map(([key, conf]) => {
                  const count =
                    stats.graduated_approach.outcomes_this_year[key] || 0;
                  return (
                    <div
                      key={key}
                      className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"
                    >
                      <div
                        className={`flex items-center justify-center gap-1.5 ${conf.color} mb-1`}
                      >
                        {conf.icon}
                        <span className="text-xs font-semibold">
                          {conf.label}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NeedsAnalysisSection stats={stats} />
            <YearGroupSection stats={stats} />
          </div>

          {/* Quick links to other tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tab: "register" as const,
                label: "SEN Register",
                desc: `${stats.register.total} pupils`,
                icon: <Users size={20} />,
                color: "emerald",
              },
              {
                tab: "graduated" as const,
                label: "Graduated Approach",
                desc: `${stats.graduated_approach.total_active_cycles} active cycles`,
                icon: <RefreshCw size={20} />,
                color: "blue",
              },
              {
                tab: "provisions" as const,
                label: "Provision Map",
                desc: `${formatCurrency(stats.provisions.total_annual_cost)}/year`,
                icon: <Layers size={20} />,
                color: "purple",
              },
              {
                tab: "referrals" as const,
                label: "Referral Pipeline",
                desc: `${stats.referrals.total_active} active`,
                icon: <Send size={20} />,
                color: "amber",
              },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-emerald-600">{item.icon}</div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Register Tab */}
      {activeTab === "register" && (
        <RegisterSection
          register={register}
          cycles={cycles}
          provisions={provisions}
          referrals={referrals}
          onDataChanged={refetch}
        />
      )}

      {/* Graduated Approach Tab */}
      {activeTab === "graduated" && (
        <GraduatedApproachSection
          cycles={cycles}
          register={register}
          onDataChanged={refetch}
        />
      )}

      {/* Provisions Tab */}
      {activeTab === "provisions" && (
        <ProvisionMapSection
          provisions={provisions}
          register={register}
          stats={stats}
        />
      )}

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <ReferralPipelineSection referrals={referrals} register={register} />
      )}
    </div>
  );
}
