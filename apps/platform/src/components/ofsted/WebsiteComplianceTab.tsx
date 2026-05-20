"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WebsiteComplianceResults, {
  type ComplianceSummary,
  type CategorySummary,
  type RequirementAssessment,
  type ScanSession,
} from "@/components/website-compliance/WebsiteComplianceResults";

interface WebsiteComplianceTabProps {
  organizationId: string;
}

type TabState = "loading" | "no_scan" | "has_results" | "scanning" | "error";

interface EvidenceRoutingTopRoute {
  sourceUrl: string;
  sourceTitle: string;
  sourceOwner: "school" | "trust" | "external";
  foundOnUrl: string | null;
  requirementKey: string | null;
  requirementName: string | null;
  ofstedCategoryId: string;
  subcategoryId: string;
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  evidenceRole: "direct" | "supporting" | "context";
  signals: string[];
}

interface EvidenceRoutingSummary {
  totalRoutes: number;
  byCategory: Record<string, number>;
  bySourceOwner: Record<string, number>;
  directEvidence: number;
  needsQualityAssessment: number;
  topRoutes: EvidenceRoutingTopRoute[];
}

interface WebsiteScanApiSession {
  id: string;
  websiteUrl?: string | null;
  trustUrl?: string | null;
  schoolType?: ScanSession["schoolType"];
  schoolPhase?: string | null;
  isChurchSchool?: boolean | null;
  status?: string | null;
  progress?: {
    message?: string;
    evidenceRouting?: EvidenceRoutingSummary;
  } | null;
  pagesFound?: number | null;
  documentsFound?: number | null;
  pagesScraped?: number | null;
  documentsScraped?: number | null;
  assessCompletedAt?: string | null;
}

interface WebsiteScanApiData {
  hasSession?: boolean;
  session?: WebsiteScanApiSession;
  stats?: {
    totalPages?: number | null;
    totalDocuments?: number | null;
  };
  evidenceRouting?: EvidenceRoutingSummary | null;
}

const OFSTED_AREA_LABELS: Record<string, string> = {
  inclusion: "Inclusion",
  "curriculum-teaching": "Curriculum and teaching",
  achievement: "Achievement",
  "attendance-behaviour": "Attendance and behaviour",
  "personal-development": "Personal development and wellbeing",
  "leadership-governance": "Leadership and governance",
};

async function copyTextToClipboard(text: string): Promise<boolean> {
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

async function authFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  let accessToken: string | null | undefined;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token;
    if (accessToken) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return fetch(url, { ...options, headers });
}

