"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FileQuestion,
  Link2,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import { toast } from "@/components/ui/use-toast";
import { buildPolicyAdvisoryTaskRequest } from "@/lib/compliance/policies/policy-advisory-task";
import {
  buildManagedPolicyLifecycle,
  buildManagedPolicySuiteSummary,
  getManagedPolicyPackStatus,
  type ManagedPolicyLifecycle,
} from "@/lib/compliance/policies/managed-policy-suite";
import type {
  PolicyMatchResult,
  PolicyRequirementMatch,
  UnmatchedPolicyFile,
} from "@/lib/compliance/policies/policy-matcher";
import type { PolicyReviewStatus } from "@/lib/compliance/policies/policy-review-analyser";
import type {
  PolicyQualityCheck,
  PolicyQualityRating,
  PolicyQualitySource,
} from "@/lib/compliance/policies/policy-quality-analyser";
import { getRecommendedSopsForPolicy } from "@/lib/sop-starter-library";

type PolicyMatchesPayload = {
  files: Array<{
    id: string;
    name: string;
    modifiedTime?: string;
    webViewLink?: string;
    folderPath?: string;
  }>;
  matchResult: PolicyMatchResult;
  connector: {
    id: string;
    provider: string;
    folderName: string;
    lastScanAt: string | null;
    policyFolders: string[];
  } | null;
};

type PolicyRequirementMatchPanelProps = {
  organizationId: string;
};

type PolicyDraftPreview = {
  title: string;
  summary: string;
  sourceFileName?: string;
  requirement: {
    id: string;
    canonicalName: string;
    approvalHint: string;
    reviewCycle: string;
  };
  draft: {
    title: string;
    markdown: string;
    formattedHtml: string;
    downloadFileName: string;
    sources: PolicyQualitySource[];
    assumptions: string[];
  };
};

const STATUS_STYLES = {
  matched:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  needs_confirmation:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  missing:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
};

const LEVEL_LABELS = {
  statutory: "Statutory",
  recommended: "Recommended",
  trust_required: "Trust required",
  school_custom: "School custom",
};

const REVIEW_LABELS = {
  annual: "Annual",
  two_yearly: "Every 2 years",
  three_yearly: "Every 3 years",
  on_change: "When guidance changes",
};

const DOMAIN_LABELS = {
  safeguarding: "Safeguarding",
  behaviour_attendance: "Behaviour & attendance",
  send_inclusion: "SEND & inclusion",
  curriculum: "Curriculum",
  governance: "Governance",
  hr: "HR",
  data_protection: "Data protection",
  health_safety: "Estates / H&S",
  finance: "Finance",
  admissions: "Admissions",
};

const REVIEW_STATUS_LABELS: Record<PolicyReviewStatus, string> = {
  overdue: "Overdue",
  due_30: "Due in 30 days",
  due_90: "Due in 90 days",
  current: "Current",
  no_date: "No date found",
};

const REVIEW_STATUS_STYLES: Record<PolicyReviewStatus, string> = {
  overdue:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  due_30:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  due_90:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  no_date:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
};

const QUALITY_RATING_LABELS: Record<PolicyQualityRating, string> = {
  strong: "Advisory strong",
  broadly_compliant: "Advisory mostly covered",
  weak: "Advisory weak",
  high_risk: "Advisory high risk",
  not_available: "No rule pack yet",
};

const QUALITY_RATING_STYLES: Record<PolicyQualityRating, string> = {
  strong:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  broadly_compliant:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  weak:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  high_risk:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  not_available:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
};

const SOURCE_AUTHORITY_LABELS = {
  legislation: "Legislation",
  statutory_guidance: "Statutory guidance",
  dfe_advice: "DfE advice",
  govuk_advice: "GOV.UK advice",
  sector_good_practice: "Sector good practice",
};

