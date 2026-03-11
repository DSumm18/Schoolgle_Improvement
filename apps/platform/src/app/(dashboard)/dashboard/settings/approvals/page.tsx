"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  FileText,
  Briefcase,
  PoundSterling,
  Users,
  Trash2,
  AlertTriangle,
  Filter,
  History,
  BookOpen,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/context/SupabaseAuthContext";

// ─── Types ────────────────────────────────────────────────────────────

type ApprovalType =
  | "spend"
  | "contract"
  | "policy"
  | "risk_decision"
  | "recruitment"
  | "disposal";
type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "escalated"
  | "expired";
type ApprovalTier = "headteacher" | "slt" | "cfo" | "ceo" | "board" | "members";

interface Approval {
  id: string;
  organization_id: string;
  type: ApprovalType;
  title: string;
  description: string;
  amount: number | null;
  requested_by: string;
  requested_by_name: string;
  required_tier: ApprovalTier;
  current_status: ApprovalStatus;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  escalated_to: ApprovalTier | null;
  escalated_at: string | null;
  expires_at: string | null;
  requires_minute: boolean;
  linked_risk_id: string | null;
  linked_task_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ApprovalRule {
  type: ApprovalType;
  minAmount?: number;
  maxAmount?: number;
  requiredTier: ApprovalTier;
  requiredTierLabel: string;
  typeLabel: string;
  requiresMinute?: boolean;
  slaHours: number;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  reason: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const TIER_HIERARCHY: ApprovalTier[] = [
  "headteacher",
  "slt",
  "cfo",
  "ceo",
  "board",
  "members",
];

const ROLE_TO_MAX_TIER: Record<string, ApprovalTier> = {
  admin: "board",
  headteacher: "headteacher",
  slt: "slt",
  governor: "board",
};

function canApprove(userRole: string, requiredTier: ApprovalTier): boolean {
  const maxTier = ROLE_TO_MAX_TIER[userRole];
  if (!maxTier) return false;
  return (
    TIER_HIERARCHY.indexOf(maxTier) >= TIER_HIERARCHY.indexOf(requiredTier)
  );
}

const TYPE_ICONS: Record<ApprovalType, React.ReactNode> = {
  spend: <PoundSterling className="w-4 h-4" />,
  contract: <Briefcase className="w-4 h-4" />,
  policy: <FileText className="w-4 h-4" />,
  risk_decision: <ShieldAlert className="w-4 h-4" />,
  recruitment: <Users className="w-4 h-4" />,
  disposal: <Trash2 className="w-4 h-4" />,
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  spend: "Expenditure",
  contract: "Contract",
  policy: "Policy Change",
  risk_decision: "Risk Decision",
  recruitment: "Recruitment",
  disposal: "Asset Disposal",
};

const TIER_LABELS: Record<ApprovalTier, string> = {
  headteacher: "Headteacher",
  slt: "SLT",
  cfo: "CFO",
  ceo: "CEO",
  board: "Board",
  members: "Members",
};

const STATUS_STYLES: Record<
  ApprovalStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-amber-900/30",
    text: "text-amber-400",
    label: "Pending",
  },
  approved: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Rejected",
  },
  escalated: {
    bg: "bg-purple-900/30",
    text: "text-purple-400",
    label: "Escalated",
  },
  expired: {
    bg: "bg-neutral-800/50",
    text: "text-neutral-500",
    label: "Expired",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function slaProgress(
  createdAt: string,
  expiresAt: string | null,
): { percent: number; label: string; color: string } {
  if (!expiresAt)
    return { percent: 0, label: "No SLA", color: "bg-neutral-700" };
  const start = new Date(createdAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

  if (percent >= 100) {
    const overHours = Math.round((now - end) / (1000 * 60 * 60));
    return {
      percent: 100,
      label: `BREACHED (${overHours}h overdue)`,
      color: "bg-red-500",
    };
  }
  if (percent >= 75) {
    const remaining = Math.round((end - now) / (1000 * 60 * 60));
    return {
      percent,
      label: `${remaining}h remaining`,
      color: "bg-amber-500",
    };
  }
  const remaining = Math.round((end - now) / (1000 * 60 * 60));
  return {
    percent,
    label: `${remaining}h remaining`,
    color: "bg-emerald-500",
  };
}

// ─── Page Component ──────────────────────────────────────────────────

type Tab = "queue" | "history" | "rules";

export default function ApprovalHubPage() {
  const { user, organizationId, organization } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [filterType, setFilterType] = useState<ApprovalType | "all">("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const userRole = organization?.role || "viewer";

  // ── Data fetching ─────────────────────────────────────────────────

  const fetchApprovals = useCallback(async () => {
    if (!organizationId) return;
    try {
      const statusParam = activeTab === "queue" ? "&status=pending" : "";
      const res = await fetch(
        `/api/approvals?organizationId=${organizationId}${statusParam}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error("Fetch approvals error:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, activeTab]);

  const fetchRules = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await fetch(
        `/api/approvals/rules?organizationId=${organizationId}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      // Non-critical
    }
  }, [organizationId]);

  useEffect(() => {
    setLoading(true);
    fetchApprovals();
  }, [fetchApprovals]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ── Actions ───────────────────────────────────────────────────────

  async function handleAction(
    id: string,
    action: "approve" | "reject" | "escalate",
    reason?: string,
  ) {
    setActionInProgress(id);
    try {
      const res = await fetch(
        `/api/approvals/${id}?organizationId=${organizationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason,
            actorName: user?.email || "Unknown",
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || `Failed to ${action}`);
        return;
      }
      toast.success(
        action === "approve"
          ? "Approved"
          : action === "reject"
            ? "Rejected"
            : "Escalated to next tier",
      );
      setRejectingId(null);
      setRejectReason("");
      fetchApprovals();
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
    }
  }

  // ── Computed values ───────────────────────────────────────────────

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.current_status === "pending"),
    [approvals],
  );

  const breachedCount = useMemo(
    () =>
      pendingApprovals.filter((a) => {
        if (!a.expires_at) return false;
        return new Date(a.expires_at).getTime() < Date.now();
      }).length,
    [pendingApprovals],
  );

  const approvedThisMonth = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return approvals.filter(
      (a) =>
        a.current_status === "approved" &&
        a.approved_at &&
        new Date(a.approved_at) >= startOfMonth,
    );
  }, [approvals]);

  const totalApprovedValue = useMemo(
    () => approvedThisMonth.reduce((sum, a) => sum + (a.amount || 0), 0),
    [approvedThisMonth],
  );

  const filteredApprovals = useMemo(() => {
    let list = approvals;
    if (activeTab === "queue") {
      list = list.filter((a) => a.current_status === "pending");
    }
    if (filterType !== "all") {
      list = list.filter((a) => a.type === filterType);
    }
    // Sort: breached SLA first, then by creation date
    return [...list].sort((a, b) => {
      if (a.current_status === "pending" && b.current_status === "pending") {
        const aBreached =
          a.expires_at && new Date(a.expires_at).getTime() < Date.now();
        const bBreached =
          b.expires_at && new Date(b.expires_at).getTime() < Date.now();
        if (aBreached && !bBreached) return -1;
        if (!aBreached && bBreached) return 1;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [approvals, activeTab, filterType]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 min-h-screen bg-neutral-950 text-neutral-50 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Approval Hub
          </h2>
          <p className="text-neutral-400">
            Delegation controls and spending authority — ATH 2025 aligned
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Pending"
          value={String(pendingApprovals.length)}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          highlight={pendingApprovals.length > 0}
        />
        <SummaryCard
          label="SLA Breached"
          value={String(breachedCount)}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          highlight={breachedCount > 0}
          highlightColor="red"
        />
        <SummaryCard
          label="Approved This Month"
          value={String(approvedThisMonth.length)}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <SummaryCard
          label="Approved Value"
          value={formatCurrency(totalApprovedValue)}
          icon={<PoundSterling className="h-4 w-4 text-sky-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800 pb-0">
        <TabButton
          active={activeTab === "queue"}
          onClick={() => setActiveTab("queue")}
          icon={<Clock className="w-4 h-4" />}
          label="Pending Queue"
          count={pendingApprovals.length}
        />
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={<History className="w-4 h-4" />}
          label="History"
        />
        <TabButton
          active={activeTab === "rules"}
          onClick={() => setActiveTab("rules")}
          icon={<BookOpen className="w-4 h-4" />}
          label="Rules & Thresholds"
        />

        {/* Filter — only in queue / history */}
        {activeTab !== "rules" && (
          <div className="ml-auto relative">
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as ApprovalType | "all")
              }
              className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 pr-8 text-sm text-neutral-300 focus:outline-none focus:border-neutral-600"
            >
              <option value="all">All types</option>
              {(Object.keys(TYPE_LABELS) as ApprovalType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "rules" ? (
        <RulesTab rules={rules} />
      ) : (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-neutral-900/40 border-neutral-800">
                <CardHeader>
                  <Skeleton className="h-4 w-1/3 bg-neutral-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full bg-neutral-800" />
                </CardContent>
              </Card>
            ))
          ) : filteredApprovals.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filteredApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                userRole={userRole}
                canAct={
                  activeTab === "queue" &&
                  canApprove(userRole, approval.required_tier)
                }
                isActing={actionInProgress === approval.id}
                isRejecting={rejectingId === approval.id}
                rejectReason={rejectReason}
                onApprove={() => handleAction(approval.id, "approve")}
                onReject={() => {
                  if (rejectingId === approval.id) {
                    if (!rejectReason.trim()) {
                      toast.error("Please provide a reason for rejection.");
                      return;
                    }
                    handleAction(approval.id, "reject", rejectReason);
                  } else {
                    setRejectingId(approval.id);
                    setRejectReason("");
                  }
                }}
                onEscalate={() => handleAction(approval.id, "escalate")}
                onRejectReasonChange={setRejectReason}
                onCancelReject={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  highlight,
  highlightColor = "amber",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
  highlightColor?: "amber" | "red";
}) {
  const borderClass = highlight
    ? highlightColor === "red"
      ? "border-red-500/40"
      : "border-amber-500/40"
    : "border-neutral-800";
  return (
    <Card className={`bg-neutral-900/50 ${borderClass} backdrop-blur-xl`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-amber-500 text-amber-400"
          : "border-transparent text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 bg-amber-900/40 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

function ApprovalCard({
  approval,
  userRole,
  canAct,
  isActing,
  isRejecting,
  rejectReason,
  onApprove,
  onReject,
  onEscalate,
  onRejectReasonChange,
  onCancelReject,
}: {
  approval: Approval;
  userRole: string;
  canAct: boolean;
  isActing: boolean;
  isRejecting: boolean;
  rejectReason: string;
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
  onRejectReasonChange: (v: string) => void;
  onCancelReject: () => void;
}) {
  const sla = slaProgress(approval.created_at, approval.expires_at);
  const status = STATUS_STYLES[approval.current_status];
  const isPending = approval.current_status === "pending";
  const isBreached = sla.percent >= 100;

  return (
    <Card
      className={`bg-neutral-900/60 border-neutral-800 transition-all ${
        isBreached && isPending
          ? "border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]"
          : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/80">
              {TYPE_ICONS[approval.type]}
            </div>
            <div>
              <CardTitle className="text-base">{approval.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="text-neutral-500">
                  {TYPE_LABELS[approval.type]}
                </span>
                {approval.amount !== null && (
                  <>
                    <span className="text-neutral-700">|</span>
                    <span className="font-semibold text-neutral-200">
                      {formatCurrency(approval.amount)}
                    </span>
                  </>
                )}
                <span className="text-neutral-700">|</span>
                <span className="text-neutral-500">
                  by {approval.requested_by_name}
                </span>
                <span className="text-neutral-700">|</span>
                <span className="text-neutral-500">
                  {timeAgo(approval.created_at)}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {approval.requires_minute && (
              <Badge className="bg-purple-900/30 text-purple-400 border-purple-500/30 text-xs">
                Requires minuting
              </Badge>
            )}
            <Badge className={`${status.bg} ${status.text} border-transparent`}>
              {status.label}
            </Badge>
            <Badge className="bg-neutral-800 text-neutral-300 border-neutral-700 text-xs">
              {TIER_LABELS[approval.required_tier]} tier
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-neutral-400">{approval.description}</p>

        {/* SLA bar — only for pending */}
        {isPending && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">SLA</span>
              <span
                className={
                  isBreached
                    ? "text-red-400 font-semibold"
                    : sla.percent >= 75
                      ? "text-amber-400"
                      : "text-neutral-400"
                }
              >
                {sla.label}
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sla.color}`}
                style={{ width: `${Math.min(100, sla.percent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Resolved info */}
        {approval.current_status === "approved" &&
          approval.approved_by_name && (
            <p className="text-xs text-emerald-400/70">
              Approved by {approval.approved_by_name}{" "}
              {approval.approved_at && timeAgo(approval.approved_at)}
            </p>
          )}
        {approval.current_status === "rejected" && (
          <p className="text-xs text-red-400/70">
            Rejected: {approval.rejected_reason || "No reason given"}
          </p>
        )}
        {approval.current_status === "escalated" && approval.escalated_to && (
          <p className="text-xs text-purple-400/70">
            Escalated to {TIER_LABELS[approval.escalated_to]}{" "}
            {approval.escalated_at && timeAgo(approval.escalated_at)}
          </p>
        )}

        {/* Reject reason input */}
        {isRejecting && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Reason for rejection (required)..."
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReject}
              className="text-neutral-500"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>

      {/* Action buttons — only for pending requests the user can approve */}
      {isPending && (
        <CardFooter className="flex gap-2 pt-0">
          {canAct ? (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={onApprove}
                disabled={isActing}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-800 text-red-400 hover:bg-red-950/30"
                onClick={onReject}
                disabled={isActing}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-neutral-600">
              Your role ({userRole}) cannot approve at the{" "}
              {TIER_LABELS[approval.required_tier]} tier
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-purple-400 hover:bg-purple-950/30"
            onClick={onEscalate}
            disabled={isActing}
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Escalate
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function RulesTab({ rules }: { rules: ApprovalRule[] }) {
  // Group rules by type
  const grouped = useMemo(() => {
    const map = new Map<string, ApprovalRule[]>();
    for (const rule of rules) {
      const key = rule.typeLabel || rule.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rule);
    }
    return map;
  }, [rules]);

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">Loading rules...</div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-400">
        Default delegation thresholds aligned with the Academy Trust Handbook
        2025. Amounts are in GBP.
      </p>
      {Array.from(grouped.entries()).map(([typeLabel, typeRules]) => (
        <Card key={typeLabel} className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {TYPE_ICONS[typeRules[0].type]}
              {typeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500">
                  <th className="text-left py-2 px-4 font-medium">Range</th>
                  <th className="text-left py-2 px-4 font-medium">
                    Required Tier
                  </th>
                  <th className="text-left py-2 px-4 font-medium">SLA</th>
                  <th className="text-left py-2 px-4 font-medium">Minuting</th>
                </tr>
              </thead>
              <tbody>
                {typeRules
                  .sort((a, b) => (a.minAmount ?? 0) - (b.minAmount ?? 0))
                  .map((rule, i) => {
                    const rangeStr =
                      rule.minAmount !== undefined ||
                      rule.maxAmount !== undefined
                        ? `${rule.minAmount !== undefined ? formatCurrency(rule.minAmount) : "Any"} ${rule.maxAmount !== undefined ? ` - ${formatCurrency(rule.maxAmount)}` : "+"}`
                        : "Any value";
                    return (
                      <tr
                        key={i}
                        className="border-b border-neutral-800/50 last:border-0"
                      >
                        <td className="py-2 px-4 text-neutral-300">
                          {rangeStr}
                        </td>
                        <td className="py-2 px-4">
                          <Badge className="bg-neutral-800 text-neutral-300 border-neutral-700 text-xs">
                            {rule.requiredTierLabel}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 text-neutral-400">
                          {rule.slaHours}h
                        </td>
                        <td className="py-2 px-4">
                          {rule.requiresMinute ? (
                            <span className="text-purple-400 text-xs">
                              Required
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-neutral-800 rounded-2xl">
      {tab === "queue" ? (
        <>
          <CheckCircle2 className="w-12 h-12 text-emerald-600/40 mb-4" />
          <p className="text-neutral-500 font-medium">No pending approvals</p>
          <p className="text-neutral-600 text-sm mt-1">
            All requests have been processed.
          </p>
        </>
      ) : (
        <>
          <History className="w-12 h-12 text-neutral-700 mb-4" />
          <p className="text-neutral-500 font-medium">
            No approval history yet
          </p>
          <p className="text-neutral-600 text-sm mt-1">
            Processed approvals will appear here.
          </p>
        </>
      )}
    </div>
  );
}
