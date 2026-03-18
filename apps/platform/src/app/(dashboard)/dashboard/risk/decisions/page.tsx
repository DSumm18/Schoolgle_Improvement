"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  ChevronDown,
  Filter,
  Calendar,
  User,
  Gavel,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DecisionType = "treat" | "tolerate" | "transfer" | "terminate";

interface RiskDecision {
  id: string;
  risk_id: string;
  organization_id: string;
  decision: DecisionType;
  decided_by?: string;
  decided_by_name?: string;
  rationale?: string;
  minute_reference?: string;
  board_meeting_id?: string;
  review_date?: string;
  conditions?: string;
  budget_allocated?: number;
  budget_source?: string;
  year_allocated?: string;
  created_at: string;
  decision_date?: string;
  risk_register?: {
    risk_ref: string;
    title: string;
    status: string;
    risk_categories: string[];
    tier: string;
  };
}

interface RiskOption {
  id: string;
  risk_ref: string;
  title: string;
  status: string;
}

interface DecisionsApiResponse {
  decisions: RiskDecision[];
}

interface RisksApiResponse {
  risks: RiskOption[];
}

// ---------------------------------------------------------------------------
// Decision type styling
// ---------------------------------------------------------------------------

const DECISION_CONFIG: Record<
  DecisionType,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  treat: {
    label: "Treat",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: Shield,
    description: "Mitigate the risk through controls",
  },
  tolerate: {
    label: "Tolerate",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: AlertTriangle,
    description: "Accept the risk within appetite",
  },
  transfer: {
    label: "Transfer",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: FileText,
    description: "Transfer via insurance or contract",
  },
  terminate: {
    label: "Terminate",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    icon: X,
    description: "Remove the activity causing the risk",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntilReview(reviewDate?: string): number | null {
  if (!reviewDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const review = new Date(reviewDate);
  review.setHours(0, 0, 0, 0);
  return Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  borderColor,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: number;
  borderColor: string;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-5 border-l-4 ${borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-black mt-1">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision card
// ---------------------------------------------------------------------------

function DecisionCard({ decision }: { decision: RiskDecision }) {
  const config = DECISION_CONFIG[decision.decision];
  const DecisionIcon = config.icon;
  const reviewDays = daysUntilReview(decision.review_date);
  const isOverdue = reviewDays !== null && reviewDays < 0;
  const isUpcoming = reviewDays !== null && reviewDays >= 0 && reviewDays <= 14;
  const decidedAt = decision.decision_date || decision.created_at;
  const riskRef = decision.risk_register?.risk_ref || "--";
  const riskTitle = decision.risk_register?.title || "Unknown risk";
  const riskStatus = decision.risk_register?.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-2xl p-5 transition-shadow hover:shadow-md ${
        isOverdue ? "border-red-300 dark:border-red-800" : "border-border"
      }`}
    >
      {/* Header: risk ref + decision badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {riskRef}
            </span>
            {riskStatus && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                {riskStatus}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-tight truncate">
            {riskTitle}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${config.bgColor} ${config.color}`}
        >
          <DecisionIcon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </div>

      {/* Rationale */}
      {decision.rationale && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
          {decision.rationale}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        {/* Decided by */}
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{decision.decided_by_name || decision.decided_by || "--"}</span>
        </div>

        {/* Decided at */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(decidedAt)}</span>
        </div>

        {/* Board meeting ref */}
        {decision.minute_reference && (
          <div className="flex items-center gap-1">
            <Gavel className="w-3 h-3" />
            <span>{decision.minute_reference}</span>
          </div>
        )}

        {/* Review date + countdown */}
        {decision.review_date && (
          <div
            className={`flex items-center gap-1 ml-auto font-bold ${
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : isUpcoming
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Clock className="w-3 h-3" />
            {isOverdue ? (
              <span>Overdue by {Math.abs(reviewDays!)} days</span>
            ) : reviewDays === 0 ? (
              <span>Review due today</span>
            ) : (
              <span>
                Review in {reviewDays} days ({formatDate(decision.review_date)})
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// New Decision form (modal)
// ---------------------------------------------------------------------------

function NewDecisionModal({
  organizationId,
  risks,
  onClose,
  onCreated,
}: {
  organizationId: string;
  risks: RiskOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [riskId, setRiskId] = useState("");
  const [decisionType, setDecisionType] = useState<DecisionType | "">("");
  const [rationale, setRationale] = useState("");
  const [boardMeetingRef, setBoardMeetingRef] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [decidedBy, setDecidedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riskId || !decisionType) {
      setError("Please select a risk and decision type.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/risk/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_id: riskId,
          organizationId: organizationId,
          decision: decisionType,
          rationale: rationale || undefined,
          minute_reference: boardMeetingRef || undefined,
          review_date: reviewDate || undefined,
          decided_by_name: decidedBy || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create decision");
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Record 4T Decision</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Risk selection */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Risk *
              </label>
              <select
                value={riskId}
                onChange={(e) => setRiskId(e.target.value)}
                required
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select a risk...</option>
                {risks
                  .filter((r) => r.status !== "closed")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.risk_ref} - {r.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Decision type */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Decision Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "treat",
                    "tolerate",
                    "transfer",
                    "terminate",
                  ] as DecisionType[]
                ).map((type) => {
                  const cfg = DECISION_CONFIG[type];
                  const Icon = cfg.icon;
                  const isSelected = decisionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDecisionType(type)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all ${
                        isSelected
                          ? `${cfg.bgColor} ${cfg.color} border-current ring-2 ring-current/20`
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">{cfg.label}</div>
                        <div className="text-[10px] opacity-70">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rationale */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Rationale
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={3}
                placeholder="Explain the reasoning behind this decision..."
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Board meeting ref */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Board Meeting Reference
              </label>
              <input
                type="text"
                value={boardMeetingRef}
                onChange={(e) => setBoardMeetingRef(e.target.value)}
                placeholder="e.g. FGB-2026-03-10, Item 7.2"
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Review date + decided by */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Review Date
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Decided By
                </label>
                <input
                  type="text"
                  value={decidedBy}
                  onChange={(e) => setDecidedBy(e.target.value)}
                  placeholder="Name or role"
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !riskId || !decisionType}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Record Decision
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RiskDecisionsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch decisions
  const queryParams = new URLSearchParams();
  if (organizationId) queryParams.set("organizationId", organizationId);

  const {
    data: decisionsData,
    isLoading,
    mutate,
  } = useSWR<DecisionsApiResponse>(
    organizationId ? `/api/risk/decisions?${queryParams.toString()}` : null,
    fetcher,
    { refreshInterval: 30000 },
  );

  // Fetch active risks for the new-decision dropdown
  const { data: risksData } = useSWR<RisksApiResponse>(
    organizationId ? `/api/risk?organizationId=${organizationId}` : null,
    fetcher,
  );

  const allDecisions = decisionsData?.decisions ?? [];
  const risks = risksData?.risks ?? [];

  // Client-side filtering (date range + type)
  const filteredDecisions = useMemo(() => {
    let result = allDecisions;

    if (typeFilter) {
      result = result.filter((d) => d.decision === typeFilter);
    }
    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter((d) => {
        const dt = new Date(d.decision_date || d.created_at);
        return dt >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((d) => {
        const dt = new Date(d.decision_date || d.created_at);
        return dt <= to;
      });
    }

    return result;
  }, [allDecisions, typeFilter, fromDate, toDate]);

  // Summary stats
  const stats = useMemo(() => {
    const counts: Record<DecisionType, number> = {
      treat: 0,
      tolerate: 0,
      transfer: 0,
      terminate: 0,
    };
    for (const d of allDecisions) {
      if (d.decision in counts) {
        counts[d.decision as DecisionType]++;
      }
    }
    return counts;
  }, [allDecisions]);

  const hasFilters = typeFilter || fromDate || toDate;

  function clearFilters() {
    setTypeFilter("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Risk Decisions
            </h1>
            <p className="text-sm text-muted-foreground">
              4T risk decisions linked to board meetings
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Decision
        </button>
      </motion.div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Treat"
          value={stats.treat}
          borderColor="border-l-blue-500"
          icon={Shield}
          subtitle="Mitigate with controls"
        />
        <StatCard
          label="Tolerate"
          value={stats.tolerate}
          borderColor="border-l-amber-500"
          icon={AlertTriangle}
          subtitle="Accept within appetite"
        />
        <StatCard
          label="Transfer"
          value={stats.transfer}
          borderColor="border-l-purple-500"
          icon={FileText}
          subtitle="Insurance or contract"
        />
        <StatCard
          label="Terminate"
          value={stats.terminate}
          borderColor="border-l-gray-400"
          icon={X}
          subtitle="Remove the activity"
        />
      </div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Filters
            </span>
          </div>

          <FilterSelect
            label="All Types"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "treat", label: "Treat" },
              { value: "tolerate", label: "Tolerate" },
              { value: "transfer", label: "Transfer" },
              { value: "terminate", label: "Terminate" },
            ]}
          />

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          <span className="text-[10px] text-muted-foreground font-medium ml-auto">
            {filteredDecisions.length} of {allDecisions.length} decisions
          </span>
        </div>
      </motion.div>

      {/* Decisions list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Loading decisions...
            </p>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Gavel className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-sm font-semibold">No decisions recorded</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasFilters
                ? "Try adjusting your filters"
                : "Click 'New Decision' to record a 4T risk decision"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDecisions.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        )}
      </motion.div>

      {/* New Decision modal */}
      <AnimatePresence>
        {showForm && (
          <NewDecisionModal
            organizationId={organizationId}
            risks={risks}
            onClose={() => setShowForm(false)}
            onCreated={() => mutate()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