export default function WebsiteComplianceTab({
  organizationId,
}: WebsiteComplianceTabProps) {
  const [state, setState] = useState<TabState>("loading");
  const [session, setSession] = useState<ScanSession | null>(null);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [assessments, setAssessments] = useState<RequirementAssessment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [scanProgress, setScanProgress] = useState("");
  const [evidenceRouting, setEvidenceRouting] =
    useState<EvidenceRoutingSummary | null>(null);

  const applySessionData = useCallback((data?: WebsiteScanApiData | null) => {
    const apiSession = data?.session;
    if (!data?.hasSession || !apiSession) return false;

    setSession({
      id: apiSession.id,
      websiteUrl: apiSession.websiteUrl || "",
      trustUrl: apiSession.trustUrl || undefined,
      schoolType: apiSession.schoolType,
      schoolPhase: apiSession.schoolPhase || "",
      isChurchSchool: Boolean(apiSession.isChurchSchool),
      status: apiSession.status || "",
      pagesFound:
        apiSession.pagesScraped ??
        apiSession.pagesFound ??
        data.stats?.totalPages ??
        0,
      documentsFound:
        apiSession.documentsScraped ??
        apiSession.documentsFound ??
        data.stats?.totalDocuments ??
        0,
      assessCompletedAt: apiSession.assessCompletedAt || undefined,
    });
    setEvidenceRouting(
      data.evidenceRouting || apiSession.progress?.evidenceRouting || null,
    );
    setScanUrl(apiSession.websiteUrl || "");

    if (apiSession.status === "scraping" || apiSession.status === "assessing") {
      setScanProgress(apiSession.progress?.message || "Scan in progress...");
      setState("scanning");
    } else {
      setState("has_results");
    }

    return true;
  }, []);

  // Load existing results
  const loadResults = useCallback(async () => {
    if (!organizationId) {
      setState("loading");
      return;
    }

    try {
      const initialSessionRes = await authFetch(
        `/api/website-scan/v2?organizationId=${organizationId}&includeEvidenceRoutes=true`,
      );
      if (!initialSessionRes.ok) {
        const payload = await initialSessionRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch website scan session");
      }
      const initialSessionData =
        (await initialSessionRes.json()) as WebsiteScanApiData;

      if (!applySessionData(initialSessionData)) {
        setState("no_scan");
      }

      // Get latest assessment results
      const res = await authFetch(
        `/api/website-scan/v2/assess?organizationId=${organizationId}`,
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch results");
      }

      const data = await res.json();
      const result = data;

      if (!result?.hasResults) {
        // Check if there's a session at all
        const sessionRes = await authFetch(
          `/api/website-scan/v2?organizationId=${organizationId}&includeEvidenceRoutes=true`,
        );
        if (!sessionRes.ok) {
          const payload = await sessionRes.json().catch(() => ({}));
          throw new Error(
            payload.error || "Failed to fetch website scan session",
          );
        }
        const sessionData = (await sessionRes.json()) as WebsiteScanApiData;

        if (applySessionData(sessionData)) return;
        if (applySessionData(initialSessionData)) return;

        setState("no_scan");
        return;
      }

      // We have results
      setSummary(result.summary);
      setCategorySummary(result.categorySummary || []);
      setAssessments(result.assessments || []);

      // Also get session info
      const sessionRes = await authFetch(
        `/api/website-scan/v2?organizationId=${organizationId}&includeEvidenceRoutes=true`,
      );
      if (!sessionRes.ok) {
        const payload = await sessionRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch website scan session");
      }
      const sessionData = (await sessionRes.json()) as WebsiteScanApiData;
      applySessionData(sessionData);

      setState("has_results");
    } catch (err) {
      console.error("Error loading results:", err);
      setError(err instanceof Error ? err.message : "Failed to load results");
      setState((currentState) =>
        currentState === "loading" ? "no_scan" : currentState,
      );
    }
  }, [applySessionData, organizationId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Run a new scan
  const runScan = async () => {
    if (!scanUrl.trim() || !organizationId) return;

    let websiteUrl = scanUrl.trim();
    if (!websiteUrl.startsWith("http")) {
      websiteUrl = "https://" + websiteUrl;
    }

    setState("scanning");
    setError(null);
    setScanProgress("Crawling your school website...");

    try {
      // Phase 1
      const scrapeRes = await authFetch("/api/website-scan/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl,
          organizationId,
        }),
      });

      if (!scrapeRes.ok) {
        const err = await scrapeRes.json().catch(() => ({}));
        throw new Error(err.error || "Scrape failed");
      }

      const scrapeData = await scrapeRes.json();
      const sid = scrapeData.sessionId;
      setEvidenceRouting(scrapeData.evidenceRouting || null);

      setScanProgress(
        `Found ${scrapeData.pagesStored} pages, ${scrapeData.documentsStored} docs. Assessing compliance...`,
      );

      // Phase 2
      const assessRes = await authFetch("/api/website-scan/v2/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          sessionId: sid,
          schoolType: scrapeData.schoolType,
          schoolPhase: scrapeData.schoolPhase,
          isChurchSchool: scrapeData.isChurchSchool,
        }),
      });

      if (!assessRes.ok) {
        const err = await assessRes.json().catch(() => ({}));
        throw new Error(err.error || "Assessment failed");
      }

      // Reload results
      await loadResults();
      setState("has_results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setState("error");
    }
  };

  const runAssessment = async () => {
    if (!session?.id) return;

    setState("scanning");
    setError(null);
    setScanProgress("Assessing website compliance against requirements...");

    try {
      const assessRes = await authFetch("/api/website-scan/v2/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          sessionId: session.id,
          schoolType: session.schoolType,
          schoolPhase: session.schoolPhase,
          isChurchSchool: session.isChurchSchool,
        }),
      });

      if (!assessRes.ok) {
        const err = await assessRes.json().catch(() => ({}));
        throw new Error(err.error || "Assessment failed");
      }

      await loadResults();
      setState("has_results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assessment failed");
      setState("error");
    }
  };

  // ─── Loading ────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Scanning in progress ──────────────────────────────────

  if (state === "scanning") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground">{scanProgress}</p>
        <p className="text-xs text-muted-foreground/60">
          This typically takes 2-5 minutes
        </p>
      </div>
    );
  }

  // ─── No scan yet ────────────────────────────────────────────

  if (state === "no_scan" || state === "error") {
    return (
      <div className="space-y-6">
        <Card className="border border-border/50">
          <CardContent className="p-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">
              Check your website compliance
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Enter your school website URL and we&apos;ll scan it against 28+
              statutory requirements. Results feed directly into your Ofsted
              readiness evidence.
            </p>

            <div className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runScan()}
                  placeholder="www.yourschool.org.uk"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                />
              </div>
              <button
                onClick={runScan}
                disabled={!scanUrl.trim()}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-primary-foreground font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Scan
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm text-rose-600 flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* What this feeds into */}
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              How this supports Ofsted readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">
                  Quality of Education
                </strong>{" "}
                — Curriculum content, phonics, KS2/KS4/KS5 results evidence
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">
                  Behaviour & Attitudes
                </strong>{" "}
                — Behaviour policy presence and quality
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Safeguarding</strong> —
                Safeguarding policy, online safety, filtering &amp; monitoring
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">
                  Leadership & Management
                </strong>{" "}
                — Governance info, pupil premium strategy, financial
                transparency
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">
                  Personal Development
                </strong>{" "}
                — PE & sport premium, SEND information report
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Has results ────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Rescan bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {session?.websiteUrl && (
            <a
              href={session.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {session.websiteUrl.replace(/^https?:\/\//, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {session?.assessCompletedAt && (
            <span className="text-xs">
              &middot; Last scanned{" "}
              {new Date(session.assessCompletedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
        <button
          onClick={runScan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-scan
        </button>
      </div>

      {/* Results */}
      {evidenceRouting && evidenceRouting.totalRoutes > 0 && (
        <WebsiteEvidenceInventory evidenceRouting={evidenceRouting} />
      )}

      {summary ? (
        <WebsiteComplianceResults
          summary={summary}
          categorySummary={categorySummary}
          assessments={assessments}
          session={session || undefined}
          compact
        />
      ) : session?.status === "scraped" ? (
        <Card className="border border-amber-200 dark:border-amber-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-semibold mb-2">
              Website scraped but not assessed
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {session.pagesFound} pages and {session.documentsFound} documents
              found. Run the assessment to check compliance.
            </p>
            <button
              onClick={runAssessment}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-primary-foreground font-semibold text-sm transition-colors"
            >
              Run Assessment
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function WebsiteEvidenceInventory({
  evidenceRouting,
}: {
  evidenceRouting: EvidenceRoutingSummary;
}) {
  const categoryEntries = Object.entries(evidenceRouting.byCategory).sort(
    ([firstCategory], [secondCategory]) =>
      (OFSTED_AREA_LABELS[firstCategory] || firstCategory).localeCompare(
        OFSTED_AREA_LABELS[secondCategory] || secondCategory,
      ),
  );

  return (
    <Card className="border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Website evidence inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <EvidenceStat
            label="Mapped sources"
            value={evidenceRouting.totalRoutes}
          />
          <EvidenceStat
            label="Direct evidence"
            value={evidenceRouting.directEvidence}
          />
          <EvidenceStat
            label="Needs quality check"
            value={evidenceRouting.needsQualityAssessment}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryEntries.map(([category, count]) => (
            <span
              key={category}
              className="rounded-full border border-blue-200 bg-card/70 px-2.5 py-1 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
            >
              {OFSTED_AREA_LABELS[category] || category}: {count}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {evidenceRouting.topRoutes.slice(0, 8).map((route) => (
            <div
              key={`${route.ofstedCategoryId}-${route.sourceUrl}`}
              className="rounded-lg border border-border/60 bg-background/80 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={route.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                  >
                    {route.sourceTitle}
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {OFSTED_AREA_LABELS[route.ofstedCategoryId] ||
                      route.ofstedCategoryId}
                    {route.requirementName
                      ? ` · ${route.requirementName}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {route.sourceOwner}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={route.sourceUrl}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-blue-700"
                >
                  Open evidence
                  <ExternalLink className="h-3 w-3" />
                </a>
                {route.foundOnUrl && (
                  <a
                    href={route.foundOnUrl}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
                  >
                    Source page
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <a
                  href={route.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
                >
                  New tab
                  <ExternalLink className="h-3 w-3" />
                </a>
                <CopyLinkButton value={route.sourceUrl} />
              </div>
              {route.foundOnUrl && (
                <a
                  href={route.foundOnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Found on page
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Source files stay on the school or trust website. Schoolgle stores the
          route, confidence and evidence links so Phase 2 can assess quality.
        </p>
      </CardContent>
    </Card>
  );
}

function CopyLinkButton({ value }: { value: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const handleCopy = async () => {
    const copiedOk = await copyTextToClipboard(value);
    setCopyState(copiedOk ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 2400);
  };

  return (
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
          <AlertCircle className="h-3 w-3 text-amber-600" />
        </>
      ) : (
        <>
          Copy link
          <Copy className="h-3 w-3" />
        </>
      )}
    </button>
  );
}

function EvidenceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-card/70 p-3 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
