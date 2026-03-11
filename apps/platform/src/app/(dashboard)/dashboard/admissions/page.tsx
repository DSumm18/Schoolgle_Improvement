"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
  ListOrdered,
  Gavel,
  FileText,
  BarChart3,
  UserCheck,
  UserX,
  UserPlus,
  Mail,
  Phone,
  Home,
  Baby,
  Heart,
  Shield,
  Star,
  Hash,
  Eye,
  MoreHorizontal,
  Info,
  RefreshCw,
  TrendingUp,
  CircleDot,
  Inbox,
  ClipboardCheck,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface AdmissionRound {
  id: string;
  academic_year: string;
  entry_year_group: string;
  pan: number;
  application_deadline: string | null;
  offer_date: string | null;
  acceptance_deadline: string | null;
  status: string;
  oversubscription_criteria: any;
  notes: string | null;
  created_at: string;
}

interface Application {
  id: string;
  round_id: string;
  child_name: string;
  child_dob: string;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  address: string | null;
  postcode: string | null;
  preference_rank: number;
  distance_miles: number | null;
  oversubscription_criterion: string | null;
  sibling_at_school: boolean;
  looked_after_child: boolean;
  ehcp_naming_school: boolean;
  faith_evidence: string | null;
  status: string;
  waiting_list_position: number | null;
  appeal_submitted: boolean;
  appeal_date: string | null;
  appeal_outcome: string | null;
  appeal_notes: string | null;
  offer_date: string | null;
  acceptance_date: string | null;
  decline_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DashboardStats {
  total_applications: number;
  received: number;
  verified: number;
  offered: number;
  accepted: number;
  declined: number;
  waiting_list: number;
  withdrawn: number;
  appeals_pending: number;
  appeals_upheld: number;
  appeals_dismissed: number;
  places_available: number;
  pan: number;
}

interface CriteriaBreakdown {
  criterion: string;
  count: number;
}

interface DashboardData {
  rounds: AdmissionRound[];
  activeRound: AdmissionRound | null;
  stats: DashboardStats;
  criteriaBreakdown: CriteriaBreakdown[];
  waitingList: Application[];
  appeals: Application[];
  recentActivity: Application[];
}

// ─── Demo Data ──────────────────────────────────────────────────────────

const DEMO_ROUND: AdmissionRound = {
  id: "demo-round-1",
  academic_year: "2026-27",
  entry_year_group: "Reception",
  pan: 30,
  application_deadline: "2026-01-15",
  offer_date: "2026-04-16",
  acceptance_deadline: "2026-05-01",
  status: "open",
  oversubscription_criteria: [
    {
      priority: 1,
      tag: "lac",
      label: "Looked After Children (LAC) & Previously LAC",
      description:
        "Children in public care or previously looked after who ceased to be so because they were adopted or became subject to a child arrangements order or special guardianship order.",
    },
    {
      priority: 2,
      tag: "ehcp",
      label: "Children with EHCP Naming the School",
      description:
        "Children with an Education, Health and Care Plan that names this school. These children MUST be admitted.",
    },
    {
      priority: 3,
      tag: "sibling",
      label: "Siblings of Current Pupils",
      description:
        "Children who have a sibling currently attending the school and who will still be on roll at the time of admission.",
    },
    {
      priority: 4,
      tag: "staff_child",
      label: "Children of Staff Members",
      description:
        "Children of staff employed at the school for two or more years at the time of application, or recently recruited to fill a demonstrable skills shortage.",
    },
    {
      priority: 5,
      tag: "faith",
      label: "Faith Commitment (Church Schools Only)",
      description:
        "Children whose parents/carers are regular worshippers at a partner church. Evidence from a clergy member required.",
    },
    {
      priority: 6,
      tag: "distance",
      label: "Distance from School",
      description:
        "Remaining places allocated by straight-line distance from the child's home address to the school, nearest first.",
    },
  ],
  notes: "Reception intake for September 2026. PAN confirmed by LA.",
  created_at: "2025-10-01T00:00:00Z",
};

function generateDemoApplications(): Application[] {
  const firstNames = [
    "Olivia",
    "Amelia",
    "Isla",
    "Ava",
    "Mia",
    "Isabella",
    "Sophia",
    "Grace",
    "Lily",
    "Freya",
    "Noah",
    "Oliver",
    "George",
    "Arthur",
    "Muhammad",
    "Leo",
    "Harry",
    "Oscar",
    "Jack",
    "Charlie",
    "Florence",
    "Rosie",
    "Willow",
    "Ivy",
    "Elsie",
    "Poppy",
    "Sienna",
    "Evie",
    "Harper",
    "Aria",
    "Henry",
    "Theo",
    "Alfie",
    "Jacob",
    "Thomas",
    "Freddie",
    "Teddy",
    "Archie",
    "Elijah",
    "Lucas",
    "Matilda",
    "Ada",
  ];
  const lastNames = [
    "Smith",
    "Jones",
    "Williams",
    "Taylor",
    "Brown",
    "Wilson",
    "Davies",
    "Evans",
    "Thomas",
    "Johnson",
    "Roberts",
    "Walker",
    "Wright",
    "Robinson",
    "Thompson",
    "White",
    "Hughes",
    "Edwards",
    "Green",
    "Hall",
    "Lewis",
    "Harris",
    "Clarke",
    "Patel",
    "Jackson",
    "Wood",
    "Turner",
    "Martin",
    "Cooper",
    "Hill",
    "Ward",
    "Morris",
    "Moore",
    "Clark",
    "Lee",
    "King",
    "Baker",
    "Harrison",
    "Morgan",
    "Allen",
    "James",
    "Scott",
  ];

  const criteria: {
    tag: string;
    count: number;
    statuses: string[];
  }[] = [
    // 1 LAC child - already accepted
    {
      tag: "lac",
      count: 1,
      statuses: ["accepted"],
    },
    // 2 EHCP - must be admitted
    {
      tag: "ehcp",
      count: 2,
      statuses: ["accepted", "accepted"],
    },
    // 8 siblings
    {
      tag: "sibling",
      count: 8,
      statuses: [
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "offered",
        "offered",
        "declined",
      ],
    },
    // 2 staff children
    {
      tag: "staff_child",
      count: 2,
      statuses: ["accepted", "accepted"],
    },
    // 4 faith
    {
      tag: "faith",
      count: 4,
      statuses: ["accepted", "offered", "offered", "declined"],
    },
    // 25 distance-based (fills remaining, some on waiting list/appealing)
    {
      tag: "distance",
      count: 25,
      statuses: [
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "accepted",
        "offered",
        "offered",
        "offered",
        "declined",
        "declined",
        "waiting_list",
        "waiting_list",
        "waiting_list",
        "waiting_list",
        "waiting_list",
        "verified",
        "verified",
        "received",
        "received",
      ],
    },
  ];

  const apps: Application[] = [];
  let idx = 0;

  for (const group of criteria) {
    for (let i = 0; i < group.count; i++) {
      const fn = firstNames[idx % firstNames.length];
      const ln = lastNames[idx % lastNames.length];
      const status = group.statuses[i];
      // DOBs in range Sept 2021 - Aug 2022 for Reception 2026
      const month = 9 + (idx % 12);
      const adjustedMonth = month > 12 ? month - 12 : month;
      const year = month > 12 ? 2022 : 2021;
      const day = 1 + (idx % 28);
      const dob = `${year}-${String(adjustedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const distanceBase =
        group.tag === "distance" ? 0.2 + i * 0.15 : 0.1 + Math.random() * 2;
      const distance = Math.round(distanceBase * 100) / 100;

      const isAppeal = status === "waiting_list" && (i === 0 || i === 1);
      const appealOutcome = i === 0 ? null : "dismissed";

      const waitingPos =
        status === "waiting_list"
          ? apps.filter((a) => a.status === "waiting_list").length + 1
          : null;

      apps.push({
        id: `demo-app-${idx + 1}`,
        round_id: "demo-round-1",
        child_name: `${fn} ${ln}`,
        child_dob: dob,
        parent_name: `${Math.random() > 0.5 ? "Mrs" : "Mr"} ${ln}`,
        parent_email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
        parent_phone: `07${String(700000000 + idx * 1111).slice(0, 9)}`,
        address: `${idx + 1} ${["Oak", "Elm", "Birch", "Maple", "Willow", "Cedar", "Pine", "Ash"][idx % 8]} ${["Road", "Street", "Lane", "Close", "Drive", "Avenue", "Way", "Crescent"][idx % 8]}`,
        postcode: `BD${1 + (idx % 9)} ${idx % 10}${["AA", "AB", "BA", "BB", "CA", "DA", "EA", "FA", "GA", "HA"][idx % 10]}`,
        preference_rank: idx < 30 ? 1 : idx < 36 ? 2 : 3,
        distance_miles: distance,
        oversubscription_criterion: group.tag,
        sibling_at_school: group.tag === "sibling",
        looked_after_child: group.tag === "lac",
        ehcp_naming_school: group.tag === "ehcp",
        faith_evidence:
          group.tag === "faith"
            ? "Letter from Rev. Smith, St Mary's Church"
            : null,
        status,
        waiting_list_position: waitingPos,
        appeal_submitted: isAppeal,
        appeal_date: isAppeal ? "2026-05-20" : null,
        appeal_outcome: isAppeal ? appealOutcome : null,
        appeal_notes: isAppeal
          ? appealOutcome === "dismissed"
            ? "Panel found no grounds for admission above PAN."
            : null
          : null,
        offer_date:
          status === "offered" || status === "accepted" || status === "declined"
            ? "2026-04-16"
            : null,
        acceptance_date: status === "accepted" ? "2026-04-25" : null,
        decline_date: status === "declined" ? "2026-04-28" : null,
        notes: null,
        created_at: `2025-11-${String(1 + (idx % 28)).padStart(2, "0")}T10:00:00Z`,
        updated_at: `2026-03-${String(1 + (idx % 10)).padStart(2, "0")}T14:00:00Z`,
      });

      idx++;
    }
  }

  return apps;
}

const DEMO_APPLICATIONS = generateDemoApplications();

const DEMO_STATS: DashboardStats = {
  total_applications: DEMO_APPLICATIONS.length,
  received: DEMO_APPLICATIONS.filter((a) => a.status === "received").length,
  verified: DEMO_APPLICATIONS.filter((a) => a.status === "verified").length,
  offered: DEMO_APPLICATIONS.filter((a) => a.status === "offered").length,
  accepted: DEMO_APPLICATIONS.filter((a) => a.status === "accepted").length,
  declined: DEMO_APPLICATIONS.filter((a) => a.status === "declined").length,
  waiting_list: DEMO_APPLICATIONS.filter((a) => a.status === "waiting_list")
    .length,
  withdrawn: DEMO_APPLICATIONS.filter((a) => a.status === "withdrawn").length,
  appeals_pending: DEMO_APPLICATIONS.filter(
    (a) => a.appeal_submitted && !a.appeal_outcome,
  ).length,
  appeals_upheld: DEMO_APPLICATIONS.filter((a) => a.appeal_outcome === "upheld")
    .length,
  appeals_dismissed: DEMO_APPLICATIONS.filter(
    (a) => a.appeal_outcome === "dismissed",
  ).length,
  places_available:
    30 -
    DEMO_APPLICATIONS.filter(
      (a) => a.status === "accepted" || a.status === "offered",
    ).length,
  pan: 30,
};

const DEMO_CRITERIA_BREAKDOWN: CriteriaBreakdown[] = [
  { criterion: "lac", count: 1 },
  { criterion: "ehcp", count: 2 },
  { criterion: "sibling", count: 8 },
  { criterion: "staff_child", count: 2 },
  { criterion: "faith", count: 4 },
  { criterion: "distance", count: 25 },
];

const DEMO_WAITING_LIST = DEMO_APPLICATIONS.filter(
  (a) => a.status === "waiting_list",
).sort(
  (a, b) => (a.waiting_list_position || 999) - (b.waiting_list_position || 999),
);

const DEMO_APPEALS = DEMO_APPLICATIONS.filter((a) => a.appeal_submitted);

// ─── Helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  received: {
    label: "Received",
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-700",
    icon: Inbox,
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: ClipboardCheck,
  },
  offered: {
    label: "Offered",
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: Send,
  },
  accepted: {
    label: "Accepted",
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
  waiting_list: {
    label: "Waiting List",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: ListOrdered,
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800",
    icon: Minus,
  },
};

const CRITERIA_CONFIG: Record<
  string,
  { label: string; shortLabel: string; icon: React.ElementType; color: string }
> = {
  lac: {
    label: "Looked After Children (LAC)",
    shortLabel: "LAC",
    icon: Shield,
    color: "text-red-600 bg-red-50 dark:bg-red-900/20",
  },
  ehcp: {
    label: "EHCP Naming School",
    shortLabel: "EHCP",
    icon: FileText,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  },
  sibling: {
    label: "Sibling at School",
    shortLabel: "Sibling",
    icon: Users,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  },
  staff_child: {
    label: "Staff Child",
    shortLabel: "Staff",
    icon: Star,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  },
  faith: {
    label: "Faith Commitment",
    shortLabel: "Faith",
    icon: Heart,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  },
  distance: {
    label: "Distance",
    shortLabel: "Distance",
    icon: MapPin,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  },
  other: {
    label: "Other",
    shortLabel: "Other",
    icon: CircleDot,
    color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20",
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0) return `${years - 1}y ${12 + months}m`;
  return `${years}y ${months}m`;
}

// ─── Stat Card Component ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
        {label}
      </div>
      {subtitle && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

// ─── Funnel Bar Component ───────────────────────────────────────────────

function FunnelBar({ stats, pan }: { stats: DashboardStats; pan: number }) {
  const total = stats.total_applications || 1;
  const stages = [
    {
      key: "received",
      label: "Received",
      count: stats.received,
      color: "bg-slate-400",
    },
    {
      key: "verified",
      label: "Verified",
      count: stats.verified,
      color: "bg-blue-400",
    },
    {
      key: "offered",
      label: "Offered",
      count: stats.offered,
      color: "bg-amber-400",
    },
    {
      key: "accepted",
      label: "Accepted",
      count: stats.accepted,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Application Funnel</span>
        <span>
          {stats.accepted + stats.offered} / {pan} places filled
        </span>
      </div>
      <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700/50">
        {stages.map((stage) => {
          const pct = (stage.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={stage.key}
              className={`${stage.color} relative group flex items-center justify-center transition-all duration-300`}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? "2px" : "0" }}
            >
              {pct > 8 && (
                <span className="text-[10px] font-bold text-white">
                  {stage.count}
                </span>
              )}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {stage.label}: {stage.count} ({Math.round(pct)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {stages.map((stage) => (
          <div key={stage.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${stage.color}`} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {stage.label} ({stage.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Header Component ───────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        {badge !== undefined && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            {badge}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Application Detail Modal ───────────────────────────────────────────

function ApplicationDetailPanel({
  app,
  onClose,
  onUpdateStatus,
  isDemo,
}: {
  app: Application;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  isDemo: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.received;
  const critCfg =
    CRITERIA_CONFIG[app.oversubscription_criterion || "other"] ||
    CRITERIA_CONFIG.other;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-y-auto border-l border-slate-200 dark:border-slate-700"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {app.child_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              DOB: {formatDate(app.child_dob)} ({formatAge(app.child_dob)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusCfg.bg} ${statusCfg.color}`}
          >
            <statusCfg.icon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${critCfg.color}`}
          >
            <critCfg.icon className="w-3.5 h-3.5" />
            {critCfg.shortLabel}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DetailItem
            icon={Hash}
            label="Preference"
            value={`${app.preference_rank}${app.preference_rank === 1 ? "st" : app.preference_rank === 2 ? "nd" : "rd"} choice`}
          />
          <DetailItem
            icon={MapPin}
            label="Distance"
            value={
              app.distance_miles != null
                ? `${app.distance_miles} miles`
                : "Not set"
            }
          />
          <DetailItem
            icon={Home}
            label="Address"
            value={app.address || "Not provided"}
          />
          <DetailItem
            icon={Mail}
            label="Postcode"
            value={app.postcode || "Not provided"}
          />
        </div>

        {/* Parent/Carer */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Parent / Carer
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">
                {app.parent_name || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">
                {app.parent_email || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">
                {app.parent_phone || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        {/* Criteria Evidence */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Oversubscription Criteria Evidence
          </h4>
          <div className="space-y-2 text-sm">
            {app.looked_after_child && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Looked After Child confirmed</span>
              </div>
            )}
            {app.ehcp_naming_school && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>EHCP names this school</span>
              </div>
            )}
            {app.sibling_at_school && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Sibling currently on roll</span>
              </div>
            )}
            {app.faith_evidence && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Faith: {app.faith_evidence}</span>
              </div>
            )}
            {!app.looked_after_child &&
              !app.ehcp_naming_school &&
              !app.sibling_at_school &&
              !app.faith_evidence && (
                <div className="text-slate-400">
                  Distance-based allocation only
                </div>
              )}
          </div>
        </div>

        {/* Appeal Information */}
        {app.appeal_submitted && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              Appeal
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-600 dark:text-amber-400">
                  Date:
                </span>
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {formatDate(app.appeal_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600 dark:text-amber-400">
                  Outcome:
                </span>
                <span
                  className={`font-medium ${app.appeal_outcome === "upheld" ? "text-emerald-600" : app.appeal_outcome === "dismissed" ? "text-red-600" : "text-amber-600"}`}
                >
                  {app.appeal_outcome
                    ? app.appeal_outcome.charAt(0).toUpperCase() +
                      app.appeal_outcome.slice(1)
                    : "Pending"}
                </span>
              </div>
              {app.appeal_notes && (
                <p className="text-amber-600 dark:text-amber-400 mt-2 text-xs">
                  {app.appeal_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Key Dates */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Key Dates
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Applied</span>
              <span className="text-slate-700 dark:text-slate-300">
                {formatDate(app.created_at)}
              </span>
            </div>
            {app.offer_date && (
              <div className="flex justify-between">
                <span className="text-slate-500">Offer sent</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDate(app.offer_date)}
                </span>
              </div>
            )}
            {app.acceptance_date && (
              <div className="flex justify-between">
                <span className="text-slate-500">Accepted</span>
                <span className="text-emerald-600">
                  {formatDate(app.acceptance_date)}
                </span>
              </div>
            )}
            {app.decline_date && (
              <div className="flex justify-between">
                <span className="text-slate-500">Declined</span>
                <span className="text-red-600">
                  {formatDate(app.decline_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {app.status === "received" && (
              <ActionButton
                label="Mark Verified"
                icon={ClipboardCheck}
                color="blue"
                onClick={() => onUpdateStatus(app.id, "verified")}
              />
            )}
            {(app.status === "received" || app.status === "verified") && (
              <ActionButton
                label="Make Offer"
                icon={Send}
                color="amber"
                onClick={() => onUpdateStatus(app.id, "offered")}
              />
            )}
            {app.status === "offered" && (
              <>
                <ActionButton
                  label="Record Acceptance"
                  icon={CheckCircle2}
                  color="emerald"
                  onClick={() => onUpdateStatus(app.id, "accepted")}
                />
                <ActionButton
                  label="Record Decline"
                  icon={XCircle}
                  color="red"
                  onClick={() => onUpdateStatus(app.id, "declined")}
                />
              </>
            )}
            {(app.status === "received" ||
              app.status === "verified" ||
              app.status === "declined") && (
              <ActionButton
                label="Add to Waiting List"
                icon={ListOrdered}
                color="purple"
                onClick={() => onUpdateStatus(app.id, "waiting_list")}
              />
            )}
            <ActionButton
              label="Withdraw"
              icon={Minus}
              color="slate"
              onClick={() => onUpdateStatus(app.id, "withdrawn")}
            />
          </div>
        </div>

        {app.notes && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-xs text-slate-500">
              <strong>Notes:</strong> {app.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300",
    amber:
      "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300",
    emerald:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300",
    red: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300",
    purple:
      "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300",
    slate:
      "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/20 dark:text-slate-300",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${colorMap[color] || colorMap.slate}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  // Fetch dashboard data
  const { data: dashData, isLoading } = useSWR<DashboardData>(
    organizationId
      ? `/api/admissions/dashboard?organization_id=${organizationId}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Determine if we should use demo data
  const isDemo =
    !dashData ||
    !dashData.activeRound ||
    dashData.stats.total_applications === 0;
  const round = isDemo ? DEMO_ROUND : dashData!.activeRound!;
  const stats = isDemo ? DEMO_STATS : dashData!.stats;
  const criteriaBreakdown = isDemo
    ? DEMO_CRITERIA_BREAKDOWN
    : dashData!.criteriaBreakdown;
  const allApplications = isDemo ? DEMO_APPLICATIONS : [];
  const waitingListData = isDemo ? DEMO_WAITING_LIST : dashData!.waitingList;
  const appealsData = isDemo ? DEMO_APPEALS : dashData!.appeals;

  // State
  const [activeTab, setActiveTab] = useState<
    "overview" | "applications" | "criteria" | "waiting" | "appeals"
  >("overview");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [criterionFilter, setCriterionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("preference_rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let apps = [...allApplications];

    if (statusFilter !== "all") {
      apps = apps.filter((a) => a.status === statusFilter);
    }
    if (criterionFilter !== "all") {
      apps = apps.filter(
        (a) => a.oversubscription_criterion === criterionFilter,
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.child_name.toLowerCase().includes(q) ||
          a.parent_name?.toLowerCase().includes(q) ||
          a.postcode?.toLowerCase().includes(q),
      );
    }

    apps.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "child_name":
          aVal = a.child_name;
          bVal = b.child_name;
          break;
        case "distance_miles":
          aVal = a.distance_miles ?? 999;
          bVal = b.distance_miles ?? 999;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        default:
          aVal = a.preference_rank;
          bVal = b.preference_rank;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return apps;
  }, [
    allApplications,
    statusFilter,
    criterionFilter,
    searchQuery,
    sortField,
    sortAsc,
  ]);

  // Applications grouped by criterion (for criteria tab)
  const applicationsByCriterion = useMemo(() => {
    const grouped: Record<string, Application[]> = {};
    for (const app of allApplications) {
      const crit = app.oversubscription_criterion || "other";
      if (!grouped[crit]) grouped[crit] = [];
      grouped[crit].push(app);
    }
    return grouped;
  }, [allApplications]);

  const handleUpdateStatus = useCallback(
    async (id: string, newStatus: string) => {
      if (isDemo) {
        // In demo mode just update local state to show the UI works
        const app = allApplications.find((a) => a.id === id);
        if (app) {
          app.status = newStatus;
          setSelectedApp({ ...app, status: newStatus });
        }
        return;
      }
      try {
        await fetch(`/api/admissions/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        console.error("Failed to update status", err);
      }
    },
    [isDemo, allApplications],
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    {
      key: "applications",
      label: "Applications",
      icon: Users,
      count: stats.total_applications,
    },
    { key: "criteria", label: "Criteria", icon: ListOrdered },
    {
      key: "waiting",
      label: "Waiting List",
      icon: Clock,
      count: stats.waiting_list,
    },
    {
      key: "appeals",
      label: "Appeals",
      icon: Gavel,
      count: stats.appeals_pending,
    },
  ] as const;

  // ─── Render ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <ModulePageHeader
        moduleId="improvement"
        icon={GraduationCap}
        label="School Admissions"
        title="Admissions Tracker"
        description="Manage admission rounds, applications, waiting lists, and appeals."
        badge={round.status === "open" ? "Round Open" : round.status}
      />

      {/* Demo Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl"
        >
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Demo Mode
            </span>
            <span className="text-sm text-amber-600 dark:text-amber-400 ml-2">
              Showing sample data for Reception 2026-27 (PAN 30, 42
              applications). Connect your data to see real admissions.
            </span>
          </div>
        </motion.div>
      )}

      {/* Round Summary Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {round.entry_year_group} Entry {round.academic_year}
              </h2>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  round.status === "open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : round.status === "closed"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {round.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Published Admission Number (PAN):{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {round.pan}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-0.5">
                Deadline
              </div>
              <div className="font-bold text-slate-700 dark:text-slate-200">
                {formatDate(round.application_deadline)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-0.5">
                Offer Day
              </div>
              <div className="font-bold text-slate-700 dark:text-slate-200">
                {formatDate(round.offer_date)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-0.5">
                Accept By
              </div>
              <div className="font-bold text-slate-700 dark:text-slate-200">
                {formatDate(round.acceptance_deadline)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ─── Overview Tab ──────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard
                label="Total"
                value={stats.total_applications}
                icon={Users}
                color="text-slate-600"
                bgColor="bg-slate-100 dark:bg-slate-700"
                index={0}
              />
              <StatCard
                label="Received"
                value={stats.received}
                icon={Inbox}
                color="text-slate-500"
                bgColor="bg-slate-100 dark:bg-slate-700"
                index={1}
              />
              <StatCard
                label="Verified"
                value={stats.verified}
                icon={ClipboardCheck}
                color="text-blue-600"
                bgColor="bg-blue-100 dark:bg-blue-900/20"
                index={2}
              />
              <StatCard
                label="Offered"
                value={stats.offered}
                icon={Send}
                color="text-amber-600"
                bgColor="bg-amber-100 dark:bg-amber-900/20"
                index={3}
              />
              <StatCard
                label="Accepted"
                value={stats.accepted}
                icon={CheckCircle2}
                color="text-emerald-600"
                bgColor="bg-emerald-100 dark:bg-emerald-900/20"
                index={4}
              />
              <StatCard
                label="Declined"
                value={stats.declined}
                icon={XCircle}
                color="text-red-600"
                bgColor="bg-red-100 dark:bg-red-900/20"
                index={5}
              />
              <StatCard
                label="Waiting List"
                value={stats.waiting_list}
                icon={ListOrdered}
                color="text-purple-600"
                bgColor="bg-purple-100 dark:bg-purple-900/20"
                index={6}
              />
              <StatCard
                label="Places Left"
                value={stats.places_available}
                icon={UserPlus}
                color={
                  stats.places_available > 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }
                bgColor={
                  stats.places_available > 0
                    ? "bg-emerald-100 dark:bg-emerald-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }
                subtitle={`of ${stats.pan} PAN`}
                index={7}
              />
            </div>

            {/* Application Funnel */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
              <SectionHeader
                icon={TrendingUp}
                title="Application Funnel"
                subtitle={`${stats.total_applications} total applications`}
              />
              <FunnelBar stats={stats} pan={round.pan} />
            </div>

            {/* Criteria Breakdown + Key Dates side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criteria Breakdown */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
                <SectionHeader
                  icon={ListOrdered}
                  title="Oversubscription Criteria"
                  subtitle="Priority order"
                />
                <div className="space-y-3">
                  {criteriaBreakdown.map((item, idx) => {
                    const cfg =
                      CRITERIA_CONFIG[item.criterion] || CRITERIA_CONFIG.other;
                    const pct = Math.round(
                      (item.count / stats.total_applications) * 100,
                    );
                    return (
                      <div
                        key={item.criterion}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {idx + 1}
                        </div>
                        <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                          <cfg.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              {cfg.label}
                            </span>
                            <span className="text-xs font-bold text-slate-500 ml-2">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Dates Timeline */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
                <SectionHeader icon={Calendar} title="Key Dates" />
                <div className="space-y-4">
                  {[
                    {
                      label: "Applications Open",
                      date: round.created_at,
                      icon: UserPlus,
                      status: "completed",
                    },
                    {
                      label: "Application Deadline",
                      date: round.application_deadline,
                      icon: Clock,
                      status:
                        round.application_deadline &&
                        new Date(round.application_deadline) < new Date()
                          ? "completed"
                          : "upcoming",
                    },
                    {
                      label: "National Offer Day",
                      date: round.offer_date,
                      icon: Send,
                      status:
                        round.offer_date &&
                        new Date(round.offer_date) < new Date()
                          ? "completed"
                          : "upcoming",
                    },
                    {
                      label: "Acceptance Deadline",
                      date: round.acceptance_deadline,
                      icon: CheckCircle2,
                      status:
                        round.acceptance_deadline &&
                        new Date(round.acceptance_deadline) < new Date()
                          ? "completed"
                          : "upcoming",
                    },
                    {
                      label: "Appeals Window Opens",
                      date: round.acceptance_deadline
                        ? new Date(
                            new Date(round.acceptance_deadline).getTime() +
                              7 * 24 * 60 * 60 * 1000,
                          )
                            .toISOString()
                            .split("T")[0]
                        : null,
                      icon: Gavel,
                      status: "upcoming",
                    },
                    {
                      label: "Term Starts",
                      date: "2026-09-07",
                      icon: GraduationCap,
                      status: "upcoming",
                    },
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed"
                              ? "bg-emerald-100 dark:bg-emerald-900/20"
                              : "bg-slate-100 dark:bg-slate-700"
                          }`}
                        >
                          <event.icon
                            className={`w-4 h-4 ${
                              event.status === "completed"
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          />
                        </div>
                        {idx < 5 && (
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mt-1" />
                        )}
                      </div>
                      <div className="pt-1">
                        <div
                          className={`text-sm font-semibold ${
                            event.status === "completed"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {event.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {event.date ? formatDate(event.date) : "TBC"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Appeals Summary */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
              <SectionHeader
                icon={Gavel}
                title="Appeals Summary"
                badge={
                  stats.appeals_pending +
                  stats.appeals_upheld +
                  stats.appeals_dismissed
                }
              />
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                  <div className="text-2xl font-black text-amber-600">
                    {stats.appeals_pending}
                  </div>
                  <div className="text-xs text-amber-500 font-medium mt-1">
                    Pending
                  </div>
                </div>
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                  <div className="text-2xl font-black text-emerald-600">
                    {stats.appeals_upheld}
                  </div>
                  <div className="text-xs text-emerald-500 font-medium mt-1">
                    Upheld
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                  <div className="text-2xl font-black text-red-600">
                    {stats.appeals_dismissed}
                  </div>
                  <div className="text-xs text-red-500 font-medium mt-1">
                    Dismissed
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Applications Tab ──────────────────────────────────────── */}
        {activeTab === "applications" && (
          <motion.div
            key="applications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, parent, or postcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Criterion Filter */}
              <div className="relative">
                <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={criterionFilter}
                  onChange={(e) => setCriterionFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Criteria</option>
                  {Object.entries(CRITERIA_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-400">
                {filteredApplications.length} applications
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      {[
                        {
                          key: "child_name",
                          label: "Child Name",
                          width: "w-48",
                        },
                        { key: "child_dob", label: "DOB", width: "w-28" },
                        {
                          key: "preference_rank",
                          label: "Pref",
                          width: "w-16",
                        },
                        { key: "criterion", label: "Criterion", width: "w-28" },
                        {
                          key: "distance_miles",
                          label: "Distance",
                          width: "w-24",
                        },
                        { key: "status", label: "Status", width: "w-32" },
                        { key: "actions", label: "", width: "w-12" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.width}`}
                        >
                          {col.key !== "actions" && col.key !== "criterion" ? (
                            <button
                              onClick={() => handleSort(col.key)}
                              className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                              {col.label}
                              {sortField === col.key ? (
                                sortAsc ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app, idx) => {
                      const statusCfg =
                        STATUS_CONFIG[app.status] || STATUS_CONFIG.received;
                      const critCfg =
                        CRITERIA_CONFIG[
                          app.oversubscription_criterion || "other"
                        ] || CRITERIA_CONFIG.other;
                      return (
                        <tr
                          key={app.id}
                          onClick={() => setSelectedApp(app)}
                          className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {app.child_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {app.parent_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                            {formatDate(app.child_dob)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                              {app.preference_rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${critCfg.color}`}
                            >
                              <critCfg.icon className="w-3 h-3" />
                              {critCfg.shortLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {app.distance_miles != null
                              ? `${app.distance_miles} mi`
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.color}`}
                            >
                              <statusCfg.icon className="w-3 h-3" />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApp(app);
                              }}
                              aria-label="View application details"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredApplications.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-sm text-slate-400"
                        >
                          No applications match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Oversubscription Criteria Tab ─────────────────────────── */}
        {activeTab === "criteria" && (
          <motion.div
            key="criteria"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Criteria Policy Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
              <SectionHeader
                icon={FileText}
                title="Published Oversubscription Criteria"
                subtitle={`${round.entry_year_group} ${round.academic_year}`}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Where the school is oversubscribed, places are allocated in the
                following priority order, in accordance with the School
                Admissions Code 2021. Children with an EHCP naming the school
                are admitted by law and do not count against the PAN.
              </p>
              <div className="space-y-3">
                {(round.oversubscription_criteria || []).map(
                  (crit: any, idx: number) => {
                    const cfg =
                      CRITERIA_CONFIG[crit.tag] || CRITERIA_CONFIG.other;
                    const matchingApps =
                      applicationsByCriterion[crit.tag] || [];
                    const isExpanded = expandedCriteria === crit.tag;

                    return (
                      <div
                        key={crit.tag}
                        className="border border-slate-100 dark:border-slate-700/50 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedCriteria(isExpanded ? null : crit.tag)
                          }
                          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                            {crit.priority}
                          </div>
                          <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                            <cfg.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {crit.label}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {crit.description}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              {matchingApps.length} applicants
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-slate-100 dark:border-slate-700/50 p-4 bg-slate-50 dark:bg-slate-800/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                  {crit.description}
                                </p>
                                {matchingApps.length > 0 ? (
                                  <div className="space-y-2">
                                    {matchingApps.map((app) => {
                                      const sCfg =
                                        STATUS_CONFIG[app.status] ||
                                        STATUS_CONFIG.received;
                                      return (
                                        <div
                                          key={app.id}
                                          onClick={() => setSelectedApp(app)}
                                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                                        >
                                          <div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                              {app.child_name}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-2">
                                              {app.distance_miles != null
                                                ? `${app.distance_miles} mi`
                                                : ""}
                                            </span>
                                          </div>
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sCfg.bg} ${sCfg.color}`}
                                          >
                                            <sCfg.icon className="w-3 h-3" />
                                            {sCfg.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 italic">
                                    No applications under this criterion.
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Tiebreaker Notice */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    Tiebreaker
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Where two or more applicants share the same criterion and
                    cannot all be admitted, priority is given by straight-line
                    distance from the child&apos;s home address to the school
                    gate, measured by the Local Authority&apos;s GIS system. In
                    the event of identical distances, a random allocation
                    (supervised by an independent person) will be used.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Waiting List Tab ──────────────────────────────────────── */}
        {activeTab === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
              <SectionHeader
                icon={ListOrdered}
                title="Waiting List"
                badge={waitingListData.length}
                subtitle="Ordered by oversubscription criteria, then distance"
              />

              {/* Waiting list info */}
              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                      Waiting List Legislation
                    </p>
                    <p>
                      Under the School Admissions Code 2021, the waiting list
                      must be maintained until at least 31 December in the
                      admission year. The list is reordered each time a child is
                      added, using the published oversubscription criteria only.
                      Length of time on the waiting list does NOT affect
                      position. The school must inform the LA of any changes.
                    </p>
                  </div>
                </div>
              </div>

              {waitingListData.length > 0 ? (
                <div className="space-y-2">
                  {waitingListData.map((app, idx) => {
                    const critCfg =
                      CRITERIA_CONFIG[
                        app.oversubscription_criterion || "other"
                      ] || CRITERIA_CONFIG.other;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:shadow-md cursor-pointer transition-all"
                      >
                        {/* Position */}
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <span className="text-sm font-black text-purple-600 dark:text-purple-300">
                            {app.waiting_list_position || idx + 1}
                          </span>
                        </div>

                        {/* Name + Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {app.child_name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${critCfg.color}`}
                            >
                              <critCfg.icon className="w-3 h-3" />
                              {critCfg.shortLabel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {app.parent_name} | {app.postcode} |{" "}
                            {app.distance_miles != null
                              ? `${app.distance_miles} miles`
                              : "Distance N/A"}
                          </div>
                        </div>

                        {/* Appeal badge */}
                        {app.appeal_submitted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <Gavel className="w-3 h-3" />
                            {app.appeal_outcome || "Pending"}
                          </span>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(app.id, "offered");
                            }}
                            className="px-3 py-1.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors dark:bg-emerald-900/20 dark:text-emerald-300"
                          >
                            Make Offer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ListOrdered className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    No children on the waiting list.
                  </p>
                </div>
              )}
            </div>

            {/* Auto-reorder notice */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-4 h-4" />
                <span>
                  The waiting list is automatically reordered when children are
                  added or removed, based solely on the published
                  oversubscription criteria. Date of application has no bearing
                  on position.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Appeals Tab ───────────────────────────────────────────── */}
        {activeTab === "appeals" && (
          <motion.div
            key="appeals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Appeals overview stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm text-center">
                <div className="text-3xl font-black text-amber-600">
                  {stats.appeals_pending}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Appeals Pending
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Awaiting panel hearing
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm text-center">
                <div className="text-3xl font-black text-emerald-600">
                  {stats.appeals_upheld}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Appeals Upheld
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Additional place granted
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm text-center">
                <div className="text-3xl font-black text-red-600">
                  {stats.appeals_dismissed}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Appeals Dismissed
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Original decision upheld
                </div>
              </div>
            </div>

            {/* Appeals list */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
              <SectionHeader
                icon={Gavel}
                title="Appeal Cases"
                badge={appealsData.length}
              />

              {/* Appeals legislation info */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                      Appeals Process
                    </p>
                    <p>
                      Parents have the right to appeal to an independent panel
                      under the School Standards and Framework Act 1998. For
                      infant classes (Reception, Y1, Y2), the infant class size
                      prejudice applies (max 30 per qualified teacher). Appeals
                      must be heard within 40 school days of the deadline for
                      lodging appeals. The panel&apos;s decision is binding on
                      the admission authority.
                    </p>
                  </div>
                </div>
              </div>

              {appealsData.length > 0 ? (
                <div className="space-y-3">
                  {appealsData.map((app) => {
                    const critCfg =
                      CRITERIA_CONFIG[
                        app.oversubscription_criterion || "other"
                      ] || CRITERIA_CONFIG.other;
                    const isPending = !app.appeal_outcome;
                    const isUpheld = app.appeal_outcome === "upheld";
                    const isDismissed = app.appeal_outcome === "dismissed";

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:shadow-md cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base font-bold text-slate-900 dark:text-white">
                                {app.child_name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${critCfg.color}`}
                              >
                                <critCfg.icon className="w-3 h-3" />
                                {critCfg.shortLabel}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400">
                                  Appeal Filed
                                </span>
                                <div className="text-slate-700 dark:text-slate-300 font-medium">
                                  {formatDate(app.appeal_date)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  Preference
                                </span>
                                <div className="text-slate-700 dark:text-slate-300 font-medium">
                                  {app.preference_rank === 1
                                    ? "1st choice"
                                    : `${app.preference_rank}${app.preference_rank === 2 ? "nd" : "rd"} choice`}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Distance</span>
                                <div className="text-slate-700 dark:text-slate-300 font-medium">
                                  {app.distance_miles != null
                                    ? `${app.distance_miles} miles`
                                    : "N/A"}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  WL Position
                                </span>
                                <div className="text-slate-700 dark:text-slate-300 font-medium">
                                  #{app.waiting_list_position || "-"}
                                </div>
                              </div>
                            </div>
                            {app.appeal_notes && (
                              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2">
                                {app.appeal_notes}
                              </div>
                            )}
                          </div>

                          {/* Outcome badge */}
                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                            {isUpheld && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Upheld
                              </span>
                            )}
                            {isDismissed && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                <ThumbsDown className="w-3.5 h-3.5" />
                                Dismissed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick actions for pending appeals */}
                        {isPending && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDemo) return;
                                fetch(
                                  `/api/admissions/applications/${app.id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      appeal_outcome: "upheld",
                                      status: "offered",
                                    }),
                                  },
                                );
                              }}
                              className="px-3 py-1.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors dark:bg-emerald-900/20 dark:text-emerald-300"
                            >
                              Record: Upheld
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDemo) return;
                                fetch(
                                  `/api/admissions/applications/${app.id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      appeal_outcome: "dismissed",
                                    }),
                                  },
                                );
                              }}
                              className="px-3 py-1.5 text-[10px] font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-300"
                            >
                              Record: Dismissed
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    No appeals have been submitted.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Detail Slide-over */}
      <AnimatePresence>
        {selectedApp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <ApplicationDetailPanel
              app={selectedApp}
              onClose={() => setSelectedApp(null)}
              onUpdateStatus={handleUpdateStatus}
              isDemo={isDemo}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
