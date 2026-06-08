"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  Globe,
  HelpCircle,
  Layers3,
  Loader2,
  RefreshCw,
  Route,
  Shield,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import AppConnectionStatusCard from "@/components/connectors/AppConnectionStatusCard";
import { DataFoundationJourney } from "@/components/trust-assessor/DataFoundationJourney";
import { AssessmentSignalBridgePanel } from "@/components/ofsted/AssessmentSignalBridgePanel";
import OfstedFindingsPanel from "@/components/ofsted/OfstedFindingsPanel";
import OfstedIntelligenceBrief from "@/components/ofsted/OfstedIntelligenceBrief";
import { buildAssessmentJourneyLayers } from "@/lib/assessment-intelligence/spine-adapter";

interface ReadinessSummary {
  overall?: {
    overall_score: number;
    total_evidence: number;
    critical_gaps: number;
  };
  assessmentEvidence?: {
    batchCount: number;
    eventCount: number;
    pupilCount: number;
    latestSourceLabel: string | null;
    latestAcademicYearStart: number | null;
  };
  cohortGapEvidence?: {
    comparisons: Array<{
      schoolName: string;
      groupLabel: string;
      comparatorLabel: string;
      combinedGapPp: number | null;
      narrative: string;
    }>;
  };
}

interface FindingsSummary {
  total: number;
  setupRequired: boolean;
}

interface WebsiteScanSummary {
  session_id: string;
  website_url: string;
  trust_url: string | null;
  status: string;
  pages_found: number;
  documents_found: number;
  total_requirements: number;
  compliant_count: number;
  partial_count: number;
  not_found_count: number;
  outdated_count: number;
  compliance_percentage: number;
  avg_quality: number | null;
  avg_clarity: number | null;
  scrape_completed_at: string | null;
  assess_completed_at: string | null;
}

interface WebsiteRequirementIssue {
  requirement_key: string;
  requirement_name: string;
  status: "compliant" | "partial" | "not_found" | "outdated" | "not_assessed";
  compliance_score: number;
  quality_score: number;
  currency_status: string | null;
  evidence_urls: string[] | null;
  gaps: string[] | null;
  recommendations: string[] | null;
  red_flags: string[] | null;
}

interface WebsiteScanApiResponse {
  hasSession: boolean;
  session?: {
    id: string;
    websiteUrl: string;
    trustUrl: string | null;
    status: string;
    pagesFound: number | null;
    documentsFound: number | null;
    pagesScraped: number | null;
    documentsScraped: number | null;
    scrapeCompletedAt: string | null;
    assessCompletedAt: string | null;
  };
  stats?: {
    totalPages: number;
    totalDocuments: number;
  };
}

interface WebsiteAssessApiResponse {
  hasResults: boolean;
  summary?: {
    totalRequirements: number;
    compliantCount: number;
    partialCount: number;
    notFoundCount: number;
    outdatedCount: number;
    overallComplianceScore: number;
  };
  assessments?: Array<{
    requirementKey: string;
    requirementName: string;
    status:
      | "compliant"
      | "partial"
      | "not_found"
      | "outdated"
      | "not_assessed";
    complianceScore: number | null;
    qualityScore: number | null;
    currencyStatus: string | null;
    evidenceUrls: string[] | null;
    gaps: string[] | null;
    recommendations: string[] | null;
    redFlags: string[] | null;
  }>;
}

const demoSteps = [
  {
    title: "What Ofsted can already see",
    body: "Start with DfE and IDSR-style public outcomes, attendance and context. This is the rear-view mirror.",
    cue: "Say: this is not our judgement; this is the published starting point.",
    icon: Database,
  },
  {
    title: "What the school knows now",
    body: "Add autumn, spring and summer captures so current professional judgement sits beside historic data.",
    cue: "Say: this stops leaders waiting until statutory results are published.",
    icon: BarChart3,
  },
  {
    title: "What sits underneath the headline",
    body: "Use CTF/MIS and Assessment Creator evidence to explain SEND, EAL, FSM and pupil-level patterns safely.",
    cue: "Say: this is where Schoolgle becomes more powerful than a dashboard.",
    icon: Users,
  },
  {
    title: "What leaders do about it",
    body: "Turn material signals into Ofsted findings, assign actions, attach evidence and verify the follow-up trail.",
    cue: "Say: the product does not just report problems; it organises the response.",
    icon: ClipboardCheck,
  },
];