export default function PolicyRequirementMatchPanel({
  organizationId,
}: PolicyRequirementMatchPanelProps) {
  const [payload, setPayload] = useState<PolicyMatchesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [expandedPolicyIds, setExpandedPolicyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [creatingTaskKey, setCreatingTaskKey] = useState<string | null>(null);
  const [createdTaskKeys, setCreatedTaskKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [draftPreview, setDraftPreview] = useState<PolicyDraftPreview | null>(
    null,
  );
  const [draftLoadingPolicyId, setDraftLoadingPolicyId] = useState<
    string | null
  >(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await clientAuthFetch(
        supabase,
        `/api/compliance/policies/matches?organizationId=${encodeURIComponent(
          organizationId,
        )}&context=maintained_primary`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not match policy files");
      }

      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Policy matching failed");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const summaryCards = useMemo(() => {
    const summary = payload?.matchResult.summary;
    return [
      {
        label: "Matched",
        value: summary?.matched || 0,
        tone: "text-emerald-700 dark:text-emerald-300",
      },
      {
        label: "Check",
        value: summary?.needsConfirmation || 0,
        tone: "text-amber-700 dark:text-amber-300",
      },
      {
        label: "Missing",
        value: summary?.missing || 0,
        tone: "text-rose-700 dark:text-rose-300",
      },
      {
        label: "Custom files",
        value: summary?.unmatchedFiles || 0,
        tone: "text-slate-700 dark:text-slate-300",
      },
    ];
  }, [payload]);

  const reviewSummary = useMemo(() => {
    const statuses = payload?.matchResult.requirements.map(
      (match) => match.reviewAnalysis?.status,
    );
    return {
      overdue: statuses?.filter((status) => status === "overdue").length || 0,
      due30: statuses?.filter((status) => status === "due_30").length || 0,
      due90: statuses?.filter((status) => status === "due_90").length || 0,
      noDate: statuses?.filter((status) => status === "no_date").length || 0,
    };
  }, [payload]);

  const qualitySummary = useMemo(() => {
    const analyses = payload?.matchResult.requirements
      .map((match) => match.qualityAnalysis)
      .filter((analysis) => analysis?.available);

    return {
      scored: analyses?.length || 0,
      highRisk:
        analyses?.filter((analysis) => analysis?.rating === "high_risk").length ||
        0,
      weak: analyses?.filter((analysis) => analysis?.rating === "weak").length || 0,
    };
  }, [payload]);

  const dependencySummary = useMemo(() => {
    const analyses = payload?.matchResult.requirements
      .map((match) => match.dependencyAnalysis)
      .filter(
        (
          analysis,
        ): analysis is NonNullable<PolicyRequirementMatch["dependencyAnalysis"]> =>
          Boolean(analysis),
      );

    return {
      policiesWithLinks: analyses?.filter(
        (analysis) => analysis.linkedPolicies.length > 0,
      ).length || 0,
      missingLinks:
        analyses?.reduce(
          (total, analysis) => total + analysis.summary.missing,
          0,
        ) || 0,
    };
  }, [payload]);
  const managedSuiteSummary = useMemo(
    () =>
      payload?.matchResult.requirements
        ? buildManagedPolicySuiteSummary(payload.matchResult.requirements)
        : null,
    [payload],
  );

  if (!organizationId || loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {!organizationId
            ? "Waiting for school context..."
            : "Matching Drive policies to the maintained primary checklist..."}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Could not match policy files
              </p>
              <p className="text-sm text-amber-800/80 dark:text-amber-100/70">
                {error}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadMatches}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!payload?.connector) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-start gap-3 p-4">
          <FileQuestion className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              No connected policy folder yet
            </p>
            <p className="text-sm text-muted-foreground">
              Connect the Schoolgle folder first, then this panel will compare
              Drive policy files with the maintained primary checklist.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const matches = payload.matchResult.requirements;
  const domains = Array.from(
    new Set(matches.map((match) => match.requirement.domain)),
  );
  const visibleMatches = matches
    .filter(
      (match) =>
        domainFilter === "all" || match.requirement.domain === domainFilter,
    )
    .slice(0, 20);
  const unmatchedFiles = payload.matchResult.unmatchedFiles;
  const togglePolicy = (policyId: string) => {
    setExpandedPolicyIds((current) => {
      const next = new Set(current);
      if (next.has(policyId)) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });
  };
  const createPolicyTask = async (
    match: PolicyRequirementMatch,
    check: PolicyQualityCheck,
  ) => {
    const taskKey = getPolicyTaskKey(match, check);
    setCreatingTaskKey(taskKey);

    try {
      const response = await clientAuthFetch(supabase, "/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPolicyAdvisoryTaskRequest({
            organizationId,
            match,
            check,
          }),
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create task");
      }

      setCreatedTaskKeys((current) => new Set(current).add(taskKey));
      toast({
        title: "Policy task created",
        description:
          "The advisory finding is now in the task list for follow-up.",
      });
    } catch (err) {
      toast({
        title: "Could not create task",
        description:
          err instanceof Error
            ? err.message
            : "Please try again from the policy advisory finding.",
        variant: "destructive",
      });
    } finally {
      setCreatingTaskKey(null);
    }
  };
  const createPolicyDraftPreview = async (match: PolicyRequirementMatch) => {
    const weakAreas =
      match.qualityAnalysis?.checks
        .filter((check) => check.status !== "met")
        .map((check) => check.rule.title) || [];

    setDraftLoadingPolicyId(match.requirement.id);
    try {
      const response = await clientAuthFetch(
        supabase,
        "/api/compliance/policies/draft",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            requirementId: match.requirement.id,
            mode: match.matchedFile ? "improve_existing" : "missing_policy",
            existingFileName: match.matchedFile?.name,
            weakAreas,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create draft preview");
      }

      setDraftPreview({
        ...data,
        sourceFileName: match.matchedFile?.name,
        requirement: {
          id: match.requirement.id,
          canonicalName: match.requirement.canonicalName,
          approvalHint: match.requirement.approvalHint,
          reviewCycle: match.requirement.reviewCycle,
        },
      });
      toast({
        title: "Draft prepared",
        description:
          "Schoolgle has prepared a source-backed starter draft for human review.",
      });
    } catch (err) {
      toast({
        title: "Could not prepare draft",
        description:
          err instanceof Error
            ? err.message
            : "Please try again from the policy row.",
        variant: "destructive",
      });
    } finally {
      setDraftLoadingPolicyId(null);
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 dark:bg-purple-900/30">
                <ShieldCheck className="h-5 w-5 text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Policy requirement matching
                </CardTitle>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Drive is still the source of truth. Schoolgle maps policy files
                  to the maintained primary checklist, then samples matched policy
                  content only to find review dates and traffic-light risk.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200">
                Maintained primary
              </Badge>
              <Button variant="outline" size="sm" onClick={loadMatches}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh mapped files
              </Button>
            </div>
          </div>

          <PolicyInsightsSummary
            dependencySummary={dependencySummary}
            expanded={insightsExpanded}
            managedSuiteSummary={managedSuiteSummary}
            matches={matches}
            onCreateDraftPreview={createPolicyDraftPreview}
            onToggle={() => setInsightsExpanded((current) => !current)}
            qualitySummary={qualitySummary}
            reviewSummary={reviewSummary}
            summaryCards={summaryCards}
          />
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={domainFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDomainFilter("all")}
              className={
                domainFilter === "all" ? "bg-purple-600 hover:bg-purple-700" : ""
              }
            >
              All domains
            </Button>
            {domains.map((domain) => (
              <Button
                key={domain}
                variant={domainFilter === domain ? "default" : "outline"}
                size="sm"
                onClick={() => setDomainFilter(domain)}
                className={
                  domainFilter === domain
                    ? "bg-purple-600 hover:bg-purple-700"
                    : ""
                }
              >
                {DOMAIN_LABELS[domain]}
              </Button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-12 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:bg-slate-900/60">
              <span className="col-span-5">Expected policy</span>
              <span className="col-span-2">File status</span>
              <span className="col-span-2">Review radar</span>
              <span className="col-span-2">Intelligence</span>
              <span className="col-span-1 text-right">Details</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleMatches.map((match) => (
                <PolicyRequirementRow
                  key={match.requirement.id}
                  expanded={expandedPolicyIds.has(match.requirement.id)}
                  match={match}
                  createdTaskKeys={createdTaskKeys}
                  creatingTaskKey={creatingTaskKey}
                  draftLoadingPolicyId={draftLoadingPolicyId}
                  onCreateDraftPreview={createPolicyDraftPreview}
                  onCreateTask={createPolicyTask}
                  onToggle={() => togglePolicy(match.requirement.id)}
                />
              ))}
            </div>
          </div>

          {unmatchedFiles.length > 0 && (
            <UnmatchedFiles files={unmatchedFiles} />
          )}
        </CardContent>
      </Card>
      <PolicyDraftPreviewDialog
        organizationId={organizationId}
        preview={draftPreview}
        onOpenChange={(open) => {
          if (!open) setDraftPreview(null);
        }}
      />
    </>
  );
}

function ReviewRadarCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "orange" | "amber" | "slate";
}) {
  const toneClass = {
    rose: "text-rose-700 dark:text-rose-300",
    orange: "text-orange-700 dark:text-orange-300",
    amber: "text-amber-700 dark:text-amber-300",
    slate: "text-slate-700 dark:text-slate-300",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

type SummaryCardItem = {
  label: string;
  value: number;
  tone: string;
};

function PolicyInsightsSummary({
  dependencySummary,
  expanded,
  managedSuiteSummary,
  matches,
  onCreateDraftPreview,
  onToggle,
  qualitySummary,
  reviewSummary,
  summaryCards,
}: {
  dependencySummary: { policiesWithLinks: number; missingLinks: number };
  expanded: boolean;
  managedSuiteSummary: ReturnType<typeof buildManagedPolicySuiteSummary> | null;
  matches: PolicyRequirementMatch[];
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
  onToggle: () => void;
  qualitySummary: { scored: number; highRisk: number; weak: number };
  reviewSummary: {
    overdue: number;
    due30: number;
    due90: number;
    noDate: number;
  };
  summaryCards: SummaryCardItem[];
}) {
  const missing = summaryCards.find((item) => item.label === "Missing")?.value || 0;
  const matched = summaryCards.find((item) => item.label === "Matched")?.value || 0;
  const insightBadges = [
    { label: `${matched} matched`, tone: "emerald" },
    { label: `${missing} missing`, tone: missing > 0 ? "rose" : "slate" },
    {
      label: `${qualitySummary.weak + qualitySummary.highRisk} quality risks`,
      tone:
        qualitySummary.weak + qualitySummary.highRisk > 0 ? "amber" : "slate",
    },
    {
      label: `${dependencySummary.missingLinks} linked gaps`,
      tone: dependencySummary.missingLinks > 0 ? "blue" : "slate",
    },
    {
      label: `${managedSuiteSummary?.sourceBackedPacks || 0} source-backed packs`,
      tone: "purple",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {insightBadges.map((item) => (
            <InsightBadge key={item.label} label={item.label} tone={item.tone} />
          ))}
        </div>
        <Button
          aria-expanded={expanded}
          className="self-start lg:self-auto"
          onClick={onToggle}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronDown
            className={`mr-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Hide insight panels" : "Show insight panels"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className={`mt-1 text-2xl font-black ${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReviewRadarCard label="Overdue" value={reviewSummary.overdue} tone="rose" />
            <ReviewRadarCard label="Due in 30 days" value={reviewSummary.due30} tone="orange" />
            <ReviewRadarCard label="Due in 90 days" value={reviewSummary.due90} tone="amber" />
            <ReviewRadarCard label="No date found" value={reviewSummary.noDate} tone="slate" />
          </div>

          {managedSuiteSummary && (
            <ManagedPolicySuitePanel
              matches={matches}
              onCreateDraftPreview={onCreateDraftPreview}
              summary={managedSuiteSummary}
            />
          )}

          <CompactCheckExplainer
            dependencySummary={dependencySummary}
            qualitySummary={qualitySummary}
          />
        </div>
      )}
    </div>
  );
}

function InsightBadge({ label, tone }: { label: string; tone: string }) {
  const classes = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-300",
    slate:
      "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black ${classes}`}
    >
      {label}
    </span>
  );
}

function CompactCheckExplainer({
  dependencySummary,
  qualitySummary,
}: {
  dependencySummary: { policiesWithLinks: number; missingLinks: number };
  qualitySummary: { scored: number; highRisk: number; weak: number };
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-purple-700 dark:text-purple-300" />
          <div>
            <p className="font-semibold text-purple-950 dark:text-purple-100">
              Content quality scoring
            </p>
            <p className="text-sm text-purple-800/80 dark:text-purple-100/70">
              Behaviour Policy scoring is enabled first.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge className="bg-white text-purple-700 hover:bg-white dark:bg-purple-950 dark:text-purple-200">
                {qualitySummary.scored} scored
              </Badge>
              <Badge variant="outline">{qualitySummary.weak} weak</Badge>
              <Badge variant="outline">{qualitySummary.highRisk} high risk</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />
          <div>
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              Linked policy checks
            </p>
            <p className="text-sm text-blue-800/80 dark:text-blue-100/70">
              Finds policies referenced inside matched documents.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-white text-blue-700 hover:bg-white dark:bg-blue-950 dark:text-blue-200">
                {dependencySummary.policiesWithLinks} with links
              </Badge>
              <Badge variant="outline">
                {dependencySummary.missingLinks} missing links
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagedPolicySuitePanel({
  matches,
  onCreateDraftPreview,
  summary,
}: {
  matches: PolicyRequirementMatch[];
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
  summary: ReturnType<typeof buildManagedPolicySuiteSummary>;
}) {
  const operatingState = buildPolicyOperatingState(summary, matches);

  return (
    <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/80 to-purple-50 dark:border-indigo-900/60 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20">
      <div className="grid gap-4 p-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            Policy operating picture
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            What Schoolgle thinks this school needs next
          </h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            This is the product value: not a pretty progress bar, but a live
            operating view of source files, policy gaps, weak content and the
            next decision that removes work for the school.
          </p>
          <PolicyOperatingPanel
            onCreateDraftPreview={onCreateDraftPreview}
            state={operatingState}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SuiteMetric label="Expected policies" value={summary.totalRequirements} />
          <SuiteMetric label="Source files linked" value={summary.connectedSourceFiles} />
          <SuiteMetric label="Source-backed packs" value={summary.sourceBackedPacks} />
          <SuiteMetric label="Catalogue only" value={summary.catalogueOnlyPacks} />
        </div>
      </div>
    </div>
  );
}

type PolicyOperatingAction = {
  title: string;
  detail: string;
  tone: "rose" | "amber" | "purple" | "emerald" | "slate";
  primaryMatch: PolicyRequirementMatch | null;
  actionLabel: string;
};

type PolicyOperatingState = {
  headline: string;
  summary: string;
  riskLabel: string;
  riskTone: "rose" | "amber" | "emerald";
  actions: PolicyOperatingAction[];
  evidenceNotes: string[];
};

function buildPolicyOperatingState(
  summary: ReturnType<typeof buildManagedPolicySuiteSummary>,
  matches: PolicyRequirementMatch[],
): PolicyOperatingState {
  const missingPolicies = matches.filter((match) => match.status === "missing");
  const weakPolicies = matches.filter(
    (match) =>
      match.qualityAnalysis?.available &&
      (match.qualityAnalysis.rating === "weak" ||
        match.qualityAnalysis.rating === "high_risk"),
  );
  const linkedGapCount = matches.reduce(
    (total, match) => total + (match.dependencyAnalysis?.summary.missing || 0),
    0,
  );
  const draftablePolicy =
    weakPolicies.find(
      (match) =>
        getManagedPolicyPackStatus(match.requirement.id).status ===
        "production_ready",
    ) ||
    matches.find(
      (match) =>
        getManagedPolicyPackStatus(match.requirement.id).status ===
        "production_ready",
    ) ||
    null;

  const actions: PolicyOperatingAction[] = [];

  if (draftablePolicy) {
    const score = draftablePolicy.qualityAnalysis?.score;
    const linkedGaps = draftablePolicy.dependencyAnalysis?.summary.missing || 0;
    actions.push({
      title: `${draftablePolicy.requirement.canonicalName}: make this the first managed draft`,
      detail: [
        score ? `${score}% content score` : "Source-backed draft available",
        linkedGaps ? `${linkedGaps} linked policy gap${linkedGaps === 1 ? "" : "s"}` : null,
        draftablePolicy.matchedFile
          ? `using ${draftablePolicy.matchedFile.name}`
          : "no source file yet",
      ]
        .filter(Boolean)
        .join(" Â· "),
      tone:
        draftablePolicy.qualityAnalysis?.rating === "high_risk"
          ? "rose"
          : "purple",
      primaryMatch: draftablePolicy,
      actionLabel: draftablePolicy.matchedFile
        ? "Open improved draft"
        : "Create missing draft",
    });
  }

  if (missingPolicies.length > 0) {
    const firstMissingDraftable = missingPolicies.find(
      (match) =>
        getManagedPolicyPackStatus(match.requirement.id).status ===
        "production_ready",
    );
    actions.push({
      title: `Close ${missingPolicies.length} expected policy gap${missingPolicies.length === 1 ? "" : "s"}`,
      detail:
        "These are not matched to the connected Policies folder. Schoolgle can create starter drafts now, then leaders can adapt, approve and publish them.",
      tone: "rose",
      primaryMatch: firstMissingDraftable || null,
      actionLabel: firstMissingDraftable ? "Create first missing draft" : "Use checklist below",
    });
  }

  if (summary.baselineQueue > 0) {
    actions.push({
      title: `Build ${summary.baselineQueue} remaining source-backed packs`,
      detail:
        "These need official-source templates and rule checks before Schoolgle can generate trusted managed policies.",
      tone: "amber",
      primaryMatch: null,
      actionLabel: "Pack work queued",
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Policy suite is ready for monitoring",
      detail:
        "Connected policies can now move into review scheduling, approval evidence and website publishing.",
      tone: "emerald",
      primaryMatch: null,
      actionLabel: "Monitor suite",
    });
  }

  const riskTone =
    missingPolicies.length > 0 || linkedGapCount > 0
      ? "rose"
      : weakPolicies.length > 0
        ? "amber"
        : "emerald";

  return {
    headline:
      missingPolicies.length > 0
        ? "Policy Manager is showing a setup gap, not a finished policy suite."
        : weakPolicies.length > 0
          ? "Policy Manager has found content that needs strengthening."
          : "Policy Manager is moving into monitoring mode.",
    summary:
      missingPolicies.length > 0
        ? `${summary.connectedSourceFiles} source file${summary.connectedSourceFiles === 1 ? "" : "s"} are connected, but ${missingPolicies.length} expected policies are still missing from the mapped folder.`
        : weakPolicies.length > 0
          ? `${weakPolicies.length} policy needs a Schoolgle-managed draft before approval.`
          : "The next value is review reminders, version control and publishing evidence.",
    riskLabel:
      riskTone === "rose"
        ? "Action needed"
        : riskTone === "amber"
          ? "Improve next"
          : "Monitoring",
    riskTone,
    actions: actions.slice(0, 3),
    evidenceNotes: [
      `${summary.connectedSourceFiles} Drive source file${summary.connectedSourceFiles === 1 ? "" : "s"} linked`,
      `${summary.sourceBackedPacks} source-backed pack${summary.sourceBackedPacks === 1 ? "" : "s"} live`,
      summary.catalogueOnlyPacks > 0
        ? `${summary.catalogueOnlyPacks} catalogue-only pack${summary.catalogueOnlyPacks === 1 ? "" : "s"} still need templates/rules`
        : "All maintained-primary starter packs can generate drafts",
      linkedGapCount > 0
        ? `${linkedGapCount} linked policy gap${linkedGapCount === 1 ? "" : "s"} detected`
        : "Linked policy checks active",
    ],
  };
}

function PolicyOperatingPanel({
  onCreateDraftPreview,
  state,
}: {
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
  state: PolicyOperatingState;
}) {
  const riskClasses = {
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200",
  }[state.riskTone];

  return (
    <div className="mt-4 space-y-3">
      <motion.div
        className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/60"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className={riskClasses}>
              {state.riskLabel}
            </Badge>
            <p className="mt-2 text-base font-black text-slate-950 dark:text-white">
              {state.headline}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {state.summary}
            </p>
          </div>
          <div className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 md:min-w-72 md:grid-cols-1">
            {state.evidenceNotes.map((note) => (
              <div
                key={note}
                className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/45"
              >
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-2 lg:grid-cols-3">
        {state.actions.map((action, index) => (
          <PolicyOperatingActionCard
            action={action}
            index={index}
            key={action.title}
            onCreateDraftPreview={onCreateDraftPreview}
          />
        ))}
      </div>
    </div>
  );
}

function PolicyOperatingActionCard({
  action,
  index,
  onCreateDraftPreview,
}: {
  action: PolicyOperatingAction;
  index: number;
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
}) {
  const toneClasses = {
    rose: "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200",
    amber:
      "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200",
    purple:
      "border-purple-200 bg-purple-50/80 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/20 dark:text-purple-200",
    emerald:
      "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
  }[action.tone];

  return (
    <motion.div
      className={`flex h-full flex-col rounded-2xl border p-3 shadow-sm ${toneClasses}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/80 text-xs font-black text-slate-900 shadow-sm dark:bg-slate-950/60 dark:text-white">
          {index + 1}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.16em]">
          Next best action
        </span>
      </div>
      <p className="text-sm font-black text-slate-950 dark:text-white">
        {action.title}
      </p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        {action.detail}
      </p>
      <Button
        className="mt-3 justify-start"
        disabled={!action.primaryMatch}
        onClick={() => {
          if (action.primaryMatch) onCreateDraftPreview(action.primaryMatch);
        }}
        size="sm"
        type="button"
        variant={action.primaryMatch ? "default" : "outline"}
      >
        {action.primaryMatch ? <Wand2 className="mr-2 h-4 w-4" /> : null}
        {action.actionLabel}
      </Button>
    </motion.div>
  );
}

function SuiteMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
        {value}
      </p>
    </div>
  );
}

function PolicyRequirementRow({
  createdTaskKeys,
  creatingTaskKey,
  draftLoadingPolicyId,
  expanded,
  match,
  onCreateDraftPreview,
  onCreateTask,
  onToggle,
}: {
  createdTaskKeys: Set<string>;
  creatingTaskKey: string | null;
  draftLoadingPolicyId: string | null;
  expanded: boolean;
  match: PolicyRequirementMatch;
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
  onCreateTask: (match: PolicyRequirementMatch, check: PolicyQualityCheck) => void;
  onToggle: () => void;
}) {
  const statusLabel =
    match.status === "matched"
      ? "Matched"
      : match.status === "needs_confirmation"
        ? "Check match"
        : "Missing";
  const quality = match.qualityAnalysis?.available
    ? match.qualityAnalysis
    : null;
  const missingLinkedPolicies =
    match.dependencyAnalysis?.summary.missing || 0;
  const lifecycle = buildManagedPolicyLifecycle(match);
  const pack = getManagedPolicyPackStatus(match.requirement.id);
  const canOpenHtmlDraft = pack.status === "production_ready";

  return (
    <div className="text-sm">
      <div className="grid grid-cols-12 gap-3 px-4 py-3">
        <div className="col-span-12 md:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            {canOpenHtmlDraft ? (
              <button
                className="text-left font-semibold text-purple-700 underline-offset-4 hover:underline dark:text-purple-300"
                onClick={() => onCreateDraftPreview(match)}
                type="button"
              >
                {match.requirement.canonicalName}
              </button>
            ) : (
              <p className="font-semibold text-slate-900 dark:text-white">
                {match.requirement.canonicalName}
              </p>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {lifecycle.currentVersion.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {LEVEL_LABELS[match.requirement.level]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {DOMAIN_LABELS[match.requirement.domain]}
            </Badge>
          </div>
          <div className="mt-1 min-w-0 text-xs text-muted-foreground">
            {match.matchedFile ? (
              <span className="truncate">
                Connected: {match.matchedFile.name}
              </span>
            ) : (
              <span>{match.requirement.approvalHint}</span>
            )}
          </div>
        </div>
        <div className="col-span-6 md:col-span-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[match.status]}`}
          >
            {match.status === "matched" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {statusLabel}
          </span>
          {match.score > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {match.score}% match
            </p>
          )}
        </div>
        <div className="col-span-6 md:col-span-2">
          <ReviewStatusBadge match={match} compact />
        </div>
        <div className="col-span-10 md:col-span-2">
          <PolicyIntelligenceBadges
            linkedGapCount={missingLinkedPolicies}
            quality={quality}
          />
        </div>
        <div className="col-span-2 md:col-span-1 text-right">
          <Button
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} details for ${match.requirement.canonicalName}`}
            onClick={onToggle}
            size="sm"
            variant="ghost"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/30">
          <PolicyDraftAction
            isLoading={draftLoadingPolicyId === match.requirement.id}
            match={match}
            onCreateDraftPreview={onCreateDraftPreview}
          />
          <PolicyManagedLifecycle
            canOpenHtmlDraft={canOpenHtmlDraft}
            isLoading={draftLoadingPolicyId === match.requirement.id}
            lifecycle={lifecycle}
            match={match}
            onCreateDraftPreview={onCreateDraftPreview}
          />
          <PolicySopRecommendations match={match} />
          <PolicySourceDetails match={match} />
          <div className="grid gap-3 lg:grid-cols-2">
            <PolicyQualitySummary
              createdTaskKeys={createdTaskKeys}
              creatingTaskKey={creatingTaskKey}
              match={match}
              onCreateTask={onCreateTask}
            />
            <PolicyDependencySummary match={match} />
          </div>
        </div>
      )}
    </div>
  );
}

function PolicyDraftAction({
  isLoading,
  match,
  onCreateDraftPreview,
}: {
  isLoading: boolean;
  match: PolicyRequirementMatch;
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
}) {
  const actionLabel = match.matchedFile
    ? "Create aligned starter draft"
    : "Create draft policy";
  const packLabel =
    match.requirement.id === "behaviour-policy"
      ? "Behaviour Policy pack available"
      : `${match.requirement.canonicalName} starter pack available`;

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-3 dark:border-purple-900/60 dark:bg-slate-950/50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {packLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Generates a source-backed school-review draft. It does not edit the
            original Drive file or silently overwrite approved policy evidence.
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isLoading}
          onClick={() => onCreateDraftPreview(match)}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing draft
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              {actionLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PolicyManagedLifecycle({
  canOpenHtmlDraft,
  isLoading,
  lifecycle,
  match,
  onCreateDraftPreview,
}: {
  canOpenHtmlDraft: boolean;
  isLoading: boolean;
  lifecycle: ManagedPolicyLifecycle;
  match: PolicyRequirementMatch;
  onCreateDraftPreview: (match: PolicyRequirementMatch) => void;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
            Version and approval trail
          </p>
          <p className="mt-1 text-xs text-indigo-900/75 dark:text-indigo-100/70">
            {lifecycle.primaryAction}. Approval route:{" "}
            {lifecycle.approvalRoute}. Approved versions will keep source
            checks, change reasons, approver/date and publication status.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <VersionSeedCard title="Current" version={lifecycle.currentVersion} />
            {lifecycle.nextVersion && (
              <VersionSeedCard title="Next" version={lifecycle.nextVersion} />
            )}
          </div>
        </div>
        {canOpenHtmlDraft && (
          <Button
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading}
            onClick={() => onCreateDraftPreview(match)}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening HTML
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {lifecycle.htmlViewerLabel}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {lifecycle.auditTrail.map((event) => (
          <div
            key={`${match.requirement.id}:${event.title}`}
            className="rounded-lg border border-white/80 bg-white/85 p-2 text-xs dark:border-slate-800 dark:bg-slate-950/50"
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              {event.title}
            </p>
            <p className="mt-1 text-muted-foreground">{event.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicySopRecommendations({
  match,
}: {
  match: PolicyRequirementMatch;
}) {
  const sops = getRecommendedSopsForPolicy(match.requirement.id);

  if (!sops.length) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
            Linked internal procedures
          </p>
          <p className="mt-1 text-xs text-emerald-900/75 dark:text-emerald-100/70">
            Policies say what should happen. These starter SOPs turn it into
            school-specific routines that Ed can personalise with local roles,
            timings and systems before staff use them.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a
            href={`/dashboard/sops?policy=${encodeURIComponent(
              match.requirement.id,
            )}`}
          >
            Create linked SOPs
          </a>
        </Button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {sops.slice(0, 4).map((sop) => (
          <div
            key={`${match.requirement.id}:${sop.template_id}`}
            className="rounded-lg border border-white/80 bg-white/85 p-2 text-xs dark:border-slate-800 dark:bg-slate-950/50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                {sop.name}
              </p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {sop.frequency.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-muted-foreground">
              {sop.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <span>{sop.steps.length} steps</span>
              <span>·</span>
              <span>{sop.setup_questions.length} Ed questions</span>
              <span>·</span>
              <span>{sop.source_refs.length} sources</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionSeedCard({
  title,
  version,
}: {
  title: string;
  version: ManagedPolicyLifecycle["currentVersion"];
}) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/85 p-2 text-xs dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <Badge variant="outline" className="text-[10px]">
          {version.label}
        </Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{version.description}</p>
    </div>
  );
}

function PolicyIntelligenceBadges({
  linkedGapCount,
  quality,
}: {
  linkedGapCount: number;
  quality: NonNullable<PolicyRequirementMatch["qualityAnalysis"]> | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {quality?.available && (
        <span
          className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${QUALITY_RATING_STYLES[quality.rating]}`}
        >
          {quality.score}% {QUALITY_RATING_LABELS[quality.rating]}
        </span>
      )}
      {linkedGapCount > 0 && (
        <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {linkedGapCount} linked gap{linkedGapCount === 1 ? "" : "s"}
        </span>
      )}
      {!quality?.available && linkedGapCount === 0 && (
        <span className="text-xs text-muted-foreground">Advisory check pending</span>
      )}
    </div>
  );
}

function ReviewStatusBadge({
  compact = false,
  match,
}: {
  compact?: boolean;
  match: PolicyRequirementMatch;
}) {
  const analysis = match.reviewAnalysis;

  if (!analysis) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        Not scanned
      </span>
    );
  }

  const dueDate =
    analysis.extractedDates.nextReviewDate || analysis.derivedNextReviewDate;

  return (
    <div>
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${REVIEW_STATUS_STYLES[analysis.status]}`}
      >
        {REVIEW_STATUS_LABELS[analysis.status]}
      </span>
      {dueDate && (
        <p className="mt-1 text-xs text-muted-foreground">
          Due {formatShortDate(dueDate)}
        </p>
      )}
      {!compact && (
        <p className="mt-1 text-xs text-muted-foreground">
          Default: {REVIEW_LABELS[match.requirement.reviewCycle]}
        </p>
      )}
    </div>
  );
}

function PolicySourceDetails({ match }: { match: PolicyRequirementMatch }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/50">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Source file
        </p>
        {match.matchedFile ? (
          <div className="mt-2 space-y-1 text-sm">
            <a
              href={match.matchedFile.webViewLink || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-1 font-medium text-purple-700 hover:underline dark:text-purple-300"
            >
              <span>{match.matchedFile.name}</span>
              {match.matchedFile.webViewLink && (
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
            </a>
            {match.matchedFile.folderPath && (
              <p className="text-xs text-muted-foreground">
                {match.matchedFile.folderPath}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No Drive file matched yet.
          </p>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/50">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Review basis
        </p>
        <div className="mt-2">
          <ReviewStatusBadge match={match} />
        </div>
        {match.reviewAnalysis?.tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {match.reviewAnalysis.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/50">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Approval route
        </p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {match.requirement.approvalHint}
        </p>
      </div>
    </div>
  );
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PolicyQualitySummary({
  createdTaskKeys,
  creatingTaskKey,
  match,
  onCreateTask,
}: {
  createdTaskKeys: Set<string>;
  creatingTaskKey: string | null;
  match: PolicyRequirementMatch;
  onCreateTask: (match: PolicyRequirementMatch, check: PolicyQualityCheck) => void;
}) {
  const analysis = match.qualityAnalysis;

  if (!analysis || !analysis.available) {
    if (match.matchedFile && match.requirement.id === "behaviour-policy") {
      return null;
    }

    return match.matchedFile ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground dark:border-slate-800 dark:bg-slate-900/50">
        No content rule pack for this policy yet.
      </div>
    ) : null;
  }

  const missingChecks = analysis.checks.filter((check) => check.status !== "met");

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Policy content score
          </span>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${QUALITY_RATING_STYLES[analysis.rating]}`}
          >
            {analysis.score}% Â· {QUALITY_RATING_LABELS[analysis.rating]}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {analysis.rulePackName}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {analysis.summary.met} met Â· {analysis.summary.partial} partial Â·{" "}
          {analysis.summary.missing} missing
        </p>
      </div>

      {missingChecks.length > 0 ? (
        <div className="mt-3 space-y-3">
          <PolicySourcesPanel
            sources={uniqueSources(
              missingChecks.flatMap((check) => check.rule.sourceRefs),
            )}
          />
          <div className="grid gap-2 md:grid-cols-2">
            {missingChecks.slice(0, 4).map((check) => (
              <div
                key={check.rule.id}
                className="rounded-lg border border-white bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {check.rule.title}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {check.rule.severity.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {check.rule.description}
                </p>
                <p className="mt-2 font-medium text-slate-700 dark:text-slate-200">
                  {check.rule.missingAction}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {check.rule.sourceRefs.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-purple-300 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {SOURCE_AUTHORITY_LABELS[source.authority]}
                    </a>
                  ))}
                </div>
                <div className="mt-3">
                  <PolicyTaskButton
                    check={check}
                    createdTaskKeys={createdTaskKeys}
                    creatingTaskKey={creatingTaskKey}
                    match={match}
                    onCreateTask={onCreateTask}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <PolicySourcesPanel
            sources={uniqueSources(
              analysis.checks.flatMap((check) => check.rule.sourceRefs),
            )}
          />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            No missing rule-pack checks found.
          </p>
        </div>
      )}
    </div>
  );
}

function PolicyTaskButton({
  check,
  createdTaskKeys,
  creatingTaskKey,
  match,
  onCreateTask,
}: {
  check: PolicyQualityCheck;
  createdTaskKeys: Set<string>;
  creatingTaskKey: string | null;
  match: PolicyRequirementMatch;
  onCreateTask: (match: PolicyRequirementMatch, check: PolicyQualityCheck) => void;
}) {
  const taskKey = getPolicyTaskKey(match, check);
  const isCreating = creatingTaskKey === taskKey;
  const isCreated = createdTaskKeys.has(taskKey);

  return (
    <Button
      disabled={isCreating || isCreated}
      onClick={() => onCreateTask(match, check)}
      size="sm"
      variant={isCreated ? "outline" : "default"}
      className={
        isCreated ? "h-8 text-xs" : "h-8 bg-purple-600 text-xs hover:bg-purple-700"
      }
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          Creating task
        </>
      ) : isCreated ? (
        <>
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Task created
        </>
      ) : (
        "Create task"
      )}
    </Button>
  );
}

