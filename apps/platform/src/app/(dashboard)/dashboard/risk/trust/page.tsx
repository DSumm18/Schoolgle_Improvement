"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  Building2,
  Shield,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Printer,
  ChevronRight,
  Clock,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Gavel,
} from "lucide-react";
import {
  getRiskBand,
  getHeatMapData,
  type Risk,
  type RiskCategory,
  type RiskBand,
  type DirectionOfTravel,
} from "@/lib/risk-engine";
import { RiskHeatMap } from "@/components/risk/RiskHeatMap";
import { RiskScoreBadge } from "@/components/risk/RiskScoreBadge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiskRow extends Risk {
  residual_score: number;
  effective_score: number;
  risk_band: RiskBand;
  direction_of_travel: DirectionOfTravel;
  above_appetite: boolean;
  owner_name?: string;
  mitigations_total: number;
  mitigations_overdue: number;
  school_name?: string;
  school_id?: string;
  escalated_at?: string;
  escalation_reason?: string;
}

interface SchoolOrg {
  id: string;
  name: string;
  org_type: string;
}

interface RiskApiResponse {
  risks: RiskRow[];
  summary: {
    total: number;
    critical: number;
    above_appetite: number;
    overdue_mitigations: number;
  };
}

type DecisionType = "treat" | "tolerate" | "transfer" | "terminate";