const sourceCards = [
  {
    title: "DfE rear-view",
    value: "Historic",
    tone: "sky",
    detail: "Published KS2, attendance, census and school context. Useful, but limited on its own.",
    icon: Database,
  },
  {
    title: "School captures",
    value: "Current",
    tone: "emerald",
    detail: "Three yearly snapshots or uploaded trackers show current teacher judgement and trajectory.",
    icon: Layers3,
  },
  {
    title: "Pupil layer",
    value: "Granular",
    tone: "violet",
    detail: "CTF/MIS and Assessment Creator records explain pupil groups, confidence and cohort stories.",
    icon: Brain,
  },
  {
    title: "Readiness loop",
    value: "Actionable",
    tone: "amber",
    detail: "Findings become tasks, evidence links and verification points for the inspection trail.",
    icon: Route,
  },
] as const;

const linkedApps = [
  {
    title: "School Improvement Assessor",
    description: "Full DfE, capture and pupil-level analysis workspace.",
    href: "/dashboard/school-improvement/trust-assessor",
    icon: BarChart3,
  },
  {
    title: "Assessment Intelligence",
    description: "Teacher judgement snapshots and assessment evidence entry.",
    href: "/dashboard/school-improvement/assessment-intelligence",
    icon: ClipboardCheck,
  },
  {
    title: "Ofsted Readiness",
    description: "Framework, evidence, actions, website scan and safeguarding.",
    href: "/dashboard/ofsted-readiness",
    icon: Shield,
  },
  {
    title: "Website Compliance",
    description: "Website statutory scan feeding Ofsted readiness evidence.",
    href: "/dashboard/website-compliance",
    icon: Globe,
  },
];

const toneClasses = {
  sky: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/25 dark:text-sky-100",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100",
  violet:
    "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900/70 dark:bg-violet-950/25 dark:text-violet-100",
  amber:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100",
};

function normaliseWebsiteScanSummary(
  scanPayload: WebsiteScanApiResponse,
  assessPayload: WebsiteAssessApiResponse,
): WebsiteScanSummary | null {
  if (!scanPayload.hasSession || !scanPayload.session) {
    return null;
  }

  const session = scanPayload.session;
  const summary = assessPayload.summary;
  const compliancePercentage = summary?.totalRequirements
    ? Math.round((summary.compliantCount / summary.totalRequirements) * 100)
    : 0;

  return {
    session_id: session.id,
    website_url: session.websiteUrl,
    trust_url: session.trustUrl,
    status: session.status,
    pages_found:
      session.pagesFound ?? session.pagesScraped ?? scanPayload.stats?.totalPages ?? 0,
    documents_found:
      session.documentsFound ??
      session.documentsScraped ??
      scanPayload.stats?.totalDocuments ??
      0,
    total_requirements: summary?.totalRequirements ?? 0,
    compliant_count: summary?.compliantCount ?? 0,
    partial_count: summary?.partialCount ?? 0,
    not_found_count: summary?.notFoundCount ?? 0,
    outdated_count: summary?.outdatedCount ?? 0,
    compliance_percentage: compliancePercentage,
    avg_quality: null,
    avg_clarity: null,
    scrape_completed_at: session.scrapeCompletedAt,
    assess_completed_at: session.assessCompletedAt,
  };
}

function normaliseWebsiteIssues(
  assessPayload: WebsiteAssessApiResponse,
): WebsiteRequirementIssue[] {
  if (!assessPayload.hasResults || !assessPayload.assessments) {
    return [];
  }

  const priorityWeight = {
    not_found: 0,
    outdated: 1,
    partial: 2,
    not_assessed: 3,
    compliant: 4,
  };

  return assessPayload.assessments
    .filter((assessment) =>
      ["partial", "not_found", "outdated"].includes(assessment.status),
    )
    .sort((left, right) => {
      const leftWeight = priorityWeight[left.status];
      const rightWeight = priorityWeight[right.status];
      if (leftWeight !== rightWeight) return leftWeight - rightWeight;
      return (left.complianceScore ?? 100) - (right.complianceScore ?? 100);
    })
    .slice(0, 8)
    .map((assessment) => ({
      requirement_key: assessment.requirementKey,
      requirement_name: assessment.requirementName,
      status: assessment.status,
      compliance_score: assessment.complianceScore ?? 0,
      quality_score: assessment.qualityScore ?? 0,
      currency_status: assessment.currencyStatus,
      evidence_urls: assessment.evidenceUrls,
      gaps: assessment.gaps,
      recommendations: assessment.recommendations,
      red_flags: assessment.redFlags,
    }));
}

