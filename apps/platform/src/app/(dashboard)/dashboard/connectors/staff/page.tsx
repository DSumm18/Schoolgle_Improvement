"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Heart,
  LayoutGrid,
  List,
  PoundSterling,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Siren,
  UserMinus,
  Users,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { LeavingImpactReport } from "@/components/connectors/LeavingImpactReport";

type TabId = "directory" | "assigned" | "impact";
type ViewMode = "table" | "cards";

type ConnectorType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  is_statutory?: boolean | null;
  statutory_basis?: string | null;
  statutory_reference?: string | null;
  source_url?: string | null;
  source_publisher?: string | null;
  minimum_count?: number | null;
  ratio_label?: string | null;
  requires_training?: boolean | null;
  training_name?: string | null;
  modules?: string[] | null;
  incident_types?: string[] | null;
  responsibilities?: string[] | null;
  color?: string | null;
};

type StaffSummary = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  job_title?: string | null;
  role_category?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type ConnectorAssignment = {
  id: string;
  staff_id: string | null;
  connector_type_id: string;
  coverage_area?: string | null;
  status?: string | null;
  training_expires_at?: string | null;
  training_expiry_date?: string | null;
  staff?: StaffSummary | null;
};

type ResolvedConnector = {
  connector_type: ConnectorType;
  assignments: ConnectorAssignment[];
  is_configured: boolean;
};

type ResolveResponse = {
  connectors: ResolvedConnector[];
};

type StaffResponse = {
  staff: StaffSummary[];
  count: number;
};

const categoryLabels: Record<string, string> = {
  safeguarding: "Safeguarding",
  send: "SEND",
  health_safety: "Health & Safety",
  data_governance: "Data & Governance",
  estates: "Estates",
  governance: "Governance",
  curriculum: "Curriculum",
  operations: "Operations",
  custom: "Custom",
};

const moduleIdentity = {
  estates: {
    label: "Estates",
    icon: Building2,
    badge: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-200",
    rail: "border-l-teal-400",
  },
  finance: {
    label: "Finance",
    icon: PoundSterling,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200",
    rail: "border-l-emerald-400",
  },
  hr: {
    label: "HR",
    icon: Users,
    badge: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200",
    rail: "border-l-blue-400",
  },
  compliance: {
    label: "Compliance",
    icon: ShieldCheck,
    badge: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-200",
    rail: "border-l-purple-400",
  },
  safeguarding: {
    label: "Safeguarding",
    icon: Shield,
    badge: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200",
    rail: "border-l-red-400",
  },
  send: {
    label: "SEND",
    icon: Heart,
    badge: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-200",
    rail: "border-l-violet-400",
  },
  incidents: {
    label: "Incident Hub",
    icon: Siren,
    badge: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200",
    rail: "border-l-rose-400",
  },
  curriculum: {
    label: "Teaching",
    icon: BookOpen,
    badge: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-200",
    rail: "border-l-cyan-400",
  },
  governance: {
    label: "Governance",
    icon: ShieldCheck,
    badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200",
    rail: "border-l-amber-400",
  },
  documents: {
    label: "Documents",
    icon: BookOpen,
    badge: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    rail: "border-l-slate-400",
  },
};

