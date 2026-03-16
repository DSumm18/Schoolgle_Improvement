"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Loader2,
  RefreshCw,
  ExternalLink,
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

async function authFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
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

  // Load existing results
  const loadResults = useCallback(async () => {
    try {
      // Get latest assessment results
      const res = await authFetch(
        `/api/website-scan/v2/assess?organizationId=${organizationId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch results");

      const data = await res.json();
      const result = data.data;

      if (!result?.hasResults) {
        // Check if there's a session at all
        const sessionRes = await authFetch(
          `/api/website-scan/v2?organizationId=${organizationId}`,
        );
        const sessionData = await sessionRes.json();

        if (sessionData.data?.hasSession) {
          const s = sessionData.data.session;
          setSession({
            id: s.id,
            websiteUrl: s.websiteUrl,
            trustUrl: s.trustUrl,
            schoolType: s.schoolType,
            schoolPhase: s.schoolPhase,
            isChurchSchool: s.isChurchSchool,
            status: s.status,
            pagesFound: s.pagesScraped,
            documentsFound: s.documentsScraped,
          });
          setScanUrl(s.websiteUrl || "");

          // Session exists but no assessment — offer to run Phase 2
          if (s.status === "scraped") {
            setState("has_results");
            return;
          }
        }

        setState("no_scan");
        return;
      }

      // We have results
      setSummary(result.summary);
      setCategorySummary(result.categorySummary || []);
      setAssessments(result.assessments || []);

      // Also get session info
      const sessionRes = await authFetch(
        `/api/website-scan/v2?organizationId=${organizationId}`,
      );
      const sessionData = await sessionRes.json();
      if (sessionData.data?.hasSession) {
        const s = sessionData.data.session;
        setSession({
          id: s.id,
          websiteUrl: s.websiteUrl,
          trustUrl: s.trustUrl,
          schoolType: s.schoolType,
          schoolPhase: s.schoolPhase,
          isChurchSchool: s.isChurchSchool,
          status: s.status,
          pagesFound: s.pagesScraped,
          documentsFound: s.documentsScraped,
          assessCompletedAt: s.assessCompletedAt,
        });
        setScanUrl(s.websiteUrl || "");
      }

      setState("has_results");
    } catch (err) {
      console.error("Error loading results:", err);
      setState("no_scan");
    }
  }, [organizationId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Run a new scan
  const runScan = async () => {
    if (!scanUrl.trim()) return;

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
      const sid = scrapeData.data?.sessionId;

      setScanProgress(
        `Found ${scrapeData.data.pagesStored} pages, ${scrapeData.data.documentsStored} docs. Assessing compliance...`,
      );

      // Phase 2
      const assessRes = await authFetch("/api/website-scan/v2/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          schoolType: scrapeData.data.schoolType,
          schoolPhase: scrapeData.data.schoolPhase,
          isChurchSchool: scrapeData.data.isChurchSchool,
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
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
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
              onClick={runScan}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
            >
              Run Assessment
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
