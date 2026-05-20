"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Link as LinkIcon,
  Shield,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────

export interface RequirementAssessment {
  requirementKey: string;
  requirementName: string;
  category: string;
  status: "compliant" | "partial" | "not_found" | "outdated";
  complianceScore: number;
  qualityScore?: number;
  clarityScore?: number;
  currencyStatus?: string;
  legislationCurrent?: boolean;
  evidenceUrls?: string[];
  evidenceQuotes?: string[];
  gaps?: string[];
  recommendations?: string[];
  redFlags?: string[];
  confidence?: number;
  aiModelUsed?: string;
  assessedAt?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  compliant: number;
  partial: number;
  notFound: number;
  outdated: number;
}

export interface ComplianceSummary {
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  notFoundCount: number;
  outdatedCount: number;
  overallComplianceScore: number;
}

export interface ScanSession {
  id: string;
  websiteUrl: string;
  trustUrl?: string;
  schoolType?: string;
  schoolPhase?: string;
  isChurchSchool?: boolean;
  status: string;
  pagesFound?: number;
  documentsFound?: number;
  scrapeCompletedAt?: string;
  assessCompletedAt?: string;
}

interface WebsiteComplianceResultsProps {
  summary: ComplianceSummary;
  categorySummary: CategorySummary[];
  assessments: RequirementAssessment[];
  session?: ScanSession;
  /** Compact mode hides some detail — used in Ofsted readiness tab */
  compact?: boolean;
}

// ─── Category labels ──────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  identity: "School Identity & Contact",
  admissions: "Admissions",
  curriculum: "Curriculum",
  send: "SEND",
  pupil_premium: "Pupil Premium",
  pe_sport_premium: "PE & Sport Premium",
  governance: "Governance",
  safeguarding: "Safeguarding",
  online_safety: "Online Safety",
  policies: "Policies",
  performance_data: "Performance Data",
  financial: "Financial Information",
  equality: "Equality & Diversity",
  ofsted: "Ofsted",
  careers: "Careers (Secondary)",
  accessibility: "Accessibility",
  siams: "Church School (SIAMS)",
};

const STATUS_CONFIG = {
  compliant: {
    icon: CheckCircle2,
    label: "Compliant",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "#10b981",
  },
  partial: {
    icon: AlertTriangle,
    label: "Partial",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    ring: "#f59e0b",
  },
  not_found: {
    icon: XCircle,
    label: "Not Found",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    ring: "#ef4444",
  },
  outdated: {
    icon: Clock,
    label: "Outdated",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    ring: "#ea580c",
  },
};