export default function InspectionIntelligenceDemo() {
  const { organization, organizationId: activeOrganizationId } = useAuth();
  const organizationId = activeOrganizationId || organization?.id || "";
  const [readiness, setReadiness] = useState<ReadinessSummary | null>(null);
  const [findings, setFindings] = useState<FindingsSummary>({
    total: 0,
    setupRequired: false,
  });
  const [websiteScan, setWebsiteScan] = useState<WebsiteScanSummary | null>(
    null,
  );
  const [websiteIssues, setWebsiteIssues] = useState<WebsiteRequirementIssue[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const encodedOrganizationId = encodeURIComponent(organizationId);
      const [
        readinessResponse,
        findingsResponse,
        websiteScanResponse,
        websiteAssessResponse,
      ] = await Promise.all([
        clientAuthFetch(
          supabase,
          `/api/ofsted/readiness?organizationId=${encodedOrganizationId}`,
        ),
        clientAuthFetch(
          supabase,
          `/api/ofsted/findings?organizationId=${encodedOrganizationId}&limit=250`,
        ),
        clientAuthFetch(
          supabase,
          `/api/website-scan/v2?organizationId=${encodedOrganizationId}`,
        ),
        clientAuthFetch(
          supabase,
          `/api/website-scan/v2/assess?organizationId=${encodedOrganizationId}`,
        ),
      ]);

      const readinessPayload = await readinessResponse.json().catch(() => ({}));
      const findingsPayload = await findingsResponse.json().catch(() => ({}));
      const websiteScanPayload: WebsiteScanApiResponse =
        websiteScanResponse.ok
          ? await websiteScanResponse.json().catch(() => ({ hasSession: false }))
          : { hasSession: false };
      const websiteAssessPayload: WebsiteAssessApiResponse =
        websiteAssessResponse.ok
          ? await websiteAssessResponse
              .json()
              .catch(() => ({ hasResults: false }))
          : { hasResults: false };

      if (!readinessResponse.ok) {
        throw new Error(
          readinessPayload?.error || "Could not load readiness summary",
        );
      }

      setReadiness(readinessPayload);
      setFindings({
        total:
          typeof findingsPayload?.total === "number"
            ? findingsPayload.total
            : Array.isArray(findingsPayload?.findings)
              ? findingsPayload.findings.length
            : 0,
        setupRequired: findingsPayload?.setup_required === true,
      });
      setWebsiteScan(
        normaliseWebsiteScanSummary(websiteScanPayload, websiteAssessPayload),
      );
      setWebsiteIssues(normaliseWebsiteIssues(websiteAssessPayload));
    } catch (summaryError) {
      console.error("[Inspection Intelligence] Summary failed:", summaryError);
      setError(
        summaryError instanceof Error
          ? summaryError.message
          : "Could not load the combined inspection summary",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  const assessmentEvidence = readiness?.assessmentEvidence;
  const journeyLayers = useMemo(
    () =>
      buildAssessmentJourneyLayers({
        dfeConnected: Boolean(readiness),
        captureCount: assessmentEvidence?.batchCount ?? 0,
        pupilEventCount: assessmentEvidence?.eventCount ?? 0,
        ofstedFindingCount: findings.total,
        demoMode:
          assessmentEvidence?.latestSourceLabel
            ?.toLowerCase()
            .includes("demo") === true,
      }),
    [assessmentEvidence, findings.total, readiness],
  );

  const overallScore = readiness?.overall?.overall_score ?? 0;
  const totalEvidence =
    readiness?.overall?.total_evidence ||
    (websiteScan
      ? websiteScan.pages_found + websiteScan.documents_found
      : 0);
  const websiteActionCount = websiteScan
    ? websiteScan.partial_count +
      websiteScan.not_found_count +
      websiteScan.outdated_count
    : 0;
  const criticalGaps =
    readiness?.overall?.critical_gaps || websiteScan?.outdated_count || 0;
  const cohortSignals =
    readiness?.cohortGapEvidence?.comparisons?.length ?? 0;
  const websiteReadiness = websiteScan?.compliance_percentage ?? overallScore;
  const openIssueCount = findings.total || websiteActionCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-sky-50/40 p-6 md:p-8 dark:to-sky-950/10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <ModulePageHeader
          moduleId="improvement"
          icon={Sparkles}
          label="Prototype combined app"
          title="Inspection Intelligence"
          badge="Demo spine"
          description="One clean journey that joins School Improvement Assessor, assessment captures, pupil-level evidence, website compliance and Ofsted Readiness actions."
          actions={
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          }
        />

        <section className="overflow-hidden rounded-3xl border border-sky-200/70 bg-card shadow-sm dark:border-sky-900/50">
          <div className="relative grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.16),_transparent_34%)]" />
            <div className="relative p-6 md:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Additive demo app
              </div>
              <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                From “where are we?” to “what are we doing about it?”
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                This screen is the product story in one place. It keeps each
                data source labelled, then shows how meaningful signals move
                into Ofsted-ready evidence, tasks and follow-up.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/school-improvement/trust-assessor"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Open assessor
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/ofsted-readiness"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-accent"
                >
                  Open readiness
                  <Shield className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative border-t border-border/70 bg-background/70 p-6 backdrop-blur md:p-8 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  label={websiteScan ? "Website compliance" : "Readiness"}
                  value={`${websiteReadiness}%`}
                />
                <MetricTile label="Evidence" value={totalEvidence} />
                <MetricTile label="Open issues" value={openIssueCount} />
                <MetricTile label="Critical gaps" value={criticalGaps} />
                <MetricTile label="Cohort signals" value={cohortSignals} />
                <MetricTile
                  label="Pupil events"
                  value={assessmentEvidence?.eventCount ?? 0}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
                <div className="flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    <span className="font-bold">Demo framing:</span> existing
                    apps stay intact. This page proves the combined journey
                    before we decide whether to promote it into the live
                    product navigation.
                  </p>
                </div>
              </div>
              {error && (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sourceCards.map((card, index) => (
            <SourceCard key={card.title} card={card} index={index} />
          ))}
        </div>

        <DataFoundationJourney layers={journeyLayers} />

        <WebsiteScanSummaryPanel
          scan={websiteScan}
          issues={websiteIssues}
          findingsSetupRequired={findings.setupRequired}
        />

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              <Target className="h-4 w-4" />
              Demo talk track
            </div>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Four pauses to explain the value
            </h2>
            <div className="mt-5 space-y-3">
              {demoSteps.map((step, index) => (
                <DemoStep key={step.title} step={step} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              <FileSearch className="h-4 w-4" />
              Joined-up app links
            </div>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              The live tools underneath this demo
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {linkedApps.map((app) => (
                <LinkedAppCard key={app.title} app={app} />
              ))}
            </div>
          </div>
        </section>

        <AppConnectionStatusCard
          appKey="ofsted-readiness"
          title="Connected evidence source"
          compact
        />

        <OfstedIntelligenceBrief organizationId={organizationId} />

        <AssessmentSignalBridgePanel
          organizationId={organizationId}
          onFindingsCreated={() => setRefreshKey((value) => value + 1)}
        />

        <OfstedFindingsPanel
          key={`inspection-intelligence-findings-${refreshKey}`}
          compact
          organizationId={organizationId}
        />

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Product decision point
              </div>
              <h2 className="mt-2 text-xl font-bold text-foreground">
                If this feels right, this becomes the school-facing inspection
                workspace.
              </h2>
              <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
                LA and trust users can keep the high-level assessor overview;
                school users get this joined-up readiness workspace where
                evidence, assessment, website compliance and tasks all point at
                the same inspection story.
              </p>
            </div>
            <Link
              href="/dashboard/ofsted-readiness"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Continue in Ofsted Readiness
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function WebsiteScanSummaryPanel({
  scan,
  issues,
  findingsSetupRequired,
}: {
  scan: WebsiteScanSummary | null;
  issues: WebsiteRequirementIssue[];
  findingsSetupRequired: boolean;
}) {
  if (!scan) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-2 text-muted-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Website scan
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              No website scan is stored for this school yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run the website scan in Ofsted Readiness. Once complete, this
              page will show published evidence, missing items, out-of-date
              policies and direct website links.
            </p>
            <Link
              href="/dashboard/ofsted-readiness"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Open website scan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const actionCount =
    scan.partial_count + scan.not_found_count + scan.outdated_count;
  const assessedAt = scan.assess_completed_at
    ? new Date(scan.assess_completed_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
            <Globe className="h-4 w-4" />
            Website scan intelligence
          </div>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Published website evidence is already in the system
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            The scanner followed the school website and the detected trust site,
            stored the metadata and mapped requirements against live website
            evidence. Original website documents stay on the website or trust
            site; Schoolgle stores the scan result, evidence links and action
            signals.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100">
          <div className="text-3xl font-black">{scan.compliance_percentage}%</div>
          <div className="text-xs font-bold uppercase tracking-[0.16em]">
            Website compliance
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricTile label="Pages found" value={scan.pages_found} />
        <MetricTile label="Documents" value={scan.documents_found} />
        <MetricTile label="Requirements" value={scan.total_requirements} />
        <MetricTile label="Compliant" value={scan.compliant_count} />
        <MetricTile label="Needs action" value={actionCount} />
        <MetricTile label="Status" value={scan.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <h3 className="font-bold text-foreground">What this gives a headteacher</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              A quick view of what is already published and usable.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              Direct evidence links to school and trust pages/documents.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              A short list of out-of-date or partial items to deal with first.
            </li>
          </ul>
          <div className="mt-4 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            {assessedAt ? `Last assessed ${assessedAt}. ` : ""}
            Source: {scan.website_url}
            {scan.trust_url ? ` + ${scan.trust_url}` : ""}.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-foreground">Priority website issues</h3>
            {findingsSetupRequired && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
                Findings table not migrated
              </span>
            )}
          </div>

          {issues.length === 0 ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              No partial, missing or outdated website requirements were returned
              by the latest scan.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {issues.slice(0, 5).map((issue) => (
                <WebsiteIssueRow key={issue.requirement_key} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WebsiteIssueRow({ issue }: { issue: WebsiteRequirementIssue }) {
  const evidenceUrl = issue.evidence_urls?.find(Boolean);
  const reason =
    issue.red_flags?.[0] ||
    issue.gaps?.[0] ||
    issue.recommendations?.[0] ||
    "Review this website requirement and confirm whether the evidence is current.";

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
              {issue.status.replaceAll("_", " ")}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Score {issue.compliance_score}%
            </span>
          </div>
          <h4 className="mt-2 font-semibold text-foreground">
            {issue.requirement_name}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {reason}
          </p>
        </div>
        {evidenceUrl ? (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            Open evidence
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            No link found
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SourceCard({
  card,
  index,
}: {
  card: (typeof sourceCards)[number];
  index: number;
}) {
  const Icon = card.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className={`rounded-2xl border p-5 shadow-sm ${toneClasses[card.tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">
            {card.title}
          </p>
          <h3 className="mt-2 text-2xl font-black">{card.value}</h3>
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 text-current shadow-sm dark:bg-slate-950/30">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed opacity-80">{card.detail}</p>
    </motion.article>
  );
}

function DemoStep({
  step,
  index,
}: {
  step: {
    title: string;
    body: string;
    cue: string;
    icon: LucideIcon;
  };
  index: number;
}) {
  const Icon = step.icon;
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Pause {index + 1}
          </div>
          <h3 className="mt-1 font-bold text-foreground">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
          <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-100">
            {step.cue}
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkedAppCard({
  app,
}: {
  app: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
  };
}) {
  const Icon = app.icon;
  return (
    <Link
      href={app.href}
      className="group rounded-2xl border border-border bg-background/60 p-4 transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-card p-2 text-sky-600 shadow-sm transition group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{app.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {app.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