function staffName(staff?: StaffSummary | null) {
  if (!staff) return "Unassigned";
  return staff.display_name || `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || "Unnamed staff member";
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function assignmentSummary(assignments: ConnectorAssignment[]) {
  if (assignments.length === 0) return "No one assigned";
  return assignments.map((assignment) => staffName(assignment.staff)).join(", ");
}

function primaryModule(type: ConnectorType) {
  if (type.slug === "fire-marshal" || type.slug === "site-manager") return "estates";
  if (type.slug === "dpo") return "compliance";
  if (type.slug === "dsl" || type.slug === "deputy-dsl") return "safeguarding";
  if (type.slug === "senco") return "send";
  if (type.category === "curriculum") return "curriculum";
  if (type.category === "data_governance") return "compliance";
  if (type.category === "send") return "send";
  if (type.category === "safeguarding") return "safeguarding";
  if (type.category === "estates") return "estates";
  if (type.category === "governance") return "governance";
  if (type.category === "health_safety") return "compliance";
  return type.modules?.[0] || "documents";
}

function ModuleBadge({ type }: { type: ConnectorType }) {
  const identity =
    moduleIdentity[primaryModule(type) as keyof typeof moduleIdentity] ||
    moduleIdentity.documents;
  const Icon = identity.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${identity.badge}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {identity.label}
    </span>
  );
}

function moduleRail(type: ConnectorType) {
  const identity =
    moduleIdentity[primaryModule(type) as keyof typeof moduleIdentity] ||
    moduleIdentity.documents;
  return identity.rail;
}

function isSuggestedStaff(type: ConnectorType, staff: StaffSummary) {
  const text = `${staff.job_title || ""} ${staff.role_category || ""}`.toLowerCase();
  if (type.slug === "dsl" || type.slug === "deputy-dsl") {
    return /(head|deputy|assistant|safeguarding|slt|pastoral)/.test(text);
  }
  if (type.slug === "dpo") {
    return /(data|business|office|manager|admin|dpo|governance)/.test(text);
  }
  if (type.slug === "senco") {
    return /(senco|send|inclusion)/.test(text);
  }
  if (type.category === "health_safety" || type.category === "estates") {
    return /(site|premises|caretaker|office|business|first aid|first-aid|teacher|ta|assistant)/.test(text);
  }
  if (type.category === "curriculum") {
    return /(lead|teacher|phase|key stage|ks1|ks2)/.test(text);
  }
  return true;
}

export default function StaffConnectorsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const userRole = organization?.role;
  const canManage = userRole === "admin" || userRole === "slt" || userRole === "headteacher";

  const [activeTab, setActiveTab] = useState<TabId>("directory");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [expandedRoleIds, setExpandedRoleIds] = useState<Set<string>>(new Set());
  const [editingConnector, setEditingConnector] = useState<ResolvedConnector | null>(null);
  const [assignmentStaffId, setAssignmentStaffId] = useState("");
  const [assignmentScope, setAssignmentScope] = useState("Whole school");
  const [assignmentTrainingExpiry, setAssignmentTrainingExpiry] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { data, isLoading, mutate: mutateConnectors } = useSWR<ResolveResponse>(
    organizationId
      ? `/api/connectors/resolve?organizationId=${organizationId}&includeEmpty=true`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: staffData, isLoading: staffLoading } = useSWR<StaffResponse>(
    organizationId ? `/api/staff?organizationId=${organizationId}&source=db` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const connectors = useMemo(() => data?.connectors || [], [data?.connectors]);
  const staff = useMemo(() => staffData?.staff || [], [staffData?.staff]);

  const filteredConnectors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return connectors.filter(({ connector_type: type, assignments }) => {
      const matchesCategory = categoryFilter === "all" || type.category === categoryFilter;
      const matchesSearch =
        !query ||
        type.name.toLowerCase().includes(query) ||
        type.description?.toLowerCase().includes(query) ||
        assignments.some((assignment) =>
          staffName(assignment.staff).toLowerCase().includes(query),
        );
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, connectors, searchQuery]);

  const assignedStaff = useMemo(() => {
    const staffMap = new Map<string, StaffSummary>();
    for (const connector of connectors) {
      for (const assignment of connector.assignments) {
        if (assignment.staff) staffMap.set(assignment.staff.id, assignment.staff);
      }
    }
    return [...staffMap.values()].filter((staff) => staff.is_active !== false);
  }, [connectors]);

  const staffResponsibilityRows = useMemo(() => {
    return staff
      .filter((person) => person.is_active !== false)
      .map((person) => ({
        staff: person,
        responsibilities: connectors.filter((connector) =>
          connector.assignments.some((assignment) => assignment.staff_id === person.id),
        ),
      }));
  }, [connectors, staff]);

  const configuredCount = connectors.filter((connector) => connector.is_configured).length;
  const statutoryCount = connectors.filter((connector) => connector.connector_type.is_statutory).length;
  const gaps = connectors.filter(
    (connector) =>
      (connector.connector_type.minimum_count || 0) > connector.assignments.length,
  );

  const tabs = [
    { id: "directory" as const, label: "Responsibility Directory", icon: Shield },
    { id: "assigned" as const, label: "Assigned People", icon: Users },
    ...(canManage
      ? [{ id: "impact" as const, label: "Leaving Impact", icon: UserMinus }]
      : []),
  ];

  function toggleRole(roleId: string) {
    setExpandedRoleIds((current) => {
      const next = new Set(current);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  function openAssign(connector: ResolvedConnector) {
    const suggestions = staff.filter((person) => person.is_active !== false && isSuggestedStaff(connector.connector_type, person));
    setEditingConnector(connector);
    setAssignmentStaffId(suggestions[0]?.id || staff.find((person) => person.is_active !== false)?.id || "");
    setAssignmentScope("Whole school");
    setAssignmentTrainingExpiry("");
  }

  async function saveAssignment() {
    if (!editingConnector || !assignmentStaffId) return;
    setIsAssigning(true);
    try {
      await fetcher("/api/connectors/assign", {
        method: "POST",
        body: JSON.stringify({
          staff_id: assignmentStaffId,
          connector_type_id: editingConnector.connector_type.id,
          scope: assignmentScope,
          training_completed: Boolean(assignmentTrainingExpiry),
          training_expiry_date: assignmentTrainingExpiry || null,
        }),
      });
      await mutateConnectors();
      setEditingConnector(null);
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-500">
              School Settings
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-slate-950 dark:text-white">
              <Settings className="h-7 w-7 text-sky-500" />
              Staff Responsibilities
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Set who holds key responsibilities such as DSL, DPO, SENCO, First Aider,
              Fire Marshal and Health & Safety Lead. Incident Hub, policies, documents
              and Ed can then route work to the right person automatically.
            </p>
          </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-2xl font-black">{connectors.length}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Roles
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                <div className="text-2xl font-black">{statutoryCount}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  Statutory
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="text-2xl font-black">{configuredCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Assigned
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="text-2xl font-black">{gaps.length}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Gaps
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                isActive
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== "impact" ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search responsibilities or staff..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none ring-sky-500/20 transition focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none ring-sky-500/20 transition focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {activeTab === "directory" ? (
            <div className="flex h-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                  viewMode === "table"
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <List className="h-4 w-4" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                  viewMode === "cards"
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : activeTab === "directory" ? (
        viewMode === "table" ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              {filteredConnectors.length} responsibilities · click a row to expand details
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3">Responsibility</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Requirement</th>
                    <th className="px-4 py-3">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredConnectors.map((connector) => {
                    const type = connector.connector_type;
                    const minimum = type.minimum_count || 0;
                    const hasGap = minimum > connector.assignments.length;
                    const isExpanded = expandedRoleIds.has(type.id);
                    return (
                      <Fragment key={type.id}>
                        <tr
                          onClick={() => toggleRole(type.id)}
                          className={`cursor-pointer border-l-4 bg-white transition hover:bg-sky-50/60 dark:bg-slate-950 dark:hover:bg-sky-950/20 ${moduleRail(type)}`}
                        >
                          <td className="px-4 py-3 align-top">
                            <ChevronDown
                              className={`mt-1 h-4 w-4 text-slate-400 transition ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-black text-slate-950 dark:text-white">
                              {type.name}
                            </div>
                            <div className="mt-1 max-w-xl truncate text-xs text-slate-500 dark:text-slate-400">
                              {type.description}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <ModuleBadge type={type} />
                            <div className="mt-1 text-[11px] font-semibold text-slate-400">
                              {categoryLabels[type.category] || type.category}
                            </div>
                          </td>
                          <td className="max-w-[260px] px-4 py-3 align-top font-semibold text-slate-700 dark:text-slate-200">
                            {assignmentSummary(connector.assignments)}
                          </td>
                          <td className="px-4 py-3 align-top text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {type.ratio_label || (minimum ? `Minimum ${minimum}` : "School-defined")}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              {hasGap ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Needs owner
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Assigned
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAssign(connector);
                                }}
                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                              >
                                {connector.assignments.length > 0 ? "Change" : "Assign"}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr key={`${type.id}-details`} className="bg-slate-50/80 dark:bg-slate-900/50">
                            <td />
                            <td colSpan={5} className="px-4 py-4">
                              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                                <div>
                                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {type.description}
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {(type.responsibilities || []).slice(0, 4).map((responsibility) => (
                                      <span
                                        key={responsibility}
                                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800"
                                      >
                                        {responsibility}
                                      </span>
                                    ))}
                                  </div>
                                  {type.statutory_basis || type.statutory_reference || type.source_url ? (
                                    <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
                                      {type.statutory_basis ? (
                                        <div className="flex gap-2">
                                          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                          <span>{type.statutory_basis}</span>
                                        </div>
                                      ) : null}
                                      {type.statutory_reference ? (
                                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                                          {type.statutory_reference}
                                        </p>
                                      ) : null}
                                      {type.source_url ? (
                                        <a
                                          href={type.source_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="mt-2 inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700"
                                        >
                                          {type.source_publisher || "Source"}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    Current holders
                                  </div>
                                  {connector.assignments.length > 0 ? (
                                    connector.assignments.map((assignment) => (
                                      <div
                                        key={assignment.id}
                                        className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                                      >
                                        <div className="font-bold text-slate-900 dark:text-white">
                                          {staffName(assignment.staff)}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          {assignment.staff?.job_title || "Role holder"}
                                          {assignment.coverage_area ? ` · ${assignment.coverage_area}` : ""}
                                        </div>
                                        {formatDate(assignment.training_expires_at || assignment.training_expiry_date) ? (
                                          <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            Training expires{" "}
                                            {formatDate(assignment.training_expires_at || assignment.training_expiry_date)}
                                          </div>
                                        ) : null}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                                      No one assigned yet.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredConnectors.map((connector) => {
            const type = connector.connector_type;
            const minimum = type.minimum_count || 0;
            const hasGap = minimum > connector.assignments.length;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${moduleRail(type)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <ModuleBadge type={type} />
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      {categoryLabels[type.category] || type.category}
                    </div>
                  </div>
                  {hasGap ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Needs owner
                      </span>
                      <button
                        type="button"
                        onClick={() => openAssign(connector)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Assign
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Assigned
                      </span>
                      <button
                        type="button"
                        onClick={() => openAssign(connector)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  {type.name}
                </h2>
                <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {type.description}
                </p>

                <div className="mt-4 space-y-2">
                  {connector.assignments.length > 0 ? (
                    connector.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          {staffName(assignment.staff)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {assignment.staff?.job_title || "Role holder"}
                          {assignment.coverage_area ? ` · ${assignment.coverage_area}` : ""}
                        </div>
                        {formatDate(assignment.training_expires_at || assignment.training_expiry_date) ? (
                          <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Training expires{" "}
                            {formatDate(assignment.training_expires_at || assignment.training_expiry_date)}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      No one assigned yet.
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-black uppercase tracking-wider text-slate-400">
                      Requirement
                    </div>
                    <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                      {type.ratio_label || (minimum ? `Minimum ${minimum}` : "School-defined")}
                    </div>
                  </div>
                  <div>
                    <div className="font-black uppercase tracking-wider text-slate-400">
                      Training
                    </div>
                    <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                      {type.requires_training ? type.training_name || "Required" : "Not mandated"}
                    </div>
                  </div>
                </div>

                {type.statutory_basis || type.statutory_reference || type.source_url ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {type.statutory_basis ? (
                      <div className="flex gap-2">
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{type.statutory_basis}</span>
                      </div>
                    ) : null}
                    {type.statutory_reference ? (
                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {type.statutory_reference}
                      </p>
                    ) : null}
                    {type.source_url ? (
                      <a
                        href={type.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700"
                      >
                        {type.source_publisher || "Source"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
        )
      ) : activeTab === "assigned" ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="font-black text-slate-950 dark:text-white">Staff responsibility list</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A compact “who is responsible for what?” view. Once staff are imported, this becomes the everyday lookup list.
            </p>
          </div>
          {staffLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
              ))}
            </div>
          ) : staffResponsibilityRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Staff member</th>
                    <th className="px-4 py-3">Role / area</th>
                    <th className="px-4 py-3">Responsibilities</th>
                    <th className="px-4 py-3">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffResponsibilityRows.map(({ staff: person, responsibilities }) => (
                    <tr key={person.id} className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20">
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-950 dark:text-white">
                          {staffName(person)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {person.email || "No email recorded"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">
                          {person.job_title || "Role not set"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {person.role_category || "No category"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {responsibilities.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {responsibilities.map((connector) => (
                              <span
                                key={connector.connector_type.id}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                              >
                                {connector.connector_type.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No assigned responsibilities</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                        {responsibilities
                          .flatMap((connector) =>
                            connector.assignments
                              .filter((assignment) => assignment.staff_id === person.id)
                              .map((assignment) => assignment.coverage_area || "Whole school"),
                          )
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-bold">No staff have been imported for this school yet.</p>
              <p className="mx-auto mt-1 max-w-xl text-sm">
                Once the Rawdon St Peter&apos;s staff import is in, this table will show every staff member and their assigned responsibilities. You can still use demo/imported staff to test the assignment flow.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {!selectedStaffId ? (
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Select a staff member
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                See which responsibilities need transferring if someone leaves or changes role.
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {assignedStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className="rounded-2xl border border-slate-200 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-sky-950/20"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      {staffName(staff)}
                    </div>
                    <div className="text-xs text-slate-500">{staff.job_title}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedStaffId(null)}
                className="text-sm font-bold text-sky-600 hover:text-sky-700"
              >
                ← Back to staff list
              </button>
              <LeavingImpactReport staffId={selectedStaffId} organizationId={organizationId} />
            </div>
          )}
        </div>
      )}

      {editingConnector ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-4 backdrop-blur-sm md:items-center">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className={`border-l-4 p-5 ${moduleRail(editingConnector.connector_type)}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Assign responsibility
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {editingConnector.connector_type.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ModuleBadge type={editingConnector.connector_type} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {categoryLabels[editingConnector.connector_type.category] ||
                        editingConnector.connector_type.category}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConnector(null)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_260px]">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Select staff member
                </label>
                <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {staff.filter((person) => person.is_active !== false).length > 0 ? (
                    staff
                      .filter((person) => person.is_active !== false)
                      .sort((a, b) => {
                        const aSuggested = isSuggestedStaff(editingConnector.connector_type, a) ? 0 : 1;
                        const bSuggested = isSuggestedStaff(editingConnector.connector_type, b) ? 0 : 1;
                        return aSuggested - bSuggested || staffName(a).localeCompare(staffName(b));
                      })
                      .map((person) => {
                        const suggested = isSuggestedStaff(editingConnector.connector_type, person);
                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => setAssignmentStaffId(person.id)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              assignmentStaffId === person.id
                                ? "border-sky-400 bg-sky-50 ring-4 ring-sky-100 dark:bg-sky-950/20 dark:ring-sky-950/50"
                                : "border-slate-200 hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-black text-slate-950 dark:text-white">
                                  {staffName(person)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {person.job_title || "Role not set"}
                                </div>
                              </div>
                              {suggested ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                                  Suggested
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No staff are available yet. Import or create staff records first, then come back here to assign responsibilities.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Scope / coverage
                  </label>
                  <select
                    value={assignmentScope}
                    onChange={(event) => setAssignmentScope(event.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option>Whole school</option>
                    <option>EYFS</option>
                    <option>Key Stage 1</option>
                    <option>Key Stage 2</option>
                    <option>Office / admin</option>
                    <option>Site / premises</option>
                    <option>Custom</option>
                  </select>
                </div>

                {editingConnector.connector_type.requires_training ? (
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Training expiry
                    </label>
                    <input
                      type="date"
                      value={assignmentTrainingExpiry}
                      onChange={(event) => setAssignmentTrainingExpiry(event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                ) : null}

                <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  Staff are sorted with likely matches first. Once imports include departments, key stages, absence and training, this picker can become genuinely smart.
                </div>

                <button
                  type="button"
                  onClick={saveAssignment}
                  disabled={!assignmentStaffId || isAssigning}
                  className="h-11 w-full rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {isAssigning ? "Saving..." : "Save responsibility"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100">
        This is now the operational responsibility directory: leaders can see gaps, staff can look up who owns what, and imported staff can be assigned directly from this screen.
      </div>
    </div>
  );
}