function getPolicyTaskKey(
  match: PolicyRequirementMatch,
  check: PolicyQualityCheck,
): string {
  return `${match.requirement.id}:${check.rule.id}`;
}

function PolicySourcesPanel({ sources }: { sources: PolicyQualitySource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="rounded-lg border border-purple-100 bg-white p-3 text-xs dark:border-purple-900/60 dark:bg-slate-950/50">
      <p className="font-semibold text-slate-900 dark:text-white">
        Sources checked
      </p>
      <p className="mt-1 text-muted-foreground">
        These are the official or authoritative sources used by this rule pack.
      </p>
      <div className="mt-2 grid gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {source.title}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {SOURCE_AUTHORITY_LABELS[source.authority]}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {source.publisher} Â· checked {formatShortDate(source.lastChecked)}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function uniqueSources(sources: PolicyQualitySource[]): PolicyQualitySource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.id)) return false;
    seen.add(source.id);
    return true;
  });
}

function PolicyDependencySummary({ match }: { match: PolicyRequirementMatch }) {
  const analysis = match.dependencyAnalysis;

  if (!analysis || analysis.linkedPolicies.length === 0) return null;

  const missing = analysis.linkedPolicies.filter(
    (policy) => policy.status === "missing",
  );
  const present = analysis.linkedPolicies.filter(
    (policy) => policy.status === "present",
  );

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">
            Linked policies referenced
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-100/70">
            {present.length} present Â· {missing.length} missing
          </p>
        </div>
        {missing.length > 0 && (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300">
            Linked-policy gaps
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {analysis.linkedPolicies.map((policy) => (
          <span
            key={policy.requirementId}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
              policy.status === "present"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                : policy.status === "needs_confirmation"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
            }`}
            title={`Referenced as "${policy.matchedAlias}"`}
          >
            {policy.title}:{" "}
            {policy.status === "present"
              ? "present"
              : policy.status === "needs_confirmation"
                ? "check"
                : "missing"}
          </span>
        ))}
      </div>
    </div>
  );
}

function UnmatchedFiles({ files }: { files: UnmatchedPolicyFile[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-start gap-3">
        <FileQuestion className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            Custom or unrecognised policy files
          </p>
          <p className="text-sm text-muted-foreground">
            These files are in the policy folders but do not yet map to a
            standard requirement. They can become school custom policies later.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {files.slice(0, 8).map((file) => (
              <Badge key={file.id} variant="outline" className="max-w-full">
                <span className="truncate">{file.name}</span>
              </Badge>
            ))}
            {files.length > 8 && (
              <Badge variant="outline">+{files.length - 8} more</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyDraftPreviewDialog({
  onOpenChange,
  organizationId,
  preview,
}: {
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  preview: PolicyDraftPreview | null;
}) {
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{
    itemId: string;
    versionId: string;
    semanticVersion: string;
  } | null>(null);

  useEffect(() => {
    setSavingDraft(false);
    setSavedDraft(null);
  }, [preview?.draft.downloadFileName]);

  const copyDraft = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview.draft.markdown);
    toast({
      title: "Draft copied",
      description: "Paste it into a Word or Google Doc for review.",
    });
  };
  const downloadWordDraft = () => {
    if (!preview) return;
    const blob = new Blob([preview.draft.formattedHtml], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = preview.draft.downloadFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const printDraft = () => {
    if (!preview) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print or save this policy as PDF.",
        variant: "destructive",
      });
      return;
    }
    printWindow.document.open();
    printWindow.document.write(preview.draft.formattedHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const saveDraftToSchoolgle = async () => {
    if (!preview) return;

    setSavingDraft(true);
    try {
      const response = await clientAuthFetch(
        supabase,
        "/api/compliance/policies/draft/schoolgle",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            requirementId: preview.requirement.id,
            policyTitle: preview.requirement.canonicalName,
            draftTitle: preview.title,
            formattedHtml: preview.draft.formattedHtml,
            markdown: preview.draft.markdown,
            sourceFileName: preview.sourceFileName,
            approvalRoute: preview.requirement.approvalHint,
            reviewCycle: preview.requirement.reviewCycle,
            sources: preview.draft.sources,
            assumptions: preview.draft.assumptions,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save draft to Schoolgle");
      }

      setSavedDraft({
        itemId: data.item.id,
        versionId: data.version.id,
        semanticVersion: data.semanticVersion,
      });
      toast({
        title: "Schoolgle draft saved",
        description:
          "A managed draft version was created. The original Drive policy was not changed.",
      });
    } catch (err) {
      toast({
        title: "Could not save draft",
        description:
          err instanceof Error
            ? err.message
            : "Please check permissions and try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <Dialog open={Boolean(preview)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        {preview && (
          <>
            <DialogHeader>
              <DialogTitle>{preview.title}</DialogTitle>
              <DialogDescription>{preview.summary}</DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              Original Drive files have not been changed. This is a review
              draft based on the {preview.requirement.canonicalName} pack and should be
              saved as a Schoolgle draft before approval or publication.
            </div>

            {savedDraft && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">Saved as a Schoolgle draft</p>
                    <p>
                      {savedDraft.semanticVersion} is now stored as a managed
                      policy version. The original Drive policy remains
                      untouched until the school approves and publishes a
                      replacement.
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200">
                    Version stored
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Assumptions
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-200">
                  {preview.draft.assumptions.map((assumption) => (
                    <li key={assumption}>â€¢ {assumption}</li>
                  ))}
                </ul>
              </div>
              <PolicySourcesPanel sources={preview.draft.sources} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Formatted policy preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clean Schoolgle-style layout with cover page, contents,
                    policy details, sources and SOP starter.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={savingDraft || Boolean(savedDraft)}
                    onClick={saveDraftToSchoolgle}
                  >
                    {savingDraft ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : savedDraft ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Saved to Schoolgle
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Save as Schoolgle draft
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={printDraft}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print / PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadWordDraft}>
                    <Download className="mr-2 h-4 w-4" />
                    Word file
                  </Button>
                </div>
              </div>
              <iframe
                className="h-[560px] w-full rounded-lg border border-slate-200 bg-white shadow-inner dark:border-slate-700"
                srcDoc={preview.draft.formattedHtml}
                title={`${preview.draft.title} formatted preview`}
              />
            </div>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                Plain text fallback
              </summary>
              <Textarea
                readOnly
                className="mt-3 min-h-[260px] font-mono text-xs"
                value={preview.draft.markdown}
              />
            </details>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={copyDraft}>
                <Copy className="mr-2 h-4 w-4" />
                Copy draft
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