function prettifyUrlPart(value: string): string {
  return decodeURIComponent(value)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getEvidenceUrlDetails(url: string, index: number) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    const filename = pathname.split("/").pop() || parsed.hostname;
    const extension = filename.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
    const isDocument = Boolean(extension && extension !== "HTML");
    const label = isDocument
      ? prettifyUrlPart(filename)
      : prettifyUrlPart(pathname.split("/").filter(Boolean).pop() || parsed.hostname);

    return {
      host: parsed.hostname.replace(/^www\./, ""),
      label: label || `Evidence ${index + 1}`,
      typeLabel: isDocument ? `${extension} document` : "Website page",
      isDocument,
    };
  } catch {
    return {
      host: "External source",
      label: `Evidence ${index + 1}`,
      typeLabel: "Link",
      isDocument: false,
    };
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to a temporary text area below.
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

function EvidenceLinkCard({ url, index }: { url: string; index: number }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const details = getEvidenceUrlDetails(url, index);
  const Icon = details.isDocument ? FileText : LinkIcon;

  const handleCopy = async () => {
    const copiedOk = await copyToClipboard(url);
    setCopyState(copiedOk ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 2400);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{details.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {details.typeLabel} · {details.host}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={url}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-blue-700"
        >
          Open here
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
        >
          New tab
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
        >
          {copyState === "copied" ? (
            <>
              Copied
              <Check className="h-3 w-3 text-emerald-600" />
            </>
          ) : copyState === "failed" ? (
            <>
              Copy failed
              <AlertTriangle className="h-3 w-3 text-amber-600" />
            </>
          ) : (
            <>
              Copy link
              <Copy className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
      {copyState === "failed" && (
        <p className="mt-2 break-all rounded-md bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">
          {url}
        </p>
      )}
    </div>
  );
}

function PlainEnglishSummary({ summary }: { summary: ComplianceSummary }) {
  const actionCount =
    summary.outdatedCount + summary.notFoundCount + summary.partialCount;

  return (
    <Card className="border border-blue-200/70 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Plain English summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Checked {summary.totalRequirements} website requirements.{" "}
          <strong className="text-foreground">
            {summary.compliantCount} look compliant
          </strong>
          , {summary.outdatedCount} appear outdated, {summary.notFoundCount} are
          missing, and {summary.partialCount} need more detail.
        </p>
        {actionCount > 0 ? (
          <p>
            Start with the red/orange rows. “Outdated” means the document exists
            but the date evidence suggests it needs review or republication.
            Use <strong className="text-foreground">Open here</strong> to check
            the source in this browser, or{" "}
            <strong className="text-foreground">Copy link</strong> to share it.
          </p>
        ) : (
          <p>
            No immediate website compliance actions were detected in this scan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Score Ring ───────────────────────────────────────────────

function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black"
          style={{ color: getColor(score) }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}%
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">
          compliant
        </span>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg} border ${config.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ─── Category Bar ─────────────────────────────────────────────

function CategoryBar({ category }: { category: CategorySummary }) {
  const total = category.total;
  if (total === 0) return null;

  const segments = [
    { count: category.compliant, color: "#10b981" },
    { count: category.partial, color: "#f59e0b" },
    { count: category.outdated, color: "#ea580c" },
    { count: category.notFound, color: "#ef4444" },
  ];

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
      {segments.map((seg, i) =>
        seg.count > 0 ? (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.count / total) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ backgroundColor: seg.color }}
          />
        ) : null,
      )}
    </div>
  );
}

// ─── Requirement Row ──────────────────────────────────────────

function RequirementRow({
  assessment,
  compact,
}: {
  assessment: RequirementAssessment;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail =
    (assessment.gaps && assessment.gaps.length > 0) ||
    (assessment.recommendations && assessment.recommendations.length > 0) ||
    (assessment.evidenceUrls && assessment.evidenceUrls.length > 0) ||
    (assessment.redFlags && assessment.redFlags.length > 0);

  return (
    <div
      className={`border-b border-border/50 last:border-b-0 ${
        assessment.status === "not_found" ? "opacity-80" : ""
      }`}
    >
      <button
        onClick={() => hasDetail && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        disabled={!hasDetail}
      >
        <StatusBadge status={assessment.status} />
        <span className="flex-1 text-sm font-medium text-foreground">
          {assessment.requirementName}
        </span>
        {!compact && assessment.complianceScore > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {assessment.complianceScore}/100
          </span>
        )}
        {hasDetail && (
          <span className="text-muted-foreground">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-8 space-y-3">
              {/* Evidence URLs */}
              {assessment.evidenceUrls &&
                assessment.evidenceUrls.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Evidence links:
                    </p>
                    <div className="space-y-2">
                      {assessment.evidenceUrls
                        .slice(0, compact ? 4 : 6)
                        .map((url, index) => (
                          <EvidenceLinkCard
                            key={`${url}-${index}`}
                            url={url}
                            index={index}
                          />
                        ))}
                    </div>
                    {assessment.evidenceUrls.length > (compact ? 4 : 6) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {assessment.evidenceUrls.length - (compact ? 4 : 6)}{" "}
                        more evidence links are stored for this requirement.
                      </p>
                    )}
                  </div>
                )}

              {/* Red flags */}
              {assessment.redFlags && assessment.redFlags.length > 0 && (
                <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-2.5 border border-rose-200 dark:border-rose-800">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                    Red Flags
                  </p>
                  <ul className="text-xs text-rose-600 dark:text-rose-300 space-y-0.5">
                    {assessment.redFlags.map((f, i) => (
                      <li key={i}>- {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {assessment.gaps && assessment.gaps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Gaps identified:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {assessment.gaps.map((g, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-amber-500 mt-0.5">-</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {assessment.recommendations &&
                assessment.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Recommendations:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {assessment.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-blue-500 mt-0.5">-</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function WebsiteComplianceResults({
  summary,
  categorySummary,
  assessments,
  session,
  compact = false,
}: WebsiteComplianceResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group assessments by category
  const grouped: Record<string, RequirementAssessment[]> = {};
  for (const a of assessments) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  // Sort categories: worst first (most not_found)
  const sortedCategories = categorySummary.sort(
    (a, b) => b.notFound + b.outdated - (a.notFound + a.outdated),
  );

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score ring */}
        <Card className="border border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <ScoreRing score={summary.overallComplianceScore} />
            {session && (
              <p className="text-xs text-muted-foreground text-center">
                {session.websiteUrl.replace(/^https?:\/\//, "")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Requirements Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                status: "compliant" as const,
                count: summary.compliantCount,
              },
              { status: "partial" as const, count: summary.partialCount },
              { status: "outdated" as const, count: summary.outdatedCount },
              {
                status: "not_found" as const,
                count: summary.notFoundCount,
              },
            ].map(({ status, count }) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const pct =
                summary.totalRequirements > 0
                  ? Math.round((count / summary.totalRequirements) * 100)
                  : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-sm font-medium flex-1">
                    {config.label}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {count}
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border/50 flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">Total checked</span>
              <span className="text-sm font-bold tabular-nums">
                {summary.totalRequirements}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Scan info */}
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Scan Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {session && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School type</span>
                  <span className="font-medium capitalize">
                    {session.schoolType || "Auto-detected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase</span>
                  <span className="font-medium capitalize">
                    {session.schoolPhase?.replace("_", " ") || "All"}
                  </span>
                </div>
                {session.isChurchSchool && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Church school</span>
                    <span className="font-medium text-amber-600">
                      Yes (SIAMS)
                    </span>
                  </div>
                )}
                {session.pagesFound && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages crawled</span>
                    <span className="font-medium tabular-nums">
                      {session.pagesFound}
                    </span>
                  </div>
                )}
                {session.documentsFound && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Documents found
                    </span>
                    <span className="font-medium tabular-nums">
                      {session.documentsFound}
                    </span>
                  </div>
                )}
                {session.trustUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trust site</span>
                    <a
                      href={session.trustUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate max-w-[160px]"
                    >
                      {session.trustUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {session.assessCompletedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last assessed</span>
                    <span className="font-medium text-xs">
                      {new Date(session.assessCompletedAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
            {!session && (
              <p className="text-muted-foreground text-xs">
                No session info available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <PlainEnglishSummary summary={summary} />

      {/* Priority actions callout */}
      {summary.notFoundCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-4"
        >
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                {summary.notFoundCount} statutory requirement
                {summary.notFoundCount !== 1 ? "s" : ""} missing from your
                website
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-1">
                These are legal requirements. Schools can be marked down by
                Ofsted for missing statutory website content.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category sections */}
      <div className="space-y-3">
        {sortedCategories.map((cat) => {
          const isExpanded = expandedCategories.has(cat.category);
          const items = grouped[cat.category] || [];
          const allCompliant = cat.compliant === cat.total;

          return (
            <Card
              key={cat.category}
              className={`border overflow-hidden ${
                allCompliant
                  ? "border-emerald-200 dark:border-emerald-800/50"
                  : cat.notFound > 0
                    ? "border-rose-200 dark:border-rose-800/50"
                    : "border-border/50"
              }`}
            >
              <button
                onClick={() => toggleCategory(cat.category)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
                <span className="text-sm font-semibold flex-1 text-left">
                  {CATEGORY_LABELS[cat.category] || cat.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {cat.compliant}/{cat.total}
                  </span>
                  <div className="w-24">
                    <CategoryBar category={cat} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border/50"
                  >
                    {items.map((a) => (
                      <RequirementRow
                        key={a.requirementKey}
                        assessment={a}
                        compact={compact}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          Assessed against School Information Regulations 2025, Academy Trust
          Handbook 2025, KCSIE 2025, and SEND Code of Practice 2015.
        </div>
      )}
    </div>
  );
}