interface RiskDecision {
  id: string;
  risk_id: string;
  decision: DecisionType;
  decided_by_name?: string;
  rationale?: string;
  created_at: string;
  risk_register?: {
    risk_ref: string;
    title: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DECISION_CONFIG: Record<
  DecisionType,
  { label: string; color: string; icon: string }
> = {
  treat: {
    label: "Treat",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    icon: "wrench",
  },
  tolerate: {
    label: "Tolerate",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: "eye",
  },
  transfer: {
    label: "Transfer",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    icon: "arrow-right",
  },
  terminate: {
    label: "Terminate",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    icon: "x",
  },
};

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getRAGStatus(risks: RiskRow[]): "red" | "amber" | "green" | "no-data" {
  if (risks.length === 0) return "no-data";
  const worst = Math.max(...risks.map((r) => r.effective_score));
  if (worst >= 17) return "red";
  if (worst >= 10) return "amber";
  return "green";
}

const RAG_STYLES = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  "no-data": "bg-slate-300 dark:bg-slate-600",
};

function getRiskBandDistribution(risks: RiskRow[]) {
  const bands = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const r of risks) {
    const band = getRiskBand(r.effective_score);
    bands[band]++;
  }
  return bands;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function TrustDashboardPage() {
  const { organizationId } = useAuth();
  const router = useRouter();

  // Fetch child schools (organizations where parent_organization_id = trust org)
  const { data: schools } = useSWR<SchoolOrg[]>(
    organizationId
      ? `/api/organization/children?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // Fetch trust-wide risk heatmap data
  const { data: riskData, isLoading: risksLoading } = useSWR<RiskApiResponse>(
    organizationId
      ? `/api/risk/heatmap?organizationId=${organizationId}&includeTrust=true`
      : null,
    fetcher,
  );

  // Fetch decisions
  const { data: decisions } = useSWR<RiskDecision[]>(
    organizationId
      ? `/api/risk/decisions?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // Fetch strategic plans
  const { data: strategicPlans } = useSWR(
    organizationId
      ? `/api/strategic-plan?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // Derived data
  const allRisks = riskData?.risks ?? [];
  const summary = riskData?.summary ?? {
    total: 0,
    critical: 0,
    above_appetite: 0,
    overdue_mitigations: 0,
  };

  const heatMapMatrix = useMemo(() => getHeatMapData(allRisks), [allRisks]);

  const escalatedRisks = useMemo(
    () =>
      allRisks.filter(
        (r) => r.tier === "strategic" || r.tier === ("trust_escalated" as any),
      ),
    [allRisks],
  );

  const recentDecisions = useMemo(
    () =>
      (decisions ?? [])
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [decisions],
  );

  // Group risks by school for comparison table
  const schoolRiskMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; id: string; risks: RiskRow[] }
    >();
    for (const r of allRisks) {
      const schoolId = r.school_id ?? r.id;
      const schoolName = r.school_name ?? "Unknown School";
      if (!map.has(schoolId)) {
        map.set(schoolId, { name: schoolName, id: schoolId, risks: [] });
      }
      map.get(schoolId)!.risks.push(r);
    }
    // Also add schools with no risks
    for (const s of schools ?? []) {
      if (!map.has(s.id)) {
        map.set(s.id, { name: s.name, id: s.id, risks: [] });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [allRisks, schools]);

  // ATH 2025 compliance checks (simple heuristic based on available data)
  const athCompliance = useMemo(() => {
    const hasRiskRegister = allRisks.length > 0;
    const hasTermlyReview =
      (decisions ?? []).length > 0 &&
      daysSince(decisions?.[0]?.created_at) <= 140;
    const hasFinancialAssessment = allRisks.some((r) =>
      r.risk_categories?.includes("financial"),
    );
    const hasFraudAssessment = allRisks.some(
      (r) =>
        r.title?.toLowerCase().includes("fraud") ||
        r.description?.toLowerCase().includes("fraud"),
    );
    return {
      riskRegister: hasRiskRegister,
      termlyReview: hasTermlyReview,
      financialRisks: hasFinancialAssessment,
      fraudAssessment: hasFraudAssessment,
    };
  }, [allRisks, decisions]);

  const handlePrint = () => window.print();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Trust Risk Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Board-level view aggregating risk data across all trust schools
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" />
          Print Board Report
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <OverviewCard
          icon={<Building2 className="w-5 h-5 text-sky-500" />}
          label="Schools in Trust"
          value={schools?.length ?? 0}
          bg="bg-sky-500/10"
        />
        <OverviewCard
          icon={<Shield className="w-5 h-5 text-slate-500" />}
          label="Total Open Risks"
          value={summary.total}
          bg="bg-slate-500/10"
        />
        <OverviewCard
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          label="Critical Risks"
          value={summary.critical}
          bg="bg-rose-500/10"
          highlight={summary.critical > 0}
        />
        <OverviewCard
          icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
          label="Above Appetite"
          value={summary.above_appetite}
          bg="bg-amber-500/10"
          highlight={summary.above_appetite > 0}
        />
        <OverviewCard
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          label="Overdue Mitigations"
          value={summary.overdue_mitigations}
          bg="bg-orange-500/10"
          highlight={summary.overdue_mitigations > 0}
        />
      </div>

      {/* Main Grid: Heatmap + ATH Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Heat Map — spans 2 cols */}
        <div className="lg:col-span-2">
          {risksLoading ? (
            <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center h-[400px]">
              <div className="animate-pulse text-muted-foreground text-sm">
                Loading trust-wide risk data...
              </div>
            </div>
          ) : (
            <RiskHeatMap matrix={heatMapMatrix} />
          )}
        </div>

        {/* ATH 2025 Compliance Strip */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
            ATH 2025 Compliance
          </h3>
          <div className="space-y-3">
            <ATHCheckItem
              para="2.35"
              label="Risk register maintained"
              met={athCompliance.riskRegister}
            />
            <ATHCheckItem
              para="2.36"
              label="Board reviews risks termly"
              met={athCompliance.termlyReview}
            />
            <ATHCheckItem
              para="2.37"
              label="Financial risks assessed annually"
              met={athCompliance.financialRisks}
            />
            <ATHCheckItem
              para="2.38"
              label="Fraud risk assessment"
              met={athCompliance.fraudAssessment}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Academy Trust Handbook 2025 requires trusts to maintain a risk
              register reviewed at least termly by the board, with specific
              financial and fraud risk assessments.
            </p>
          </div>
        </div>
      </div>

      {/* School Comparison Table */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 overflow-hidden">
        <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
          School Comparison
        </h3>
        {schoolRiskMap.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No schools found in this trust. Schools are linked via the{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              parent_organization_id
            </code>{" "}
            field.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-semibold text-muted-foreground">
                    School
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground text-center">
                    Total
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground text-center">
                    Critical
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground text-center">
                    Above Appetite
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground text-center">
                    Overdue
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground">
                    Distribution
                  </th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground text-center">
                    RAG
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {schoolRiskMap.map((school) => {
                  const dist = getRiskBandDistribution(school.risks);
                  const total = school.risks.length;
                  const critical = school.risks.filter(
                    (r) => r.effective_score >= 15,
                  ).length;
                  const aboveAppetite = school.risks.filter(
                    (r) => r.above_appetite,
                  ).length;
                  const overdue = school.risks.reduce(
                    (sum, r) => sum + (r.mitigations_overdue ?? 0),
                    0,
                  );
                  const rag = getRAGStatus(school.risks);

                  return (
                    <motion.tr
                      key={school.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/risk?schoolId=${school.id}`)
                      }
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {school.name}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {total}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span
                          className={
                            critical > 0
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : ""
                          }
                        >
                          {critical}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span
                          className={
                            aboveAppetite > 0
                              ? "text-amber-600 dark:text-amber-400 font-bold"
                              : ""
                          }
                        >
                          {aboveAppetite}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span
                          className={
                            overdue > 0
                              ? "text-orange-600 dark:text-orange-400 font-bold"
                              : ""
                          }
                        >
                          {overdue}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <RiskBandBar distribution={dist} total={total} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto ${RAG_STYLES[rag]}`}
                          title={rag.toUpperCase()}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Grid: Escalation Queue + Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Escalation Queue */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Risk Escalation Queue
            </h3>
          </div>
          {escalatedRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No risks currently escalated to trust level.
            </p>
          ) : (
            <div className="space-y-3">
              {escalatedRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="border border-border/60 rounded-xl p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {risk.risk_ref}
                        </code>
                        <RiskScoreBadge
                          score={risk.effective_score}
                          size="sm"
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {risk.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {risk.school_name ?? "Trust-level"} &middot;{" "}
                        {risk.escalation_reason ?? "Above appetite threshold"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {risk.escalated_at
                          ? `${daysSince(risk.escalated_at)}d ago`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent 4T Decisions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Recent 4T Decisions
            </h3>
          </div>
          {recentDecisions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No board decisions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentDecisions.map((d) => (
                <div
                  key={d.id}
                  className="border border-border/60 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${DECISION_CONFIG[d.decision].color}`}
                        >
                          {DECISION_CONFIG[d.decision].label}
                        </span>
                        {d.risk_register && (
                          <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {d.risk_register.risk_ref}
                          </code>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {d.risk_register?.title ?? "Risk decision"}
                      </p>
                      {d.rationale && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {d.rationale}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {d.decided_by_name ?? "Board"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function OverviewCard({
  icon,
  label,
  value,
  bg,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-2xl p-4 ${highlight ? "border-rose-300 dark:border-rose-700" : "border-border"}`}
    >
      <div
        className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-black tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">
        {label}
      </p>
    </motion.div>
  );
}

function ATHCheckItem({
  para,
  label,
  met,
}: {
  para: string;
  label: string;
  met: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
      {met ? (
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">Para {para}</p>
      </div>
      <span
        className={`text-xs font-bold ${met ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
      >
        {met ? "MET" : "NOT MET"}
      </span>
    </div>
  );
}

function RiskBandBar({
  distribution,
  total,
}: {
  distribution: { low: number; medium: number; high: number; critical: number };
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="h-3 w-full rounded-full bg-muted/50" title="No risks" />
    );
  }

  const segments = [
    { count: distribution.low, color: "bg-emerald-400", label: "Low" },
    { count: distribution.medium, color: "bg-yellow-400", label: "Medium" },
    { count: distribution.high, color: "bg-orange-400", label: "High" },
    { count: distribution.critical, color: "bg-rose-500", label: "Critical" },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
      {segments.map((seg) => (
        <div
          key={seg.label}
          className={`${seg.color} transition-all`}
          style={{ width: `${(seg.count / total) * 100}%` }}
          title={`${seg.label}: ${seg.count}`}
        />
      ))}
    </div>
  );
}
